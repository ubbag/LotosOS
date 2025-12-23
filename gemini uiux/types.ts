import React from 'react';

export type ViewState = 
  | 'dashboard' 
  | 'clients' 
  | 'reservations' 
  | 'schedule' 
  | 'roster'
  | 'employees' 
  | 'rooms' 
  | 'services' 
  | 'categories' 
  | 'packages' 
  | 'vouchers' 
  | 'reports' 
  | 'sms' 
  | 'settings';

export interface Client {
  id: string;
  imie: string; // From backend
  nazwisko: string; // From backend
  name: string; // Combined from imie and nazwisko for display
  email?: string; // Optional as per backend
  phone: string;
  status: 'ACTIVE' | 'INACTIVE'; // Mapped from aktywny
  lastVisit?: string; // Not directly from backend, make optional
  avatarUrl?: string; // Not directly from backend, make optional
}

export interface Reservation {
  id: string;
  reservationNumber: string;
  clientName: string;
  clientPhone: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  therapistName: string;
  roomName: string;
  price: number;
  status: 'NOWA' | 'POTWIERDZONA' | 'ZAKONCZONA' | 'ANULOWANA';
}

export interface Voucher {
  id: string;
  code: string;
  originalValue: number;
  currentValue: number;
  expiryDate: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED';
  purchaser: string;
  type: 'AMOUNT' | 'SERVICE';
}

export interface Package {
  id: string;
  name: string;
  totalHours: number;
  usedHours: number;
  price: number;
  active: boolean;
  color: string;
}

export interface Category {
  id: string;
  name: string;
  serviceCount: number;
  order: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  status: 'ACTIVE' | 'INACTIVE';
  specialization: string[];
}

export interface Room {
  id: string;
  number: string;
  name: string;
  notes: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface StatCardProps {
  label: string;
  value: string;
  subtext: string;
  icon: React.ElementType;
}