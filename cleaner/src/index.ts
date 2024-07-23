import { TransactionCleaner } from './services/transactions';
import config, { logger } from './config';

class TransactionCleanerService {
    private cleaner: TransactionCleaner;
    private intervalId: NodeJS.Timeout | null = null;

    constructor() {
        this.cleaner = new TransactionCleaner({
            batchSize: config.cleaner.batchSize,
            maxAgeMinutes: config.cleaner.maxAgeMinutes,
            validStatuses: config.cleaner.validStatuses,
        });
    }

    start(): void {
        logger.info('Transaction cleaner service started');
        this.runCleaner();
        this.intervalId = setInterval(() => this.runCleaner(), config.cleaner.cleaningIntervalMinutes * 60 * 1000);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        logger.info('Transaction cleaner service stopped');
    }

    private async runCleaner(): Promise<void> {
        try {
            const cleanedCount = await this.cleaner.cleanExpiredTransactions();
            logger.info(`Successfully cleaned ${cleanedCount} expired transactions`);
        } catch (error) {
            logger.error('Error occurred while cleaning transactions:', error);
        }
    }
}

async function main() {
    const service = new TransactionCleanerService();
    service.start();

    // Graceful shutdown
    process.on('SIGINT', () => {
        logger.info('Received SIGINT. Graceful shutdown started');
        service.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        logger.info('Received SIGTERM. Graceful shutdown started');
        service.stop();
        process.exit(0);
    });
}

main().catch((error) => {
    logger.error('Unhandled error in main script:', error);
    process.exit(1);
});