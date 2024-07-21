import Joi from 'joi';

const userIdSchema = Joi.object({
    id: Joi.number(),
});

export const userSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    username: Joi.string().required(),
    first_name: Joi.string().optional().allow(null),
    last_name: Joi.string().optional().allow(null),
    trial_state: Joi.number().integer().required(),
    subscription_expiration_date: Joi.date().optional().allow(null),
    created_at: Joi.date().optional(),
});

const userUpdateSchema = userSchema.keys({
    user_id: Joi.forbidden(),
    username: Joi.forbidden(),
    first_name: Joi.forbidden(),
    last_name: Joi.forbidden(),
    trial_state: Joi.number().integer().optional(),
    subscription_expiration_date: Joi.date().optional(),
    created_at: Joi.forbidden()
}).min(1);

export const validateUserId = (user: any) => userIdSchema.validate(user);
export const validateUser = (user: any) => userSchema.validate(user);
export const validateUpdateUser = (user: any) => userUpdateSchema.validate(user, { abortEarly: false });