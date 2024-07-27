import dotenv from 'dotenv';
import winston from 'winston';
import { PoolConfig } from 'pg';
import DailyRotateFile from 'winston-daily-rotate-file';
import { HelmetOptions } from 'helmet';

dotenv.config({ path: '../dev.env' });

interface AcquiringConfig {
  terminalKey: string,
  password: string,
  notificationURL: string,
  product: {
    amount: number,
    description: string,
  }
}

interface CorsOptions {
  origin: string[],
  optionsSuccessStatus: number,
  exposedHeaders: string[],
  credentials: boolean,
  maxAge: number
}
interface Config {
  logLevel: string,
  nodeEnv: string,
  maxDbRetries: number,
  userTrialState: number,
  userTrialSubscriptionState: number,
  expiresIn: number,
  paymentAmount: number,
  poolConfig: PoolConfig,
  acquiringConfig: AcquiringConfig,
  corsOptions: CorsOptions,
  helmetOptions: HelmetOptions
}

const config: Config = {
  logLevel: process.env.LOG_LEVEL as string,
  nodeEnv: process.env.NODE_ENV as string,
  maxDbRetries: Number(process.env.MAX_DB_RETRIES),
  userTrialState: parseInt(process.env.USER_TRIAL_STATE || '2', 10),
  userTrialSubscriptionState: parseInt(process.env.USER_TRIAL_SUBSCRIPTION_STATE || '30', 10),
  expiresIn: parseInt(process.env.EXPIRES_IN || '30', 10),
  paymentAmount: parseInt(process.env.PAYMENT_AMOUNT || '15000', 10),
  poolConfig: {
    user: process.env.POSTGRES_USER || '',
    host: process.env.POSTGRES_HOST || '',
    password: process.env.POSTGRES_PASSWORD || '',
    database: process.env.POSTGRES_NAME || '',
    port: Number(process.env.POSTGRES_PORT || ''),
  },
  acquiringConfig: {
    terminalKey: '1721314296114DEMO',
    password: 'bYIS4MnOKw8CgUC_',
    notificationURL: 'https://botrpk.ru/Notification',
    product: {
      amount: parseInt(process.env.PAYMENT_AMOUT || '15000', 10),
      description: 'Доступ к базе РПК России',
    }
  },
  corsOptions: {
    origin: (process.env.API_CORS_ORIGIN || '127.0.0.1').split(','),
    optionsSuccessStatus: 200,
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    credentials: true,
    maxAge: 3600 // некоторые старые браузеры (IE11, различные SmartTV) обламываются на 204
  },
  helmetOptions: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        imgSrc: ["'self'"],
        styleSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }
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
