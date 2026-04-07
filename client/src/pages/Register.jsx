import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setError('');
    setIsLoading(true);

    const result = await register(email, password);
    if (result.success) {
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } else {
      setError(result.error || 'Registration failed. User may already exist.');
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell" style={{ display: 'grid', placeItems: 'center' }}>
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <main style={{ maxWidth: '440px', width: '100%', position: 'relative', zIndex: 1 }}>
        <header className="topbar" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <p className="kicker">Saarthi Interview Studio</p>
          <h1 style={{ fontSize: '2rem' }}>Create Account</h1>
          <p className="subtitle" style={{ margin: '8px auto 0' }}>Sign up to access adaptive interviews</p>
        </header>

        <section className="panel" style={{ padding: '28px 24px' }}>
          {success ? (
            <div className="insight-block" style={{ backgroundColor: '#d8ffe8', borderColor: '#7fd7a7', color: '#0a5d30', textAlign: 'center', margin: '0 0 20px', padding: '16px' }}>
              <strong>{success}</strong>
            </div>
          ) : (
            <form onSubmit={handleRegister}>
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
                  autoComplete="new-password"
                  disabled={isLoading}
                />
              </label>

              <label style={{ marginTop: '16px' }}>
                Confirm Password
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
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
                  {isLoading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center' }}>
            <p className="muted" style={{ margin: 0, font: '500 0.93rem/1.4 var(--font-body)' }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#0a7de3', textDecoration: 'none', fontWeight: 600 }}>
                Log in
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
