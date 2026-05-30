import React, { useState } from 'react';
import styles from './escalations.module.css';
import { ShieldAlert, ListChecks, Clock, Send, CheckCircle2, Eye, BellRing, AlertCircle, Trash } from 'lucide-react';

const Escalations = () => {
  const [escalations, setEscalations] = useState([
    {
      id: 1,
      title: 'Database connection pooling failure in production replica',
      taskLink: 'TASK-842',
      submittedAt: '2 hours ago',
      severity: 'Critical',
      ceoViewed: true,
      resolved: false
    },
    {
      id: 2,
      title: 'Third-party API rate limit exceeded during sync',
      taskLink: 'TASK-915',
      submittedAt: '1 day ago',
      severity: 'High',
      ceoViewed: false,
      resolved: true
    },
    {
      id: 3,
      title: 'Missing Figma assets for the new HR module',
      taskLink: 'TASK-773',
      submittedAt: '3 days ago',
      severity: 'Medium',
      ceoViewed: true,
      resolved: true
    }
  ]);

  const [formState, setFormState] = useState({
    taskId: '',
    description: '',
    dependencies: '',
    severity: 'Medium'
  });

  const mockSLAs = [
    {
      id: 1,
      title: 'PR #402: Implement biometric face scanning',
      assignee: 'David Miller',
      openedAt: 'May 23, 10:00 AM',
      hoursPending: 42,
      isOverdue: true
    },
    {
      id: 2,
      title: 'PR #415: Update dashboard widget layouts',
      assignee: 'Sarah Jenkins',
      openedAt: 'May 24, 02:30 PM',
      hoursPending: 14,
      isOverdue: false
    },
    {
      id: 3,
      title: 'PR #418: Fix authentication token refresh bug',
      assignee: 'Michael Chang',
      openedAt: 'May 22, 09:15 AM',
      hoursPending: 68,
      isOverdue: true
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formState.taskId || !formState.description) {
      alert('Please fill out the Task ID and Blocker Description.');
      return;
    }

    const newBlocker = {
      id: Date.now(),
      title: formState.description,
      taskLink: formState.taskId,
      submittedAt: 'Just now',
      severity: formState.severity,
      ceoViewed: false,
      resolved: false
    };

    setEscalations([newBlocker, ...escalations]);
    setFormState({
      taskId: '',
      description: '',
      dependencies: '',
      severity: 'Medium'
    });
  };

  const handleResolve = (id) => {
    setEscalations(prev => prev.map(esc => {
      if (esc.id === id) {
        return { ...esc, resolved: true };
      }
      return esc;
    }));
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
                    <td><a href="#" className={styles.taskLink}>{esc.taskLink}</a></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{esc.submittedAt}</td>
                    <td>
                      <span className={`${styles.badge} ${styles['badge' + esc.severity]}`}>
                        {esc.severity === 'Critical' && <AlertCircle size={10}/>}
                        {esc.severity.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {esc.ceoViewed ? (
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
