import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Ceo from './components/ceo/Ceo';
import Hr from './components/hr/Hr';
import Tl from './components/tl/Tl';
import Employee from './components/employee/Employee';
import './index.css';

export default function App() {
  // Hash Parser helper
  const parseHash = () => {
    const hash = window.location.hash || '#/CEO/dashboard';
    const match = hash.match(/^#\/([^\/]+)\/([^\/?]+)(?:\?(.+))?$/);
    if (match) {
      const role = match[1];
      const tab = match[2];
      const query = match[3] || '';
      const params = new URLSearchParams(query);
      return { role, tab, queryParams: params };
    }
    return { role: 'CEO', tab: 'dashboard', queryParams: new URLSearchParams() };
  };

  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(parseHash());
    };
    
    window.addEventListener('hashchange', handleHashChange);
    
    // Set initial hash if not set
    if (!window.location.hash) {
      window.location.hash = '#/CEO/dashboard';
    }
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (role, tab, paramsObj = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(paramsObj).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val));
      }
    });
    const queryString = searchParams.toString();
    window.location.hash = `#/${role}/${tab}` + (queryString ? `?${queryString}` : '');
  };

  const renderActiveComponent = () => {
    const props = {
      activeTab: route.tab,
      queryParams: route.queryParams,
      setQueryParams: (paramsObj) => {
        // Merge with current query parameters
        const currentParams = {};
        for (const [key, value] of route.queryParams.entries()) {
          currentParams[key] = value;
        }
        navigateTo(route.role, route.tab, { ...currentParams, ...paramsObj });
      }
    };

    switch (route.role) {
      case 'CEO':
        return <Ceo {...props} />;
      case 'HR':
        return <Hr {...props} />;
      case 'TL':
        return <Tl {...props} />;
      case 'Employee':
        return <Employee {...props} />;
      default:
        return <Ceo {...props} />;
    }
  };

  // Read live HR db for notification computation
  const hrDbRaw = (() => { try { return JSON.parse(localStorage.getItem('nsg_hr_db') || '{}'); } catch { return {}; } })();

  return (
    <div className="app-container">
      {/* Sidebar Panel */}
      <Sidebar 
        activeRole={route.role} 
        activeTab={route.tab} 
        setActiveTab={(tab) => navigateTo(route.role, tab)} 
      />

      {/* Main Panel Viewport */}
      <main className="main-content">
        {/* Header Navigation */}
        <Navbar 
          activeRole={route.role} 
          setActiveRole={(role) => navigateTo(role, 'dashboard')} 
          navigateTo={navigateTo}
          hrDb={hrDbRaw}
        />

        {/* Dynamic Inner Layout Body */}
        {renderActiveComponent()}
      </main>
    </div>
  );
}

