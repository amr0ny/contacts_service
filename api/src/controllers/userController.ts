import { Request, Response } from 'express';
import { validateUserId, validateUser, validateUpdateUser } from '../validators/userValidators';
import { createUser, getUser, updateUserFields } from '../services/users';
import { handleValidationError } from '../utils/controllerUtils';
import { controllerWrapper } from '../utils/controllerWrapper';
import { logger } from '../config';


export const userDetail = controllerWrapper(async (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      return handleValidationError(res, new Error('Invalid user ID'), 'Invalid user ID');
    }
  
    const user = await getUser(userId);
    if (!user) {
      return handleValidationError(res, new Error('User not found'), 'User not found');
    }
  
    const { error: userObjError, value: validatedUser } = validateUser(user);
    if (userObjError) {
      return handleValidationError(res, userObjError, 'Invalid user data fetched from database table');
    }
  
    res.json(validatedUser);
});

export const userCreate = controllerWrapper(async (req: Request, res: Response) => {
  const { error: userError, value: validatedUser } = validateUser(req.body);
  if (userError) {
    return handleValidationError(res, userError, 'Invalid user data');
  }

  await createUser(validatedUser.id, validatedUser.username, validatedUser.firstName, validatedUser.lastName);
  res.status(200).json({});
});

export const userUpdate = controllerWrapper(async (req: Request, res: Response): Promise<void> => {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      handleValidationError(res, new Error('Invalid user ID'), 'Invalid user ID');
      return;
    }
    logger.debug(req.body);
    const { error: fieldsError, value: validatedFields } = validateUpdateUser(req.body);
    if (fieldsError) {
      handleValidationError(res, fieldsError, 'Invalid update fields');
      return;
    }
  
    if (Object.keys(validatedFields).length === 0) {
      res.status(400).json({ message: 'No valid fields to update' });
      return;
    }
  
    await updateUserFields(userId, validatedFields);
    res.status(200).json({ message: 'User updated successfully' });
  });