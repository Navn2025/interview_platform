import React from 'react';

function InterviewCard({ interview }) {
  return (
    <article className="metric-card" style={{ cursor: 'pointer', textAlign: 'left', gridColumn: 'span 4' }}>
      <p style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>ID: {interview.id || 'N/A'}</span>
        <span className={`verdict verdict-${interview.status === 'completed' ? 'correct' : 'incorrect'}`}>
          {interview.status}
        </span>
      </p>
      <h3>{interview.subject || 'Technical Interview'}</h3>
      <div style={{ marginTop: '12px', fontSize: '0.86rem', color: 'var(--ink-muted)' }}>
        {interview.created_at ? new Date(interview.created_at).toLocaleDateString() : 'Recent'}
      </div>
      <div className="progress-track" aria-label="Interview score" style={{ marginTop: '12px' }}>
        <div className="progress-fill" style={{ width: `${interview.overall_score || 0}%` }}></div>
      </div>
      <p style={{ marginTop: '6px', textAlign: 'right' }}>Score: {interview.overall_score || 0}%</p>
    </article>
  );
}

export default InterviewCard;
