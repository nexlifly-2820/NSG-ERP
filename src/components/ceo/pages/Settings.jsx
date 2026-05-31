import React, { useState } from 'react';
import { 
  ShieldAlert, History, Bell, Settings as SettingsIcon, Users, 
  Search, Download, CheckCircle, Save
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const SETTINGS_CATEGORIES = [
  { id: 'rbac', label: 'RBAC Permission Matrix', icon: ShieldAlert },
  { id: 'audit', label: 'System Audit Logs', icon: History },
  { id: 'notif', label: 'Notification Rules', icon: Bell },
  { id: 'config', label: 'System Configuration', icon: SettingsIcon },
  { id: 'auditors', label: 'External Auditors', icon: Users }
];

const mockAuditLogs = [
  { id: 1, timestamp: "2025-05-31 10:15:22", user: "HR Admin (Priya)", action: "UPDATED_SALARY", module: "Payroll", details: "Changed Basic for EMP-104 from ₹45000 to ₹50000" },
  { id: 2, timestamp: "2025-05-31 09:42:10", user: "System", action: "AUTO_ESCALATION", module: "Approvals", details: "Escalated Capex Request A-102 to CEO" },
  { id: 3, timestamp: "2025-05-30 18:20:05", user: "CEO (Vivek)", action: "CHANGED_RBAC", module: "Settings", details: "Granted 'View Salary' to 'Team Lead' role" },
  { id: 4, timestamp: "2025-05-30 14:10:00", user: "Manager (David)", action: "APPROVED_LEAVE", module: "People", details: "Approved Sick Leave for EMP-221" },
  { id: 5, timestamp: "2025-05-30 11:05:44", user: "Finance (Sarah)", action: "BUDGET_REJECTED", module: "Finance", details: "Rejected Q3 Ad Spend for Marketing" }
];

const ROLES = ['CEO', 'HR Manager', 'Finance Manager', 'Team Lead', 'Employee'];
const MODULES = ['View Salary', 'Run Payroll', 'Approve Leaves', 'Export Data', 'View Audit Logs'];

// Initial matrix state
const initialRbac = {
  'View Salary': { 'CEO': true, 'HR Manager': true, 'Finance Manager': true, 'Team Lead': false, 'Employee': false },
  'Run Payroll': { 'CEO': false, 'HR Manager': true, 'Finance Manager': false, 'Team Lead': false, 'Employee': false },
  'Approve Leaves': { 'CEO': true, 'HR Manager': true, 'Finance Manager': false, 'Team Lead': true, 'Employee': false },
  'Export Data': { 'CEO': true, 'HR Manager': true, 'Finance Manager': true, 'Team Lead': false, 'Employee': false },
  'View Audit Logs': { 'CEO': true, 'HR Manager': false, 'Finance Manager': false, 'Team Lead': false, 'Employee': false },
};

// ==========================================
// COMPONENT
// ==========================================
export default function Settings() {
  const [activeCategory, setActiveCategory] = useState('audit');
  
  // RBAC State
  const [rbacMatrix, setRbacMatrix] = useState(initialRbac);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const togglePermission = (module, role) => {
    setRbacMatrix(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [role]: !prev[module][role]
      }
    }));
    setHasUnsavedChanges(true);
  };

  const saveRbac = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setHasUnsavedChanges(false);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">System & Security Settings</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Enterprise access controls, audit logs, and global parameters.</p>
      </div>

      {/* CSS GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gap: '24px',
        flex: 1
      }}>
        
        {/* NAV SIDEBAR */}
        <div className="ceo-command-panel" style={{ padding: '12px 0' }}>
          {SETTINGS_CATEGORIES.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                background: activeCategory === cat.id ? 'var(--tab-active-bg)' : 'transparent',
                border: 'none',
                borderRight: activeCategory === cat.id ? '3px solid var(--tab-active-border)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: activeCategory === cat.id ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                fontWeight: activeCategory === cat.id ? 600 : 500,
                transition: 'all 0.2s ease'
              }}
            >
              <cat.icon size={18} />
              {cat.label}
            </button>
          ))}
        </div>

        {/* CONTENT PANEL */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* AUDIT LOGS */}
          {activeCategory === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><History size={18} color="var(--ceo-primary)" /> Immutable Audit Trail</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', width: '250px' }}>
                    <Search size={16} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                    <input type="text" className="ceo-form-input" placeholder="Search logs..." style={{ paddingLeft: '36px', height: '36px', padding: '8px' }} />
                  </div>
                  <button className="ceo-btn" style={{ padding: '6px 12px' }}><Download size={16} /> Export CSV</button>
                </div>
              </div>
              <div className="ceo-command-content" style={{ padding: 0, overflowY: 'auto' }}>
                <table className="ceo-erp-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>User</th>
                      <th>Action</th>
                      <th>Module</th>
                      <th>Details (Old → New)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockAuditLogs.map(log => (
                      <tr key={log.id} style={{ height: '44px' }}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--ceo-text-secondary)' }}>{log.timestamp}</span></td>
                        <td style={{ fontWeight: 600 }}>{log.user}</td>
                        <td><span className="ceo-badge neutral" style={{ background: 'var(--ceo-bg)' }}>{log.action}</span></td>
                        <td>{log.module}</td>
                        <td><span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--ceo-text-muted)' }}>{log.details}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* RBAC MATRIX */}
          {activeCategory === 'rbac' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><ShieldAlert size={18} color="var(--ceo-primary)" /> Role-Based Access Control</div>
                <button className="ceo-btn ceo-btn-primary" onClick={saveRbac} disabled={!hasUnsavedChanges || isSaving} style={{ padding: '6px 16px' }}>
                  {isSaving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
                </button>
              </div>
              <div className="ceo-command-content" style={{ padding: 0, overflowY: 'auto' }}>
                <table className="ceo-erp-table">
                  <thead>
                    <tr>
                      <th style={{ width: '250px' }}>Module / Permission</th>
                      {ROLES.map(r => <th key={r} style={{ textAlign: 'center' }}>{r}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map(mod => (
                      <tr key={mod}>
                        <td style={{ fontWeight: 600, borderRight: '1px solid var(--ceo-border)' }}>{mod}</td>
                        {ROLES.map(role => {
                          const isChecked = rbacMatrix[mod][role];
                          // CEO cannot be changed for these critical modules
                          const disabled = role === 'CEO' && (mod === 'View Salary' || mod === 'Export Data' || mod === 'View Audit Logs');
                          
                          return (
                            <td key={role} style={{ textAlign: 'center' }}>
                              <button 
                                onClick={() => !disabled && togglePermission(mod, role)}
                                disabled={disabled}
                                style={{ 
                                  width: '40px', height: '20px', borderRadius: '10px', 
                                  background: isChecked ? 'var(--ceo-success)' : 'var(--ceo-border)', 
                                  position: 'relative', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
                                  opacity: disabled ? 0.5 : 1, transition: 'background 0.2s'
                                }}
                              >
                                <div style={{ 
                                  width: '16px', height: '16px', borderRadius: '8px', 
                                  background: '#fff', position: 'absolute', top: '2px', 
                                  left: isChecked ? '22px' : '2px', transition: 'left 0.2s ease',
                                  boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                                }}></div>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* OTHER */}
          {['notif', 'config', 'auditors'].includes(activeCategory) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ceo-text-muted)' }}>
              <SettingsIcon size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <div className="ceo-typography-section-title">Coming Soon</div>
              <p className="ceo-typography-body">This settings module is part of the Phase 2 rollout.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
