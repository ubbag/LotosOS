import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Layout } from '@components/Layout';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Badge } from '@components/Badge';
import { Modal } from '@components/ui/Modal';
import { ViewToggle } from '@components/ViewToggle';
import { apiClient, handleApiError } from '@services/api';

interface Masazysta {
  id: string;
  imie: string;
  nazwisko: string;
  email?: string;
  telefon?: string;
  specjalizacje: string[];
  aktywny: boolean;
  kolorKalendarza?: string;
}

export const PracownicyPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Masazysta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [editingEmployee, setEditingEmployee] = useState<Masazysta | null>(null);
  const [formData, setFormData] = useState({
    imie: '',
    nazwisko: '',
    email: '',
    telefon: '',
    specjalizacje: '',
    aktywny: true,
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/masazysci', {
        params: { limit: 100 },
      });
      setEmployees(response.data?.data || []);
      setError(null);
    } catch (err) {
      setError('Nie udało się pobrać listy pracowników.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingEmployee(null);
    setFormData({
      imie: '',
      nazwisko: '',
      email: '',
      telefon: '',
      specjalizacje: '',
      aktywny: true,
    });
    setIsModalOpen(true);
  };

  const handleEditClick = (employee: Masazysta) => {
    setEditingEmployee(employee);
    setFormData({
      imie: employee.imie,
      nazwisko: employee.nazwisko,
      email: employee.email || '',
      telefon: employee.telefon || '',
      specjalizacje: employee.specjalizacje.join(', '),
      aktywny: employee.aktywny,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.imie || !formData.nazwisko) {
      setError('Imię i nazwisko są wymagane');
      return;
    }

    const specjalizacjeArray = formData.specjalizacje
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const payload = {
      imie: formData.imie,
      nazwisko: formData.nazwisko,
      email: formData.email || undefined,
      telefon: formData.telefon || undefined,
      specjalizacje: specjalizacjeArray,
      aktywny: formData.aktywny,
    };

    try {
      if (editingEmployee) {
        await apiClient.put(`/masazysci/${editingEmployee.id}`, payload);
      } else {
        await apiClient.post('/masazysci', payload);
      }
      setIsModalOpen(false);
      setFormData({
        imie: '',
        nazwisko: '',
        email: '',
        telefon: '',
        specjalizacje: '',
        aktywny: true,
      });
      loadEmployees();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tego pracownika?')) return;

    try {
      await apiClient.delete(`/masazysci/${id}`);
      loadEmployees();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="p-8 text-center">Ładowanie pracowników...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pracownicy</h1>
            <p className="text-gray-500 mt-1">Zarządzanie personelem i grafikami</p>
          </div>
          <div className="flex gap-3 items-center">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            <Button onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Dodaj Pracownika
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
            <table className="w-full text-left border-collapse">
              <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4 border-b border-blue-100">Imię i Nazwisko</th>
                  <th className="px-6 py-4 border-b border-blue-100">Specjalizacje</th>
                  <th className="px-6 py-4 border-b border-blue-100">Status</th>
                  <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{emp.imie} {emp.nazwisko}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {emp.specjalizacje.map(spec => (
                          <span key={spec} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={emp.aktywny ? 'success' : 'neutral'}>
                        {emp.aktywny ? 'AKTYWNY' : 'NIEAKTYWNY'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Edytuj" onClick={() => handleEditClick(emp)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title="Usuń" onClick={() => handleDelete(emp.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((emp) => (
              <Card key={emp.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                      {emp.imie[0]}{emp.nazwisko[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{emp.imie} {emp.nazwisko}</h3>
                      <Badge variant={emp.aktywny ? 'success' : 'neutral'}>
                        {emp.aktywny ? 'AKTYWNY' : 'NIEAKTYWNY'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-2">Specjalizacje</p>
                  <div className="flex flex-wrap gap-1">
                    {emp.specjalizacje.map(spec => (
                      <span key={spec} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100">
                  <Button variant="ghost" size="sm" title="Edytuj" onClick={() => handleEditClick(emp)} className="flex-1">
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edytuj
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title="Usuń" onClick={() => handleDelete(emp.id)}>
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
          title={editingEmployee ? 'Edytuj Pracownika' : 'Dodaj Pracownika'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię *</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
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
                  value={formData.nazwisko}
                  onChange={(e) => setFormData({ ...formData, nazwisko: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                <input
                  type="tel"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.telefon}
                  onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specjalizacje (oddziel przecinkiem)</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="np. Masaż klasyczny, Kobido"
                value={formData.specjalizacje}
                onChange={(e) => setFormData({ ...formData, specjalizacje: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                className="rounded text-blue-600 focus:ring-blue-500"
                checked={formData.aktywny}
                onChange={(e) => setFormData({ ...formData, aktywny: e.target.checked })}
              />
              <label htmlFor="active" className="text-sm text-gray-700">Aktywny pracownik</label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Anuluj</Button>
              <Button type="submit">{editingEmployee ? 'Zapisz zmiany' : 'Zapisz'}</Button>
            </div>
          </form>
        </Modal>
      </div>
    </Layout>
  );
};
