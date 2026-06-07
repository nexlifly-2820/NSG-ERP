import React, { useState, useEffect } from 'react';
import styles from './escalations.module.css';
import { ShieldAlert, ListChecks, Clock, Send, CheckCircle2, Eye, BellRing, AlertCircle, Trash } from 'lucide-react';

const Escalations = () => {
  const [escalations, setEscalations] = useState([]);
  const [formState, setFormState] = useState({
    taskId: '',
    description: '',
    dependencies: '',
    severity: 'Medium'
  });

  const token = localStorage.getItem('nsg_jwt_token');

  const fetchEscalations = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/team-lead/escalations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setEscalations(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, [token]);

  const mockSLAs = [
    { id: 1, title: 'PR #402: Implement biometric face scanning', assignee: 'David Miller', openedAt: 'May 23, 10:00 AM', hoursPending: 42, isOverdue: true },
    { id: 2, title: 'PR #415: Update dashboard widget layouts', assignee: 'Sarah Jenkins', openedAt: 'May 24, 02:30 PM', hoursPending: 14, isOverdue: false },
    { id: 3, title: 'PR #418: Fix authentication token refresh bug', assignee: 'Michael Chang', openedAt: 'May 22, 09:15 AM', hoursPending: 68, isOverdue: true }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formState.taskId || !formState.description) {
      alert('Please fill out the Task ID and Blocker Description.');
      return;
    }

    if (!token) return;
    try {
      const res = await fetch('/api/team-lead/escalations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formState.description,
          task_link: formState.taskId,
          severity: formState.severity,
          dependencies: formState.dependencies,
          description: formState.description
        })
      });
      if (res.ok) {
        fetchEscalations();
        setFormState({ taskId: '', description: '', dependencies: '', severity: 'Medium' });
      } else {
        alert('Failed to raise escalation');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolve = async (id) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/team-lead/escalations/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchEscalations();
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
                {escalations.map(esc => (
                  <tr key={esc.id}>
                    <td style={{ fontWeight: 600, fontSize: '13px', lineHeight: '1.4' }}>{esc.title}</td>
                    <td><a href="#" className={styles.taskLink}>{esc.task_link || esc.taskLink}</a></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{esc.submitted_at ? new Date(esc.submitted_at).toLocaleString() : esc.submittedAt}</td>
                    <td>
                      <span className={`${styles.badge} ${styles['badge' + esc.severity]}`}>
                        {esc.severity === 'Critical' && <AlertCircle size={10}/>}
                        {esc.severity.toUpperCase()}
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
                      {esc.resolved ? (
                        <span className={`${styles.badge} ${styles.badgeResolved}`}><CheckCircle2 size={10}/> RESOLVED</span>
                      ) : (
                        <span className={`${styles.badge} ${styles.badgeCritical}`} style={{ background: '#fef2f2', color: '#dc2626' }}>ACTIVE</span>
                      )}
                    </td>
                    <td>
                      {!esc.resolved ? (
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
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Peer Review SLA Monitor (GRID-AREA: SLA) */}
        <div className={styles.slaCard}>
          <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} style={{ color: 'var(--warning)' }} />
            Peer Review SLA Monitor
          </h3>
          <div className={styles.alertsList}>
            {mockSLAs.map(sla => (
              <div key={sla.id} className={`${styles.alertCard} ${sla.isOverdue ? styles.overdue : ''}`}>
                <div className={styles.alertInfo}>
                  <h4 className={styles.alertTitle} style={{ fontSize: '14.5px', fontWeight: '700' }}>
                    {sla.title}
                  </h4>
                  <div className={styles.alertMeta}>
                    <div className={styles.alertMetaItem}>
                      <span style={{ fontWeight: 600 }}>Assignee:</span> {sla.assignee}
                    </div>
                    <div className={styles.alertMetaItem}>
                      <span style={{ fontWeight: 600 }}>Opened At:</span> {sla.openedAt}
                    </div>
                  </div>
                </div>
                <div className={styles.alertStatus}>
                  <div className={styles.pendingHours} style={{ fontSize: '18px', fontWeight: '700' }}>
                    {sla.hoursPending}h Pending
                  </div>
                  {sla.isOverdue && (
                    <div className={styles.reminderSent}>
                      <BellRing size={12} /> Auto-reminder sent
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Escalations;
