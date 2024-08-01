import Joi from 'joi';

const userIdSchema = Joi.object({
    user_id: Joi.number().required().integer(),
});

export const userSchema = Joi.object({
    //! This could be a cause af fallings
    //id: Joi.string().required().max(36),
    id: Joi.string().max(36),
    user_id: Joi.number().integer().required(),
    username: Joi.string().required(),
    first_name: Joi.string().allow(null),
    last_name: Joi.string().allow(null),
    trial_state: Joi.number().integer().required(),
    subscription_expiration_date: Joi.date().allow(null),
    created_at: Joi.date(),
});

const paymentInitSchema = Joi.object({
    user_id: Joi.number().required().integer(),
    email: Joi.string().required().pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/).messages({
        'string.pattern.base': 'Wrong email format'
    })
});

const userUpdateSchema = userSchema.keys({
    id: Joi.forbidden(),
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
export const validatePaymentInit = (user: any) => paymentInitSchema.validate(user);