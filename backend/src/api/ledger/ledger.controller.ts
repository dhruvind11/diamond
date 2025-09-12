import { Router, Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES, HTTP_STATUS_CODES, ROUTES, SUCCESS_MESSAGES } from '../../constants';
import { ControllerI } from '../../interfaces/common.interface';
import { authMiddleware } from '../../middleware/auth.middleware';
import { successResposne } from '../../middleware/apiResponse.middleware';
import LedgerModel from './ledger.model';
import MongoService from '../../services/mongo.service';
import mongoose from 'mongoose';
import InvoiceModel from '../Invoice/invoice.model';

class LedgerController implements ControllerI {
  public path = `/${ROUTES.LEDGER}`;
  public router = Router();
  //   private validation = new LedgerValidation();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/yearly-summary/:companyId`,
      authMiddleware,
      this.getYearlySummaryByRange
    );
    this.router.get(`${this.path}/:companyId`, authMiddleware, this.getCompanyLedger);
    this.router.get(`${this.path}/:companyId/party/:partyId`, authMiddleware, this.getPartyLedger);

    this.router.get(
      `${this.path}/dashboard-summary/:companyId`,
      authMiddleware,
      this.getDashboardSummary
    );
    this.router.get(
      `${this.path}/payment-summary/:companyId`,
      authMiddleware,
      this.getPaymentSummary
    );
  }

  private getCompanyLedger = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { companyId } = request.params;

      const result = await LedgerModel.aggregate([
        { $match: { companyId: new mongoose.Types.ObjectId(companyId) } },

        // --- Lookups ---
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoiceId',
            foreignField: '_id',
            as: 'invoiceDetails',
          },
        },
        { $unwind: '$invoiceDetails' },

        {
          $lookup: {
            from: 'users',
            localField: 'fromUser',
            foreignField: '_id',
            as: 'fromUserDetails',
          },
        },
        { $unwind: '$fromUserDetails' },

        {
          $lookup: {
            from: 'users',
            localField: 'toUser',
            foreignField: '_id',
            as: 'toUserDetails',
          },
        },
        { $unwind: '$toUserDetails' },

        // --- Normalize / classify each ledger row ---
        {
          $addFields: {
            invoiceType: '$invoiceDetails.invoiceType', // 'sell' | 'buy'

            // Decimal-safe amount
            _amount: {
              $cond: [
                { $ne: [{ $type: '$amount' }, 'decimal'] },
                { $toDecimal: '$amount' },
                '$amount',
              ],
            },

            partyId: {
              $cond: [
                { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
                '$toUserDetails._id',
                {
                  $cond: [
                    { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                    '$fromUserDetails._id',
                    '$toUserDetails._id',
                  ],
                },
              ],
            },
            partyName: {
              $cond: [
                { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
                '$toUserDetails.username',
                {
                  $cond: [
                    { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                    '$fromUserDetails.username',
                    '$toUserDetails.username',
                  ],
                },
              ],
            },

            // row-wise amounts for card math
            takenRow: {
              $cond: [
                {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                        { $eq: ['$type', 'credit'] },
                      ],
                    },
                    { $eq: ['$type', 'credit brokerage'] },
                  ],
                },
                '$_amount',
                0,
              ],
            },
            givenRow: {
              $cond: [
                {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$invoiceDetails.invoiceType', 'buy'] },
                        { $eq: ['$type', 'debit'] },
                      ],
                    },
                    { $eq: ['$type', 'debit brokerage'] },
                  ],
                },
                '$_amount',
                0,
              ],
            },

            isBrokerageRow: { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
          },
        },

        // --- Group #1: per invoice ---
        {
          $group: {
            _id: { invoiceId: '$invoiceId', partyId: '$partyId' },
            partyId: { $first: '$partyId' },
            partyName: { $first: '$partyName' },
            invoiceId: { $first: '$invoiceId' },
            invoiceNo: { $first: '$invoiceDetails.invoiceNo' },
            invoiceType: { $first: '$invoiceType' },
            createdAtMax: { $max: '$createdAt' },

            receivedAmount: { $sum: '$takenRow' },
            paidAmount: { $sum: '$givenRow' },

            rows: {
              $push: {
                createdAt: '$createdAt',
                pendingAmount: { $ifNull: ['$pendingAmount', 0] },
                type: '$type',
                amount: '$_amount',
                description: '$description',
              },
            },

            hasBrokerage: { $max: { $cond: ['$isBrokerageRow', 1, 0] } },
          },
        },

        // --- Compute invoice-level pending (latest only) ---
        {
          $addFields: {
            pendingAmount: {
              $let: {
                vars: {
                  last: {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: '$rows',
                          as: 'r',
                          cond: { $eq: ['$$r.createdAt', '$createdAtMax'] },
                        },
                      },
                      0,
                    ],
                  },
                },
                in: { $ifNull: ['$$last.pendingAmount', 0] },
              },
            },
            isSell: { $eq: ['$invoiceType', 'sell'] },
            isBuy: { $eq: ['$invoiceType', 'buy'] },
          },
        },

        // --- Group #2: per party ---
        {
          $group: {
            _id: '$partyId',
            partyName: { $first: '$partyName' },

            invoices: {
              $push: {
                invoiceId: '$invoiceId',
                invoiceNo: '$invoiceNo',
                invoiceType: '$invoiceType',
                receivedAmount: '$receivedAmount',
                paidAmount: '$paidAmount',
                pendingAmount: '$pendingAmount',
                hasBrokerage: { $gt: ['$hasBrokerage', 0] },
              },
            },

            totalTaken: { $sum: '$receivedAmount' },
            totalGiven: { $sum: '$paidAmount' },

            totalSellPending: {
              $sum: {
                $cond: [{ $and: ['$isSell', { $eq: ['$hasBrokerage', 0] }] }, '$pendingAmount', 0],
              },
            },
            totalBuyPending: {
              $sum: {
                $cond: [{ $or: ['$isBuy', { $gt: ['$hasBrokerage', 0] }] }, '$pendingAmount', 0],
              },
            },
          },
        },

        // party totals + net
        {
          $addFields: {
            netBalance: { $subtract: ['$totalTaken', '$totalGiven'] },
            totalAmount: { $subtract: ['$totalSellPending', '$totalBuyPending'] },
          },
        },
        { $sort: { partyName: 1 } },

        // --- Build overall summary (cards) and pass-through party ledger ---
        {
          $facet: {
            partyLedger: [{ $replaceRoot: { newRoot: '$$ROOT' } }],
            summary: [
              {
                $group: {
                  _id: null,
                  totalTaken: { $sum: '$totalTaken' },
                  totalGiven: { $sum: '$totalGiven' },
                  totalSellPending: { $sum: '$totalSellPending' },
                  totalBuyPending: { $sum: '$totalBuyPending' },
                },
              },
              {
                $project: {
                  _id: 0,
                  // Cards:
                  totalReceivable: { $round: ['$totalTaken', 2] },
                  totalPayable: { $round: ['$totalGiven', 2] },
                  netBalance: { $round: [{ $subtract: ['$totalTaken', '$totalGiven'] }, 2] },

                  // Optional extra totals you already show per party:
                  totalSellPending: { $round: ['$totalSellPending', 2] },
                  totalBuyPending: { $round: ['$totalBuyPending', 2] },
                  totalAmount: {
                    $round: [{ $subtract: ['$totalSellPending', '$totalBuyPending'] }, 2],
                  },
                },
              },
            ],
          },
        },

        { $project: { partyLedger: 1, summary: { $arrayElemAt: ['$summary', 0] } } },
      ]);

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'Ledger'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.CREATED,
          data: result[0],
        },
        request,
        response,
        next
      );
    } catch (error) {
      next(error);
    }
  };

  private getPartyLedger = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { companyId, partyId } = request.params;

      const ledger = await LedgerModel.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
          },
        },

        // Lookup invoice
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoiceId',
            foreignField: '_id',
            as: 'invoiceDetails',
          },
        },
        { $unwind: '$invoiceDetails' },

        // Lookup fromUser
        {
          $lookup: {
            from: 'users',
            localField: 'fromUser',
            foreignField: '_id',
            as: 'fromUserDetails',
          },
        },
        { $unwind: '$fromUserDetails' },

        {
          $lookup: {
            from: 'users',
            localField: 'toUser',
            foreignField: '_id',
            as: 'toUserDetails',
          },
        },
        { $unwind: '$toUserDetails' },

        // Compute party + received/paid
        {
          $addFields: {
            invoiceType: '$invoiceDetails.invoiceType',

            partyId: {
              $cond: [
                { $eq: ['$type', 'credit brokerage'] },
                '$toUserDetails._id',
                {
                  $cond: [
                    { $eq: ['$type', 'debit brokerage'] },
                    '$toUserDetails._id',
                    {
                      $cond: [
                        { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                        '$fromUserDetails._id',
                        '$toUserDetails._id',
                      ],
                    },
                  ],
                },
              ],
            },

            partyName: {
              $cond: [
                { $eq: ['$type', 'credit brokerage'] },
                '$toUserDetails.username',
                {
                  $cond: [
                    { $eq: ['$type', 'debit brokerage'] },
                    '$toUserDetails.username',
                    {
                      $cond: [
                        { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                        '$fromUserDetails.username',
                        '$toUserDetails.username',
                      ],
                    },
                  ],
                },
              ],
            },

            // received/paid logic per row
            receivedAmount: {
              $cond: [
                {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                        { $eq: ['$type', 'credit'] },
                      ],
                    },
                    { $eq: ['$type', 'credit brokerage'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
            paidAmount: {
              $cond: [
                {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$invoiceDetails.invoiceType', 'buy'] },
                        { $eq: ['$type', 'debit'] },
                      ],
                    },
                    { $eq: ['$type', 'debit brokerage'] },
                  ],
                },
                '$amount',
                0,
              ],
            },
            discountAmount: {
              $cond: [{ $eq: ['$type', 'discount'] }, '$amount', 0],
            },
          },
        },

        // Only this party
        {
          $match: {
            partyId: new mongoose.Types.ObjectId(partyId),
          },
        },
        { $sort: { createdAt: -1 } },

        // Group by invoice
        {
          $group: {
            _id: '$invoiceId',
            invoiceNo: { $first: '$invoiceDetails.invoiceNo' },
            invoiceType: { $first: '$invoiceType' },
            partyId: { $first: '$partyId' },
            partyName: { $first: '$partyName' },
            type: { $first: '$type' },
            entries: {
              $push: {
                amount: '$amount',
                description: '$description',
                type: '$type',
                createdAt: '$createdAt',
                pendingAmount: '$pendingAmount',
              },
            },
            latestCreatedAt: { $max: '$createdAt' },
            receivedAmount: { $sum: '$receivedAmount' },
            paidAmount: { $sum: '$paidAmount' },
            discountAmount: { $sum: '$discountAmount' },
          },
        },

        // Attach pending + compute totalAmount
        {
          $addFields: {
            pendingAmount: {
              $ifNull: [
                {
                  $let: {
                    vars: {
                      last: {
                        $arrayElemAt: [
                          {
                            $filter: {
                              input: '$entries',
                              as: 'e',
                              cond: { $eq: ['$$e.createdAt', '$latestCreatedAt'] },
                            },
                          },
                          0,
                        ],
                      },
                    },
                    in: '$$last.pendingAmount',
                  },
                },
                0,
              ],
            },
          },
        },

        // Group by party → collect invoices + compute overall totals
        {
          $group: {
            _id: '$partyId',
            partyName: { $first: '$partyName' },
            invoices: {
              $push: {
                invoiceId: '$_id',
                invoiceNo: '$invoiceNo',
                invoiceType: '$invoiceType',
                entries: '$entries',
                entryType: '$type',
                receivedAmount: '$receivedAmount',
                paidAmount: '$paidAmount',
                pendingAmount: '$pendingAmount',
                discountAmount: '$discountAmount',
                totalAmount: '$totalAmount',
              },
            },

            // overall totals
            totalSellPending: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$invoiceType', 'sell'] },
                      { $not: { $in: ['$type', ['credit brokerage', 'debit brokerage']] } },
                    ],
                  },
                  '$pendingAmount',
                  0,
                ],
              },
            },

            totalBuyPending: {
              $sum: {
                $cond: [
                  {
                    $or: [
                      { $eq: ['$invoiceType', 'buy'] },
                      { $eq: ['$type', 'credit brokerage'] },
                      { $eq: ['$type', 'debit brokerage'] },
                    ],
                  },
                  '$pendingAmount',
                  0,
                ],
              },
            },
          },
        },

        // net total
        {
          $addFields: {
            totalAmount: { $subtract: ['$totalSellPending', '$totalBuyPending'] },
          },
        },
      ]);

      return successResposne(
        {
          message: 'Party Ledger fetched successfully',
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: ledger[0] || null,
        },
        request,
        response,
        next
      );
    } catch (error) {
      next(error);
    }
  };

  private getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const compId = new mongoose.Types.ObjectId(companyId);
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const tz = 'Asia/Kolkata';
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      const monthStr = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
      }).format(new Date());

      const todayStr = fmt.format(new Date());
      console.log('monthStr', monthStr);
      const in30 = new Date();
      in30.setDate(in30.getDate() + 30);
      const endStr = fmt.format(in30);

      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);
      const sampleSellInvoice = await InvoiceModel.findOne(
        { companyId: compId, invoiceType: 'sell' },
        { sellerId: 1 }
      );
      const companyUserId = sampleSellInvoice?.sellerId;
      const existingPromise = await InvoiceModel.aggregate([
        // Company + still-open invoices
        { $match: { companyId: compId, isClosed: false } },

        // Due in current month (IST-accurate)
        {
          $match: {
            $expr: {
              $eq: [
                { $dateToString: { format: '%Y-%m', date: '$dueDate', timezone: tz } },
                monthStr, // e.g. "2025-09"
              ],
            },
          },
        },

        // Normalize numbers and pre-compute per-invoice quantity without unwind
        {
          $project: {
            invoiceType: 1,
            due: { $toDouble: { $ifNull: ['$dueAmount', 0] } },
            bro: { $toDouble: { $ifNull: ['$brokerageAmount', 0] } },
            qty: {
              $sum: {
                $map: {
                  input: { $ifNull: ['$items', []] },
                  as: 'i',
                  in: { $toDouble: { $ifNull: ['$$i.quantity', 0] } },
                },
              },
            },
          },
        },

        {
          $group: {
            _id: null,

            // RECEIVABLE (SELL)
            receivableAmt: {
              $sum: { $cond: [{ $eq: ['$invoiceType', 'sell'] }, '$due', 0] },
            },
            receivableQty: {
              $sum: { $cond: [{ $eq: ['$invoiceType', 'sell'] }, '$qty', 0] },
            },

            // PAYABLE (BUY due)
            payableBuyAmt: {
              $sum: { $cond: [{ $eq: ['$invoiceType', 'buy'] }, '$due', 0] },
            },
            payableBuyQty: {
              $sum: { $cond: [{ $eq: ['$invoiceType', 'buy'] }, '$qty', 0] },
            },

            // Brokerage payable from BOTH buy & sell
            brokerageAmt: { $sum: '$bro' },
          },
        },

        {
          $project: {
            _id: 0,

            // Preserve old fields
            totalReceivable: '$receivableAmt',
            totalPayable: { $add: ['$payableBuyAmt', '$brokerageAmt'] },
            netPosition: {
              $subtract: ['$receivableAmt', { $add: ['$payableBuyAmt', '$brokerageAmt'] }],
            },
            totalReceivableStock: '$receivableQty', // qty from SELL
            totalPayableStock: '$payableBuyQty', // qty from BUY (brokerage has no stock)
          },
        },
      ]);

      // const yearlySummaryPromise = LedgerModel.aggregate([
      //   { $match: { companyId: compId, createdAt: { $gte: startOfYear, $lt: endOfYear } } },

      //   {
      //     $addFields: {
      //       _amount: {
      //         $cond: [
      //           { $ne: [{ $type: '$amount' }, 'decimal'] },
      //           { $toDecimal: '$amount' },
      //           '$amount',
      //         ],
      //       },
      //     },
      //   },

      //   {
      //     $group: {
      //       _id: null,

      //       credits: {
      //         $sum: { $cond: [{ $eq: ['$type', 'credit'] }, { $ifNull: ['$_amount', 0] }, 0] },
      //       },
      //       debits: {
      //         $sum: { $cond: [{ $eq: ['$type', 'debit'] }, { $ifNull: ['$_amount', 0] }, 0] },
      //       },

      //       brokerageDebit: {
      //         $sum: {
      //           $cond: [{ $eq: ['$type', 'debit brokerage'] }, { $ifNull: ['$_amount', 0] }, 0],
      //         },
      //       },

      //       txnCount: { $sum: { $cond: [{ $in: ['$type', ['credit', 'debit']] }, 1, 0] } },
      //     },
      //   },

      //   {
      //     $project: {
      //       _id: 0,
      //       totalRevenue: { $toDouble: '$credits' },
      //       netProfit: { $toDouble: { $subtract: ['$credits', '$debits'] } },
      //       brokerCommissions: { $toDouble: '$brokerageDebit' },
      //       totalTransactions: '$txnCount',
      //     },
      //   },
      // ]);

      const totalRevenuePromise = LedgerModel.aggregate([
        {
          $match: {
            companyId: compId,
            type: 'credit',
          },
        },
        {
          $group: {
            _id: null,
            amount: { $sum: { $toDouble: { $ifNull: ['$amount', 0] } } },
          },
        },
        { $project: { _id: 0, value: '$amount' } },
      ]);

      const diamondsAndActivePromise = InvoiceModel.aggregate([
        { $match: { companyId: compId } },
        {
          $facet: {
            diamonds: [
              { $unwind: '$items' },
              {
                $group: {
                  _id: null,
                  buyQty: {
                    $sum: {
                      $cond: [
                        { $eq: ['$invoiceType', 'buy'] },
                        { $ifNull: ['$items.quantity', 0] },
                        0,
                      ],
                    },
                  },
                  sellQty: {
                    $sum: {
                      $cond: [
                        { $eq: ['$invoiceType', 'sell'] },
                        { $ifNull: ['$items.quantity', 0] },
                        0,
                      ],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  qty: { $subtract: ['$buyQty', '$sellQty'] },
                },
              },
            ],
            active: [
              {
                $group: {
                  _id: null,
                  partiesSell: {
                    $addToSet: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ['$invoiceType', 'sell'] },
                            { $ne: ['$buyerId', companyUserId] },
                          ],
                        },
                        '$buyerId',
                        '$$REMOVE',
                      ],
                    },
                  },
                  partiesBuy: {
                    $addToSet: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ['$invoiceType', 'buy'] },
                            { $ne: ['$sellerId', companyUserId] },
                          ],
                        },
                        '$sellerId',
                        '$$REMOVE',
                      ],
                    },
                  },
                  partiesBroker: {
                    $addToSet: {
                      $cond: [{ $ne: ['$brokerId', companyUserId] }, '$brokerId', '$$REMOVE'],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  partyIds: { $setUnion: ['$partiesSell', '$partiesBuy'] },
                  count: {
                    $size: { $setUnion: ['$partiesSell', '$partiesBuy', '$partiesBroker'] },
                  },
                },
              },
            ],
          },
        },
        {
          $project: {
            totalStock: { $ifNull: [{ $arrayElemAt: ['$diamonds.qty', 0] }, 0] },
            activeParties: { $ifNull: [{ $arrayElemAt: ['$active.count', 0] }, 0] },
          },
        },
      ]);

      const todayOverviewPromise = await InvoiceModel.aggregate([
        { $match: { companyId: compId } },
        {
          $facet: {
            // 1) Today Payable: buy invoices due today, still open
            todayReceivable: [
              {
                $match: {
                  companyId: compId,
                  invoiceType: 'sell',
                  isClosed: false,
                  $expr: {
                    $eq: [
                      { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                      todayStr,
                    ],
                  },
                },
              },
              { $project: { dueLeft: '$dueAmount' } },
              {
                $group: {
                  _id: null,
                  amount: { $sum: { $toDouble: { $ifNull: ['$dueLeft', 0] } } },
                },
              },
              { $project: { _id: 0, amount: 1 } },
            ],
            todayPayable: [
              {
                $match: {
                  companyId: compId,
                  isClosed: false,
                  $expr: {
                    $eq: [
                      { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                      todayStr,
                    ],
                  },
                },
              },
              {
                $project: {
                  payable: {
                    $cond: [
                      { $eq: ['$invoiceType', 'buy'] },
                      {
                        $add: [
                          { $toDouble: { $ifNull: ['$dueAmount', 0] } },
                          {
                            $cond: [
                              { $gt: ['$brokerageAmount', 0] },
                              { $toDouble: '$brokerageAmount' },
                              0,
                            ],
                          },
                        ],
                      },
                      {
                        $cond: [
                          { $gt: ['$brokerageAmount', 0] },
                          { $toDouble: '$brokerageAmount' },
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  amount: { $sum: '$payable' },
                },
              },
              { $project: { _id: 0, amount: 1 } },
            ],

            stockSoldToday: [
              {
                $match: {
                  invoiceType: 'sell',
                  $expr: {
                    $eq: [
                      { $dateToString: { format: '%Y-%m-%d', date: '$createdDate', timezone: tz } },
                      todayStr,
                    ],
                  },
                },
              },
              { $unwind: '$items' },
              {
                $group: {
                  _id: '$_id',
                  invoiceTotal: { $first: { $toDouble: { $ifNull: ['$totalAmount', 0] } } },
                  qty: { $sum: { $ifNull: ['$items.quantity', 0] } },
                },
              },
              {
                $group: {
                  _id: null,
                  amount: { $sum: '$invoiceTotal' },
                  quantity: { $sum: '$qty' },
                },
              },
              { $project: { _id: 0, amount: 1, quantity: 1 } },
            ],

            // // 4) Stock Bought Today: buy invoices created today
            stockBoughtToday: [
              {
                $match: {
                  invoiceType: 'buy',
                  // createdDate: { $gte: start, $lte: end },
                  $expr: {
                    $eq: [
                      { $dateToString: { format: '%Y-%m-%d', date: '$createdDate', timezone: tz } },
                      todayStr,
                    ],
                  },
                },
              },
              { $unwind: '$items' },
              {
                $group: {
                  _id: '$_id',
                  invoiceTotal: { $first: { $toDouble: { $ifNull: ['$totalAmount', 0] } } },
                  qty: { $sum: { $ifNull: ['$items.quantity', 0] } },
                },
              },
              {
                $group: {
                  _id: null,
                  amount: { $sum: '$invoiceTotal' },
                  quantity: { $sum: '$qty' },
                },
              },
              { $project: { _id: 0, amount: 1, quantity: 1 } },
            ],
          },
        },
        {
          $project: {
            todayPayable: { $ifNull: [{ $arrayElemAt: ['$todayPayable.amount', 0] }, 0] },
            todayReceivable: { $ifNull: [{ $arrayElemAt: ['$todayReceivable.amount', 0] }, 0] },
            stockSoldToday: {
              $ifNull: [{ $arrayElemAt: ['$stockSoldToday', 0] }, { amount: 0, quantity: 0 }],
            },
            stockBoughtToday: {
              $ifNull: [{ $arrayElemAt: ['$stockBoughtToday', 0] }, { amount: 0, quantity: 0 }],
            },
          },
        },
      ]);

      const upComingDuePromise = await InvoiceModel.aggregate([
        { $match: { companyId: compId, isClosed: false } },
        {
          $facet: {
            paymentsDue30: [
              {
                $match: {
                  companyId: compId,
                  isClosed: false,
                  $expr: {
                    $and: [
                      {
                        $gte: [
                          { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                          todayStr,
                        ],
                      },
                      {
                        $lte: [
                          { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                          endStr,
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $project: {
                  payable: {
                    $cond: [
                      { $eq: ['$invoiceType', 'buy'] },
                      {
                        $add: [
                          { $toDouble: { $ifNull: ['$dueAmount', 0] } },
                          {
                            $cond: [
                              { $gt: ['$brokerageAmount', 0] },
                              { $toDouble: '$brokerageAmount' },
                              0,
                            ],
                          },
                        ],
                      },
                      {
                        $cond: [
                          { $gt: ['$brokerageAmount', 0] },
                          { $toDouble: '$brokerageAmount' },
                          0,
                        ],
                      },
                    ],
                  },
                },
              },
              { $group: { _id: null, amount: { $sum: '$payable' } } },
              { $project: { _id: 0, amount: 1 } },
            ],

            expectedReceivables30: [
              {
                $match: {
                  companyId: compId,
                  isClosed: false,
                  invoiceType: 'sell',
                  $expr: {
                    $and: [
                      {
                        $gte: [
                          { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                          todayStr,
                        ],
                      },
                      {
                        $lte: [
                          { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                          endStr,
                        ],
                      },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  amount: { $sum: { $toDouble: { $ifNull: ['$dueAmount', 0] } } },
                },
              },
              { $project: { _id: 0, amount: 1 } },
            ],
          },
        },

        {
          $project: {
            paymentsDue30: { $ifNull: [{ $arrayElemAt: ['$paymentsDue30.amount', 0] }, 0] },
            expectedReceivables30: {
              $ifNull: [{ $arrayElemAt: ['$expectedReceivables30.amount', 0] }, 0],
            },
          },
        },
      ]);

      // const invoicePayableTodayPromise = await InvoiceModel.aggregate([
      //   { $match: { companyId: compId, isClosed: false } },
      //   {
      //     $match: {
      //       $expr: {
      //         $eq: [
      //           { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
      //           todayStr,
      //         ],
      //       },
      //     },
      //   },

      //   // compute base numbers once
      //   {
      //     $project: {
      //       invoiceType: 1,
      //       sellerId: 1,
      //       brokerId: 1,
      //       // quantity on the invoice (no unwind)
      //       qty: {
      //         $sum: { $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } } },
      //       },
      //       dueDouble: { $toDouble: { $ifNull: ['$dueAmount', 0] } },
      //       brokerageDouble: { $toDouble: { $ifNull: ['$brokerageAmount', 0] } },
      //     },
      //   },

      //   // emit "entries" array:
      //   // - BUY: seller line (dueAmount) + broker line (brokerageAmount if > 0)
      //   // - SELL: broker line (brokerageAmount if > 0)
      //   {
      //     $set: {
      //       entries: {
      //         $concatArrays: [
      //           // BUY -> seller entry
      //           {
      //             $cond: [
      //               { $eq: ['$invoiceType', 'buy'] },
      //               [
      //                 {
      //                   counterpartyId: '$sellerId',
      //                   amount: '$dueDouble',
      //                   stock: '$qty',
      //                   isBroker: false,
      //                 },
      //               ],
      //               [],
      //             ],
      //           },
      //           // Any invoice with brokerage > 0 -> broker entry
      //           {
      //             $cond: [
      //               { $gt: ['$brokerageDouble', 0] },
      //               [
      //                 {
      //                   counterpartyId: '$brokerId',
      //                   amount: '$brokerageDouble',
      //                   stock: 0,
      //                   isBroker: true,
      //                 },
      //               ],
      //               [],
      //             ],
      //           },
      //         ],
      //       },
      //     },
      //   },
      //   { $unwind: '$entries' },
      //   { $match: { 'entries.amount': { $gt: 0 } } },

      //   // aggregate per party
      //   {
      //     $group: {
      //       _id: '$entries.counterpartyId',
      //       amount: { $sum: '$entries.amount' },
      //       stock: { $sum: '$entries.stock' }, // brokers contribute 0 stock
      //       isBrokerFlag: { $max: { $cond: ['$entries.isBroker', 1, 0] } },
      //     },
      //   },

      //   // attach party name
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: '_id',
      //       foreignField: '_id',
      //       as: 'party',
      //     },
      //   },
      //   { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },

      //   // final list rows
      //   {
      //     $project: {
      //       _id: 0,
      //       partyId: '$_id',
      //       partyName: '$party.username',
      //       amount: { $round: ['$amount', 2] },
      //       stock: { $ifNull: ['$stock', 0] },
      //       type: { $cond: [{ $gt: ['$isBrokerFlag', 0] }, 'broker', 'party'] },
      //     },
      //   },
      //   { $sort: { amount: -1 } },

      //   // wrap into { totalPayable, count, items[] }
      //   {
      //     $group: {
      //       _id: null,
      //       totalPayable: { $sum: '$amount' },
      //       count: { $sum: 1 },
      //       items: { $push: '$$ROOT' },
      //     },
      //   },
      //   { $project: { _id: 0, totalPayable: 1, count: 1, items: 1 } },
      // ]);

      // const invoiceReceiableTodayPromise = await InvoiceModel.aggregate([
      //   { $match: { companyId: compId, isClosed: false, invoiceType: 'sell' } },
      //   {
      //     $match: {
      //       $expr: {
      //         $eq: [
      //           { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
      //           todayStr,
      //         ],
      //       },
      //     },
      //   },
      //   // compute amount & qty per invoice (no unwind)
      //   {
      //     $project: {
      //       buyerId: 1,
      //       qty: {
      //         $sum: {
      //           $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } },
      //         },
      //       },
      //       amount: { $toDouble: { $ifNull: ['$dueAmount', 0] } }, // receivable excludes brokerage
      //     },
      //   },
      //   // aggregate per buyer
      //   {
      //     $group: {
      //       _id: '$buyerId',
      //       amount: { $sum: '$amount' },
      //       stock: { $sum: '$qty' },
      //     },
      //   },
      //   // attach buyer name
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: '_id',
      //       foreignField: '_id',
      //       as: 'party',
      //     },
      //   },
      //   { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },
      //   // final item rows
      //   {
      //     $project: {
      //       _id: 0,
      //       partyId: '$_id',
      //       partyName: '$party.username',
      //       amount: { $round: ['$amount', 2] },
      //       stock: { $ifNull: ['$stock', 0] },
      //     },
      //   },
      //   { $sort: { amount: -1 } },
      //   // wrap into { totalReceivable, count, items[] }
      //   {
      //     $group: {
      //       _id: null,
      //       totalReceivable: { $sum: '$amount' },
      //       count: { $sum: 1 },
      //       items: { $push: '$$ROOT' },
      //     },
      //   },
      //   { $project: { _id: 0, totalReceivable: 1, count: 1, items: 1 } },
      // ]);

      // const invoicePaidTodayPromise = await LedgerModel.aggregate([
      //   { $match: { companyId: compId, type: { $in: ['debit', 'debit brokerage'] } } },
      //   {
      //     $match: {
      //       $expr: {
      //         $eq: [
      //           {
      //             $dateToString: {
      //               format: '%Y-%m-%d',
      //               timezone: tz,
      //               date: { $ifNull: ['$createdDate', '$createdAt'] },
      //             },
      //           },
      //           todayStr,
      //         ],
      //       },
      //     },
      //   },
      //   // skip zero/empty ledger rows
      //   { $match: { $expr: { $gt: [{ $toDouble: { $ifNull: ['$amount', 0] } }, 0] } } },

      //   // lookups for party rule
      //   {
      //     $lookup: {
      //       from: 'invoices',
      //       localField: 'invoiceId',
      //       foreignField: '_id',
      //       as: 'invoiceDetails',
      //     },
      //   },
      //   { $unwind: '$invoiceDetails' },
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: 'fromUser',
      //       foreignField: '_id',
      //       as: 'fromUserDetails',
      //     },
      //   },
      //   { $unwind: '$fromUserDetails' },
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: 'toUser',
      //       foreignField: '_id',
      //       as: 'toUserDetails',
      //     },
      //   },
      //   { $unwind: '$toUserDetails' },

      //   {
      //     $addFields: {
      //       _amount: {
      //         $cond: [
      //           { $ne: [{ $type: '$amount' }, 'decimal'] },
      //           { $toDecimal: '$amount' },
      //           '$amount',
      //         ],
      //       },
      //       partyId: {
      //         $cond: [
      //           { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
      //           '$toUserDetails._id',
      //           {
      //             $cond: [
      //               { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
      //               '$fromUserDetails._id',
      //               '$toUserDetails._id',
      //             ],
      //           },
      //         ],
      //       },
      //       partyName: {
      //         $cond: [
      //           { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
      //           '$toUserDetails.username',
      //           {
      //             $cond: [
      //               { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
      //               '$fromUserDetails.username',
      //               '$toUserDetails.username',
      //             ],
      //           },
      //         ],
      //       },
      //     },
      //   },

      //   {
      //     $group: {
      //       _id: '$partyId',
      //       amount: { $sum: { $toDouble: { $ifNull: ['$_amount', 0] } } },
      //       partyName: { $first: '$partyName' },
      //     },
      //   },
      //   // skip parties whose total is 0 after grouping
      //   { $match: { amount: { $gt: 0 } } },

      //   { $project: { _id: 0, partyId: '$_id', partyName: 1, amount: { $round: ['$amount', 2] } } },
      //   { $sort: { amount: -1 } },

      //   {
      //     $group: {
      //       _id: null,
      //       totalAmount: { $sum: '$amount' },
      //       count: { $sum: 1 },
      //       items: { $push: '$$ROOT' },
      //     },
      //   },
      //   { $project: { _id: 0, totalAmount: 1, count: 1, items: 1 } },
      // ]);

      // const invoiceReceivedTodayPromise = await LedgerModel.aggregate([
      //   { $match: { companyId: compId, type: { $in: ['credit', 'credit brokerage'] } } },
      //   {
      //     $match: {
      //       $expr: {
      //         $eq: [
      //           {
      //             $dateToString: {
      //               format: '%Y-%m-%d',
      //               timezone: tz,
      //               date: { $ifNull: ['$createdDate', '$createdAt'] },
      //             },
      //           },
      //           todayStr,
      //         ],
      //       },
      //     },
      //   },
      //   // skip zero/empty ledger rows
      //   { $match: { $expr: { $gt: [{ $toDouble: { $ifNull: ['$amount', 0] } }, 0] } } },

      //   // lookups for party rule
      //   {
      //     $lookup: {
      //       from: 'invoices',
      //       localField: 'invoiceId',
      //       foreignField: '_id',
      //       as: 'invoiceDetails',
      //     },
      //   },
      //   { $unwind: '$invoiceDetails' },
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: 'fromUser',
      //       foreignField: '_id',
      //       as: 'fromUserDetails',
      //     },
      //   },
      //   { $unwind: '$fromUserDetails' },
      //   {
      //     $lookup: {
      //       from: 'users',
      //       localField: 'toUser',
      //       foreignField: '_id',
      //       as: 'toUserDetails',
      //     },
      //   },
      //   { $unwind: '$toUserDetails' },

      //   {
      //     $addFields: {
      //       _amount: {
      //         $cond: [
      //           { $ne: [{ $type: '$amount' }, 'decimal'] },
      //           { $toDecimal: '$amount' },
      //           '$amount',
      //         ],
      //       },
      //       partyId: {
      //         $cond: [
      //           { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
      //           '$toUserDetails._id',
      //           {
      //             $cond: [
      //               { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
      //               '$fromUserDetails._id',
      //               '$toUserDetails._id',
      //             ],
      //           },
      //         ],
      //       },
      //       partyName: {
      //         $cond: [
      //           { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
      //           '$toUserDetails.username',
      //           {
      //             $cond: [
      //               { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
      //               '$fromUserDetails.username',
      //               '$toUserDetails.username',
      //             ],
      //           },
      //         ],
      //       },
      //     },
      //   },

      //   {
      //     $group: {
      //       _id: '$partyId',
      //       amount: { $sum: { $toDouble: { $ifNull: ['$_amount', 0] } } },
      //       partyName: { $first: '$partyName' },
      //     },
      //   },
      //   // skip parties with total 0
      //   { $match: { amount: { $gt: 0 } } },

      //   { $project: { _id: 0, partyId: '$_id', partyName: 1, amount: { $round: ['$amount', 2] } } },
      //   { $sort: { amount: -1 } },

      //   {
      //     $group: {
      //       _id: null,
      //       totalAmount: { $sum: '$amount' },
      //       count: { $sum: 1 },
      //       items: { $push: '$$ROOT' },
      //     },
      //   },
      //   { $project: { _id: 0, totalAmount: 1, count: 1, items: 1 } },
      // ]);

      const [
        existingAgg,
        // yearlySummaryAgg,
        totalRevenueAgg,
        diamondsActiveAgg,
        todayOverviewAgg,
        upComingOverviewAgg,
        // invoiceReceiableTodayAgg,
        // invoiceDueTodayAgg,
        // invoicePaidTodayAgg,
        // invoiceReceivedTodayAgg,
      ] = await Promise.all([
        existingPromise,
        // yearlySummaryPromise,
        totalRevenuePromise,
        diamondsAndActivePromise,
        todayOverviewPromise,
        upComingDuePromise,
        // invoiceReceiableTodayPromise,
        // invoicePayableTodayPromise,
        // invoicePaidTodayPromise,
        // invoiceReceivedTodayPromise,
      ]);

      const monthlySummary = existingAgg?.[0] ?? [];

      // const yearlySummarys = yearlySummaryAgg?.[0] ?? {
      //   totalRevenue: 0,
      //   totalTransactions: 0,
      //   brokerCommissions: 0,
      //   netProfit: 0,
      // };
      const topRevenue = totalRevenueAgg?.[0]?.value ?? 0;
      const diamondsActive = diamondsActiveAgg?.[0] ?? { totalStock: 0, activeParties: 0 };
      const todayOverview = todayOverviewAgg?.[0] ?? {
        todayPayable: 0,
        todayReceivable: 0,
        stockSoldToday: { amount: 0, quantity: 0 },
        stockBoughtToday: { amount: 0, quantity: 0 },
      };
      const upComingOverview = upComingOverviewAgg?.[0] ?? {
        paymentsDue30: 0,
        expectedReceivables30: 0,
      };
      // const payableList = invoiceDueTodayAgg?.[0] ?? [];
      // const receivableList = invoiceReceiableTodayAgg?.[0] ?? [];
      // const todaysPaidAmount = invoicePaidTodayAgg ?? { totalAmount: 0, count: 0, items: [] };
      // const todaysReceivedAmount = invoiceReceivedTodayAgg ?? {
      //   totalAmount: 0,
      //   count: 0,
      //   items: [],
      // };
      const revenueSummary = {
        totalRevenue: Number(topRevenue),
        totalStocks: diamondsActive.totalStock,
        activeParties: diamondsActive.activeParties,
        activePartyIds: diamondsActive.activePartyIds,
      };

      return successResposne(
        {
          message: 'Dashboard summary fetched successfully',
          status: 'SUCCESS',
          statusCode: 200,
          data: {
            monthlySummary,
            // yearlySummarys,
            revenueSummary,
            todayOverview,
            upComingOverview,
            // payableList,
            // receivableList,
            // todaysPaidAmount,
            // todaysReceivedAmount,
          },
        },
        req,
        res,
        next
      );
    } catch (err) {
      next(err);
    }
  };

  private getPaymentSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      if (!companyId || !mongoose.isValidObjectId(companyId)) {
        return res.status(400).json({ message: 'Invalid companyId' });
      }
      const compId = new mongoose.Types.ObjectId(companyId);
      const tz = (req.query.tz as string) || 'Asia/Kolkata';
      const fmt = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const todayStr = fmt.format(new Date());
      const endDate = new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000);
      const endStr = fmt.format(endDate);
      const start30Str = fmt.format(new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000));
      const cutoffDate = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
      const cutoffStr = fmt.format(cutoffDate);
      console.log('start30Str', start30Str);
      console.log('cutoffStr', cutoffStr);
      console.log('endDate', endDate);
      const invoicePayableTodayPromise = await InvoiceModel.aggregate([
        { $match: { companyId: compId, isClosed: false } },
        {
          $match: {
            $expr: {
              $eq: [
                { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                todayStr,
              ],
            },
          },
        },

        // compute base numbers once
        {
          $project: {
            invoiceType: 1,
            sellerId: 1,
            brokerId: 1,
            // quantity on the invoice (no unwind)
            qty: {
              $sum: { $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } } },
            },
            dueDouble: { $toDouble: { $ifNull: ['$dueAmount', 0] } },
            brokerageDouble: { $toDouble: { $ifNull: ['$brokerageAmount', 0] } },
          },
        },

        // emit "entries" array:
        // - BUY: seller line (dueAmount) + broker line (brokerageAmount if > 0)
        // - SELL: broker line (brokerageAmount if > 0)
        {
          $set: {
            entries: {
              $concatArrays: [
                // BUY -> seller entry
                {
                  $cond: [
                    { $eq: ['$invoiceType', 'buy'] },
                    [
                      {
                        counterpartyId: '$sellerId',
                        amount: '$dueDouble',
                        stock: '$qty',
                        isBroker: false,
                      },
                    ],
                    [],
                  ],
                },
                // Any invoice with brokerage > 0 -> broker entry
                {
                  $cond: [
                    { $gt: ['$brokerageDouble', 0] },
                    [
                      {
                        counterpartyId: '$brokerId',
                        amount: '$brokerageDouble',
                        stock: 0,
                        isBroker: true,
                      },
                    ],
                    [],
                  ],
                },
              ],
            },
          },
        },
        { $unwind: '$entries' },
        { $match: { 'entries.amount': { $gt: 0 } } },

        // aggregate per party
        {
          $group: {
            _id: '$entries.counterpartyId',
            amount: { $sum: '$entries.amount' },
            stock: { $sum: '$entries.stock' }, // brokers contribute 0 stock
            isBrokerFlag: { $max: { $cond: ['$entries.isBroker', 1, 0] } },
          },
        },

        // attach party name
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'party',
          },
        },
        { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },

        // final list rows
        {
          $project: {
            _id: 0,
            partyId: '$_id',
            partyName: '$party.username',
            amount: { $round: ['$amount', 2] },
            stock: { $ifNull: ['$stock', 0] },
            type: { $cond: [{ $gt: ['$isBrokerFlag', 0] }, 'broker', 'party'] },
          },
        },
        { $sort: { amount: -1 } },

        // wrap into { totalPayable, count, items[] }
        {
          $group: {
            _id: null,
            totalPayable: { $sum: '$amount' },
            count: { $sum: 1 },
            items: { $push: '$$ROOT' },
          },
        },
        { $project: { _id: 0, totalPayable: 1, count: 1, items: 1 } },
      ]);

      const invoiceReceiableTodayPromise = await InvoiceModel.aggregate([
        { $match: { companyId: compId, isClosed: false, invoiceType: 'sell' } },
        {
          $match: {
            $expr: {
              $eq: [
                { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                todayStr,
              ],
            },
          },
        },
        // compute amount & qty per invoice (no unwind)
        {
          $project: {
            buyerId: 1,
            qty: {
              $sum: {
                $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } },
              },
            },
            amount: { $toDouble: { $ifNull: ['$dueAmount', 0] } }, // receivable excludes brokerage
          },
        },
        // aggregate per buyer
        {
          $group: {
            _id: '$buyerId',
            amount: { $sum: '$amount' },
            stock: { $sum: '$qty' },
          },
        },
        // attach buyer name
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'party',
          },
        },
        { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },
        // final item rows
        {
          $project: {
            _id: 0,
            partyId: '$_id',
            partyName: '$party.username',
            amount: { $round: ['$amount', 2] },
            stock: { $ifNull: ['$stock', 0] },
          },
        },
        { $sort: { amount: -1 } },
        // wrap into { totalReceivable, count, items[] }
        {
          $group: {
            _id: null,
            totalReceivable: { $sum: '$amount' },
            count: { $sum: 1 },
            items: { $push: '$$ROOT' },
          },
        },
        { $project: { _id: 0, totalReceivable: 1, count: 1, items: 1 } },
      ]);

      const invoicePaidTodayPromise = await LedgerModel.aggregate([
        // company + "paid today" (IST) + only outgoing types
        { $match: { companyId: compId, type: { $in: ['debit', 'debit brokerage'] } } },
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    timezone: tz,
                    date: { $ifNull: ['$createdDate', '$createdAt'] },
                  },
                },
                todayStr,
              ],
            },
          },
        },
        { $match: { $expr: { $gt: [{ $toDouble: { $ifNull: ['$amount', 0] } }, 0] } } },

        {
          $lookup: {
            from: 'invoices',
            localField: 'invoiceId',
            foreignField: '_id',
            as: 'invoiceDetails',
          },
        },
        { $unwind: '$invoiceDetails' },
        {
          $lookup: {
            from: 'users',
            localField: 'fromUser',
            foreignField: '_id',
            as: 'fromUserDetails',
          },
        },
        { $unwind: '$fromUserDetails' },
        {
          $lookup: {
            from: 'users',
            localField: 'toUser',
            foreignField: '_id',
            as: 'toUserDetails',
          },
        },
        { $unwind: '$toUserDetails' },

        {
          $addFields: {
            _amount: {
              $cond: [
                { $ne: [{ $type: '$amount' }, 'decimal'] },
                { $toDecimal: '$amount' },
                '$amount',
              ],
            },

            partyId: {
              $cond: [
                { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
                '$toUserDetails._id',
                {
                  $cond: [
                    { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                    '$fromUserDetails._id',
                    '$toUserDetails._id',
                  ],
                },
              ],
            },
            partyName: {
              $cond: [
                { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
                '$toUserDetails.username',
                {
                  $cond: [
                    { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                    '$fromUserDetails.username',
                    '$toUserDetails.username',
                  ],
                },
              ],
            },

            partyType: {
              $cond: [
                { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
                'broker',
                {
                  $cond: [{ $eq: ['$invoiceDetails.invoiceType', 'sell'] }, 'buyer', 'seller'],
                },
              ],
            },
          },
        },

        {
          $group: {
            _id: '$partyId',
            amount: { $sum: { $toDouble: { $ifNull: ['$_amount', 0] } } },
            partyName: { $first: '$partyName' },
            partyType: { $first: '$partyType' },
            invoiceIds: { $addToSet: '$invoiceId' },
          },
        },
        { $match: { amount: { $gt: 0 } } },

        {
          $lookup: {
            from: 'invoices',
            let: { invoiceIds: '$invoiceIds' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$invoiceIds'] } } },
              {
                $project: {
                  qty: {
                    $sum: {
                      $map: {
                        input: '$items',
                        as: 'i',
                        in: { $ifNull: ['$$i.quantity', 0] },
                      },
                    },
                  },
                },
              },
            ],
            as: 'inv',
          },
        },
        { $addFields: { quantity: { $sum: '$inv.qty' } } },

        // final per-party row; hide stock for brokers
        {
          $project: {
            _id: 0,
            partyId: '$_id',
            partyName: 1,
            partyType: 1,
            amount: { $round: ['$amount', 2] },
            stock: {
              $cond: [{ $eq: ['$partyType', 'broker'] }, 0, { $ifNull: ['$quantity', 0] }],
            },
          },
        },
        { $sort: { amount: -1 } },

        // summary + items
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalStock: { $sum: '$stock' },
            count: { $sum: 1 },
            items: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            totalAmount: { $round: ['$totalAmount', 2] },
            totalStock: 1,
            count: 1,
            items: 1,
          },
        },
      ]);

      const invoiceReceivedTodayPromise = await LedgerModel.aggregate([
        // company + incoming (credit) today in IST
        { $match: { companyId: compId, type: { $in: ['credit', 'credit brokerage'] } } },
        {
          $match: {
            $expr: {
              $eq: [
                {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    timezone: tz,
                    date: { $ifNull: ['$createdDate', '$createdAt'] },
                  },
                },
                todayStr,
              ],
            },
          },
        },
        // skip zero rows
        { $match: { $expr: { $gt: [{ $toDouble: { $ifNull: ['$amount', 0] } }, 0] } } },

        // lookups
        {
          $lookup: {
            from: 'invoices',
            localField: 'invoiceId',
            foreignField: '_id',
            as: 'invoiceDetails',
          },
        },
        { $unwind: '$invoiceDetails' },
        {
          $lookup: {
            from: 'users',
            localField: 'fromUser',
            foreignField: '_id',
            as: 'fromUserDetails',
          },
        },
        { $unwind: '$fromUserDetails' },
        {
          $lookup: {
            from: 'users',
            localField: 'toUser',
            foreignField: '_id',
            as: 'toUserDetails',
          },
        },
        { $unwind: '$toUserDetails' },

        {
          $addFields: {
            _amount: {
              $cond: [
                { $ne: [{ $type: '$amount' }, 'decimal'] },
                { $toDecimal: '$amount' },
                '$amount',
              ],
            },

            // brokerage -> toUser (broker); else: for 'sell' invoice, counterparty is buyer (fromUser),
            // for 'buy' invoice, counterparty is seller (toUser)
            partyId: {
              $cond: [
                { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
                '$toUserDetails._id',
                {
                  $cond: [
                    { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                    '$fromUserDetails._id',
                    '$toUserDetails._id',
                  ],
                },
              ],
            },
            partyName: {
              $cond: [
                { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
                '$toUserDetails.username',
                {
                  $cond: [
                    { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                    '$fromUserDetails.username',
                    '$toUserDetails.username',
                  ],
                },
              ],
            },
            partyType: {
              $cond: [
                { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
                'broker',
                {
                  $cond: [
                    { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
                    'buyer', // incoming from buyer on sell invoice
                    'seller', // incoming from seller on buy invoice (refund/adjustment)
                  ],
                },
              ],
            },
          },
        },

        // group by party to sum amount and collect unique invoices for stock calc
        {
          $group: {
            _id: '$partyId',
            amount: { $sum: { $toDouble: { $ifNull: ['$_amount', 0] } } },
            partyName: { $first: '$partyName' },
            partyType: { $first: '$partyType' },
            invoiceIds: { $addToSet: '$invoiceId' },
          },
        },
        { $match: { amount: { $gt: 0 } } },

        // compute quantity across unique invoices (no double count)
        {
          $lookup: {
            from: 'invoices',
            let: { invoiceIds: '$invoiceIds' },
            pipeline: [
              { $match: { $expr: { $in: ['$_id', '$$invoiceIds'] } } },
              {
                $project: {
                  qty: {
                    $sum: {
                      $map: {
                        input: '$items',
                        as: 'i',
                        in: { $ifNull: ['$$i.quantity', 0] },
                      },
                    },
                  },
                },
              },
            ],
            as: 'inv',
          },
        },
        { $addFields: { quantity: { $sum: '$inv.qty' } } },

        // final per-party row; brokers get stock = 0
        {
          $project: {
            _id: 0,
            partyId: '$_id',
            partyName: 1,
            partyType: 1,
            amount: { $round: ['$amount', 2] },
            stock: {
              $cond: [{ $eq: ['$partyType', 'broker'] }, 0, { $ifNull: ['$quantity', 0] }],
            },
          },
        },
        { $sort: { amount: -1 } },

        // summary + items
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalStock: { $sum: '$stock' },
            count: { $sum: 1 },
            items: { $push: '$$ROOT' },
          },
        },
        {
          $project: {
            _id: 0,
            totalAmount: { $round: ['$totalAmount', 2] },
            totalStock: 1,
            count: 1,
            items: 1,
          },
        },
      ]);

      const upcomingPaymentPromise = await InvoiceModel.aggregate([
        { $match: { companyId: compId, isClosed: false } },

        // Due date between today and (today + N days) in IST
        {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                    todayStr,
                  ],
                },
                {
                  $lte: [
                    { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                    endStr,
                  ],
                },
              ],
            },
          },
        },

        {
          $facet: {
            paymentsDueItems: [
              // normalize + stock
              {
                $project: {
                  dueDate: 1,
                  invoiceNo: 1,
                  buyerId: 1,
                  sellerId: 1,
                  brokerId: 1,
                  invoiceType: 1,
                  items: 1,

                  due: { $toDouble: { $ifNull: ['$dueAmount', 0] } },
                  bro: { $toDouble: { $ifNull: ['$brokerageAmount', 0] } },
                  stock: {
                    $sum: {
                      $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } },
                    },
                  },
                  firstItemName: { $ifNull: [{ $arrayElemAt: ['$items.itemName', 0] }, ''] },
                  firstItemDesc: { $ifNull: [{ $arrayElemAt: ['$items.itemDescription', 0] }, ''] },
                },
              },

              // build payment lines: BUY => seller(due) + broker(bro), SELL => broker(bro)
              {
                $project: {
                  dueDate: 1,
                  invoiceNo: 1,
                  stock: 1,
                  firstItemName: 1,
                  firstItemDesc: 1,
                  lines: {
                    $concatArrays: [
                      {
                        $cond: [
                          {
                            $and: [
                              { $eq: ['$invoiceType', 'buy'] },
                              { $gt: ['$due', 0] },
                              { $ne: ['$sellerId', null] },
                            ],
                          },
                          [
                            {
                              partyId: '$sellerId',
                              partyType: 'seller',
                              amount: { $round: ['$due', 2] },
                            },
                          ],
                          [],
                        ],
                      },
                      {
                        $cond: [
                          { $and: [{ $gt: ['$bro', 0] }, { $ne: ['$brokerId', null] }] },
                          [
                            {
                              partyId: '$brokerId',
                              partyType: 'broker',
                              amount: { $round: ['$bro', 2] },
                            },
                          ],
                          [],
                        ],
                      },
                    ],
                  },
                },
              },

              { $unwind: '$lines' },
              { $match: { 'lines.amount': { $gt: 0 }, 'lines.partyId': { $ne: null } } },

              // join party name
              {
                $lookup: {
                  from: 'users',
                  localField: 'lines.partyId',
                  foreignField: '_id',
                  as: 'party',
                },
              },
              { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },

              // due in X days (IST)
              {
                $addFields: {
                  dueInDays: {
                    $dateDiff: {
                      startDate: '$$NOW',
                      endDate: '$dueDate',
                      unit: 'day',
                      timezone: tz,
                    },
                  },
                },
              },

              // final row; hide stock for brokers
              {
                $project: {
                  _id: 0,
                  invoiceId: '$_id',
                  invoiceNo: 1,
                  partyId: '$lines.partyId',
                  partyName: '$party.username',
                  partyType: '$lines.partyType',
                  amount: '$lines.amount',
                  stock: { $cond: [{ $eq: ['$lines.partyType', 'broker'] }, 0, '$stock'] },
                  dueDate: {
                    $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz },
                  },
                  dueInDays: 1,
                  itemName: '$firstItemName',
                  itemDescription: '$firstItemDesc',
                },
              },
              { $sort: { dueDate: 1 } },
            ],

            paymentsDueSummary: [
              // build the SAME lines, then sum them
              {
                $project: {
                  invoiceType: 1,
                  sellerId: 1,
                  brokerId: 1,
                  due: { $toDouble: { $ifNull: ['$dueAmount', 0] } },
                  bro: { $toDouble: { $ifNull: ['$brokerageAmount', 0] } },
                  lines: {
                    $concatArrays: [
                      {
                        $cond: [
                          {
                            $and: [
                              { $eq: ['$invoiceType', 'buy'] },
                              { $gt: ['$due', 0] },
                              { $ne: ['$sellerId', null] },
                            ],
                          },
                          [{ amount: { $round: ['$due', 2] } }],
                          [],
                        ],
                      },
                      {
                        $cond: [
                          { $and: [{ $gt: ['$bro', 0] }, { $ne: ['$brokerId', null] }] },
                          [{ amount: { $round: ['$bro', 2] } }],
                          [],
                        ],
                      },
                    ],
                  },
                },
              },
              { $unwind: '$lines' },
              { $match: { 'lines.amount': { $gt: 0 } } },
              {
                $group: {
                  _id: null,
                  total: { $sum: '$lines.amount' },
                  count: { $sum: 1 }, // number of payees (seller+broker lines)
                },
              },
              { $project: { _id: 0, total: { $round: ['$total', 2] }, count: 1 } },
            ],

            // ===== EXPECTED RECEIVABLES =====
            expectedReceivablesItems: [
              { $match: { invoiceType: 'sell' } },
              {
                $project: {
                  invoiceNo: 1,
                  dueDate: 1,
                  items: 1,
                  buyerId: 1,
                  amount: { $toDouble: { $ifNull: ['$dueAmount', 0] } }, // what you expect to receive
                  stock: {
                    $sum: {
                      $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } },
                    },
                  },
                  firstItemName: { $ifNull: [{ $arrayElemAt: ['$items.itemName', 0] }, ''] },
                  firstItemDesc: { $ifNull: [{ $arrayElemAt: ['$items.itemDescription', 0] }, ''] },
                },
              },
              { $match: { amount: { $gt: 0 } } },
              {
                $lookup: {
                  from: 'users',
                  localField: 'buyerId',
                  foreignField: '_id',
                  as: 'party',
                },
              },
              { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },
              {
                $addFields: {
                  dueInDays: {
                    $dateDiff: {
                      startDate: '$$NOW',
                      endDate: '$dueDate',
                      unit: 'day',
                      timezone: tz,
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  invoiceId: '$_id',
                  invoiceNo: 1,
                  partyId: '$buyerId',
                  partyName: '$party.username',
                  amount: 1,
                  stock: 1,
                  dueDate: {
                    $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz },
                  },
                  dueInDays: 1,
                  itemName: '$firstItemName',
                  itemDescription: '$firstItemDesc',
                },
              },
              { $sort: { dueDate: 1 } },
            ],

            expectedReceivablesSummary: [
              { $match: { invoiceType: 'sell' } },
              { $project: { amount: { $toDouble: { $ifNull: ['$dueAmount', 0] } } } },
              { $match: { amount: { $gt: 0 } } },
              { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
              { $project: { _id: 0, total: 1, count: 1 } },
            ],
          },
        },

        // Shape the response
        {
          $project: {
            paymentsDue: {
              items: '$paymentsDueItems',
              count: { $size: '$paymentsDueItems' },
              totalAmount: {
                $round: [
                  {
                    $reduce: {
                      input: '$paymentsDueItems',
                      initialValue: 0,
                      in: { $add: ['$$value', { $toDouble: { $ifNull: ['$$this.amount', 0] } }] },
                    },
                  },
                  2,
                ],
              },
            },
            expectedReceivables: {
              items: '$expectedReceivablesItems',
              totalAmount: {
                $ifNull: [{ $arrayElemAt: ['$expectedReceivablesSummary.total', 0] }, 0],
              },
              count: { $ifNull: [{ $arrayElemAt: ['$expectedReceivablesSummary.count', 0] }, 0] },
            },
          },
        },
      ]);

      const overdueOverviewPromise = await InvoiceModel.aggregate([
        { $match: { companyId: compId, isClosed: false } },

        // dueDate in [today-30d, today) in IST
        {
          $match: {
            $expr: {
              $and: [
                {
                  $gte: [
                    { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                    start30Str,
                  ],
                },
                {
                  $lt: [
                    { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                    todayStr,
                  ],
                },
              ],
            },
          },
        },

        {
          $facet: {
            // ===== Overdue Payments (what you must pay: seller due + broker fee) =====
            overduePaymentsItems: [
              {
                $project: {
                  invoiceType: 1,
                  dueDate: 1,
                  invoiceNo: 1,
                  buyerId: 1,
                  sellerId: 1,
                  brokerId: 1,
                  items: 1,
                  due: { $toDouble: { $ifNull: ['$dueAmount', 0] } },
                  bro: { $toDouble: { $ifNull: ['$brokerageAmount', 0] } },
                  stock: {
                    $sum: {
                      $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } },
                    },
                  },
                  firstItemName: { $ifNull: [{ $arrayElemAt: ['$items.itemName', 0] }, ''] },
                  firstItemDesc: { $ifNull: [{ $arrayElemAt: ['$items.itemDescription', 0] }, ''] },
                },
              },
              // Build 1–2 lines per invoice:
              //  BUY => seller(due) + broker(bro); SELL => broker(bro)
              {
                $project: {
                  dueDate: 1,
                  invoiceNo: 1,
                  stock: 1,
                  firstItemName: 1,
                  firstItemDesc: 1,
                  lines: {
                    $concatArrays: [
                      {
                        $cond: [
                          {
                            $and: [
                              { $eq: ['$invoiceType', 'buy'] },
                              { $gt: ['$due', 0] },
                              { $ne: ['$sellerId', null] },
                            ],
                          },
                          [
                            {
                              partyId: '$sellerId',
                              partyType: 'seller',
                              amount: { $round: ['$due', 2] },
                            },
                          ],
                          [],
                        ],
                      },
                      {
                        $cond: [
                          { $and: [{ $gt: ['$bro', 0] }, { $ne: ['$brokerId', null] }] },
                          [
                            {
                              partyId: '$brokerId',
                              partyType: 'broker',
                              amount: { $round: ['$bro', 2] },
                            },
                          ],
                          [],
                        ],
                      },
                    ],
                  },
                },
              },
              { $unwind: '$lines' },
              { $match: { 'lines.amount': { $gt: 0 }, 'lines.partyId': { $ne: null } } },

              // Party name
              {
                $lookup: {
                  from: 'users',
                  localField: 'lines.partyId',
                  foreignField: '_id',
                  as: 'party',
                },
              },
              { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },

              // Overdue by X days (positive integer)
              {
                $addFields: {
                  overdueDays: {
                    $dateDiff: {
                      startDate: '$dueDate',
                      endDate: '$$NOW',
                      unit: 'day',
                      timezone: tz,
                    },
                  },
                },
              },

              {
                $project: {
                  _id: 0,
                  invoiceId: '$_id',
                  invoiceNo: 1,
                  partyId: '$lines.partyId',
                  partyName: '$party.username',
                  partyType: '$lines.partyType',
                  amount: '$lines.amount',
                  stock: { $cond: [{ $eq: ['$lines.partyType', 'broker'] }, 0, '$stock'] },
                  dueDate: {
                    $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz },
                  },
                  overdueDays: 1,
                  itemName: '$firstItemName',
                  itemDescription: '$firstItemDesc',
                },
              },
              { $sort: { dueDate: 1 } },
            ],

            // ===== Overdue Receivables (what you should receive) =====
            overdueReceivablesItems: [
              { $match: { invoiceType: 'sell' } },
              {
                $project: {
                  invoiceNo: 1,
                  dueDate: 1,
                  items: 1,
                  buyerId: 1,
                  amount: { $toDouble: { $ifNull: ['$dueAmount', 0] } },
                  stock: {
                    $sum: {
                      $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } },
                    },
                  },
                  firstItemName: { $ifNull: [{ $arrayElemAt: ['$items.itemName', 0] }, ''] },
                  firstItemDesc: { $ifNull: [{ $arrayElemAt: ['$items.itemDescription', 0] }, ''] },
                },
              },
              { $match: { amount: { $gt: 0 } } },
              {
                $lookup: {
                  from: 'users',
                  localField: 'buyerId',
                  foreignField: '_id',
                  as: 'party',
                },
              },
              { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },
              {
                $addFields: {
                  overdueDays: {
                    $dateDiff: {
                      startDate: '$dueDate',
                      endDate: '$$NOW',
                      unit: 'day',
                      timezone: tz,
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  invoiceId: '$_id',
                  invoiceNo: 1,
                  partyId: '$buyerId',
                  partyName: '$party.username',
                  amount: 1,
                  stock: 1,
                  dueDate: {
                    $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz },
                  },
                  overdueDays: 1,
                  itemName: '$firstItemName',
                  itemDescription: '$firstItemDesc',
                },
              },
              { $sort: { dueDate: 1 } },
            ],
          },
        },

        // Compute totals/counts directly from arrays (can’t drift)
        {
          $project: {
            overduePayments: {
              items: '$overduePaymentsItems',
              count: { $size: '$overduePaymentsItems' },
              totalAmount: {
                $round: [
                  {
                    $reduce: {
                      input: '$overduePaymentsItems',
                      initialValue: 0,
                      in: { $add: ['$$value', { $toDouble: { $ifNull: ['$$this.amount', 0] } }] },
                    },
                  },
                  2,
                ],
              },
            },
            overdueReceivables: {
              items: '$overdueReceivablesItems',
              count: { $size: '$overdueReceivablesItems' },
              totalAmount: {
                $round: [
                  {
                    $reduce: {
                      input: '$overdueReceivablesItems',
                      initialValue: 0,
                      in: { $add: ['$$value', { $toDouble: { $ifNull: ['$$this.amount', 0] } }] },
                    },
                  },
                  2,
                ],
              },
            },
          },
        },
      ] as any);

      const overdue30PlusPromise = await InvoiceModel.aggregate([
        { $match: { companyId: compId, isClosed: false } },
        {
          $match: {
            $expr: {
              $lt: [
                { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
                cutoffStr,
              ],
            },
          },
        },

        {
          $facet: {
            overduePaymentsItems: [
              {
                $project: {
                  invoiceType: 1,
                  dueDate: 1,
                  invoiceNo: 1,
                  buyerId: 1,
                  sellerId: 1,
                  brokerId: 1,
                  items: 1,
                  due: { $toDouble: { $ifNull: ['$dueAmount', 0] } },
                  bro: { $toDouble: { $ifNull: ['$brokerageAmount', 0] } },
                  stock: {
                    $sum: {
                      $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } },
                    },
                  },
                  firstItemName: { $ifNull: [{ $arrayElemAt: ['$items.itemName', 0] }, ''] },
                  firstItemDesc: { $ifNull: [{ $arrayElemAt: ['$items.itemDescription', 0] }, ''] },
                },
              },
              // Build payee lines:
              //  BUY => seller(due) + broker(bro);  SELL => broker(bro)
              {
                $project: {
                  dueDate: 1,
                  invoiceNo: 1,
                  stock: 1,
                  firstItemName: 1,
                  firstItemDesc: 1,
                  lines: {
                    $concatArrays: [
                      {
                        $cond: [
                          {
                            $and: [
                              { $eq: ['$invoiceType', 'buy'] },
                              { $gt: ['$due', 0] },
                              { $ne: ['$sellerId', null] },
                            ],
                          },
                          [
                            {
                              partyId: '$sellerId',
                              partyType: 'seller',
                              amount: { $round: ['$due', 2] },
                            },
                          ],
                          [],
                        ],
                      },
                      {
                        $cond: [
                          { $and: [{ $gt: ['$bro', 0] }, { $ne: ['$brokerId', null] }] },
                          [
                            {
                              partyId: '$brokerId',
                              partyType: 'broker',
                              amount: { $round: ['$bro', 2] },
                            },
                          ],
                          [],
                        ],
                      },
                    ],
                  },
                },
              },
              { $unwind: '$lines' },
              { $match: { 'lines.amount': { $gt: 0 }, 'lines.partyId': { $ne: null } } },

              // Join party
              {
                $lookup: {
                  from: 'users',
                  localField: 'lines.partyId',
                  foreignField: '_id',
                  as: 'party',
                },
              },
              { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },

              // Days overdue (positive)
              {
                $addFields: {
                  overdueDays: {
                    $dateDiff: {
                      startDate: '$dueDate',
                      endDate: '$$NOW',
                      unit: 'day',
                      timezone: tz,
                    },
                  },
                },
              },

              {
                $project: {
                  _id: 0,
                  invoiceId: '$_id',
                  invoiceNo: 1,
                  partyId: '$lines.partyId',
                  partyName: '$party.username',
                  partyType: '$lines.partyType',
                  amount: '$lines.amount',
                  // Hide stock for brokers
                  stock: { $cond: [{ $eq: ['$lines.partyType', 'broker'] }, 0, '$stock'] },
                  dueDate: {
                    $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz },
                  },
                  overdueDays: 1,
                  itemName: '$firstItemName',
                  itemDescription: '$firstItemDesc',
                },
              },
              { $sort: { dueDate: 1 } },
            ],

            // ===== 30+ days Overdue Receivables (what you should receive) =====
            overdueReceivablesItems: [
              { $match: { invoiceType: 'sell' } },
              {
                $project: {
                  invoiceNo: 1,
                  dueDate: 1,
                  items: 1,
                  buyerId: 1,
                  amount: { $toDouble: { $ifNull: ['$dueAmount', 0] } },
                  stock: {
                    $sum: {
                      $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } },
                    },
                  },
                  firstItemName: { $ifNull: [{ $arrayElemAt: ['$items.itemName', 0] }, ''] },
                  firstItemDesc: { $ifNull: [{ $arrayElemAt: ['$items.itemDescription', 0] }, ''] },
                },
              },
              { $match: { amount: { $gt: 0 } } },
              {
                $lookup: {
                  from: 'users',
                  localField: 'buyerId',
                  foreignField: '_id',
                  as: 'party',
                },
              },
              { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },
              {
                $addFields: {
                  overdueDays: {
                    $dateDiff: {
                      startDate: '$dueDate',
                      endDate: '$$NOW',
                      unit: 'day',
                      timezone: tz,
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  invoiceId: '$_id',
                  invoiceNo: 1,
                  partyId: '$buyerId',
                  partyName: '$party.username',
                  amount: 1,
                  stock: 1,
                  dueDate: {
                    $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz },
                  },
                  overdueDays: 1,
                  itemName: '$firstItemName',
                  itemDescription: '$firstItemDesc',
                },
              },
              { $sort: { dueDate: 1 } },
            ],
          },
        },

        // Compute totals & counts from arrays (cannot drift)
        {
          $project: {
            overduePayments: {
              items: '$overduePaymentsItems',
              count: { $size: '$overduePaymentsItems' },
              totalAmount: {
                $round: [
                  {
                    $reduce: {
                      input: '$overduePaymentsItems',
                      initialValue: 0,
                      in: { $add: ['$$value', { $toDouble: { $ifNull: ['$$this.amount', 0] } }] },
                    },
                  },
                  2,
                ],
              },
            },
            overdueReceivables: {
              items: '$overdueReceivablesItems',
              count: { $size: '$overdueReceivablesItems' },
              totalAmount: {
                $round: [
                  {
                    $reduce: {
                      input: '$overdueReceivablesItems',
                      initialValue: 0,
                      in: { $add: ['$$value', { $toDouble: { $ifNull: ['$$this.amount', 0] } }] },
                    },
                  },
                  2,
                ],
              },
            },
          },
        },
      ] as any);
      const [
        invoiceReceiableTodayAgg,
        invoiceDueTodayAgg,
        invoicePaidTodayAgg,
        invoiceReceivedTodayAgg,
        upcomingPaymentAgg,
        overdueOverviewAgg,
        overdue30PlusAgg,
      ] = await Promise.all([
        invoiceReceiableTodayPromise,
        invoicePayableTodayPromise,
        invoicePaidTodayPromise,
        invoiceReceivedTodayPromise,
        upcomingPaymentPromise,
        overdueOverviewPromise,
        overdue30PlusPromise,
      ]);

      const todayPayableList = invoiceDueTodayAgg?.[0] ?? {};
      const todayReceivableList = invoiceReceiableTodayAgg?.[0] ?? {};
      const todaysPaidAmount = invoicePaidTodayAgg?.[0] ?? { totalAmount: 0, count: 0, items: [] };
      const todaysReceivedAmount = invoiceReceivedTodayAgg?.[0] ?? {
        totalAmount: 0,
        count: 0,
        items: [],
      };

      const todayPayment = {
        todayPayableList,
        todayReceivableList,
        todaysPaidAmount,
        todaysReceivedAmount,
      };
      const upcomingPayments = upcomingPaymentAgg?.[0] ?? {
        paymentsDue: { total: 0, count: 0, items: [] },
        expectedReceivables: { total: 0, count: 0, items: [] },
      };

      const overduePayments = overdueOverviewAgg?.[0] ?? {
        overduePayments: { totalAmount: 0, count: 0, items: [] },
        overdueReceivables: { totalAmount: 0, count: 0, items: [] },
      };
      const overdue30Plus = overdue30PlusAgg?.[0] ?? {
        overduePayments: { totalAmount: 0, count: 0, items: [] },
        overdueReceivables: { totalAmount: 0, count: 0, items: [] },
      };
      return successResposne(
        {
          message: 'Payment summary fetched successfully',
          status: 'SUCCESS',
          statusCode: 200,
          data: {
            todayPayment,
            upcomingPayments,
            overduePayments,
            overdue30Plus,
          },
        },
        req,
        res,
        next
      );
    } catch (error) {
      return next(error);
    }
  };

  private getYearlySummaryByRange = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('ddddddd');
      const { companyId } = req.params;
      const { startDate, endDate } = req.body as { startDate?: string; endDate?: string };

      if (!companyId) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'companyId'));
      }

      if (!startDate || !endDate) {
        throw new Error(
          ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'startDate or endDate')
        );
      }
      // Parse and normalize dates
      let start = startDate ? new Date(startDate) : null;
      let end = endDate ? new Date(endDate) : null;

      if (!start || isNaN(start.getTime()) || !end || isNaN(end.getTime())) {
        // default to the current calendar year if either date is missing/invalid
        const now = new Date();
        start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(now.getFullYear() + 1, 0, 1, 0, 0, 0, 0);
      } else {
        // inclusive end → convert to exclusive upper bound (next day 00:00)
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        end = new Date(end.getTime() + 24 * 60 * 60 * 1000);
      }
      console.log('end', end);
      console.log('start', start);
      const compId = new mongoose.Types.ObjectId(companyId);

      const yearlySummary = await LedgerModel.aggregate([
        // scope to company first
        { $match: { companyId: compId } },

        {
          $addFields: {
            _eventDate: { $ifNull: ['$createdDate', '$createdAt'] },
            _amount: { $toDouble: { $ifNull: ['$amount', 0] } },
          },
        },

        // date filter on the unified event date
        { $match: { _eventDate: { $gte: start, $lt: end } } },

        {
          $group: {
            _id: null,

            credits: {
              $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$_amount', 0] },
            },

            debits: {
              $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$_amount', 0] },
            },

            brokerageDebit: {
              $sum: { $cond: [{ $eq: ['$type', 'debit brokerage'] }, '$_amount', 0] },
            },

            txnCount: {
              $sum: { $cond: [{ $in: ['$type', ['credit', 'debit']] }, 1, 0] },
            },
          },
        },

        {
          $project: {
            _id: 0,
            totalRevenue: { $round: ['$credits', 2] },
            // previous "netProfit": credits - debits
            netProfit: { $round: [{ $subtract: ['$credits', '$debits'] }, 2] },
            // "netPosition": credits - (debits + brokerageDebit)
            netPosition: {
              $round: [{ $subtract: ['$credits', { $add: ['$debits', '$brokerageDebit'] }] }, 2],
            },
            brokerCommissions: { $round: ['$brokerageDebit', 2] },
            totalTransactions: '$txnCount',

            range: {
              startDate: start,
              endDate: new Date(end.getTime() - 24 * 60 * 60 * 1000),
            },
          },
        },
      ]);

      const data = yearlySummary?.[0] ?? {
        totalRevenue: 0,
        netProfit: 0,
        netPosition: 0,
        brokerCommissions: 0,
        totalTransactions: 0,
        range: { startDate: start, endDate: new Date(end.getTime() - 24 * 60 * 60 * 1000) },
      };

      return successResposne(
        {
          message: 'Yearly summary fetched successfully',
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data,
        },
        req,
        res,
        next
      );
    } catch (err) {
      next(err);
    }
  };
}

export default LedgerController;
