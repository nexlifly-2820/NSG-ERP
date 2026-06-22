import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, History, Bell, Settings as SettingsIcon, Users, 
  Search, Download, CheckCircle, Save, Globe, Zap, CheckSquare, Square
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCompany } from '../../common/CompanyContext';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const SETTINGS_CATEGORIES = [
  { id: 'security', label: 'Security & Access', icon: ShieldAlert },
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
  const { companyLogo } = useCompany();
  const [activeCategory, setActiveCategory] = useState('security');
  
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

//   const showToast = (msg, type = 'success') => {
//     if (window.toast) {
//       if (type === 'error') {
//         window.toast.error(msg);
//       } else {
//         window.toast.success(msg);
//       }
//     } else {
//       setToastMsg(msg);
//       setTimeout(() => setToastMsg(''), 3000);
//     }
//   };

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
      window.showToast('Settings saved securely to the server.', 'success');
      
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
      window.showToast('Failed to save settings. Please try again.', 'error');
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

  const handleDownloadPDF = () => {
    window.toast.info('Generating Audit Logs PDF report...');
    
    const doc = new jsPDF('landscape', 'pt', 'a4');
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = companyLogo || '/hmns-logo.png';
    
    img.onload = () => {
      // Premium White Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 100, 'F');
      
      const imgRatio = img.width / img.height;
      const logoHeight = 45;
      const logoWidth = logoHeight * imgRatio;
      doc.addImage(img, 'PNG', 40, 25, logoWidth, logoHeight);
      
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(40, 90, doc.internal.pageSize.getWidth() - 40, 90);
      
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.text('IMMUTABLE AUDIT TRAIL', doc.internal.pageSize.getWidth() - 40, 45, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.text(`Filter: ${auditFilter}`, doc.internal.pageSize.getWidth() - 40, 65, { align: 'right' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, doc.internal.pageSize.getWidth() - 40, 80, { align: 'right' });

      const tableHeaders = ['Timestamp', 'User', 'Action', 'Module', 'Details'];
      const tableBody = filteredAuditLogs.map(log => {
        return [`${log.timestampDate} ${log.timestampTime}`, log.user, log.action, log.module, log.details];
      });

      autoTable(doc, {
        startY: 110,
        head: [tableHeaders],
        body: tableBody,
        theme: 'plain',
        styles: { font: 'helvetica', cellPadding: { top: 8, bottom: 8, left: 6, right: 6 }, lineColor: [226, 232, 240], lineWidth: { bottom: 0.5 }, minCellHeight: 25 },
        headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold', halign: 'left', valign: 'middle', lineWidth: { top: 0.5, bottom: 0.5 }, lineColor: [203, 213, 225] },
        bodyStyles: { fontSize: 9, halign: 'left', valign: 'middle', textColor: [71, 85, 105] },
        columnStyles: { 
          0: { fontStyle: 'bold', textColor: [15, 23, 42], cellWidth: 90 },
          1: { cellWidth: 120 },
          2: { cellWidth: 80 },
          3: { cellWidth: 70 },
          4: { cellWidth: 380 }
        },
        didParseCell: function (data) {
          if (data.section === 'body' && data.column.index === 2) {
            const val = data.cell.raw;
            if (val.includes('APPROVED')) { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold'; }
            else if (val.includes('REJECTED') || val.includes('ESCALATION')) { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
            else if (val.includes('EXPORT') || val.includes('CHANGED')) { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = 'bold'; }
            else { data.cell.styles.textColor = [37, 99, 235]; data.cell.styles.fontStyle = 'bold'; }
          }
        },
        margin: { top: 110, left: 40, right: 40 }
      });

      const finalY = doc.lastAutoTable?.finalY || 110;
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
      }

      doc.save(`Audit_Logs_${new Date().toISOString().split('T')[0]}.pdf`);
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px', position: 'relative' }}>
      
      {/* GLOBAL TOAST NOTIFICATION */}
      {false && (
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
      <div 
        className="responsive-panel-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '240px 1fr',
          gap: '24px',
          flex: 1
        }}
      >
        
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
                  <button onClick={handleDownloadPDF} className="ceo-btn" style={{ height: '38px', padding: '0 16px', display: 'flex', gap: '8px', background: '#FFF', border: '1px solid var(--ceo-border)', cursor: 'pointer', fontWeight: 600, color: 'var(--ceo-text-main)', transition: 'all 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFF'; e.currentTarget.style.borderColor = 'var(--ceo-border)'; }}><Download size={16} /> Export</button>
                </div>
              </div>
              <div className="ceo-command-content" style={{ padding: '0 24px 24px 24px', overflowY: 'auto' }}>
                <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', overflow: 'hidden' }}>
                  <div className="table-responsive-wrapper">
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ width: '15%', padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Timestamp</th>
                        <th style={{ width: '18%', padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User</th>
                        <th style={{ width: '20%', padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Action</th>
                        <th style={{ width: '12%', padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Module</th>
                        <th style={{ width: '35%', padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details (Old → New)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuditLogs.length > 0 ? (
                        filteredAuditLogs.map((log, idx) => {
                          const isDanger = log.action.includes('REJECTED') || log.action.includes('ESCALATION');
                          const isSuccess = log.action.includes('APPROVED');
                          const isWarning = log.action.includes('EXPORT') || log.action.includes('CHANGED');
                          
                          const badgeColor = isDanger ? '#dc2626' : isSuccess ? '#059669' : isWarning ? '#d97706' : '#2563eb';
                          const badgeBg = isDanger ? '#fef2f2' : isSuccess ? '#ecfdf5' : isWarning ? '#fffbeb' : '#eff6ff';
                          const badgeBorder = isDanger ? '#fecaca' : isSuccess ? '#a7f3d0' : isWarning ? '#fde68a' : '#bfdbfe';
                          const dotColor = isDanger ? '#ef4444' : isSuccess ? '#10b981' : isWarning ? '#f59e0b' : '#3b82f6';
                          
                          return (
                            <tr key={log.id} style={{ transition: 'all 0.2s', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                              <td style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>{log.timestampDate}</span>
                                  <span style={{ color: '#64748b', fontSize: '12px' }}>{log.timestampTime}</span>
                                </div>
                              </td>
                              <td style={{ padding: '20px 24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(log.user)}&background=random`; }} src={`https://ui-avatars.com/api/?name=${encodeURIComponent(log.user)}&background=random`} alt={log.user} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }} />
                                  <span style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>{log.user}</span>
                                </div>
                              </td>
                              <td style={{ padding: '20px 24px' }}>
                                <span style={{ 
                                  padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.03em', display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  backgroundColor: badgeBg, color: badgeColor, border: `1px solid ${badgeBorder}` 
                                }}>
                                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: dotColor }}></span>
                                  {log.action}
                                </span>
                              </td>
                              <td style={{ padding: '20px 24px', fontWeight: 600, color: '#475569', fontSize: '13px' }}>{log.module}</td>
                              <td style={{ padding: '20px 24px' }}>
                                <span style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', display: 'block', wordWrap: 'break-word', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.details}</span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                            <History size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto', color: '#64748b' }} />
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>No Audit Logs Found</div>
                            <div style={{ fontSize: '14px' }}>Adjust your filters to see more results.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                    </table>
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
                  <div className="responsive-form-grid" style={{ gap: '16px' }}>
                    
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
                    <div className="table-responsive-wrapper">
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
            </div>
          )}



        </div>
      </div>
    </div>
  );
}
