import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input } from '@components';
import { Plus, Edit2, Package, Clock, Calendar, TrendingUp, Users, Activity, Grid3x3, List, Eye } from 'lucide-react';
import { apiClient, handleApiError } from '@services/api';

interface PakietDefinicja {
  id: string;
  nazwa: string;
  liczbaGodzin: number;
  cena: number;
  waznoscDni: number;
  aktywny: boolean;
}

interface PakietKlienta {
  id: string;
  klient: {
    id: string;
    imie: string;
    nazwisko: string;
    telefon: string;
  };
  pakiet: PakietDefinicja;
  godzinyWykupione: number;
  godzinyWykorzystane: number;
  godzinyPozostale: number;
  dataZakupu: string;
  dataWaznosci: string;
  status: string;
}

export const PakietyPage: React.FC = () => {
  const [pakiety, setPakiety] = useState<PakietDefinicja[]>([]);
  const [zakupionePakiety, setZakupionePakiety] = useState<PakietKlienta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PakietDefinicja | null>(null);
  const [formData, setFormData] = useState({
    nazwa: '',
    liczbaGodzin: '',
    cena: '',
    waznoscDni: '',
  });
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'definicje' | 'zakupione'>('definicje');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pakietyRes, zakupioneRes] = await Promise.all([
        apiClient.get('/pakiety/definicje'),
        apiClient.get('/pakiety/wszystkie'),
      ]);
      setPakiety(pakietyRes.data?.data || []);
      setZakupionePakiety(zakupioneRes.data?.data || []);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedPackage(null);
    setFormData({ nazwa: '', liczbaGodzin: '', cena: '', waznoscDni: '' });
    setShowForm(true);
  };

  const handleEditClick = (pkg: PakietDefinicja) => {
    setSelectedPackage(pkg);
    setFormData({
      nazwa: pkg.nazwa,
      liczbaGodzin: pkg.liczbaGodzin.toString(),
      cena: pkg.cena.toString(),
      waznoscDni: pkg.waznoscDni.toString(),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Walidacja
    if (!formData.nazwa || !formData.liczbaGodzin || !formData.cena || !formData.waznoscDni) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    const liczbaGodzin = parseInt(formData.liczbaGodzin);
    const cena = parseFloat(formData.cena);
    const waznoscDni = parseInt(formData.waznoscDni);

    if (liczbaGodzin <= 0 || cena <= 0 || waznoscDni <= 0) {
      setError('Wartości muszą być większe od zera');
      return;
    }

    const data = {
      nazwa: formData.nazwa,
      liczbaGodzin,
      cena,
      waznoscDni,
    };

    try {
      if (selectedPackage) {
        await apiClient.put(`/pakiety/definicje/${selectedPackage.id}`, data);
      } else {
        await apiClient.post('/pakiety/definicje', data);
      }
      setShowForm(false);
      setFormData({ nazwa: '', liczbaGodzin: '', cena: '', waznoscDni: '' });
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      AKTYWNY: 'bg-blue-100 text-blue-800',
      WYGASLY: 'bg-red-100 text-red-800',
      WYKORZYSTANY: 'bg-blue-100 text-blue-800',
    };
    return styles[status as keyof typeof styles] || 'bg-blue-100 text-blue-800';
  };

  // Statistics calculations for purchased packages
  const statistics = {
    totalPakiety: pakiety.length,
    totalZakupione: zakupionePakiety.length,
    aktywne: zakupionePakiety.filter(p => p.status === 'AKTYWNY').length,
    totalRevenue: zakupionePakiety.reduce((sum, p) => sum + p.pakiet.cena, 0),
    totalHoursRemaining: zakupionePakiety.reduce((sum, p) => sum + p.godzinyPozostale, 0),
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pakiety</h1>
          {activeTab === 'definicje' && (
            <Button onClick={handleAddClick} className="flex items-center gap-2">
              <Plus size={20} />
              Dodaj pakiet
            </Button>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-2">Definicje</p>
                <p className="text-2xl font-bold text-blue-600 mb-1">{statistics.totalPakiety}</p>
                <p className="text-xs text-gray-500">typów pakietów</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Package size={20} className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-2">Zakupione</p>
                <p className="text-2xl font-bold text-blue-600 mb-1">{statistics.totalZakupione}</p>
                <p className="text-xs text-gray-500">w sumie</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users size={20} className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-2">Aktywne</p>
                <p className="text-2xl font-bold text-blue-600 mb-1">{statistics.aktywne}</p>
                <p className="text-xs text-gray-500">do wykorzystania</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Activity size={20} className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-2">Godziny pozostałe</p>
                <p className="text-2xl font-bold text-blue-600 mb-1">{statistics.totalHoursRemaining}h</p>
                <p className="text-xs text-gray-500">do wykorzystania</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Clock size={20} className="text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs & View Mode */}
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('definicje')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'definicje'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Definicje pakietów
              </button>
              <button
                onClick={() => setActiveTab('zakupione')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'zakupione'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Zakupione pakiety
              </button>
            </div>
            {activeTab === 'zakupione' && (
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Grid3x3 size={18} />
                  Siatka
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <List size={18} />
                  Lista
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Form Modal */}
        {showForm && (
          <Card title={selectedPackage ? 'Edytuj pakiet' : 'Dodaj nowy pakiet'} className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nazwa pakietu"
                value={formData.nazwa}
                onChange={(e) => setFormData({ ...formData, nazwa: e.target.value })}
                required
                placeholder="np. Pakiet 10 godzin"
              />
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Liczba godzin"
                  type="number"
                  value={formData.liczbaGodzin}
                  onChange={(e) => setFormData({ ...formData, liczbaGodzin: e.target.value })}
                  required
                  min="1"
                />
                <Input
                  label="Cena (zł)"
                  type="number"
                  step="0.01"
                  value={formData.cena}
                  onChange={(e) => setFormData({ ...formData, cena: e.target.value })}
                  required
                  min="0"
                />
                <Input
                  label="Ważność (dni)"
                  type="number"
                  value={formData.waznoscDni}
                  onChange={(e) => setFormData({ ...formData, waznoscDni: e.target.value })}
                  required
                  min="1"
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

        {/* Content */}
        {loading ? (
          <Card>
            <p className="text-gray-600">Ładowanie...</p>
          </Card>
        ) : activeTab === 'definicje' ? (
          /* Package Definitions */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pakiety.length === 0 ? (
              <Card>
                <p className="text-gray-600">Brak pakietów</p>
              </Card>
            ) : (
              pakiety.map((pkg, index) => (
                <Card
                  key={pkg.id}
                  className="flex flex-col h-full animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="text-blue-600" size={24} />
                        <h3 className="text-lg font-bold text-gray-900">{pkg.nazwa}</h3>
                      </div>
                    </div>
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Clock size={16} />
                          Godziny
                        </span>
                        <span className="font-semibold">{pkg.liczbaGodzin}h</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b">
                        <span className="text-gray-600">Cena</span>
                        <span className="font-semibold text-blue-600">{pkg.cena.toFixed(2)} zł</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Calendar size={16} />
                          Ważność
                        </span>
                        <span className="font-semibold">{pkg.waznoscDni} dni</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-gray-200 mt-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleEditClick(pkg)}
                      className="w-full"
                    >
                      Edytuj pakiet
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        ) : (
          /* Purchased Packages - Grid or List View */
          <>
            {zakupionePakiety.length === 0 ? (
              <Card>
                <div className="text-center py-12">
                  <Package size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 text-lg">Brak zakupionych pakietów</p>
                </div>
              </Card>
            ) : viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zakupionePakiety.map((pkg, index) => (
                  <Card
                    key={pkg.id}
                    className="flex flex-col h-full animate-fade-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="flex-1">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(pkg.status)}`}>
                            {pkg.status}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">{pkg.pakiet.nazwa}</h3>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="bg-blue-100 rounded-lg p-3">
                          <p className="text-xs text-gray-600 mb-2">Klient</p>
                          <div className="flex items-center gap-3">
                            <Users size={18} className="text-blue-600" />
                            <div>
                              <p className="font-semibold text-blue-900 text-sm">
                                {pkg.klient.imie} {pkg.klient.nazwisko}
                              </p>
                              <p className="text-xs text-blue-700 mt-1">{pkg.klient.telefon}</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2">Wykupione</p>
                            <p className="text-xl font-bold text-gray-900">{pkg.godzinyWykupione}h</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2">Pozostało</p>
                            <p className="text-xl font-bold text-blue-600">{pkg.godzinyPozostale}h</p>
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar size={16} className="text-blue-600" />
                            <p className="text-xs text-gray-600">Data zakupu</p>
                          </div>
                          <p className="font-semibold text-blue-900 text-sm">{formatDate(pkg.dataZakupu)}</p>
                        </div>

                        <div className="bg-red-50 rounded-lg border border-red-200 p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={16} className="text-red-600" />
                            <p className="text-xs text-gray-600">Ważność do</p>
                          </div>
                          <p className="font-semibold text-red-900 text-sm">{formatDate(pkg.dataWaznosci)}</p>
                        </div>

                        <div className="pt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full transition-all"
                              style={{
                                width: `${(pkg.godzinyPozostale / pkg.godzinyWykupione) * 100}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            {((pkg.godzinyPozostale / pkg.godzinyWykupione) * 100).toFixed(0)}% pozostało
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200 mt-auto">
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Eye}
                        onClick={() => alert('Funkcja w przygotowaniu')}
                        className="w-full"
                      >
                        Szczegóły
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              /* List View */
              <Card>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-50 border-b-2 border-blue-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Klient</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Pakiet</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Godziny</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Data zakupu</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Ważność do</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Postęp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zakupionePakiety.map((pkg, index) => (
                        <tr
                          key={pkg.id}
                          className={`border-b transition-colors hover:bg-blue-50 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Users size={16} className="text-blue-600" />
                              <div>
                                <div className="font-semibold text-gray-900">
                                  {pkg.klient.imie} {pkg.klient.nazwisko}
                                </div>
                                <div className="text-sm text-gray-500">{pkg.klient.telefon}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-medium text-gray-900">{pkg.pakiet.nazwa}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <TrendingUp size={16} className="text-blue-600" />
                              <span className="font-bold text-blue-600">
                                {pkg.godzinyPozostale}/{pkg.godzinyWykupione}h
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Calendar size={14} className="text-blue-600" />
                              <span className="text-gray-700">{formatDate(pkg.dataZakupu)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-red-600" />
                              <span className="text-gray-700">{formatDate(pkg.dataWaznosci)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(pkg.status)}`}
                            >
                              {pkg.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="w-24">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{
                                    width: `${(pkg.godzinyPozostale / pkg.godzinyWykupione) * 100}%`,
                                  }}
                                ></div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                {((pkg.godzinyPozostale / pkg.godzinyWykupione) * 100).toFixed(0)}%
                              </p>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};
