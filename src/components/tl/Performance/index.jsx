import React, { useState, useEffect } from 'react';
import styles from './performance.module.css';
import { Award, ClipboardSignature, Send, ListTodo, Loader2, AlertCircle } from 'lucide-react';

export default function Performance({ currentUser }) {
  const [teamMembers, setTeamMembers] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formState, setFormState] = useState({
    employeeName: '',
    rating: 'A — Excellent',
    comments: ''
  });

  const ratings = [
    'A — Excellent',
    'B — Competent',
    'C — Developing',
    'D — Needs Improvement'
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('nsg_jwt_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [membersRes, scorecardsRes] = await Promise.all([
          fetch('/api/team-lead/team-members', { headers }),
          fetch('/api/team-lead/scorecards', { headers })
        ]);

        if (!membersRes.ok || !scorecardsRes.ok) {
          throw new Error('Failed to fetch data from the server.');
        }

        const membersData = await membersRes.json();
        const scorecardsData = await scorecardsRes.json();

        setTeamMembers(membersData);
        setScorecards(scorecardsData);
        if (membersData.length > 0) {
          setFormState(prev => ({ ...prev, employeeName: membersData[0].name }));
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'An error occurred while loading performance data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.employeeName || !formState.comments.trim()) {
      alert('Please select an employee and provide comments.');
      return;
    }

    setSubmitLoading(true);
    const token = localStorage.getItem('nsg_jwt_token');

    try {
      const response = await fetch('/api/team-lead/scorecards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_name: formState.employeeName,
          rating: formState.rating,
          comments: formState.comments
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit scorecard.');
      }

      const savedScorecard = await response.json();
      setScorecards(prev => [savedScorecard, ...prev]);
      setFormState(prev => ({ ...prev, comments: '' }));
      alert('Performance scorecard submitted successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Failed to submit the scorecard.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getRatingBadgeClass = (rating) => {
    if (rating.startsWith('A')) return styles.badgeExcellent;
    if (rating.startsWith('B')) return styles.badgeCompetent;
    if (rating.startsWith('C')) return styles.badgeDeveloping;
    return styles.badgeNeedsImprovement;
  };

  return (
    <div className={styles.container}>
      <div className="component-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={28} style={{ color: '#3b82f6' }} />
            Team Performance Calibration
          </h1>
          <p>Assess team member contributions, calibrate ratings, and submit evaluation scorecards for review.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column', gap: '12px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: '#3b82f6' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading team calibration data...</span>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
          <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Submission Form */}
          <div className={styles.formCard}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', padding: 0 }}>
              <ClipboardSignature size={18} style={{ color: '#3b82f6' }} />
              Submit Scorecard
            </h3>
            
            {teamMembers.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                No active team members found in your department.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="target-employee">Target Employee</label>
                  <select
                    id="target-employee"
                    className={styles.formSelect}
                    value={formState.employeeName}
                    onChange={(e) => setFormState(prev => ({ ...prev, employeeName: e.target.value }))}
                  >
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name}>
                        {member.name} ({member.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="rating-band">Performance Rating Band</label>
                  <select
                    id="rating-band"
                    className={styles.formSelect}
                    value={formState.rating}
                    onChange={(e) => setFormState(prev => ({ ...prev, rating: e.target.value }))}
                  >
                    {ratings.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tl-comments">TL Feedback Comments</label>
                  <textarea
                    id="tl-comments"
                    className={styles.formTextarea}
                    placeholder="Provide detailed feedback on milestones achieved, software quality, velocity, and areas of growth..."
                    value={formState.comments}
                    onChange={(e) => setFormState(prev => ({ ...prev, comments: e.target.value }))}
                    maxLength={1000}
                    required
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
                  {submitLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Submit Scorecard
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Submitted Tracker */}
          <div className={styles.activeCard}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', padding: 0 }}>
              <ListTodo size={18} style={{ color: '#3b82f6' }} />
              Submitted Scorecards ({scorecards.length})
            </h3>
            
            <div className={styles.tableWrapper}>
              {scorecards.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                  No performance scorecards submitted yet. Use the form on the left to evaluate your team.
                </div>
              ) : (
                <table className={styles.trackerTable}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Rating</th>
                      <th>Feedback / Comments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scorecards.map(sc => (
                      <tr key={sc.id}>
                        <td style={{ fontWeight: 600, fontSize: '13px' }}>{sc.employee_name}</td>
                        <td>
                          <span className={`${styles.badge} ${getRatingBadgeClass(sc.rating)}`}>
                            {sc.rating}
                          </span>
                        </td>
                        <td style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '300px', lineHeight: '1.4' }}>
                          "{sc.comments}"
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
