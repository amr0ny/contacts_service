import express, { Application } from 'express';
import cors from 'cors';
import { apiV1Router } from './routes/apiV1Routes';
import config, { logger } from './config';
import { apiV2Router } from './routes/apiV2Routes';
import { initDbExtensions, initTransactionTable, initUserTable } from './services/init';
import helmet from 'helmet';

initDbExtensions().then(() => logger.info('Necessary extensions are OK'));
initUserTable().then(() => logger.info('User table is OK'));
initTransactionTable().then(() => logger.info('Transactions table is OK'));


const app: Application = express();

app.use(cors(config.corsOptions));
app.use(helmet(config.helmetOptions));

app.use(express.json());
app.use('/', apiV1Router, apiV2Router);

export default app;
