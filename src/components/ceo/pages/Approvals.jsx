import React, { useState } from 'react';
import { 
  CheckCircle, XCircle, Search, Filter, MessageSquare, Clock, ArrowRight, User
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const mockApprovals = [
  { id: "APP-1001", type: "Payroll", requestedBy: "HR Department", dept: "HR", urgency: "Critical", submittedAt: "10 mins ago", amount: "₹24.5M" },
  { id: "APP-1002", type: "Budget", requestedBy: "David L.", dept: "Marketing", urgency: "High", submittedAt: "2 hours ago", amount: "₹1.5M" },
  { id: "APP-1003", type: "Resignation", requestedBy: "Amit P.", dept: "Sales", urgency: "High", submittedAt: "1 day ago" },
  { id: "APP-1004", type: "Policy", requestedBy: "Legal Team", dept: "Legal", urgency: "Normal", submittedAt: "2 days ago" }
];

const mockAuditTrail = [
  { time: "Oct 24, 10:15 AM", user: "Rajiv S.", action: "Request Created" },
  { time: "Oct 24, 10:20 AM", user: "Priya M. (TL)", action: "Approved at Level 1" },
  { time: "Oct 24, 11:00 AM", user: "HR System", action: "Flagged for CEO Approval (High Value)" },
];

const TABS = ['All', 'Payroll', 'Budget', 'Resignation', 'Policy'];

export default function Approvals() {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedApproval, setSelectedApproval] = useState(null); // Used to open drawer

  const toggleSelection = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === mockApprovals.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(mockApprovals.map(a => a.id)));
    }
  };

  const filteredApprovals = mockApprovals.filter(a => activeTab === 'All' || a.type === activeTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Approval Inbox</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Review, track, and authorize cross-department requests.</p>
      </div>

      {/* GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedApproval ? '1fr 420px' : '1fr',
        gridTemplateRows: '56px 1fr',
        gridTemplateAreas: selectedApproval ? `
          "filter drawer"
          "list drawer"
        ` : `
          "filter"
          "list"
        `,
        gap: '24px',
        flex: 1,
        transition: 'all 0.3s ease'
      }}>
        
        {/* TOP: FILTER TABS */}
        <div style={{ gridArea: 'filter', display: 'flex', gap: '8px', borderBottom: '1px solid var(--ceo-border)' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                background: activeTab === tab ? 'var(--tab-active-bg)' : 'transparent',
                color: activeTab === tab ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid var(--ceo-primary)' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* LEFT: LIST */}
        <div className="ceo-command-panel" style={{ gridArea: 'list', overflowY: 'auto' }}>
          <div className="ceo-command-header">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', width: '100%' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                <Search size={16} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input type="text" className="ceo-form-input" placeholder="Search approvals..." style={{ paddingLeft: '36px', height: '40px' }} />
              </div>
              <button className="ceo-btn" style={{ padding: '8px 12px' }}><Filter size={16}/> Filters</button>
              
              <div style={{ flex: 1 }}></div>

              {selectedIds.size > 0 && (
                <button className="ceo-btn ceo-btn-primary" style={{ padding: '8px 16px' }}>
                  Bulk Approve ({selectedIds.size})
                </button>
              )}
            </div>
          </div>
          <div className="ceo-command-content" style={{ padding: 0 }}>
            <table className="ceo-erp-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input type="checkbox" checked={selectedIds.size === filteredApprovals.length && filteredApprovals.length > 0} onChange={toggleAll} />
                  </th>
                  <th>Request ID</th>
                  <th>Type</th>
                  <th>Requested By</th>
                  <th>Details</th>
                  <th>Urgency</th>
                </tr>
              </thead>
              <tbody>
                {filteredApprovals.map(item => (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedApproval(item)}
                    style={{ 
                      background: (selectedApproval?.id === item.id) ? 'var(--ceo-hover)' : 'var(--ceo-card-bg)',
                      cursor: 'pointer'
                    }}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => toggleSelection(item.id)} />
                    </td>
                    <td><span className="ceo-typography-meta">{item.id}</span></td>
                    <td style={{ fontWeight: 600 }}>{item.type}</td>
                    <td>
                      <div>{item.requestedBy}</div>
                      <div className="ceo-typography-meta">{item.dept}</div>
                    </td>
                    <td>
                      <div className="ceo-typography-body">{item.amount ? `Total: ${item.amount}` : '-'}</div>
                      <div className="ceo-typography-meta"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/>{item.submittedAt}</div>
                    </td>
                    <td>
                      <span className={`ceo-badge ${item.urgency === 'Critical' ? 'critical' : item.urgency === 'High' ? 'warning' : 'neutral'}`}>{item.urgency}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: DRAWER */}
        {selectedApproval && (
          <div className="ceo-command-panel" style={{ gridArea: 'drawer', borderLeft: '1px solid var(--ceo-border)', boxShadow: '-4px 0 15px rgba(0,0,0,0.05)' }}>
            
            {/* Drawer Header */}
            <div className="ceo-command-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span className="ceo-typography-meta" style={{ letterSpacing: '0.5px' }}>REQUEST DETAILS</span>
                <button className="ceo-btn" onClick={() => setSelectedApproval(null)} style={{ padding: '4px', border: 'none', background: 'transparent' }}><XCircle size={20} color="var(--ceo-text-muted)"/></button>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{selectedApproval.type} Approval</div>
              <span className={`ceo-badge ${selectedApproval.urgency === 'Critical' ? 'critical' : selectedApproval.urgency === 'High' ? 'warning' : 'neutral'}`}>
                {selectedApproval.urgency} Priority
              </span>
            </div>

            {/* Drawer Content */}
            <div className="ceo-command-content" style={{ padding: '24px', overflowY: 'auto' }}>
              
              <div style={{ marginBottom: '24px' }}>
                <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '12px' }}>Requestor</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--ceo-bg)', borderRadius: '8px', border: '1px solid var(--ceo-border)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '20px', background: 'var(--ceo-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    <User size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600 }}>{selectedApproval.requestedBy}</div>
                    <div className="ceo-typography-meta">{selectedApproval.dept}</div>
                  </div>
                </div>
              </div>

              {selectedApproval.amount && (
                <div style={{ marginBottom: '24px' }}>
                  <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '8px' }}>Total Amount</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ceo-primary)' }}>{selectedApproval.amount}</div>
                </div>
              )}

              <div style={{ marginBottom: '32px' }}>
                <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>Audit Trail</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                  {/* Vertical Timeline Line */}
                  <div style={{ position: 'absolute', left: '7px', top: '8px', bottom: '8px', width: '2px', background: 'var(--ceo-border)', zIndex: 0 }}></div>
                  
                  {mockAuditTrail.map((audit, i) => (
                    <div key={i} style={{ display: 'flex', gap: '16px', zIndex: 1 }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '8px', background: i === mockAuditTrail.length-1 ? 'var(--ceo-primary)' : 'var(--ceo-bg)', border: `2px solid ${i === mockAuditTrail.length-1 ? 'var(--ceo-primary)' : 'var(--ceo-border)'}`, marginTop: '2px' }}></div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '13px' }}>{audit.action}</div>
                        <div className="ceo-typography-meta" style={{ marginTop: '2px' }}>{audit.user} • {audit.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Area */}
              <div style={{ borderTop: '1px solid var(--ceo-border)', paddingTop: '24px' }}>
                <div className="ceo-form-group">
                  <label>Add Comment (Optional)</label>
                  <textarea className="ceo-form-input" rows={3} placeholder="Provide reasoning if rejecting..."></textarea>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="ceo-btn" style={{ flex: 1, borderColor: 'var(--ceo-danger)', color: 'var(--ceo-danger)' }} onClick={() => setSelectedApproval(null)}>Reject</button>
                  <button className="ceo-btn ceo-btn-primary" style={{ flex: 2 }} onClick={() => setSelectedApproval(null)}>Approve Request</button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
