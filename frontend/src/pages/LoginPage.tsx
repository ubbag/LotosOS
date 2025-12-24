import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input } from '@components';
import { useAuthStore } from '@stores/authStore';
import { handleApiError } from '@services/api';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error: authError } = useAuthStore();
  const [email, setEmail] = useState('admin@lotosspa.pl');
  const [password, setPassword] = useState('haslo123');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email i hasło są wymagane');
      return;
    }

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lotos SPA</h1>
          <p className="text-gray-600">System zarządzania rezerwacjami masażu</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(error || authError) && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error || authError}
            </div>
          )}

          <Input
            type="email"
            label="Email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <Input
            type="password"
            label="Hasło"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <Button
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
            className="w-full"
          >
            Zaloguj się
          </Button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-600">
          <p className="font-medium mb-2">🎭 Tryb Demo:</p>
          <p>Dowolny email i hasło zaloguje Cię do trybu demo z przykładowymi danymi.</p>
          <p className="mt-2 text-xs text-gray-500">
            Aby używać prawdziwych danych, podłącz backend API.
          </p>
        </div>
      </Card>
    </div>
  );
};
