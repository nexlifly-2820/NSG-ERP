import React from 'react';
import { 
  LayoutDashboard, Briefcase, Users, FileCheck, FileCheck2, CalendarDays,
  Clock, FileWarning, Calendar, CreditCard, TrendingUp, LogOut, 
  BarChart3, Sliders, MessageSquare, Network 
} from 'lucide-react';

export default function HrSidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'recruitment', label: 'Recruitment & ATS', icon: Briefcase },
    { id: 'employees', label: 'Employee Registry', icon: Users },
    { id: 'onboarding', label: 'Onboarding', icon: FileCheck },
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'timesheets', label: 'Approved Timesheets', icon: FileCheck2 },
    { id: 'leave', label: 'Leave Management', icon: Calendar },
    { id: 'orgChart', label: 'Org Chart', icon: Network },
    { id: 'appraisals', label: 'Appraisals', icon: TrendingUp },
    { id: 'exits', label: 'Exits & FnF', icon: LogOut },
    { id: 'reports', label: 'Reports Engine', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Sliders },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
    { id: 'messaging', label: 'Messaging & Meet', icon: MessageSquare },
  ];

  return (
    <div className="nav-group" style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '32px' }}>
      <span className="nav-group-title">HR Modules</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: 'calc(100vh - 240px)', overflowY: 'auto', paddingRight: '4px' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={isActive ? {
                color: '#ec4899',
                borderLeftColor: '#ec4899',
                backgroundColor: 'rgba(236, 72, 153, 0.05)'
              } : {}}
            >
              <Icon size={18} />
              <span style={{ fontSize: '13px' }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
