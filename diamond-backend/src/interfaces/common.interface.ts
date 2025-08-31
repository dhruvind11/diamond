import { Request, Router } from 'express';
import { UserI } from '../api/users/users.interface';

export interface ControllerI {
  path: string;
  router: Router;
}

export interface APIResponseI {
  status: string;
  statusCode: number;
  message: string;
  data?: any;
}

export interface TokenDataI {
  token: string;
  expiresIn: number;
}

export interface DataStoredInTokenI {
  _id: string;
}

export interface RequestWithUserI extends Request {
  user: UserI;
}
