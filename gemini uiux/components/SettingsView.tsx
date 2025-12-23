import React, { useState, useEffect } from 'react';
import { Clock, Save } from 'lucide-react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { fetchOpeningHours, updateOpeningHours } from '../services/api';

export const SettingsView: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [godzinaOtwarcia, setGodzinaOtwarcia] = useState(10);
  const [godzinaZamkniecia, setGodzinaZamkniecia] = useState(23);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const hours = await fetchOpeningHours();
        setGodzinaOtwarcia(hours.godzinaOtwarcia);
        setGodzinaZamkniecia(hours.godzinaZamkniecia);
      } catch (err) {
        setError('Nie udało się pobrać ustawień.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    if (godzinaOtwarcia >= godzinaZamkniecia) {
      alert('Godzina otwarcia musi być wcześniejsza niż godzina zamknięcia');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await updateOpeningHours(godzinaOtwarcia, godzinaZamkniecia);
      alert('Godziny otwarcia zostały zaktualizowane');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Nie udało się zapisać ustawień');
      alert('Błąd: ' + (err.response?.data?.message || 'Nie udało się zapisać ustawień'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Ładowanie ustawień...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ustawienia Systemu</h1>
          <p className="text-gray-500 mt-1">Konfiguracja salonu i systemu rezerwacji</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <Card>
        <div className="flex items-center gap-2 mb-6">
          <Clock size={24} className="text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Godziny otwarcia salonu</h2>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Ustaw godziny pracy salonu. Te wartości będą używane w wizualizacji godzinowej w
          dashboardzie oraz do walidacji rezerwacji.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Godzina otwarcia
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={godzinaOtwarcia}
              onChange={(e) => setGodzinaOtwarcia(parseInt(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Godzina zamknięcia
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={godzinaZamkniecia}
              onChange={(e) => setGodzinaZamkniecia(parseInt(e.target.value))}
            >
              {Array.from({ length: 24 }, (_, i) => (
                <option key={i} value={i}>
                  {i.toString().padStart(2, '0')}:00
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Aktualnie: {godzinaOtwarcia.toString().padStart(2, '0')}:00 -{' '}
              {godzinaZamkniecia.toString().padStart(2, '0')}:00
            </p>
            <Button icon={Save} onClick={handleSave} disabled={saving}>
              {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Inne ustawienia</h2>
        <p className="text-sm text-gray-500">
          Dodatkowe opcje konfiguracyjne będą dostępne wkrótce...
        </p>
      </Card>
    </div>
  );
};
