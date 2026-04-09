import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster, toast } from 'react-hot-toast';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OAuthCallback from './pages/OAuthCallback';
import DashboardPage from './pages/DashboardPage';
import ConfigurePage from './pages/ConfigurePage';
import InterviewPage from './pages/InterviewPage';

function App() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [darkMode, setDarkMode] = useState(() => {
    // Default to light mode; only use stored value if user has explicitly set it
    const stored = localStorage.getItem('prashikshan-dark');
    if (stored === null) {
      localStorage.setItem('prashikshan-dark', 'false');
      return false;
    }
    return stored === 'true';
  });

  // Apply dark mode class to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('prashikshan-dark', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      toast.error('Session expired. Please log in again.');
      navigate('/');
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout, navigate]);

  const toggleDark = () => setDarkMode((p) => !p);

  const sharedProps = { user, darkMode, onToggleDark: toggleDark, onLogout: logout };

  return (
    <ErrorBoundary>
    <Toaster position="top-center" />
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage {...sharedProps} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/configure"
        element={
          <ProtectedRoute>
            <ConfigurePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview"
        element={
          <ProtectedRoute>
            <InterviewPage />
          </ProtectedRoute>
        }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  );
}

export default App;
