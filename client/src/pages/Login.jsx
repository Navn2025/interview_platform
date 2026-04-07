import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsLoading(true);

    const result = await login(email, password);
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Login failed. Please verify your credentials.');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="app-shell" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <main style={{ maxWidth: '440px', width: '100%', position: 'relative', zIndex: 1 }}>
        <header className="topbar" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <p className="kicker">Saarthi Interview Studio</p>
          <h1 style={{ fontSize: '2rem' }}>Welcome Back</h1>
          <p className="subtitle" style={{ margin: '8px auto 0' }}>Log in to access your dashboard</p>
        </header>

        <section className="panel" style={{ padding: '28px 24px' }}>
          <form onSubmit={handleLogin}>
            <label>
              Email Address
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isLoading}
              />
            </label>

            <label style={{ marginTop: '16px' }}>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={isLoading}
              />
            </label>

            {error && <p className="error-box" style={{ marginTop: '16px' }}>{error}</p>}

            <div className="actions" style={{ marginTop: '24px' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', padding: '12px' }}
                disabled={isLoading}
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p className="muted" style={{ margin: 0, font: '500 0.93rem/1.4 var(--font-body)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: '#0a7de3', textDecoration: 'none', fontWeight: 600 }}>
                Sign up
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
