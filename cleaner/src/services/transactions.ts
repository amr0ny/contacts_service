import { PoolClient } from 'pg';
import config, { logger } from '../config';
import { withDB, DatabaseOperation } from '../db';

interface CleanerConfig {
    batchSize: number;
    maxAgeMinutes: number;
    validStatuses: string[];
}

export class TransactionCleaner {
    private config: CleanerConfig;

    constructor(config: CleanerConfig) {
        this.config = config;
    }

    async cleanExpiredTransactions(): Promise<number> {
        let totalCleaned = 0;
        let batchCleaned: number;

        do {
            batchCleaned = await this.cleanBatch();
            totalCleaned += batchCleaned;
            logger.info(`Cleaned ${batchCleaned} transactions in this batch`);
        } while (batchCleaned === this.config.batchSize);

        return totalCleaned;
    }

    private cleanBatch(): Promise<number> {
        const operation: DatabaseOperation<number> = async (client: PoolClient) => {
            try {
                await client.query('BEGIN');

                const expirationDate = new Date(Date.now() - this.config.maxAgeMinutes * 60 * 1000);

                const query = `
                    WITH expired_transactions AS (
                      SELECT id
                      FROM transactions
                      WHERE created_at < $1
                        AND status NOT IN (${this.config.validStatuses.map((_, i) => `$${i + 2}`).join(', ')})
                      LIMIT $${this.config.validStatuses.length + 2}
                      FOR UPDATE SKIP LOCKED
                    )
                    DELETE FROM transactions
                    WHERE id IN (SELECT id FROM expired_transactions)
                    RETURNING id;
                `;

                const result = await client.query(query, [
                    expirationDate,
                    ...this.config.validStatuses,
                    this.config.batchSize,
                ]);

                await client.query('COMMIT');

                return result.rowCount || 0; // Ensure we always return a number

            } catch (error) {
                await client.query('ROLLBACK');
                logger.error('Error cleaning batch:', error);
                throw error;
            }
        };

        return withDB(operation);
    }
}

// Пример использования:
const cleaner = new TransactionCleaner({
    batchSize: config.cleaner.batchSize,
    maxAgeMinutes: config.cleaner.maxAgeMinutes,
    validStatuses: config.cleaner.validStatuses,
});

cleaner.cleanExpiredTransactions()
    .then(totalCleaned => logger.info(`Total cleaned transactions: ${totalCleaned}`))
    .catch(error => logger.error('Error during cleaning process:', error));