import { contactsByCityList, cityNamesList } from "../controllers/contactController";
import { userDetail, userCreate, userUpdate } from "../controllers/userController";
import { Router } from 'express';

export const apiV1Router = Router();

apiV1Router.get('/api/v1/users/:userId', userDetail);
apiV1Router.post('/api/v1/users/', userCreate);
apiV1Router.patch('/api/v1/users/:userId', userUpdate);
apiV1Router.get('/api/v1/contacts/cities', cityNamesList);
apiV1Router.get('/api/v1/contacts/:cityName', contactsByCityList);