import React, { useState } from 'react';
import useSWR from 'swr';
import { Target, CheckCircle, Award, UserCheck } from 'lucide-react';
import './Performance.css';

export default function Performance({ currentUser }) {
  const token = localStorage.getItem('nsg_jwt_token');
  const [acknowledging, setAcknowledging] = useState(null);

  const fetcher = (url) => 
    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch performance data');
      return res.json();
    });

  // Fetch paginated scorecards
  const { data, error, isLoading, mutate } = useSWR('/api/employee-portal/performance/my-scorecards?limit=50', fetcher);

  const handleAcknowledge = async (id) => {
    try {
      setAcknowledging(id);
      const res = await fetch(`/api/employee-portal/performance/scorecards/${id}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to acknowledge scorecard');
      }
      
      alert('Scorecard acknowledged successfully. Your Team Lead has been notified.');
      // Optionally mutate to refresh, though no local status changes right now
      mutate();
    } catch (err) {
      alert(err.message);
    } finally {
      setAcknowledging(null);
    }
  };

  const getRatingClass = (rating) => {
    const r = (rating || '').toLowerCase();
    if (r.includes('excellent') || r === 'a') return 'rating-excellent';
    if (r.includes('good') || r === 'b') return 'rating-good';
    if (r.includes('average') || r === 'c') return 'rating-average';
    return 'rating-poor';
  };

  if (isLoading) return <div className="perf-loading">Loading Performance Data...</div>;
  if (error) return <div className="perf-error">Error: {error.message}</div>;

  const scorecards = data?.items || [];

  return (
    <div className="perf-container">
      <div className="perf-header">
        <h2>Performance Appraisals</h2>
        <p>Review your performance scorecards, ratings, and feedback from your Team Lead.</p>
      </div>

      {scorecards.length === 0 ? (
        <div className="perf-empty">
          <Target size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
          <h3>No Appraisals Yet</h3>
          <p>You don't have any performance scorecards assigned to you at the moment.</p>
        </div>
      ) : (
        <div className="scorecard-grid">
          {scorecards.map((card) => (
            <div key={card.id} className="scorecard-card">
              <div className="scorecard-header">
                <div className="scorecard-title">
                  <Award size={18} color="#6366f1" />
                  Scorecard #{card.id}
                </div>
                <div className={`scorecard-rating ${getRatingClass(card.rating)}`}>
                  {card.rating}
                </div>
              </div>
              
              <div className="scorecard-body">
                <div className="scorecard-tl">
                  <UserCheck size={14} /> Evaluator: <strong>{card.tl_name}</strong>
                </div>
                <div className="scorecard-comments">
                  "{card.comments}"
                </div>
              </div>
              
              <div className="scorecard-footer">
                <button 
                  className="btn-acknowledge" 
                  onClick={() => handleAcknowledge(card.id)}
                  disabled={acknowledging === card.id}
                >
                  <CheckCircle size={16} />
                  {acknowledging === card.id ? 'Acknowledging...' : 'Acknowledge'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
