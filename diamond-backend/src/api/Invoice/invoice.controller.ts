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
  }

  private createCompanyInvoice = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { companyId, sellerId, buyerId, brokerId, totalAmount, brokerageAmount, invoiceType } =
        request.body;
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
          console.log('if.....');
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
        console.log('first if.....');
        // Entry 1: Buyer debited for full amount to seller
        ledgerEntries.push({
          companyId,
          invoiceId: invoice._id,
          fromUser: buyerId,
          toUser: sellerId, //company user is seller
          amount: totalAmount,
          type: 'debit',
          description: `Sale invoice #${nextInvoiceNo} - Buyer payment to seller`,
        });

        if (brokerId && brokerageAmount > 0) {
          ledgerEntries.push({
            companyId,
            invoiceId: invoice._id,
            fromUser: sellerId,
            toUser: brokerId,
            amount: brokerageAmount,
            type: 'credit brokerage',
            description: `Sale invoice #${nextInvoiceNo} - Brokerage fee`,
          });
        }
      } else if (invoiceType === 'buy') {
        // Entry 2: Buyer debited for purchase amount (minus brokerage if any)
        ledgerEntries.push({
          companyId,
          invoiceId: invoice._id,
          fromUser: buyerId, //company user is buyer in purchase
          toUser: sellerId,
          amount: totalAmount,
          type: 'credit',
          description: `Purchase invoice #${nextInvoiceNo} - Buyer payment to seller`,
        });

        // Entry 3: Broker credited with brokerage amount (if brokerage exists)
        if (brokerId && brokerageAmount > 0) {
          ledgerEntries.push({
            companyId,
            invoiceId: invoice._id,
            fromUser: buyerId, // Brokerage paid by buyer in purchase
            toUser: brokerId,
            amount: brokerageAmount,
            type: 'credit brokerage',
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

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Invoice Data Get Successfully'
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
}

export default InvoiceController;
