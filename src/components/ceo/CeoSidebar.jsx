import React from 'react';
import { 
  LayoutDashboard, Building, DollarSign, CheckSquare, 
  Briefcase, BarChart2, Settings, Megaphone, 
  Target, Users, MessageSquare, Box, Lock 
} from 'lucide-react';

export default function CeoSidebar({ activeTab, setActiveTab }) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'companySetup', label: 'Company Setup', icon: <Building size={18} /> },
    { id: 'finance', label: 'Finance', icon: <DollarSign size={18} /> },
    { id: 'approvals', label: 'Approvals', icon: <CheckSquare size={18} /> },
    { id: 'projects', label: 'Projects', icon: <Briefcase size={18} /> },
    { id: 'reports', label: 'Reports', icon: <BarChart2 size={18} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    { id: 'announcements', label: 'Announcements', icon: <Megaphone size={18} /> },
    { id: 'strategyOKRs', label: 'Strategy & OKRs', icon: <Target size={18} /> },
    { id: 'people', label: 'People', icon: <Users size={18} /> },
    { id: 'messaging', label: 'Messaging', icon: <MessageSquare size={18} /> },
    { id: 'vendors', label: 'Vendor Management', icon: <Box size={18} /> },
    { id: 'vault', label: 'Document Vault', icon: <Lock size={18} /> },
   
  ];

  return (
    <div className="nav-group">
      <span className="nav-group-title">CEO Modules</span>
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
            style={isActive ? { 
              color: '#f59e0b',
              borderLeftColor: '#f59e0b',
              backgroundColor: 'rgba(245, 158, 11, 0.05)' 
            } : {}}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

