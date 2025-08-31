import { Request, Response, NextFunction, response } from 'express';
import { ERROR_MESSAGES, HTTP_STATUS_CODES } from '../constants';
import { RequestWithUserI } from '../interfaces/common.interface';

export const roleAccessMiddleware = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reqWithUser = req as RequestWithUserI;
      const user = reqWithUser.user;

      // Role check
      if (!allowedRoles.includes(user.role)) {
        res.status(HTTP_STATUS_CODES.FORBIDDEN);
        throw new Error(ERROR_MESSAGES.NOT_ACCESS);
      }
      next();
    } catch (error) {
      response.statusCode = HTTP_STATUS_CODES.FORBIDDEN;
      next(error);
    }
  };
};
