import React, { useState, useEffect, useRef } from 'react';
import {
  Bell, Search, ChevronDown, Check, Shield, Briefcase, Award, Users,
  Mail, CalendarOff, UserPlus, AlertTriangle, FileText, LogOut, X
} from 'lucide-react';

export default function Navbar({ activeRole, setActiveRole, navigateTo, hrDb = {} }) {
  const [showRoleDropdown, setShowRoleDropdown]   = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readIds, setReadIds]                     = useState(() => {
    try { return JSON.parse(localStorage.getItem('nsg_notif_read') || '[]'); } catch { return []; }
  });

  const bellRef   = useRef(null);
  const roleRef   = useRef(null);

  const roles = [
    { id: 'CEO',      label: 'Chief Executive Officer', icon: Shield,   color: '#f59e0b', desc: 'Full system oversight'    },
    { id: 'HR',       label: 'HR Manager',              icon: Users,    color: '#ec4899', desc: 'Talent & recruitment'     },
    { id: 'TL',       label: 'Team Lead',               icon: Award,    color: '#3b82f6', desc: 'Projects & delivery'      },
    { id: 'Employee', label: 'Staff Member',            icon: Briefcase,color: '#10b981', desc: 'Personal workspace'       },
  ];
  const activeRoleDetails = roles.find(r => r.id === activeRole) || roles[0];
  const RoleIcon = activeRoleDetails.icon;

  // ── Derive live notifications from hrDb ────────────────────────────────────
  const buildNotifications = () => {
    const notifs = [];

    // Pending leave requests
    const pendingLeaves = (hrDb.leaveRequests || []).filter(r => r.status === 'Pending');
    pendingLeaves.slice(0, 3).forEach(r => notifs.push({
      id:     `leave-${r.id}`,
      icon:   CalendarOff,
      color:  '#f59e0b',
      title:  `Leave request from ${r.employeeName || r.employee_name || 'Employee'}`,
      sub:    `${r.leaveType || r.type || 'Leave'} · ${r.startDate || r.start_date || ''}`,
      role:   'HR',
      tab:    'leave',
      time:   'Pending approval'
    }));
    if (pendingLeaves.length > 3) notifs.push({
      id: 'leave-more', icon: CalendarOff, color: '#f59e0b',
      title: `+${pendingLeaves.length - 3} more pending leave requests`,
      sub: '', role: 'HR', tab: 'leave', time: ''
    });

    // New / unreviewed candidates
    const newCandidates = (hrDb.candidates || []).filter(c =>
      c.status === 'Applied' || c.status === 'New' || c.stage === 'Applied'
    );
    newCandidates.slice(0, 2).forEach(c => notifs.push({
      id:    `cand-${c.id}`,
      icon:   UserPlus,
      color:  '#8b5cf6',
      title:  `New applicant: ${c.name || 'Candidate'}`,
      sub:    c.role || c.jobRole || c.position || 'Open Role',
      role:   'HR',
      tab:    'recruitment',
      time:   'New application'
    }));

    // Timesheet exceptions
    const exceptions = (hrDb.timesheetExceptions || []).filter(e =>
      e.status === 'Pending' || e.status === 'Open'
    );
    if (exceptions.length > 0) notifs.push({
      id:    'ts-exceptions',
      icon:   AlertTriangle,
      color:  '#ef4444',
      title:  `${exceptions.length} timesheet exception${exceptions.length > 1 ? 's' : ''} need attention`,
      sub:    'Regularisation required',
      role:   'HR',
      tab:    'timesheets',
      time:   'Action required'
    });

    // Pending resignations
    const pendingResignations = (hrDb.resignations || []).filter(r =>
      r.status === 'pending' || r.status === 'Pending'
    );
    if (pendingResignations.length > 0) notifs.push({
      id:    'exits',
      icon:   LogOut,
      color:  '#f43f5e',
      title:  `${pendingResignations.length} resignation${pendingResignations.length > 1 ? 's' : ''} in notice period`,
      sub:    'F&F settlement needed',
      role:   'HR',
      tab:    'exits',
      time:   'Action required'
    });

    // Expense claims pending
    const pendingClaims = (hrDb.expenseClaims || []).filter(c =>
      c.status === 'Pending' || c.status === 'Submitted'
    );
    if (pendingClaims.length > 0) notifs.push({
      id:    'expense-claims',
      icon:   FileText,
      color:  '#06b6d4',
      title:  `${pendingClaims.length} expense claim${pendingClaims.length > 1 ? 's' : ''} awaiting review`,
      sub:    'Payroll · Expense Claims',
      role:   'HR',
      tab:    'payroll',
      time:   'Pending'
    });

    // Fallback static notifs if db is empty (demo mode)
    if (notifs.length === 0) {
      notifs.push(
        { id: 'demo-1', icon: Mail,        color: '#ec4899', title: 'New message in #hr-channel', sub: 'John Doe mentioned you', role: 'HR', tab: 'messaging', time: 'Just now' },
        { id: 'demo-2', icon: UserPlus,    color: '#8b5cf6', title: 'New candidate applied',       sub: 'Senior React Developer',  role: 'HR', tab: 'recruitment', time: '1h ago' },
        { id: 'demo-3', icon: CalendarOff, color: '#f59e0b', title: 'Leave request pending',       sub: 'Annual Leave · 3 days',   role: 'HR', tab: 'leave',  time: '2h ago' }
      );
    }

    return notifs;
  };

  const notifications = buildNotifications();
  const unreadNotifs  = notifications.filter(n => !readIds.includes(n.id));
  const unreadCount   = unreadNotifs.length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowNotifications(false);
      if (roleRef.current && !roleRef.current.contains(e.target))  setShowRoleDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markAllRead = () => {
    const all = notifications.map(n => n.id);
    setReadIds(all);
    localStorage.setItem('nsg_notif_read', JSON.stringify(all));
  };

  const handleNotifClick = (notif) => {
    // Mark this single notification as read
    const updated = [...new Set([...readIds, notif.id])];
    setReadIds(updated);
    localStorage.setItem('nsg_notif_read', JSON.stringify(updated));
    setShowNotifications(false);
    // Navigate to correct role + tab
    if (navigateTo) navigateTo(notif.role, notif.tab);
    else window.location.hash = `#/${notif.role}/${notif.tab}`;
  };

  return (
    <header className="app-navbar">
      {/* Search Bar */}
      <div className="navbar-left">
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Search resources, files, and users..." className="search-input" />
        </div>
      </div>

      {/* Right Controls */}
      <div className="navbar-right">

        {/* ── Bell Notification ─────────────────────────────────────────── */}
        <div className="nav-action-wrapper" ref={bellRef}>
          <button
            className={`nav-icon-button ${showNotifications ? 'active' : ''}`}
            onClick={() => { setShowNotifications(v => !v); setShowRoleDropdown(false); }}
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="notification-badge" style={{ animation: 'pulse 2s infinite' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="nav-dropdown notifications-dropdown" style={{ width: '360px', maxHeight: '480px', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div className="dropdown-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={15} style={{ color: 'var(--accent-pink)' }} />
                  <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Notifications</h3>
                  {unreadCount > 0 && (
                    <span style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', fontSize: '10px', fontWeight: 'bold', padding: '1px 6px', borderRadius: '10px' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {unreadCount > 0 && (
                    <span
                      className="mark-read"
                      onClick={markAllRead}
                      style={{ fontSize: '11px', color: 'var(--accent-pink)', cursor: 'pointer', fontWeight: '500' }}
                    >
                      Mark all read
                    </span>
                  )}
                  <button type="button" onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="dropdown-list custom-scroll" style={{ overflowY: 'auto', flex: 1 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    🎉 All caught up! No pending actions.
                  </div>
                ) : notifications.map(notif => {
                  const Icon   = notif.icon;
                  const isRead = readIds.includes(notif.id);
                  return (
                    <div
                      key={notif.id}
                      onClick={() => handleNotifClick(notif)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isRead ? 'transparent' : 'rgba(236,72,153,0.04)',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(236,72,153,0.08)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = isRead ? 'transparent' : 'rgba(236,72,153,0.04)'}
                    >
                      {/* Icon badge */}
                      <div style={{ width: '34px', height: '34px', borderRadius: '50%', backgroundColor: `${notif.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                        <Icon size={16} style={{ color: notif.color }} />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <p style={{ margin: 0, fontSize: '12.5px', fontWeight: isRead ? '400' : '600', color: 'var(--text-primary)', lineHeight: '1.4' }}>
                            {notif.title}
                          </p>
                          {!isRead && <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'var(--accent-pink)', flexShrink: 0, marginTop: '4px' }} />}
                        </div>
                        {notif.sub && <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>{notif.sub}</p>}
                        {notif.time && <p style={{ margin: '3px 0 0', fontSize: '10px', color: notif.color, fontWeight: '500' }}>{notif.time}</p>}
                      </div>

                      {/* Arrow hint */}
                      <div style={{ fontSize: '14px', color: 'var(--text-muted)', flexShrink: 0, alignSelf: 'center' }}>›</div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-color)', textAlign: 'center', flexShrink: 0 }}>
                <span
                  style={{ fontSize: '12px', color: 'var(--accent-pink)', cursor: 'pointer', fontWeight: '500' }}
                  onClick={() => { setShowNotifications(false); if (navigateTo) navigateTo('HR', 'dashboard'); }}
                >
                  View HR Dashboard →
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="nav-divider" />

        {/* ── Role Switcher ──────────────────────────────────────────────── */}
        <div className="role-selector-wrapper" ref={roleRef}>
          <button
            className="role-selector-btn"
            onClick={() => { setShowRoleDropdown(v => !v); setShowNotifications(false); }}
          >
            <div className="role-avatar" style={{ backgroundColor: activeRoleDetails.color }}>
              <RoleIcon size={18} color="#fff" />
            </div>
            <div className="role-info">
              <span className="user-name">Sarah Jenkins</span>
              <span className="user-role" style={{ color: activeRoleDetails.color }}>{activeRoleDetails.label}</span>
            </div>
            <ChevronDown size={16} className={`chevron-icon ${showRoleDropdown ? 'rotate' : ''}`} />
          </button>

          {showRoleDropdown && (
            <div className="nav-dropdown role-dropdown">
              <div className="dropdown-header">
                <h3>Switch Account Role</h3>
              </div>
              <div className="dropdown-list">
                {roles.map(roleOption => {
                  const Icon = roleOption.icon;
                  const isSelected = roleOption.id === activeRole;
                  return (
                    <button
                      key={roleOption.id}
                      className={`dropdown-itemrole ${isSelected ? 'selected' : ''}`}
                      onClick={() => { setActiveRole(roleOption.id); setShowRoleDropdown(false); }}
                    >
                      <div className="itemrole-icon" style={{ backgroundColor: `${roleOption.color}15`, color: roleOption.color }}>
                        <Icon size={18} />
                      </div>
                      <div className="itemrole-text">
                        <span className="itemrole-label">{roleOption.label}</span>
                        <span className="itemrole-desc">{roleOption.desc}</span>
                      </div>
                      {isSelected && <Check size={16} className="itemrole-check" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
