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
    severity: ''
  });
  const [formErrors, setFormErrors] = useState({});
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
    const newErrors = {};
    if (!formState.title.trim()) newErrors.title = "Blocker Title is required.";
    if (!formState.taskId.trim()) newErrors.taskId = "Task ID is required.";
    if (!formState.description.trim()) newErrors.description = "Blocker Description is required.";
    if (!formState.dependencies.trim()) newErrors.dependencies = "Blocking Dependencies are required.";
    if (!formState.severity) newErrors.severity = "Severity is required.";

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      if (window.toast && window.toast.warning) window.toast.warning('Please fix the validation errors.');
      return;
    }
    setFormErrors({});

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
        setFormState({ title: '', taskId: '', description: '', dependencies: '', severity: '' });
        setFormErrors({});
      } else {
        window.toast.error('Failed to raise escalation');
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
        window.toast.error('Failed to resolve escalation');
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
              {formErrors.title && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px', marginBottom: '4px' }}><AlertCircle size={12} /><span>{formErrors.title}</span></div>}
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g., API Down"
                value={formState.title}
                onChange={(e) => {
                  setFormState(prev => ({ ...prev, title: e.target.value }));
                  if (!e.target.value.trim()) setFormErrors(prev => ({...prev, title: "Blocker Title is required."}));
                  else setFormErrors(prev => ({...prev, title: null}));
                }}
                onFocus={(e) => { if(!e.target.value.trim()) setFormErrors(prev => ({...prev, title: "Blocker Title is required."})); }}
                onBlur={(e) => { if (!e.target.value || String(e.target.value).trim() === '') setFormErrors(prev => ({...prev, title: "Blocker Title is required."})); }}
                style={formErrors.title ? { borderColor: '#ef4444' } : {}}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Task ID (Link)</label>
              {formErrors.taskId && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px', marginBottom: '4px' }}><AlertCircle size={12} /><span>{formErrors.taskId}</span></div>}
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g., TASK-1024"
                value={formState.taskId}
                onChange={(e) => {
                  setFormState(prev => ({ ...prev, taskId: e.target.value }));
                  if (!e.target.value.trim()) setFormErrors(prev => ({...prev, taskId: "Task ID is required."}));
                  else setFormErrors(prev => ({...prev, taskId: null}));
                }}
                onFocus={(e) => { if(!e.target.value.trim()) setFormErrors(prev => ({...prev, taskId: "Task ID is required."})); }}
                onBlur={(e) => { if (!e.target.value || String(e.target.value).trim() === '') setFormErrors(prev => ({...prev, taskId: "Task ID is required."})); }}
                style={formErrors.taskId ? { borderColor: '#ef4444' } : {}}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Blocker Description</label>
              {formErrors.description && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px', marginBottom: '4px' }}><AlertCircle size={12} /><span>{formErrors.description}</span></div>}
              <textarea 
                className={styles.formTextarea} 
                placeholder="Describe what is blocking the progress of this task..."
                value={formState.description}
                onChange={(e) => {
                  setFormState(prev => ({ ...prev, description: e.target.value }));
                  if (!e.target.value.trim()) setFormErrors(prev => ({...prev, description: "Blocker Description is required."}));
                  else setFormErrors(prev => ({...prev, description: null}));
                }}
                onFocus={(e) => { if(!e.target.value.trim()) setFormErrors(prev => ({...prev, description: "Blocker Description is required."})); }}
                onBlur={(e) => { if (!e.target.value || String(e.target.value).trim() === '') setFormErrors(prev => ({...prev, description: "Blocker Description is required."})); }}
                style={formErrors.description ? { borderColor: '#ef4444' } : {}}
              ></textarea>
            </div>
            
            <div className={styles.formGroup}>
              <label>Blocking Dependencies (Comma separated)</label>
              {formErrors.dependencies && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px', marginBottom: '4px' }}><AlertCircle size={12} /><span>{formErrors.dependencies}</span></div>}
              <input 
                type="text" 
                className={styles.formInput} 
                placeholder="e.g., API Team, Design Assets, DevOps Approval"
                value={formState.dependencies}
                onChange={(e) => {
                  setFormState(prev => ({ ...prev, dependencies: e.target.value }));
                  if (!e.target.value.trim()) setFormErrors(prev => ({...prev, dependencies: "Blocking Dependencies are required."}));
                  else setFormErrors(prev => ({...prev, dependencies: null}));
                }}
                onFocus={(e) => { if(!e.target.value.trim()) setFormErrors(prev => ({...prev, dependencies: "Blocking Dependencies are required."})); }}
                onBlur={(e) => { if (!e.target.value || String(e.target.value).trim() === '') setFormErrors(prev => ({...prev, dependencies: "Blocking Dependencies are required."})); }}
                style={formErrors.dependencies ? { borderColor: '#ef4444' } : {}}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>Severity</label>
              {formErrors.severity && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px', marginBottom: '4px' }}><AlertCircle size={12} /><span>{formErrors.severity}</span></div>}
              <select 
                className={styles.formSelect}
                value={formState.severity}
                onChange={(e) => {
                  setFormState(prev => ({ ...prev, severity: e.target.value }));
                  if (!e.target.value) setFormErrors(prev => ({...prev, severity: "Severity is required."}));
                  else setFormErrors(prev => ({...prev, severity: null}));
                }}
                onFocus={(e) => { if(!e.target.value) setFormErrors(prev => ({...prev, severity: "Severity is required."})); }}
                onBlur={(e) => { if (!e.target.value) setFormErrors(prev => ({...prev, severity: "Severity is required."})); }}
                style={formErrors.severity ? { borderColor: '#ef4444' } : {}}
              >
                <option value="">Select Severity...</option>
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
