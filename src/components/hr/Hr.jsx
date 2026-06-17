import React, { useState, useEffect, lazy, Suspense } from 'react';
import ErrorBoundary from '../tl/ErrorBoundary';

const HrDashboardView = lazy(() => import('./modules/dashboard/HrDashboardView').then(m => ({ default: m.HrDashboardView })));
const RecruitmentView = lazy(() => import('./modules/recruitment/RecruitmentView').then(m => ({ default: m.RecruitmentView })));
const EmployeeRegistryView = lazy(() => import('./modules/employees/EmployeeRegistryView').then(m => ({ default: m.EmployeeRegistryView })));
const OnboardingView = lazy(() => import('./modules/onboarding/OnboardingView').then(m => ({ default: m.OnboardingView })));
const AttendanceRegisterView = lazy(() => import('./modules/attendance/AttendanceRegisterView').then(m => ({ default: m.AttendanceRegisterView })));
const TimesheetExceptionsView = lazy(() => import('./modules/timesheets/TimesheetExceptionsView').then(m => ({ default: m.TimesheetExceptionsView })));
const LeaveManagementView = lazy(() => import('./modules/leave/LeaveManagementView').then(m => ({ default: m.LeaveManagementView })));

const AppraisalsView = lazy(() => import('./modules/appraisals/AppraisalsView').then(m => ({ default: m.AppraisalsView })));
const ExitFnFView = lazy(() => import('./modules/exits/ExitFnFView').then(m => ({ default: m.ExitFnFView })));
const LearningLndView = lazy(() => import('./modules/lnd/LearningLndView').then(m => ({ default: m.LearningLndView })));
const ReportsEngineView = lazy(() => import('./modules/reports/ReportsEngineView').then(m => ({ default: m.ReportsEngineView })));
const HrSettingsView = lazy(() => import('./modules/settings/HrSettingsView').then(m => ({ default: m.HrSettingsView })));
const HrMessagingView = lazy(() => import('./modules/messaging/HrMessagingView').then(m => ({ default: m.HrMessagingView })));
const HolidayCalendar = lazy(() => import('../common/HolidayCalendar'));
const OrgChart = lazy(() => import('../employee/OrgChart'));

export default function Hr({ activeTab, queryParams, setQueryParams, currentUser }) {

  const fallbackLoader = (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
      <div className="animate-spin" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '40px', height: '40px' }}></div>
    </div>
  );

  const renderTabContent = () => {
    const props = { queryParams, setQueryParams, currentUser };
    switch (activeTab) {
      case 'dashboard':
        return <ErrorBoundary><HrDashboardView {...props} /></ErrorBoundary>;
      case 'recruitment':
        return <ErrorBoundary><RecruitmentView {...props} /></ErrorBoundary>;
      case 'employees':
        return <ErrorBoundary><EmployeeRegistryView {...props} /></ErrorBoundary>;
      case 'onboarding':
        return <ErrorBoundary><OnboardingView {...props} /></ErrorBoundary>;
      case 'attendance':
        return <ErrorBoundary><AttendanceRegisterView {...props} /></ErrorBoundary>;
      case 'timesheets':
        return <ErrorBoundary><TimesheetExceptionsView {...props} /></ErrorBoundary>;
      case 'leave':
        return <ErrorBoundary><LeaveManagementView {...props} /></ErrorBoundary>;

      case 'appraisals':
        return <ErrorBoundary><AppraisalsView {...props} /></ErrorBoundary>;
      case 'exits':
        return <ErrorBoundary><ExitFnFView {...props} /></ErrorBoundary>;
      case 'lnd':
        return <ErrorBoundary><LearningLndView {...props} /></ErrorBoundary>;
      case 'reports':
        return <ErrorBoundary><ReportsEngineView {...props} /></ErrorBoundary>;
      case 'settings':
        return <ErrorBoundary><HrSettingsView {...props} /></ErrorBoundary>;
      case 'messaging':
        return <ErrorBoundary><HrMessagingView {...props} /></ErrorBoundary>;
      case 'holidays':
        return <ErrorBoundary><HolidayCalendar /></ErrorBoundary>;
      case 'orgChart':
        return <ErrorBoundary><OrgChart {...props} /></ErrorBoundary>;
      default:
        return <ErrorBoundary><HrDashboardView {...props} /></ErrorBoundary>;
    }
  };

  return (
    <div className="component-container">
      <Suspense fallback={fallbackLoader}>
        {renderTabContent()}
      </Suspense>
    </div>
  );
}
