import dotenv from 'dotenv';
import winston from 'winston';
import { PoolConfig } from 'pg';

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
interface Config {
  logLevel: string;
  nodeEnv: string;
  maxDbRetries: number;
  poolConfig: PoolConfig;
  acquiringConfig: AcquiringConfig
}

const config: Config = {
  logLevel: process.env.LOG_LEVEL as string,
  nodeEnv: process.env.NODE_ENV as string,
  maxDbRetries: Number(process.env.MAX_DB_RETRIES),
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
      amount: 3000,
      description: 'Lorem ipsum dolor...',
    }
  }

};

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: './logs/combined.log' }),
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
