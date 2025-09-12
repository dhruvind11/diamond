import { Router, Request, Response, NextFunction } from 'express';
import { ROUTES, SUCCESS_MESSAGES, HTTP_STATUS_CODES, ERROR_MESSAGES } from '../../constants';
import { ControllerI } from '../../interfaces/common.interface';
import { successResposne } from '../../middleware/apiResponse.middleware';
import MongoService from '../../services/mongo.service';
import * as mongoose from 'mongoose';
import { authMiddleware } from '../../middleware/auth.middleware';
import InvoiceModel from '../Invoice/invoice.model';
import LedgerModel from '../ledger/ledger.model';
import type { PipelineStage } from 'mongoose';

// Models you already have

// (Optional) auth/validation middleware if you have it
// import { authMiddleware } from '../../middleware/auth.middleware';
// import { ReportMiddleware } from '../../middleware/Report.middleware';

type ReportType = 'payable' | 'receivable' | 'paid' | 'received';

function assertISO(dateStr: unknown, name: string) {
  if (typeof dateStr !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', `${name} (YYYY-MM-DD)`));
  }
}

const TZ = 'Asia/Kolkata';
const fmtYMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

class ReportController implements ControllerI {
  public path = `/${ROUTES.REPORT}`;
  public router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    // POST /report/:companyId
    this.router.post(`${this.path}/:companyId`, authMiddleware, this.getReport);
  }

  private getReport = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = req.params;
      const { type, date, startDate, endDate } = req.body || {};

      if (!companyId || !mongoose.isValidObjectId(companyId)) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'companyId'));
      }
      if (!['payable', 'receivable', 'paid', 'received'].includes(type)) {
        throw new Error('type must be one of: payable, receivable, paid, received');
      }

      // Use IST-safe YYYY-MM-DD normalization
      const tz = 'Asia/Kolkata';
      const fmtYMD = new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });

      const compId = new mongoose.Types.ObjectId(companyId);
      let data: any = null;

      if (type === 'payable' || type === 'receivable') {
        // single-day mode
        if (!date) {
          throw new Error('The date (YYYY-MM-DD) field is required.');
        }
        assertISO(date, 'date');
        const dayStr = fmtYMD.format(new Date(date)); // normalize to IST date
        data =
          type === 'payable'
            ? await this.buildPayableDay(compId, dayStr)
            : await this.buildReceivableDay(compId, dayStr);
      } else {
        // range mode: paid/received
        if (!startDate) throw new Error('The startDate (YYYY-MM-DD) field is required.');
        if (!endDate) throw new Error('The endDate (YYYY-MM-DD) field is required.');
        assertISO(startDate, 'startDate');
        assertISO(endDate, 'endDate');

        const startStr = fmtYMD.format(new Date(startDate));
        const endStr = fmtYMD.format(new Date(endDate));

        // optional: ensure start <= end
        if (startStr > endStr) {
          throw new Error('startDate must be less than or equal to endDate.');
        }

        data =
          type === 'paid'
            ? await this.buildPaid(compId, startStr, endStr)
            : await this.buildReceived(compId, startStr, endStr);
      }

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(':action', 'Report fetched'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: Array.isArray(data) ? data[0] : data,
        },
        req,
        res,
        next
      );
    } catch (err) {
      next(err);
    }
  };

  /**
   * PAYABLE: open invoices with dueDate in range
   * BUY => payable = dueAmount + brokerageAmount, party = seller
   * SELL => payable = brokerageAmount only, party = broker
   */
  private async buildPayableDay(compId: mongoose.Types.ObjectId, dayStr: string) {
    const tz = 'Asia/Kolkata';
    return InvoiceModel.aggregate([
      { $match: { companyId: compId, invoiceType: 'buy' } },
      {
        // dueDate == dayStr (IST-accurate)
        $match: {
          $expr: {
            $eq: [
              { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
              dayStr,
            ],
          },
        },
      },
      {
        $project: {
          sellerId: 1,
          brokerId: 1,
          isClosed: 1,
          dueDate: 1,
          items: 1,
          // payable = dueAmount + brokerageAmount (brokerage always payable)
          amount: {
            $add: [
              { $toDouble: { $ifNull: ['$dueAmount', 0] } },
              { $toDouble: { $ifNull: ['$brokerageAmount', 0] } },
            ],
          },
          stock: {
            $sum: { $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } } },
          },
        },
      },
      { $match: { amount: { $gt: 0 } } },
      {
        $addFields: {
          partyId: '$sellerId',
          status: { $cond: ['$isClosed', 'paid', 'unpaid'] }, // info only
          day: {
            $dateDiff: { startDate: '$$NOW', endDate: '$dueDate', unit: 'day', timezone: tz },
          },
        },
      },
      { $lookup: { from: 'users', localField: 'partyId', foreignField: '_id', as: 'party' } },
      { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          partyId: 1,
          partyName: '$party.username',
          amount: 1,
          stock: 1,
          day: 1,
          status: 1,
        },
      },
      // one row per party
      {
        $group: {
          _id: '$partyId',
          partyName: { $first: '$partyName' },
          amount: { $sum: '$amount' },
          stock: { $sum: '$stock' },
          statuses: { $addToSet: '$status' },
        },
      },
      {
        $addFields: {
          status: {
            $cond: [
              { $gt: [{ $size: '$statuses' }, 1] },
              'mixed',
              { $arrayElemAt: ['$statuses', 0] },
            ],
          },
        },
      },
      { $project: { _id: 0, partyId: '$_id', partyName: 1, amount: 1, stock: 1, status: 1 } },
      { $sort: { amount: -1 } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          items: { $push: '$$ROOT' },
        },
      },
      { $project: { _id: 0, totalAmount: 1, count: 1, items: 1 } },
    ]);
  }

  /**
   * RECEIVABLE: open SELL invoices with dueDate in range
   * amount = dueAmount, party = buyer
   */
  private async buildReceivableDay(compId: mongoose.Types.ObjectId, dayStr: string) {
    const tz = 'Asia/Kolkata';
    return InvoiceModel.aggregate([
      { $match: { companyId: compId, invoiceType: 'sell' } },
      {
        $match: {
          $expr: {
            $eq: [
              { $dateToString: { format: '%Y-%m-%d', date: '$dueDate', timezone: tz } },
              dayStr,
            ],
          },
        },
      },
      {
        $project: {
          buyerId: 1,
          isClosed: 1,
          dueDate: 1,
          items: 1,
          amount: { $toDouble: { $ifNull: ['$dueAmount', 0] } }, // receivable
          stock: {
            $sum: { $map: { input: '$items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } } },
          },
        },
      },
      // show even if amount is 0? keep or drop this line
      // { $match: { amount: { $gt: 0 } } },
      {
        $addFields: {
          partyId: '$buyerId',
          status: { $cond: ['$isClosed', 'paid', 'unpaid'] },
          day: {
            $dateDiff: { startDate: '$$NOW', endDate: '$dueDate', unit: 'day', timezone: tz },
          },
        },
      },
      { $lookup: { from: 'users', localField: 'partyId', foreignField: '_id', as: 'party' } },
      { $unwind: { path: '$party', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          partyId: 1,
          partyName: '$party.username',
          amount: 1,
          stock: 1,
          day: 1,
          status: 1,
        },
      },
      {
        $group: {
          _id: '$partyId',
          partyName: { $first: '$partyName' },
          amount: { $sum: '$amount' },
          stock: { $sum: '$stock' },
          statuses: { $addToSet: '$status' },
        },
      },
      {
        $addFields: {
          status: {
            $cond: [
              { $gt: [{ $size: '$statuses' }, 1] },
              'mixed',
              { $arrayElemAt: ['$statuses', 0] },
            ],
          },
        },
      },
      { $project: { _id: 0, partyId: '$_id', partyName: 1, amount: 1, stock: 1, status: 1 } },
      { $sort: { amount: -1 } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          items: { $push: '$$ROOT' },
        },
      },
      { $project: { _id: 0, totalAmount: 1, count: 1, items: 1 } },
    ]);
  }

  /**
   * PAID: ledger rows in range where cash went out
   * types: debit, debit brokerage
   * party rule:
   *  - brokerage rows -> toUser (broker)
   *  - otherwise if invoiceType = 'sell' -> fromUser (buyer payment returned? keep parity with previous logic)
   *  - otherwise (buy) -> toUser (seller)
   * stock is summed from the linked invoice items
   */
  private async buildPaid(
    companyId: mongoose.Types.ObjectId,
    startStr: string,
    endStr: string
  ): Promise<PipelineStage[]> {
    const pipeline: PipelineStage[] = [
      { $match: { companyId, type: { $in: ['debit', 'debit brokerage'] } } },
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      timezone: TZ,
                      date: { $ifNull: ['$createdDate', '$createdAt'] },
                    },
                  },
                  startStr,
                ],
              },
              {
                $lte: [
                  {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      timezone: TZ,
                      date: { $ifNull: ['$createdDate', '$createdAt'] },
                    },
                  },
                  endStr,
                ],
              },
            ],
          },
        },
      },
      // normalize amount
      {
        $addFields: {
          _amount: {
            $cond: [
              { $ne: [{ $type: '$amount' }, 'decimal'] },
              { $toDecimal: '$amount' },
              '$amount',
            ],
          },
        },
      },
      // lookups
      { $lookup: { from: 'invoices', localField: 'invoiceId', foreignField: '_id', as: 'inv' } },
      { $unwind: '$inv' },
      { $lookup: { from: 'users', localField: 'fromUser', foreignField: '_id', as: 'fromU' } },
      { $unwind: '$fromU' },
      { $lookup: { from: 'users', localField: 'toUser', foreignField: '_id', as: 'toU' } },
      { $unwind: '$toU' },
      // decide party
      {
        $addFields: {
          partyId: {
            $cond: [
              { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
              '$toU._id',
              {
                $cond: [{ $eq: ['$inv.invoiceType', 'sell'] }, '$fromU._id', '$toU._id'],
              },
            ],
          },
          partyName: {
            $cond: [
              { $in: ['$type', ['credit brokerage', 'debit brokerage']] },
              '$toU.username',
              {
                $cond: [{ $eq: ['$inv.invoiceType', 'sell'] }, '$fromU.username', '$toU.username'],
              },
            ],
          },
          partyTag: {
            $cond: [{ $in: ['$type', ['credit brokerage', 'debit brokerage']] }, 'broker', 'party'],
          },
          stock: {
            $sum: { $map: { input: '$inv.items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } } },
          },
          dt: { $ifNull: ['$createdDate', '$createdAt'] },
        },
      },
      { $match: { $expr: { $gt: [{ $toDouble: { $ifNull: ['$_amount', 0] } }, 0] } } },
      {
        $project: {
          _id: 0,
          partyId: 1,
          partyName: 1,
          type: '$partyTag',
          amount: { $round: [{ $toDouble: '$_amount' }, 2] },
          stock: { $ifNull: ['$stock', 0] },
          date: { $dateToString: { format: '%Y-%m-%d', date: '$dt', timezone: TZ } },
        },
      },
      { $sort: { date: 1, partyName: 1 } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          items: { $push: '$$ROOT' },
        },
      },
      { $project: { _id: 0, totalAmount: { $round: ['$totalAmount', 2] }, count: 1, items: 1 } },
    ];
    const out = await LedgerModel.aggregate(pipeline);
    return out[0] ?? { items: [], totalAmount: 0, count: 0 };
  }

  /**
   * RECEIVED: ledger rows in range where cash came in
   * type: credit (we exclude credit brokerage from "cash received")
   */
  private async buildReceived(
    companyId: mongoose.Types.ObjectId,
    startStr: string,
    endStr: string
  ): Promise<PipelineStage[]> {
    const pipeline: PipelineStage[] = [
      { $match: { companyId, type: 'credit' } },
      {
        $match: {
          $expr: {
            $and: [
              {
                $gte: [
                  {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      timezone: TZ,
                      date: { $ifNull: ['$createdDate', '$createdAt'] },
                    },
                  },
                  startStr,
                ],
              },
              {
                $lte: [
                  {
                    $dateToString: {
                      format: '%Y-%m-%d',
                      timezone: TZ,
                      date: { $ifNull: ['$createdDate', '$createdAt'] },
                    },
                  },
                  endStr,
                ],
              },
            ],
          },
        },
      },
      // normalize amount
      {
        $addFields: {
          _amount: {
            $cond: [
              { $ne: [{ $type: '$amount' }, 'decimal'] },
              { $toDecimal: '$amount' },
              '$amount',
            ],
          },
        },
      },
      // lookups
      { $lookup: { from: 'invoices', localField: 'invoiceId', foreignField: '_id', as: 'inv' } },
      { $unwind: '$inv' },
      { $lookup: { from: 'users', localField: 'fromUser', foreignField: '_id', as: 'fromU' } },
      { $unwind: '$fromU' },
      { $lookup: { from: 'users', localField: 'toUser', foreignField: '_id', as: 'toU' } },
      { $unwind: '$toU' },
      {
        $addFields: {
          // received from whom? for 'sell' invoices, money comes from buyer (fromUser)
          partyId: {
            $cond: [{ $eq: ['$inv.invoiceType', 'sell'] }, '$fromU._id', '$toU._id'],
          },
          partyName: {
            $cond: [{ $eq: ['$inv.invoiceType', 'sell'] }, '$fromU.username', '$toU.username'],
          },
          stock: {
            $sum: { $map: { input: '$inv.items', as: 'i', in: { $ifNull: ['$$i.quantity', 0] } } },
          },
          dt: { $ifNull: ['$createdDate', '$createdAt'] },
        },
      },
      { $match: { $expr: { $gt: [{ $toDouble: { $ifNull: ['$_amount', 0] } }, 0] } } },
      {
        $project: {
          _id: 0,
          partyId: 1,
          partyName: 1,
          amount: { $round: [{ $toDouble: '$_amount' }, 2] },
          stock: { $ifNull: ['$stock', 0] },
          date: { $dateToString: { format: '%Y-%m-%d', date: '$dt', timezone: TZ } },
          type: 'party',
        },
      },
      { $sort: { date: 1, partyName: 1 } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
          items: { $push: '$$ROOT' },
        },
      },
      { $project: { _id: 0, totalAmount: { $round: ['$totalAmount', 2] }, count: 1, items: 1 } },
    ];
    const out = await LedgerModel.aggregate(pipeline);
    return out[0] ?? { items: [], totalAmount: 0, count: 0 };
  }
}

export default ReportController;
