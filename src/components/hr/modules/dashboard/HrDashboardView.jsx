import React, { useState, useEffect } from 'react';
import { AlertTriangle, UserPlus, LogOut, Briefcase, ClipboardList } from 'lucide-react';
import styles from './HrDashboard.module.css';

export function HrDashboardView() {
  const [metrics, setMetrics] = useState({
    probationEmployees: 0,
    pendingExits: 0,
    activeCandidates: 0,
    unresolvedGrievances: 0
  });
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalsPage, setApprovalsPage] = useState(1);
  const APPROVALS_PER_PAGE = 5;
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [assetRequests, setAssetRequests] = useState([]);
  const [assetPage, setAssetPage] = useState(1);
  const ASSETS_PER_PAGE = 3;

  // Asset Provisioning Modal State
  const [selectedAssetReq, setSelectedAssetReq] = useState(null);
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [newAssetType, setNewAssetType] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');
  const [isAssigningAsset, setIsAssigningAsset] = useState(false);

  const handleTicketAction = async (id, action) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/tickets/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if(window.showToast) window.showToast(`Asset request ${action === 'resolve' ? 'assigned' : 'rejected'} successfully.`, 'success');
        const ticketsRes = await fetch('/api/hr-portal/tickets', { headers: { 'Authorization': `Bearer ${token}` } });
        if (ticketsRes.ok) {
          const t = await ticketsRes.json();
          setAssetRequests(t.filter(ticket => ticket.category === 'asset_request'));
        }
      } else {
        if(window.showToast) window.showToast(`Failed to ${action} request`, 'error');
      }
    } catch (err) {
      console.error(err);
      if(window.showToast) window.showToast('Network error', 'error');
    }
  };

  const handleOpenAssignModal = async (req) => {
    setSelectedAssetReq(req);
    setNewAssetType(req.title || ''); // Default to ticket title
    setNewAssetName('');
    setNewAssetSerial('');
    setEmployeeAssets([]);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/onboarding/assets/${req.user_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEmployeeAssets(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch employee assets", err);
    }
  };

  const handleAssignAssetSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssetReq) return;
    setIsAssigningAsset(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const generatedTag = 'NSG-' + (newAssetType || 'AST').substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      const payload = {
        assetTag: generatedTag,
        type: newAssetType,
        name: newAssetName,
        serialNumber: newAssetSerial,
        condition: 'New'
      };
      const assetRes = await fetch(`/api/hr-portal/onboarding/assets/${selectedAssetReq.user_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (assetRes.ok) {
        await handleTicketAction(selectedAssetReq.id, 'resolve');
        setSelectedAssetReq(null);
      } else {
        if(window.showToast) window.showToast("Failed to assign asset.", "error");
      }
    } catch (e) {
      console.error(e);
      if(window.showToast) window.showToast('Network error', 'error');
    } finally {
      setIsAssigningAsset(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch metrics
        const metricsRes = await fetch('/api/hr-portal/dashboard/metrics', { headers });
        if (metricsRes.ok) setMetrics(await metricsRes.json());

        // Fetch pending approvals
        const pendingRes = await fetch('/api/hr-portal/dashboard/pending-approvals', { headers });
        if (pendingRes.ok) setPendingApprovals(await pendingRes.json());

        // Fetch tickets for alerts list
        const alertsRes = await fetch('/api/hr-portal/dashboard/sla-watchdog', { headers });
        if (alertsRes.ok) setCriticalAlerts(await alertsRes.json());

        // Fetch asset requests
        const ticketsRes = await fetch('/api/hr-portal/tickets', { headers });
        if (ticketsRes.ok) {
          const t = await ticketsRes.json();
          const threeDaysAgo = new Date();
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

          setAssetRequests(t.filter(ticket => {
            if (ticket.category !== 'asset_request') return false;
            
            const isResolved = ticket.status.toLowerCase() === 'resolved';
            const ticketDate = new Date(ticket.created_at);
            
            if (isResolved && ticketDate < threeDaysAgo) {
              return false;
            }
            
            return true;
          }));
        }

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


          </div>

          {/* Middle Row: Progress and Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            
            {/* Pending Approvals Widget */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <ClipboardList size={20} className={styles.widgetIcon} />
                  Pending Approvals
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                  {pendingApprovals.length} Requests
                </div>
              </div>
              <div className={styles.listContainer}>
                {pendingApprovals.slice((approvalsPage - 1) * APPROVALS_PER_PAGE, approvalsPage * APPROVALS_PER_PAGE).map(item => (
                  <div key={item.id} className={styles.listItem} style={{ cursor: 'pointer', transition: 'all 0.2s' }} onClick={() => window.location.hash = item.url.replace('/#', '')}>
                    <div className={styles.itemIcon} style={{ backgroundColor: item.type === 'Leave' ? '#3b82f6' : item.type === 'Resignation' ? '#ef4444' : item.type === 'Timesheet' ? '#f59e0b' : item.type === 'Attendance' ? '#8b5cf6' : '#ec4899', fontSize: '16px' }}>
                      {item.type === 'Leave' ? '🌴' : item.type === 'Resignation' ? '🚪' : item.type === 'Timesheet' ? '⏱️' : item.type === 'Attendance' ? '📍' : '📦'}
                    </div>
                    <div className={styles.itemContent}>
                      <span className={styles.itemName}>{item.title}</span>
                      <span className={styles.itemDesc}>{item.employee} — {new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div className={styles.itemRight}>
                      <span className={`${styles.badge} ${styles.badgeWarning}`}>
                        Review Action
                      </span>
                    </div>
                  </div>
                ))}
                {pendingApprovals.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '14px' }}>
                    No pending approvals. You are all caught up!
                  </div>
                )}
              </div>
              {pendingApprovals.length > APPROVALS_PER_PAGE && (
                <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    disabled={approvalsPage === 1} 
                    onClick={() => setApprovalsPage(p => p - 1)}
                    style={{ padding: '6px 12px', fontSize: '13px', background: approvalsPage === 1 ? '#f1f5f9' : '#fff', color: approvalsPage === 1 ? '#94a3b8' : '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: approvalsPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Page {approvalsPage} of {Math.ceil(pendingApprovals.length / APPROVALS_PER_PAGE)}
                  </span>
                  <button 
                    disabled={approvalsPage >= Math.ceil(pendingApprovals.length / APPROVALS_PER_PAGE)} 
                    onClick={() => setApprovalsPage(p => p + 1)}
                    style={{ padding: '6px 12px', fontSize: '13px', background: approvalsPage >= Math.ceil(pendingApprovals.length / APPROVALS_PER_PAGE) ? '#f1f5f9' : '#fff', color: approvalsPage >= Math.ceil(pendingApprovals.length / APPROVALS_PER_PAGE) ? '#94a3b8' : '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: approvalsPage >= Math.ceil(pendingApprovals.length / APPROVALS_PER_PAGE) ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>


            {/* Asset Requests Card */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <span style={{ fontSize: '20px' }}>📦</span> Asset Requests
                </div>
              </div>
              <div className={styles.listContainer}>
                {assetRequests.slice((assetPage - 1) * ASSETS_PER_PAGE, assetPage * ASSETS_PER_PAGE).map(req => (
                  <div key={req.id} className={styles.listItem} style={{ borderLeft: '4px solid #8b5cf6' }}>
                    <div className={styles.itemContent}>
                      <span className={styles.itemName}>{req.title}</span>
                      <span className={styles.itemDesc}>{req.employee_name} — {req.description}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`${styles.badge} ${req.status === 'open' ? styles.badgeWarning : req.status === 'Rejected' || req.status === 'rejected' || req.status === 'CEO Rejected' ? styles.badgeDanger : styles.badgeSuccess}`}>
                        {req.status.toUpperCase()}
                      </span>
                      {(req.status === 'CEO Approved') && (
                        <>
                          <button 
                            onClick={() => handleOpenAssignModal(req)}
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Assign
                          </button>
                          <button 
                            onClick={() => handleTicketAction(req.id, 'reject')}
                            style={{ padding: '4px 8px', fontSize: '11px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {assetRequests.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '14px' }}>
                    No pending asset requests.
                  </div>
                )}
              </div>
              {assetRequests.length > ASSETS_PER_PAGE && (
                <div style={{ padding: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    disabled={assetPage === 1} 
                    onClick={() => setAssetPage(p => p - 1)}
                    style={{ padding: '6px 12px', fontSize: '13px', background: assetPage === 1 ? '#f1f5f9' : '#fff', color: assetPage === 1 ? '#94a3b8' : '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: assetPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Page {assetPage} of {Math.ceil(assetRequests.length / ASSETS_PER_PAGE)}
                  </span>
                  <button 
                    disabled={assetPage >= Math.ceil(assetRequests.length / ASSETS_PER_PAGE)} 
                    onClick={() => setAssetPage(p => p + 1)}
                    style={{ padding: '6px 12px', fontSize: '13px', background: assetPage >= Math.ceil(assetRequests.length / ASSETS_PER_PAGE) ? '#f1f5f9' : '#fff', color: assetPage >= Math.ceil(assetRequests.length / ASSETS_PER_PAGE) ? '#94a3b8' : '#0f172a', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: assetPage >= Math.ceil(assetRequests.length / ASSETS_PER_PAGE) ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              )}
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
      
      {/* 💻 ASSET PROVISIONING MODAL */}
      {selectedAssetReq && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ width: '600px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: 0, overflow: 'hidden', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '24px 24px 16px 24px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                💻 Asset Provisioning — {selectedAssetReq.employee_name}
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }} onClick={() => setSelectedAssetReq(null)}>✕</button>
            </div>

            <div style={{ overflowY: 'auto', padding: '20px 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
              {/* List of currently assigned assets */}
              <div>
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>Currently Assigned Assets</h4>
                {employeeAssets.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employeeAssets.map(asset => (
                      <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>{asset.name} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>({asset.type})</span></div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SN: {asset.serialNumber || 'N/A'} | Tag: {asset.assetTag}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '4px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>{asset.returnStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', fontSize: '12px' }}>
                    No assets assigned yet.
                  </div>
                )}
              </div>

              {/* Form to assign a new asset */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase' }}>Assign New Asset</h4>
                <form onSubmit={handleAssignAssetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Asset Type</label>
                    <input type="text" value={newAssetType} onChange={(e) => setNewAssetType(e.target.value)} required placeholder="e.g. Laptop, Monitor, Headset..." style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Asset Name / Model</label>
                    <input type="text" value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} required placeholder="e.g. MacBook Pro M3 16-inch" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Serial Number (Optional)</label>
                    <input type="text" value={newAssetSerial} onChange={(e) => setNewAssetSerial(e.target.value)} placeholder="e.g. C02X123456" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="submit" disabled={isAssigningAsset} style={{ backgroundColor: '#ec4899', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: isAssigningAsset ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', opacity: isAssigningAsset ? 0.7 : 1 }}>
                      {isAssigningAsset ? 'Assigning...' : 'Assign Asset'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
