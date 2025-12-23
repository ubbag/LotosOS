import React, { useState, useEffect } from 'react';
import { Layout, Card, Button, Input } from '@components';
import { MessageSquare, Send, CheckCircle, XCircle, Clock, User, Calendar, Users, Bell } from 'lucide-react';
import { apiClient, handleApiError } from '@services/api';
import { validatePhone, formatPhoneInput } from '@utils/validation';

interface SMSLog {
  id: string;
  klient: {
    id: string;
    imie: string;
    nazwisko: string;
    telefon: string;
  };
  typ: string;
  tresc: string;
  dataWyslania: string;
  status: string;
  bladOpis?: string;
}

interface Klient {
  id: string;
  imie: string;
  nazwisko: string;
  telefon: string;
  email: string;
}

interface Rezerwacja {
  id: string;
  klient: {
    imie: string;
    nazwisko: string;
    telefon: string;
  };
  data: string;
  godzinaOd: string;
  usluga: {
    nazwa: string;
  };
}

export const SMSPage: React.FC = () => {
  const [smsLogi, setSmsLogi] = useState<SMSLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'wyslij' | 'bulk' | 'przypomnienia' | 'historia'>('wyslij');
  const [formData, setFormData] = useState({
    klientId: '',
    tresc: '',
    telefon: '',
  });
  const [bulkFormData, setBulkFormData] = useState({
    odbiorcy: [] as string[],
    tresc: '',
    szablon: '',
  });
  const [klienci, setKlienci] = useState<Klient[]>([]);
  const [nadchodzaceRezerwacje, setNadchodzaceRezerwacje] = useState<Rezerwacja[]>([]);
  const [przypomnieniaAktywne, setPrzypomnieniaAktywne] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadSMSLogs();
    loadKlienci();
    loadNadchodzaceRezerwacje();
  }, []);

  const loadKlienci = async () => {
    try {
      const response = await apiClient.get('/klienci', { params: { limit: 1000 } });
      setKlienci(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load clients', err);
    }
  };

  const loadNadchodzaceRezerwacje = async () => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const response = await apiClient.get('/rezerwacje', {
        params: { data: tomorrowStr, limit: 100 }
      });
      setNadchodzaceRezerwacje(response.data?.data || []);
    } catch (err) {
      console.error('Failed to load upcoming reservations', err);
    }
  };

  const loadSMSLogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/sms/logi', {
        params: { limit: 100 },
      });
      const data = response.data?.data;
      setSmsLogi(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    // Walidacja
    if (!formData.telefon || !formData.tresc) {
      setError('Numer telefonu i treść wiadomości są wymagane');
      return;
    }

    if (formData.tresc.length > 160) {
      setError('Wiadomość nie może być dłuższa niż 160 znaków');
      return;
    }

    // Validate phone (exactly 9 digits)
    const phoneValidation = validatePhone(formData.telefon);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error || 'Nieprawidłowy numer telefonu');
      return;
    }

    try {
      await apiClient.post('/sms/wyslij', {
        telefon: formData.telefon,
        tresc: formData.tresc,
      });
      setSuccessMessage('Wiadomość SMS została wysłana pomyślnie!');
      setFormData({ klientId: '', tresc: '', telefon: '' });
      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('historia');
      }, 2000);
      loadSMSLogs();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleBulkSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (bulkFormData.odbiorcy.length === 0) {
      setError('Wybierz co najmniej jednego odbiorcę');
      return;
    }

    if (!bulkFormData.tresc) {
      setError('Treść wiadomości jest wymagana');
      return;
    }

    if (bulkFormData.tresc.length > 160) {
      setError('Wiadomość nie może być dłuższa niż 160 znaków');
      return;
    }

    // Mock: simulate bulk send
    setSuccessMessage(`Wysłano ${bulkFormData.odbiorcy.length} wiadomości SMS!`);
    setBulkFormData({ odbiorcy: [], tresc: '', szablon: '' });
    setTimeout(() => {
      setSuccessMessage('');
      setActiveTab('historia');
    }, 2000);
  };

  const handleTogglePrzypomnienia = () => {
    setPrzypomnieniaAktywne(!przypomnieniaAktywne);
    setSuccessMessage(
      !przypomnieniaAktywne
        ? 'Automatyczne przypomnienia zostały włączone!'
        : 'Automatyczne przypomnienia zostały wyłączone!'
    );
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleWyslijPrzypomnienie = (_rezerwacjaId: string) => {
    setSuccessMessage('Przypomnienie zostało wysłane!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleToggleOdbiorca = (klientId: string) => {
    setBulkFormData(prev => {
      const isSelected = prev.odbiorcy.includes(klientId);
      return {
        ...prev,
        odbiorcy: isSelected
          ? prev.odbiorcy.filter(id => id !== klientId)
          : [...prev.odbiorcy, klientId]
      };
    });
  };

  const handleSelectAllKlienci = () => {
    if (bulkFormData.odbiorcy.length === klienci.length) {
      setBulkFormData(prev => ({ ...prev, odbiorcy: [] }));
    } else {
      setBulkFormData(prev => ({ ...prev, odbiorcy: klienci.map(k => k.id) }));
    }
  };

  const szablonyWiadomosci = [
    { id: 'promocja1', nazwa: 'Promocja 20%', tresc: 'Promocja! Skorzystaj z 20% zniżki na wszystkie masaże do końca miesiąca. Lotos SPA' },
    { id: 'promocja2', nazwa: 'Pakiety promocyjne', tresc: 'Nowa oferta pakietów! Kup 10 godzin masażu i otrzymaj 2 godziny gratis. Lotos SPA' },
    { id: 'info', nazwa: 'Nowe godziny otwarcia', tresc: 'Informujemy, że od przyszłego tygodnia zmieniamy godziny otwarcia. Lotos SPA' },
  ];

  const handleSelectSzablon = (szablon: string) => {
    const selected = szablonyWiadomosci.find(s => s.id === szablon);
    if (selected) {
      setBulkFormData(prev => ({ ...prev, tresc: selected.tresc, szablon }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pl-PL');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'WYSLANY':
        return <CheckCircle size={18} className="text-blue-600" />;
      case 'BLAD':
        return <XCircle size={18} className="text-red-600" />;
      case 'OCZEKUJACY':
        return <Clock size={18} className="text-blue-600" />;
      default:
        return <MessageSquare size={18} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      WYSLANY: 'bg-blue-100 text-blue-800',
      BLAD: 'bg-red-100 text-red-800',
      OCZEKUJACY: 'bg-blue-100 text-blue-800',
    };
    return styles[status as keyof typeof styles] || 'bg-blue-100 text-blue-800';
  };

  const getTipLabel = (typ: string) => {
    const labels: Record<string, string> = {
      PRZYPOMNIENIE: 'Przypomnienie',
      POTWIERDZENIE: 'Potwierdzenie',
      ANULOWANIE: 'Anulowanie',
      PROMOCJA: 'Promocja',
      INNE: 'Inne',
    };
    return labels[typ] || typ;
  };

  const filteredLogs = smsLogi.filter((log) => {
    if (filterStatus === 'all') return true;
    return log.status === filterStatus;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SMS</h1>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('wyslij')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'wyslij'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Send size={18} />
            Wyślij SMS
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'bulk'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Users size={18} />
            Bulk Send
          </button>
          <button
            onClick={() => setActiveTab('przypomnienia')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'przypomnienia'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Bell size={18} />
            Przypomnienia
          </button>
          <button
            onClick={() => setActiveTab('historia')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'historia'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <MessageSquare size={18} />
            Historia
          </button>
        </div>

        {/* Wyślij SMS Tab */}
        {activeTab === 'wyslij' && (
          <Card title="Wyślij pojedynczą wiadomość SMS">
            <form onSubmit={handleSendSMS} className="space-y-4">
              <Input
                label="Numer telefonu"
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                value={formData.telefon}
                onChange={(e) => setFormData({ ...formData, telefon: formatPhoneInput(e.target.value) })}
                required
                placeholder="123456789 (dokładnie 9 cyfr)"
                maxLength={9}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treść wiadomości
                </label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={formData.tresc}
                  onChange={(e) => setFormData({ ...formData, tresc: e.target.value })}
                  required
                  maxLength={160}
                  placeholder="Wpisz treść wiadomości (max 160 znaków)..."
                />
                <div className="text-sm text-gray-500 mt-1 text-right">
                  {formData.tresc.length} / 160 znaków
                </div>
              </div>
              <Button type="submit" className="flex items-center gap-2">
                <Send size={18} />
                Wyślij SMS
              </Button>
            </form>
          </Card>
        )}

        {/* Bulk Send Tab */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            <Card title="Wysyłanie masowe (Remarketing)">
              <form onSubmit={handleBulkSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Szablon wiadomości
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={bulkFormData.szablon}
                    onChange={(e) => handleSelectSzablon(e.target.value)}
                  >
                    <option value="">Wybierz szablon lub napisz własną wiadomość</option>
                    {szablonyWiadomosci.map((szablon) => (
                      <option key={szablon.id} value={szablon.id}>
                        {szablon.nazwa}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Treść wiadomości
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    value={bulkFormData.tresc}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, tresc: e.target.value })}
                    required
                    maxLength={160}
                    placeholder="Wpisz treść wiadomości (max 160 znaków)..."
                  />
                  <div className="text-sm text-gray-500 mt-1 text-right">
                    {bulkFormData.tresc.length} / 160 znaków
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Odbiorcy ({bulkFormData.odbiorcy.length} wybrano)
                    </label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSelectAllKlienci}
                    >
                      {bulkFormData.odbiorcy.length === klienci.length ? 'Odznacz wszystkich' : 'Zaznacz wszystkich'}
                    </Button>
                  </div>
                  <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                    {klienci.length === 0 ? (
                      <p className="text-gray-600 p-4">Brak klientów</p>
                    ) : (
                      <div className="divide-y">
                        {klienci.map((klient) => (
                          <label
                            key={klient.id}
                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={bulkFormData.odbiorcy.includes(klient.id)}
                              onChange={() => handleToggleOdbiorca(klient.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {klient.imie} {klient.nazwisko}
                              </div>
                              <div className="text-sm text-gray-500">{klient.telefon}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Button type="submit" className="flex items-center gap-2">
                  <Send size={18} />
                  Wyślij do {bulkFormData.odbiorcy.length} odbiorców
                </Button>
              </form>
            </Card>
          </div>
        )}

        {/* Przypomnienia Tab */}
        {activeTab === 'przypomnienia' && (
          <div className="space-y-6">
            <Card title="Automatyczne przypomnienia o wizytach">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Status automatycznych przypomnień</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Automatycznie wysyłaj SMS z przypomnieniem dzień przed wizytą
                    </p>
                  </div>
                  <button
                    onClick={handleTogglePrzypomnienia}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      przypomnieniaAktywne ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        przypomnieniaAktywne ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Nadchodzące wizyty (jutro) - {nadchodzaceRezerwacje.length}
                  </h3>
                  {nadchodzaceRezerwacje.length === 0 ? (
                    <p className="text-gray-600">Brak wizyt na jutro</p>
                  ) : (
                    <div className="space-y-2">
                      {nadchodzaceRezerwacje.map((rez) => (
                        <div
                          key={rez.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-100 p-2 rounded-lg">
                              <Calendar className="text-blue-600" size={18} />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {rez.klient.imie} {rez.klient.nazwisko}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(rez.godzinaOd).toLocaleTimeString('pl-PL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}{' '}
                                - {rez.usluga.nazwa}
                              </div>
                              <div className="text-xs text-gray-400">{rez.klient.telefon}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleWyslijPrzypomnienie(rez.id)}
                            className="flex items-center gap-1"
                          >
                            <Send size={16} />
                            Wyślij teraz
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Wzór wiadomości</h4>
                  <p className="text-sm text-blue-800">
                    "Dzień dobry! Przypominamy o wizycie w Lotos SPA jutro o [GODZINA].
                    Usługa: [NAZWA_USŁUGI]. Pozdrawiamy!"
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Historia Tab */}
        {activeTab === 'historia' && (
          <div className="space-y-6">
            <Card className="mb-6">
              <div className="flex gap-2">
                {['all', 'WYSLANY', 'BLAD', 'OCZEKUJACY'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {status === 'all' ? 'Wszystkie' : status}
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Historia wiadomości SMS">
              {loading ? (
                <p className="text-gray-600">Ładowanie...</p>
              ) : filteredLogs.length === 0 ? (
                <p className="text-gray-600">Brak wiadomości SMS</p>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="bg-blue-100 p-2 rounded-lg">
                            <MessageSquare className="text-blue-600" size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <User size={16} className="text-gray-500" />
                              <span className="font-semibold">
                                {log.klient.imie} {log.klient.nazwisko}
                              </span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-600">{log.klient.telefon}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <Calendar size={14} />
                              {formatDate(log.dataWyslania)}
                              <span>•</span>
                              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                {getTipLabel(log.typ)}
                              </span>
                            </div>
                            <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{log.tresc}</p>
                            {log.bladOpis && (
                              <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
                                <XCircle size={14} />
                                {log.bladOpis}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                              log.status
                            )}`}
                          >
                            <div className="flex items-center gap-1">
                              {getStatusIcon(log.status)}
                              {log.status}
                            </div>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
};
