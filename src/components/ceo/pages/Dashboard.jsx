import React, { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Users, IndianRupee, AlertCircle, 
  CheckCircle, Clock, Search, Layers, FileText
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA FOR ENTERPRISE SPEC
// ==========================================
const kpiData = [
  { id: 'hc', label: "Total Headcount", value: "842", trend: "up", trendValue: "+4%", icon: Users, color: "var(--ceo-primary)" },
  { id: 'pr', label: "Monthly Payroll", value: "₹24.5M", trend: "up", trendValue: "+2%", icon: IndianRupee, color: "var(--ceo-danger)" },
  { id: 'pj', label: "Active Projects", value: "34", trend: "flat", trendValue: "0", icon: Layers, color: "var(--ceo-purple)" },
  { id: 'es', label: "Escalations", value: "3", trend: "down", trendValue: "-2", icon: AlertCircle, color: "var(--ceo-warning)" },
];

const pendingApprovals = [
  { id: "A-102", type: "Capex", by: "Rajiv S.", dept: "IT Infrastructure", urgency: "High", date: "2h ago" },
  { id: "A-103", type: "Policy", by: "Anita M.", dept: "HR", urgency: "Normal", date: "4h ago" },
  { id: "A-104", type: "Budget", by: "David L.", dept: "Marketing", urgency: "Normal", date: "1d ago" },
  { id: "A-105", type: "Resignation", by: "Amit P.", dept: "Sales", urgency: "High", date: "1d ago" },
];

const escalations = [
  { id: "E-401", severity: "CRITICAL", module: "Payroll", msg: "Payroll processing blocked by HR maker approval timeout.", time: "15m ago" },
  { id: "E-402", severity: "HIGH", module: "Projects", msg: "Data Center Upgrade exceeded budget by 12%.", time: "1h ago" },
  { id: "E-403", severity: "MEDIUM", module: "Attendance", msg: "Sales GPS compliance dropped below 80%.", time: "3h ago" },
];

const depts = ["IT", "Sales", "HR", "Mktg", "Ops"];
const dates = Array.from({length: 14}, (_, i) => `May ${i+1}`);
// Generate heatmap data: [deptIndex][dateIndex] = attendance %
const heatmapData = depts.map(() => 
  dates.map(() => Math.floor(Math.random() * 20) + 80) // 80-100%
);

// ==========================================
// DASHBOARD COMPONENT
// ==========================================
export default function Dashboard() {
  const [selectedApprovals, setSelectedApprovals] = useState(new Set());
  const [approvalsList, setApprovalsList] = useState(pendingApprovals);

  const toggleApproval = (id) => {
    const next = new Set(selectedApprovals);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedApprovals(next);
  };

  const toggleAll = () => {
    if (selectedApprovals.size === approvalsList.length) {
      setSelectedApprovals(new Set());
    } else {
      setSelectedApprovals(new Set(approvalsList.map(a => a.id)));
    }
  };

  const handleApprove = (id) => {
    setApprovalsList(prev => prev.filter(a => a.id !== id));
    const next = new Set(selectedApprovals);
    next.delete(id);
    setSelectedApprovals(next);
  };

  const handleBulkApprove = () => {
    setApprovalsList(prev => prev.filter(a => !selectedApprovals.has(a.id)));
    setSelectedApprovals(new Set());
  };

  // Helper for heatmap colors based on %
  const getHeatmapColor = (percent) => {
    if (percent >= 95) return 'var(--ceo-success)';
    if (percent >= 85) return 'var(--ceo-warning)';
    return 'var(--ceo-danger)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Executive Command Center</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Real-time telemetry and enterprise oversight</p>
      </div>

      {/* CSS GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gridTemplateRows: 'auto 1fr auto',
        gridTemplateAreas: `
          "kpi  kpi  kpi  kpi"
          "appr appr esc  esc"
          "heat heat heat heat"
        `,
        gap: '24px',
        flex: 1
      }}>
        
        {/* ZONE: KPI STRIP */}
        <div style={{ gridArea: 'kpi', display: 'flex', gap: '24px' }}>
          {kpiData.map(kpi => (
            <div key={kpi.id} className="ceo-command-panel" style={{ flex: 1, padding: '20px 24px', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div className="ceo-typography-meta" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 800, marginTop: '8px', color: 'var(--ceo-text-primary)' }}>{kpi.value}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <kpi.icon size={24} color={kpi.color} />
                <span className={`ceo-badge ${kpi.trend === 'up' ? 'success' : kpi.trend === 'down' ? 'critical' : 'neutral'}`}>
                  {kpi.trend === 'up' ? <TrendingUp size={12}/> : kpi.trend === 'down' ? <TrendingDown size={12}/> : null}
                  {kpi.trendValue}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ZONE: PENDING APPROVALS */}
        <div className="ceo-command-panel" style={{ gridArea: 'appr', display: 'flex', flexDirection: 'column' }}>
          <div className="ceo-command-header" style={{ padding: '16px 24px' }}>
            <div className="ceo-typography-card-title">Pending Approvals ({approvalsList.length})</div>
            {selectedApprovals.size > 0 && (
              <button className="ceo-btn ceo-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleBulkApprove}>
                Bulk Approve ({selectedApprovals.size})
              </button>
            )}
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {approvalsList.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ceo-text-muted)' }}>
                <CheckCircle size={48} color="var(--ceo-success)" style={{ opacity: 0.2, marginBottom: '16px' }} />
                <div className="ceo-typography-body">All caught up! No pending approvals.</div>
              </div>
            ) : (
              <table className="ceo-erp-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={selectedApprovals.size === approvalsList.length} onChange={toggleAll} />
                    </th>
                    <th>Request</th>
                    <th>Requested By</th>
                    <th>Urgency</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {approvalsList.map(item => (
                    <tr key={item.id} style={{ background: selectedApprovals.has(item.id) ? 'var(--ceo-hover)' : '' }}>
                      <td>
                        <input type="checkbox" checked={selectedApprovals.has(item.id)} onChange={() => toggleApproval(item.id)} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.type}</div>
                        <div className="ceo-typography-meta">{item.date}</div>
                      </td>
                      <td>
                        <div>{item.by}</div>
                        <div className="ceo-typography-meta">{item.dept}</div>
                      </td>
                      <td>
                        <span className={`ceo-badge ${item.urgency === 'High' ? 'critical' : 'neutral'}`}>{item.urgency}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="ceo-btn" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => handleApprove(item.id)}>Approve</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ZONE: ESCALATION PANEL */}
        <div className="ceo-command-panel" style={{ gridArea: 'esc', display: 'flex', flexDirection: 'column' }}>
          <div className="ceo-command-header" style={{ padding: '16px 24px' }}>
            <div className="ceo-typography-card-title">Executive Escalations</div>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            {escalations.map(esc => (
              <div key={esc.id} style={{ 
                padding: '16px', 
                background: esc.severity === 'CRITICAL' ? '#FEF2F2' : esc.severity === 'HIGH' ? '#FFFBEB' : '#F8FAFC',
                borderLeft: `4px solid ${esc.severity === 'CRITICAL' ? 'var(--ceo-danger)' : esc.severity === 'HIGH' ? 'var(--ceo-warning)' : 'var(--ceo-border)'}`,
                borderTop: '1px solid var(--ceo-border)',
                borderRight: '1px solid var(--ceo-border)',
                borderBottom: '1px solid var(--ceo-border)',
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span className={`ceo-badge ${esc.severity === 'CRITICAL' ? 'critical' : esc.severity === 'HIGH' ? 'warning' : 'neutral'}`}>{esc.severity}</span>
                    <span className="ceo-typography-meta">{esc.module}</span>
                  </div>
                  <span className="ceo-typography-meta"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/>{esc.time}</span>
                </div>
                <div className="ceo-typography-body" style={{ fontWeight: 500, color: 'var(--ceo-text-primary)' }}>{esc.msg}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ZONE: ATTENDANCE HEATMAP */}
        <div className="ceo-command-panel" style={{ gridArea: 'heat' }}>
          <div className="ceo-command-header" style={{ padding: '12px 24px' }}>
            <div className="ceo-typography-card-title">Attendance Heatmap (Last 14 Days)</div>
          </div>
          <div style={{ padding: '16px 24px', overflowX: 'auto' }}>
            <div style={{ display: 'grid', gridTemplateColumns: `80px repeat(${dates.length}, 1fr)`, gap: '4px' }}>
              {/* Header Row */}
              <div></div>
              {dates.map((d, i) => (
                <div key={i} className="ceo-typography-meta" style={{ textAlign: 'center', fontSize: '10px' }}>{d}</div>
              ))}
              
              {/* Data Rows */}
              {depts.map((dept, dIdx) => (
                <React.Fragment key={dept}>
                  <div className="ceo-typography-meta" style={{ alignSelf: 'center', fontWeight: 600 }}>{dept}</div>
                  {heatmapData[dIdx].map((pct, pIdx) => (
                    <div key={pIdx} title={`${dept} - ${dates[pIdx]}: ${pct}%`} style={{
                      backgroundColor: getHeatmapColor(pct),
                      opacity: pct / 100,
                      height: '24px',
                      borderRadius: '4px',
                      transition: 'transform 0.1s',
                      cursor: 'pointer',
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    />
                  ))}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
