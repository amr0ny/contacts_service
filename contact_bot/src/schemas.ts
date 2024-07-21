export interface User {
  user_id: number;
  first_name?: string;
  last_name?: string;
  trial_state: number;
  subscription_expiration_date?: Date;
  created_at?: Date;
}

export interface Contact {
  name: string;
  description: string;
  city: string;
  phone_1?: string;
  phone_2?: string;
  phone_3?: string;
  telegram_1?: string;
  telegram_2?: string;
  telegram_3?: string;
}

export interface ContactPresentable {
  name: string;
  description: string;
  city: string;
  phone_1?: string;
}
