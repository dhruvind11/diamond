import { Router, Request, Response, NextFunction } from 'express';
import { ROUTES, SUCCESS_MESSAGES, HTTP_STATUS_CODES, ERROR_MESSAGES } from '../../constants';
import { ControllerI, DataStoredInTokenI, TokenDataI } from '../../interfaces/common.interface';
import MongoService from '../../services/mongo.service';
import AuthValidation from './auth.validation';
import UserModel from '../users/users.model';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserI } from '../users/users.interface';
import { successResposne } from '../../middleware/apiResponse.middleware';
import CompanyProfileModel from '../companyProfile/companyProfile.model';
import { authMiddleware } from '../../middleware/auth.middleware';

class AuthController implements ControllerI {
  public path = `/${ROUTES.AUTH}`;
  public router = Router();
  private validation = new AuthValidation();

  constructor() {
    this.initializeRoutes();
  }
  private initializeRoutes() {
    this.router.post(`${this.path}/login`, this.validation.loginValidation(), this.login);
    this.router.get(`${this.path}/profile`, authMiddleware, this.getCurrentUser);
  }

  private login = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { email, password } = request.body;

      const user = await MongoService.findOne(UserModel, {
        query: { email: email },
        select: 'username role password email companyId',
      });

      if (!user) {
        response.statusCode = HTTP_STATUS_CODES.NOT_FOUND;
        throw new Error(ERROR_MESSAGES.LOGIN_DETAILS_INCORRECT);
      }

      const isPasswordMatching = await bcrypt.compare(password, user.password);
      if (!isPasswordMatching) {
        throw new Error(ERROR_MESSAGES.LOGIN_DETAILS_INCORRECT);
      }

      if (user.role !== 'Company') {
        throw new Error(ERROR_MESSAGES.AUTH.ROLE_NOT_ALLOWED);
      }

      let company = null;
      if (user?.companyId) {
        company = await MongoService.findOne(CompanyProfileModel, {
          query: { _id: user.companyId },
          select: 'companyName logoImage address phone note',
        });
      }

      const JWT_SECRET = process.env.JWT_SECRET || 'JWT_SECRET';
      const tokenData = this.createToken(user, JWT_SECRET, 1);
      const token = tokenData.token;

      const REFRESH_JWT_SECRET = process.env.REFRESH_JWT_SECRET || 'REFRESH_JWT_SECRET';
      const refreshTokenData = this.createToken(user, REFRESH_JWT_SECRET, 31);

      // update users token
      await MongoService.findOneAndUpdate(UserModel, {
        query: { _id: user._id },
        updateData: { $set: { token } },
      });

      delete user.password;

      const responseData = {
        tokenData: tokenData,
        refreshTokenData,
        userData: user,
        company,
      };

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(':action', 'Logged In'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: responseData,
        },
        request,
        response,
        next
      );
    } catch (error) {
      console.log('There was an issue into login: ', error);
      response.statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
      return next(error);
    }
  };

  private getCurrentUser = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const user = (request as any)?.user;
      let company = null;
      if (user.companyId) {
        company = await MongoService.findOne(CompanyProfileModel, {
          query: { _id: user.companyId },
          select: 'companyName logoImage address phone note',
        });
      }
      const responseData = {
        user,
        company,
      };
      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.ACTION_SUCCESS.replace(
            ':action',
            'Profile Data Get Successfully'
          ),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: responseData,
        },
        request,
        response,
        next
      );
    } catch (error) {
      console.log('There was an issue into profile: ', error);
      response.statusCode = HTTP_STATUS_CODES.BAD_REQUEST;
      return next(error);
    }
  };
  private createToken(user: UserI, JWT_SECRET: string, days: number): TokenDataI {
    const expiresIn = days * 24 * 60 * 60;
    // const expiresIn = 1 * 60; // 5 minutes temporary for test

    const dataStoredInToken: DataStoredInTokenI = {
      _id: user._id,
    };

    return {
      expiresIn,
      token: jwt.sign(dataStoredInToken, JWT_SECRET, { expiresIn }),
    };
  }
}

export default AuthController;
