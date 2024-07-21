import { Request, Response, NextFunction } from 'express';
import expressAsyncHandler from 'express-async-handler';
import { handleServerError } from './controllerUtils';

export const controllerWrapper = (controller: (req: Request, res: Response) => Promise<void>) => {
  return expressAsyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      await controller(req, res);
    } catch (error) {
      handleServerError(res, error, controller.name);
      next(error);
    }
  });
};