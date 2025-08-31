import { Request, Response, NextFunction, response } from 'express';
import { ERROR_MESSAGES, HTTP_STATUS_CODES } from '../constants';
import * as jwt from 'jsonwebtoken';
import UserModel from '../api/users/users.model';
import mongoose, { Types } from 'mongoose';
import MongoService from '../services/mongo.service';
import { RequestWithUserI } from '../interfaces/common.interface';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authorization = req?.headers?.['authorization'];
    const request = req as RequestWithUserI;

    if (!authorization) {
      response.statusCode = HTTP_STATUS_CODES.UNAUTHORIZED;
      throw new Error(ERROR_MESSAGES.LOGIN_DETAILS_INCORRECT);
    }

    const token = authorization?.split(' ')?.[1]; // remove "Bearear space" string from token

    if (!token) {
      response.statusCode = HTTP_STATUS_CODES.UNAUTHORIZED;
      throw new Error(ERROR_MESSAGES.LOGIN_DETAILS_INCORRECT);
    }

    const JWT_SECRET = process.env.JWT_SECRET || 'JWT_SECRET';

    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded == 'string') {
      response.statusCode = HTTP_STATUS_CODES.UNAUTHORIZED;
      throw new Error(ERROR_MESSAGES.LOGIN_DETAILS_INCORRECT);
    }

    const userId = decoded?._id;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      response.statusCode = HTTP_STATUS_CODES.UNAUTHORIZED;
      throw new Error(ERROR_MESSAGES.LOGIN_DETAILS_INCORRECT);
    }

    const user = await MongoService.findOne(UserModel, {
      query: {
        _id: new Types.ObjectId(userId),
      },
    });

    if (!user) {
      response.statusCode = HTTP_STATUS_CODES.UNAUTHORIZED;
      throw new Error(ERROR_MESSAGES.LOGIN_DETAILS_INCORRECT);
    }

    request['user'] = user;
    next();
  } catch (error) {
    response.statusCode = HTTP_STATUS_CODES.UNAUTHORIZED;
    next(error);
  }
};
