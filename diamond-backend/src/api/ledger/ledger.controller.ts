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
                  netBalance: { $subtract: ['$totalPayable','$totalReceivable'] },
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
            totalAmount: {
              $sum: {
                $cond: [{ $in: ['$type', ['debit']] }, { $multiply: ['$amount', -1] }, '$amount'],
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
}

export default LedgerController;
