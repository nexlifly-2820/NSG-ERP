import React from 'react';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import People from './pages/People';
import Projects from './pages/Projects';
import Approvals from './pages/Approvals';
import CompanySetup from './pages/CompanySetup';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Announcements from './pages/Announcements';
import StrategyOKRs from './pages/StrategyOKRs';
import Messaging from './pages/Messaging';
import Vendors from './pages/Vendors';
import DocumentVault from './pages/DocumentVault';
import CeoPayroll from './pages/Payroll/CeoPayroll';
import './CEO.css';

export default function Ceo({ activeTab, queryParams, setQueryParams, currentUser }) {
  const renderContent = () => {
    const props = { queryParams, setQueryParams, currentUser };
    switch (activeTab) {
      case 'dashboard': return <Dashboard {...props} />;
      case 'companySetup': return <CompanySetup {...props} />;
      case 'finance': return <Finance {...props} />;
      case 'approvals': return <Approvals {...props} />;
      case 'projects': return <Projects {...props} />;
      case 'reports': return <Reports {...props} />;
      case 'settings': return <Settings {...props} />;
      case 'announcements': return <Announcements {...props} />;
      case 'strategyOKRs': return <StrategyOKRs {...props} />;
      case 'people': return <People {...props} />;
      case 'messaging': return <Messaging {...props} />;
      case 'vendors': return <Vendors {...props} />;
      case 'vault': return <DocumentVault {...props} />;
      case 'payroll': return <CeoPayroll {...props} />;
      default: return <Dashboard {...props} />;
    }
  };

  return (
    <div className="ceo-module-container">
      {renderContent()}
    </div>
  );
}
