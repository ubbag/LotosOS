import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input } from '@components';
import { Plus, Ticket, Calendar, DollarSign, User, Gift, TrendingUp, Activity, Grid3x3, List, Eye } from 'lucide-react';
import { apiClient, handleApiError } from '@services/api';
import { validateEmail, validateOptionalEmail } from '@utils/validation';

interface Voucher {
  id: string;
  kod: string;
  typ: string;
  wartoscPoczatkowa: number;
  wartoscPozostala: number;
  kupujacyImie: string;
  kupujacyEmail: string;
  obdarowanyImie?: string;
  obdarowanyEmail?: string;
  dataZakupu: string;
  dataWaznosci: string;
  status: string;
  zrodlo: string;
}

interface Usluga {
  id: string;
  nazwa: string;
  kategoria: string;
  wariantyUslugi: {
    id: string;
    czasMinut: number;
    cenaRegularna: number;
    cenaPromocyjna?: number;
  }[];
}

export const VoucheryPage: React.FC = () => {
  const [vouchery, setVouchery] = useState<Voucher[]>([]);
  const [uslugi, setUslugi] = useState<Record<string, Usluga[]>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    typ: 'KWOTOWY',
    wartoscPoczatkowa: '',
    uslugaId: '',
    iloscGodzin: '',
    kupujacyImie: '',
    kupujacyEmail: '',
    obdarowanyImie: '',
    obdarowanyEmail: '',
    wiadomosc: '',
    dataWaznosci: '',
    metoda: 'GOTOWKA',
  });
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVouchery();
    loadUslugi();
  }, []);

  const loadUslugi = async () => {
    try {
      const response = await apiClient.get('/uslugi');
      setUslugi(response.data?.data || {});
    } catch (err) {
      console.error('Failed to load services', err);
    }
  };

  const loadVouchery = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/vouchery', {
        params: { limit: 100 },
      });
      // Ensure we get an array
      const data = response.data?.data;
      setVouchery(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 365); // 1 year validity
    setFormData({
      typ: 'KWOTOWY',
      wartoscPoczatkowa: '',
      uslugaId: '',
      iloscGodzin: '',
      kupujacyImie: '',
      kupujacyEmail: '',
      obdarowanyImie: '',
      obdarowanyEmail: '',
      wiadomosc: '',
      dataWaznosci: tomorrow.toISOString().split('T')[0],
      metoda: 'GOTOWKA',
    });
    setShowForm(true);
  };

  const handleViewDetails = (voucher: Voucher) => {
    alert(`Szczegóły vouchera ${voucher.kod} - funkcja w przygotowaniu`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Walidacja
    if (!formData.typ || !formData.kupujacyImie || !formData.kupujacyEmail || !formData.dataWaznosci) {
      setError('Wszystkie wymagane pola muszą być wypełnione');
      return;
    }

    if (formData.typ === 'KWOTOWY') {
      if (!formData.wartoscPoczatkowa) {
        setError('Wartość jest wymagana dla vouchera kwotowego');
        return;
      }
      const wartosc = parseFloat(formData.wartoscPoczatkowa);
      if (wartosc <= 0) {
        setError('Wartość musi być większa od zera');
        return;
      }
    }

    if (formData.typ === 'USLUGOWY' && (!formData.uslugaId || !formData.iloscGodzin)) {
      setError('Usługa i ilość godzin są wymagane dla vouchera usługowego');
      return;
    }

    if (formData.typ === 'USLUGOWY' && formData.iloscGodzin) {
      const godziny = parseFloat(formData.iloscGodzin);
      if (godziny <= 0) {
        setError('Ilość godzin musi być większa od zera');
        return;
      }
    }

    // Validate buyer email (required)
    const buyerEmailValidation = validateEmail(formData.kupujacyEmail);
    if (!buyerEmailValidation.valid) {
      setError('Email kupującego: ' + (buyerEmailValidation.error || 'Nieprawidłowy adres email'));
      return;
    }

    // Validate recipient email (optional)
    if (formData.obdarowanyEmail) {
      const recipientEmailValidation = validateOptionalEmail(formData.obdarowanyEmail);
      if (!recipientEmailValidation.valid) {
        setError('Email obdarowanego: ' + (recipientEmailValidation.error || 'Nieprawidłowy adres email'));
        return;
      }
    }

    const data: any = {
      typ: formData.typ,
      kupujacyImie: formData.kupujacyImie,
      kupujacyEmail: formData.kupujacyEmail,
      obdarowanyImie: formData.obdarowanyImie || undefined,
      obdarowanyEmail: formData.obdarowanyEmail || undefined,
      wiadomosc: formData.wiadomosc || undefined,
      dataWaznosci: formData.dataWaznosci,
      metoda: formData.metoda,
      zrodlo: 'RECEPCJA',
    };

    if (formData.typ === 'KWOTOWY') {
      data.wartosc = parseFloat(formData.wartoscPoczatkowa);
    } else if (formData.typ === 'USLUGOWY') {
      data.uslugaId = formData.uslugaId;
      data.iloscGodzin = parseInt(formData.iloscGodzin, 10);
    }

    try {
      await apiClient.post('/vouchery', data);
      setShowForm(false);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 365);
      setFormData({
        typ: 'KWOTOWY',
        wartoscPoczatkowa: '',
        uslugaId: '',
        iloscGodzin: '',
        kupujacyImie: '',
        kupujacyEmail: '',
        obdarowanyImie: '',
        obdarowanyEmail: '',
        wiadomosc: '',
        dataWaznosci: tomorrow.toISOString().split('T')[0],
        metoda: 'GOTOWKA',
      });
      loadVouchery();
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
      WYKORZYSTANY: 'bg-blue-100 text-blue-800',
      WYGASLY: 'bg-red-100 text-red-800',
      ANULOWANY: 'bg-red-100 text-red-800',
    };
    return styles[status as keyof typeof styles] || 'bg-blue-100 text-blue-800';
  };

  // Statistics calculations
  const statistics = {
    total: vouchery.length,
    aktywne: vouchery.filter(v => v.status === 'AKTYWNY').length,
    wykorzystane: vouchery.filter(v => v.status === 'WYKORZYSTANY').length,
    totalValue: vouchery.reduce((sum, v) => sum + v.wartoscPozostala, 0),
  };

  const filteredVouchery = vouchery.filter((v) => {
    // Filter by status
    if (filterStatus !== 'all' && v.status !== filterStatus) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        v.kod.toLowerCase().includes(query) ||
        v.kupujacyImie.toLowerCase().includes(query) ||
        (v.obdarowanyImie && v.obdarowanyImie.toLowerCase().includes(query))
      );
    }

    return true;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vouchery</h1>
          <Button onClick={handleAddClick} className="flex items-center gap-2">
            <Plus size={20} />
            Wystaw voucher
          </Button>
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
                <p className="text-xs text-gray-600 mb-2">Wszystkie</p>
                <p className="text-2xl font-bold text-blue-600 mb-1">{statistics.total}</p>
                <p className="text-xs text-gray-500">vouchery</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Ticket size={20} className="text-blue-600" />
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
                <p className="text-xs text-gray-600 mb-2">Wykorzystane</p>
                <p className="text-2xl font-bold text-blue-600 mb-1">{statistics.wykorzystane}</p>
                <p className="text-xs text-gray-500">w sumie</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <TrendingUp size={20} className="text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-2">Wartość pozostała</p>
                <p className="text-2xl font-bold text-blue-600 mb-1">{statistics.totalValue.toFixed(0)} zł</p>
                <p className="text-xs text-gray-500">do wykorzystania</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <DollarSign size={20} className="text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Szukaj po kodzie, imieniu lub nazwisku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <Ticket className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </Card>

        {/* Filter & View Mode */}
        <Card className="mb-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {['all', 'AKTYWNY', 'WYKORZYSTANY', 'WYGASLY'].map((status) => (
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
          <Card title="Wystaw nowy voucher" className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Typ vouchera</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.typ}
                    onChange={(e) => setFormData({ ...formData, typ: e.target.value, wartoscPoczatkowa: '', uslugaId: '', iloscGodzin: '' })}
                    required
                  >
                    <option value="KWOTOWY">Kwotowy</option>
                    <option value="USLUGOWY">Usługowy</option>
                  </select>
                </div>
                {formData.typ === 'KWOTOWY' ? (
                  <Input
                    label="Wartość (zł)"
                    type="number"
                    step="0.01"
                    value={formData.wartoscPoczatkowa}
                    onChange={(e) => setFormData({ ...formData, wartoscPoczatkowa: e.target.value })}
                    required
                    min="0"
                  />
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Usługa</label>
                    <select
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={formData.uslugaId}
                      onChange={(e) => setFormData({ ...formData, uslugaId: e.target.value })}
                      required
                    >
                      <option value="">Wybierz usługę</option>
                      {Object.values(uslugi).flat().map((usluga) => (
                        <option key={usluga.id} value={usluga.id}>
                          {usluga.nazwa}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {formData.typ === 'USLUGOWY' && (
                <Input
                  label="Ilość godzin *"
                  type="number"
                  step="0.5"
                  value={formData.iloscGodzin}
                  onChange={(e) => setFormData({ ...formData, iloscGodzin: e.target.value })}
                  required
                  min="0.5"
                  placeholder="np. 2 lub 3.5"
                />
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metoda płatności</label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.metoda}
                  onChange={(e) => setFormData({ ...formData, metoda: e.target.value })}
                  required
                >
                  <option value="GOTOWKA">Gotówka</option>
                  <option value="KARTA">Karta</option>
                  <option value="PRZELEW">Przelew</option>
                </select>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={18} />
                  Dane kupującego
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Imię i nazwisko"
                    value={formData.kupujacyImie}
                    onChange={(e) => setFormData({ ...formData, kupujacyImie: e.target.value })}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.kupujacyEmail}
                    onChange={(e) => setFormData({ ...formData, kupujacyEmail: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Gift size={18} />
                  Dane obdarowanego (opcjonalne)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Imię i nazwisko"
                    value={formData.obdarowanyImie}
                    onChange={(e) => setFormData({ ...formData, obdarowanyImie: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={formData.obdarowanyEmail}
                    onChange={(e) => setFormData({ ...formData, obdarowanyEmail: e.target.value })}
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wiadomość
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={formData.wiadomosc}
                    onChange={(e) => setFormData({ ...formData, wiadomosc: e.target.value })}
                    placeholder="Dedykacja na voucherze..."
                  />
                </div>
              </div>

              <Input
                label="Data ważności"
                type="date"
                value={formData.dataWaznosci}
                onChange={(e) => setFormData({ ...formData, dataWaznosci: e.target.value })}
                required
              />

              <div className="flex gap-2">
                <Button type="submit">Wystaw voucher</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Anuluj
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Vouchers - Grid or List View */}
        {loading ? (
          <Card>
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-600 mt-4">Ładowanie voucherów...</p>
            </div>
          </Card>
        ) : filteredVouchery.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Ticket size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">Brak voucherów</p>
            </div>
          </Card>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVouchery.map((voucher, index) => (
              <Card
                key={voucher.id}
                className="flex flex-col h-full animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(voucher.status)}`}>
                        {voucher.status}
                      </span>
                      <span className="px-2 py-1 bg-gray-200 rounded text-xs font-semibold">
                        {voucher.typ}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ticket size={20} className="text-blue-600" />
                      <code className="font-mono text-lg font-bold text-blue-900">{voucher.kod}</code>
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-3">
                      <p className="text-xs text-gray-600 mb-2">Wartość</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-blue-600">
                          {voucher.wartoscPozostala.toFixed(2)} zł
                        </span>
                        <span className="text-xs text-gray-500">
                          / {voucher.wartoscPoczatkowa.toFixed(2)} zł
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(voucher.wartoscPozostala / voucher.wartoscPoczatkowa) * 100}%`,
                          }}
                        ></div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User size={16} className="text-blue-600" />
                        <p className="text-xs text-gray-600">Kupujący</p>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{voucher.kupujacyImie}</p>
                      <p className="text-xs text-gray-500 truncate">{voucher.kupujacyEmail}</p>
                    </div>

                    {voucher.obdarowanyImie && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Gift size={16} className="text-blue-600" />
                          <p className="text-xs text-gray-600">Obdarowany</p>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">{voucher.obdarowanyImie}</p>
                        <p className="text-xs text-gray-500 truncate">{voucher.obdarowanyEmail}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-blue-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={14} className="text-blue-600" />
                          <p className="text-xs text-gray-600">Zakup</p>
                        </div>
                        <p className="text-xs font-semibold text-blue-900">{formatDate(voucher.dataZakupu)}</p>
                      </div>
                      <div className="bg-red-100 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar size={14} className="text-red-600" />
                          <p className="text-xs text-gray-600">Ważny do</p>
                        </div>
                        <p className="text-xs font-semibold text-red-900">{formatDate(voucher.dataWaznosci)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200 mt-auto">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Eye}
                    onClick={() => handleViewDetails(voucher)}
                    className="w-full"
                  >
                    Zobacz szczegóły
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
                    <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Kod</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Typ</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Wartość</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Kupujący</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Obdarowany</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Data zakupu</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Ważność</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-blue-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVouchery.map((voucher, index) => (
                    <tr
                      key={voucher.id}
                      className={`border-b transition-colors hover:bg-blue-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Ticket size={18} className="text-blue-600" />
                          <code className="font-mono text-sm font-bold text-blue-900">{voucher.kod}</code>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-gray-200 rounded text-xs font-semibold">
                          {voucher.typ}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <DollarSign size={16} className="text-blue-600" />
                          <span className="font-bold text-blue-600">
                            {voucher.wartoscPozostala.toFixed(2)} / {voucher.wartoscPoczatkowa.toFixed(2)} zł
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} className="text-blue-600" />
                          <div>
                            <div className="font-semibold text-gray-900">{voucher.kupujacyImie}</div>
                            <div className="text-sm text-gray-500">{voucher.kupujacyEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {voucher.obdarowanyImie ? (
                          <div className="flex items-center gap-2">
                            <Gift size={16} className="text-blue-600" />
                            <div>
                              <div className="font-semibold text-gray-900">{voucher.obdarowanyImie}</div>
                              <div className="text-sm text-gray-500">{voucher.obdarowanyEmail}</div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-blue-600" />
                          <span className="text-gray-700">{formatDate(voucher.dataZakupu)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-red-600" />
                          <span className="text-gray-700">{formatDate(voucher.dataWaznosci)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(
                            voucher.status
                          )}`}
                        >
                          {voucher.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </Layout>
  );
};
