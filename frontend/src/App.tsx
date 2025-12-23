import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@stores/authStore';
import { LoginPage } from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';
import { KlienciPage } from '@pages/KlienciPage';
import { RezerwacjePage } from '@pages/RezerwacjePage';
import { UstawieniaPage } from '@pages/UstawieniaPage';
import { UslugiPage } from '@pages/UslugiPage';
import { KategoriePage } from '@pages/KategoriePage';
import { PakietyPage } from '@pages/PakietyPage';
import { VoucheryPage } from '@pages/VoucheryPage';
import { HarmonogramPage } from '@pages/HarmonogramPage';
import { GrafikPage } from '@pages/GrafikPage';
import { RaportyPage } from '@pages/RaportyPage';
import { SMSPage } from '@pages/SMSPage';
import { PracownicyPage } from '@pages/PracownicyPage';
import { GabinetyPage } from '@pages/GabinetyPage';

// Protected route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/klienci"
          element={
            <ProtectedRoute>
              <KlienciPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rezerwacje"
          element={
            <ProtectedRoute>
              <RezerwacjePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/uslugi"
          element={
            <ProtectedRoute>
              <UslugiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kategorie"
          element={
            <ProtectedRoute>
              <KategoriePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pakiety"
          element={
            <ProtectedRoute>
              <PakietyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/vouchery"
          element={
            <ProtectedRoute>
              <VoucheryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/harmonogram"
          element={
            <ProtectedRoute>
              <HarmonogramPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/grafik"
          element={
            <ProtectedRoute>
              <GrafikPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/raporty"
          element={
            <ProtectedRoute>
              <RaportyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sms"
          element={
            <ProtectedRoute>
              <SMSPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pracownicy"
          element={
            <ProtectedRoute>
              <PracownicyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/gabinety"
          element={
            <ProtectedRoute>
              <GabinetyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ustawienia"
          element={
            <ProtectedRoute>
              <UstawieniaPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};
