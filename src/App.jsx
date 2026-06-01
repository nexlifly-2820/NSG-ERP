import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Ceo from './components/ceo/Ceo';
import Hr from './components/hr/Hr';
import Tl from './components/tl/Tl';
import Employee from './components/employee/Employee';
import './index.css';

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

export default function App() {
  const loadDbSync = () => {
    const localData = localStorage.getItem('nsg_hr_db');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (!parsed.attendanceCorrections) parsed.attendanceCorrections = [];
        if (!parsed.resignations) parsed.resignations = INITIAL_RESIGNATIONS;
        
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
      resignations: INITIAL_RESIGNATIONS
    };
    localStorage.setItem('nsg_hr_db', JSON.stringify(seed));
    return seed;
  };

  const [db, setDb] = useState(() => loadDbSync());

  const updateDb = (newDb) => {
    localStorage.setItem('nsg_hr_db', JSON.stringify(newDb));
    setDb(newDb);
  };

  // Hash Parser helper
  const parseHash = () => {
    const hash = window.location.hash || '#/CEO/dashboard';
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

  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial hash if not set
    if (!window.location.hash) {
      window.location.hash = '#/CEO/dashboard';
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

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

  const renderActiveComponent = () => {
    const props = {
      activeTab: route.tab,
      queryParams: route.queryParams,
      db: db,
      onUpdateDb: updateDb,
      setQueryParams: (paramsObj) => {
        // Merge with current query parameters
        const currentParams = {};
        for (const [key, value] of route.queryParams.entries()) {
          currentParams[key] = value;
        }
        navigateTo(route.role, route.tab, { ...currentParams, ...paramsObj });
      }
    };

    switch (route.role) {
      case 'CEO':
        return <Ceo {...props} />;
      case 'HR':
        return <Hr {...props} />;
      case 'TL':
        return <Tl {...props} />;
      case 'Employee':
        return <Employee {...props} />;
      default:
        return <Ceo {...props} />;
    }
  };

  return (
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
        />

        {/* Dynamic Inner Layout Body */}
        {renderActiveComponent()}
      </main>
    </div>
  );
}

