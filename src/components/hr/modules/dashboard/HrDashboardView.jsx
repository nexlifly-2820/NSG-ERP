import React, { useState, useEffect } from 'react';
import { AlertTriangle, UserPlus, LogOut, Briefcase } from 'lucide-react';

export function HrDashboardView() {
  const [metrics, setMetrics] = useState({
    probationEmployees: 0,
    pendingExits: 0,
    activeCandidates: 0,
    unresolvedGrievances: 0
  });
  const [probationList, setProbationList] = useState([]);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch metrics
        const metricsRes = await fetch('/api/hr-portal/dashboard/metrics', { headers });
        if (metricsRes.ok) {
          const m = await metricsRes.json();
          setMetrics(m);
        }

        // Fetch employees for probation list
        const empRes = await fetch('/api/hr-portal/dashboard/onboarding-progress', { headers });
        if (empRes.ok) {
          const emps = await empRes.json();
          setProbationList(emps);
        }

        // Fetch tickets for alerts list
        const alertsRes = await fetch('/api/hr-portal/dashboard/sla-watchdog', { headers });
        if (alertsRes.ok) {
          const alerts = await alertsRes.json();
          setCriticalAlerts(alerts);
        }

        // Fetch announcements
        const annRes = await fetch('/api/hr-portal/announcements', { headers });
        if (annRes.ok) {
          const anns = await annRes.json();
          setAnnouncements(anns);
        }
      } catch (err) {
        console.error('Failed to fetch HR dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>HR Management Command Center</h1>
          <p>Operational summary of talent lifecycles, onboarding SLAs, and compliance items.</p>
        </div>
      </div>

      {/* CEO Announcements Section */}
      {announcements.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)' }}>CEO Announcements</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {announcements.slice(0, 3).map(ann => (
              <div key={ann.id} style={{
                background: '#FFF', border: '1px solid #E2E8F0', borderLeft: ann.priority === 'Urgent' ? '4px solid #ef4444' : '4px solid #3b82f6',
                borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>{ann.author} • {ann.date}</span>
                  {ann.priority === 'Urgent' && <span style={{ background: '#FEF2F2', color: '#ef4444', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800 }}>URGENT</span>}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: '#0F172A' }}>{ann.title}</div>
                <div dangerouslySetInnerHTML={{ __html: ann.body }} style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, maxHeight: '3.6em', overflow: 'hidden' }}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-pink)' }}>
          <div className="card-header-flex">
            <span className="card-title">Probation / Onboardings</span>
            <div className="card-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent-pink)' }}>
              <UserPlus size={18} />
            </div>
          </div>
          <span className="metric-value">{metrics.probationEmployees}</span>
          <span className="info-txt">Active new hires in checklist</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="card-header-flex">
            <span className="card-title">Pending Exit Claims</span>
            <div className="card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
              <LogOut size={18} />
            </div>
          </div>
          <span className="metric-value">{metrics.pendingExits}</span>
          <span className="info-txt">Resignations awaiting review</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <div className="card-header-flex">
            <span className="card-title">Open Job Pipelines</span>
            <div className="card-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-gold)' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <span className="metric-value">{metrics.activeCandidates}</span>
          <span className="info-txt">Candidates in ATS screening</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="card-header-flex">
            <span className="card-title">Grievance Watchdog</span>
            <div className="card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <span className="metric-value">{metrics.unresolvedGrievances}</span>
          <span className="info-txt">Warnings awaiting acknowledgment</span>
        </div>
      </div>

      <div className="dashboard-row-grid">
        {/* New Joiners Checklist */}
        <div className="content-card flex-2">
          <div className="card-header">
            <h3>New Joiners Checklist Progress</h3>
          </div>
          <div className="card-content-list">
            {probationList.map(joiner => (
              <div key={joiner.employee_id} className="strategic-list-item">
                <div className="progress-ring-mini" style={{ backgroundColor: 'var(--accent-pink)' }}></div>
                <div className="item-text">
                  <h5>{joiner.name}</h5>
                  <p>{joiner.designation || 'New Hire'} — Joined {joiner.join_date}</p>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px'}}>
                   <span className={joiner.total_tasks > 0 && joiner.completed_tasks === joiner.total_tasks ? "badge-pill success" : "badge-pill warning"}>
                     {joiner.total_tasks > 0 ? `${joiner.completed_tasks}/${joiner.total_tasks} Tasks Done` : 'No Tasks Assigned'}
                   </span>
                   {joiner.total_tasks > 0 && (
                     <div style={{ width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                       <div style={{ width: `${(joiner.completed_tasks/joiner.total_tasks)*100}%`, height: '100%', backgroundColor: 'var(--accent-pink)' }}></div>
                     </div>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Watchdog */}
        <div className="content-card flex-1">
          <div className="card-header">
            <h3 style={{ color: '#ef4444' }}>⚠️ SLA Watchdog Alerts</h3>
          </div>
          <div className="card-content-list">
            {criticalAlerts.map(t => {
              const borderCol = t.severity === 'critical' ? '#ef4444' : '#f59e0b';
              return (
                <div key={t.id} className="strategic-list-item" style={{ borderLeft: `3px solid ${borderCol}`, paddingLeft: '8px' }}>
                  <div className="item-text">
                    <h5 style={{ color: 'var(--text-primary)' }}>{t.title}</h5>
                    <p>{t.employee_name} ({t.employee_id}) — {t.description}</p>
                    {t.due_date && <small style={{color: '#64748b', fontSize: '0.75rem'}}>Due: {new Date(t.due_date).toLocaleDateString()}</small>}
                  </div>
                  <span className={`badge-pill ${t.severity === 'critical' ? 'danger' : 'warning'}`}>
                    {t.severity.toUpperCase()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
