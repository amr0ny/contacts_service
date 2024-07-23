import { withDB } from "../db";

export async function initDbExtensions() {
  return withDB(async (client) => {
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  });
}
export async function initTransactionTable() {
  return withDB(async (client) => {
    await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY,
          payment_id VARCHAR(20) NOT NULL,
          user_id UUID NOT NULL,
          amount INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
      `);
  });
}

export async function initUserTable() {
  return withDB(async (client) => {
    await client.query(
      'CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id BIGINT NOT NULL, username VARCHAR(255), first_name VARCHAR(255), last_name VARCHAR(255), trial_state INT DEFAULT 2 NOT NULL, subscription_expiration_date TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP )',
    );
  });
}