import { Request, Response } from 'express';
import { handleValidationError } from '../utils/controllerUtils';
import { controllerWrapper } from '../utils/controllerWrapper';
import config, { logger } from '../config';
import { DataObj } from '../schemas';
import { appendToken, checkToken } from '../utils/mapiUtils';
import axios, { AxiosResponse } from 'axios';
import { v4 as uuid4 } from 'uuid';
import { validateInitResponse, validateNotificationRequest } from '../validators/mapiValidators';
import { createTransaction, getUserByTransactionId, updateTransactionFields } from '../services/transactions';
import { validateUserId } from '../validators/userValidators';
import { getUser, updateUserFields } from '../services/users';


type MAPIMethod = (dataObj: DataObj, password: string) => Promise<AxiosResponse<any, any>>;

const MAPIMethod = (url: string): MAPIMethod => async (dataObj: DataObj, password: string) => {
    const tokenizedDataObj = appendToken(dataObj, password);
    const res = await axios.post(url, tokenizedDataObj);
    return res;
};

const initMethod = MAPIMethod('https://securepay.tinkoff.ru/v2/Init');


export const mapiPaymentInit = controllerWrapper(async (req: Request, res: Response) => {
    const { error: errorReq, value: valueReq } = validateUserId(req.body);
    if (errorReq) {
        return handleValidationError(res, errorReq, 'Invalid user request');
    }
    const user = await getUser(valueReq.user_id);

    if (!user)
        throw new Error('User not found');
    const dataObj = {
        TerminalKey: config.acquiringConfig.terminalKey,
        Amount: config.acquiringConfig.product.amount,
        OrderId: uuid4(),
        Description: config.acquiringConfig.product.description,
        NotificationURL: config.acquiringConfig.notificationURL
    }
    const mapiRes = await initMethod(dataObj, config.acquiringConfig.password);
    const { error, value } = validateInitResponse(mapiRes.data);
    if (error)
        return handleValidationError(res, error, 'An error occured while requesting MAPI.');

    await createTransaction(value.OrderId, value.PaymentId, user.id, value.Amount, value.Status);
    res.status(201).json({ payment_url: value.PaymentURL });
});

export const notificationReceive = controllerWrapper(async (req: Request, res: Response) => {
    const { error, value: valueReq } = validateNotificationRequest(req.body);
    if (error) {
        logger.error(`Notification validation failed: ${error}`);
        return;
    }

    if (!checkToken(valueReq, valueReq.Token, config.acquiringConfig.password)) {
        logger.warn(`Unauthorized access attempt from IP: ${req.ip}`);
        res.status(403).json({ error: 'Unauthorized' });
        return;
    }
    const user = await getUserByTransactionId(valueReq.OrderId);
    if (!user) {
        logger.error('No user available for a given transaction');
        return;
    }

    const userId = user?.user_id;
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + config.expiresIn);
    const transaction = await updateTransactionFields(valueReq.OrderId, { payment_id: valueReq.PaymentId, status: valueReq.Status });
    if (!transaction) {
        throw Error('Transaction update failed.')
    }
    if (transaction.status === 'CONFIRMED') {
        updateUserFields(userId, { trial_state: config.userTrialSubscriptionState, subscription_expiration_date: expDate })
    }
    res.send('OK');
});
