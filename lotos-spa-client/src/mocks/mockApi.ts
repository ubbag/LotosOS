/**
 * Mock API Interceptor
 * Intercepts API calls and returns mock data when backend is unavailable
 * This is for development/frontend testing only
 */

import { AxiosError } from 'axios';
import {
  generateMockLoginResponse,
  generateMockClientsResponse,
} from './mockData';

export const createMockInterceptor = (axiosInstance: any) => {
  // Store the original request function
  const originalRequest = axiosInstance.request.bind(axiosInstance);

  // Override request function
  axiosInstance.request = async (config: any) => {
    try {
      // Try real API first
      return await originalRequest(config);
    } catch (error: any) {
      // Fall back to mock data if API is unavailable
      if (
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('Network Error')
      ) {
        console.warn(
          `[MOCK API] Backend unavailable, using mock data for: ${config.method?.toUpperCase()} ${config.url}`
        );

        // Handle login
        if (config.url === '/auth/login' && config.method === 'post') {
          await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate network delay
          return {
            status: 200,
            statusText: 'OK',
            data: generateMockLoginResponse(),
            headers: {},
            config,
          };
        }

        // Handle clients list
        if (config.url === '/klienci' && config.method === 'get') {
          await new Promise((resolve) => setTimeout(resolve, 600)); // Simulate network delay
          const { page = 1, limit = 10, search } = config.params || {};
          return {
            status: 200,
            statusText: 'OK',
            data: generateMockClientsResponse(page, limit, search),
            headers: {},
            config,
          };
        }

        // For other endpoints, return error
        const mockError = {
          config,
          code: 'ERR_NETWORK',
          message: 'Backend unavailable. Using mock data for login and clients only.',
          name: 'AxiosError',
          request: {},
          response: {
            status: 503,
            statusText: 'Service Unavailable',
            data: {
              success: false,
              message:
                'Backend unavailable. This endpoint does not have mock data.',
            },
            headers: {},
            config,
          } as any,
          isAxiosError: true,
          toJSON: () => ({}),
        } as AxiosError;
        throw mockError;
      }

      // Re-throw other errors
      throw error;
    }
  };

  return axiosInstance;
};
