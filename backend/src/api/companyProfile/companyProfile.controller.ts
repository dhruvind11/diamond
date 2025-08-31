import { Router, Request, Response, NextFunction } from 'express';
import { ROUTES, SUCCESS_MESSAGES, HTTP_STATUS_CODES, ERROR_MESSAGES } from '../../constants';
import { ControllerI } from '../../interfaces/common.interface';
import { successResposne } from '../../middleware/apiResponse.middleware';
import LoggerService from '../../services/logger/logger.service';
import MongoService from '../../services/mongo.service';
import CompanyProfileModel from './companyProfile.model';
import CompanyProfileValidation from './companyProfile.validation';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleAccessMiddleware } from '../../middleware/role.middleware';
import { upload } from '../../middleware/multer.middleware';
import * as bcrypt from 'bcrypt';
import UserModel from '../users/users.model';

class CompanyProfileController implements ControllerI {
  public path = `/${ROUTES.COMPANY_PROFILE}`;
  public router = Router();
  private validation = new CompanyProfileValidation();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}`,
      authMiddleware,
      roleAccessMiddleware(['Admin']),
      upload.single('logoImage'),
      this.validation.createCompanyValidation(),
      this.createCompanyProfile
    );
  }

  private createCompanyProfile = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const { companyName, email, address, phone, note, password } = request.body;
      const defaultRole = 'Company';

      const logoImage = request?.file?.path || null;
      const existingCompany = await MongoService.findOne(CompanyProfileModel, {
        query: { email },
      });
      if (existingCompany) {
        throw new Error(ERROR_MESSAGES.COMMON.ALREADY_EXISTS.replace(':attribute', 'company'));
      }
      const company = await MongoService.create(CompanyProfileModel, {
        insert: { companyName, email, address, phone, note, logoImage },
      });
      const hashedPassword = await bcrypt.hash(password, 10);
      await MongoService.create(UserModel, {
        insert: {
          username: companyName,
          companyId: company._id,
          role: defaultRole,
          email,
          password: hashedPassword,
        },
      });

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'Company'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.CREATED,
          data: company,
        },
        request,
        response,
        next
      );
    } catch (error) {
      LoggerService.error(`There was an issue into creating a company profile.: ${error}`);
      return next(error);
    }
  };
}

export default CompanyProfileController;
