import { withDB } from '../db';
import { Transaction, TransactionAllowedField, transactionAllowedFields, TransactionField } from '../schemas';


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
  

export async function getTransactionFields(
    transactionId: string,
    fields: TransactionField[]
  ): Promise<Partial<Transaction> | null> {
    return withDB(async (client) => {
      if (fields.length === 0) return null;
  
      const selectClause = fields.map(field => `"${field}"`).join(', ');
      
      const query = `SELECT ${selectClause} FROM transactions WHERE id = $1`;
      const result = await client.query<Partial<Transaction>>(query, [transactionId]);
      
      return result.rows[0] || null;
   });
}

import { v4 as uuidv4 } from 'uuid';

export async function createTransaction(
  orderId: string,
  paymentId: string,
  userId: string,
  amount: number,
  status: string
): Promise<Transaction> {
  return withDB<Transaction>(async (client) => {
    
    const result = await client.query<Transaction>(
      `INSERT INTO transactions (order_id, payment_id, user_id, amount, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [orderId, paymentId, userId, amount, status]
    );
    
    return result.rows[0];
  });
}