import { Router, Request, Response, NextFunction } from 'express';
import { ERROR_MESSAGES, HTTP_STATUS_CODES, ROUTES, SUCCESS_MESSAGES } from '../../constants';
import { ControllerI } from '../../interfaces/common.interface';
import { authMiddleware } from '../../middleware/auth.middleware';
import LoggerService from '../../services/logger/logger.service';
import { successResposne } from '../../middleware/apiResponse.middleware';
import InvoiceValidation from './invoice.validation';
import MongoService from '../../services/mongo.service';
import InvoiceModel from './invoice.model';
import CompanyProfileModel from '../companyProfile/companyProfile.model';
import UserModel from '../users/users.model';
import LedgerModel from '../ledger/ledger.model';

class InvoiceController implements ControllerI {
  public path = `/${ROUTES.INVOICE}`;
  public router = Router();
  private validation = new InvoiceValidation();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}`,
      authMiddleware,
      this.validation.createInvoiceValidation(),
      this.createCompanyInvoice
    );
    this.router.get(
      `${this.path}/next-number`,
      authMiddleware,
      // this.validation.createInvoiceValidation(),
      this.getNextInvoiceNumber
    );
    this.router.get(
      `${this.path}/:companyId`,
      authMiddleware,
      // this.validation.createInvoiceValidation(),
      this.getCompanyInvoice
    );

    this.router.get(`${this.path}/details/:invoiceId`, authMiddleware, this.getInvoiceById);
    this.router.delete(`${this.path}/:invoiceId`, authMiddleware, this.deleteInvoice);

    this.router.post(`${this.path}/payment/:invoiceId`, authMiddleware, this.makePayment);
    this.router.post(`${this.path}/close-payment/:invoiceId`, authMiddleware, this.closePayment);
  }

  private createCompanyInvoice = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const {
        companyId,
        sellerId,
        buyerId,
        brokerId,
        totalAmount,
        brokerageAmount,
        invoiceType,
        createdDate,
      } = request.body;
      console.log('invoiceType', invoiceType);
      const existingCompany = await MongoService.findOne(CompanyProfileModel, {
        query: { _id: companyId },
      });

      if (!existingCompany) {
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'company details'));
      }

      if (sellerId && buyerId && sellerId.toString() === buyerId.toString()) {
        throw new Error(
          ERROR_MESSAGES.COMMON.INVALID.replace(':attribute', 'Seller and Buyer cannot be the same')
        );
      }

      if (sellerId) {
        const seller = await MongoService.findOne(UserModel, {
          query: { _id: sellerId, companyId },
        });
        if (!seller) {
          throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'seller'));
        }
      }

      if (buyerId) {
        const buyer = await MongoService.findOne(UserModel, {
          query: { _id: buyerId, companyId },
        });
        if (!buyer) {
          throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'buyer'));
        }
      }

      if (brokerId) {
        const broker = await MongoService.findOne(UserModel, {
          query: { _id: brokerId, companyId },
        });
        if (!broker) {
          throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'broker'));
        }
      }

      const lastInvoice = await MongoService.findOne(InvoiceModel, {
        query: {},
        sort: { invoiceNo: -1 },
      });
      let nextInvoiceNo = 1;
      if (lastInvoice) {
        nextInvoiceNo = lastInvoice.invoiceNo + 1;
      }
      console.log('lastInvoice', lastInvoice);
      const invoice = await MongoService.create(InvoiceModel, {
        insert: { ...request.body, invoiceNo: nextInvoiceNo },
      });
      const ledgerEntries = [];

      if (invoiceType === 'sell') {
        ledgerEntries.push({
          companyId,
          invoiceId: invoice._id,
          fromUser: buyerId,
          toUser: sellerId,
          createdDate,
          amount: 0,
          pendingAmount: totalAmount,
          type: 'debit',
          description: `Sale invoice #${nextInvoiceNo} - Buyer payment to seller`,
        });

        if (brokerId && brokerageAmount > 0) {
          ledgerEntries.push({
            companyId,
            invoiceId: invoice._id,
            fromUser: sellerId,
            toUser: brokerId,
            createdDate,
            amount: 0,
            pendingAmount: brokerageAmount,
            type: 'credit brokerage',
            description: `Sale invoice #${nextInvoiceNo} - Brokerage fee`,
          });
        }
      } else if (invoiceType === 'buy') {
        ledgerEntries.push({
          companyId,
          invoiceId: invoice._id,
          fromUser: buyerId,
          toUser: sellerId,
          amount: 0,
          createdDate,
          pendingAmount: totalAmount,
          type: 'credit',
          description: `Purchase invoice #${nextInvoiceNo} - Buyer payment to seller`,
        });

        if (brokerId && brokerageAmount > 0) {
          ledgerEntries.push({
            companyId,
            invoiceId: invoice._id,
            fromUser: buyerId,
            toUser: brokerId,
            amount: 0,
            createdDate,
            type: 'credit brokerage',
            pendingAmount: brokerageAmount,
            description: `Purchase invoice #${nextInvoiceNo} - Brokerage fee`,
          });
        }
      }
      if (ledgerEntries.length) {
        await MongoService.insertMany(LedgerModel, { insert: ledgerEntries });
      }
      console.log('ledgerEntries', ledgerEntries);
      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'Invoice'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.CREATED,
          data: invoice,
        },
        request,
        response,
        next
      );
    } catch (error) {
      LoggerService.error(`There was an issue into creating a company Invoice.: ${error}`);
      return next(error);
    }
  };

  private getCompanyInvoice = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { companyId } = request.params;
      if (!companyId) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'company id'));
      }
      const invoice = await MongoService.find(InvoiceModel, {
        query: { companyId },
        populate: [
          {
            path: 'sellerId',
            model: 'User',
            select: 'username email',
          },
          {
            path: 'buyerId',
            model: 'User',
            select: 'username email',
          },
        ],
      });
      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Company Invoice Data Get Successfully'
          ),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: invoice,
        },
        request,
        response,
        next
      );
    } catch (error) {
      console.log('There was an issue into get company user: ', error);
      response.statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
      return next(error);
    }
  };

  private getNextInvoiceNumber = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const lastInvoice: any = await MongoService.findOne(InvoiceModel, {
        sort: { invoiceNo: -1 },
      });
      console.log('lastInvoice', lastInvoice);
      let nextInvoiceNo = 1;
      if (lastInvoice) {
        nextInvoiceNo = lastInvoice.invoiceNo + 1;
      }
      console.log('nextInvoiceNo', nextInvoiceNo);
      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Company Invoice Number Get Successfully'
          ),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: nextInvoiceNo,
        },
        request,
        response,
        next
      );
    } catch (error) {
      console.log('There was an issue into get company user: ', error);
      response.statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
      return next(error);
    }
  };

  private getInvoiceById = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { invoiceId } = request.params;

      if (!invoiceId) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'invoice id'));
      }

      const invoice = await MongoService.findOne(InvoiceModel, {
        query: { _id: invoiceId },
        populate: [
          {
            path: 'sellerId',
            model: 'User',
            select: 'username email',
          },
          {
            path: 'buyerId',
            model: 'User',
            select: 'username email',
          },
          {
            path: 'brokerId',
            model: 'User',
            select: 'username email',
          },
        ],
      });

      if (!invoice) {
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'Invoice'));
      }
      console.log('invoice', invoice);

      const payments = await LedgerModel.find({ invoiceId })
        .populate([
          { path: 'fromUser', model: 'User', select: 'username email' },
          { path: 'toUser', model: 'User', select: 'username email' },
        ])
        .sort({ createdAt: -1 });
      console.log('payments', payments);
      const result = {
        ...invoice,
        payments,
      };
      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Invoice Data Get Successfully'
          ),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: result,
        },
        request,
        response,
        next
      );
    } catch (error) {
      LoggerService.error(`There was an issue fetching Invoice by ID: ${error}`);
      response.statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
      return next(error);
    }
  };

  private deleteInvoice = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { invoiceId } = request.params;

      if (!invoiceId) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'invoice id'));
      }

      const invoice = await MongoService.findOne(InvoiceModel, { query: { _id: invoiceId } });
      if (!invoice) {
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'Invoice'));
      }

      await MongoService.deleteMany(LedgerModel, { query: { invoiceId } });
      await MongoService.deleteOne(InvoiceModel, { query: { _id: invoiceId } });

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.DELETE_SUCCESS.replace(':attribute', 'Invoice'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: { deletedInvoiceId: invoiceId },
        },
        request,
        response,
        next
      );
    } catch (error) {
      LoggerService.error(`There was an issue deleting Invoice: ${error}`);
      return next(error);
    }
  };

  private makePayment = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { invoiceId } = request.params;
      const { amount, createdDate, description } = request.body;

      if (!invoiceId || !amount) {
        throw new Error(
          ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'invoiceId and amount')
        );
      }

      const invoice: any = await MongoService.findOne(InvoiceModel, { query: { _id: invoiceId } });
      if (!invoice) {
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'Invoice'));
      }

      if (invoice?.isClosed) {
        throw new Error('Invoice is already closed, no more payments allowed.');
      }

      if (amount > invoice.dueAmount) {
        throw new Error('Payment exceeds remaining due amount');
      }

      const updatedPaidAmount = (invoice.paidAmount || 0) + amount;
      const updatedDueAmount = (invoice.dueAmount || invoice.totalAmount) - amount;

      let paymentStatus = 'Unpaid';
      let billStatus = 'In Progress';
      let isClosed = false;
      let closedPaymentDate;

      if (updatedDueAmount === 0) {
        paymentStatus = 'Paid';
        billStatus = 'Complete';
        closedPaymentDate = createdDate ? new Date(createdDate) : new Date();
        isClosed = true;
      }

      const updatedInvoiceRaw = await MongoService.findOneAndUpdate(InvoiceModel, {
        query: { _id: invoiceId },
        updateData: {
          $set: {
            paidAmount: updatedPaidAmount,
            dueAmount: updatedDueAmount,
            paymentStatus,
            billStatus,
            isClosed,
          },
        },
        updateOptions: { new: true },
      });

      const updatedInvoice = await MongoService.findById(InvoiceModel, {
        query: updatedInvoiceRaw._id,
        populate: [
          { path: 'buyerId', select: 'username email' },
          { path: 'sellerId', select: 'username email' },
        ],
      });

      let ledgerType: 'credit' | 'debit' = 'credit';
      let ledgerDescription = description;

      if (invoice.invoiceType === 'sell') {
        ledgerType = 'credit';
        ledgerDescription =
          ledgerDescription ||
          `Received payment of ${amount} from Buyer for Sale Invoice #${invoice.invoiceNo}`;
      } else if (invoice.invoiceType === 'buy') {
        ledgerType = 'debit';
        ledgerDescription =
          ledgerDescription || `Paid ${amount} to Seller for Buy Invoice #${invoice.invoiceNo}`;
      }

      const ledgerEntry = await MongoService.create(LedgerModel, {
        insert: {
          companyId: invoice.companyId,
          invoiceId: invoice._id,
          fromUser: invoice.buyerId,
          toUser: invoice.sellerId,
          createdDate,
          amount,
          pendingAmount: updatedDueAmount,
          type: ledgerType,
          description: ledgerDescription,
        },
      });

      let brokerEntry: any = null;
      if (isClosed && invoice?.brokerId && invoice?.brokerageAmount > 0) {
        brokerEntry = await MongoService.create(LedgerModel, {
          insert: {
            companyId: invoice.companyId,
            invoiceId: invoice._id,
            fromUser: invoice.invoiceType === 'sell' ? invoice.sellerId : invoice.buyerId,
            toUser: invoice.brokerId,
            createdDate,
            amount: invoice.brokerageAmount,
            pendingAmount: 0,
            type: 'debit brokerage',
            description: `Brokerage of ₹${invoice.brokerageAmount} for Invoice #${invoice.invoiceNo}`,
          },
        });
      }
      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Payment Made Successfully'
          ),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: {
            invoice: updatedInvoice,
            ledgerEntry,
          },
        },
        request,
        response,
        next
      );
    } catch (error) {
      LoggerService.error(`Error while making payment: ${error}`);
      return next(error);
    }
  };

  private closePayment = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { invoiceId } = request.params;
      const { amount, createdDate, description } = request.body || {};

      if (!invoiceId) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'invoiceId'));
      }

      if (amount === undefined || amount === null || isNaN(Number(amount))) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'amount'));
      }

      const invoice: any = await MongoService.findOne(InvoiceModel, { query: { _id: invoiceId } });

      if (!invoice) {
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'Invoice'));
      }

      if (invoice.isClosed) {
        throw new Error('Invoice is already closed, no more payments allowed.');
      }

      if (invoice.dueAmount <= 0) {
        throw new Error('No due amount left to close.');
      }
      const numericAmount = Number(amount);
      const paymentDate = createdDate ? new Date(createdDate) : new Date();
      const discountAmount = Number(invoice.dueAmount) - numericAmount;
      const updatedPaidAmount = (invoice.paidAmount || 0) + amount;

      let newBrokerageAmount = 0;
      if (updatedPaidAmount !== invoice?.totalAmount && discountAmount > 0) {
        newBrokerageAmount = (updatedPaidAmount * invoice.brokeragePercentage) / 100;
      } else {
        newBrokerageAmount = invoice.brokerageAmount;
      }

      const closeDate = new Date();

      const updatedInvoiceRaw = await MongoService.findOneAndUpdate(InvoiceModel, {
        query: { _id: invoiceId },
        updateData: {
          $set: {
            dueAmount: 0,
            paidAmount: updatedPaidAmount,
            isClosed: true,
            paymentStatus: 'Paid',
            billStatus: 'Complete',
            closedPaymentDate: paymentDate,
            brokerageAmount: newBrokerageAmount,
          },
        },
        updateOptions: { new: true },
      });

      const updatedInvoice = await MongoService.findById(InvoiceModel, {
        query: updatedInvoiceRaw._id,
        populate: [
          { path: 'buyerId', select: 'username email' },
          { path: 'sellerId', select: 'username email' },
        ],
      });

      let ledgerType: 'credit' | 'debit' = 'credit';
      let ledgerDescription = description;

      if (invoice.invoiceType === 'sell') {
        ledgerType = 'credit';
        ledgerDescription =
          ledgerDescription ||
          `Received payment of ${amount} from Buyer for Sale Invoice #${invoice.invoiceNo}`;
      } else if (invoice.invoiceType === 'buy') {
        ledgerType = 'debit';
        ledgerDescription =
          ledgerDescription || `Paid ${amount} to Seller for Buy Invoice #${invoice.invoiceNo}`;
      }

      const ledgerEntry = await MongoService.create(LedgerModel, {
        insert: {
          companyId: invoice.companyId,
          invoiceId: invoice._id,
          fromUser: invoice.buyerId,
          toUser: invoice.sellerId,
          createdDate: paymentDate,
          amount: numericAmount,
          pendingAmount: discountAmount,
          type: ledgerType,
          description: ledgerDescription,
        },
      });

      if (discountAmount > 0) {
        if (invoice.invoiceType === 'sell') {
          ledgerDescription = `Closed invoice #${invoice.invoiceNo}, due ${discountAmount} waived as discount (sale).`;
        } else if (invoice.invoiceType === 'buy') {
          ledgerDescription = `Closed invoice #${invoice.invoiceNo}, due ${discountAmount} waived as discount (purchase).`;
        }
        await MongoService.create(LedgerModel, {
          insert: {
            companyId: invoice.companyId,
            invoiceId: invoice._id,
            fromUser: invoice.buyerId,
            toUser: invoice.sellerId,
            createdDate: paymentDate,
            amount: discountAmount,
            pendingAmount: 0,
            type: 'discount',
            description: ledgerDescription,
          },
        });
        const creditBrokerageRow = await MongoService.findOne(LedgerModel, {
          query: { invoiceId: invoice._id, type: 'credit brokerage' },
          sort: { createdAt: 1 },
        });
        await MongoService.findOneAndUpdate(LedgerModel, {
          query: { _id: creditBrokerageRow._id },
          updateData: {
            $set: {
              pendingAmount: newBrokerageAmount,
              description: `Brokerage revised to ₹${newBrokerageAmount} on close (paid ₹${updatedPaidAmount}).`,
            },
          },
          updateOptions: { new: true },
        });
      }

      const brokerageEntry = await MongoService.create(LedgerModel, {
        insert: {
          companyId: invoice.companyId,
          invoiceId: invoice._id,
          fromUser: invoice.invoiceType === 'sell' ? invoice.sellerId : invoice.buyerId,
          toUser: invoice.brokerId,
          createdDate: paymentDate,
          amount: newBrokerageAmount || 0,
          pendingAmount: 0,
          type: 'debit brokerage',
          description: `Brokerage debit entry for closed invoice #${invoice.invoiceNo}`,
        },
      });

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Invoice Closed Successfully (due considered as discount)'
          ),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: {
            invoice: updatedInvoice,
            ledgerEntries: {
              discount: ledgerEntry,
              brokerage: brokerageEntry,
            },
          },
        },
        request,
        response,
        next
      );
    } catch (error) {
      LoggerService.error(`Error while closing payment: ${error}`);
      return next(error);
    }
  };
}

export default InvoiceController;
