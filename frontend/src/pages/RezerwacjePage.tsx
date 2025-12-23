import React, { useState, useEffect, useMemo } from 'react';
import { Layout, Card, Button, Input } from '@components';
import { Plus, CheckCircle, XCircle, Clock, Calendar as CalendarIcon, Trash2, TrendingUp, DollarSign, Users, Activity, Grid3x3, List } from 'lucide-react';
import { apiClient, handleApiError } from '@services/api';
import { validatePhone, validateOptionalEmail, formatPhoneInput } from '@utils/validation';

interface Klient {
  id: string;
  imie: string;
  nazwisko: string;
  telefon: string;
}

interface Masazysta {
  id: string;
  imie: string;
  nazwisko: string;
}

interface Gabinet {
  id: string;
  numer: string;
  nazwa: string;
}

interface Usluga {
  id: string;
  nazwa: string;
}

interface WariantUslugi {
  id: string;
  czasMinut: number;
  cenaRegularna: number;
  cenaPromocyjna?: number;
}

interface UslugaWithVariants {
  id: string;
  nazwa: string;
  kategoria: string;
  wariantyUslugi: WariantUslugi[];
}

interface Rezerwacja {
  id: string;
  numer: string;
  klient: Klient;
  masazysta: Masazysta;
  gabinet: Gabinet;
  usluga: Usluga;
  wariant: {
    czasMinut: number;
  };
  data: string;
  godzinaOd: string;
  godzinaDo: string;
  status: string;
  platnoscStatus: string;
  cenaCalokowita: number;
  notatki?: string;
}

export const RezerwacjePage: React.FC = () => {
  const [rezerwacje, setRezerwacje] = useState<Rezerwacja[]>([]);
  const [klienci, setKlienci] = useState<Klient[]>([]);
  const [uslugi, setUslugi] = useState<Record<string, UslugaWithVariants[]>>({});
  const [masazysci, setMasazysci] = useState<Masazysta[]>([]);
  const [gabinety, setGabinety] = useState<Gabinet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    klientId: '',
    uslugaId: '',
    wariantId: '',
    masazystaId: '',
    gabinetId: '',
    data: '',
    godzinaOd: '',
    godzinaDo: '',
    notatki: '',
    cenaCalokowita: '',
    platnoscMetoda: 'GOTOWKA',
    zrodlo: 'WALKIN',
  });
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientData, setNewClientData] = useState({
    imie: '',
    nazwisko: '',
    telefon: '',
    email: '',
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRezerwacja, setSelectedRezerwacja] = useState<Rezerwacja | null>(null);
  const [paymentData, setPaymentData] = useState({
    platnoscStatus: 'OPLACONA',
    platnoscMetoda: 'GOTOWKA',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [rezerwacjeRes, klienciRes, uslugiRes, masazysciRes, gabinetyRes] = await Promise.all([
        apiClient.get('/rezerwacje', { params: { limit: 100 } }),
        apiClient.get('/klienci', { params: { limit: 100 } }),
        apiClient.get('/uslugi'),
        apiClient.get('/masazysci', { params: { limit: 100 } }),
        apiClient.get('/gabinety', { params: { limit: 100 } }),
      ]);

      const klienciData = Array.isArray(klienciRes.data?.data) ? klienciRes.data.data : [];
      const uslugiData = uslugiRes.data?.data || {};
      const masazysciData = Array.isArray(masazysciRes.data?.data) ? masazysciRes.data.data : [];
      const gabinetyData = Array.isArray(gabinetyRes.data?.data) ? gabinetyRes.data.data : [];

      console.log('📊 LOADED DATA:');
      console.log('  Klienci:', klienciData.length, klienciData);
      console.log('  Usługi:', uslugiData, 'Categories:', Object.keys(uslugiData));
      console.log('  Masażyści:', masazysciData.length, masazysciData);
      console.log('  Gabinety:', gabinetyData.length, gabinetyData);

      setRezerwacje(Array.isArray(rezerwacjeRes.data?.data) ? rezerwacjeRes.data.data : []);
      setKlienci(klienciData);
      setUslugi(uslugiData);
      setMasazysci(masazysciData);
      setGabinety(gabinetyData);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
      console.error('Load data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    setFormData({
      klientId: '',
      uslugaId: '',
      wariantId: '',
      masazystaId: '',
      gabinetId: '',
      data: tomorrow.toISOString().split('T')[0],
      godzinaOd: '',
      godzinaDo: '',
      notatki: '',
      cenaCalokowita: '',
      platnoscMetoda: 'GOTOWKA',
      zrodlo: 'WALKIN',
    });
    setShowNewClientForm(false);
    setNewClientData({ imie: '', nazwisko: '', telefon: '', email: '' });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Walidacja
    if (!formData.klientId || !formData.uslugaId || !formData.wariantId ||
        !formData.masazystaId || !formData.gabinetId || !formData.data ||
        !formData.godzinaOd || !formData.godzinaDo || !formData.cenaCalokowita) {
      setError('Wszystkie pola są wymagane');
      return;
    }

    try {
      const data = {
        klientId: formData.klientId,
        uslugaId: formData.uslugaId,
        wariantId: formData.wariantId,
        masazystaId: formData.masazystaId,
        gabinetId: formData.gabinetId,
        data: `${formData.data}T00:00:00Z`,
        godzinaOd: `${formData.data}T${formData.godzinaOd}:00Z`,
        godzinaDo: `${formData.data}T${formData.godzinaDo}:00Z`,
        notatki: formData.notatki || undefined,
        cenaCalokowita: parseFloat(formData.cenaCalokowita),
        platnoscMetoda: formData.platnoscMetoda,
        zrodlo: formData.zrodlo,
      };

      await apiClient.post('/rezerwacje', data);
      setShowForm(false);
      setShowNewClientForm(false);
      setNewClientData({ imie: '', nazwisko: '', telefon: '', email: '' });
      setFormData({
        klientId: '',
        uslugaId: '',
        wariantId: '',
        masazystaId: '',
        gabinetId: '',
        data: '',
        godzinaOd: '',
        godzinaDo: '',
        notatki: '',
        cenaCalokowita: '',
        platnoscMetoda: 'GOTOWKA',
        zrodlo: 'WALKIN',
      });
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/rezerwacje/${id}/status`, { status: newStatus });
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleCancel = async (id: string) => {
    if (!window.confirm('Czy na pewno chcesz anulować tę rezerwację?')) return;

    try {
      await apiClient.patch(`/rezerwacje/${id}/status`, { status: 'ANULOWANA' });
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Czy na pewno chcesz TRWALE USUNĄĆ tę rezerwację? Tej operacji nie można cofnąć!')) return;

    try {
      await apiClient.delete(`/rezerwacje/${id}/usun`);
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handlePaymentClick = (rezerwacja: Rezerwacja) => {
    if (rezerwacja.platnoscStatus !== 'NIEOPLACONA') return;

    setSelectedRezerwacja(rezerwacja);
    setPaymentData({
      platnoscStatus: 'OPLACONA',
      platnoscMetoda: 'GOTOWKA',
    });
    setShowPaymentModal(true);
  };

  const handlePaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRezerwacja) return;

    try {
      await apiClient.patch(`/rezerwacje/${selectedRezerwacja.id}/platnosc`, paymentData);
      setShowPaymentModal(false);
      setSelectedRezerwacja(null);
      loadData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleAddNewClient = async () => {
    setError('');

    if (!newClientData.imie || !newClientData.nazwisko || !newClientData.telefon) {
      setError('Imię, nazwisko i telefon nowego klienta są wymagane');
      return;
    }

    // Validate phone (exactly 9 digits)
    const phoneValidation = validatePhone(newClientData.telefon);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error || 'Nieprawidłowy numer telefonu');
      return;
    }

    // Validate email (optional, but if provided must be @domena.pl or @domena.com)
    if (newClientData.email) {
      const emailValidation = validateOptionalEmail(newClientData.email);
      if (!emailValidation.valid) {
        setError(emailValidation.error || 'Nieprawidłowy adres email');
        return;
      }
    }

    try {
      const response = await apiClient.post('/klienci', newClientData);
      const newClient = response.data?.data;

      if (newClient?.id) {
        setFormData({ ...formData, klientId: newClient.id });
        setKlienci([...klienci, newClient]);
        setShowNewClientForm(false);
        setNewClientData({ imie: '', nazwisko: '', telefon: '', email: '' });
      }
    } catch (err: any) {
      const errorMessage = handleApiError(err);
      // Check if error is about duplicate phone number
      if (err?.response?.data?.code === 'CONFLICT' || errorMessage.includes('already exists') || errorMessage.includes('Phone number')) {
        // Try to find existing client by phone
        const existingClient = klienci.find(k => k.telefon === newClientData.telefon);
        if (existingClient) {
          setError(`Numer telefonu ${newClientData.telefon} został już przypisany do klienta: ${existingClient.imie} ${existingClient.nazwisko}`);
        } else {
          setError(`Numer telefonu ${newClientData.telefon} jest już przypisany do innego klienta w systemie`);
        }
      } else {
        setError(errorMessage);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pl-PL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      NOWA: 'bg-blue-100 text-blue-800',
      POTWIERDZONA: 'bg-blue-100 text-blue-800',
      'W TRAKCIE': 'bg-blue-100 text-blue-800',
      ZAKONCZONA: 'bg-blue-100 text-blue-800',
      ANULOWANA: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-blue-100 text-blue-800';
  };

  const getPaymentBadge = (status: string) => {
    const styles = {
      OPLACONA: 'bg-blue-100 text-blue-800',
      NIEOPLACONA: 'bg-red-100 text-red-800',
      CZESCIOWO: 'bg-blue-100 text-blue-800',
    };
    return styles[status as keyof typeof styles] || 'bg-blue-100 text-blue-800';
  };

  const handleVariantChange = (wariantId: string) => {
    setFormData({ ...formData, wariantId });

    // Auto-calculate price
    const allUslugi = Object.values(uslugi).flat();
    for (const usluga of allUslugi) {
      const wariant = usluga.wariantyUslugi.find((w) => w.id === wariantId);
      if (wariant) {
        const cena = wariant.cenaPromocyjna || wariant.cenaRegularna;
        setFormData((prev) => ({ ...prev, wariantId, cenaCalokowita: cena.toString() }));

        // Auto-calculate end time based on duration
        if (formData.godzinaOd) {
          const [hours, minutes] = formData.godzinaOd.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + wariant.czasMinut;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          setFormData((prev) => ({
            ...prev,
            godzinaDo: `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`,
          }));
        }
        break;
      }
    }
  };

  const handleGodzinaOdChange = (godzinaOd: string) => {
    setFormData((prev) => ({ ...prev, godzinaOd }));

    // Auto-calculate end time if variant is selected
    if (formData.wariantId && godzinaOd) {
      const allUslugi = Object.values(uslugi).flat();
      for (const usluga of allUslugi) {
        const wariant = usluga.wariantyUslugi.find((w) => w.id === formData.wariantId);
        if (wariant) {
          const [hours, minutes] = godzinaOd.split(':').map(Number);
          const startMinutes = hours * 60 + minutes;
          const endMinutes = startMinutes + wariant.czasMinut;
          const endHours = Math.floor(endMinutes / 60);
          const endMins = endMinutes % 60;
          setFormData((prev) => ({
            ...prev,
            godzinaDo: `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`,
          }));
          break;
        }
      }
    }
  };

  const allUslugiFlat = useMemo(() => {
    const flat = Object.values(uslugi).flat();
    console.log('allUslugiFlat:', flat.length, flat);
    return flat;
  }, [uslugi]);

  // Statistics calculations
  const statistics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayRezerwacje = rezerwacje.filter(r => {
      const rezDate = new Date(r.data);
      return rezDate >= today && rezDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    const upcoming = rezerwacje.filter(r => {
      const rezDate = new Date(r.data);
      return rezDate > new Date(today.getTime() + 24 * 60 * 60 * 1000) && r.status !== 'ANULOWANA';
    });

    const completed = rezerwacje.filter(r => r.status === 'ZAKONCZONA').length;

    const todayRevenue = todayRezerwacje
      .filter(r => r.platnoscStatus === 'OPLACONA' && r.status !== 'ANULOWANA')
      .reduce((sum, r) => sum + r.cenaCalokowita, 0);

    return {
      todayCount: todayRezerwacje.length,
      upcomingCount: upcoming.length,
      completedCount: completed,
      todayRevenue,
    };
  }, [rezerwacje]);

  const filteredRezerwacje = useMemo(() => {
    return rezerwacje.filter((rez) => {
      if (filterStatus === 'all') return true;
      return rez.status === filterStatus;
    });
  }, [rezerwacje, filterStatus]);

  return (
    <Layout>
      <div className="max-w-full mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Rezerwacje</h1>
          <Button onClick={handleAddClick} className="flex items-center gap-2">
            <Plus size={20} />
            Nowa rezerwacja
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Dzisiaj</p>
                <p className="text-3xl font-bold text-blue-600">{statistics.todayCount}</p>
                <p className="text-xs text-gray-500 mt-1">rezerwacji</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <CalendarIcon size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Nadchodzące</p>
                <p className="text-3xl font-bold text-blue-600">{statistics.upcomingCount}</p>
                <p className="text-xs text-gray-500 mt-1">zaplanowane</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <TrendingUp size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Zakończone</p>
                <p className="text-3xl font-bold text-blue-600">{statistics.completedCount}</p>
                <p className="text-xs text-gray-500 mt-1">w sumie</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Activity size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Przychód dziś</p>
                <p className="text-3xl font-bold text-blue-600">{statistics.todayRevenue.toFixed(0)} zł</p>
                <p className="text-xs text-gray-500 mt-1">opłacone</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign size={24} className="text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter & View Mode */}
        <Card className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2 flex-wrap">
              {['all', 'NOWA', 'POTWIERDZONA', 'W TRAKCIE', 'ZAKONCZONA', 'ANULOWANA'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {status === 'all' ? 'Wszystkie' : status}
                </button>
              ))}
            </div>
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
          </div>
        </Card>

        {/* Form Modal */}
        {showForm && (
          <Card title="Nowa rezerwacja" className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Klient</label>
                  {!showNewClientForm ? (
                    <div className="flex gap-2">
                      <select
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={formData.klientId}
                        onChange={(e) => setFormData({ ...formData, klientId: e.target.value })}
                        required={!showNewClientForm}
                      >
                        <option value="">Wybierz klienta</option>
                        {klienci.map((klient) => (
                          <option key={klient.id} value={klient.id}>
                            {klient.imie} {klient.nazwisko} ({klient.telefon})
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowNewClientForm(true)}
                        className="whitespace-nowrap"
                      >
                        + Nowy
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2 border border-blue-300 rounded-lg p-3 bg-blue-50">
                      <p className="text-sm font-medium text-blue-900">Dodaj nowego klienta:</p>
                      <Input
                        placeholder="Imię"
                        value={newClientData.imie}
                        onChange={(e) => setNewClientData({ ...newClientData, imie: e.target.value })}
                      />
                      <Input
                        placeholder="Nazwisko"
                        value={newClientData.nazwisko}
                        onChange={(e) => setNewClientData({ ...newClientData, nazwisko: e.target.value })}
                      />
                      <Input
                        placeholder="Telefon (9 cyfr)"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newClientData.telefon}
                        onChange={(e) => setNewClientData({ ...newClientData, telefon: formatPhoneInput(e.target.value) })}
                        maxLength={9}
                      />
                      <Input
                        placeholder="Email (opcjonalnie)"
                        type="email"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleAddNewClient}>
                          Dodaj
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setShowNewClientForm(false);
                            setNewClientData({ imie: '', nazwisko: '', telefon: '', email: '' });
                          }}
                        >
                          Anuluj
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Masażysta</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.masazystaId}
                    onChange={(e) => setFormData({ ...formData, masazystaId: e.target.value })}
                    required
                  >
                    <option value="">Wybierz masażystę</option>
                    {masazysci.map((masazysta) => (
                      <option key={masazysta.id} value={masazysta.id}>
                        {masazysta.imie} {masazysta.nazwisko}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usługa</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.uslugaId}
                    onChange={(e) => setFormData({ ...formData, uslugaId: e.target.value, wariantId: '' })}
                    required
                  >
                    <option value="">Wybierz usługę</option>
                    {allUslugiFlat.map((usluga) => (
                      <option key={usluga.id} value={usluga.id}>
                        {usluga.nazwa}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wariant</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.wariantId}
                    onChange={(e) => handleVariantChange(e.target.value)}
                    required
                    disabled={!formData.uslugaId}
                  >
                    <option value="">Wybierz wariant</option>
                    {formData.uslugaId &&
                      allUslugiFlat
                        .find((u) => u.id === formData.uslugaId)
                        ?.wariantyUslugi.map((wariant) => (
                          <option key={wariant.id} value={wariant.id}>
                            {wariant.czasMinut} min - {wariant.cenaPromocyjna || wariant.cenaRegularna} zł
                          </option>
                        ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gabinet</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.gabinetId}
                    onChange={(e) => setFormData({ ...formData, gabinetId: e.target.value })}
                    required
                  >
                    <option value="">Wybierz gabinet</option>
                    {gabinety.map((gabinet) => (
                      <option key={gabinet.id} value={gabinet.id}>
                        {gabinet.nazwa}
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Godzina od"
                  type="time"
                  value={formData.godzinaOd}
                  onChange={(e) => handleGodzinaOdChange(e.target.value)}
                  required
                />
                <Input
                  label="Godzina do"
                  type="time"
                  value={formData.godzinaDo}
                  onChange={(e) => setFormData({ ...formData, godzinaDo: e.target.value })}
                  required
                />
                <Input
                  label="Cena (zł)"
                  type="number"
                  step="0.01"
                  value={formData.cenaCalokowita}
                  onChange={(e) => setFormData({ ...formData, cenaCalokowita: e.target.value })}
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notatki</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.notatki}
                  onChange={(e) => setFormData({ ...formData, notatki: e.target.value })}
                  placeholder="Dodatkowe informacje..."
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Utwórz rezerwację</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Anuluj
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Reservations - Grid or List View */}
        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-600 mt-4">Ładowanie rezerwacji...</p>
            </div>
          </Card>
        ) : filteredRezerwacje.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <CalendarIcon size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">Brak rezerwacji</p>
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRezerwacje.map((rez) => (
              <Card
                key={rez.id}
                className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500 bg-gradient-to-br from-white to-blue-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(rez.status)}`}>
                        {rez.status}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getPaymentBadge(
                          rez.platnoscStatus
                        )} ${rez.platnoscStatus === 'NIEOPLACONA' ? 'cursor-pointer hover:opacity-80' : ''}`}
                        onClick={() => handlePaymentClick(rez)}
                        title={rez.platnoscStatus === 'NIEOPLACONA' ? 'Kliknij aby oznaczyć jako opłaconą' : ''}
                      >
                        {rez.platnoscStatus}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-gray-500">#{rez.numer}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Klient</p>
                    <p className="font-bold text-gray-900 flex items-center gap-2">
                      <Users size={16} className="text-blue-600" />
                      {rez.klient.imie} {rez.klient.nazwisko}
                    </p>
                    <p className="text-xs text-gray-500 ml-6">{rez.klient.telefon}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">Usługa</p>
                    <p className="font-semibold text-gray-900">{rez.usluga.nazwa}</p>
                    <p className="text-xs text-gray-500">{rez.wariant.czasMinut} min</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Masażysta</p>
                      <p className="text-sm font-medium text-gray-900">
                        {rez.masazysta.imie} {rez.masazysta.nazwisko}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Gabinet</p>
                      <p className="text-sm font-medium text-gray-900">{rez.gabinet.nazwa}</p>
                    </div>
                  </div>

                  <div className="bg-blue-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <CalendarIcon size={16} className="text-blue-600" />
                      <span className="font-semibold text-blue-900">{formatDate(rez.data)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-blue-600" />
                      <span className="text-sm text-blue-900">
                        {formatTime(rez.godzinaOd)} - {formatTime(rez.godzinaDo)}
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">Cena</p>
                    <p className="text-2xl font-bold text-blue-600">{rez.cenaCalokowita.toFixed(2)} zł</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  {rez.status === 'NOWA' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(rez.id, 'POTWIERDZONA')}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      title="Potwierdź"
                    >
                      <CheckCircle size={16} className="mr-1" />
                      Potwierdź
                    </Button>
                  )}
                  {rez.status !== 'ANULOWANA' && rez.status !== 'ZAKONCZONA' && (
                    <Button
                      size="sm"
                      onClick={() => handleCancel(rez.id)}
                      className="bg-orange-100 hover:bg-orange-200 text-orange-700"
                      title="Anuluj"
                    >
                      <XCircle size={16} />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handlePermanentDelete(rez.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700"
                    title="Usuń trwale"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-blue-50 border-b-2 border-blue-200">
                  <tr>
                    <th className="px-4 py-4 text-left font-bold text-blue-900">Numer</th>
                    <th className="px-4 py-4 text-left font-bold text-blue-900">Klient</th>
                    <th className="px-4 py-4 text-left font-bold text-blue-900">Usługa</th>
                    <th className="px-4 py-4 text-left font-bold text-blue-900">Masażysta</th>
                    <th className="px-4 py-4 text-left font-bold text-blue-900">Gabinet</th>
                    <th className="px-4 py-4 text-left font-bold text-blue-900">Data i czas</th>
                    <th className="px-4 py-4 text-left font-bold text-blue-900">Cena</th>
                    <th className="px-4 py-4 text-left font-bold text-blue-900">Status</th>
                    <th className="px-4 py-4 text-left font-bold text-blue-900">Płatność</th>
                    <th className="px-4 py-4 text-center font-bold text-blue-900">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRezerwacje.map((rez, index) => (
                    <tr
                      key={rez.id}
                      className={`border-b transition-colors hover:bg-blue-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{rez.numer}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-blue-600" />
                          <div>
                            <div className="font-semibold text-gray-900">
                              {rez.klient.imie} {rez.klient.nazwisko}
                            </div>
                            <div className="text-xs text-gray-500">{rez.klient.telefon}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{rez.usluga.nazwa}</div>
                        <div className="text-xs text-gray-500">{rez.wariant.czasMinut} min</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {rez.masazysta.imie} {rez.masazysta.nazwisko}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{rez.gabinet.nazwa}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 mb-1">
                          <CalendarIcon size={14} className="text-blue-600" />
                          <span className="text-gray-700">{formatDate(rez.data)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} className="text-blue-600" />
                          {formatTime(rez.godzinaOd)} - {formatTime(rez.godzinaDo)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-blue-600 text-base">
                          {rez.cenaCalokowita.toFixed(2)} zł
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(rez.status)}`}>
                          {rez.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getPaymentBadge(
                            rez.platnoscStatus
                          )} ${rez.platnoscStatus === 'NIEOPLACONA' ? 'cursor-pointer hover:opacity-80' : ''}`}
                          onClick={() => handlePaymentClick(rez)}
                          title={rez.platnoscStatus === 'NIEOPLACONA' ? 'Kliknij aby oznaczyć jako opłaconą' : ''}
                        >
                          {rez.platnoscStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-center">
                          {rez.status === 'NOWA' && (
                            <Button
                              size="sm"
                              onClick={() => handleStatusChange(rez.id, 'POTWIERDZONA')}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              title="Potwierdź"
                            >
                              <CheckCircle size={16} />
                            </Button>
                          )}
                          {rez.status !== 'ANULOWANA' && rez.status !== 'ZAKONCZONA' && (
                            <Button
                              size="sm"
                              onClick={() => handleCancel(rez.id)}
                              className="bg-orange-100 hover:bg-orange-200 text-orange-700"
                              title="Anuluj"
                            >
                              <XCircle size={16} />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handlePermanentDelete(rez.id)}
                            className="bg-red-100 hover:bg-red-200 text-red-700"
                            title="Usuń trwale"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedRezerwacja && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Aktualizacja płatności</h3>
            <p className="text-sm text-gray-600 mb-4">
              Rezerwacja: {selectedRezerwacja.klient.imie} {selectedRezerwacja.klient.nazwisko} -{' '}
              {selectedRezerwacja.usluga.nazwa}
            </p>
            <form onSubmit={handlePaymentUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status płatności</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={paymentData.platnoscStatus}
                  onChange={(e) => setPaymentData({ ...paymentData, platnoscStatus: e.target.value })}
                  required
                >
                  <option value="OPLACONA">Opłacona</option>
                  <option value="CZESCIOWO_OPLACONA">Częściowo opłacona</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metoda płatności</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={paymentData.platnoscMetoda}
                  onChange={(e) => setPaymentData({ ...paymentData, platnoscMetoda: e.target.value })}
                  required
                >
                  <option value="GOTOWKA">Gotówka</option>
                  <option value="KARTA">Karta</option>
                  <option value="MIESZANE">Mieszane (gotówka + karta)</option>
                  <option value="PRZELEW">Przelew</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Zapisz</Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedRezerwacja(null);
                  }}
                >
                  Anuluj
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};
