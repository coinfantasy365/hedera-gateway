import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig } from 'axios';
import { SDKConfig, RetryOptions } from './types.js';

export class APIClient {
  private client: AxiosInstance;
  private retryOptions: RetryOptions;

  constructor(config: SDKConfig) {
    this.retryOptions = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 30000,
      exponentialBase: 2,
      ...config.retryOptions
    };

    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
      }
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        // Only log in development mode to prevent sensitive data leaks
        if (process.env.NODE_ENV === 'development' || process.env.SDK_DEBUG === 'true') {
          console.log(`[CoinFantasy SDK] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }
        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: unknown): boolean {
    // Only Axios errors can be retried by our logic
    if (!axios.isAxiosError(error)) return false;
    const axiosErr = error as AxiosError;

    const config = axiosErr.config as AxiosRequestConfig & { __retryCount?: number } | undefined;
    if (!config || (config.__retryCount ?? 0) >= (this.retryOptions.maxRetries ?? 0)) {
      return false;
    }

    // Retry on network errors, timeouts, and 5xx responses
    return (
      !axiosErr.response ||
      axiosErr.code === 'ECONNABORTED' ||
      (axiosErr.response.status >= 500 && axiosErr.response.status < 600) ||
      axiosErr.response.status === 429
    );
  }

  private async retryRequest(error: AxiosError): Promise<AxiosResponse> {
    const config = (error.config as AxiosRequestConfig & { __retryCount?: number }) || {};
    config.__retryCount = (config.__retryCount || 0) + 1;

    const delay = Math.min(
      (this.retryOptions.baseDelay ?? 1000) * Math.pow(this.retryOptions.exponentialBase ?? 2, (config.__retryCount || 1) - 1),
      this.retryOptions.maxDelay ?? 30000
    );

    // Only log retries in development mode
    if (process.env.NODE_ENV === 'development' || process.env.SDK_DEBUG === 'true') {
      console.log(`[CoinFantasy SDK] Retrying request in ${delay}ms (attempt ${config.__retryCount})`);
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return this.client(config as AxiosRequestConfig);
  }

  async get<T = unknown>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get(url, { params });
    return response.data;
  }

  async post<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.post(url, data);
    return response.data;
  }
  async put<T = unknown>(url: string, data?: unknown): Promise<T> {
    const response = await this.client.put(url, data);
    return response.data;
  }
  async delete<T = unknown>(url: string): Promise<T> {
    const response = await this.client.delete(url);
    return response.data;
  }
}