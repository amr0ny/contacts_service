import { withDB } from '../db';
import { User, UserAllowedField, userAllowedFields } from '../schemas';



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
): Promise<User> {
  return withDB<User>(async (client) => {
    const result = await client.query<User>(
      'INSERT INTO users (user_id, username, first_name, last_name) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, username, firstName, lastName],
    );
    return result.rows[0];
  });
}

export async function updateUserFields(
  userId: number,
  fields: Partial<Pick<User, UserAllowedField>>
): Promise<User | null> {
  return withDB(async (client) => {
    const entries = Object.entries(fields).filter(([key]) => userAllowedFields.includes(key as UserAllowedField));
    if (entries.length === 0) return null;

    const setClause = entries
      .map((_, index) => `"${entries[index][0]}" = $${index + 2}`)
      .join(', ');
    const values = entries.map(entry => entry[1]);

    const query = `UPDATE users SET ${setClause} WHERE user_id = $1 RETURNING *`;
    const result = await client.query<User>(query, [userId, ...values]);
    return result.rows[0] || null;
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
