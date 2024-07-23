import { Pool, PoolClient } from 'pg';
import config, { logger } from './config';

export type DatabaseOperation<T> = (client: PoolClient) => Promise<T>;

export function withDatabaseConnection<T>(pool: Pool, maxRetries: number = config.maxDbRetries) {
  return async (operation: DatabaseOperation<T>): Promise<T> => {
    let retries = 0;
    while (retries < maxRetries) {
      const client = await pool.connect();
      logger.info('Connected to the database');
      try {
        const result = await operation(client);
        logger.info('Operation executed successfully');
        return result;
      } catch (error: unknown) {
        if (error instanceof Error && 'code' in error) {
          const dbError = error as Error & { code?: string };
          logger.error(`Database error: ${dbError.message}`);
          if (dbError.code === 'ECONNREFUSED' && retries < maxRetries - 1) {
            logger.info(`Connection failed, retrying: (${retries + 1}/${maxRetries})...`);
            retries++;
            await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
          } else {
            throw dbError;
          }
        } else {
          throw new Error('An unknown database error occurred');
        }
      } finally {
        client.release();
        logger.info('Database client released');
      }
    }
    throw new Error('Max retries reached when trying to connect to database');
  };
}

export const pool = new Pool(config.poolConfig);
export const withDB = <T>(operation: DatabaseOperation<T>) =>
  withDatabaseConnection<T>(pool)(operation);
