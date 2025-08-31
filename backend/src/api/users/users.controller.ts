import { Router, Request, Response, NextFunction } from 'express';
import { ROUTES, SUCCESS_MESSAGES, HTTP_STATUS_CODES, ERROR_MESSAGES } from '../../constants';
import { ControllerI } from '../../interfaces/common.interface';
import { successResposne } from '../../middleware/apiResponse.middleware';
import LoggerService from '../../services/logger/logger.service';
import MongoService from '../../services/mongo.service';
import UserModel from './users.model';
import CompanyProfileModel from '../companyProfile/companyProfile.model';
import * as bcrypt from 'bcrypt';
import UsersValidation from './users.validation';
import { authMiddleware } from '../../middleware/auth.middleware';

class UserController implements ControllerI {
  public path = `/${ROUTES.USERS}`;
  public router = Router();
  private validation = new UsersValidation();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}/create-admin-user`,
      this.validation.createAdminUserValidation(),
      this.createAdminUser
    );

    // this.router.post(
    //   `${this.path}/create-broker-user`,
    //   authMiddleware,
    //   this.validation.createAdminUserValidation(),
    //   this.createBrokerUser
    // );

    this.router.post(
      `${this.path}/create-party-user`,
      authMiddleware,
      this.validation.createAdminUserValidation(),
      this.createPartyUser
    );
    this.router.get(
      `${this.path}/:companyId`,
      authMiddleware,
      // this.validation.createAdminUserValidation(),
      this.getCompanyUsers
    );
    this.router.delete(
      `${this.path}/:id`,
      authMiddleware,
      // this.validation.createAdminUserValidation(),
      this.deleteCompanyUsers
    );
    this.router.patch(
      `${this.path}/:id`,
      authMiddleware,
      // this.validation.createAdminUserValidation(),
      this.updateCompanyUsers
    );
  }

  private createAdminUser = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { username, companyId, password, email } = request.body;

      const defaultRole = 'Admin';

      const company = await MongoService.findOne(CompanyProfileModel, {
        query: { _id: companyId },
      });

      if (!company) {
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'company details'));
      }

      // check user already exists or not
      const isEmailAlreadyExists = await MongoService.findOne(UserModel, {
        query: { email: email },
        select: 'email',
      });

      if (isEmailAlreadyExists) {
        throw new Error(ERROR_MESSAGES.COMMON.ALREADY_EXISTS.replace(':attribute', 'user'));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await MongoService.create(UserModel, {
        insert: { username, companyId, role: defaultRole, email, password: hashedPassword },
      });

      const userResponseData = user.toObject();

      delete userResponseData.password;

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'User'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.CREATED,
          data: userResponseData,
        },
        request,
        response,
        next
      );
    } catch (error) {
      LoggerService.error(`There was an issue into creating an user.: ${error}`);
      response.status(HTTP_STATUS_CODES.BAD_REQUEST);
      return next(error);
    }
  };

  // private createBrokerUser = async (request: Request, response: Response, next: NextFunction) => {
  //   try {
  //     const { username, companyId, password, email, address } = request.body;
  //     const defaultRole = 'Broker';

  //     const company = await MongoService.findOne(CompanyProfileModel, {
  //       query: { _id: companyId },
  //     });

  //     if (!company) {
  //       throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'company details'));
  //     }

  //     const isEmailAlreadyExists = await MongoService.findOne(UserModel, {
  //       query: { email },
  //       select: 'email',
  //     });

  //     if (isEmailAlreadyExists) {
  //       throw new Error(ERROR_MESSAGES.COMMON.ALREADY_EXISTS.replace(':attribute', 'user'));
  //     }

  //     const hashedPassword = await bcrypt.hash(password, 10);

  //     const user = await MongoService.create(UserModel, {
  //       insert: {
  //         username,
  //         companyId,
  //         role: defaultRole,
  //         email,
  //         password: hashedPassword,
  //         address,
  //       },
  //     });

  //     const userResponseData = user.toObject();
  //     delete userResponseData.password;

  //     return successResposne(
  //       {
  //         message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'User'),
  //         status: SUCCESS_MESSAGES.SUCCESS,
  //         statusCode: HTTP_STATUS_CODES.CREATED,
  //         data: userResponseData,
  //       },
  //       request,
  //       response,
  //       next
  //     );
  //   } catch (error) {
  //     LoggerService.error(`There was an issue into creating a broker user.: ${error}`);
  //     response.status(HTTP_STATUS_CODES.BAD_REQUEST);
  //     return next(error);
  //   }
  // };

  private createPartyUser = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { username, companyId, password, email, address } = request.body;
      const defaultRole = 'Party';

      const company = await MongoService.findOne(CompanyProfileModel, {
        query: { _id: companyId },
      });

      if (!company) {
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'company details'));
      }

      const isEmailAlreadyExists = await MongoService.findOne(UserModel, {
        query: { email },
        select: 'email',
      });

      if (isEmailAlreadyExists) {
        throw new Error(ERROR_MESSAGES.COMMON.ALREADY_EXISTS.replace(':attribute', 'user'));
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await MongoService.create(UserModel, {
        insert: {
          username,
          companyId,
          role: defaultRole,
          email,
          password: hashedPassword,
          address,
        },
      });

      const userResponseData = user.toObject();
      delete userResponseData.password;

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'User'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.CREATED,
          data: userResponseData,
        },
        request,
        response,
        next
      );
    } catch (error) {
      LoggerService.error(`There was an issue into creating a party user.: ${error}`);
      response.status(HTTP_STATUS_CODES.BAD_REQUEST);
      return next(error);
    }
  };

  private getCompanyUsers = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { companyId } = request.params;
      if (!companyId) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'company id'));
      }
      const users = await MongoService.find(UserModel, {
        query: { companyId, role: { $ne: 'Company' } },
      });
      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Company User Data Get Successfully'
          ),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: users,
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

  private deleteCompanyUsers = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { id } = request.params;
      if (!id) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'user id'));
      }
      const user = await MongoService.findByIdAndDelete(UserModel, {
        query: { _id: id },
      });
      if (!user) {
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'user'));
      }
      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Company User delete Successfully'
          ),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: user,
        },
        request,
        response,
        next
      );
    } catch (error) {
      console.log('There was an issue into delete company user: ', error);
      response.statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
      return next(error);
    }
  };

  private updateCompanyUsers = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      if (!id) {
        throw new Error(ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'user id'));
      }
      if (updateData.password) {
        const hashedPassword = await bcrypt.hash(updateData.password, 10);
        updateData.password = hashedPassword;
      }
      const user = await MongoService.findOneAndUpdate(UserModel, {
        query: { _id: id },
        updateData,
        updateOptions: { new: true },
      });
      if (!user) {
        throw new Error(ERROR_MESSAGES.COMMON.NOT_FOUND.replace(':attribute', 'user'));
      }
      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Company User Update Successfully'
          ),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: user,
        },
        request,
        response,
        next
      );
    } catch (error) {
      console.log('There was an issue into update company user: ', error);
      response.statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
      return next(error);
    }
  };
}

export default UserController;
