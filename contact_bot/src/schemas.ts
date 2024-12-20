import config from './config';

export interface User {
  id?: string;
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  trial_state: number;
  subscription_expiration_date?: string;
  created_at?: Date;
}

export interface ContactPresentable {
  name: string;
  description: string;
  city: string;
  phone_1?: string;
}

export const API_BASE_URL = config.apiBaseUrl;

export const endpoints = {
  userDetail: (userId: number) => `api/v1/users/${userId}`,
  createUser: () => 'api/v1/users',
  updateUser: (userId: number) => `api/v1/users/${userId}`,
  contactsByCityList: (cityName: string) => `api/v1/contacts/${cityName}`,
  initUserPayment: () => `api/v1/users/subscribe`
};

export interface UserDetailRequest {
  userId: number;
}

export interface InitUserPaymentRequest {
  userId: number;
  email: string;
}

export interface CreateUserRequest {
  user_id: number;
  username: string;
  trial_state: number;
  first_name?: string;
  last_name?: string;
}

export interface UpdateUserRequest {
  [field: string]: string | number;
}

export interface ContactsByCityListRequest {
  cityName: string;
}

export interface InitTransactionResponse {
  payment_url: string
};
