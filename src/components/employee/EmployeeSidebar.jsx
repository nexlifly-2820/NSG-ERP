import React from 'react';
import { 
  LayoutDashboard, CreditCard, User, UserMinus, 
  HelpCircle, Briefcase, MessageSquare,
  Calendar, Clock, CheckSquare, Coins, Target
} from 'lucide-react';

export default function EmployeeSidebar({ activeTab, setActiveTab, currentUser }) {
  const isDashboardActive = activeTab === 'dashboard';
  const isAttendanceActive = activeTab === 'attendance';
  const isTimesheetActive = activeTab === 'timesheet';
  const isTasksActive = activeTab === 'tasks';
  const isLeaveActive = activeTab === 'leave';
  const isPayrollActive = activeTab === 'payroll';
  const isExpensesActive = activeTab === 'expenses';
  const isProfileActive = activeTab === 'profile';
  const isResignationActive = activeTab === 'resignation';
  const isHelpActive = activeTab === 'help';
  const isAssetsActive = activeTab === 'assets';
  const isMessagingActive = activeTab === 'messaging';
  const isPerformanceActive = activeTab === 'performance';
  const isHolidaysActive = activeTab === 'holidays';

  const activeStyle = {
    color: '#10b981',
    borderLeftColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)'
  };

  const userRole = (currentUser?.role || '').toLowerCase();
  const hideTasks = userRole === 'hr' || userRole === 'ceo';

  return (
    <div className="nav-group">
      <span className="nav-group-title">Staff Modules</span>
      
      {/* Dashboard Tab */}
      <button
        className={`nav-link ${isDashboardActive ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
        style={isDashboardActive ? activeStyle : {}}
      >
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </button>

      {/* Attendance Tab */}
      <button
        className={`nav-link ${isAttendanceActive ? 'active' : ''}`}
        onClick={() => setActiveTab('attendance')}
        style={isAttendanceActive ? activeStyle : {}}
      >
        <Calendar size={18} />
        <span>Attendance</span>
      </button>

      {/* Timesheet Tab */}
      <button
        className={`nav-link ${isTimesheetActive ? 'active' : ''}`}
        onClick={() => setActiveTab('timesheet')}
        style={isTimesheetActive ? activeStyle : {}}
      >
        <Clock size={18} />
        <span>Timesheet</span>
      </button>

      {/* Tasks Tab */}
      {!hideTasks && (
        <button
          className={`nav-link ${isTasksActive ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
          style={isTasksActive ? activeStyle : {}}
        >
          <CheckSquare size={18} />
          <span>Tasks</span>
        </button>
      )}

      {/* Leave Tab */}
      <button
        className={`nav-link ${isLeaveActive ? 'active' : ''}`}
        onClick={() => setActiveTab('leave')}
        style={isLeaveActive ? activeStyle : {}}
      >
        <Calendar size={18} />
        <span>Leave</span>
      </button>

      {/* Holidays Tab */}
      <button
        className={`nav-link ${isHolidaysActive ? 'active' : ''}`}
        onClick={() => setActiveTab('holidays')}
        style={isHolidaysActive ? activeStyle : {}}
      >
        <Calendar size={18} />
        <span>Holidays</span>
      </button>

      {/* Payroll Tab */}
      <button
        className={`nav-link ${isPayrollActive ? 'active' : ''}`}
        onClick={() => setActiveTab('payroll')}
        style={isPayrollActive ? activeStyle : {}}
      >
        <Coins size={18} />
        <span>Payroll</span>
      </button>

      {/* Expenses Tab */}
      <button
        className={`nav-link ${isExpensesActive ? 'active' : ''}`}
        onClick={() => setActiveTab('expenses')}
        style={isExpensesActive ? activeStyle : {}}
      >
        <CreditCard size={18} />
        <span>Claim Expenses</span>
      </button>

      {/* Performance Tab */}
      <button
        className={`nav-link ${isPerformanceActive ? 'active' : ''}`}
        onClick={() => setActiveTab('performance')}
        style={isPerformanceActive ? activeStyle : {}}
      >
        <Target size={18} />
        <span>Performance</span>
      </button>

      {/* Profile Tab */}
      <button
        className={`nav-link ${isProfileActive ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
        style={isProfileActive ? activeStyle : {}}
      >
        <User size={18} />
        <span>Profile</span>
      </button>

      {/* Resignation Tab */}
      <button
        className={`nav-link ${isResignationActive ? 'active' : ''}`}
        onClick={() => setActiveTab('resignation')}
        style={isResignationActive ? activeStyle : {}}
      >
        <UserMinus size={18} />
        <span>Resignation</span>
      </button>

      {/* Help Tab */}
      <button
        className={`nav-link ${isHelpActive ? 'active' : ''}`}
        onClick={() => setActiveTab('help')}
        style={isHelpActive ? activeStyle : {}}
      >
        <HelpCircle size={18} />
        <span>Help</span>
      </button>

      {/* Asset Requests Tab */}
      <button
        className={`nav-link ${isAssetsActive ? 'active' : ''}`}
        onClick={() => setActiveTab('assets')}
        style={isAssetsActive ? activeStyle : {}}
      >
        <Briefcase size={18} />
        <span>Asset Requests</span>
      </button>

      {/* Messaging Tab */}
      <button
        className={`nav-link ${isMessagingActive ? 'active' : ''}`}
        onClick={() => setActiveTab('messaging')}
        style={isMessagingActive ? activeStyle : {}}
      >
        <MessageSquare size={18} />
        <span>Messaging</span>
      </button>
    </div>
  );
}
