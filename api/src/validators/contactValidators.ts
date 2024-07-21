// validators/cityValidator.ts
import Joi from 'joi';
import { ContactPresentable } from '../schemas';


const citySchema = Joi.object({
  city: Joi.string(),
});

const contactSchema = Joi.object({
  id: Joi.number().required(),
  name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  city: Joi.string().required(),
  phone_1: Joi.string().optional().allow(''),
  phone_2: Joi.string().optional().allow(''),
  phone_3: Joi.string().optional().allow(''),
  telegram_1: Joi.string().optional().allow(''),
  telegram_2: Joi.string().optional().allow(''),
  telegram_3: Joi.string().optional().allow(''),
});

const contactPresentableSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  city: Joi.string().required(),
  phone_1: Joi.string().optional().allow(''),
});

export const validateCityName = (city: any) => citySchema.validate(city);
export const validateContact = (contact: any) => contactSchema.validate(contact);
export const validateContactPresentable = (contact: ContactPresentable) => contactPresentableSchema.validate(contact);