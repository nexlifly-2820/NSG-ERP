import React, { useState, useEffect } from 'react';
import { AlertTriangle, UserPlus, LogOut, Briefcase, CheckCircle } from 'lucide-react';
import styles from './HrDashboard.module.css';

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
        if (metricsRes.ok) setMetrics(await metricsRes.json());

        // Fetch employees for probation list
        const empRes = await fetch('/api/hr-portal/dashboard/onboarding-progress', { headers });
        if (empRes.ok) setProbationList(await empRes.json());

        // Fetch tickets for alerts list
        const alertsRes = await fetch('/api/hr-portal/dashboard/sla-watchdog', { headers });
        if (alertsRes.ok) setCriticalAlerts(await alertsRes.json());

        // Fetch announcements
        const annRes = await fetch('/api/hr-portal/announcements', { headers });
        if (annRes.ok) {
          let anns = await annRes.json();
          anns = anns.filter(ann => ann.audience === 'All Portals' || ann.audience === 'HR Portal');
          setAnnouncements(anns);
        }
      } catch (err) {
        console.error('Failed to fetch HR dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      <div className="component-header">
        <div>
          <h1>HR Management Command Center</h1>
          <p>Operational summary of talent lifecycles, onboarding SLAs, and compliance items.</p>
        </div>
      </div>

      <div className={styles.mainLayoutGrid}>
        {/* Main Content Area */}
        <div className={styles.leftColumn}>
          
          {/* Top Row: Metrics */}
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard} style={{ borderLeft: '4px solid #ec4899' }}>
              <div className={styles.metricHeader}>
                <span className={styles.metricTitle}>Probation / Onboardings</span>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                  <UserPlus size={18} />
                </div>
              </div>
              <span className={styles.metricValue}>{metrics.probationEmployees}</span>
              <span className={styles.metricSub}>Active new hires in checklist</span>
            </div>

            <div className={styles.metricCard} style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className={styles.metricHeader}>
                <span className={styles.metricTitle}>Pending Exit Claims</span>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                  <LogOut size={18} />
                </div>
              </div>
              <span className={styles.metricValue}>{metrics.pendingExits}</span>
              <span className={styles.metricSub}>Resignations awaiting review</span>
            </div>

            <div className={styles.metricCard} style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className={styles.metricHeader}>
                <span className={styles.metricTitle}>Open Job Pipelines</span>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                  <Briefcase size={18} />
                </div>
              </div>
              <span className={styles.metricValue}>{metrics.activeCandidates}</span>
              <span className={styles.metricSub}>Candidates in ATS screening</span>
            </div>

            <div className={styles.metricCard} style={{ borderLeft: '4px solid #ef4444' }}>
              <div className={styles.metricHeader}>
                <span className={styles.metricTitle}>Grievance Watchdog</span>
                <div className={styles.metricIcon} style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
              <span className={styles.metricValue}>{metrics.unresolvedGrievances}</span>
              <span className={styles.metricSub}>Warnings awaiting acknowledgment</span>
            </div>
          </div>

          {/* Middle Row: Progress and Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* New Joiners Checklist Progress */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <CheckCircle size={20} className={styles.widgetIcon} />
                  New Joiners Checklist Progress
                </div>
              </div>
              <div className={styles.listContainer}>
                {probationList.map(joiner => (
                  <div key={joiner.employee_id} className={styles.listItem}>
                    <div className={styles.itemIcon} style={{ backgroundColor: '#ec4899' }}>
                      {joiner.name.charAt(0)}
                    </div>
                    <div className={styles.itemContent}>
                      <span className={styles.itemName}>{joiner.name}</span>
                      <span className={styles.itemDesc}>{joiner.designation || 'New Hire'} — Joined {joiner.join_date}</span>
                    </div>
                    <div className={styles.itemRight}>
                      <span className={`${styles.badge} ${joiner.total_tasks > 0 && joiner.completed_tasks === joiner.total_tasks ? styles.badgeSuccess : styles.badgeWarning}`}>
                        {joiner.total_tasks > 0 ? `${joiner.completed_tasks}/${joiner.total_tasks} Tasks Done` : 'No Tasks Assigned'}
                      </span>
                      {joiner.total_tasks > 0 && (
                        <div style={{ width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${(joiner.completed_tasks/joiner.total_tasks)*100}%`, height: '100%', backgroundColor: '#ec4899' }}></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {probationList.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '14px' }}>
                    No new joiners in checklist.
                  </div>
                )}
              </div>
            </div>

            {/* SLA Watchdog Alerts */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <AlertTriangle size={20} style={{ color: '#ef4444' }} />
                  SLA Watchdog Alerts
                </div>
              </div>
              <div className={styles.listContainer}>
                {criticalAlerts.map(t => {
                  const isCritical = t.severity === 'critical';
                  return (
                    <div key={t.id} className={styles.listItem} style={{ borderLeft: `4px solid ${isCritical ? '#ef4444' : '#f59e0b'}` }}>
                      <div className={styles.itemContent}>
                        <span className={styles.itemName}>{t.title}</span>
                        <span className={styles.itemDesc}>{t.employee_name} ({t.employee_id}) — {t.description}</span>
                        {t.due_date && <span style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>Due: {new Date(t.due_date).toLocaleDateString()}</span>}
                      </div>
                      <span className={`${styles.badge} ${isCritical ? styles.badgeDanger : styles.badgeWarning}`}>
                        {t.severity.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
                {criticalAlerts.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '14px' }}>
                    No critical SLA alerts.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Row: CEO Announcements */}
          <div className={`${styles.widgetCard} ${styles.ceoAnnouncementsCard}`}>
            <div className={styles.ceoHeader}>
              <span style={{ fontSize: '20px' }}>📢</span>
              <span className={styles.ceoTitle}>CEO Announcements</span>
              <span className={styles.ceoBadge}>{announcements.length}</span>
            </div>
            
            {announcements.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {announcements.slice(0, 3).map(ann => {
                  const isUrgent = ann.priority === 'Urgent';
                  return (
                    <div key={ann.id} className={styles.announcementCard} style={{ borderLeftColor: isUrgent ? '#ef4444' : '#3b82f6', borderLeftWidth: '4px' }}>
                      <div className={styles.annTop}>
                        <span className={styles.annDate}>{ann.date || 'Today'}</span>
                        {isUrgent && <span className={styles.annUrgent}>URGENT</span>}
                      </div>
                      <strong className={styles.annTitle}>{ann.title}</strong>
                      <div className={styles.annBody} dangerouslySetInnerHTML={{ __html: ann.body }} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '24px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '24px', opacity: 0.5 }}>📰</div>
                <div style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>You're all caught up!</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>No new announcements from leadership.</div>
              </div>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
