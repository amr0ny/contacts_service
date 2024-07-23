import { Request, Response } from 'express';
import { handleValidationError } from '../utils/controllerUtils';
import { controllerWrapper } from '../utils/controllerWrapper';
import config, { logger }  from '../config';
import { DataObj, mapiEndpoints } from '../schemas';
import { appendToken } from '../utils/mapiUtils';
import axios, { AxiosResponse } from 'axios';
import { v4 as uuid4 } from 'uuid';
import { validateInitResponse, validateNotificationRequest } from '../validators/mapiValidators';
import { createTransaction, updateTransactionFields } from '../services/transactions';
import { validateUserId } from '../validators/userValidators';
import { subscribeUser } from '../services/users';


type MAPIMethod = (dataObj: DataObj, password: string) => Promise<AxiosResponse<any, any>>;

const MAPIMethod = (url: string): MAPIMethod => async (dataObj: DataObj, password: string) => {
    const tokenizedDataObj = appendToken(dataObj, password);
    const res = await axios.post(url, tokenizedDataObj);
    return res;
};

const initMethod = MAPIMethod('https://securepay.tinkoff.ru/v2/Init');


export const mapiPaymentInit = controllerWrapper(async (req: Request, res: Response) => {
    logger.debug(`mapiPaymentInit: ${JSON.stringify(req.body)}`);
    const { error: errorReq, value: valueReq }  = validateUserId(req.body);
    if (errorReq) { 
            return handleValidationError(res, errorReq, 'Invalid user request');
    }
    const dataObj = {
        TerminalKey: config.acquiringConfig.terminalKey,
        Amount: config.acquiringConfig.product.amount,
        OrderId: uuid4(),
        Description: config.acquiringConfig.product.description,
    }

    const mapiRes = await initMethod(dataObj, config.acquiringConfig.password);
    logger.debug(`${JSON.stringify(mapiRes.data)}`);
    const { error, value } = validateInitResponse(mapiRes.data);
    if (error) 
        return handleValidationError(res, error, 'An error occured while requesting MAPI.');
    await createTransaction(value.OrderId, value.PaymentId, valueReq.userId, value.Amount, value.Status);
    res.status(201).json({ payment_url: value.PaymentUrl });
});

export const notificationReceive = controllerWrapper(async (req: Request, res: Response) => {
    const { error, value: valueReq } = validateNotificationRequest(req);
    if (error)
        return handleValidationError(res, error, 'Invalid MAPI client request');
    
    const transaction = await updateTransactionFields(valueReq.OrderId, {payment_id: valueReq.PaymentId, status: valueReq.Status });
    if (!transaction) {
        throw Error('Transaction update failed.')
    }
    if (transaction.status === 'CONFIRMED') {
        subscribeUser(valueReq.userId);
    }
});

// в клиент на init кнопку показываем, а после получения notification, записываем в таблу и оповещаем пользователя.