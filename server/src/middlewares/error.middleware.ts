import { Request, Response, NextFunction } from 'express';
// TODO Person 1: handle errors globally and send consistent error responses
export const errorMiddleware = (err: Error, req: Request, res: Response, next: NextFunction): void => {
  // TODO
};
