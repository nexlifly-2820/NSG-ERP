import React, { useState, useEffect } from 'react';
import styles from './dashboard.module.css';
import { 
  Users, 
  Activity, 
  TrendingUp, 
  Clock, 
  Calendar, 
  Laptop, 
  AlertCircle,
  Bell,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

const Dashboard = ({ setActiveTab, setSelectedChatUser }) => {
  const [currentView, setCurrentView] = useState('main');
  const [expandedItem, setExpandedItem] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, listKey: '', id: null, action: '' });
  const [showAllTeam, setShowAllTeam] = useState(false);
  const [showAllWorkload, setShowAllWorkload] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Real API Data ──────────────────────────────────────────────────────────
  const [teamMembers, setTeamMembers] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const [pendingDetails, setPendingDetails] = useState({
    leaveRequests: [],
    timesheetCorrections: [],
    wfhRequests: [],
    absentAlerts: []
  });
  const [pendingApprovals, setPendingApprovals] = useState({
    leaveRequests: 0,
    timesheetCorrections: 0,
    wfhRequests: 0
  });

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      setLoading(true);
      const [membersRes, tasksRes, annRes, countsRes, alertsRes, leavesRes, correctionsRes, wfhRes] = await Promise.all([
        fetch('/api/team-lead/team-members', { headers }),
        fetch('/api/team-lead/tasks', { headers }),
        fetch('/api/team-lead/announcements', { headers }),
        fetch('/api/team-lead/dashboard/pending-approvals', { headers }),
        fetch('/api/team-lead/dashboard/absent-alerts', { headers }),
        fetch('/api/team-lead/leaves/pending', { headers }),
        fetch('/api/team-lead/attendance-corrections/pending', { headers }),
        fetch('/api/team-lead/wfh/pending', { headers })
      ]);

      if (annRes.ok) {
        let anns = await annRes.json();
        anns = anns.filter(ann => ann.audience === 'All Portals' || ann.audience === 'TL Portal');
        setAnnouncements(anns);
      }
      
      let fetchedMembers = [];
      if (membersRes.ok) {
        const members = await membersRes.json();
        fetchedMembers = members;
        setTeamMembers(members.map(m => ({
          id: m.id,
          name: m.name,
          initials: m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(),
          status: m.status === 'active' ? 'online' : m.status === 'on_leave' ? 'on_leave' : 'offline',
          role: m.designation || 'Team Member'
        })));
      }

      if (tasksRes.ok) setMyTasks(await tasksRes.json());
      
      if (countsRes.ok) setPendingApprovals(await countsRes.json());
      
      let absentAlerts = [];
      if (alertsRes.ok) absentAlerts = await alertsRes.json();
      
      let leavesData = [];
      if (leavesRes.ok) {
        const leaves = await leavesRes.json();
        leavesData = leaves.map(l => {
          const emp = fetchedMembers.find(m => m.id === l.user_id);
          return {
            id: l.id,
            name: emp ? emp.name : `User ${l.user_id}`,
            desc: `${l.leave_type} Leave: ${l.from_date} to ${l.to_date}`,
            employeeNote: l.reason
          };
        });
      }

      let correctionsData = [];
      if (correctionsRes.ok) {
        const corrections = await correctionsRes.json();
        correctionsData = corrections.map(c => {
          const emp = fetchedMembers.find(m => m.id === c.user_id);
          return {
            id: c.id,
            name: emp ? emp.name : `User ${c.user_id}`,
            desc: `Date: ${c.correction_date}`,
            employeeNote: c.reason
          };
        });
      }

      let wfhData = [];
      if (wfhRes.ok) {
        const wfhs = await wfhRes.json();
        wfhData = wfhs.map(w => {
          const emp = fetchedMembers.find(m => m.id === w.user_id);
          return {
            id: w.id,
            name: emp ? emp.name : `User ${w.user_id}`,
            desc: `WFH: ${w.from_date} to ${w.to_date}`,
            employeeNote: w.reason
          };
        });
      }

      setPendingDetails({
        leaveRequests: leavesData,
        timesheetCorrections: correctionsData,
        wfhRequests: wfhData,
        absentAlerts: absentAlerts
      });

    } catch (e) {
      console.error('TL Dashboard fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // ── Mark Announcements as Read ─────────────────────────────────────────────
  useEffect(() => {
    if (announcements.length > 0) {
      const token = localStorage.getItem('nsg_jwt_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      // Only mark the ones currently displayed (first 3)
      announcements.slice(0, 3).forEach(ann => {
        fetch(`/api/team-lead/announcements/${ann.id}/read`, {
          method: 'POST',
          headers
        }).catch(e => console.error("Failed to mark announcement as read", e));
      });
    }
  }, [announcements]);

  // ── Derive sprint stats from real tasks ──────────────────────────────────
  const sprintData = {
    name: 'Current Sprint',
    pointsCompleted: myTasks.filter(t => t.status === 'done').reduce((s, t) => s + (t.sp || 1), 0),
    pointsTotal: myTasks.reduce((s, t) => s + (t.sp || 1), 0) || 1,
    tasks: {
      todo: myTasks.filter(t => t.status === 'pending').length,
      inProgress: myTasks.filter(t => t.status === 'in-progress').length,
      blocked: myTasks.filter(t => t.status === 'blocked').length,
      done: myTasks.filter(t => t.status === 'done').length,
    },
    velocityTrend: `${myTasks.filter(t => t.status === 'done').length} tasks done`
  };

  const progressPercentage = Math.min(100, (sprintData.pointsCompleted / sprintData.pointsTotal) * 100);
  const radius = 60;

  // ── Derive workload from team members + tasks ─────────────────────────────
  const teamWorkload = teamMembers.map(m => {
    const memberTasks = myTasks.filter(t => t.assignee === m.name || t.user_id === m.id);
    const activeTasks = memberTasks.filter(t => t.status !== 'done').length;
    const load = Math.min(100, activeTasks * 20); // 5 tasks = 100% load
    return { id: m.id, name: m.name, role: m.role, load };
  });

  const statusPriority = {
    'online': 1,
    'wfh': 2,
    'offline': 3,
    'on_leave': 4,
    'absent': 5
  };

  const sortedTeamMembers = [...teamMembers].sort((a, b) => (statusPriority[a.status] || 3) - (statusPriority[b.status] || 3));

  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;


  const promptAction = (e, listKey, id, action) => {
    e.stopPropagation();
    setConfirmDialog({ isOpen: true, listKey, id, action });
  };

  const executeAction = async () => {
    const { listKey, id, action } = confirmDialog;
    
    // Determine the API endpoint based on listKey
    let endpoint = '';
    if (listKey === 'leaveRequests') endpoint = `/api/team-lead/leaves/${id}/${action}`;
    else if (listKey === 'timesheetCorrections') endpoint = `/api/team-lead/attendance-corrections/${id}/${action}`;
    else if (listKey === 'wfhRequests') endpoint = `/api/team-lead/wfh/${id}/${action}`;
    
    if (endpoint) {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        
        // Optimistically update UI immediately so it vanishes without waiting/reloading
        setPendingDetails(prev => ({
          ...prev,
          [listKey]: prev[listKey].filter(item => item.id !== id)
        }));

        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // Background re-fetch data to ensure full state sync
        fetchDashboardData();
        const actionTxt = action === 'approve' ? 'Approved' : 'Rejected';
        setToast({ message: `Request ${actionTxt} Successfully!`, type: action === 'approve' ? 'success' : 'error' });
      } catch (e) {
        console.error('Error executing action:', e);
      }
    } else if (listKey === 'absentAlerts') {
      // Just local dismiss for now, or connect to HR notification endpoint
      setPendingDetails(prev => ({
        ...prev,
        [listKey]: prev[listKey].filter(item => item.id !== id)
      }));
    }

    if (expandedItem === id) {
      setExpandedItem(null);
    }
    setConfirmDialog({ isOpen: false, listKey: '', id: null, action: '' });
  };

  const cancelAction = () => {
    setConfirmDialog({ isOpen: false, listKey: '', id: null, action: '' });
  };

  if (currentView !== 'main') {
    const title = currentView === 'leave' ? 'Leave Requests' : 
                  currentView === 'timesheet' ? 'Timesheet Corrections' : 
                  currentView === 'wfh' ? 'WFH Requests' : 'Absent Alerts';
    const listKey = currentView === 'leave' ? 'leaveRequests' : 
                    currentView === 'timesheet' ? 'timesheetCorrections' : 
                    currentView === 'wfh' ? 'wfhRequests' : 'absentAlerts';
    const data = pendingDetails[listKey];

    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.pageHeader}>
          <button 
            className={styles.backBtn} 
            onClick={() => {
              setCurrentView('main');
              setExpandedItem(null);
            }}
          >
            ← Back to Dashboard
          </button>
          <h2 className={styles.pageTitle}>{title}</h2>
        </div>
        
        <div className={styles.pageContent}>
          {data.map(item => (
            <div 
              key={item.id} 
              className={styles.pageListItem}
              onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.pageListItemInfo}>
                <div className={styles.pageListItemName}>
                  {item.name}
                  <span className={styles.expandIcon}>
                    {expandedItem === item.id ? '▲' : '▼'}
                  </span>
                </div>
                
                {expandedItem === item.id && (
                  <div className={styles.pageListItemDetails}>
                    <div className={styles.pageListItemDesc}>{item.desc}</div>
                    
                    {item.employeeNote && (
                      <div className={styles.employeeNote}>
                        <strong>Note:</strong> {item.employeeNote}
                      </div>
                    )}
                    
                    <textarea 
                      className={styles.reviewTextarea}
                      placeholder="Add a comment or description (optional)..."
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className={styles.pageListItemActions}>
                      <button 
                        className={styles.actionBtnApprove} 
                        onClick={(e) => promptAction(e, listKey, item.id, currentView === 'absent' ? 'notify HR' : 'approve')}
                      >
                        {currentView === 'absent' ? 'Notify HR 🔔' : 'Approve ✓'}
                      </button>
                      <button 
                        className={styles.actionBtnReject} 
                        onClick={(e) => promptAction(e, listKey, item.id, currentView === 'absent' ? 'dismiss' : 'reject')}
                      >
                        {currentView === 'absent' ? 'Dismiss ✕' : 'Reject ✕'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {confirmDialog.isOpen && (
          <div className={styles.confirmOverlay}>
            <div className={styles.confirmModal}>
              <div className={styles.confirmTitle}>Confirm Action</div>
              <div className={styles.confirmText}>
                Are you sure you want to {confirmDialog.action} this request?
              </div>
              <div className={styles.confirmActions}>
                <button className={styles.confirmBtnCancel} onClick={cancelAction}>Cancel</button>
                <button 
                  className={confirmDialog.action === 'approve' || confirmDialog.action === 'notify HR' ? styles.confirmBtnApprove : styles.confirmBtnReject} 
                  onClick={executeAction}
                >
                  {confirmDialog.action === 'approve' ? 'Approve ✓' : 
                   confirmDialog.action === 'notify HR' ? 'Notify HR 🔔' : 
                   confirmDialog.action === 'reject' ? 'Reject ✕' : 'Dismiss ✕'}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            background: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 9999,
            fontWeight: 500,
            animation: 'slideInRight 0.3s ease-out'
          }}>
            {toast.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {toast.message}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.mainLayoutGrid}>
        
        {/* LEFT COLUMN: Main Workspace */}
        <div className={styles.leftColumn}>
          
          {/* Top Row: Team Presence & Workload */}
          <div className={styles.actionRowGrid}>
            {/* Team Presence */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <Users size={20} className={styles.widgetIcon} />
                  Team Presence
                </div>
                <button onClick={() => setShowAllTeam(!showAllTeam)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                  {showAllTeam ? 'Show less' : 'View all team'}
                </button>
              </div>
              <div className={styles.avatarGrid}>
                {(showAllTeam ? sortedTeamMembers : sortedTeamMembers.slice(0, 4)).map(member => {
                  let statusClass = '';
                  switch(member.status) {
                    case 'online': statusClass = styles.statusOnline; break;
                    case 'wfh': statusClass = styles.statusWfh; break;
                    case 'on_leave': statusClass = styles.statusLeave; break;
                    case 'absent': statusClass = styles.statusAbsent; break;
                    default: statusClass = styles.statusOffline;
                  }
                  return (
                    <div key={member.id} className={styles.avatarWrapper} style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                      onClick={() => {
                        if (setSelectedChatUser && setActiveTab) {
                          setSelectedChatUser(`dm-${member.id}`);
                          setActiveTab('messaging');
                        }
                      }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div className={styles.avatarCircle}>
                        {member.initials}
                        <span className={`${styles.statusIndicator} ${statusClass}`} title={member.status} />
                      </div>
                      <span className={styles.avatarName}>{member.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Workload */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <Activity size={20} className={styles.widgetIcon} />
                  Team Workload
                </div>
                <button onClick={() => setShowAllWorkload(!showAllWorkload)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
                  {showAllWorkload ? 'Show less' : 'View all team'}
                </button>
              </div>
              <div className={styles.workloadList}>
                {(showAllWorkload ? teamWorkload : teamWorkload.slice(0, 4)).map(member => {
                  let loadClass = styles.low;
                  if (member.load > 80) loadClass = styles.high;
                  else if (member.load > 50) loadClass = styles.medium;
                  return (
                    <div key={member.id} className={styles.workloadItem}>
                      <div className={styles.workloadInfo}>
                        <span className={styles.workloadName}>{member.name}</span>
                        <span className={styles.workloadRole}>{member.role}</span>
                      </div>
                      <div className={styles.workloadBarContainer}>
                        <div className={`${styles.workloadBarFill} ${loadClass}`} style={{ width: `${member.load}%` }} />
                      </div>
                      <span className={styles.workloadValue}>{member.load}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Row: Action Center */}
          <div className={styles.actionRowGrid}>
            {/* Pending Approvals */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <CheckCircle size={20} className={styles.widgetIcon} />
                  Pending Approvals
                </div>
              </div>
              <div className={styles.badgeList}>
                <div className={styles.badgeItem} onClick={() => setCurrentView('leave')} style={{ cursor: 'pointer' }}>
                  <div className={styles.badgeInfo}>
                    <div className={`${styles.badgeIcon} ${styles.purple}`}>
                      <Calendar size={18} />
                    </div>
                    <span className={styles.badgeLabel}>Leave Requests</span>
                  </div>
                  <span className={`${styles.badgeCount} ${pendingApprovals.leaveRequests === 0 ? styles.zero : ''}`}>{pendingApprovals.leaveRequests}</span>
                </div>

                <div className={styles.badgeItem} onClick={() => setCurrentView('timesheet')} style={{ cursor: 'pointer' }}>
                  <div className={styles.badgeInfo}>
                    <div className={`${styles.badgeIcon} ${styles.blue}`}>
                      <Clock size={18} />
                    </div>
                    <span className={styles.badgeLabel}>Timesheet Corrections</span>
                  </div>
                  <span className={`${styles.badgeCount} ${pendingApprovals.timesheetCorrections === 0 ? styles.zero : ''}`}>{pendingApprovals.timesheetCorrections}</span>
                </div>

                <div className={styles.badgeItem} onClick={() => setCurrentView('wfh')} style={{ cursor: 'pointer' }}>
                  <div className={styles.badgeInfo}>
                    <div className={`${styles.badgeIcon} ${styles.orange}`}>
                      <Laptop size={18} />
                    </div>
                    <span className={styles.badgeLabel}>WFH Requests</span>
                  </div>
                  <span className={`${styles.badgeCount} ${pendingApprovals.wfhRequests === 0 ? styles.zero : ''}`}>{pendingApprovals.wfhRequests}</span>
                </div>
              </div>
            </div>

            {/* Today's Absent Alert */}
            <div className={styles.widgetCard}>
              <div className={styles.widgetHeader}>
                <div className={styles.widgetTitle}>
                  <AlertCircle size={20} style={{ color: '#ef4444' }} />
                  Today's Absent Alert
                </div>
              </div>
              <div className={styles.alertList}>
                {pendingDetails.absentAlerts.map(alert => (
                  <div key={alert.id} className={styles.alertCard} onClick={() => { setCurrentView('absent'); setExpandedItem(alert.id); }} style={{ cursor: 'pointer' }}>
                    <div className={styles.alertAvatar}>{alert.initials}</div>
                    <div className={styles.alertInfo}>
                      <h4 className={styles.alertName} style={{ margin: 0 }}>{alert.name}</h4>
                    </div>
                  </div>
                ))}
                {pendingDetails.absentAlerts.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '14px' }}>
                    No absentees today.
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
                {announcements.slice(0, 3).map(ann => (
                  <div key={ann.id} style={{
                    padding: '16px',
                    background: '#FFF',
                    border: '1px solid #E2E8F0',
                    borderLeft: ann.priority === 'Urgent' ? '4px solid #ef4444' : '4px solid #3b82f6',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748B' }}>
                        {ann.date || 'Today'}
                      </span>
                      {ann.priority === 'Urgent' && (
                        <span style={{ background: '#FEF2F2', color: '#ef4444', border: '1px solid #fecaca', padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>URGENT</span>
                      )}
                    </div>
                    <strong style={{ fontSize: '14px', color: '#0F172A', lineHeight: 1.3 }}>{ann.title}</strong>
                    <div dangerouslySetInnerHTML={{ __html: ann.body }} style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.5, maxHeight: '3.8em', overflow: 'hidden' }} />
                  </div>
                ))}
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

        {/* RIGHT COLUMN: Sidebar */}
        <div className={styles.rightSidebar}>
          {/* Sprint Status */}
          <div className={styles.widgetCard}>
            <div className={styles.widgetHeader}>
              <div className={styles.widgetTitle}>
                <Activity size={20} className={styles.widgetIcon} />
                Sprint Status
              </div>
            </div>
            <div className={styles.sprintContent}>
              <div className={styles.progressRingContainer}>
                <svg className={styles.progressRingSvg} viewBox="0 0 140 140">
                  <circle className={styles.progressRingTrack} cx="70" cy="70" r={radius} />
                  <circle className={styles.progressRingFill} cx="70" cy="70" r={radius} style={{ strokeDasharray: circumference, strokeDashoffset }} />
                </svg>
                <div className={styles.progressRingCenter}>
                  <span className={styles.progressPoints}>{sprintData.pointsCompleted}</span>
                  <span className={styles.progressLabel}>/ {sprintData.pointsTotal} pts</span>
                </div>
              </div>
              <div className={styles.sprintDetails}>
                <h3 className={styles.sprintName}>{sprintData.name}</h3>
                <div className={styles.velocityTrend}>
                  <TrendingUp size={16} />
                  {sprintData.velocityTrend}
                </div>
                <div className={styles.taskCounters}>
                  <div className={styles.taskCountItem}>
                    <span className={styles.taskCountNum}>{sprintData.tasks.todo}</span>
                    <span className={styles.taskCountLabel}>To Do</span>
                  </div>
                  <div className={styles.taskCountItem}>
                    <span className={styles.taskCountNum}>{sprintData.tasks.inProgress}</span>
                    <span className={styles.taskCountLabel}>In Progress</span>
                  </div>
                  <div className={`${styles.taskCountItem} ${styles.blocked}`}>
                    <span className={styles.taskCountNum}>{sprintData.tasks.blocked}</span>
                    <span className={styles.taskCountLabel}>Blocked</span>
                  </div>
                  <div className={styles.taskCountItem}>
                    <span className={styles.taskCountNum}>{sprintData.tasks.done}</span>
                    <span className={styles.taskCountLabel}>Done</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
