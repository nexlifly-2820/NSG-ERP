import React from 'react';
import { LayoutDashboard, Users, Briefcase, CheckSquare, Calendar, Clock, FileText, AlertTriangle, CheckCircle, Award, MessageSquare } from 'lucide-react';

export default function TlSidebar({ activeTab, setActiveTab }) {
  const isDashboardActive = activeTab === 'dashboard';
  const isTeamActive = activeTab === 'team';
  const isProjectsActive = activeTab === 'projects';
  const isTasksActive = activeTab === 'tasks';
  const isApprovalsActive = activeTab === 'approvals';
  const isPerformanceActive = activeTab === 'performance';
  const isAttendanceActive = activeTab === 'attendance';
  const isTimesheetsActive = activeTab === 'timesheets';
  const isEscalationsActive = activeTab === 'escalations';
  const isMessagingActive = activeTab === 'messaging';
  const isHolidaysActive = activeTab === 'holidays';

  return (
    <div className="nav-group">
      <span className="nav-group-title">TL Modules</span>
      <button
        className={`nav-link ${isDashboardActive ? 'active' : ''}`}
        onClick={() => setActiveTab('dashboard')}
        style={isDashboardActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </button>

      <button
        className={`nav-link ${isTeamActive ? 'active' : ''}`}
        onClick={() => setActiveTab('team')}
        style={isTeamActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <Users size={18} />
        <span>Team</span>
      </button>

      <button
        className={`nav-link ${isProjectsActive ? 'active' : ''}`}
        onClick={() => setActiveTab('projects')}
        style={isProjectsActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <Briefcase size={18} />
        <span>Projects</span>
      </button>

      <button
        className={`nav-link ${isTasksActive ? 'active' : ''}`}
        onClick={() => setActiveTab('tasks')}
        style={isTasksActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <CheckSquare size={18} />
        <span>Tasks</span>
      </button>

      <button
        className={`nav-link ${isApprovalsActive ? 'active' : ''}`}
        onClick={() => setActiveTab('approvals')}
        style={isApprovalsActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <CheckCircle size={18} />
        <span>Approvals</span>
      </button>

      <button
        className={`nav-link ${isPerformanceActive ? 'active' : ''}`}
        onClick={() => setActiveTab('performance')}
        style={isPerformanceActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <Award size={18} />
        <span>Performance</span>
      </button>

      <button
        className={`nav-link ${isAttendanceActive ? 'active' : ''}`}
        onClick={() => setActiveTab('attendance')}
        style={isAttendanceActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <Calendar size={18} />
        <span>Attendance</span>
      </button>

      <button
        className={`nav-link ${isHolidaysActive ? 'active' : ''}`}
        onClick={() => setActiveTab('holidays')}
        style={isHolidaysActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <Calendar size={18} />
        <span>Holidays</span>
      </button>

      <button
        className={`nav-link ${isTimesheetsActive ? 'active' : ''}`}
        onClick={() => setActiveTab('timesheets')}
        style={isTimesheetsActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <Clock size={18} />
        <span>Timesheets</span>
      </button>

      <button
        className={`nav-link ${isEscalationsActive ? 'active' : ''}`}
        onClick={() => setActiveTab('escalations')}
        style={isEscalationsActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <AlertTriangle size={18} />
        <span>Escalations</span>
      </button>

      <button
        className={`nav-link ${isMessagingActive ? 'active' : ''}`}
        onClick={() => setActiveTab('messaging')}
        style={isMessagingActive ? { 
          color: '#3b82f6',
          borderLeftColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.05)' 
        } : {}}
      >
        <MessageSquare size={18} />
        <span>Messaging & Meet</span>
      </button>
    </div>
  );
}

