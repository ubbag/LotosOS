import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input } from '@components';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { apiClient, handleApiError } from '@services/api';

interface Gabinet {
  id: string;
  numer: string;
  nazwa: string;
  aktywny: boolean;
  notatki?: string;
}

export const GabinetyPage: React.FC = () => {
  const [gabinety, setGabinety] = useState<Gabinet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedGabinet, setSelectedGabinet] = useState<Gabinet | null>(null);
  const [formData, setFormData] = useState({
    numer: '',
    nazwa: '',
    notatki: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    loadGabinety();
  }, []);

  const loadGabinety = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/gabinety', {
        params: { limit: 100 },
      });
      setGabinety(response.data?.data || []);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedGabinet(null);
    setFormData({ numer: '', nazwa: '', notatki: '' });
    setShowForm(true);
  };

  const handleEditClick = (gabinet: Gabinet) => {
    setSelectedGabinet(gabinet);
    setFormData({
      numer: gabinet.numer,
      nazwa: gabinet.nazwa,
      notatki: gabinet.notatki || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.numer || !formData.nazwa) {
      setError('Numer i nazwa gabinetu są wymagane');
      return;
    }

    try {
      if (selectedGabinet) {
        await apiClient.put(`/gabinety/${selectedGabinet.id}`, formData);
      } else {
        await apiClient.post('/gabinety', formData);
      }
      setShowForm(false);
      setFormData({ numer: '', nazwa: '', notatki: '' });
      loadGabinety();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć ten gabinet?')) return;

    try {
      await apiClient.delete(`/gabinety/${id}`);
      loadGabinety();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gabinety</h1>
          <Button onClick={handleAddClick} className="flex items-center gap-2">
            <Plus size={20} />
            Dodaj gabinet
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <Card
            title={selectedGabinet ? 'Edytuj gabinet' : 'Dodaj nowy gabinet'}
            className="mb-6"
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Numer gabinetu"
                  value={formData.numer}
                  onChange={(e) => setFormData({ ...formData, numer: e.target.value })}
                  required
                  placeholder="1"
                />
                <Input
                  label="Nazwa gabinetu"
                  value={formData.nazwa}
                  onChange={(e) => setFormData({ ...formData, nazwa: e.target.value })}
                  required
                  placeholder="Gabinet Relaks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notatki (opcjonalnie)
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.notatki}
                  onChange={(e) => setFormData({ ...formData, notatki: e.target.value })}
                  placeholder="Np. Stół do masażu tajskiego, Gabinet z laserem na podczerwień..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Zapisz</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Anuluj
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Table */}
        <Card>
          {loading ? (
            <p className="text-gray-600">Ładowanie...</p>
          ) : gabinety.length === 0 ? (
            <p className="text-gray-600">Brak gabinetów</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Numer
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Nazwa
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Notatki
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gabinety.map((gabinet) => (
                    <tr key={gabinet.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{gabinet.numer}</td>
                      <td className="px-6 py-4">{gabinet.nazwa}</td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {gabinet.notatki || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            gabinet.aktywny
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {gabinet.aktywny ? 'Aktywny' : 'Nieaktywny'}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(gabinet)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(gabinet.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </Layout>
  );
};
