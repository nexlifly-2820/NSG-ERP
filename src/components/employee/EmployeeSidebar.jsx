import React from 'react';
import { 
  LayoutDashboard, CreditCard, User, UserMinus, 
  Briefcase, MessageSquare,
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
  const hideTasks = userRole === 'hr' || userRole === 'ceo' || userRole === 'team lead' || userRole === 'tl';
  const hideForHR = userRole === 'hr';
  const hideForTL = userRole === 'team lead' || userRole === 'tl';
  const hideHolidaysExpensesPerfMsg = hideForHR || hideForTL;
  const hideTimesheet = hideForHR;

  return (
    <div 
      className={`nav-group ${hideHolidaysExpensesPerfMsg ? 'emp-sidebar-spaced' : ''} ${hideForHR ? 'hr-specific-spacing' : ''}`}
      style={hideForHR ? { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' } : (hideHolidaysExpensesPerfMsg ? { display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' } : {})}
    >
      {hideHolidaysExpensesPerfMsg && (
        <style>
          {`
            .emp-sidebar-spaced .nav-link {
              padding: 12px 14px !important;
              font-size: 14.5px !important;
            }
            .hr-specific-spacing .nav-link {
              padding: 14px 14px !important;
              font-size: 14.5px !important;
            }
            .emp-sidebar-spaced .nav-group-title {
              margin-bottom: 10px !important;
            }
            .hr-specific-spacing .nav-group-title {
              margin-bottom: 12px !important;
            }
          `}
        </style>
      )}
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
      {!hideTimesheet && (
        <button
          className={`nav-link ${isTimesheetActive ? 'active' : ''}`}
          onClick={() => setActiveTab('timesheet')}
          style={isTimesheetActive ? activeStyle : {}}
        >
          <Clock size={18} />
          <span>Timesheet</span>
        </button>
      )}

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
      {!hideHolidaysExpensesPerfMsg && (
        <button
          className={`nav-link ${isHolidaysActive ? 'active' : ''}`}
          onClick={() => setActiveTab('holidays')}
          style={isHolidaysActive ? activeStyle : {}}
        >
          <Calendar size={18} />
          <span>Holidays</span>
        </button>
      )}

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
      {!hideHolidaysExpensesPerfMsg && (
        <button
          className={`nav-link ${isExpensesActive ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
          style={isExpensesActive ? activeStyle : {}}
        >
          <CreditCard size={18} />
          <span>Claim Expenses</span>
        </button>
      )}

      {/* Performance Tab */}
      {!hideHolidaysExpensesPerfMsg && (
        <button
          className={`nav-link ${isPerformanceActive ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
          style={isPerformanceActive ? activeStyle : {}}
        >
          <Target size={18} />
          <span>Performance</span>
        </button>
      )}

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
      {!hideHolidaysExpensesPerfMsg && (
        <button
          className={`nav-link ${isMessagingActive ? 'active' : ''}`}
          onClick={() => setActiveTab('messaging')}
          style={isMessagingActive ? activeStyle : {}}
        >
          <MessageSquare size={18} />
          <span>Messaging</span>
        </button>
      )}
    </div>
  );
}
