import React, { lazy, Suspense } from 'react';
import ErrorBoundary from '../tl/ErrorBoundary';
import './CEO.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Finance = lazy(() => import('./pages/Finance'));
const People = lazy(() => import('./pages/People'));
const Projects = lazy(() => import('./pages/Projects'));
const Approvals = lazy(() => import('./pages/Approvals'));
const CompanySetup = lazy(() => import('./pages/CompanySetup'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Announcements = lazy(() => import('./pages/Announcements'));
const StrategyOKRs = lazy(() => import('./pages/StrategyOKRs'));
const Messaging = lazy(() => import('./pages/Messaging'));
const Vendors = lazy(() => import('./pages/Vendors'));
const DocumentVault = lazy(() => import('./pages/DocumentVault'));
const CeoPayroll = lazy(() => import('./pages/Payroll/CeoPayroll'));
const OrgChart = lazy(() => import('../employee/OrgChart'));

export default function Ceo({ activeTab, queryParams, setQueryParams, currentUser }) {
  
  const fallbackLoader = (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
      <div className="animate-spin" style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', width: '40px', height: '40px' }}></div>
    </div>
  );

  const renderContent = () => {
    const props = { queryParams, setQueryParams, currentUser };
    switch (activeTab) {
      case 'dashboard': return <ErrorBoundary><Dashboard {...props} /></ErrorBoundary>;
      case 'companySetup': return <ErrorBoundary><CompanySetup {...props} /></ErrorBoundary>;
      case 'finance': return <ErrorBoundary><Finance {...props} /></ErrorBoundary>;
      case 'approvals': return <ErrorBoundary><Approvals {...props} /></ErrorBoundary>;
      case 'projects': return <ErrorBoundary><Projects {...props} /></ErrorBoundary>;
      case 'reports': return <ErrorBoundary><Reports {...props} /></ErrorBoundary>;
      case 'settings': return <ErrorBoundary><Settings {...props} /></ErrorBoundary>;
      case 'announcements': return <ErrorBoundary><Announcements {...props} /></ErrorBoundary>;
      case 'strategyOKRs': return <ErrorBoundary><StrategyOKRs {...props} /></ErrorBoundary>;
      case 'people': return <ErrorBoundary><People {...props} /></ErrorBoundary>;
      case 'messaging': return <ErrorBoundary><Messaging {...props} /></ErrorBoundary>;
      case 'vendors': return <ErrorBoundary><Vendors {...props} /></ErrorBoundary>;
      case 'vault': return <ErrorBoundary><DocumentVault {...props} /></ErrorBoundary>;
      case 'payroll': return <ErrorBoundary><CeoPayroll {...props} /></ErrorBoundary>;
      case 'orgChart': return <ErrorBoundary><OrgChart {...props} /></ErrorBoundary>;
      default: return <ErrorBoundary><Dashboard {...props} /></ErrorBoundary>;
    }
  };

  return (
    <div className="ceo-module-container">
      <Suspense fallback={fallbackLoader}>
        {renderContent()}
      </Suspense>
    </div>
  );
}
