import React, { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, Clock, Edit2, Trash2, History } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';
import { Client } from '../types';
import { fetchClients, createClient, updateClient, deleteClient } from '../services/api';
import { ViewToggle } from './ui/ViewToggle';

export const ClientsView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [submitting, setSubmitting] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [formData, setFormData] = useState({
    imie: '',
    nazwisko: '',
    telefon: '',
    email: '',
    zrodlo: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data: Client[] = await fetchClients();
      setClients(data);
    } catch (err) {
      setError('Nie udało się załadować klientów.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        imie: client.imie,
        nazwisko: client.nazwisko,
        telefon: client.phone,
        email: client.email || '',
        zrodlo: '',
      });
    } else {
      setEditingClient(null);
      setFormData({
        imie: '',
        nazwisko: '',
        telefon: '',
        email: '',
        zrodlo: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.imie.trim() || !formData.nazwisko.trim() || !formData.telefon.trim()) {
      alert('Imię, nazwisko i telefon są wymagane');
      return;
    }

    setSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, formData);
      } else {
        await createClient(formData);
      }

      await loadClients();
      setIsModalOpen(false);
      setFormData({ imie: '', nazwisko: '', telefon: '', email: '', zrodlo: '' });
      setEditingClient(null);
    } catch (err: any) {
      console.error('Error saving client:', err);
      alert(err.response?.data?.message || 'Nie udało się zapisać klienta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Czy na pewno chcesz usunąć klienta ${name}?`)) {
      return;
    }

    try {
      await deleteClient(id);
      await loadClients();
    } catch (err: any) {
      console.error('Error deleting client:', err);
      alert(err.response?.data?.message || 'Nie udało się usunąć klienta');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center p-8">Ładowanie klientów...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Klienci</h1>
          <p className="text-gray-500 mt-1">Zarządzaj bazą klientów salonu</p>
        </div>
        <div className="flex gap-3 items-center">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Szukaj klienta..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button icon={Plus} onClick={() => handleOpenModal()}>Dodaj</Button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Card noPadding className="overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imię i Nazwisko
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefon
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ostatnia Wizyta
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Akcje</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.length > 0 ? (
                filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <img className="h-10 w-10 rounded-full" src={client.avatarUrl} alt={client.name} />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.email || 'Brak'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={client.status === 'ACTIVE' ? 'active' : 'neutral'}>
                        {client.status === 'ACTIVE' ? 'AKTYWNY' : 'NIEAKTYWNY'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {client.lastVisit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" icon={History}>Historia</Button>
                          <Button variant="secondary" size="sm" icon={Edit2} onClick={() => handleOpenModal(client)}>Edytuj</Button>
                          <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => handleDelete(client.id, client.name)}>Usuń</Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    Brak klientów do wyświetlenia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => (
            <Card key={client.id} className="group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <img 
                    src={client.avatarUrl} 
                    alt={client.name} 
                    className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{client.name}</h3>
                    <Badge variant={client.status === 'ACTIVE' ? 'active' : 'neutral'}>
                      {client.status === 'ACTIVE' ? 'AKTYWNY' : 'NIEAKTYWNY'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center text-gray-600 bg-blue-50/50 p-2 rounded-lg">
                  <Mail size={16} className="mr-3 text-blue-500" />
                  <span className="text-sm truncate">{client.email}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-blue-50/50 p-2 rounded-lg">
                  <Phone size={16} className="mr-3 text-blue-500" />
                  <span className="text-sm">{client.phone}</span>
                </div>
                <div className="flex items-center text-gray-600 bg-gray-50 p-2 rounded-lg">
                  <Clock size={16} className="mr-3 text-gray-500" />
                  <span className="text-sm">Ostatnia wizyta: <span className="font-medium text-gray-900">{client.lastVisit}</span></span>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2">
                <Button variant="ghost" size="sm" className="w-full justify-start text-blue-600 hover:bg-blue-50" icon={History}>
                   Historia Wizyt
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" icon={Edit2} onClick={() => handleOpenModal(client)}>Edytuj</Button>
                  <Button variant="danger-ghost" size="sm" className="flex-1" icon={Trash2} onClick={() => handleDelete(client.id, client.name)}>Usuń</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? "Edytuj Klienta" : "Dodaj Nowego Klienta"}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>Anuluj</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{submitting ? 'Zapisywanie...' : 'Zapisz Klienta'}</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="np. Jan"
                  value={formData.imie}
                  onChange={(e) => setFormData({ ...formData, imie: e.target.value })}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwisko *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="np. Kowalski"
                  value={formData.nazwisko}
                  onChange={(e) => setFormData({ ...formData, nazwisko: e.target.value })}
                />
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+48 000 000 000"
                  value={formData.telefon}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Źródło</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.zrodlo}
              onChange={(e) => setFormData({ ...formData, zrodlo: e.target.value })}
            >
              <option value="">Wybierz źródło...</option>
              <option value="TELEFON">Telefon</option>
              <option value="ONLINE">Online</option>
              <option value="WALKIN">Walk-in</option>
              <option value="POLECENIE">Polecenie</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
};