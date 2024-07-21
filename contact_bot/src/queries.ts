import { withDB } from './db';
import { logger } from './config';
import { User, Contact, ContactPresentable } from './schemas';

export async function getContactsByCity(city: string): Promise<ContactPresentable[]> {
  return withDB<ContactPresentable[]>(async (client) => {
    const result = await client.query<Contact>('SELECT * FROM contacts WHERE city = $1', [city]);
    return result.rows.map((item) => ({
      name: item.name,
      description: item.description,
      city: item.city,
      phone_1: item.phone_1,
    }));
  });
}

export async function getCityNames(): Promise<ContactPresentable[]> {
  return withDB<ContactPresentable[]>(async (client) => {
    const result = await client.query('SELECT DISTINCT city FROM contacts');
    return result.rows as ContactPresentable[];
  });
}

export async function initUserTable() {
  return withDB(async (client) => {
    const res = await client.query('SELECT current_database();');
    const dbName = res.rows[0].current_database;
    logger.info(`Connected to database: ${dbName}`);

    await client.query(
      'CREATE TABLE IF NOT EXISTS users ( user_id BIGINT PRIMARY KEY, username VARCHAR(255), first_name VARCHAR(255), last_name VARCHAR(255), trial_state INT DEFAULT 2 NOT NULL, subscription_expiration_date TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP )',
    );
    logger.info('Table "users" created or already exists.');
  });
}

export async function getUser(userId: number | undefined): Promise<User> {
  return withDB<User>(async (client) => {
    const result = await client.query<User>('SELECT * FROM users WHERE user_id = $1', [userId]);
    return result.rows[0];
  });
}
export async function createUser(userId: number | undefined, username: string | undefined, firstName: string | undefined, lastName: string | undefined) {
  return withDB(async (client) => {
    await client.query('INSERT INTO users (user_id, username, first_name, last_name) VALUES ($1, $2, $3, $4)', [userId, username, firstName, lastName]);
  });
}

export async function decrementTrialState(userId: number) {
  return withDB(async (client) => {
    await client.query('UPDATE users SET trial_state = trial_state - 1 WHERE user_id = $1', [userId]);
  });
}

export async function subscribeUser(userId: number) {
  return withDB(async (client) => {
    await client.query("UPDATE users SET subscription_expiration_date = CURRENT_TIMESTAMP + INTERVAL '30 days' WHERE user_id = $1", [userId]);
  });
}
