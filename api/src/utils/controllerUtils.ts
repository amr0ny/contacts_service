import { Response } from 'express';
import { logger } from '../config';
import { isError } from '../utils/errors';

export const handleValidationError = (res: Response, error: Error, message: string) => {
  logger.error(`${message}: ${error.message}`);
  res.status(400).json({ error: `${message}: ${error.message}` });
};

export const handleServerError = (res: Response, error: unknown, context: string) => {
  if (isError(error)) {
    logger.error(`An error occurred while ${context}: ${error.message}`);
    res.status(500).json({ error: `An internal server error occurred. ${error.message}` });
  } else {
    logger.error(`An unknown error occurred while ${context}.`);
    res.status(500).json({ error: 'An unknown error occurred.' });
  }
};