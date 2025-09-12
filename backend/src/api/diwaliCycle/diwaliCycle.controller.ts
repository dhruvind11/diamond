import { Router, Request, Response, NextFunction, request, response } from 'express';
import { ROUTES, SUCCESS_MESSAGES, HTTP_STATUS_CODES, ERROR_MESSAGES } from '../../constants';
import { ControllerI } from '../../interfaces/common.interface';
import { successResposne } from '../../middleware/apiResponse.middleware';
import LoggerService from '../../services/logger/logger.service';
import MongoService from '../../services/mongo.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { roleAccessMiddleware } from '../../middleware/role.middleware';
import { upload } from '../../middleware/multer.middleware';
import * as bcrypt from 'bcrypt';
import UserModel from '../users/users.model';
import DiwaliCycleModel from './diwaliCycle.model';
import DiwaliCycleValidation from './diwaliCycle.validation';

class DiwaliCycleController implements ControllerI {
  public path = `/${ROUTES.DIWALI_CYCLE_PROFILE}`;
  public router = Router();
  private validation = new DiwaliCycleValidation();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      `${this.path}`,
      authMiddleware,
      this.validation.createDiwaliCycleValidation(),
      this.createDiwaliCycle
    );
    this.router.get(`${this.path}`, authMiddleware, this.getAllDiwaliCycles);
  }

  private createDiwaliCycle = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, startDate, endDate } = req.body;

      if (!year || !startDate || !endDate) {
        return res.status(HTTP_STATUS_CODES.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.COMMON.REQUIRED.replace(':attribute', 'year, startDate, endDate'),
        });
      }

      const diwaliCycle = await DiwaliCycleModel.create({
        year,
        startDate,
        endDate,
      });

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.CREATE_SUCCESS.replace(':attribute', 'Diwali Cycle'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.CREATED,
          data: diwaliCycle,
        },
        req,
        res,
        next
      );
    } catch (error) {
      LoggerService.error(`There was an issue into creating a diwali cycle.: ${error}`);
      return next(error);
    }
  };

  private getAllDiwaliCycles = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycles = await DiwaliCycleModel.find().sort({ startDate: 1 });

      return successResposne(
        {
          message: SUCCESS_MESSAGES.COMMON.FETCH_SUCCESS.replace(':attribute', 'Diwali Cycles'),
          status: SUCCESS_MESSAGES.SUCCESS,
          statusCode: HTTP_STATUS_CODES.OK,
          data: cycles,
        },
        req,
        res,
        next
      );
    } catch (error) {
      LoggerService.error(`There was an issue fetching diwali cycles: ${error}`);
      return next(error);
    }
  };
}

export default DiwaliCycleController;
