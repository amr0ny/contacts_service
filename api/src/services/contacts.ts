import { withDB } from '../db';
import { Contact, ContactPresentable } from '../schemas';

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
