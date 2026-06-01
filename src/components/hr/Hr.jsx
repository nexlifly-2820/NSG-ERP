import React, { useState, useEffect } from 'react';
import {
  INITIAL_CANDIDATES, INITIAL_EMPLOYEES, INITIAL_JOB_HISTORY,
  INITIAL_DISCIPLINARY_TICKETS, INITIAL_PIPS, INITIAL_ATTENDANCE_LOGS,
  INITIAL_TIMESHEET_EXCEPTIONS, INITIAL_LEAVE_BALANCES, INITIAL_LEAVE_REQUESTS,
  INITIAL_PAYROLL_RUNS, INITIAL_PAYSLIPS, INITIAL_LOANS,
  INITIAL_EXPENSE_CLAIMS, INITIAL_TDS_DECLARATIONS, INITIAL_TRAINING_TRACKS,
  INITIAL_TRAINING_PROGRESS, INITIAL_CHAT_ROOMS, INITIAL_AUDIT_LOGS
} from './mockData';

import { HrDashboardView } from './modules/dashboard/HrDashboardView';
import { RecruitmentView } from './modules/recruitment/RecruitmentView';
import { EmployeeRegistryView } from './modules/employees/EmployeeRegistryView';
import { OnboardingView } from './modules/onboarding/OnboardingView';
import { AttendanceRegisterView } from './modules/attendance/AttendanceRegisterView';
import { TimesheetExceptionsView } from './modules/timesheets/TimesheetExceptionsView';
import { LeaveManagementView } from './modules/leave/LeaveManagementView';
import { PayrollBuilderView } from './modules/payroll/PayrollBuilderView';
import { AppraisalsView } from './modules/appraisals/AppraisalsView';
import { ExitFnFView } from './modules/exits/ExitFnFView';
import { LearningLndView } from './modules/lnd/LearningLndView';
import { ReportsEngineView } from './modules/reports/ReportsEngineView';
import { HrSettingsView } from './modules/settings/HrSettingsView';
import { HrMessagingView } from './modules/messaging/HrMessagingView';

// Extended Seed Data not present in mockData.js to prevent undefined issues
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

export default function Hr({ activeTab, queryParams, setQueryParams }) {
  const [db, setDb] = useState(null);

  // Initialize DB from LocalStorage or seed defaults
  useEffect(() => {
    const localData = localStorage.getItem('nsg_hr_db');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        // Fallback for custom fields in case they aren't seeded in an older storage version
        if (!parsed.attendanceCorrections) parsed.attendanceCorrections = INITIAL_ATTENDANCE_CORRECTIONS;
        if (!parsed.resignations) parsed.resignations = INITIAL_RESIGNATIONS;
        setDb(parsed);
      } catch (e) {
        console.error("Failed to parse simulated HR DB from localStorage. Restoring seeds.", e);
        initializeSeed();
      }
    } else {
      initializeSeed();
    }
  }, []);

  const initializeSeed = () => {
    const seed = {
      candidates: INITIAL_CANDIDATES,
      employees: INITIAL_EMPLOYEES,
      jobHistory: INITIAL_JOB_HISTORY,
      disciplinaryTickets: INITIAL_DISCIPLINARY_TICKETS,
      pips: INITIAL_PIPS,
      attendanceLogs: INITIAL_ATTENDANCE_LOGS,
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
      attendanceCorrections: INITIAL_ATTENDANCE_CORRECTIONS,
      resignations: INITIAL_RESIGNATIONS
    };
    localStorage.setItem('nsg_hr_db', JSON.stringify(seed));
    setDb(seed);
  };

  const updateDb = (newDb) => {
    // Save to localStorage for persistence
    localStorage.setItem('nsg_hr_db', JSON.stringify(newDb));
    // Trigger React render
    setDb(newDb);
  };

  if (!db) {
    return (
      <div className="component-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>Loading HR command center...</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Synchronizing simulated local enterprise databases.</p>
        </div>
      </div>
    );
  }

  // Router for rendering the 17 custom-stylized HR modules
  const renderTabContent = () => {
    const props = { db, onUpdateDb: updateDb, queryParams, setQueryParams };
    switch (activeTab) {
      case 'dashboard':
        return <HrDashboardView {...props} />;
      case 'recruitment':
        return <RecruitmentView {...props} />;
      case 'employees':
        return <EmployeeRegistryView {...props} />;
      case 'onboarding':
        return <OnboardingView {...props} />;
      case 'attendance':
        return <AttendanceRegisterView {...props} />;
      case 'timesheets':
        return <TimesheetExceptionsView {...props} />;
      case 'leave':
        return <LeaveManagementView {...props} />;
      case 'payroll':
        return <PayrollBuilderView {...props} userRole="HR" />;
      case 'appraisals':
        return <AppraisalsView {...props} />;
      case 'exits':
        return <ExitFnFView {...props} />;
      case 'lnd':
        return <LearningLndView {...props} />;
      case 'reports':
        return <ReportsEngineView {...props} />;
      case 'settings':
        return <HrSettingsView {...props} />;
      case 'messaging':
        return <HrMessagingView {...props} />;
      default:
        return <HrDashboardView {...props} />;
    }
  };

  return renderTabContent();
}
