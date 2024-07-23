import { notificationReceive } from "../controllers/mapiController";
import { Router } from 'express';

export const apiV2Router = Router();

apiV2Router.post('/api/v2/Notification', notificationReceive);
