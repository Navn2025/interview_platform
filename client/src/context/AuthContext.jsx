import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('interview_jwt');
    const storedEmail = localStorage.getItem('interview_email');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
      if (storedEmail) {
        setUser({ email: storedEmail });
      } else {
        // Fallback attempt to decrypt simple JWT structures if email was embedded
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          if (payload.sub && payload.sub.includes('@')) {
            setUser({ email: payload.sub });
          }
        } catch {
          // ignore parsing failures
        }
      }
    }
    setIsInitializing(false);
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api.login(email, password);
      // Backend returns: { access_token, token_type, user_id, email }
      const new_token = data.access_token;
      const user_email = data.email || email;
      
      localStorage.setItem('interview_jwt', new_token);
      localStorage.setItem('interview_email', user_email);
      setToken(new_token);
      setUser({ email: user_email });
      setIsAuthenticated(true);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password) => {
    try {
      await api.register(email, password);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('interview_jwt');
    localStorage.removeItem('interview_email');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const loginWithGoogleToken = useCallback((new_token, email) => {
    try {
      localStorage.setItem('interview_jwt', new_token);
      let user_email = email || '';
      if (!email) {
        try {
          const payload = JSON.parse(atob(new_token.split('.')[1]));
          user_email = payload.email || payload.sub;
        } catch (e) {}
      }
      if (user_email) {
        localStorage.setItem('interview_email', user_email);
        setUser({ email: user_email });
      } else {
        setUser({ email: 'google-user@example.com' });
      }
      setToken(new_token);
      setIsAuthenticated(true);
      return true;
    } catch (error) {
      return false;
    }
  }, []);

  const value = {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    loginWithGoogleToken
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
