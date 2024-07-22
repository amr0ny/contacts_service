import { withDB } from '../db';

export async function initTransactionTable() {
    return withDB(async (client) => {
        const result = await client.query('CREATE TABLE IF NOT EXISTS transactions ()'); // TODO: Finish the signatire of transactions table
    });
}

export async function createTransaction() {
    return withDB(async (client) => {
        const result = await client.query('INSERT ...'); // TODO: Finish the query (depends on the upper comment)
    });
}


