import Joi from 'joi';

const userIdSchema = Joi.object({
    id: Joi.number().required().integer(),
});

export const userSchema = Joi.object({
    user_id: Joi.number().integer().required(),
    username: Joi.string().required(),
    first_name: Joi.string().allow(null),
    last_name: Joi.string().allow(null),
    trial_state: Joi.number().integer(),
    subscription_expiration_date: Joi.date().allow(null),
    created_at: Joi.date(),
});

const userUpdateSchema = userSchema.keys({
    user_id: Joi.forbidden(),
    username: Joi.forbidden(),
    first_name: Joi.forbidden(),
    last_name: Joi.forbidden(),
    trial_state: Joi.number().integer(),
    subscription_expiration_date: Joi.date(),
    created_at: Joi.forbidden()
}).min(1);

export const validateUserId = (user: any) => userIdSchema.validate(user);
export const validateUser = (user: any) => userSchema.validate(user);
export const validateUpdateUser = (user: any) => userUpdateSchema.validate(user, { abortEarly: false });