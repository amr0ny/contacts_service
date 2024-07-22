import express, { Application, Request, Response, NextFunction } from 'express';
import { apiV1Router } from './routes/apiV1Routes';
import { initUserTable } from './services/users';
import { logger } from './config';


initUserTable().then(() => logger.info('User table is OK'));
const app: Application = express();

app.use(express.json());
app.use('/', apiV1Router);
export default app;
