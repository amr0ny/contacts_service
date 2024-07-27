import dotenv from 'dotenv';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

dotenv.config({ path: '../.env' });

interface Config {
  token: string;
  logLevel: string;
  nodeEnv: string;
  userTrialState: number,
  userTrialSubscriptionState: number,
  paymentAmount: number,
  apiBaseUrl: URL;

}
const config: Config = {
  token: process.env.TG_TOKEN as string,
  logLevel: process.env.LOG_LEVEL as string,
  nodeEnv: process.env.NODE_ENV as string,
  apiBaseUrl: new URL(`http://${process.env.API_HOST || ''}:${process.env.API_PORT || ''}`),
  userTrialState: parseInt(process.env.USER_TRIAL_STATE || '2', 10),
  userTrialSubscriptionState: parseInt(process.env.USER_TRIAL_SUBSCRIPTION_STATE || '30', 10),
  paymentAmount: parseInt(process.env.PAYMENT_AMOUNT || '15000', 10),
};

const errorRotateFile = new DailyRotateFile({
  filename: './logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '7d',
  level: 'error',
});

const combinedRotateFile = new DailyRotateFile({
  filename: './logs/combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '10m',
  maxFiles: '7d',
});

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    errorRotateFile,
    combinedRotateFile,
  ],
});

if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}

export { logger };
export default config;
