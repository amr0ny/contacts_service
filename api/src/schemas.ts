export interface User {
  user_id: number,
  username: string,
  first_name?: string,
  last_name?: string,
  trial_state: number,
  subscription_expiration_date?: Date,
  created_at?: Date,
}

export type UserAllowedField = Exclude<keyof User, 'user_id' | 'created_at' | 'first_name' | 'last_name'>;

export const userAllowedFields: UserAllowedField[] = ['trial_state', 'subscription_expiration_date'];

export interface Contact {
  id: number,
  name: string;
  description?: string;
  city: string;
  phone_1?: string;
  phone_2?: string;
  phone_3?: string;
  telegram_1?: string;
  telegram_2?: string;
  telegram_3?: string;
}


type PresentableFields<T, K extends keyof T> = Pick<T, K>;

export type ContactPresentable = PresentableFields<Contact, 'name' | 'description' | 'city' | 'phone_1'>;