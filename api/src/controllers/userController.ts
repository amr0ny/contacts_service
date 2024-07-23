import { Request, Response } from 'express';
import { validateUser, validateUpdateUser } from '../validators/userValidators';
import { createUser, getUser, updateUserFields } from '../services/users';
import { handleValidationError } from '../utils/controllerUtils';
import { controllerWrapper } from '../utils/controllerWrapper';
import { logger } from '../config';


export const userDetail = controllerWrapper(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return handleValidationError(res, new Error('Invalid user ID'), 'Invalid user ID');
    }
    logger.debug(userId);
    const user = await getUser(userId);
    logger.debug(user);
    if (!user) {
      return handleValidationError(res, new Error('User not found'), 'User with the given user_id is not registered', 404);
    }
  
    const { error: userObjError, value: validatedUser } = validateUser(user);
    if (userObjError) {
      return handleValidationError(res, userObjError, 'Invalid user data fetched from database table');
    }
  
    res.json(validatedUser);
});

export const userCreate = controllerWrapper(async (req: Request, res: Response) => {
  logger.debug(req.body);
  const { error: userError, value: validatedUser } = validateUser(req.body);
  if (userError) {
    return handleValidationError(res, userError, 'Invalid user data');
  }

  const createdUser = await createUser(validatedUser.user_id, validatedUser.username, validatedUser.first_name, validatedUser.last_name);
  res.status(201).json(createdUser);
});

export const userUpdate = controllerWrapper(async (req: Request, res: Response): Promise<void> => {
  const userId = parseInt(req.params.userId, 10);
  if (isNaN(userId)) {
    handleValidationError(res, new Error('Invalid user ID'), 'Invalid user ID');
    return;
  }

  const { error: fieldsError, value: validatedFields } = validateUpdateUser(req.body);
  if (fieldsError) {
    handleValidationError(res, fieldsError, 'Invalid update fields');
    return;
  }

  if (Object.keys(validatedFields).length === 0) {
    res.status(400).json({ message: 'No valid fields to update' });
    return;
  }

  const updatedUser = await updateUserFields(userId, validatedFields);
  if (!updatedUser) {
    handleValidationError(res, new Error('User not found'), 'User not found', 404);
    return;
  }

  res.status(200).json(updatedUser);
});
