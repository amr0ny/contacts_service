import axios, { AxiosInstance, AxiosResponse, AxiosError, isAxiosError } from 'axios';
import { API_BASE_URL, ContactPresentable, ContactsByCityListRequest, CreateUserRequest, InitTransactionResponse, InitUserPaymentRequest, UpdateUserRequest, User, UserDetailRequest, endpoints } from '../schemas';
import { logger } from '../config';

class ApiService {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL.toString(),
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  private handleResponse = <T>(response: AxiosResponse<T>): T => {
    if ((response.status >= 200 && response.status < 300) || response.status == 404) {
      return response.data;
    }
    throw new Error(`API error: ${response.statusText}`);
  };

  private handleError = (error: any): never => {
    logger.error(`API call failed: ${error.message}`);
    throw error;
  };

  public async fetchUser({ userId }: UserDetailRequest): Promise<User | null> {
    try {
      const url = endpoints.userDetail(userId);
      const response = await this.apiClient.get(url);
      logger.debug(`${response.data}, ${response.status}`);
      return this.handleResponse(response);
    } catch (error) {
      if (isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status == 404) {
          return null;
        }
      }
      return this.handleError(error);
    }
  }

  public async createUser(req: CreateUserRequest): Promise<User> {
    try {
      const url = endpoints.createUser();
      const response = await this.apiClient.post(url, req);
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async updateUser(userId: number, req: UpdateUserRequest): Promise<User> {
    try {
      const url = endpoints.updateUser(userId);
      const response = await this.apiClient.patch(url, req);
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async fetchContactsByCity(req: ContactsByCityListRequest): Promise<ContactPresentable[]> {
    try {
      const url = endpoints.contactsByCityList(req.cityName);
      logger.debug(url);
      const response = await this.apiClient.get(url);
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  public async initUserPayment({ userId }: InitUserPaymentRequest): Promise<InitTransactionResponse> {
    try {
      const url = endpoints.initUserPayment();
      logger.debug(url);
      const response = await this.apiClient.post(url, {user_id: userId});
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}
export const apiService = new ApiService();
