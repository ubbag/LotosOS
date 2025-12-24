/**
 * Mock API Interceptor
 * Provides demo data when backend is unavailable
 */

import { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

const mockUser = {
  id: '1',
  email: 'demo@lotosspa.pl',
  imie: 'Demo',
  nazwisko: 'User',
  rola: 'WLASCICIEL',
  aktywny: true,
};

const mockToken = 'demo-token-for-testing';

// Mock data generators
const generateMockClients = () => {
  const names = [
    { imie: 'Anna', nazwisko: 'Kowalska' },
    { imie: 'Jan', nazwisko: 'Nowak' },
    { imie: 'Maria', nazwisko: 'Wiśniewska' },
    { imie: 'Piotr', nazwisko: 'Wójcik' },
    { imie: 'Katarzyna', nazwisko: 'Kamińska' },
  ];

  return names.map((n, i) => ({
    id: String(i + 1),
    ...n,
    email: `${n.imie.toLowerCase()}.${n.nazwisko.toLowerCase()}@example.com`,
    telefon: `+48 ${500 + i}00${100 + i}`,
    aktywny: true,
    dataUrodzenia: '1990-01-01',
    createdAt: new Date().toISOString(),
  }));
};

const generateMockMasazysci = () => {
  return [
    {
      id: '1',
      imie: 'Agnieszka',
      nazwisko: 'Nowak',
      specjalizacje: ['Masaż relaksacyjny', 'Masaż sportowy'],
      aktywny: true,
    },
    {
      id: '2',
      imie: 'Marek',
      nazwisko: 'Kowalski',
      specjalizacje: ['Masaż tajski', 'Masaż leczniczy'],
      aktywny: true,
    },
  ];
};

const generateMockRezerwacje = () => {
  const today = new Date();
  return [
    {
      id: '1',
      numer: 'REZ-001',
      data: today.toISOString().split('T')[0],
      godzinaOd: new Date(today.setHours(10, 0)).toISOString(),
      godzinaDo: new Date(today.setHours(11, 0)).toISOString(),
      status: 'POTWIERDZONA',
      cenaCalokowita: 150,
      klient: { imie: 'Anna', nazwisko: 'Kowalska', telefon: '+48 50000100' },
      usluga: { nazwa: 'Masaż relaksacyjny' },
      masazysta: { imie: 'Agnieszka', nazwisko: 'Nowak' },
      gabinet: { nazwa: 'Gabinet 1' },
      wariant: { czasMinut: 60 },
    },
  ];
};

export const setupMockInterceptor = (axiosInstance: AxiosInstance) => {
  // Response interceptor for mock data
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const config = error.config as InternalAxiosRequestConfig;

      // Only mock on network errors (backend unavailable)
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.log('🎭 Backend unavailable, using mock data for:', config.url);

        // Login endpoint
        if (config.url?.includes('/auth/login')) {
          return {
            status: 200,
            statusText: 'OK',
            data: {
              success: true,
              data: {
                token: mockToken,
                user: mockUser,
              },
            },
            headers: {},
            config,
          };
        }

        // Clients endpoint
        if (config.url?.includes('/klienci')) {
          return {
            status: 200,
            statusText: 'OK',
            data: {
              success: true,
              data: generateMockClients(),
            },
            headers: {},
            config,
          };
        }

        // Masazysci endpoint
        if (config.url?.includes('/masazysci')) {
          return {
            status: 200,
            statusText: 'OK',
            data: {
              success: true,
              data: generateMockMasazysci(),
            },
            headers: {},
            config,
          };
        }

        // Reservations endpoint
        if (config.url?.includes('/rezerwacje')) {
          return {
            status: 200,
            statusText: 'OK',
            data: {
              success: true,
              data: generateMockRezerwacje(),
            },
            headers: {},
            config,
          };
        }

        // Dashboard stats
        if (config.url?.includes('/dashboard/stats')) {
          return {
            status: 200,
            statusText: 'OK',
            data: {
              success: true,
              data: {
                totalClients: 150,
                todayReservations: 12,
                monthlyRevenue: 25000,
                activeEmployees: 8,
              },
            },
            headers: {},
            config,
          };
        }

        // For other endpoints, return friendly error
        return Promise.reject({
          ...error,
          response: {
            status: 200,
            statusText: 'OK',
            data: {
              success: true,
              data: [],
              message: '🎭 Demo mode - This endpoint uses mock data',
            },
            headers: {},
            config,
          },
        });
      }

      // Re-throw other errors
      return Promise.reject(error);
    }
  );
};
