import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Ceo from './components/ceo/Ceo';
import Hr from './components/hr/Hr';
import Tl from './components/tl/Tl';
import Employee from './components/employee/Employee';
import Login from './components/auth/Login';
import './index.css';
import { ToastProvider } from './components/common/ToastProvider.jsx';
import { ThemeProvider } from './components/common/ThemeContext.jsx';

// Seed defaults from HR package to establish unified global DB state
import {
  INITIAL_CANDIDATES, INITIAL_EMPLOYEES, INITIAL_JOB_HISTORY,
  INITIAL_DISCIPLINARY_TICKETS, INITIAL_PIPS, INITIAL_ATTENDANCE_LOGS,
  INITIAL_TIMESHEET_EXCEPTIONS, INITIAL_LEAVE_BALANCES, INITIAL_LEAVE_REQUESTS,
  INITIAL_PAYROLL_RUNS, INITIAL_PAYSLIPS, INITIAL_LOANS,
  INITIAL_EXPENSE_CLAIMS, INITIAL_TDS_DECLARATIONS, INITIAL_TRAINING_TRACKS,
  INITIAL_TRAINING_PROGRESS, INITIAL_CHAT_ROOMS, INITIAL_AUDIT_LOGS
} from './components/hr/mockData';

const INITIAL_ATTENDANCE_CORRECTIONS = [
  { 
    id: 1, 
    employee_id: 102, 
    correction_date: '2026-05-27', 
    requested_clock_in: '2026-05-27T09:00:00Z', 
    requested_clock_out: '2026-05-27T18:00:00Z', 
    reason: 'Forgot to swipe out due to client meeting.' 
  }
];

const INITIAL_RESIGNATIONS = [
  { 
    id: 1, 
    employee_id: 103, 
    resignation_date: '2026-05-20', 
    LWD: '2026-06-20', 
    status: 'pending', 
    reason: 'Pursuing higher studies.' 
  }
];

const INITIAL_ASSETS = [
  { id: 'LAP-089', employee_id: 102, assetTag: 'NSG-LAP-089', type: 'Laptop', name: 'Corporate MacBook Pro Silicon', serialNumber: 'SN-89736412', issueDate: '2024-03-15', condition: 'Excellent', returnStatus: 'Pending NOC', signedDate: null },
  { id: 'ACC-512', employee_id: 102, assetTag: 'NSG-ACC-512', type: 'Access Card', name: 'RSA Security Hardware OTP Token', serialNumber: 'SN-00512', issueDate: '2024-03-15', condition: 'Good', returnStatus: 'Pending NOC', signedDate: null },
  { id: 'HDS-990', employee_id: 102, assetTag: 'NSG-HDS-990', type: 'Headset', name: 'Corporate Mobile (iPhone SE)', serialNumber: 'SN-990812', issueDate: '2025-01-10', condition: 'Fair', returnStatus: 'Pending NOC', signedDate: null },
  
  { id: 'LAP-093', employee_id: 103, assetTag: 'NSG-MAC-093', type: 'Laptop', name: 'Corporate MacBook Pro Silicon', serialNumber: 'SN-93746123', issueDate: '2023-11-01', condition: 'Excellent', returnStatus: 'Pending NOC', signedDate: null },
  { id: 'RSA-847', employee_id: 103, assetTag: 'RSA-8472-F', type: 'Access Card', name: 'RSA Security Hardware OTP Token', serialNumber: 'SN-84720', issueDate: '2023-11-01', condition: 'Good', returnStatus: 'Pending NOC', signedDate: null },
  { id: 'PHN-201', employee_id: 103, assetTag: 'NSG-PHN-201', type: 'Headset', name: 'Corporate Mobile (iPhone SE)', serialNumber: 'SN-201948', issueDate: '2024-05-10', condition: 'Good', returnStatus: 'Pending NOC', signedDate: null }
];

const INITIAL_ANNOUNCEMENTS = [
  { 
    id: 1, title: 'Important Policy Update — April 2026', 
    body: 'Please review the attached changes to the WFH policy. Managers must ensure team compliance by Friday.', 
    priority: 'Urgent', audience: 'All Employees', date: 'Today, 09:00 AM', 
    author: 'CEO Office', readPct: 65, readCount: 812
  },
  { 
    id: 2, title: 'Q1 Townhall Recording Available', 
    body: 'Thank you to everyone who joined our all-hands. The recording is now available on the intranet.', 
    priority: 'Normal', audience: 'All Employees', date: 'Yesterday', 
    author: 'CEO Office', readPct: 92, readCount: 1150
  }
];

const INITIAL_TIMESHEETS = [
  {
    id: 1,
    employee_id: 102, // Jane Smith
    week_start_date: '2026-05-25',
    status: 'draft',
    rejection_comment: '',
    rows: [
      { taskId: 1, name: 'API Integration – Auth Module', sprint: 'Sprint 14', hours: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 } },
      { taskId: 2, name: 'UI Fix – Dashboard Cards', sprint: 'Sprint 14', hours: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 } },
      { taskId: 3, name: 'Code Review – PR #204', sprint: 'Sprint 14', hours: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 } }
    ]
  }
];

const INITIAL_CHAT_CHANNELS = [
  {
    id: 'general-channel',
    name: '#general-channel',
    label: 'Company General Room',
    type: 'staff',
    members: ['101', '102', '103', '104', '105', 'hr', 'ceo'],
    messages: [
      { id: 1, sender: 'CEO (John Doe)', text: 'Welcome to the unified NSG-ERP communications channel!', time: 'Yesterday' }
    ]
  },
  {
    id: 'team-room',
    name: '#team-room',
    label: 'Engineering Team Room',
    type: 'staff',
    members: ['101', '102', '103', '105', 'hr'],
    messages: [
      { id: 1, sender: 'Marcus Vance', text: 'Hey team, morning! Please drop your standup items here. Also, let\'s aim to deploy the new build by 4 PM.', time: '9:15 AM' },
      { id: 2, sender: 'Alex Wong', text: 'Morning! Working on the payment gate validation fixes. PR is ready for review: #412.', time: '9:30 AM' },
      { id: 3, sender: 'Sarah Jenkins', text: 'Morning! I\'m wrapping up the Asset Requests validation and mobile tab changes. I\'ll review your PR, Alex, right after.', time: '9:35 AM' }
    ]
  },
  {
    id: 'grievance-room',
    name: '#grievance-room',
    label: 'HR Grievance (Private)',
    type: 'grievance',
    members: ['102', 'hr'],
    messages: [
      { id: 1, sender: 'Sophia Reed (HR Officer)', text: 'Hello Sarah, welcome to your secure grievance portal. Anything shared here remains private. How can I assist you today?', time: 'Yesterday' }
    ]
  },
  {
    id: 'ceo-channel',
    name: '#ceo-channel',
    label: 'CEO Suite Room',
    type: 'management',
    members: ['hr', 'ceo'],
    messages: [
      { id: 1, sender: 'CEO (John Doe)', text: "Sarah, let's audit the monthly payroll maker file before release.", time: '11:15 AM' }
    ]
  },
  {
    id: 'tl-channel',
    name: '#tl-channel',
    label: 'Team Lead Forum',
    type: 'management',
    members: ['hr', '101'],
    messages: [
      { id: 1, sender: 'TL (Michael Vance)', text: 'Are the Shift A attendance exceptions fully resolved?', time: '09:30 AM' }
    ]
  }
];

const INITIAL_TASKS = [
  {
    id: 1,
    project: 'NSG-ERP Core',
    sprint: 'Sprint 14',
    title: 'Finalize Q3 sprint report',
    description: 'Compile all sprint metrics, velocity charts, and retrospective notes into the final Q3 report document for stakeholder review.',
    priority: 'high',
    status: 'in-progress',
    sp: 5,
    assignee: 'Jane Smith',
    avatar: 'JS',
    due: '2026-06-05',
    subtasks: [
      { id: 11, title: 'Collect velocity data from Jira', done: true },
      { id: 12, title: 'Write retrospective summary',    done: true },
      { id: 13, title: 'Export charts to PDF',           done: false },
    ],
    acceptance: [
      'Report covers all 3 sprints of Q3',
      'Charts exported as high-res PNG',
      'Approved by Product Owner before submission',
    ],
    prStatus: null,
    prUrl: '',
    rejectedReason: '',
  },
  {
    id: 2,
    project: 'NSG-ERP Core',
    sprint: 'Sprint 14',
    title: 'Code review – auth module',
    description: 'Review pull request #204 for the authentication module refactor. Ensure JWT refresh logic, error handling, and test coverage are complete.',
    priority: 'medium',
    status: 'pending',
    sp: 3,
    assignee: 'Jane Smith',
    avatar: 'JS',
    due: '2026-06-08',
    subtasks: [
      { id: 21, title: 'Review JWT refresh logic', done: false },
      { id: 22, title: 'Check error boundary coverage', done: false },
    ],
    acceptance: [
      'All unit tests pass with >80% coverage',
      'No critical security findings',
    ],
    prStatus: null,
    prUrl: '',
    rejectedReason: '',
  },
  {
    id: 3,
    project: 'Marketing Website',
    sprint: 'Sprint 14',
    title: 'Update Dashboard Layout',
    description: 'Update the dashboard grid spacing, sidebar collapse animation, and responsive media queries.',
    priority: 'low',
    status: 'pending',
    sp: 3,
    assignee: 'David Miller',
    avatar: 'DM',
    due: '2026-06-12',
    subtasks: [
      { id: 31, title: 'Update story points', done: false },
      { id: 32, title: 'Reassign stale tickets', done: false },
    ],
    acceptance: ['All tickets have assignee and SP', 'No tickets in backlog without sprint'],
    prStatus: null,
    prUrl: '',
    rejectedReason: '',
  },
  {
    id: 4,
    project: 'NSG-ERP Core',
    sprint: 'Sprint 13',
    title: 'Team sync meeting notes',
    description: 'Document and distribute the weekly team sync notes including decisions made, blockers identified, and action items assigned.',
    priority: 'medium',
    status: 'done',
    sp: 2,
    assignee: 'Jane Smith',
    avatar: 'JS',
    due: '2026-05-28',
    subtasks: [
      { id: 41, title: 'Write meeting summary', done: true },
      { id: 42, title: 'Share via Slack', done: true },
    ],
    acceptance: ['Notes shared within 2 hours of meeting', 'Action items have owners'],
    prStatus: 'approved',
    prUrl: 'https://github.com/org/repo/pull/198',
    rejectedReason: '',
  },
  {
    id: 5,
    project: 'Mobile App',
    sprint: 'Sprint 13',
    title: 'Deploy staging build v2.4',
    description: 'Deploy the latest build to the staging environment, run smoke tests, and notify QA team for sign-off.',
    priority: 'high',
    status: 'blocked',
    sp: 8,
    assignee: 'Jane Smith',
    avatar: 'JS',
    due: '2026-05-25',
    subtasks: [
      { id: 51, title: 'Build Docker image', done: true },
      { id: 52, title: 'Run smoke tests', done: false },
      { id: 53, title: 'Notify QA team', done: false },
    ],
    acceptance: ['Smoke tests pass 100%', 'QA sign-off received', 'Deployment log archived'],
    prStatus: 'rejected',
    prUrl: '',
    rejectedReason: 'Missing smoke test results in PR description.',
  }
];

export default function App() {
  const loadDbSync = () => {
    const localData = localStorage.getItem('nsg_hr_db');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (!parsed.attendanceCorrections) parsed.attendanceCorrections = [];
        if (!parsed.resignations) parsed.resignations = INITIAL_RESIGNATIONS;
        if (!parsed.timesheets) parsed.timesheets = INITIAL_TIMESHEETS;
        if (!parsed.tasks || !Array.isArray(parsed.tasks)) parsed.tasks = INITIAL_TASKS;
        if (!parsed.supportTickets) parsed.supportTickets = [];
        if (!parsed.assets) parsed.assets = INITIAL_ASSETS;
        if (!parsed.assetRequests) parsed.assetRequests = [];
        if (!parsed.chatChannels || parsed.chatChannels.length === 0) parsed.chatChannels = INITIAL_CHAT_CHANNELS;
        if (!parsed.announcements || parsed.announcements.length === 0) parsed.announcements = INITIAL_ANNOUNCEMENTS;
        if (!parsed.geofenceSettings) {
          parsed.geofenceSettings = {
            enabled: true,
            latitude: 12.9716,
            longitude: 77.5946,
            radius: 100
          };
        }
        
        // Remove pre-seeded mock logs & corrections for active testing employee ID 102
        // This ensures a completely blank sheet so only your live actions show up!
        parsed.attendanceLogs = (parsed.attendanceLogs || []).filter(l => l.employee_id !== 102);
        parsed.attendanceCorrections = (parsed.attendanceCorrections || []).filter(c => c.employee_id !== 102);
        
        localStorage.setItem('nsg_hr_db', JSON.stringify(parsed));
        return parsed;
      } catch (e) {
        return seedDbSync();
      }
    } else {
      return seedDbSync();
    }
  };

  const seedDbSync = () => {
    const seed = {
      candidates: INITIAL_CANDIDATES,
      employees: INITIAL_EMPLOYEES,
      jobHistory: INITIAL_JOB_HISTORY,
      disciplinaryTickets: INITIAL_DISCIPLINARY_TICKETS,
      pips: INITIAL_PIPS,
      attendanceLogs: INITIAL_ATTENDANCE_LOGS.filter(l => l.employee_id !== 102),
      timesheetExceptions: INITIAL_TIMESHEET_EXCEPTIONS,
      leaveBalances: INITIAL_LEAVE_BALANCES,
      leaveRequests: INITIAL_LEAVE_REQUESTS,
      payrollRuns: INITIAL_PAYROLL_RUNS,
      payslips: INITIAL_PAYSLIPS,
      loans: INITIAL_LOANS,
      expenseClaims: INITIAL_EXPENSE_CLAIMS,
      tdsDeclarations: INITIAL_TDS_DECLARATIONS,
      trainingTracks: INITIAL_TRAINING_TRACKS,
      trainingProgress: INITIAL_TRAINING_PROGRESS,
      chatRooms: INITIAL_CHAT_ROOMS,
      auditLogs: INITIAL_AUDIT_LOGS,
      attendanceCorrections: [],
      resignations: INITIAL_RESIGNATIONS,
      timesheets: INITIAL_TIMESHEETS,
      tasks: INITIAL_TASKS,
      supportTickets: [],
      assets: INITIAL_ASSETS,
      assetRequests: [],
      chatChannels: INITIAL_CHAT_CHANNELS,
      announcements: INITIAL_ANNOUNCEMENTS,
      geofenceSettings: {
        enabled: true,
        latitude: 12.9716,
        longitude: 77.5946,
        radius: 100
      }
    };
    localStorage.setItem('nsg_hr_db', JSON.stringify(seed));
    return seed;
  };

  const [db, setDb] = useState(() => loadDbSync());
  const [token, setToken] = useState(() => localStorage.getItem('nsg_jwt_token') || '');
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(!!token);

  // Helper to forward toast messages to the global provider (if available)
  const showToast = (msg, type = 'success') => {
    if (window.showToast) {
      window.showToast(msg, type);
    }
  };

  useEffect(() => {
    // Preserve existing unhandled rejection handling using the helper
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      const msg = event.reason?.detail || event.reason?.message || String(event.reason) || 'An unexpected database or API error occurred';
      if (msg && !msg.includes('ResizeObserver') && !msg.includes('ResizeObserver loop limit exceeded')) {
        showToast(msg, 'error');
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const updateDb = (newDb) => {
    localStorage.setItem('nsg_hr_db', JSON.stringify(newDb));
    setDb(newDb);
  };

  // ── Helpers defined BEFORE useEffect so they are in scope ──────────────────

  // Map a backend role string to the URL segment used in hash routing
  const roleToRoute = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'ceo' || r === 'admin') return 'CEO';
    if (r === 'hr') return 'HR';
    if (r === 'tl') return 'TL';
    return 'Employee';
  };

  // Hash Parser helper
  const parseHash = () => {
    const hash = window.location.hash;
    if (!hash) return { role: 'CEO', tab: 'dashboard', queryParams: new URLSearchParams() };
    const match = hash.match(/^#\/([^\/]+)\/([^\/?]+)(?:\?(.+))?$/);
    if (match) {
      const role = match[1];
      const tab = match[2];
      const query = match[3] || '';
      const params = new URLSearchParams(query);
      return { role, tab, queryParams: params };
    }
    return { role: 'CEO', tab: 'dashboard', queryParams: new URLSearchParams() };
  };

  const navigateTo = (role, tab, paramsObj = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(paramsObj).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    window.location.hash = `#/${role}/${tab}` + (queryString ? `?${queryString}` : '');
  };

  // ── Auth effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoadingUser(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Session expired');

        const profile = await response.json();
        setUser(profile);

        // Navigate to the correct portal for this user's role
        navigateTo(roleToRoute(profile.role), 'dashboard');
      } catch (err) {
        localStorage.removeItem('nsg_jwt_token');
        setToken('');
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLoginSuccess = (newToken) => {
    localStorage.setItem('nsg_jwt_token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('nsg_jwt_token');
    setToken('');
    setUser(null);
    window.location.hash = '';
  };

  // ── Hash-based routing ──────────────────────────────────────────────────────
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Authorization check for routes — compare both sides as lowercase
  const routeRoleLower = route.role.toLowerCase();
  const userRoleLower  = (user?.role || '').toLowerCase();

  const isAuthorized = (() => {
    if (!user) return true; // not logged in yet, let the early return handle it
    if (userRoleLower === 'admin' || userRoleLower === 'ceo') return true;
    if (userRoleLower === 'hr')  return ['hr', 'tl', 'employee'].includes(routeRoleLower);
    if (userRoleLower === 'tl')  return ['tl', 'employee'].includes(routeRoleLower);
    return routeRoleLower === 'employee';
  })();

  // Redirect unauthorized route attempts AFTER render via effect to avoid side-effects during render
  useEffect(() => {
    if (user && !isAuthorized) {
      navigateTo(roleToRoute(user.role), 'dashboard');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.role, user, isAuthorized]);

  const renderActiveComponent = () => {
    const props = {
      activeTab: route.tab,
      queryParams: route.queryParams,
      db: db,
      onUpdateDb: updateDb,
      currentUser: user,
      setQueryParams: (paramsObj) => {
        const currentParams = {};
        for (const [key, value] of route.queryParams.entries()) {
          currentParams[key] = value;
        }
        navigateTo(route.role, route.tab, { ...currentParams, ...paramsObj });
      }
    };

    // Normalise to uppercase for matching
    switch (route.role.toUpperCase()) {
      case 'CEO':      return <Ceo {...props} />;
      case 'HR':       return <Hr {...props} />;
      case 'TL':       return <Tl {...props} />;
      case 'EMPLOYEE': return <Employee {...props} navigateTo={navigateTo} />;
      default:         return <Employee {...props} navigateTo={navigateTo} />;
    }
  };

  if (loadingUser) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#fff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Validating Credentials...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Connecting to secure API server.</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // While unauthorized, render nothing (the redirect effect will fire)
  if (!isAuthorized) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="app-container">
          {/* Sidebar Panel */}
          <Sidebar 
            activeRole={route.role} 
            activeTab={route.tab} 
            setActiveTab={(tab) => navigateTo(route.role, tab)} 
          />

          {/* Main Panel Viewport */}
          <main className="main-content">
            {/* Header Navigation */}
            <Navbar 
              activeRole={route.role} 
              setActiveRole={(role) => navigateTo(role, 'dashboard')} 
              navigateTo={navigateTo}
              hrDb={db}
              currentUser={user}
              onLogout={handleLogout}
            />

            {/* Dynamic Inner Layout Body */}
            {renderActiveComponent()}
          </main>
        </div>
        <style>{`
          @keyframes toastSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </ToastProvider>
    </ThemeProvider>
  );
}

