import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import InterviewCard from '../components/InterviewCard';
import '../App.css';

function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const data = await api.getHistory();
      // sort by date descending
      data.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setHistory(data);
      setLoading(false);
    }
    fetchHistory();
  }, []);

  return (
    <div className="app-shell">
      <div className="ambient ambient-one"></div>
      <div className="ambient ambient-two"></div>

      <header className="topbar">
        <div className="title-wrap">
          <p className="kicker">Saarthi Interview Studio</p>
          <h1>User Profile</h1>
          <p className="subtitle">
            Review your past interviews and track your performance over time.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-primary" onClick={() => navigate('/')} style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
            New Interview
          </button>
          <button className="btn" onClick={logout} style={{ padding: '8px 12px', fontSize: '0.75rem' }}>
            Logout
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="setup-panel panel" style={{ gridColumn: 'span 4' }}>
          <h2>User Info</h2>
          <div className="insight-block">
            <p><strong>Email:</strong> {user?.email || 'N/A'}</p>
          </div>
        </section>

        <section className="interview-panel panel" style={{ gridColumn: 'span 8' }}>
          <h2>Interview History</h2>
          
          {loading ? (
            <div className="loading-card">
              <div className="loading-row loading-strong"></div>
              <div className="loading-row"></div>
              <div className="loading-row loading-short"></div>
              <p>Fetching history...</p>
            </div>
          ) : history.length > 0 ? (
            <div className="metrics-strip">
              {history.map((interview) => (
                <InterviewCard key={interview.id} interview={interview} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--ink-muted)', marginBottom: '12px' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <p>No interviews completed yet.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Profile;
