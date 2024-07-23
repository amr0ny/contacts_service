import dotenv from 'dotenv';
import winston from 'winston';

dotenv.config({ path: '../.env' });
interface Config {
  token: string;
  logLevel: string;
  nodeEnv: string;
  api_base_url: URL;
}
const config: Config = {
  token: process.env.TG_TOKEN as string,
  logLevel: process.env.LOG_LEVEL as string,
  nodeEnv: process.env.NODE_ENV as string,
  api_base_url: new URL(`http://${process.env.API_HOST || ''}:${process.env.API_PORT || ''}`),
};
const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [new winston.transports.File({ filename: './logs/error.log', level: 'error' }), new winston.transports.File({ filename: './logs/combined.log' })],
});

if (config.nodeEnv !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  );
}
logger.debug(config.api_base_url);

export { logger };
export default config;
