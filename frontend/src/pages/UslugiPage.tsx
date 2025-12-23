import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Sparkles, Clock } from 'lucide-react';
import { Layout } from '@components/Layout';
import { Card } from '@components/Card';
import { Button } from '@components/Button';
import { Badge } from '@components/Badge';
import { ViewToggle } from '@components/ViewToggle';
import { apiClient, handleApiError } from '@services/api';

interface Wariant {
  id: string;
  czasMinut: number;
  cenaRegularna: number;
  cenaPromocyjna?: number;
}

interface Usluga {
  id: string;
  nazwa: string;
  kategoriaId: string;
  kategoria?: {
    id: string;
    nazwa: string;
  };
  wariantyUslugi: Wariant[];
  aktywna: boolean;
}

interface Kategoria {
  id: string;
  nazwa: string;
}

export const UslugiPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [uslugi, setUslugi] = useState<Usluga[]>([]);
  const [kategorie, setKategorie] = useState<Kategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUsluga, setEditingUsluga] = useState<Usluga | null>(null);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nazwa: '',
    kategoriaId: '',
    warianty: [{ czasMinut: 60, cenaRegularna: 0, cenaPromocyjna: 0 }],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [uslugiRes, kategorieRes] = await Promise.all([
        apiClient.get('/uslugi'),
        apiClient.get('/kategorie'),
      ]);

      // Flatten grouped services
      const grouped = uslugiRes.data?.data || {};
      const allServices: Usluga[] = [];
      Object.values(grouped).forEach((serviceArray: any) => {
        if (Array.isArray(serviceArray)) {
          allServices.push(...serviceArray);
        }
      });

      setUslugi(allServices);
      setKategorie(kategorieRes.data?.data || []);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setEditingUsluga(null);
    setFormData({
      nazwa: '',
      kategoriaId: '',
      warianty: [{ czasMinut: 60, cenaRegularna: 0, cenaPromocyjna: 0 }],
    });
    setShowForm(true);
  };

  const handleEditClick = (usluga: Usluga) => {
    setEditingUsluga(usluga);
    setFormData({
      nazwa: usluga.nazwa,
      kategoriaId: usluga.kategoriaId,
      warianty: usluga.wariantyUslugi.map(w => ({
        czasMinut: w.czasMinut,
        cenaRegularna: w.cenaRegularna,
        cenaPromocyjna: w.cenaPromocyjna || 0,
      })),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.nazwa || !formData.kategoriaId) {
      setError('Nazwa i kategoria są wymagane');
      return;
    }

    const payload = {
      nazwa: formData.nazwa,
      kategoriaId: formData.kategoriaId,
      warianty: formData.warianty,
    };

    try {
      if (editingUsluga) {
        await apiClient.put(`/uslugi/${editingUsluga.id}`, payload);
      } else {
        await apiClient.post('/uslugi', payload);
      }
      setShowForm(false);
      setFormData({
        nazwa: '',
        kategoriaId: '',
        warianty: [{ czasMinut: 60, cenaRegularna: 0, cenaPromocyjna: 0 }],
      });
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Czy na pewno chcesz usunąć tę usługę?')) return;

    try {
      await apiClient.delete(`/uslugi/${id}`);
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const addWariant = () => {
    setFormData({
      ...formData,
      warianty: [...formData.warianty, { czasMinut: 60, cenaRegularna: 0, cenaPromocyjna: 0 }],
    });
  };

  const removeWariant = (index: number) => {
    setFormData({
      ...formData,
      warianty: formData.warianty.filter((_, i) => i !== index),
    });
  };

  const updateWariant = (index: number, field: string, value: number) => {
    const newWarianty = [...formData.warianty];
    newWarianty[index] = { ...newWarianty[index], [field]: value };
    setFormData({ ...formData, warianty: newWarianty });
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center p-8">Ładowanie usług...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Usługi</h1>
            <p className="text-gray-500 mt-1">Katalog usług i cennik</p>
          </div>
          <div className="flex gap-3 items-center">
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
            <Button onClick={handleAddClick}>
              <Plus className="h-4 w-4 mr-2" />
              Nowa Usługa
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <Card title={editingUsluga ? 'Edytuj usługę' : 'Dodaj nową usługę'} className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nazwa usługi *</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.nazwa}
                    onChange={(e) => setFormData({ ...formData, nazwa: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kategoria *</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.kategoriaId}
                    onChange={(e) => setFormData({ ...formData, kategoriaId: e.target.value })}
                    required
                  >
                    <option value="">Wybierz kategorię</option>
                    {kategorie.map(kat => (
                      <option key={kat.id} value={kat.id}>{kat.nazwa}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Warianty czasowe</label>
                  <Button type="button" size="sm" onClick={addWariant}>
                    <Plus className="h-4 w-4 mr-1" />
                    Dodaj wariant
                  </Button>
                </div>
                {formData.warianty.map((wariant, index) => (
                  <div key={index} className="grid grid-cols-4 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Czas (min)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={wariant.czasMinut}
                        onChange={(e) => updateWariant(index, 'czasMinut', parseInt(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Cena (PLN)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={wariant.cenaRegularna}
                        onChange={(e) => updateWariant(index, 'cenaRegularna', parseFloat(e.target.value))}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Cena promo (PLN)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={wariant.cenaPromocyjna}
                        onChange={(e) => updateWariant(index, 'cenaPromocyjna', parseFloat(e.target.value))}
                      />
                    </div>
                    <div className="flex items-end">
                      {formData.warianty.length > 1 && (
                        <Button type="button" size="sm" variant="danger" onClick={() => removeWariant(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uslugi.map(service => (
              <Card key={service.id} className="group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Sparkles size={24} />
                  </div>
                  <Badge variant={service.aktywna ? 'success' : 'neutral'}>
                    {service.aktywna ? 'AKTYWNA' : 'NIEAKTYWNA'}
                  </Badge>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1">{service.nazwa}</h3>
                <p className="text-sm text-gray-500 mb-4">{service.kategoria?.nazwa || 'Bez kategorii'}</p>

                <div className="space-y-2 mb-4">
                  {service.wariantyUslugi.map((wariant, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                      <div className="flex items-center text-gray-600 text-sm">
                        <Clock size={16} className="mr-2" />
                        {wariant.czasMinut} min
                      </div>
                      <div className="font-bold text-indigo-600">
                        {wariant.cenaRegularna} PLN
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100 mt-auto">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditClick(service)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edytuj
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title="Usuń" onClick={() => handleDelete(service.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden p-0">
            <table className="w-full text-left border-collapse">
              <thead className="bg-blue-50 text-blue-900 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4 border-b border-blue-100">Nazwa Usługi</th>
                  <th className="px-6 py-4 border-b border-blue-100">Kategoria</th>
                  <th className="px-6 py-4 border-b border-blue-100">Warianty</th>
                  <th className="px-6 py-4 border-b border-blue-100">Status</th>
                  <th className="px-6 py-4 border-b border-blue-100 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uslugi.map(service => (
                  <tr key={service.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-indigo-400" />
                        {service.nazwa}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{service.kategoria?.nazwa || 'Bez kategorii'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {service.wariantyUslugi.map((w, idx) => (
                          <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                            {w.czasMinut}min - {w.cenaRegularna}zł
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={service.aktywna ? 'success' : 'neutral'}>
                        {service.aktywna ? 'AKTYWNA' : 'NIEAKTYWNA'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" title="Edytuj" onClick={() => handleEditClick(service)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" title="Usuń" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </Layout>
  );
};
