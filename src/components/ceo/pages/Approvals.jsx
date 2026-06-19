// Crash fix applied
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Search, Filter, MessageSquare, Clock, ArrowRight, User, AlertCircle, X, Check, TrendingUp, FileText
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

const TABS = ['All', 'Payroll', 'Budget', 'Resignation', 'Policy', 'Promotions', 'Claim Expenses', 'History'];

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

        {approval.category && (
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.textMuted, marginBottom: '8px' }}>Category & Details</div>
            <div style={{ fontSize: '15px', color: THEME.textMain, fontWeight: 500 }}>{approval.category}</div>
            <div style={{ fontSize: '14px', color: THEME.textMuted, marginTop: '4px' }}>{approval.description}</div>
            {approval.receiptName && (
               <a href={approval.receiptName} download style={{ textDecoration: 'none', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: THEME.bgHover, borderRadius: '8px', border: `1px solid ${THEME.borderLight}`, cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.borderColor = THEME.primary} onMouseOut={(e) => e.currentTarget.style.borderColor = THEME.borderLight}>
                 <FileText size={16} color={THEME.primary} />
                 <span style={{ fontSize: '13px', fontWeight: 600, color: THEME.primary }}>{approval.receiptName}</span>
               </a>
            )}
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: THEME.textMuted, marginBottom: '20px' }}>Audit Trail</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: THEME.border, zIndex: 0 }}></div>
            {(approval.auditTrail || [{ action: "Request Submitted", time: approval.submittedAt, user: approval.requestedBy }]).map((audit, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: '16px', zIndex: 1 }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '8px', background: i === arr.length-1 ? THEME.primary : THEME.bgSurface, border: `2px solid ${i === arr.length-1 ? THEME.primary : THEME.borderLight}`, marginTop: '2px' }}></div>
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
          <button onClick={() => onAction('Approve', approval)} style={{ flex: 2, padding: '12px', background: THEME.primary, border: 'none', color: '#FFF', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: `0 4px 12px ${THEME.primary}40` }}>Approve</button>
        </div>
      </div>
    </div>
  );
};

const ApprovalRow = ({ item, isSelected, isChecked, onSelect, onToggleCheck, activeTab }) => {
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
      {activeTab === 'Claim Expenses' ? (
        <>
          <td style={{ padding: '16px', color: THEME.textMuted, fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.submittedAt}</td>
          <td style={{ padding: '16px', color: THEME.textMain, fontWeight: 600 }}>{item.category || '-'}</td>
          <td style={{ padding: '16px', color: THEME.textMain, fontWeight: 600 }}>{item.amount || '-'}</td>
          <td style={{ padding: '16px', color: THEME.textMuted, fontSize: '13px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.description}>{item.description || '-'}</td>
          <td style={{ padding: '16px' }}>
            <span style={{ fontSize: '13px', color: THEME.textMuted, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <FileText size={14} /> {item.receiptName || 'N/A'}
            </span>
          </td>
        </>
      ) : (
        <>
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
        </>
      )}
      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <span style={{ 
            padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
            background: item.status === 'Approved' ? `${THEME.primary}20` : item.status === 'Denied' ? `${THEME.danger}20` : `${THEME.warning}20`,
            color: item.status === 'Approved' ? THEME.primary : item.status === 'Denied' ? THEME.danger : THEME.warning
          }}>
            {activeTab === 'Claim Expenses' ? item.status.toLowerCase() : item.status}
          </span>
          {activeTab !== 'Claim Expenses' && (
            <button 
              style={{ padding: '4px 10px', background: THEME.primary, color: '#FFF', border: 'none', borderRadius: '4px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
              onClick={(e) => { e.stopPropagation(); onSelect(item); }}
            >
              Review <ArrowRight size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

const ApprovalTable = ({ data, activeTab, selectedIds, onToggleCheck, onToggleAll, selectedApproval, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterState, setFilterState] = useState({
    type: 'All',
    submittedBy: 'All',
    id: ''
  });

  let filtered = data.filter(a => {
    const isPending = !['Approved', 'Denied'].includes(a.status);
    
    // Status Check
    if (activeTab !== 'History' && !isPending) return false;
    if (activeTab === 'History' && isPending) return false;
    
    // Tab Type Check
    if (activeTab !== 'All' && activeTab !== 'History') {
       if (a.type !== activeTab) return false;
    }

    // Dropdown Filters Check
    if (filterState.type !== 'All' && a.type !== filterState.type) return false;
    if (filterState.submittedBy !== 'All' && a.requestedBy !== filterState.submittedBy) return false;
    if (filterState.id && !a.id.toLowerCase().includes(filterState.id.toLowerCase())) return false;
    
    return true;
  });

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.id.toLowerCase().includes(q) || 
      a.type.toLowerCase().includes(q) || 
      a.requestedBy.toLowerCase().includes(q)
    );
  }

  const isAllChecked = filtered.length > 0 && selectedIds.size === filtered.length;

  return (
    <div style={{ gridArea: 'list', background: THEME.bgSurface, borderRadius: selectedApproval ? '12px 0 0 12px' : '12px', overflow: 'hidden', border: `1px solid ${THEME.border}`, display: 'flex', flexDirection: 'column' }}>
      
      {/* Table Toolbar */}
      <div style={{ padding: '16px 24px', borderBottom: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: THEME.bgBase }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} color={THEME.textMuted} style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input 
            type="text" 
            placeholder="Search approvals..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: THEME.bgSurface, border: `1px solid ${THEME.borderLight}`, padding: '8px 12px 8px 36px', borderRadius: '6px', color: THEME.textMain, outline: 'none' }} 
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(activeTab === 'All' || activeTab === 'History') && (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowFilters(!showFilters)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: (filterState.type !== 'All' || filterState.submittedBy !== 'All' || filterState.id !== '') ? THEME.bgHover : THEME.bgSurface, border: `1px solid ${(filterState.type !== 'All' || filterState.submittedBy !== 'All' || filterState.id !== '') ? THEME.primary : THEME.borderLight}`, color: (filterState.type !== 'All' || filterState.submittedBy !== 'All' || filterState.id !== '') ? THEME.primary : THEME.textMain, borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}
              >
                <Filter size={16}/> Filters
              </button>
              {showFilters && (
                <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: THEME.bgSurface, border: `1px solid ${THEME.border}`, borderRadius: '8px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', zIndex: 50, width: '250px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Type</div>
                    <select 
                      value={filterState.type}
                      onChange={e => setFilterState({...filterState, type: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${THEME.borderLight}`, outline: 'none' }}
                    >
                      <option value="All">All Types</option>
                      <option value="Payroll">Payroll</option>
                      <option value="Budget">Budget</option>
                      <option value="Resignation">Resignation</option>
                      <option value="Policy">Policy</option>
                      <option value="Promotions">Promotions</option>
                      <option value="Claim Expenses">Claim Expenses</option>
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Submitted By</div>
                    <select 
                      value={filterState.submittedBy}
                      onChange={e => setFilterState({...filterState, submittedBy: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${THEME.borderLight}`, outline: 'none' }}
                    >
                      <option value="All">All Users</option>
                      {Array.from(new Set(data.map(a => a.requestedBy))).filter(Boolean).map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: THEME.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Request ID</div>
                    <input 
                      type="text" 
                      placeholder="e.g. PAY-123"
                      value={filterState.id}
                      onChange={e => setFilterState({...filterState, id: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: `1px solid ${THEME.borderLight}`, outline: 'none' }}
                    />
                  </div>

                  <button 
                    onClick={() => { setFilterState({ type: 'All', submittedBy: 'All', id: '' }); setShowFilters(false); }}
                    style={{ width: '100%', padding: '8px', background: THEME.bgHover, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600, color: THEME.textMain }}
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}
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
                {activeTab === 'Claim Expenses' ? (
                  <>
                    <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                    <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</th>
                    <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Amount</th>
                    <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Description</th>
                    <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receipt</th>
                    <th style={{ padding: '16px 24px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>CEO Approval</th>
                  </>
                ) : (
                  <>
                    <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Request ID</th>
                    <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                    <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Submitted By</th>
                    <th style={{ padding: '16px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Details & Date</th>
                    <th style={{ padding: '16px 24px', color: THEME.textMuted, fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Status & Action</th>
                  </>
                )}
              </tr>
          </thead>
          <tbody>
            {filtered.map(item => {
              return (
                <ApprovalRow 
                  key={item.id} 
                  item={item} 
                  activeTab={activeTab}
                  isSelected={selectedApproval?.id === item.id}
                  isChecked={selectedIds.has(item.id)}
                  onSelect={onSelect}
                  onToggleCheck={onToggleCheck}
                />
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ padding: '48px', textAlign: 'center', color: THEME.textMuted }}>
            {activeTab === 'History' ? 'No approval history found.' : 'No pending approvals found.'}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// MAIN EXPORT (ApprovalsPage)
// ==========================================
export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState('All');
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedApproval, setSelectedApproval] = useState(null);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: '', item: null });

  // ---- Promotions state ----
  const [promotions, setPromotions] = useState([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const fetchApprovals = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ceo-portal/approvals/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApprovals(data.approvals || []);
        setPromotions(data.promotions || []);
      } else {
        throw new Error("Failed to fetch approvals");
      }
    } catch (err) {
      console.error(err);
      setError('Connection error loading approvals.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handlePromoDecision = async (id, decision) => {
    const token = localStorage.getItem('nsg_jwt_token');
    setPromoLoading(true);
    try {
      const res = await fetch(`/api/hr-portal/promotions/${id}/decide`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ decision })
      });
      if (res.ok) {
        setPromotions(prev => prev.map(p => p.id === id ? { ...p, status: decision } : p));
        alert(decision === 'approved_by_ceo' ? '✅ Promotion approved! Employee notified.' : '❌ Promotion rejected. Employee notified.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPromoLoading(false);
    }
  };

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

  const handleConfirmAction = async () => {
    const { type, item } = modalConfig;
    const isApprove = type === 'Approve';
    const action = isApprove ? 'approve' : 'reject';
    const token = localStorage.getItem('nsg_jwt_token');

    if (!item) return;

    try {
      if (item.id.startsWith('PAY-')) {
        const runId = item.payrollRunId;
        if (isApprove) {
          const res = await fetch(`/api/ceo-portal/payroll/runs/${runId}/transfer-bank`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to approve payroll run.');
          alert('Payroll transfer signed! Payout dispatched and monthly payslips released to all employee dashboards.');
        } else {
          // Deny/Reject Payroll run
          const res = await fetch(`/api/ceo-portal/payroll/runs/${runId}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!res.ok) throw new Error('Failed to reject payroll run.');
          alert('Payroll ledger rejected and sent back to HR.');
        }
      } else if (item.id.startsWith('RES-')) {
        const resignId = item.resignationId;
        const endpoint = `/api/hr-portal/exits/resignations/${resignId}/${action}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to ${action} resignation.`);
        alert(isApprove
          ? 'Resignation exit approved! Offboarding clearance checklist updated in HR panel.'
          : 'Resignation request rejected.'
        );
      } else if (item.id.startsWith('BUD-')) {
        const budgetId = item.budgetId;
        const endpoint = `/api/ceo-portal/finance/budgets/${budgetId}/${action}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to ${action} budget.`);
        alert(`Budget request ${isApprove ? 'approved' : 'rejected'} successfully.`);
      } else if (item.id.startsWith('POL-')) {
        const policyId = item.policyId;
        const endpoint = `/api/ceo-portal/policies/${policyId}/${action}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to ${action} policy.`);
        alert(`Company policy ${isApprove ? 'approved' : 'rejected'} successfully.`);
      } else if (item.id.startsWith('EXP-')) {
        const expenseId = item.expenseId;
        const endpoint = `/api/ceo-portal/expenses/${expenseId}/${action}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error(`Failed to ${action} expense claim.`);
        alert(isApprove
          ? 'Expense claim approved!'
          : 'Expense claim rejected.'
        );
      } else if (item.type === 'Promotions') {
        const decision = isApprove ? 'approved_by_ceo' : 'rejected_by_ceo';
        const res = await fetch(`/api/hr-portal/promotions/${item.id}/decide`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ decision })
        });
        if (!res.ok) throw new Error(`Failed to ${action} promotion.`);
        alert(isApprove ? '✅ Promotion approved! Employee notified.' : '❌ Promotion rejected. Employee notified.');
      }

      await fetchApprovals();

    } catch (err) {
      console.error(err);
      alert(`Error performing action: ${err.message}`);
    } finally {
      // Close modal and drawer
      setModalConfig({ isOpen: false, type: '', item: null });
      setSelectedApproval(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
        <div className="ceo-spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--ceo-border)', borderTopColor: 'var(--ceo-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--ceo-text-secondary)', fontSize: '14px', fontWeight: 500 }}>Loading live approvals systems...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', gap: '16px', textAlign: 'center', padding: '24px' }}>
        <AlertCircle size={48} color="var(--ceo-danger)" />
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}>System Integration Error</h2>
        <p style={{ color: 'var(--ceo-text-secondary)', maxWidth: '400px', fontSize: '14px' }}>{error}</p>
        <button className="ceo-btn ceo-btn-primary" onClick={fetchApprovals}>Retry Connection</button>
      </div>
    );
  }

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
          data={[
            ...approvals,
            ...promotions.map(pr => ({
              id: pr.id,
              type: 'Promotions',
              requestedBy: pr.name,
              dept: 'HR',
              amount: `${pr.current} ➔ ${pr.proposed}`,
              submittedAt: 'Recent',
              status: pr.status === 'pending_ceo' ? 'Pending' : pr.status === 'approved_by_ceo' ? 'Approved' : 'Denied',
              urgency: 'Normal',
              auditTrail: [{ action: "Promotion Proposed", time: "Recent", user: "HR" }]
            }))
          ]}
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

