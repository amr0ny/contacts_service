import Joi from 'joi';

const InitResponse = Joi.object({
  Success: Joi.boolean(),
  ErrorCode: Joi.string(),
  TerminalKey: Joi.string().max(20),
  Status: Joi.string(),
  PaymentId: Joi.string().max(20),
  OrderId: Joi.string().max(36),
  Amount: Joi.number(),
  PaymentURL: Joi.string()
});

const NotificationRequest = Joi.object({
  TerminalKey: Joi.string(),
  Amount: Joi.number(),
  OrderId: Joi.string().max(36),
  Success: Joi.boolean(),
  Status: Joi.string().max(20),
  PaymentId: Joi.string().max(20),
  ErrorCode: Joi.string().max(20),
  Message: Joi.string(),
  Details: Joi.string(),
  RebillId: Joi.number(),
  CardId: Joi.number(),
  Pan: Joi.string(),
  ExpDate: Joi.string(),
  Token: Joi.string(),
  DATA: Joi.object()

});
export const validateInitResponse = (res: any) => InitResponse.validate(res);
export const validateNotificationRequest = (req: any) => NotificationRequest.validate(req);