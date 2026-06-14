import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, History, Bell, Settings as SettingsIcon, Users, 
  Search, Download, CheckCircle, Save, Globe, Zap, CheckSquare, Square
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const SETTINGS_CATEGORIES = [
  { id: 'config', label: 'Global Governance', icon: Globe },
  { id: 'security', label: 'Security & Access', icon: ShieldAlert },
  { id: 'automation', label: 'AI & Automation', icon: Zap },
  { id: 'audit', label: 'Audit Logs', icon: History }
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
  const [activeCategory, setActiveCategory] = useState('config');
  
  // RBAC State
  const [rbacMatrix, setRbacMatrix] = useState(initialRbac);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Audit Logs State
  const [auditFilter, setAuditFilter] = useState('ALL');
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLogs, setAuditLogs] = useState([]);

  // Config States
  const [company_currency, setCompanyCurrency] = useState('INR');
  const [company_fy, setCompanyFy] = useState('Apr');
  const [capex_ceo_limit, setCapexCeoLimit] = useState(5000000);
  const [hiring_review_threshold, setHiringReviewThreshold] = useState('VP');
  const [authority_delegation, setAuthorityDelegation] = useState('');

  // Security States
  const [security_enforce_2fa, setSecurityEnforce2fa] = useState(true);
  const [security_data_retention, setSecurityDataRetention] = useState('7Y');

  // Automation States
  const [automation_ai_insights, setAutomationAiInsights] = useState(true);
  const [automation_attrition_modeling, setAutomationAttritionModeling] = useState(true);
  const [automation_auto_escalate, setAutomationAutoEscalate] = useState(false);

  const formatChangeDiff = (diffStr) => {
    if (!diffStr) return '';
    try {
      const parsed = JSON.parse(diffStr);
      if (parsed.config_key && parsed.new_value !== undefined) {
        return `Config '${parsed.config_key}' set to '${parsed.new_value}'`;
      }
      return JSON.stringify(parsed);
    } catch (e) {
      return diffStr;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return { date: '', time: '' };
    try {
      const dt = new Date(dateStr);
      if (isNaN(dt.getTime())) return { date: dateStr, time: '' };
      
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      
      const hh = String(dt.getHours()).padStart(2, '0');
      const min = String(dt.getMinutes()).padStart(2, '0');
      const ss = String(dt.getSeconds()).padStart(2, '0');
      
      return {
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}:${ss}`
      };
    } catch (e) {
      return { date: dateStr, time: '' };
    }
  };

  useEffect(() => {
    const fetchConfigsAndAudit = async () => {
      const token = localStorage.getItem('nsg_jwt_token');
      
      // 1. Fetch system configs
      try {
        const res = await fetch('/api/ceo-portal/configs', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const configs = await res.json();
          if (configs.company_currency) setCompanyCurrency(configs.company_currency.toUpperCase());
          if (configs.company_fy) setCompanyFy(configs.company_fy.charAt(0).toUpperCase() + configs.company_fy.slice(1));
          if (configs.capex_ceo_limit !== undefined) setCapexCeoLimit(Number(configs.capex_ceo_limit));
          if (configs.hiring_review_threshold) setHiringReviewThreshold(configs.hiring_review_threshold);
          if (configs.authority_delegation !== undefined) setAuthorityDelegation(configs.authority_delegation);
          if (configs.security_enforce_2fa !== undefined) setSecurityEnforce2fa(configs.security_enforce_2fa === 'true');
          if (configs.security_data_retention) setSecurityDataRetention(configs.security_data_retention);
          if (configs.automation_ai_insights !== undefined) setAutomationAiInsights(configs.automation_ai_insights === 'true');
          if (configs.automation_attrition_modeling !== undefined) setAutomationAttritionModeling(configs.automation_attrition_modeling === 'true');
          if (configs.automation_auto_escalate !== undefined) setAutomationAutoEscalate(configs.automation_auto_escalate === 'true');
          
          if (configs.security_rbac_matrix) {
            try {
              setRbacMatrix(JSON.parse(configs.security_rbac_matrix));
            } catch (e) {
              console.error("Error parsing rbac matrix config", e);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch configs", err);
      }

      // 2. Fetch audit logs
      try {
        const res = await fetch('/api/ceo-portal/audit-trail', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAuditLogs(data);
        } else {
          setAuditLogs([]);
        }
      } catch (err) {
        console.error("Failed to fetch audit logs", err);
        setAuditLogs([]);
      }
    };

    fetchConfigsAndAudit();
  }, []);

  const saveSetting = async (key, value) => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch('/api/ceo-portal/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ key, value: String(value) })
      });
      return res.ok;
    } catch (e) {
      console.error(`Error saving config ${key}:`, e);
      return false;
    }
  };

  const showToast = (msg, type = 'success') => {
    if (window.toast) {
      if (type === 'error') {
        window.toast.error(msg);
      } else {
        window.toast.success(msg);
      }
    } else {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(''), 3000);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    let success = true;

    if (activeCategory === 'config') {
      const p1 = saveSetting('company_currency', company_currency.toLowerCase());
      const p2 = saveSetting('company_fy', company_fy.toLowerCase());
      const p3 = saveSetting('capex_ceo_limit', capex_ceo_limit);
      const p4 = saveSetting('hiring_review_threshold', hiring_review_threshold);
      const p5 = saveSetting('authority_delegation', authority_delegation);
      const results = await Promise.all([p1, p2, p3, p4, p5]);
      success = results.every(r => r);
    } else if (activeCategory === 'security') {
      const p1 = saveSetting('security_enforce_2fa', String(security_enforce_2fa));
      const p2 = saveSetting('security_data_retention', security_data_retention);
      const p3 = saveSetting('security_rbac_matrix', JSON.stringify(rbacMatrix));
      const results = await Promise.all([p1, p2, p3]);
      success = results.every(r => r);
    } else if (activeCategory === 'automation') {
      const p1 = saveSetting('automation_ai_insights', String(automation_ai_insights));
      const p2 = saveSetting('automation_attrition_modeling', String(automation_attrition_modeling));
      const p3 = saveSetting('automation_auto_escalate', String(automation_auto_escalate));
      const results = await Promise.all([p1, p2, p3]);
      success = results.every(r => r);
    }

    setIsSaving(false);
    if (success) {
      setHasUnsavedChanges(false);
      showToast('Settings saved securely to the server.', 'success');
      
      const token = localStorage.getItem('nsg_jwt_token');
      if (token) {
        try {
          const res = await fetch('/api/ceo-portal/audit-trail', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setAuditLogs(data);
          }
        } catch (e) {
          console.error("Failed to fetch updated audit logs", e);
        }
      }
    } else {
      showToast('Failed to save settings. Please try again.', 'error');
    }
  };

  const filteredAuditLogs = auditLogs.map(log => {
    const { date, time } = formatDate(log.timestamp);
    return {
      id: log.id,
      timestampDate: date,
      timestampTime: time,
      user: log.initiator_id || "System",
      action: log.action_type || "",
      module: log.module || "",
      details: formatChangeDiff(log.change_diff)
    };
  }).filter(log => {
    let matchesType = true;
    if (auditFilter === 'CRITICAL') matchesType = log.action.includes('REJECTED') || log.action.includes('ESCALATION') || log.action.toLowerCase().includes('critical');
    if (auditFilter === 'FINANCIAL') matchesType = log.module === 'Payroll' || log.module === 'Finance';
    if (auditFilter === 'EXPORT') matchesType = log.action.includes('EXPORT') || log.action.toLowerCase().includes('export');

    let matchesSearch = true;
    if (auditSearch) {
      const q = auditSearch.toLowerCase();
      matchesSearch = log.user.toLowerCase().includes(q) || log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q) || log.module.toLowerCase().includes(q);
    }

    return matchesType && matchesSearch;
  });

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px', position: 'relative' }}>
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {toastMsg && (
        <div style={{
          position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--ceo-text-primary)', color: '#FFF', padding: '12px 24px',
          borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100, fontWeight: 500,
          animation: 'fadeInDown 0.3s ease forwards'
        }}>
          <CheckCircle size={18} color="var(--ceo-success)" />
          {toastMsg}
        </div>
      )}

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
          
          {/* 4. AUDIT LOGS */}
          {activeCategory === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="ceo-command-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--ceo-border)', background: '#F8FAFC' }}>
                <div className="ceo-typography-card-title"><History size={18} color="var(--ceo-primary)" /> Immutable Audit Trail</div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select className="ceo-form-input" style={{ width: '160px', height: '38px', background: '#FFF' }} value={auditFilter} onChange={e => setAuditFilter(e.target.value)}>
                    <option value="ALL">All Actions</option>
                    <option value="CRITICAL">Critical Only</option>
                    <option value="FINANCIAL">Financial Changes</option>
                    <option value="EXPORT">Data Exports</option>
                  </select>
                  <div style={{ position: 'relative', width: '280px' }}>
                    <Search size={16} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '11px' }} />
                    <input type="text" className="ceo-form-input" placeholder="Search by user, action, or module..." style={{ paddingLeft: '38px', height: '38px', background: '#FFF', width: '100%' }} value={auditSearch} onChange={e => setAuditSearch(e.target.value)} />
                  </div>
                  <button className="ceo-btn" style={{ height: '38px', padding: '0 16px', display: 'flex', gap: '8px', background: '#FFF', border: '1px solid var(--ceo-border)' }}><Download size={16} /> Export</button>
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
                    {filteredAuditLogs.length > 0 ? (
                      filteredAuditLogs.map(log => {
                        const isDanger = log.action.includes('REJECTED') || log.action.includes('ESCALATION');
                        const isSuccess = log.action.includes('APPROVED');
                        const isWarning = log.action.includes('EXPORT') || log.action.includes('CHANGED');
                        
                        const badgeColor = isDanger ? 'var(--ceo-danger)' : isSuccess ? 'var(--ceo-success)' : isWarning ? 'var(--ceo-warning)' : 'var(--ceo-primary)';
                        const badgeBg = isDanger ? '#FEF2F2' : isSuccess ? '#F0FDF4' : isWarning ? '#FEFCE8' : '#EFF6FF';
                        
                        return (
                          <tr key={log.id} style={{ height: '56px' }}>
                            <td style={{ padding: '0 24px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: 600, fontSize: '13px' }}>{log.timestampDate}</span>
                                <span style={{ color: 'var(--ceo-text-muted)', fontSize: '11px' }}>{log.timestampTime}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '24px', height: '24px', borderRadius: '12px', background: 'var(--ceo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                                  {log.user.charAt(0)}
                                </div>
                                <span style={{ fontWeight: 600 }}>{log.user}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{ 
                                background: badgeBg, color: badgeColor, border: `1px solid ${badgeColor}40`,
                                padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px'
                              }}>
                                {log.action}
                              </span>
                            </td>
                            <td style={{ fontWeight: 500, color: 'var(--ceo-text-secondary)' }}>{log.module}</td>
                            <td style={{ paddingRight: '24px' }}><span style={{ fontSize: '13px', color: 'var(--ceo-text-secondary)' }}>{log.details}</span></td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: 'var(--ceo-text-muted)' }}>
                          <History size={32} style={{ opacity: 0.2, margin: '0 auto 12px auto' }} />
                          <div>No audit logs found matching the current filters.</div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 1. GLOBAL GOVERNANCE */}
          {activeCategory === 'config' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Globe size={18} color="var(--ceo-primary)" /> Global Governance Parameters</div>
                <button className="ceo-btn ceo-btn-primary" onClick={handleSaveChanges} disabled={!hasUnsavedChanges || isSaving} style={{ padding: '6px 16px' }}>
                  {isSaving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
                </button>
              </div>
              <div className="ceo-command-content" style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                <div>
                  <div className="ceo-typography-section-title" style={{ fontSize: '13px', marginBottom: '16px' }}>FISCAL & REGIONAL</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                      <label>Base Currency</label>
                      <select className="ceo-form-input" value={company_currency} onChange={(e) => { setCompanyCurrency(e.target.value); setHasUnsavedChanges(true); }}>
                        <option value="INR">INR (₹) - Indian Rupee</option>
                        <option value="USD">USD ($) - US Dollar</option>
                        <option value="EUR">EUR (€) - Euro</option>
                      </select>
                    </div>
                    <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                      <label>Financial Year Start</label>
                      <select className="ceo-form-input" value={company_fy} onChange={(e) => { setCompanyFy(e.target.value); setHasUnsavedChanges(true); }}>
                        <option value="Jan">January 1st</option>
                        <option value="Apr">April 1st</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--ceo-border)', paddingTop: '24px' }}>
                  <div className="ceo-typography-section-title" style={{ fontSize: '13px', marginBottom: '16px' }}>EXECUTIVE APPROVAL THRESHOLDS</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                      <label>Capex CEO Approval Limit (&gt;)</label>
                      <input type="number" className="ceo-form-input" value={capex_ceo_limit} onChange={(e) => { setCapexCeoLimit(Number(e.target.value)); setHasUnsavedChanges(true); }} />
                      <div style={{ fontSize: '11px', color: 'var(--ceo-text-muted)', marginTop: '4px' }}>Any expense above this amount requires CEO approval.</div>
                    </div>
                    <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                      <label>Mandatory Executive Hiring Review</label>
                      <select className="ceo-form-input" value={hiring_review_threshold} onChange={(e) => { setHiringReviewThreshold(e.target.value); setHasUnsavedChanges(true); }}>
                        <option value="Dir">Director & Above</option>
                        <option value="VP">VP & Above</option>
                        <option value="C-Level">C-Level Only</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--ceo-border)', paddingTop: '24px' }}>
                  <div className="ceo-typography-section-title" style={{ fontSize: '13px', marginBottom: '16px' }}>AUTHORITY DELEGATION (OOF)</div>
                  <div style={{ background: '#F8FAFC', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>Delegate CEO Approvals</div>
                      <div style={{ fontSize: '13px', color: 'var(--ceo-text-secondary)', marginTop: '4px' }}>Automatically route all CEO approvals to the selected executive while you are away.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <select className="ceo-form-input" value={authority_delegation} onChange={(e) => { setAuthorityDelegation(e.target.value); setHasUnsavedChanges(true); }} style={{ width: '200px' }}>
                        <option value="">Select Delegate...</option>
                        <option value="CFO">CFO (A. Patel)</option>
                        <option value="COO">COO (R. Sharma)</option>
                      </select>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* 2. SECURITY & ACCESS (RBAC) */}
          {activeCategory === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><ShieldAlert size={18} color="var(--ceo-primary)" /> Security & Role-Based Access Control</div>
                <button className="ceo-btn ceo-btn-primary" onClick={handleSaveChanges} disabled={!hasUnsavedChanges || isSaving} style={{ padding: '6px 16px' }}>
                  {isSaving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
                </button>
              </div>
              <div className="ceo-command-content" style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                
                <div>
                  <div className="ceo-typography-section-title" style={{ fontSize: '13px', marginBottom: '16px' }}>GLOBAL SECURITY POLICIES</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    
                    <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>Enforce Two-Factor Authentication</div>
                        <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>Require 2FA for all active employees.</div>
                      </div>
                      <input type="checkbox" checked={security_enforce_2fa} onChange={(e) => { setSecurityEnforce2fa(e.target.checked); setHasUnsavedChanges(true); }} style={{ width: '18px', height: '18px', accentColor: 'var(--ceo-primary)' }} />
                    </div>

                    <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>Data Retention Policy</div>
                        <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>Automatically purge logs after period.</div>
                      </div>
                      <select className="ceo-form-input" value={security_data_retention} style={{ width: 'auto', padding: '4px 8px', height: '30px' }} onChange={(e) => { setSecurityDataRetention(e.target.value); setHasUnsavedChanges(true); }}>
                        <option value="3Y">3 Years</option>
                        <option value="7Y">7 Years</option>
                        <option value="Forever">Indefinite</option>
                      </select>
                    </div>

                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--ceo-border)', paddingTop: '24px' }}>
                  <div className="ceo-typography-section-title" style={{ fontSize: '13px', marginBottom: '16px' }}>RBAC PERMISSION MATRIX</div>
                  <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table className="ceo-erp-table" style={{ width: '100%', margin: 0 }}>
                      <thead style={{ background: '#F8FAFC' }}>
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

              </div>
            </div>
          )}

          {/* 3. AI & AUTOMATION */}
          {activeCategory === 'automation' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Zap size={18} color="var(--ceo-primary)" /> AI & Automation Engine</div>
                <button className="ceo-btn ceo-btn-primary" onClick={handleSaveChanges} disabled={!hasUnsavedChanges || isSaving} style={{ padding: '6px 16px' }}>
                  {isSaving ? 'Saving...' : <><Save size={16}/> Save Changes</>}
                </button>
              </div>
              <div className="ceo-command-content" style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ceo-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Zap size={16} /> Automated Insights & Summaries
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--ceo-text-muted)', marginTop: '4px', maxWidth: '600px', lineHeight: 1.5 }}>
                      Allow the AI engine to generate daily operational summaries, extract action items from Executive Chat, and highlight critical anomalies in Finance reports.
                    </div>
                  </div>
                  <input type="checkbox" checked={automation_ai_insights} onChange={(e) => { setAutomationAiInsights(e.target.checked); setHasUnsavedChanges(true); }} style={{ width: '20px', height: '20px', accentColor: 'var(--ceo-primary)' }} />
                </div>

                <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Predictive Attrition Modeling (HR)
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--ceo-text-muted)', marginTop: '4px', maxWidth: '600px', lineHeight: 1.5 }}>
                      Analyze employee engagement and leave patterns to flag 'Flight Risk' employees to the CEO and HR managers before they resign.
                    </div>
                  </div>
                  <input type="checkbox" checked={automation_attrition_modeling} onChange={(e) => { setAutomationAttritionModeling(e.target.checked); setHasUnsavedChanges(true); }} style={{ width: '20px', height: '20px', accentColor: 'var(--ceo-primary)' }} />
                </div>

                <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Auto-Escalate Stale Approvals
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--ceo-text-muted)', marginTop: '4px', maxWidth: '600px', lineHeight: 1.5 }}>
                      Automatically forward approvals to the next tier of leadership if untouched by the manager for more than 48 hours.
                    </div>
                  </div>
                  <input type="checkbox" checked={automation_auto_escalate} onChange={(e) => { setAutomationAutoEscalate(e.target.checked); setHasUnsavedChanges(true); }} style={{ width: '20px', height: '20px', accentColor: 'var(--ceo-primary)' }} />
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
