import express, { Application, Request, Response, NextFunction } from 'express';
import { apiV1Router } from './routes/apiV1Routes';
const app: Application = express();

app.use(express.json());
app.use('/', apiV1Router);
export default app;
