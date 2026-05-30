import React, { useState } from 'react';
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
  // 1. Team Presence Data
  const teamMembers = [
    { id: 1, name: 'Alice Chen', initials: 'AC', status: 'online' },
    { id: 2, name: 'Bob Smith', initials: 'BS', status: 'wfh' },
    { id: 3, name: 'Charlie Davis', initials: 'CD', status: 'offline' },
    { id: 4, name: 'Diana Prince', initials: 'DP', status: 'on_leave' },
    { id: 5, name: 'Evan Wright', initials: 'EW', status: 'absent' },
    { id: 6, name: 'Fiona Gallagher', initials: 'FG', status: 'online' },
    { id: 7, name: 'George Hale', initials: 'GH', status: 'wfh' },
    { id: 8, name: 'Hannah Lee', initials: 'HL', status: 'online' },
    { id: 9, name: 'Ivy Green', initials: 'IG', status: 'absent' },
    { id: 10, name: 'Jack White', initials: 'JW', status: 'absent' },
    { id: 11, name: 'Kevin Taylor', initials: 'KT', status: 'online' },
    { id: 12, name: 'Michael Chang', initials: 'MC', status: 'online' }
  ];

  const statusPriority = {
    'online': 1,
    'wfh': 2,
    'offline': 3,
    'on_leave': 4,
    'absent': 5
  };

  const sortedTeamMembers = [...teamMembers].sort((a, b) => statusPriority[a.status] - statusPriority[b.status]);

  // 2. Sprint Status Data
  const sprintData = {
    name: 'Sprint 42: Alpha Release',
    pointsCompleted: 68,
    pointsTotal: 120,
    tasks: {
      todo: 12,
      inProgress: 8,
      blocked: 3,
      done: 24
    },
    velocityTrend: '+15% from last sprint'
  };

  const progressPercentage = (sprintData.pointsCompleted / sprintData.pointsTotal) * 100;
  const radius = 60;
  const teamWorkload = [
    { id: 1, name: 'Alice Chen', role: 'Frontend Dev', load: 85 },
    { id: 12, name: 'Michael Chang', role: 'Backend Dev', load: 45 },
    { id: 8, name: 'Hannah Lee', role: 'UI/UX Designer', load: 95 },
    { id: 11, name: 'Kevin Taylor', role: 'QA Engineer', load: 60 },
    { id: 2, name: 'Bob Smith', role: 'Frontend Dev', load: 35 },
    { id: 6, name: 'Fiona Gallagher', role: 'Backend Dev', load: 75 },
    { id: 4, name: 'Diana Prince', role: 'Product Manager', load: 88 },
    { id: 3, name: 'Charlie Davis', role: 'Full Stack Dev', load: 65 },
    { id: 7, name: 'George Hale', role: 'Security Analyst', load: 40 },
    { id: 5, name: 'Evan Wright', role: 'DevOps Engineer', load: 0 },
    { id: 9, name: 'Ivy Green', role: 'Data Analyst', load: 0 },
    { id: 10, name: 'Jack White', role: 'System Admin', load: 0 }
  ];

  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const [pendingDetails, setPendingDetails] = useState({
    leaveRequests: [
      { id: 1, name: 'Alice Chen', desc: 'Annual Leave: May 12 - 13', employeeNote: "Need to attend to family matters." },
      { id: 2, name: 'Diana Prince', desc: 'Personal Leave: May 20', employeeNote: 'Attending a workshop.' },
      { id: 3, name: 'Fiona Gallagher', desc: 'Annual Leave: May 20 - 21', employeeNote: 'Pre-planned vacation trip.' },
      { id: 4, name: 'George Hale', desc: 'Annual Leave: May 20', employeeNote: 'Family event.' }
    ],
    timesheetCorrections: [
      { id: 1, name: 'Fiona Gallagher', desc: 'Date: Tue, May 9 - Missing 2 hours', employeeNote: 'I forgot to clock in after lunch.' },
      { id: 2, name: 'Hannah Lee', desc: 'Date: Wed, May 10 - Overtime (4h)', employeeNote: 'Stayed late to finalize the Q2 marketing presentation.' },
      { id: 3, name: 'Charlie Davis', desc: 'Date: Mon, May 8 - Forgot clock out', employeeNote: 'Rushed out due to an emergency.' },
      { id: 4, name: 'George Hale', desc: 'Date: Thu, May 11 - Project code fix', employeeNote: 'Logged hours against the wrong client project by mistake.' },
      { id: 5, name: 'Evan Wright', desc: 'Date: Mon, May 8 - Missing hours', employeeNote: "System was down so I couldn't log my morning hours." },
      { id: 6, name: 'Diana Prince', desc: 'Date: Fri, May 5 - Overtime (2h)', employeeNote: 'Approved overtime for the weekend deployment prep.' },
      { id: 7, name: 'Alice Chen', desc: 'Date: Tue, May 9 - Wrong project code', employeeNote: 'Accidentally booked to internal overhead.' }
    ],
    wfhRequests: [
      { id: 1, name: 'Bob Smith', desc: 'Date: Thursday, May 14', employeeNote: 'Having a plumber come over to fix a leak.' },
      { id: 2, name: 'George Hale', desc: 'Date: Friday, May 15', employeeNote: 'Need to stay home for emergency childcare.' }
    ],
    absentAlerts: [
      { id: 5, name: 'Evan Wright', desc: 'Date: Today - Unexplained Absence', employeeNote: 'No leave request filed. Requires follow-up.' },
      { id: 9, name: 'Ivy Green', desc: 'Date: Today - Unexplained Absence', employeeNote: 'No leave request filed. Requires follow-up.' },
      { id: 10, name: 'Jack White', desc: 'Date: Today - Unexplained Absence', employeeNote: 'No leave request filed. Requires follow-up.' }
    ]
  });

  const promptAction = (e, listKey, id, action) => {
    e.stopPropagation();
    setConfirmDialog({ isOpen: true, listKey, id, action });
  };

  const executeAction = () => {
    const { listKey, id } = confirmDialog;
    setPendingDetails(prev => ({
      ...prev,
      [listKey]: prev[listKey].filter(item => item.id !== id)
    }));
    if (expandedItem === id) {
      setExpandedItem(null);
    }
    setConfirmDialog({ isOpen: false, listKey: '', id: null, action: '' });
  };

  const cancelAction = () => {
    setConfirmDialog({ isOpen: false, listKey: '', id: null, action: '' });
  };

  // 3. Pending Approvals Data
  const pendingApprovals = {
    leaveRequests: pendingDetails.leaveRequests.length,
    timesheetCorrections: pendingDetails.timesheetCorrections.length,
    wfhRequests: pendingDetails.wfhRequests.length
  };


  // 4. Today's Absent Alert Data
  const absentAlerts = teamMembers
    .filter(member => member.status === 'absent')
    .map(member => ({
      id: member.id,
      name: member.name,
      initials: member.initials,
      reason: 'Unexplained Absence - No leave request filed'
    }));

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
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      
      <div className={styles.topGrid}>
        {/* 1. Team Presence Grid */}
        <div className={styles.widgetCard} style={{ alignSelf: 'start' }}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>
              <Users size={20} className={styles.widgetIcon} />
              Team Presence
            </div>
            <button 
              onClick={() => setShowAllTeam(!showAllTeam)} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
            >
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
                <div 
                  key={member.id} 
                  className={styles.avatarWrapper}
                  style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                  onClick={() => {
                    if (setSelectedChatUser && setActiveTab) {
                      // Match ID format from messaging module
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

        {/* 2. Sprint Status Widget */}
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
                <circle
                  className={styles.progressRingTrack}
                  cx="70" cy="70" r={radius}
                />
                <circle
                  className={styles.progressRingFill}
                  cx="70" cy="70" r={radius}
                  style={{ strokeDasharray: circumference, strokeDashoffset }}
                />
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

      <div className={styles.bottomGrid}>
        {/* 3. Pending Approvals Counter */}
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>
              <CheckCircle size={20} className={styles.widgetIcon} />
              Pending Approvals
            </div>
          </div>
          <div className={styles.badgeList}>
            <div 
              className={styles.badgeItem}
              onClick={() => setCurrentView('leave')}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.badgeInfo}>
                <div className={`${styles.badgeIcon} ${styles.purple}`}>
                  <Calendar size={18} />
                </div>
                <span className={styles.badgeLabel}>Leave Requests</span>
              </div>
              <span className={styles.badgeCount}>{pendingApprovals.leaveRequests}</span>
            </div>

            <div 
              className={styles.badgeItem}
              onClick={() => setCurrentView('timesheet')}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.badgeInfo}>
                <div className={`${styles.badgeIcon} ${styles.blue}`}>
                  <Clock size={18} />
                </div>
                <span className={styles.badgeLabel}>Timesheet Corrections</span>
              </div>
              <span className={styles.badgeCount}>{pendingApprovals.timesheetCorrections}</span>
            </div>

            <div 
              className={styles.badgeItem}
              onClick={() => setCurrentView('wfh')}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.badgeInfo}>
                <div className={`${styles.badgeIcon} ${styles.orange}`}>
                  <Laptop size={18} />
                </div>
                <span className={styles.badgeLabel}>WFH Requests</span>
              </div>
              <span className={styles.badgeCount}>{pendingApprovals.wfhRequests}</span>
            </div>
          </div>
        </div>

        {/* 4. Today's Absent Alert */}
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>
              <AlertCircle size={20} style={{ color: '#ef4444' }} />
              Today's Absent Alert
            </div>
          </div>
          <div className={styles.alertList}>
            {absentAlerts.map(alert => (
              <div 
                key={alert.id} 
                className={styles.alertCard}
                onClick={() => {
                  setCurrentView('absent');
                  setExpandedItem(alert.id);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.alertAvatar}>{alert.initials}</div>
                <div className={styles.alertInfo}>
                  <h4 className={styles.alertName} style={{ margin: 0 }}>{alert.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Team Workload Bars */}
        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <div className={styles.widgetTitle}>
              <Users size={20} className={styles.widgetIcon} />
              Team Workload
            </div>
            <button 
              onClick={() => setShowAllWorkload(!showAllWorkload)} 
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}
            >
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
                    <div 
                      className={`${styles.workloadBarFill} ${loadClass}`} 
                      style={{ width: `${member.load}%` }}
                    />
                  </div>
                  <span className={styles.workloadValue}>{member.load}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
