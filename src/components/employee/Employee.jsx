import React, { Suspense, lazy } from 'react';
import ErrorBoundary from '../common/ErrorBoundary';

const Expenses = lazy(() => import('./Expenses'));
const Profile = lazy(() => import('./Profile'));
const Resignation = lazy(() => import('./Resignation'));
const Assets = lazy(() => import('./Assets'));
const Messaging = lazy(() => import('./Messaging'));
const Attendance = lazy(() => import('./Attendance'));
const Timesheet = lazy(() => import('./Timesheet'));
const Tasks = lazy(() => import('./Tasks'));
const Leave = lazy(() => import('./Leave'));
const Payroll = lazy(() => import('./Payroll'));
const Learning = lazy(() => import('./Learning'));
const EmployeeDashboard = lazy(() => import('./EmployeeDashboard'));
const Performance = lazy(() => import('./Performance'));
const HolidayCalendar = lazy(() => import('../common/HolidayCalendar'));

// A simple fallback loader
const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', padding: '20px' }}>
    <span>Loading...</span>
  </div>
);

export default function Employee({ activeTab, navigateTo, currentUser }) {
  // Helper: switch to an employee tab
  const setActiveTab = (tab) => {
    if (navigateTo) navigateTo('Employee', tab);
    else window.location.hash = `#/Employee/${tab}`;
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EmployeeDashboard setActiveTab={setActiveTab} currentUser={currentUser} />;
      case 'attendance':
        return <Attendance currentUser={currentUser} />;
      case 'timesheet':
        return <Timesheet currentUser={currentUser} />;
      case 'tasks':
        return <Tasks currentUser={currentUser} />;
      case 'leave':
        return <Leave currentUser={currentUser} />;
      case 'payroll':
        return <Payroll currentUser={currentUser} />;
      case 'expenses':
        return <Expenses currentUser={currentUser} />;
      case 'profile':
        return <Profile currentUser={currentUser} />;
      case 'resignation':
        return <Resignation currentUser={currentUser} />;
      case 'assets':
        return <Assets currentUser={currentUser} />;
      case 'messaging':
        return <Messaging currentUser={currentUser} />;
      case 'learning':
        return <Learning currentUser={currentUser} />;
      case 'performance':
        return <Performance currentUser={currentUser} />;
      case 'holidays':
        return <HolidayCalendar />;
      default:
        // Fallback: show dashboard
        return <EmployeeDashboard setActiveTab={setActiveTab} currentUser={currentUser} />;
    }
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        {renderContent()}
      </Suspense>
    </ErrorBoundary>
  );
}