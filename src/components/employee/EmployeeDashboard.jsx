// Crash fix applied
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './Employee.css';

export default function EmployeeDashboard({ setActiveTab, currentUser }) {
  const employeeId = currentUser?.id;
  const employee = currentUser ? {
    id: currentUser.id,
    name: currentUser.name,
    designation: currentUser.designation || currentUser.role || 'Unassigned',
    department: currentUser.department || 'Unassigned',
    employeeCode: currentUser.emp_id || (currentUser.id ? `NSG-EMP-${currentUser.id}` : 'Unassigned')
  } : {
    name: 'Loading...',
    designation: '...',
    department: '...',
    employeeCode: '...'
  };

  // ── Clock-in state ────────────────────────────────────────────────
  const [clockedIn, setClockedIn] = useState(false);
  const [clockInTime, setClockInTime] = useState(null);
  const [elapsed, setElapsed] = useState('');
  const [clockBusy, setClockBusy] = useState(false);
  const token = localStorage.getItem('nsg_jwt_token');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/attendance/my-logs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const logs = await res.json();
          // Check if there is an active log for today
          const today = new Date().toISOString().split('T')[0];
          const activeLog = logs.find(l => l.date === today);
          if (activeLog && activeLog.clock_in && !activeLog.clock_out) {
            setClockedIn(true);
            setClockInTime(new Date(activeLog.clock_in).getTime());
          } else {
            setClockedIn(false);
            setClockInTime(null);
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchLogs();
  }, [token]);

  // Live elapsed timer
  useEffect(() => {
    if (!clockedIn || !clockInTime) { setElapsed(''); return; }
    const tick = () => {
      const diffMs = Date.now() - clockInTime;
      const h = Math.floor(diffMs / 3_600_000);
      const m = Math.floor((diffMs % 3_600_000) / 60_000);
      const s = Math.floor((diffMs % 60_000) / 1_000);
      setElapsed(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [clockedIn, clockInTime]);

  const handleClockIn = async () => {
    setClockBusy(true);
    let mode = "office";
    let lat = null;
    let lng = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }));
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e) { 
        console.warn("Geolocation failed or timed out:", e);
        mode = "wfh"; 
      }
    } else {
      mode = "wfh";
    }
    
    try {
      const res = await fetch('/api/attendance/clock-in', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_mode: mode, latitude: lat, longitude: lng })
      });
      if (res.ok) {
        const data = await res.json();
        setClockedIn(true);
        setClockInTime(new Date(data.clock_in).getTime());
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to clock in');
      }
    } catch (e) {
      console.error(e);
      alert('Network error during clock-in');
    }
    setClockBusy(false);
  };

  const handleClockOut = async () => {
    setClockBusy(true);
    try {
      const res = await fetch('/api/attendance/clock-out', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setClockedIn(false);
        setClockInTime(null);
        setElapsed('');
        alert('Clocked out successfully!');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || 'Failed to clock out');
      }
    } catch (e) {
      console.error(e);
      alert('Network error during clock-out');
    }
    setClockBusy(false);
  };

  // ── Greeting ─────────────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const isLate = hour >= 10 && !clockedIn;

  // ── Dashboard Data Fetch ──────────────────────────────────────────
  const userRole = (currentUser?.role || '').toLowerCase();
  const hideTasks = userRole === 'hr' || userRole === 'ceo' || userRole === 'team lead' || userRole === 'tl';
  const hideForHR = userRole === 'hr';
  const hideForTL = userRole === 'team lead' || userRole === 'tl';
  const hideHolidaysExpensesPerfMsg = hideForHR || hideForTL;
  const hideTimesheet = hideForHR;

  const [dbData, setDbData] = useState({
    tasks: [],
    leaveBalances: null,
    payslips: [],
    assets: [],
    announcements: [],
    notifications: [],
    channels: []
  });

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [
          tasksRes, leaveRes, payslipRes, assetsRes, 
          annRes, notifRes, chanRes
        ] = await Promise.all([
          fetch('/api/employee-portal/tasks/my-tasks', { headers }),
          fetch('/api/employee-portal/leave/my-balances', { headers }),
          fetch('/api/employee-portal/payroll/my-payslips', { headers }),
          fetch('/api/employee-portal/resignation/my-assets', { headers }),
          fetch('/api/employee-portal/announcements', { headers }),
          fetch('/api/attendance/my-notifications', { headers }),
          fetch('/api/employee-portal/chat/my-channels', { headers })
        ]);

        const tasksData = tasksRes.ok ? await tasksRes.json() : [];
        const leaveBalances = leaveRes.ok ? await leaveRes.json() : null;
        const payslipsData = payslipRes.ok ? await payslipRes.json() : [];
        const assets = assetsRes.ok ? await assetsRes.json() : [];
        const announcementsData = annRes.ok ? await annRes.json() : [];
        const notificationsData = notifRes.ok ? await notifRes.json() : [];
        const channelsData = chanRes.ok ? await chanRes.json() : [];

        const tasks = Array.isArray(tasksData) ? tasksData : (tasksData.items || []);
        const payslips = Array.isArray(payslipsData) ? payslipsData : (payslipsData.items || []);
        let announcements = Array.isArray(announcementsData) ? announcementsData : (announcementsData.items || []);
        const notifications = Array.isArray(notificationsData) ? notificationsData : (notificationsData.items || []);
        const channels = Array.isArray(channelsData) ? channelsData : (channelsData.items || []);

        // Filter announcements based on audience
        announcements = announcements.filter(ann => 
          ann.audience === 'All Portals' || ann.audience === 'Employee Portal'
        );

        announcements.forEach(ann => {
          fetch(`/api/employee-portal/announcements/${ann.id}/read`, { method: 'POST', headers }).catch(() => {});
        });
        setDbData({ tasks, leaveBalances, payslips, assets, announcements, notifications, channels });
      } catch (e) { console.error('Dashboard fetch error', e); }
    };
    fetchAll();
  }, [token]);

  const myTasks = dbData.tasks;
  const openTasks = myTasks.filter(t => t.status !== 'done');
  const doneTasks = myTasks.filter(t => t.status === 'done');

  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 5;

  // ── Leave balance ─────────────────────────────────────────────────
  const myLeave = dbData.leaveBalances;

  // ── Payslip ───────────────────────────────────────────────────────
  const myPayslips = dbData.payslips;
  const latestPayslip = myPayslips.sort((a, b) => (b.period || '').localeCompare(a.period || ''))[0];

  // ── Assets ───────────────────────────────────────────────────────
  const myAssets = dbData.assets;

  // ── Channels (unread badge) ───────────────────────────────────────
  const myChannels = dbData.channels;

  // ── Derived leave statistics ──────────────────────────────────────
  const clLeft = myLeave?.CL ?? 0;
  const slLeft = myLeave?.SL ?? 0;
  const elLeft = myLeave?.EL ?? 0;
  const totalLeft = clLeft + slLeft + elLeft;

  // ── Pending actions ───────────────────────────────────────────────
  const [doneActions, setDoneActions] = useState({});
  const pendingActions = [
    { id: 'ts', label: 'Submit weekly timesheet', sub: 'Due: End of day today', tab: 'timesheet' },
    { id: 'lv', label: 'Review leave balance', sub: `Balance: ${totalLeft} days`, tab: 'leave' },
    { id: 'exp', label: 'File pending expenses', sub: 'Upload receipts and submit claims', tab: 'expenses' },
    { id: 'asset', label: 'Review asset NOC status', sub: `${myAssets.length} assigned asset(s)`, tab: 'assets' },
  ];

  // ── Notifications ─────────────────────────────────────────────────
  const [notifRead, setNotifRead] = useState(() => {
    try {
      const stored = localStorage.getItem('emp_notif_read');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('emp_notif_read', JSON.stringify(notifRead));
  }, [notifRead]);
  const notifications = dbData.notifications.map(n => ({
    id: n.id,
    icon: n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : '🔔',
    msg: n.message,
    time: n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : 'Just now',
    unread: !n.read
  }));

  const [annPage, setAnnPage] = useState(1);
  const annsPerPage = 3;


  // Priority color util
  const priorityClass = p => ({ high: 'emp-priority--high', medium: 'emp-priority--medium', low: 'emp-priority--low' }[p] || 'emp-priority--low');
  const statusStyle = s => {
    switch(s) {
      case 'in-progress': return { background: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' };
      case 'pending':     return { background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.25)' };
      case 'done':        return { background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' };
      case 'blocked':     return { background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)' };
      default:            return { background: 'rgba(107,114,128,0.1)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.25)' };
    }
  };

  return (
    <div className="component-container emp-root">
      {/* ── Page header ── */}
      <div className="component-header">
        <div>
          <h1>Employee Dashboard</h1>
          <p>Your personal workspace — tasks, leave, payroll and communications at a glance.</p>
        </div>
      </div>

      <div className="emp-body">

        {/* ── Welcome banner ── */}
        <div className={`emp-welcome ${isLate ? 'emp-welcome--late' : ''}`}>
          <div className="emp-welcome__glow" />
          <div>
            {isLate && (
              <div className="emp-late-pill">⚠️ You haven't clocked in yet today</div>
            )}
            <p className="emp-welcome__greeting">{greeting},</p>
            <h2 className="emp-welcome__name">{employee.name} 👋</h2>
            <p className="emp-welcome__meta">
              {employee.designation} · {employee.department} · {employee.employeeCode || 'NSG-EMP-102'}
            </p>
          </div>
          <div className="emp-welcome__actions">
            <div className="emp-clockin-wrap">
              <button
                className={`emp-clockin-btn ${clockedIn ? 'emp-clockin-btn--out' : 'emp-clockin-btn--in'}`}
                onClick={clockedIn ? handleClockOut : handleClockIn}
                disabled={clockBusy}
                id="emp-clock-btn"
              >
                {clockBusy ? (
                  <span className="emp-spin" style={{ display:'inline-block', width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%' }} />
                ) : (
                  clockedIn ? '🔴' : '🟢'
                )}
                {clockedIn ? 'Clock Out' : 'Clock In'}
                {clockedIn && elapsed && (
                  <span className="emp-clockin-elapsed">{elapsed}</span>
                )}
              </button>
            </div>
            <button className="emp-quick-btn" onClick={() => setActiveTab('profile')}>👤 Profile</button>
            {!hideTimesheet && (
              <button className="emp-quick-btn" onClick={() => setActiveTab('timesheet')}>⏱️ Timesheet</button>
            )}
          </div>
        </div>

        {/* ── KPI row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            !hideTasks ? {
              label: 'Open Tasks',
              value: openTasks.length,
              sub: `${doneTasks.length} completed`,
              color: '#60a5fa',
              icon: '📋',
              onClick: () => setActiveTab('tasks')
            } : (!hideTimesheet ? {
              label: 'Timesheets',
              value: 'Logs',
              sub: 'Track your hours',
              color: '#60a5fa',
              icon: '⏱️',
              onClick: () => setActiveTab('timesheet')
            } : {
              label: 'Attendance',
              value: 'Records',
              sub: 'View daily logs',
              color: '#60a5fa',
              icon: '📅',
              onClick: () => setActiveTab('attendance')
            }),
            {
              label: 'Leave Balance',
              value: myLeave ? `${totalLeft} days` : '0 days',
              sub: myLeave ? 'Available this year' : 'Pending allocation',
              color: '#10b981',
              icon: '🌴',
              onClick: () => setActiveTab('leave')
            },
            {
              label: 'Latest Payslip',
              value: latestPayslip ? `₹${(latestPayslip.net_pay || 0).toLocaleString('en-IN')}` : 'N/A',
              sub: latestPayslip?.period || 'Check payroll',
              color: '#fbbf24',
              icon: '💰',
              onClick: () => setActiveTab('payroll')
            },
            !hideHolidaysExpensesPerfMsg ? {
              label: 'My Channels',
              value: myChannels.length,
              sub: 'Active workspaces',
              color: '#a78bfa',
              icon: '💬',
              onClick: () => setActiveTab('messaging')
            } : {
              label: 'Asset Requests',
              value: myAssets.length,
              sub: 'Assigned assets',
              color: '#a78bfa',
              icon: '💻',
              onClick: () => setActiveTab('assets')
            }
          ].map(kpi => (
            <div
              key={kpi.label}
              className="emp-card"
              style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
              onClick={kpi.onClick}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 22 }}>{kpi.icon}</span>
                <span style={{ fontSize: 10, color: kpi.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</span>
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{kpi.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Main body grid ── */}
        <div className="emp-grid">

          {/* ── Tasks ── */}
            {!hideTasks && (
              <div className="emp-card emp-grid__tasks" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="emp-section-header" style={{ marginBottom: 14, flexShrink: 0 }}>
                  <div className="emp-section-header__left">
                    <span style={{ fontSize: 16 }}>📋</span>
                    <span className="emp-section-header__title">My Active Tasks</span>
                    <span className="emp-badge-count" style={{ background: 'rgba(96,165,250,0.1)', color: '#60a5fa' }}>{openTasks.length}</span>
                  </div>
                  <button
                    style={{ fontSize: 12, background: 'none', border: '1px solid var(--border-color)', borderRadius: 8, padding: '5px 12px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                    onClick={() => setActiveTab('tasks')}
                  >
                    View All →
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }} className="emp-scrollable-area">
                  {openTasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                      🎉 No open tasks — great job!
                    </div>
                  )}
                  {openTasks.slice((taskPage - 1) * tasksPerPage, taskPage * tasksPerPage).map(task => (
                    <div key={task.id} className="emp-task-row" style={{ cursor: 'pointer' }} onClick={() => {
                      localStorage.setItem('emp_open_task', task.id);
                      setActiveTab('tasks');
                    }}>
                      <span className={`emp-priority ${priorityClass(task.priority)}`}>{task.priority}</span>
                      <div style={{ flex: 1 }}>
                        <div className="emp-task-title">{task.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          {task.project} · Sprint: {task.sprint} · Due: {task.due}
                        </div>
                      </div>
                      <span className="emp-status-chip" style={statusStyle(task.status)}>{task.status.replace('-', ' ')}</span>
                    </div>
                  ))}
                  
                  {openTasks.length > tasksPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                      <button 
                        onClick={() => setTaskPage(p => Math.max(1, p - 1))}
                        disabled={taskPage === 1}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: taskPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', opacity: taskPage === 1 ? 0.5 : 1 }}
                      >
                        ← Prev
                      </button>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Page {taskPage} of {Math.ceil(openTasks.length / tasksPerPage)}</span>
                      <button 
                        onClick={() => setTaskPage(p => Math.min(Math.ceil(openTasks.length / tasksPerPage), p + 1))}
                        disabled={taskPage === Math.ceil(openTasks.length / tasksPerPage)}
                        style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: taskPage === Math.ceil(openTasks.length / tasksPerPage) ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', opacity: taskPage === Math.ceil(openTasks.length / tasksPerPage) ? 0.5 : 1 }}
                      >
                        Next →
                      </button>
                    </div>
                  )}


                </div>
              </div>
            )}

            {/* ── CEO Announcements ── */}
            <div className="emp-card" style={{ marginTop: hideTasks ? 0 : 16, gridColumn: hideHolidaysExpensesPerfMsg ? '1 / -1' : 'unset' }}>
              <div className="emp-section-header" style={{ marginBottom: 14 }}>
                <div className="emp-section-header__left">
                  <span style={{ fontSize: 16 }}>📢</span>
                  <span className="emp-section-header__title">CEO Announcements</span>
                  <span className="emp-badge-count" style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24' }}>
                    {dbData.announcements.length}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="emp-scrollable-area">
                {dbData.announcements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                    No announcements yet.
                  </div>
                ) : (
                  <>
                    {dbData.announcements.slice((annPage - 1) * annsPerPage, annPage * annsPerPage).map(ann => (
                      <div key={ann.id} style={{
                        padding: '14px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        borderLeft: ann.priority === 'Urgent' ? '4px solid #f87171' : '4px solid #60a5fa',
                        borderRadius: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{ann.date}</span>
                          {ann.priority === 'Urgent' && (
                            <span style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.25)', padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 800 }}>URGENT</span>
                          )}
                        </div>
                        <strong style={{ fontSize: 13, color: 'var(--text-primary)' }}>{ann.title}</strong>
                        <div dangerouslySetInnerHTML={{ __html: ann.body }} className="quill-content" style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }} />
                      </div>
                    ))}
                    {dbData.announcements.length > annsPerPage && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
                        <button 
                          onClick={() => setAnnPage(p => Math.max(1, p - 1))}
                          disabled={annPage === 1}
                          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: annPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', opacity: annPage === 1 ? 0.5 : 1 }}
                        >
                          ← Prev
                        </button>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Page {annPage} of {Math.ceil(dbData.announcements.length / annsPerPage)}</span>
                        <button 
                          onClick={() => setAnnPage(p => Math.min(Math.ceil(dbData.announcements.length / annsPerPage), p + 1))}
                          disabled={annPage === Math.ceil(dbData.announcements.length / annsPerPage)}
                          style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: annPage === Math.ceil(dbData.announcements.length / annsPerPage) ? 'not-allowed' : 'pointer', color: 'var(--text-primary)', opacity: annPage === Math.ceil(dbData.announcements.length / annsPerPage) ? 0.5 : 1 }}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* ── Right column ── */}
            {!hideHolidaysExpensesPerfMsg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>


              {/* ── Notifications ── */}
              <div className="emp-card">
                <div className="emp-section-header" style={{ marginBottom: 14 }}>
                  <div className="emp-section-header__left">
                    <span style={{ fontSize: 16 }}>🔔</span>
                    <span className="emp-section-header__title">Notifications</span>
                    <span className="emp-badge-count" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}>
                      {notifications.filter(n => n.unread && !notifRead[n.id]).length}
                    </span>
                  </div>
                  <button
                    style={{ fontSize: 11, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => {
                      const allRead = {};
                      notifications.forEach(n => { allRead[n.id] = true; });
                      setNotifRead(allRead);
                    }}
                  >
                    Mark all read
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }} className="emp-scrollable-area">
                  {(() => {
                    const unreadNotifs = notifications.filter(n => n.unread && !notifRead[n.id]);
                    if (unreadNotifs.length === 0) {
                      return <div style={{ padding: '30px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>All caught up! No new notifications.</div>;
                    }
                    return unreadNotifs.map(n => (
                      <div
                        key={n.id}
                        className="emp-notif-row emp-notif-row--unread"
                        style={{ cursor: 'default' }}
                      >
                        <div className="emp-notif-dot" />
                        <span className="emp-notif-icon">{n.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p className="emp-notif-msg">{n.msg}</p>
                          <p className="emp-notif-time">{n.time}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setNotifRead(p => ({ ...p, [n.id]: true }));
                          }}
                          style={{
                            background: 'none', border: 'none', padding: '4px',
                            cursor: 'pointer', color: 'var(--text-muted)',
                            borderRadius: '4px', display: 'flex', alignItems: 'center',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                          title="Dismiss notification"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ));
                  })()}
                </div>
              </div>


            </div>
          )}
        </div>
      </div>
    </div>
  );
}

