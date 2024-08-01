import config from "./config";

export interface User {
  id: string,
  user_id: number,
  username: string,
  first_name?: string,
  last_name?: string,
  trial_state: number,
  subscription_expiration_date?: Date,
  created_at?: Date,
}

export type UserAllowedField = Exclude<keyof User, 'username' | 'id' | 'user_id' | 'created_at' | 'first_name' | 'last_name'>;

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

export interface DataObj {
  [key: string]: any;
}

export const mapiEndpoints = {
  init: () => 'https://securepay.tinkoff.ru/v2/Init'
}

export interface Transaction {
  id: string,
  payment_id: string,
  user_id: string,
  amount: number,
  status: string,
  email: string,
  created_at?: Date,
};


export type TransactionAllowedField = 'status' | 'payment_id';
export type TransactionField = keyof Transaction;
export const transactionAllowedFields: TransactionAllowedField[] = ['status', 'payment_id'];

interface ReceiptItem {
  Name: string,
  Price: number,
  Quantity: number
  Amount: number,
  PaymentObject: string,
  Tax: string,

};

interface Receipt {
  Items: ReceiptItem[],
  Email: string,
  Taxation: string,
};

export const formReceipt = (email: string): Receipt => {
  return {
    Email: email,
    Taxation: config.acquiringConfig.taxation,
    Items: [
      {
        Name: config.acquiringConfig.product.name,
        Price: config.acquiringConfig.product.amount,
        Amount: config.acquiringConfig.product.amount,
        Quantity: 1,
        PaymentObject: config.acquiringConfig.paymentObject,
        Tax: config.acquiringConfig.product.tax
      }
    ]
  }
};