import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckSquare, XSquare, Clock, Filter, Search, ChevronRight, 
  FileText, ShieldCheck, AlertTriangle, AlertOctagon, CheckCircle,
  FileSignature, DollarSign, Briefcase, Zap, User, ArrowRight, Settings, BarChart2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const kpiStripData = [
  { title: "Pending Approvals", value: "14", trend: "down", percent: "2", color: "#F59E0B" },
  { title: "Avg Resolution Time", value: "4.2h", trend: "up", percent: "1.1h", color: "#10B981" },
  { title: "Approved (This Wk)", value: "86", trend: "up", percent: "12%", color: "#2563EB" },
  { title: "Rejected (This Wk)", value: "5", trend: "down", percent: "1%", color: "#EF4444" },
  { title: "Capital Allocation", value: "₹18.4M", trend: "up", percent: "4%", color: "#8B5CF6" },
];

const approvalsList = [
  { id: "REQ-2041", type: "Capex Request", amount: "₹4.5M", dept: "IT Infra", reqBy: "Sarah Connor", date: "Today, 10:30 AM", priority: "High", urgency: "critical" },
  { id: "REQ-2042", type: "New Hire VP", amount: "₹2.4M (CTC)", dept: "Marketing", reqBy: "Jane Smith", date: "Yesterday", priority: "Normal", urgency: "normal" },
  { id: "REQ-2043", type: "Vendor Contract", amount: "₹1.2M", dept: "Legal", reqBy: "Harvey Specter", date: "28 May 2026", priority: "High", urgency: "high" },
  { id: "REQ-2044", type: "Budget Revision", amount: "+15%", dept: "Sales", reqBy: "Mike Ross", date: "27 May 2026", priority: "Normal", urgency: "normal" },
  { id: "REQ-2045", type: "Travel Approval", amount: "₹0.8M", dept: "Executive", reqBy: "John Doe", date: "25 May 2026", priority: "Low", urgency: "normal" },
];

const chartData = [
  { name: 'Mon', approved: 24, rejected: 1 },
  { name: 'Tue', approved: 18, rejected: 2 },
  { name: 'Wed', approved: 35, rejected: 0 },
  { name: 'Thu', approved: 12, rejected: 1 },
  { name: 'Fri', approved: 28, rejected: 3 },
];

// ==========================================
// ANIMATION VARIANTS
// ==========================================
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// ==========================================
// COMPONENTS
// ==========================================

export default function Approvals() {
  const [selectedReq, setSelectedReq] = useState(approvalsList[0]);

  const getUrgencyBadge = (urgency, priority) => {
    switch(urgency) {
      case 'critical': return <span className="ceo-badge critical">{priority}</span>;
      case 'high': return <span className="ceo-badge warning">{priority}</span>;
      default: return <span className="ceo-badge neutral">{priority}</span>;
    }
  };

  return (
    <div style={{ padding: '0 32px 32px 32px', maxWidth: '1800px', margin: '0 auto', color: 'var(--ceo-text-primary)' }}>
      
      {/* SECTION 1: Executive Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', borderBottom: '1px solid var(--ceo-border)', paddingBottom: '24px' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="ceo-badge neutral">Executive Portal</span>
            <ChevronRight size={14} color="var(--ceo-text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Workflow Operations</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Approval Command Center</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="ceo-btn"><Settings size={16} /> Workflow Rules</button>
          <button className="ceo-btn ceo-btn-primary"><CheckCircle size={16} /> Bulk Approve (14)</button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 2: Approvals KPI Strip */}
        <motion.div variants={itemVariants} className="ceo-kpi-strip">
          {kpiStripData.map((kpi, idx) => (
            <div key={idx} className="ceo-kpi-strip-item">
              <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ceo-text-primary)' }}>{kpi.value}</span>
                <span style={{ display: 'flex', alignItems: 'center', color: kpi.color, fontSize: '12px', fontWeight: 600, background: `${kpi.color}15`, padding: '2px 6px', borderRadius: '4px' }}>
                  {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'} {kpi.percent}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* SECTION 3: Split Screen - Approvals Queue & Request Details */}
        <div className="ceo-split-layout">
          
          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-left" style={{ flex: 1.2 }}>
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><Clock size={18} color="var(--ceo-warning)" /> Pending Request Queue</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '10px', top: '8px' }} />
                  <input type="text" placeholder="Search ID..." className="ceo-form-input" style={{ width: '120px', padding: '6px 12px 6px 30px' }} />
                </div>
                <button className="ceo-btn" style={{ padding: '6px 12px' }}><Filter size={14} /> Filter</button>
              </div>
            </div>
            
            <div className="ceo-command-content" style={{ padding: 0, overflowY: 'auto', height: '600px' }}>
              {approvalsList.map((req, i) => (
                <div 
                  key={i} 
                  onClick={() => setSelectedReq(req)}
                  style={{ 
                    padding: '20px 24px', 
                    borderBottom: '1px solid var(--ceo-border)', 
                    cursor: 'pointer', 
                    background: selectedReq?.id === req.id ? 'var(--ceo-bg)' : 'transparent',
                    borderLeft: selectedReq?.id === req.id ? '4px solid var(--ceo-primary)' : '4px solid transparent',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--ceo-text-muted)' }}>{req.id}</span>
                      {getUrgencyBadge(req.urgency, req.priority)}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--ceo-text-muted)' }}>{req.date}</span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px' }}>{req.type} - {req.dept}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ceo-text-secondary)' }}>
                      <User size={12} /> {req.reqBy}
                    </div>
                    <div style={{ fontSize: '14px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--ceo-text-primary)' }}>{req.amount}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-right" style={{ flex: 1.8 }}>
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><FileSignature size={18} color="var(--ceo-purple)" /> Request Details</div>
            </div>
            
            {selectedReq ? (
              <div className="ceo-command-content" style={{ display: 'flex', flexDirection: 'column' }}>
                
                {/* Request Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: '1px solid var(--ceo-border)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span className="ceo-badge neutral">{selectedReq.id}</span>
                      <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>Submitted: {selectedReq.date}</span>
                    </div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '0 0 8px 0' }}>{selectedReq.type}</h2>
                    <div style={{ fontSize: '14px', color: 'var(--ceo-text-secondary)' }}>Requested by {selectedReq.reqBy} • {selectedReq.dept}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--ceo-text-muted)', fontWeight: 600, marginBottom: '4px' }}>Requested Amount</div>
                    <div style={{ fontSize: '28px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--ceo-success)' }}>{selectedReq.amount}</div>
                  </div>
                </div>

                {/* Justification & Details */}
                <div style={{ padding: '24px 0', borderBottom: '1px solid var(--ceo-border)', flex: 1 }}>
                  <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--ceo-text-muted)', fontWeight: 600, marginBottom: '12px' }}>Business Justification</h3>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--ceo-text-primary)', marginBottom: '24px' }}>
                    This capital expenditure is required to upgrade the primary database cluster in Region-2. The current infrastructure is operating at 92% capacity and risks throttling during the upcoming Q3 traffic spike.
                  </p>
                  
                  <div className="ceo-matrix-grid">
                    <div className="ceo-matrix-cell">
                      <div style={{ fontSize: '11px', color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Budget Impact</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>Within Q2 IT Budget</div>
                    </div>
                    <div className="ceo-matrix-cell">
                      <div style={{ fontSize: '11px', color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>ROI Projection</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>14 Months</div>
                    </div>
                    <div className="ceo-matrix-cell">
                      <div style={{ fontSize: '11px', color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Alternative Considered</div>
                      <div style={{ fontSize: '14px', fontWeight: 600 }}>Cloud Bursting (More Exp.)</div>
                    </div>
                  </div>
                </div>

                {/* Attachments */}
                <div style={{ padding: '24px 0', borderBottom: '1px solid var(--ceo-border)' }}>
                  <h3 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--ceo-text-muted)', fontWeight: 600, marginBottom: '12px' }}>Attachments & Supporting Docs</h3>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '8px', cursor: 'pointer' }}>
                      <FileText size={16} color="var(--ceo-primary)" />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Vendor_Quote_v2.pdf</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '8px', cursor: 'pointer' }}>
                      <BarChart2 size={16} color="var(--ceo-success)" />
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>Capacity_Forecast.xlsx</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ paddingTop: '24px', display: 'flex', gap: '16px' }}>
                  <button style={{ flex: 1, background: 'var(--ceo-success)', color: 'white', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CheckSquare size={18} /> Approve Request
                  </button>
                  <button style={{ flex: 1, background: '#FEF2F2', color: 'var(--ceo-danger)', border: '1px solid #FECACA', padding: '14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <XSquare size={18} /> Reject
                  </button>
                  <button style={{ background: 'var(--ceo-card-bg)', color: 'var(--ceo-text-primary)', border: '1px solid var(--ceo-border)', padding: '14px 20px', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    Request Info
                  </button>
                </div>

              </div>
            ) : (
              <div className="ceo-command-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ceo-text-muted)' }}>
                Select a request from the queue to view details
              </div>
            )}
          </motion.div>

        </div>

      </motion.div>
    </div>
  );
}
