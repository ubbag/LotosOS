import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input } from '@components';
import { Plus, Edit2, Trash2, Tag, List } from 'lucide-react';
import { apiClient, handleApiError } from '@services/api';

interface Kategoria {
  id: string;
  nazwa: string;
  opis?: string;
  aktywna: boolean;
  kolejnosc: number;
  _count?: {
    uslugi: number;
  };
}

export const KategoriePage: React.FC = () => {
  const [kategorie, setKategorie] = useState<Kategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKategoria, setEditingKategoria] = useState<Kategoria | null>(null);
  const [formData, setFormData] = useState({
    nazwa: '',
    opis: '',
    kolejnosc: 0,
  });

  useEffect(() => {
    loadKategorie();
  }, []);

  const loadKategorie = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/kategorie');
      setKategorie(response.data?.data || []);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingKategoria(null);
    setFormData({
      nazwa: '',
      opis: '',
      kolejnosc: 0,
    });
    setShowModal(true);
  };

  const handleEdit = (kategoria: Kategoria) => {
    setEditingKategoria(kategoria);
    setFormData({
      nazwa: kategoria.nazwa,
      opis: kategoria.opis || '',
      kolejnosc: kategoria.kolejnosc,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingKategoria) {
        await apiClient.put(`/kategorie/${editingKategoria.id}`, formData);
      } else {
        await apiClient.post('/kategorie', formData);
      }
      setShowModal(false);
      loadKategorie();
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię?')) return;

    setLoading(true);
    try {
      await apiClient.delete(`/kategorie/${id}`);
      loadKategorie();
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Tag size={32} className="text-blue-600" />
              Kategorie usług
            </h1>
            <p className="text-gray-600 mt-2">Zarządzaj kategoriami usług masażu</p>
          </div>
          <Button onClick={handleCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Plus size={20} />
            Dodaj kategorię
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading && kategorie.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-gray-500">Ładowanie kategorii...</div>
          </Card>
        ) : kategorie.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Tag size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Brak kategorii</h3>
              <p className="text-gray-600 mb-4">Dodaj pierwszą kategorię usług</p>
              <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={18} className="mr-2" />
                Dodaj kategorię
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kategorie.map((kategoria, index) => (
              <Card
                key={kategoria.id}
                className="flex flex-col h-full animate-fade-in p-4"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Tag size={18} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900 truncate">{kategoria.nazwa}</h3>
                        {kategoria.opis && (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{kategoria.opis}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <List size={14} className="text-blue-600" />
                      <span className="font-medium">{kategoria._count?.uslugi || 0} usług</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500">Kolejność:</span>
                      <span className="font-medium">{kategoria.kolejnosc}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-200 mt-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Edit2}
                    onClick={() => handleEdit(kategoria)}
                    className="flex-1"
                  >
                    Edytuj
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => handleDelete(kategoria.id)}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingKategoria ? 'Edytuj kategorię' : 'Nowa kategoria'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <Input
                  label="Nazwa kategorii"
                  value={formData.nazwa}
                  onChange={(e) => setFormData({ ...formData, nazwa: e.target.value })}
                  required
                  placeholder="np. Masaże relaksacyjne"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Opis (opcjonalnie)</label>
                  <textarea
                    value={formData.opis}
                    onChange={(e) => setFormData({ ...formData, opis: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Krótki opis kategorii..."
                  />
                </div>

                <Input
                  label="Kolejność"
                  type="number"
                  value={formData.kolejnosc}
                  onChange={(e) => setFormData({ ...formData, kolejnosc: parseInt(e.target.value) || 0 })}
                  min={0}
                  placeholder="0"
                />

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    {loading ? 'Zapisywanie...' : editingKategoria ? 'Zapisz zmiany' : 'Dodaj kategorię'}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    variant="secondary"
                    className="flex-1"
                  >
                    Anuluj
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};
