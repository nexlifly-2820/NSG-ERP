import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, Search, Filter, MessageSquare, Clock, ArrowRight, User, AlertCircle, X, Check
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// LIGHT THEME TOKENS 
// ==========================================
const THEME = {
  bgBase: '#F8FAFC',       
  bgSurface: '#FFFFFF',    
  bgHover: '#F1F5F9',      
  primary: '#2563EB',      
  primaryHover: '#1D4ED8', 
  textMain: '#0F172A',     
  textMuted: '#64748B',    
  border: '#E2E8F0',       
  borderLight: '#CBD5E1',  
  danger: '#EF4444',       
  warning: '#F59E0B'       
};

// ==========================================
// MOCK DATA
// ==========================================
const mockApprovals = [
  { id: "APP-1001", type: "Payroll", requestedBy: "HR Department", dept: "HR", urgency: "Critical", submittedAt: "10 mins ago", amount: "₹24.5M", status: 'Pending' },
  { id: "APP-1002", type: "Budget", requestedBy: "David L.", dept: "Marketing", urgency: "High", submittedAt: "2 hours ago", amount: "₹1.5M", status: 'Pending' },
  { id: "APP-1003", type: "Resignation", requestedBy: "Amit P.", dept: "Sales", urgency: "High", submittedAt: "1 day ago", amount: null, status: 'Pending' },
  { id: "APP-1004", type: "Policy", requestedBy: "Legal Team", dept: "Legal", urgency: "Normal", submittedAt: "2 days ago", amount: null, status: 'Pending' }
];

const mockAuditTrail = [
  { time: "Oct 24, 10:15 AM", user: "Rajiv S.", action: "Request Created" },
  { time: "Oct 24, 10:20 AM", user: "Priya M. (TL)", action: "Approved at Level 1" },
  { time: "Oct 24, 11:00 AM", user: "HR System", action: "Flagged for CEO Approval" },
];

const TABS = ['All', 'Payroll', 'Budget', 'Resignation', 'Policy'];

// ==========================================
// COMPONENTS ARCHITECTURE (AS PER SPEC)
// ==========================================

const ConfirmActionModal = ({ isOpen, actionType, item, onClose, onConfirm }) => {
  if (!isOpen) return null;
  const isApprove = actionType === 'Approve';
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ background: THEME.bgSurface, padding: '32px', borderRadius: '16px', width: '420px', border: `1px solid ${THEME.border}`, color: THEME.textMain, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
           {isApprove ? <CheckCircle size={24} color={THEME.primary} /> : <XCircle size={24} color={THEME.danger} />}
           <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Confirm {actionType}</h3>
         </div>
         <p style={{ margin: '0 0 8px', color: THEME.textMuted, lineHeight: 1.5 }}>
           Are you sure you want to {actionType.toLowerCase()} request <strong>{item?.id}</strong>?
         </p>
         <p style={{ margin: '0 0 32px', color: THEME.textMuted, fontSize: '13px' }}>
           This action cannot be undone and will be permanently recorded in the audit trail.
         </p>
         <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button 
              onClick={onClose} 
              style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${THEME.borderLight}`, color: THEME.textMain, borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}
              onMouseOver={(e) => e.target.style.background = THEME.bgHover}
              onMouseOut={(e) => e.target.style.background = 'transparent'}
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm} 
              style={{ padding: '10px 20px', background: isApprove ? THEME.primary : THEME.danger, border: 'none', color: '#FFF', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isApprove ? <Check size={16} /> : <X size={16} />}
              Yes, {actionType}
            </button>
         </div>
      </div>
    </div>
  )
}

const ApprovalDetailDrawer = ({ approval, onClose, onAction }) => {
  if (!approval) return null;
  return (
    <div style={{ gridArea: 'drawer', background: THEME.bgSurface, borderLeft: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column', height: '100%', borderRadius: '0 12px 12px 0' }}>
      {/* Header */}
      <div style={{ padding: '24px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: THEME.textMuted, letterSpacing: '0.05em', marginBottom: '8px' }}>REQUEST DETAILS</div>
          <div style={{ fontSize: '22px', fontWeight: 700, color: THEME.textMain, marginBottom: '8px' }}>{approval.type} Approval</div>
          <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, 
            background: approval.urgency === 'Critical' ? `${THEME.danger}20` : `${THEME.warning}20`,
            color: approval.urgency === 'Critical' ? THEME.danger : THEME.warning
          }}>
            {approval.urgency} Priority
          </span>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
          <X size={20} color={THEME.textMuted} />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.textMuted, marginBottom: '12px' }}>Requestor</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: THEME.bgBase, borderRadius: '12px', border: `1px solid ${THEME.border}` }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '24px', background: `${THEME.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: THEME.primary }}>
              <User size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 600, color: THEME.textMain, fontSize: '15px' }}>{approval.requestedBy}</div>
              <div style={{ color: THEME.textMuted, fontSize: '13px', marginTop: '2px' }}>{approval.dept}</div>
            </div>
          </div>
        </div>

        {approval.amount && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.textMuted, marginBottom: '8px' }}>Total Amount</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: THEME.primary }}>{approval.amount}</div>
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.textMuted, marginBottom: '20px' }}>Audit Trail</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: THEME.border, zIndex: 0 }}></div>
            {mockAuditTrail.map((audit, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', zIndex: 1 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '8px', background: i === mockAuditTrail.length-1 ? THEME.primary : THEME.bgSurface, border: `2px solid ${i === mockAuditTrail.length-1 ? THEME.primary : THEME.borderLight}`, marginTop: '2px' }}></div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: THEME.textMain }}>{audit.action}</div>
                  <div style={{ color: THEME.textMuted, fontSize: '12px', marginTop: '4px' }}>{audit.user} • {audit.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={{ padding: '24px', borderTop: `1px solid ${THEME.border}`, background: THEME.bgBase, borderRadius: '0 0 12px 0' }}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: THEME.textMuted, marginBottom: '8px', fontWeight: 600 }}>Add Comment (Optional)</label>
          <textarea 
            rows={2} 
            placeholder="Reason for decision..."
            style={{ width: '100%', background: THEME.bgSurface, border: `1px solid ${THEME.borderLight}`, borderRadius: '8px', padding: '12px', color: THEME.textMain, outline: 'none', resize: 'none' }}
          ></textarea>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => onAction('Deny', approval)} style={{ flex: 1, padding: '12px', background: 'transparent', border: `1px solid ${THEME.danger}`, color: THEME.danger, borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>Deny</button>
          <button onClick={() => onAction('Approve', approval)} style={{ flex: 2, padding: '12px', background: THEME.primary, border: 'none', color: '#FFF', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 12px ${THEME.primary}40` }}>Approve Request</button>
        </div>
      </div>
    </div>
  );
};

const ApprovalRow = ({ item, isSelected, isChecked, onSelect, onToggleCheck }) => {
  return (
    <tr 
      onClick={() => onSelect(item)}
      style={{ 
        background: isSelected ? THEME.bgHover : THEME.bgSurface,
        cursor: 'pointer',
        borderBottom: `1px solid ${THEME.border}`,
        transition: 'background 0.2s'
      }}
    >
      <td onClick={(e) => e.stopPropagation()} style={{ padding: '16px 24px', width: '60px' }}>
        <input type="checkbox" checked={isChecked} onChange={() => onToggleCheck(item.id)} style={{ width: '16px', height: '16px', accentColor: THEME.primary }} />
      </td>
      <td style={{ padding: '16px', color: THEME.textMuted, fontSize: '13px', fontWeight: 600 }}>{item.id}</td>
      <td style={{ padding: '16px', color: THEME.textMain, fontWeight: 600 }}>{item.type}</td>
      <td style={{ padding: '16px' }}>
        <div style={{ color: THEME.textMain, fontWeight: 500 }}>{item.requestedBy}</div>
        <div style={{ color: THEME.textMuted, fontSize: '12px', marginTop: '2px' }}>{item.dept}</div>
      </td>
      <td style={{ padding: '16px' }}>
        <div style={{ color: THEME.textMain, fontWeight: 600 }}>{item.amount || '-'}</div>
        <div style={{ color: THEME.textMuted, fontSize: '12px', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12}/> {item.submittedAt}
        </div>
      </td>
      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <span style={{ 
            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
            background: item.status === 'Approved' ? `${THEME.primary}20` : item.status === 'Denied' ? `${THEME.danger}20` : `${THEME.warning}20`,
            color: item.status === 'Approved' ? THEME.primary : item.status === 'Denied' ? THEME.danger : THEME.warning
          }}>
            {item.status}
          </span>
          <button 
            style={{ padding: '4px 10px', background: THEME.primary, color: '#FFF', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
            onClick={(e) => { e.stopPropagation(); onSelect(item); }}
          >
            Review <ArrowRight size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const ApprovalTable = ({ data, activeTab, selectedIds, onToggleCheck, onToggleAll, selectedApproval, onSelect }) => {
  const filtered = data.filter(a => activeTab === 'All' || a.type === activeTab);
  const isAllChecked = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div style={{ gridArea: 'list', background: THEME.bgSurface, borderRadius: selectedApproval ? '12px 0 0 12px' : '12px', overflow: 'hidden', border: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' }}>
      
      {/* Table Toolbar */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: THEME.bgBase }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color={THEME.textMuted} style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input type="text" placeholder="Search approvals..." style={{ width: '100%', background: THEME.bgSurface, border: `1px solid ${THEME.borderLight}`, padding: '8px 12px 8px 36px', borderRadius: '6px', color: THEME.textMain, outline: 'none' }} />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: THEME.bgSurface, border: `1px solid ${THEME.borderLight}`, color: THEME.textMain, borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>
            <Filter size={16}/> Filters
          </button>
          {selectedIds.size > 0 && (
            <button style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: THEME.primary, border: 'none', color: '#FFF', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
              Bulk Approve ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div style={{ overflowY: 'auto', overflowX: 'auto', flex: 1 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: THEME.bgBase, borderBottom: `1px solid ${THEME.border}` }}>
              <th style={{ padding: '16px 24px', width: '60px' }}>
                <input type="checkbox" checked={isAllChecked} onChange={() => onToggleAll(filtered)} style={{ width: '16px', height: '16px', accentColor: THEME.primary }} />
              </th>
              <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request ID</th>
              <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
              <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted By</th>
              <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details & Date</th>
              <th style={{ padding: '16px 24px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Status & Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(item => (
              <ApprovalRow 
                key={item.id} 
                item={item} 
                isSelected={selectedApproval?.id === item.id}
                isChecked={selectedIds.has(item.id)}
                onSelect={onSelect}
                onToggleCheck={onToggleCheck}
              />
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: THEME.textMuted }}>No pending approvals found.</div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// MAIN EXPORT (ApprovalsPage)
// ==========================================
export default function ApprovalsPage({ db, onUpdateDb }) {
  const [activeTab, setActiveTab] = useState('All');
  const [approvals, setApprovals] = useState(mockApprovals);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedApproval, setSelectedApproval] = useState(null);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', item: null });

  // Sync approvals with the database
  useEffect(() => {
    let list = [...mockApprovals];
    const pendingPayrollRuns = (db?.payrollRuns || []).filter(r => r.status === 'maker_signed');

    // Pre-pend active maker signed runs
    pendingPayrollRuns.forEach(run => {
      if (!list.some(a => a.id === `PAY-${run.id}`)) {
        list.unshift({
          id: `PAY-${run.id}`,
          type: "Payroll",
          requestedBy: "Sarah Jenkins (HR)",
          dept: "HR",
          urgency: "Critical",
          submittedAt: run.maker_signed_at ? new Date(run.maker_signed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
          amount: "₹24.5M",
          status: 'Pending',
          payrollRunId: run.id
        });
      }
    });

    // Sync any that were already approved or rejected in database
    const syncedList = list.map(a => {
      if (a.id.startsWith('PAY-')) {
        const runId = Number(a.id.split('-')[1]);
        const run = db?.payrollRuns?.find(r => r.id === runId);
        if (run) {
          if (run.status === 'bank_transferred') {
            return { ...a, status: 'Approved' };
          } else if (run.status === 'rejected') {
            return { ...a, status: 'Denied' };
          }
        }
      }
      return a;
    });

    setApprovals(syncedList);
  }, [db]);

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = (filtered) => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(a => a.id)));
    }
  };

  const openConfirmModal = (actionType, item) => {
    setModalConfig({ isOpen: true, type: actionType, item });
  };

  const handleConfirmAction = () => {
    const { type, item } = modalConfig;
    const newStatus = type === 'Approve' ? 'Approved' : 'Denied';
    
    if (item && item.id.startsWith('PAY-')) {
      const runId = item.payrollRunId;
      const updatedRuns = (db?.payrollRuns || []).map(run => {
        if (run.id === runId) {
          return {
            ...run,
            status: type === 'Approve' ? 'bank_transferred' : 'rejected',
            checker_id: 'CEO Suite',
            checker_signed_at: new Date().toISOString(),
            bank_transfer_at: type === 'Approve' ? new Date().toISOString() : null
          };
        }
        return run;
      });

      const newLogs = [...(db?.auditLogs || []), {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        initiator_id: 'CEO Suite',
        module: 'Payroll',
        record_id: runId,
        action_type: type === 'Approve' ? 'payroll_release' : 'payroll_reject',
        change_diff: { payroll_run: type === 'Approve' ? 'bank_transferred' : 'rejected' },
        ip_address: '192.168.1.101',
        client_agent: 'Chrome / Windows'
      }];

      onUpdateDb({
        ...db,
        payrollRuns: updatedRuns,
        auditLogs: newLogs
      });

      alert(type === 'Approve'
        ? 'Payroll transfer signed! Payout dispatched and monthly payslips released to all employee dashboards.'
        : 'Payroll ledger rejected and sent back to HR.'
      );
    } else {
      setApprovals(approvals.map(a => a.id === item.id ? { ...a, status: newStatus } : a));
    }
    
    // Close modal and drawer
    setModalConfig({ isOpen: false, type: '', item: null });
    setSelectedApproval(null);
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', height: '100%', 
      background: 'transparent', color: THEME.textMain, 
      fontFamily: "'Inter', sans-serif"
    }}>
      
      <ConfirmActionModal 
        isOpen={modalConfig.isOpen} 
        actionType={modalConfig.type} 
        item={modalConfig.item}
        onClose={() => setModalConfig({ isOpen: false, type: '', item: null })}
        onConfirm={handleConfirmAction}
      />

      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: THEME.textMain }}>Approve/Deny Pending Approvals</h1>
        <p style={{ marginTop: '8px', color: THEME.textMuted, fontSize: '15px' }}>Review, track, and authorize cross-department requests.</p>
      </div>

      {/* MAIN WORKSPACE GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedApproval ? 'minmax(0, 1fr) 380px' : 'minmax(0, 1fr)',
        gridTemplateRows: 'auto 1fr',
        gridTemplateAreas: selectedApproval ? `
          "filter drawer"
          "list drawer"
        ` : `
          "filter filter"
          "list list"
        `,
        gap: '16px',
        flex: 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        height: 'calc(100vh - 160px)', 
        minHeight: '400px'
      }}>
        
        {/* TABS */}
        <div style={{ gridArea: 'filter', display: 'flex', gap: '8px', borderBottom: `1px solid ${THEME.border}`, paddingBottom: '0' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab ? THEME.bgSurface : 'transparent',
                color: activeTab === tab ? THEME.primary : THEME.textMuted,
                border: 'none',
                borderBottom: activeTab === tab ? `2px solid ${THEME.primary}` : '2px solid transparent',
                borderRadius: '8px 8px 0 0',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '-1px'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TABLE COMPONENT */}
        <ApprovalTable 
          data={approvals}
          activeTab={activeTab}
          selectedIds={selectedIds}
          onToggleCheck={toggleSelection}
          onToggleAll={toggleAll}
          selectedApproval={selectedApproval}
          onSelect={setSelectedApproval}
        />

        {/* DRAWER COMPONENT */}
        <ApprovalDetailDrawer 
          approval={selectedApproval} 
          onClose={() => setSelectedApproval(null)} 
          onAction={openConfirmModal}
        />

      </div>
    </div>
  );
}
