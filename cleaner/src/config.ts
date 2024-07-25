import dotenv from 'dotenv';
import winston from 'winston';
import { PoolConfig } from 'pg';

dotenv.config({ path: '../.env' });

interface CleanerConfig {
    cleaningIntervalMinutes: number;
    batchSize: number,
    maxAgeMinutes: number,
    validStatuses: string[]
}

interface Config {
    logLevel: string;
    nodeEnv: string;
    maxDbRetries: number;
    poolConfig: PoolConfig;
    cleaner: CleanerConfig
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
    cleaner: {
        cleaningIntervalMinutes: parseInt(process.env.CLEANER_INTERVAL_MINUTES || ''),
        batchSize: parseInt(process.env.CLEANER_BATCH_SIZE || '1000'),
        maxAgeMinutes: parseInt(process.env.CLEANER_MAX_AGE_MINUTES || '10'),
        validStatuses: (process.env.CLEANER_VALID_STATUSES || 'CONFIRMED,REFUNDED').split(','),
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
