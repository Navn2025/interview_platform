import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoMark from '../components/ui/Logo';

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogleToken } = useAuth();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    if (token) {
      if (loginWithGoogleToken(token, email)) {
         navigate('/dashboard', { replace: true });
      } else {
         navigate('/', { replace: true });
      }
    } else {
      navigate('/', { replace: true });
    }
  }, [token, email, loginWithGoogleToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-100 p-4">
      <div className="flex flex-col items-center gap-4">
        <LogoMark size={56} className="animate-pulse mb-4" />
        <p className="text-gray-500 font-medium">Authenticating securely...</p>
        <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
