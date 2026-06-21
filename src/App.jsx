import React, { useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import Ceo from './components/ceo/Ceo';
import Hr from './components/hr/Hr';
import Tl from './components/tl/Tl';
import Employee from './components/employee/Employee';
import Login from './components/auth/Login';
import './index.css';
import { ToastProvider } from './components/common/ToastProvider.jsx';
import { ThemeProvider } from './components/common/ThemeContext.jsx';

export default function App() {

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sessionTick, setSessionTick] = useState(0);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Helper to forward toast messages to the global provider (if available)
  const showToast = (msg, type = 'success') => {
    if (window.showToast) {
      window.showToast(msg, type);
    }
  };

  useEffect(() => {
    // Preserve existing unhandled rejection handling using the helper
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      const msg = event.reason?.detail || event.reason?.message || String(event.reason) || 'An unexpected database or API error occurred';
      if (msg && !msg.includes('ResizeObserver') && !msg.includes('ResizeObserver loop limit exceeded')) {
        showToast(msg, 'error');
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Removed local DB sync methods

  // ── Helpers defined BEFORE useEffect so they are in scope ──────────────────

  // Map a backend role string to the URL segment used in hash routing
  const roleToRoute = (role) => {
    const r = (role || '').toLowerCase();
    if (r === 'ceo' || r === 'admin') return 'CEO';
    if (r === 'hr') return 'HR';
    if (r === 'tl') return 'TL';
    return 'Employee';
  };

  // Hash Parser helper
  const parseHash = () => {
    const hash = window.location.hash;
    if (!hash) return { role: 'CEO', tab: 'dashboard', queryParams: new URLSearchParams() };
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

  // ── Auth effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingUser(true);
      try {
        const response = await fetch('/api/auth/me'); // cookies are auto-included globally
        if (!response.ok) throw new Error('Session expired');

        const profile = await response.json();
        setUser(profile);

        // Auto navigate if just logged in
        if (!user) {
          navigateTo(roleToRoute(profile.role), 'dashboard');
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionTick]);

  const handleLoginSuccess = () => {
    setSessionTick((prev) => prev + 1);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) { }
    setUser(null);
    window.location.hash = '';
  };

  // ── Hash-based routing ──────────────────────────────────────────────────────
  const [route, setRoute] = useState(parseHash);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Authorization check for routes — compare both sides as lowercase
  const routeRoleLower = route.role.toLowerCase();
  const userRoleLower = (user?.role || '').toLowerCase();

  const isAuthorized = (() => {
    if (!user) return true; // not logged in yet, let the early return handle it
    if (userRoleLower === 'admin' || userRoleLower === 'ceo') return true;
    if (userRoleLower === 'hr') return ['hr', 'tl', 'employee'].includes(routeRoleLower);
    if (userRoleLower === 'tl') return ['tl', 'employee'].includes(routeRoleLower);
    return routeRoleLower === 'employee';
  })();

  // Redirect unauthorized route attempts AFTER render via effect to avoid side-effects during render
  useEffect(() => {
    if (user && !isAuthorized) {
      navigateTo(roleToRoute(user.role), 'dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.role, user, isAuthorized]);

  const renderActiveComponent = () => {
    const props = {
      activeTab: route.tab,
      queryParams: route.queryParams,
      currentUser: user,
      setQueryParams: (paramsObj) => {
        const currentParams = {};
        for (const [key, value] of route.queryParams.entries()) {
          currentParams[key] = value;
        }
        navigateTo(route.role, route.tab, { ...currentParams, ...paramsObj });
      }
    };

    // Normalise to uppercase for matching
    switch (route.role.toUpperCase()) {
      case 'CEO': return <Ceo {...props} />;
      case 'HR': return <Hr {...props} />;
      case 'TL': return <Tl {...props} />;
      case 'EMPLOYEE': return <Employee {...props} navigateTo={navigateTo} />;
      default: return <Employee {...props} navigateTo={navigateTo} />;
    }
  };

  if (loadingUser) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#fff',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>Validating Credentials...</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: 0 }}>Connecting to secure API server.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // While unauthorized, render nothing (the redirect effect will fire)
  if (!isAuthorized) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        <div className="app-container">
          {/* Sidebar Panel */}
          <Sidebar
            activeRole={route.role}
            activeTab={route.tab}
            setActiveTab={(tab) => { navigateTo(route.role, tab); setIsMobileSidebarOpen(false); }}
            currentUser={user}
            onLogout={handleLogout}
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />

          {/* Mobile Sidebar Overlay */}
          <div
            className={`sidebar-overlay ${isMobileSidebarOpen ? 'open' : ''}`}
            onClick={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main Panel Viewport */}
          <main className="main-content">
            {/* Header Navigation */}
            <Navbar
              activeRole={route.role}
              setActiveRole={(role) => { navigateTo(role, 'dashboard'); setIsMobileSidebarOpen(false); }}
              navigateTo={navigateTo}
              currentUser={user}
              onLogout={handleLogout}
              onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            />

            {/* Dynamic Inner Layout Body */}
            {renderActiveComponent()}
          </main>
        </div>
        <style>{`
          @keyframes toastSlideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </ToastProvider>
    </ThemeProvider>
  );
}

