import React from 'react';
import {
  Shield, Users, Award, Briefcase,
  Settings, LogOut
} from 'lucide-react';
import { useCompany } from '../common/CompanyContext';
import CeoSidebar from '../ceo/CeoSidebar';
import HrSidebar from '../hr/HrSidebar';
import TlSidebar from '../tl/TlSidebar';
import EmployeeSidebar from '../employee/EmployeeSidebar';

export default function Sidebar({ activeRole, activeTab, setActiveTab, currentUser, onLogout, isOpen, onClose }) {
  const { companyName, companyLogo } = useCompany();

  const currentRoleColor = {
    CEO: '#f59e0b',
    HR: '#ec4899',
    TL: '#3b82f6',
    Employee: '#10b981',
  }[activeRole];

  const roleLabel = {
    CEO: 'CEO Suite',
    HR: 'HR Portal',
    TL: 'Team Lead',
    Employee: 'Staff Portal',
  }[activeRole];

  const roleLogoColor = {
    CEO: 'rgba(245, 158, 11, 0.1)',
    HR: 'rgba(236, 72, 153, 0.1)',
    TL: 'rgba(59, 130, 246, 0.1)',
    Employee: 'rgba(16, 185, 129, 0.1)',
  }[activeRole];

  const roleIcon = {
    CEO: Shield,
    HR: Users,
    TL: Award,
    Employee: Briefcase,
  }[activeRole];

  const RoleIconComponent = roleIcon;

  const handleLogout = () => {
    window.location.hash = '#/login';
    window.location.reload();
  };

  return (
    <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '8px', marginBottom: '24px' }}>
        <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&background=random`; }} src={companyLogo} alt={companyName} style={{ width: '100%', height: '70px', objectFit: 'contain', objectPosition: 'left center' }} />
        <span style={{ color: currentRoleColor, fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', paddingLeft: '4px', marginTop: '2px' }}>{roleLabel}</span>
      </div>

      {/* Main Navigation */}
      <nav className="sidebar-nav">
        {/* Dynamic Folder-Specific Sidebars */}
        {activeRole === 'CEO' && <CeoSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
        {activeRole === 'HR' && <HrSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
        {activeRole === 'TL' && <TlSidebar activeTab={activeTab} setActiveTab={setActiveTab} />}
        {activeRole === 'Employee' && <EmployeeSidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} />}
      </nav>

      {/* Footer Settings & Actions */}
      <div className="sidebar-footer">

        <button className="nav-link footer-link logout" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}



