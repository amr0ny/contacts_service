import { Request, Response } from 'express';
import { getCityNames, getContactsByCity } from '../services/contacts';
import { validateCityName, validateContactPresentable } from '../validators/contactValidators';
import { handleValidationError } from '../utils/controllerUtils';
import { controllerWrapper } from '../utils/controllerWrapper';
import { logger } from '../config';

export const contactsByCityList = controllerWrapper(async (req: Request, res: Response) => {
    const { cityName } = req.params;
    
    const { error: cityError, value: cityValue } = validateCityName({ city: cityName });
    if (cityError) {
      return handleValidationError(res, cityError, 'Invalid city name');
    }
  
    const contacts = await getContactsByCity(cityValue.city);
    const validatedContacts = contacts
      .map(contact => {
        const { error, value } = validateContactPresentable(contact);
        if (error) {
            return handleValidationError(res, error, 'Invalid contact data for city');
        }
        return value;
      })
      .filter(Boolean);
  
    res.json(validatedContacts);
  });

export const cityNamesList = controllerWrapper(async (req: Request, res: Response) => {
  const cityNames = await getCityNames();
    logger.debug(cityNames);
  const validatedCities = cityNames
    .map(city => {
      const { error, value } = validateCityName(city);
      if (error) {
        return handleValidationError(res, error, 'Invalid data for city');
      }
      return value;
    })
    .filter(Boolean);

  res.json(validatedCities);
});
