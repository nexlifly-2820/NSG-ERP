import React, { useState, useEffect } from 'react';
import styles from './escalations.module.css';
import { ShieldAlert, ListChecks, Clock, Send, CheckCircle2, Eye, BellRing, AlertCircle, Trash } from 'lucide-react';

const Escalations = () => {
  const [escalations, setEscalations] = useState([]);
  const [formState, setFormState] = useState({
    title: '',
    taskId: '',
    description: '',
    dependencies: '',
    severity: 'Medium'
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const token = localStorage.getItem('nsg_jwt_token');

  const fetchData = async () => {
    try {
      // Fetch escalations
      const escRes = await fetch('/api/team-lead/escalations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (escRes.ok) {
        const escData = await escRes.json();
        setEscalations(escData);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.title || !formState.taskId || !formState.description) {
      alert('Please fill out the Blocker Title, Task ID and Description.');
      return;
    }

    try {
      const res = await fetch('/api/team-lead/escalations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formState.title,
          task_link: formState.taskId,
          severity: formState.severity,
          dependencies: formState.dependencies,
          description: formState.description
        })
      });
      if (res.ok) {
        fetchData();
        setFormState({ title: '', taskId: '', description: '', dependencies: '', severity: 'Medium' });
      } else {
        alert('Failed to raise escalation');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (id) => {
    try {
      const res = await fetch(`/api/team-lead/escalations/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
      } else {
        alert('Failed to resolve escalation');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={styles.container}>
      
      <div className={styles.escalationsLayout}>
        
        {/* 1. Raise Blocker Form (GRID-AREA: RAISE) */}
        <div className={styles.formCard}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} style={{ color: 'var(--danger)' }} />
            Raise Blocker Form
          </h3>
          <form onSubmit={handleSubmit} className={styles.formGrid} style={{ maxWidth: '100%' }}>
            <div className={styles.formGroup}>
              <label>Blocker Title</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g., API Down"
                value={formState.title}
                onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Task ID (Link)</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g., TASK-1024"
                value={formState.taskId}
                onChange={(e) => setFormState(prev => ({ ...prev, taskId: e.target.value }))}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Blocker Description</label>
              <textarea 
                className={styles.formTextarea} 
                placeholder="Describe what is blocking the progress of this task..."
                value={formState.description}
                onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
              ></textarea>
            </div>
            
            <div className={styles.formGroup}>
              <label>Blocking Dependencies (Comma separated)</label>
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g., API Team, Design Assets, DevOps Approval"
                value={formState.dependencies}
                onChange={(e) => setFormState(prev => ({ ...prev, dependencies: e.target.value }))}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Severity</label>
              <select 
                className={styles.formSelect}
                value={formState.severity}
                onChange={(e) => setFormState(prev => ({ ...prev, severity: e.target.value }))}
              >
                <option value="Medium">Medium - Impacts timeline but workarounds exist</option>
                <option value="High">High - Blocks major feature delivery</option>
                <option value="Critical">Critical - Complete halt of critical path</option>
              </select>
            </div>
            
            <button type="submit" className={styles.submitBtn}>
              <Send size={16} /> Submit to CEO Dashboard
            </button>
          </form>
        </div>

        {/* 2. Escalated Items Tracker (GRID-AREA: ACTIVE) */}
        <div className={styles.activeCard}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListChecks size={18} style={{ color: 'var(--primary)' }} />
            Escalated Items Tracker
          </h3>
          <div className={styles.tableWrapper}>
            <table className={styles.trackerTable}>
              <thead>
                <tr>
                  <th>Blocker Title</th>
                  <th>Sprint Task</th>
                  <th>Submitted</th>
                  <th>Severity</th>
                  <th>CEO Status</th>
                  <th>Resolution</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {escalations.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
                      No escalations found.
                    </td>
                  </tr>
                ) : (
                  escalations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(esc => (
                    <tr key={esc.id}>
                      <td style={{ fontWeight: 600, fontSize: '13px', lineHeight: '1.4' }}>{esc.title}</td>
                      <td><a href="#" className={styles.taskLink}>{esc.task_link || esc.taskLink}</a></td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{esc.submitted_at ? new Date(esc.submitted_at).toLocaleString() : esc.submittedAt}</td>
                      <td>
                        <span className={`${styles.badge} ${styles['badge' + esc.severity]}`}>
                          {esc.severity === 'Critical' && <AlertCircle size={10}/>}
                          {esc.severity ? esc.severity.toUpperCase() : 'UNKNOWN'}
                        </span>
                      </td>
                      <td>
                        {esc.ceo_viewed || esc.ceoViewed ? (
                          <span className={`${styles.badge} ${styles.badgeCeo}`}><Eye size={10}/> VIEWED</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgePending}`}>PENDING</span>
                        )}
                      </td>
                      <td>
                        {esc.rejected ? (
                          <span className={`${styles.badge}`} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5' }}>REJECTED</span>
                        ) : esc.resolved ? (
                          <span className={`${styles.badge} ${styles.badgeResolved}`}><CheckCircle2 size={10}/> RESOLVED</span>
                        ) : (
                          <span className={`${styles.badge} ${styles.badgeCritical}`} style={{ background: '#fdf4ff', color: '#c026d3' }}>ACTIVE</span>
                        )}
                      </td>
                      <td>
                        {esc.rejected ? (
                           <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>—</span>
                        ) : !esc.resolved ? (
                          <button 
                            onClick={() => handleResolve(esc.id)}
                            className={styles.actionBtn}
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-light)', fontWeight: '600' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {escalations.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '16px', borderTop: '1px solid var(--border)', gap: '16px' }}>
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                style={{ padding: '6px 16px', borderRadius: '6px', background: currentPage === 1 ? '#f1f5f9' : '#fff', border: '1px solid #e2e8f0', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}
              >Prev</button>
              <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Page {currentPage} of {Math.ceil(escalations.length / itemsPerPage)}</span>
              <button 
                disabled={currentPage === Math.ceil(escalations.length / itemsPerPage)}
                onClick={() => setCurrentPage(p => p + 1)}
                style={{ padding: '6px 16px', borderRadius: '6px', background: currentPage === Math.ceil(escalations.length / itemsPerPage) ? '#f1f5f9' : '#fff', border: '1px solid #e2e8f0', color: currentPage === Math.ceil(escalations.length / itemsPerPage) ? '#94a3b8' : '#334155', cursor: currentPage === Math.ceil(escalations.length / itemsPerPage) ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}
              >Next</button>
            </div>
          )}
        </div>



      </div>

    </div>
  );
};

export default Escalations;
