import { Router, Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES, HTTP_STATUS_CODES, ROUTES, SUCCESS_MESSAGES } from '../../constants';
import { ControllerI } from '../../interfaces/common.interface';
import { authMiddleware } from '../../middleware/auth.middleware';
import { successResposne } from '../../middleware/apiResponse.middleware';
import LedgerModel from './ledger.model';
import MongoService from '../../services/mongo.service';
import mongoose from 'mongoose';

class LedgerController implements ControllerI {
  public path = `/${ROUTES.LEDGER}`;
  public router = Router();
  //   private validation = new LedgerValidation();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(`${this.path}/:companyId`, authMiddleware, this.getCompanyLedger);
    this.router.get(`${this.path}/:companyId/party/:partyId`, authMiddleware, this.getPartyLedger);

    this.router.get(`${this.path}/summary/:companyId`, authMiddleware, this.getDashboardSummary);
  }

  private getCompanyLedger = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { companyId } = request.params;
      const result = await LedgerModel.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
          },
        },

        {
          $facet: {
            // 1️⃣ Party-wise ledger
            partyLedger: [
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
                $project: {
                  invoiceId: 1,
                  type: 1,
                  amount: 1,
                  description: 1,
                  createdAt: 1,
                  partyId: {
                    $cond: [
                      { $eq: ['$type', 'credit brokerage'] },
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
                  party: {
                    $cond: [
                      { $eq: ['$type', 'credit brokerage'] },
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
                  invoiceDetails: 1,
                },
              },

              {
                $group: {
                  _id: '$partyId',
                  partyName: { $first: '$party' },
                  totalAmount: {
                    $sum: {
                      $cond: [
                        { $in: ['$type', ['debit']] },
                        { $multiply: ['$amount', -1] },
                        '$amount',
                      ],
                    },
                  },
                  invoices: {
                    $push: {
                      invoiceId: '$invoiceId',
                      amount: '$amount',
                      description: '$description',
                      type: '$type',
                      createdAt: '$createdAt',
                    },
                  },
                },
              },
            ],

            // 2️⃣ Summary
            summary: [
              {
                $group: {
                  _id: null,
                  totalReceivable: {
                    $sum: {
                      $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0],
                    },
                  },
                  totalPayable: {
                    $sum: {
                      $cond: [{ $in: ['$type', ['credit', 'credit brokerage']] }, '$amount', 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalReceivable: 1,
                  totalPayable: 1,
                  netBalance: { $subtract: ['$totalPayable', '$totalReceivable'] },
                },
              },
            ],
          },
        },
        {
          $project: {
            partyLedger: 1,
            summary: { $arrayElemAt: ['$summary', 0] },
          },
        },
      ]);

      console.log('summary', result);
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

        // Lookup toUser
        {
          $lookup: {
            from: 'users',
            localField: 'toUser',
            foreignField: '_id',
            as: 'toUserDetails',
          },
        },
        { $unwind: '$toUserDetails' },

        // Add partyId + partyName
        {
          $project: {
            invoiceId: 1,
            type: 1,
            amount: 1,
            pendingAmount: 1, // 👈 include pending here
            description: 1,
            createdAt: 1,
            createdDate: 1,
            partyId: {
              $cond: [
                { $eq: ['$type', 'credit brokerage'] },
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
                { $eq: ['$type', 'credit brokerage'] },
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
            invoiceDetails: 1,
          },
        },

        // Filter only this partyId
        {
          $match: {
            partyId: new mongoose.Types.ObjectId(partyId),
          },
        },

        {
          $sort: { createdAt: -1 },
        },

        // Group to get summary + transactions
        {
          $group: {
            _id: '$partyId',
            partyName: { $first: '$partyName' },
            // totalAmount: {
            //   $sum: {
            //     $cond: [{ $in: ['$type', ['debit']] }, { $multiply: ['$amount', -1] }, '$amount'],
            //   },
            // },
            invoices: {
              $push: {
                invoiceId: '$invoiceId',
                amount: '$amount',
                description: '$description',
                type: '$type',
                createdAt: '$createdAt',
                createdDate: '$createdDate',
                pendingAmount: '$pendingAmount',
              },
            },
          },
        },
        {
          $addFields: {
            closingBalance: {
              $ifNull: [{ $first: '$invoices.pendingAmount' }, 0],
            },
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

  // private getPartyLedger = async (request: Request, response: Response, next: NextFunction) => {
  //   try {
  //     const { companyId, partyId } = request.params;

  //     const ledger = await LedgerModel.aggregate([
  //       {
  //         $match: {
  //           companyId: new mongoose.Types.ObjectId(companyId),
  //         },
  //       },

  //       // Lookup invoice
  //       {
  //         $lookup: {
  //           from: 'invoices',
  //           localField: 'invoiceId',
  //           foreignField: '_id',
  //           as: 'invoiceDetails',
  //         },
  //       },
  //       { $unwind: '$invoiceDetails' },

  //       // Lookup fromUser
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'fromUser',
  //           foreignField: '_id',
  //           as: 'fromUserDetails',
  //         },
  //       },
  //       { $unwind: '$fromUserDetails' },

  //       // Lookup toUser
  //       {
  //         $lookup: {
  //           from: 'users',
  //           localField: 'toUser',
  //           foreignField: '_id',
  //           as: 'toUserDetails',
  //         },
  //       },
  //       { $unwind: '$toUserDetails' },

  //       // Add partyId + partyName
  //       {
  //         $addFields: {
  //           partyId: {
  //             $cond: [
  //               { $eq: ['$type', 'credit brokerage'] },
  //               '$toUserDetails._id',
  //               {
  //                 $cond: [
  //                   { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
  //                   '$fromUserDetails._id',
  //                   '$toUserDetails._id',
  //                 ],
  //               },
  //             ],
  //           },
  //           partyName: {
  //             $cond: [
  //               { $eq: ['$type', 'credit brokerage'] },
  //               '$toUserDetails.username',
  //               {
  //                 $cond: [
  //                   { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
  //                   '$fromUserDetails.username',
  //                   '$toUserDetails.username',
  //                 ],
  //               },
  //             ],
  //           },
  //         },
  //       },

  //       // Filter only this partyId
  //       {
  //         $match: {
  //           partyId: new mongoose.Types.ObjectId(partyId),
  //         },
  //       },

  //       {
  //         $sort: { createdAt: -1 },
  //       },

  //       // Group by Invoice
  //       {
  //         $group: {
  //           _id: '$invoiceId',
  //           invoiceType: { $first: '$invoiceDetails.invoiceType' }, // sell or buy
  //           totalInvoiceAmount: { $first: '$invoiceDetails.totalAmount' },
  //           partyId: { $first: '$partyId' },
  //           partyName: { $first: '$partyName' },
  //           transactions: {
  //             $push: {
  //               description: '$description',
  //               type: '$type',
  //               amount: '$amount',
  //               createdDate: '$createdDate',
  //             },
  //           },
  //           // Paid (for sell invoices)
  //           paidAmount: {
  //             $sum: {
  //               $cond: [
  //                 {
  //                   $and: [
  //                     { $eq: ['$invoiceDetails.invoiceType', 'sell'] },
  //                     { $eq: ['$type', 'credit'] },
  //                   ],
  //                 },
  //                 '$amount',
  //                 0,
  //               ],
  //             },
  //           },
  //           // Received (for buy invoices)
  //           receivedAmount: {
  //             $sum: {
  //               $cond: [
  //                 {
  //                   $and: [
  //                     { $eq: ['$invoiceDetails.invoiceType', 'buy'] },
  //                     { $eq: ['$type', 'debit'] },
  //                   ],
  //                 },
  //                 '$amount',
  //                 0,
  //               ],
  //             },
  //           },
  //         },
  //       },

  //       // Pending Amount
  //       {
  //         $addFields: {
  //           pendingAmount: {
  //             $cond: [
  //               { $eq: ['$invoiceType', 'sell'] },
  //               { $subtract: ['$totalInvoiceAmount', '$paidAmount'] },
  //               { $subtract: ['$totalInvoiceAmount', '$receivedAmount'] },
  //             ],
  //           },
  //         },
  //       },

  //       // Group by Party
  //       {
  //         $group: {
  //           _id: '$partyId',
  //           partyName: { $first: '$partyName' },
  //           invoices: { $push: '$$ROOT' },
  //           totalInvoiceAmount: { $sum: '$totalInvoiceAmount' },
  //           totalPaid: { $sum: '$paidAmount' },
  //           totalReceived: { $sum: '$receivedAmount' },
  //           totalPending: { $sum: '$pendingAmount' },
  //         },
  //       },

  //       // Final Balance
  //       {
  //         $addFields: {
  //           totalBalance: {
  //             $subtract: ['$totalPaid', '$totalReceived'],
  //             // Positive = Party owes you
  //             // Negative = You owe party
  //           },
  //         },
  //       },
  //     ]);

  //     return successResposne(
  //       {
  //         message: 'Party Ledger fetched successfully',
  //         status: SUCCESS_MESSAGES.SUCCESS,
  //         statusCode: HTTP_STATUS_CODES.OK,
  //         data: ledger[0] || null,
  //       },
  //       request,
  //       response,
  //       next
  //     );
  //   } catch (error) {
  //     next(error);
  //   }
  // };

  private getDashboardSummary = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { companyId } = request.params;

      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      const summary = await LedgerModel.aggregate([
        {
          $match: {
            companyId: new mongoose.Types.ObjectId(companyId),
          },
        },
        {
          $facet: {
            // 🔹 Monthly summary
            monthly: [
              { $match: { createdAt: { $gte: startOfMonth } } },
              {
                $group: {
                  _id: null,
                  totalReceivable: {
                    $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] },
                  },
                  totalPayable: {
                    $sum: {
                      $cond: [{ $in: ['$type', ['credit', 'credit brokerage']] }, '$amount', 0],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalReceivable: 1,
                  totalPayable: 1,
                  netPosition: { $subtract: ['$totalPayable', '$totalReceivable'] },
                },
              },
            ],

            // 🔹 Yearly summary
            yearly: [
              { $match: { createdAt: { $gte: startOfYear } } },
              {
                $group: {
                  _id: null,
                  totalRevenue: { $sum: '$amount' },
                  totalTransactions: { $sum: 1 },
                  brokerCommissions: {
                    $sum: { $cond: [{ $eq: ['$type', 'credit brokerage'] }, '$amount', 0] },
                  },
                  outstandingAmount: {
                    $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$amount', 0] },
                  },
                  netProfit: {
                    $sum: {
                      $cond: [
                        { $eq: ['$type', 'debit'] },
                        { $multiply: ['$amount', -1] },
                        '$amount',
                      ],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  totalRevenue: 1,
                  totalTransactions: 1,
                  brokerCommissions: 1,
                  outstandingAmount: 1,
                  netProfit: 1,
                },
              },
            ],

            // 🔹 Daily summary
            daily: [
              { $match: { createdAt: { $gte: startOfDay, $lt: endOfDay } } },

              // Join User collection for fromUser
              {
                $lookup: {
                  from: 'users', // 👈 name of User collection
                  localField: 'fromUser',
                  foreignField: '_id',
                  as: 'fromUserDetails',
                },
              },
              { $unwind: '$fromUserDetails' },

              // Join User collection for toUser
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
                $group: {
                  _id: null,
                  totalDue: {
                    $sum: {
                      $cond: [{ $in: ['$type', ['credit', 'credit brokerage']] }, '$amount', 0],
                    },
                  },
                  dueCount: {
                    $sum: { $cond: [{ $in: ['$type', ['credit', 'credit brokerage']] }, 1, 0] },
                  },
                  dueParties: {
                    $push: {
                      $cond: [
                        { $in: ['$type', ['credit', 'credit brokerage']] },
                        {
                          partyName: '$toUserDetails.username', // 👈 take vendor name
                          amount: '$amount',
                        },
                        '$$REMOVE',
                      ],
                    },
                  },
                  totalReceived: {
                    $sum: { $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0] },
                  },
                  receivedCount: {
                    $sum: { $cond: [{ $eq: ['$type', 'debit'] }, 1, 0] },
                  },
                  receivedParties: {
                    $push: {
                      $cond: [
                        { $eq: ['$type', 'debit'] },
                        {
                          partyName: '$fromUserDetails.username', // 👈 take customer name
                          amount: '$amount',
                        },
                        '$$REMOVE',
                      ],
                    },
                  },
                },
              },
              {
                $project: {
                  _id: 0,
                  due: {
                    totalDue: '$totalDue',
                    count: '$dueCount',
                    parties: '$dueParties',
                  },
                  received: {
                    totalReceived: '$totalReceived',
                    count: '$receivedCount',
                    parties: '$receivedParties',
                  },
                  netToday: { $subtract: ['$totalReceived', '$totalDue'] },
                },
              },
            ],
          },
        },
        {
          $project: {
            monthlySummary: { $arrayElemAt: ['$monthly', 0] },
            yearlySummary: { $arrayElemAt: ['$yearly', 0] },
            dailySummary: { $arrayElemAt: ['$daily', 0] },
          },
        },
      ]);

      return successResposne(
        {
          message: 'Dashboard summary fetched successfully',
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: summary[0] || { monthly: {}, yearly: {}, daily: {} },
        },
        request,
        response,
        next
      );
    } catch (error) {
      next(error);
    }
  };
}

export default LedgerController;
