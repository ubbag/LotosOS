import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login function
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    const { token } = response.data.data;
    localStorage.setItem('auth_token', token);
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Auto-login helper for development
export const autoLoginIfNeeded = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    try {
      await login('admin@lotosspa.pl', 'haslo123');
      console.log('Auto-logged in as admin');
    } catch (error) {
      console.error('Auto-login failed:', error);
    }
  }
};

// Fetch all clients
export const fetchClients = async () => {
  try {
    const response = await api.get('/api/klienci');
    // Assuming the backend returns an array of clients
    return response.data.data.map((klient: any) => ({
      id: klient.id,
      imie: klient.imie,
      nazwisko: klient.nazwisko,
      name: `${klient.imie} ${klient.nazwisko}`,
      email: klient.email || undefined, // Make optional if null/undefined
      phone: klient.telefon,
      status: klient.aktywny ? 'ACTIVE' : 'INACTIVE',
      lastVisit: 'Brak danych', // Placeholder as not directly from model
      avatarUrl: `https://ui-avatars.com/api/?name=${klient.imie}+${klient.nazwisko}&background=random`, // Generate avatar
    }));
  } catch (error) {
    console.error('Error fetching clients:', error);
    throw error;
  }
};

// Create a new client
export const createClient = async (clientData: {
  imie: string;
  nazwisko: string;
  telefon: string;
  email?: string;
  zrodlo?: string;
}) => {
  try {
    const response = await api.post('/api/klienci', clientData);
    return response.data;
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

// Update a client
export const updateClient = async (id: string, clientData: {
  imie?: string;
  nazwisko?: string;
  telefon?: string;
  email?: string;
  zrodlo?: string;
  aktywny?: boolean;
}) => {
  try {
    const response = await api.put(`/api/klienci/${id}`, clientData);
    return response.data;
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

// Delete a client (soft delete)
export const deleteClient = async (id: string) => {
  try {
    const response = await api.delete(`/api/klienci/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

// Fetch all employees
export const fetchEmployees = async () => {
  try {
    const response = await api.get('/api/masazysci');
    // Access response.data.data because the API returns { success: true, data: [...] }
    const employeesList = response.data.data || [];
    
    return employeesList.map((masazysta: any) => {
        let specs: string[] = [];
        try {
            specs = typeof masazysta.specjalizacje === 'string' 
                ? JSON.parse(masazysta.specjalizacje) 
                : masazysta.specjalizacje;
        } catch (e) {
            specs = [masazysta.specjalizacje];
        }
        
        return {
            id: masazysta.id,
            firstName: masazysta.imie,
            lastName: masazysta.nazwisko,
            status: masazysta.aktywny ? 'ACTIVE' : 'INACTIVE',
            specialization: Array.isArray(specs) ? specs : []
        };
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    throw error;
  }
};

// Fetch all reservations
export const fetchReservations = async () => {
  try {
    const response = await api.get('/api/rezerwacje');
    // Access response.data.data because the API returns { success: true, data: [...] }
    const reservationsList = response.data.data || [];

    return reservationsList.map((rez: any) => {
        const dateObj = new Date(rez.godzinaOd); // godzinaOd contains full date+time
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const dateStr = new Date(rez.data).toISOString().split('T')[0];

        return {
            id: rez.id,
            reservationNumber: rez.numer,
            clientName: rez.klient ? `${rez.klient.imie} ${rez.klient.nazwisko}` : 'Nieznany klient',
            clientPhone: rez.klient ? rez.klient.telefon : '',
            serviceName: rez.usluga ? rez.usluga.nazwa : 'Usługa usunięta',
            date: dateStr,
            time: timeStr,
            duration: rez.wariant?.czasMinut || 0,
            therapistName: rez.masazysta ? `${rez.masazysta.imie} ${rez.masazysta.nazwisko}` : 'Brak terapeuty',
            roomName: rez.gabinet ? rez.gabinet.nazwa : 'Brak gabinetu',
            price: rez.cenaCalokowita || 0,
            status: rez.status
        };
    });
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
};

// Create a new employee
export const createEmployee = async (employeeData: {
  firstName: string;
  lastName: string;
  specialization: string[];
  active: boolean;
}) => {
  try {
    const response = await api.post('/api/masazysci', {
      imie: employeeData.firstName,
      nazwisko: employeeData.lastName,
      specjalizacje: employeeData.specialization,
      aktywny: employeeData.active,
    });
    return response.data;
  } catch (error) {
    console.error('Error creating employee:', error);
    throw error;
  }
};

// Update an employee
export const updateEmployee = async (id: string, employeeData: {
  firstName?: string;
  lastName?: string;
  specialization?: string[];
  active?: boolean;
}) => {
  try {
    const payload: any = {};
    if (employeeData.firstName) payload.imie = employeeData.firstName;
    if (employeeData.lastName) payload.nazwisko = employeeData.lastName;
    if (employeeData.specialization) payload.specjalizacje = employeeData.specialization;
    if (employeeData.active !== undefined) payload.aktywny = employeeData.active;

    const response = await api.put(`/api/masazysci/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating employee:', error);
    throw error;
  }
};

// Delete an employee (soft delete)
export const deleteEmployee = async (id: string) => {
  try {
    const response = await api.delete(`/api/masazysci/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting employee:', error);
    throw error;
  }
};

// Create a new reservation
export const createReservation = async (reservationData: {
  klientId: string;
  masazystaId: string;
  gabinetId: string;
  uslugaId: string;
  wariantId: string;
  data: string; // ISO datetime
  godzinaOd: string; // ISO datetime
  godzinaDo: string; // ISO datetime
  cenaCalokowita: number;
  zrodlo: string;
  platnoscMetoda: string;
  notatki?: string;
}) => {
  try {
    const response = await api.post('/api/rezerwacje', reservationData);
    return response.data;
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
};

// Update a reservation
export const updateReservation = async (id: string, reservationData: {
  klientId?: string;
  masazystaId?: string;
  gabinetId?: string;
  uslugaId?: string;
  wariantId?: string;
  data?: string;
  godzinaOd?: string;
  godzinaDo?: string;
  cenaCalokowita?: number;
  zrodlo?: string;
  platnoscMetoda?: string;
  notatki?: string;
}) => {
  try {
    const response = await api.put(`/api/rezerwacje/${id}`, reservationData);
    return response.data;
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
};

// Cancel/Delete a reservation
export const cancelReservation = async (id: string) => {
  try {
    const response = await api.delete(`/api/rezerwacje/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error canceling reservation:', error);
    throw error;
  }
};

// Update reservation status
export const updateReservationStatus = async (id: string, status: string) => {
  try {
    const response = await api.patch(`/api/rezerwacje/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating reservation status:', error);
    throw error;
  }
};

// Update reservation payment status
export const updateReservationPayment = async (id: string, platnoscStatus: string) => {
  try {
    const response = await api.patch(`/api/rezerwacje/${id}/platnosc`, { platnoscStatus });
    return response.data;
  } catch (error) {
    console.error('Error updating payment status:', error);
    throw error;
  }
};

// Fetch services
export const fetchServices = async () => {
  try {
    const response = await api.get('/api/uslugi');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    throw error;
  }
};

// Fetch rooms
export const fetchRooms = async () => {
  try {
    const response = await api.get('/api/gabinety');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    throw error;
  }
};

// Create a new room
export const createRoom = async (roomData: {
  numer: string;
  nazwa: string;
  notatki?: string;
}) => {
  try {
    const response = await api.post('/api/gabinety', roomData);
    return response.data;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

// Update a room
export const updateRoom = async (id: string, roomData: {
  numer?: string;
  nazwa?: string;
  notatki?: string;
  aktywny?: boolean;
}) => {
  try {
    const response = await api.put(`/api/gabinety/${id}`, roomData);
    return response.data;
  } catch (error) {
    console.error('Error updating room:', error);
    throw error;
  }
};

// Fetch categories
export const fetchCategories = async () => {
  try {
    const response = await api.get('/api/kategorie');
    return response.data.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Create a new category
export const createCategory = async (categoryData: {
  nazwa: string;
  opis?: string;
  kolejnosc?: number;
}) => {
  try {
    const response = await api.post('/api/kategorie', categoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating category:', error);
    throw error;
  }
};

// Update a category
export const updateCategory = async (id: string, categoryData: {
  nazwa?: string;
  opis?: string;
  aktywna?: boolean;
  kolejnosc?: number;
}) => {
  try {
    const response = await api.put(`/api/kategorie/${id}`, categoryData);
    return response.data;
  } catch (error) {
    console.error('Error updating category:', error);
    throw error;
  }
};

// Delete a category
export const deleteCategory = async (id: string) => {
  try {
    const response = await api.delete(`/api/kategorie/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
};

// Fetch dashboard statistics
export const fetchDashboardStats = async () => {
  try {
    const response = await api.get('/api/dashboard/stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Fetch hourly statistics for today
export const fetchHourlyStats = async () => {
  try {
    const response = await api.get('/api/dashboard/hourly-stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching hourly stats:', error);
    throw error;
  }
};

// Fetch monthly statistics
export const fetchMonthlyStats = async () => {
  try {
    const response = await api.get('/api/dashboard/monthly-stats');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching monthly stats:', error);
    throw error;
  }
};

// Fetch salon opening hours
export const fetchOpeningHours = async () => {
  try {
    const response = await api.get('/api/settings/opening-hours');
    return response.data.data;
  } catch (error) {
    console.error('Error fetching opening hours:', error);
    throw error;
  }
};

// Update salon opening hours
export const updateOpeningHours = async (godzinaOtwarcia: number, godzinaZamkniecia: number) => {
  try {
    const response = await api.put('/api/settings/opening-hours', {
      godzinaOtwarcia,
      godzinaZamkniecia,
    });
    return response.data.data;
  } catch (error) {
    console.error('Error updating opening hours:', error);
    throw error;
  }
};

export default api;