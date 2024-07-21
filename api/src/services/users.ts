import { withDB } from '../db';
import { User, UserAllowedField, userAllowedFields } from '../schemas';

export async function initUserTable() {
  return withDB(async (client) => {
    await client.query(
      'CREATE TABLE IF NOT EXISTS users ( user_id BIGINT PRIMARY KEY, username VARCHAR(255), first_name VARCHAR(255), last_name VARCHAR(255), trial_state INT DEFAULT 2 NOT NULL, subscription_expiration_date TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP )',
    );
  });
}

export async function getUser(userId: number | undefined): Promise<User> {
  return withDB<User>(async (client) => {
    const result = await client.query<User>('SELECT * FROM users WHERE user_id = $1', [userId]);
    return result.rows[0];
  });
}
export async function createUser(
  userId: number | undefined,
  username: string | undefined,
  firstName: string | undefined,
  lastName: string | undefined,
) {
  return withDB(async (client) => {
    await client.query(
      'INSERT INTO users (user_id, username, first_name, last_name) VALUES ($1, $2, $3, $4)',
      [userId, username, firstName, lastName],
    );
  });
}

export async function updateUserFields(
  userId: number,
  fields: Partial<Pick<User, UserAllowedField>>
) {
  return withDB(async (client) => {
    const entries = Object.entries(fields).filter(([key]) => userAllowedFields.includes(key as UserAllowedField));
    if (entries.length === 0) return;

    const setClause = entries
      .map((_, index) => `"${entries[index][0]}" = $${index + 2}`)
      .join(', ');
    const values = entries.map(entry => entry[1]);

    const query = `UPDATE users SET ${setClause} WHERE user_id = $1`;
    await client.query(query, [userId, ...values]);
  });
}
export async function subscribeUser(userId: number) {
  return withDB(async (client) => {
    await client.query(
      "UPDATE users SET subscription_expiration_date = CURRENT_TIMESTAMP + INTERVAL '30 days' WHERE user_id = $1",
      [userId],
    );
  });
}
