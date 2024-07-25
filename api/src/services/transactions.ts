import { withDB } from '../db';
import { Transaction, TransactionAllowedField, transactionAllowedFields, User } from '../schemas';


export async function updateTransactionFields(
  transactionId: string,
  fields: Partial<Pick<Transaction, TransactionAllowedField>>
): Promise<Transaction | null> {
  return withDB(async (client) => {
    const entries = Object.entries(fields).filter(([key]) =>
      transactionAllowedFields.includes(key as TransactionAllowedField)
    );
    if (entries.length === 0) return null;

    const setClause = entries
      .map((_, index) => `"${entries[index][0]}" = $${index + 2}`)
      .join(', ');
    const values = entries.map(entry => entry[1]);

    const query = `UPDATE transactions SET ${setClause} WHERE id = $1 RETURNING *`;
    const result = await client.query<Transaction>(query, [transactionId, ...values]);
    return result.rows[0] || null;
  });
}

export async function getTransaction(transactionId: string): Promise<Transaction | null> {
  return withDB(async (client) => {
    const query = `SELECT * FROM transactions WHERE id = $1`;
    const result = await client.query<Transaction>(query, [transactionId]);
    return result.rows[0] || null;
  });
}

export async function createTransaction(
  orderId: string,
  paymentId: string,
  userId: string,
  amount: number,
  status: string
): Promise<Transaction> {
  return withDB<Transaction>(async (client) => {

    const result = await client.query<Transaction>(
      `INSERT INTO transactions (id, payment_id, user_id, amount, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderId, paymentId, userId, amount, status]
    );

    return result.rows[0] || null;
  });
}

export async function getUserByTransactionId(transactionId: string): Promise<User | null> {
  return withDB(async (client) => {
    const query = `
      SELECT u.* 
      FROM users u
      JOIN transactions t ON u.id = t.user_id
      WHERE t.id = $1
    `;
    const result = await client.query<User>(query, [transactionId]);
    return result.rows[0] || null;
  });
}