import dotenv from 'dotenv';
import winston from 'winston';
import { PoolConfig } from 'pg';

dotenv.config({ path: '../dev.env' });

interface Config {
  logLevel: string;
  nodeEnv: string;
  maxDbRetries: number;
  poolConfig: PoolConfig;
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
