/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from 'express';
import { HTTP_STATUS_CODES, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../constants';
import { APIResponseI } from '../interfaces/common.interface';

export const errorResponse = (
  error: APIResponseI,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const statusCode = response.statusCode || HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR;
  const message = error.message || ERROR_MESSAGES.SOMETHING_WENT_WRONG;

  response.status(statusCode).send({
    message,
    status: ERROR_MESSAGES.ERROR,
    success: false,
    statusCode,
  });
};

export const successResposne = (
  success: APIResponseI,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  const statusCode = success.statusCode || HTTP_STATUS_CODES.OK;
  const message = success.message || SUCCESS_MESSAGES.SUCCESS;

  response.status(statusCode).send({
    message,
    status: SUCCESS_MESSAGES.SUCCESS,
    statusCode,
    success: true,
    data: success.data,
  });
};
