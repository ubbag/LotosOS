/**
 * Clients Management Page
 * Display, search, and manage customer list
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import {
  Search,
  Plus,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';

// Inline types to avoid module resolution issues
interface Client {
  id: string;
  imie: string;
  nazwisko: string;
  telefon: string;
  email?: string | null;
  zrodlo?: string | null;
  aktywny: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
  };
}

export const Clients = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const limit = 10;

  /**
   * Fetch clients from API
   */
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['clients', page, search],
    queryFn: async () => {
      const response = await api.get<PaginatedResponse<Client>>('/klienci', {
        params: {
          page,
          limit,
          search: search || undefined,
        },
      });
      return response.data;
    },
  });

  const clients = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Klienci</h1>
          <p className="text-gray-600 text-sm mt-1">
            Zarządzaj bazą klientów salonu
          </p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition">
          <Plus size={20} />
          <span>Dodaj Klienta</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={20}
        />
        <input
          type="text"
          placeholder="Szukaj po imieniu, nazwisku lub telefonie..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset to first page on search
          }}
        />
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : isError ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <AlertCircle className="text-red-500 mb-3" size={32} />
            <p className="text-red-600 font-medium">Błąd pobierania danych</p>
            <p className="text-gray-600 text-sm mt-1">
              {error instanceof Error ? error.message : 'Nieznany błąd'}
            </p>
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <p className="text-gray-600 font-medium">Brak klientów</p>
            <p className="text-gray-500 text-sm mt-1">
              Zacznij od dodania nowego klienta
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Imię i Nazwisko
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Telefon
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Źródło
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {client.imie} {client.nazwisko}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {client.telefon}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {client.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {client.zrodlo || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button className="text-blue-600 hover:text-blue-900 text-sm font-medium transition">
                          Edytuj
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-200">
              {clients.map((client) => (
                <div key={client.id} className="p-4 hover:bg-gray-50 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">
                        {client.imie} {client.nazwisko}
                      </p>
                      <p className="text-sm text-gray-600">{client.telefon}</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-900 text-sm font-medium">
                      Edytuj
                    </button>
                  </div>
                  {client.email && (
                    <p className="text-sm text-gray-600">{client.email}</p>
                  )}
                  {client.zrodlo && (
                    <p className="text-xs text-gray-500 mt-1">
                      Źródło: {client.zrodlo}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !isError && pagination && clients.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Wyniki <span className="font-medium">{(page - 1) * limit + 1}</span> -{' '}
            <span className="font-medium">
              {Math.min(page * limit, pagination.total)}
            </span>{' '}
            z <span className="font-medium">{pagination.total}</span>
          </div>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={18} />
              <span className="text-sm">Poprzednia</span>
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, pagination.pages) }).map(
                (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        pageNum === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>
            <button
              disabled={!pagination.hasMore}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span className="text-sm">Następna</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
