import React, { useState, useEffect } from 'react';
import { Search, Plus, Mail, Phone, Clock, Edit2, Trash2 } from 'lucide-react';
import { Layout } from '@components/Layout';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Badge } from '@components/Badge';
import { Modal } from '@components/ui/Modal';
import { ViewToggle } from '@components/ViewToggle';
import { apiClient, handleApiError } from '@services/api';

interface Klient {
  id: string;
  imie: string;
  nazwisko: string;
  email?: string;
  telefon: string;
  status: string;
  dataUrodzenia?: string;
  przeciwwskazania?: string;
  notatki?: string;
  dataRejestracji: string;
  ostatniaWizyta?: string;
}

export const KlienciPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState<Klient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingKlient, setEditingKlient] = useState<Klient | null>(null);
  const [formData, setFormData] = useState({
    imie: '',
    nazwisko: '',
    email: '',
    telefon: '',
    dataUrodzenia: '',
    przeciwwskazania: '',
    notatki: '',
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/klienci', {
        params: { limit: 100 },
      });
      setClients(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError('Nie udało się załadować klientów.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingKlient(null);
    setFormData({
      imie: '',
      nazwisko: '',
      email: '',
      telefon: '',
      dataUrodzenia: '',
      przeciwwskazania: '',
      notatki: '',
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (klient: Klient) => {
    setEditingKlient(klient);
    setFormData({
      imie: klient.imie,
      nazwisko: klient.nazwisko,
      email: klient.email || '',
      telefon: klient.telefon,
      dataUrodzenia: klient.dataUrodzenia || '',
      przeciwwskazania: klient.przeciwwskazania || '',
      notatki: klient.notatki || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.imie || !formData.nazwisko || !formData.telefon) {
      setError('Imię, nazwisko i telefon są wymagane');
      return;
    }

    try {
      if (editingKlient) {
        await apiClient.put(`/klienci/${editingKlient.id}`, formData);
      } else {
        await apiClient.post('/klienci', formData);
      }
      setIsModalOpen(false);
      setFormData({
        imie: '',
        nazwisko: '',
        email: '',
        telefon: '',
        dataUrodzenia: '',
        przeciwwskazania: '',
        notatki: '',
      });
      loadClients();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego klienta?')) return;

    try {
      await apiClient.delete(`/klienci/${id}`);
      loadClients();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const filteredClients = clients.filter(c =>
    `${c.imie} ${c.nazwisko}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefon.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Brak';
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center p-8">Ładowanie klientów...</div>
      </Layout>
    );
  }

  return (
    <Layout>
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
            <Button onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {viewMode === 'list' ? (
          <Card className="overflow-hidden p-0">
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
                        <div className="font-medium text-gray-900">{client.imie} {client.nazwisko}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.email || 'Brak'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.telefon}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'}>
                          {client.status === 'ACTIVE' ? 'AKTYWNY' : 'NIEAKTYWNY'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(client.ostatniaWizyta)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditClick(client)}>
                            <Edit2 className="h-4 w-4 mr-1" />
                            Edytuj
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(client.id)}>
                            <Trash2 className="h-4 w-4 mr-1" />
                            Usuń
                          </Button>
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
              <Card key={client.id} className="group p-4">
                <div className="bg-gradient-to-r from-blue-50/30 to-transparent rounded-lg mb-3 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {client.imie[0]}{client.nazwisko[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">{client.imie} {client.nazwisko}</h3>
                      <Badge variant={client.status === 'ACTIVE' ? 'success' : 'neutral'}>
                        {client.status === 'ACTIVE' ? 'AKTYWNY' : 'NIEAKTYWNY'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex items-center text-gray-600 bg-blue-50/50 rounded-lg p-2">
                    <Mail size={16} className="mr-3 text-blue-500" />
                    <span className="text-xs truncate">{client.email || 'Brak'}</span>
                  </div>
                  <div className="flex items-center text-gray-600 bg-blue-50/50 rounded-lg p-2">
                    <Phone size={16} className="mr-3 text-blue-500" />
                    <span className="text-xs">{client.telefon}</span>
                  </div>
                  <div className="flex items-center text-gray-600 bg-gray-50 rounded-lg p-2">
                    <Clock size={16} className="mr-3 text-gray-500" />
                    <span className="text-xs">Ostatnia wizyta: <span className="font-medium text-gray-900">{formatDate(client.ostatniaWizyta)}</span></span>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-gray-100 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(client)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edytuj
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(client.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingKlient ? 'Edytuj Klienta' : 'Dodaj Nowego Klienta'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Jan"
                  value={formData.imie}
                  onChange={(e) => setFormData({ ...formData, imie: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nazwisko *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Kowalski"
                  value={formData.nazwisko}
                  onChange={(e) => setFormData({ ...formData, nazwisko: e.target.value })}
                  required
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
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data urodzenia</label>
              <input
                type="date"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.dataUrodzenia}
                onChange={(e) => setFormData({ ...formData, dataUrodzenia: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Przeciwwskazania</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-20"
                placeholder="Alergie, choroby przewlekłe..."
                value={formData.przeciwwskazania}
                onChange={(e) => setFormData({ ...formData, przeciwwskazania: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notatki</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24"
                placeholder="Dodatkowe informacje..."
                value={formData.notatki}
                onChange={(e) => setFormData({ ...formData, notatki: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Anuluj</Button>
              <Button type="submit">{editingKlient ? 'Zapisz zmiany' : 'Zapisz klienta'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};
