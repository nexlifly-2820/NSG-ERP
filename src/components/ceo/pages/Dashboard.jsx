import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Users, IndianRupee, AlertCircle, 
  CheckCircle, Clock, Layers, FileText
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// DASHBOARD COMPONENT (INTEGRATED WITH REAL DATA)
// ==========================================
export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summaryData, setSummaryData] = useState({
    headcount: 0,
    activeBlockers: 0,
    pendingApprovalsCount: 0,
    okrProgressAverage: 75,
    riskIndex: 'Low',
    monthlyPayroll: 0,
    activeProjects: 0
  });
  const [approvalsList, setApprovalsList] = useState([]);
  const [escalationsList, setEscalationsList] = useState([]);
  const [selectedApprovals, setSelectedApprovals] = useState(new Set());
  const [approvalPage, setApprovalPage] = useState(1);
  const approvalsPerPage = 5;
  const [escalationPage, setEscalationPage] = useState(1);
  const escalationsPerPage = 5;
  const [heatmapPage, setHeatmapPage] = useState(1);
  const heatmapPerPage = 5;
  
  // Heatmap state
  const [heatmapDepts, setHeatmapDepts] = useState([]);
  const [heatmapDataState, setHeatmapDataState] = useState([]);
  const [datesState, setDatesState] = useState([]);

  const token = localStorage.getItem('nsg_jwt_token');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Fetch summary
      const summaryRes = await fetch('/api/ceo-portal/dashboard/summary', { headers });
      const summaryVal = summaryRes.ok ? await summaryRes.json() : null;

      // 2. Fetch employees for mapping names
      const empRes = await fetch('/api/team-lead/team-members', { headers });
      const employees = empRes.ok ? await empRes.json() : [];

      // Create employee mapping: id -> {name, department}
      const empMap = {};
      employees.forEach(emp => {
        empMap[emp.id] = { name: emp.name, department: emp.department };
      });

      // 3. Fetch pending approvals
      const apprRes = await fetch('/api/ceo-portal/approvals/pending', { headers });
      const approvalsData = apprRes.ok ? await apprRes.json() : { payrollRuns: [], expenseClaims: [], leaveRequests: [], loans: [] };

      // Map pending approvals list
      const mappedPayroll = (approvalsData.payrollRuns || []).map(p => ({
        id: `PAY-${p.id}`,
        dbId: p.id,
        type: "Payroll Payout",
        by: p.maker_id || "HR Office",
        dept: "Finance",
        urgency: "High",
        date: p.maker_signed_at ? new Date(p.maker_signed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent",
        amount: `₹${(p.total_amount || 0).toLocaleString()}`,
        rawType: "payroll"
      }));

      const mappedExpenses = (approvalsData.expenseClaims || []).map(e => ({
        id: `EXP-${e.id}`,
        dbId: e.id,
        type: `Expense (${e.category})`,
        by: e.employee_name || empMap[e.user_id]?.name || `User #${e.user_id}`,
        dept: empMap[e.user_id]?.department || "Operations",
        urgency: e.amount > 10000 ? "High" : "Normal",
        date: e.claim_date || "Recent",
        amount: `₹${e.amount.toLocaleString()}`,
        rawType: "expense"
      }));

      const mappedLeaves = (approvalsData.leaveRequests || []).map(l => ({
        id: `LV-${l.id}`,
        dbId: l.id,
        type: `Leave (${l.leave_type})`,
        by: l.employee_name || empMap[l.user_id]?.name || `User #${l.user_id}`,
        dept: empMap[l.user_id]?.department || "HR",
        urgency: "Normal",
        date: `${l.from_date} to ${l.to_date}`,
        amount: `${l.days} days`,
        rawType: "leave"
      }));

      const mappedLoans = (approvalsData.loans || []).map(ln => ({
        id: `LN-${ln.id}`,
        dbId: ln.id,
        type: "Loan Request",
        by: ln.employee_name || empMap[ln.user_id]?.name || `User #${ln.user_id}`,
        dept: empMap[ln.user_id]?.department || "Finance",
        urgency: "High",
        date: ln.disbursed_at ? new Date(ln.disbursed_at).toLocaleDateString() : "Pending checker",
        amount: `₹${ln.loan_amount.toLocaleString()}`,
        rawType: "loan"
      }));

      const combinedApprovals = [...mappedPayroll, ...mappedExpenses, ...mappedLeaves, ...mappedLoans];

      // 4. Fetch escalations
      const escRes = await fetch('/api/ceo-portal/projects/escalations', { headers });
      const escalationsData = escRes.ok ? await escRes.json() : [];

      const mappedEscalations = escalationsData.filter(esc => !esc.resolved).map(esc => {
        let escTime = "Recent";
        if (esc.submitted_at) {
          const diffMs = new Date() - new Date(esc.submitted_at);
          const diffMin = Math.floor(diffMs / 60000);
          if (diffMin < 60) {
            escTime = `${diffMin}m ago`;
          } else {
            const diffHr = Math.floor(diffMin / 60);
            if (diffHr < 24) {
              escTime = `${diffHr}h ago`;
            } else {
              escTime = `${Math.floor(diffHr / 24)}d ago`;
            }
          }
        }
        return {
          id: `E-${esc.id}`,
          severity: esc.severity || "MEDIUM",
          module: esc.dependencies || "System",
          msg: esc.title,
          time: escTime,
          tl_name: esc.tl_name,
          ceo_viewed: esc.ceo_viewed
        };
      });

      // 5. Fetch heatmap data from optimized API
      const fallbackDepts = ["Sales", "Engineering", "Marketing", "HR", "Finance"];
      const heatRes = await fetch('/api/ceo-portal/dashboard/heatmap', { headers });
      const heatData = heatRes.ok ? await heatRes.json() : { dates: [], departments: fallbackDepts, data: fallbackDepts.map(() => [0,0,0,0,0,0,0,0,0,0,0,0,0,0]) };

      // Save to states
      if (summaryVal) {
        setSummaryData(summaryVal);
      } else {
        setSummaryData({
          headcount: employees.length || 0,
          activeBlockers: mappedEscalations.length,
          pendingApprovalsCount: combinedApprovals.length,
          okrProgressAverage: 0,
          riskIndex: mappedEscalations.length <= 2 ? 'Low' : 'High',
          monthlyPayroll: 0,
          activeProjects: 0
        });
      }
      setApprovalsList(combinedApprovals);
      setEscalationsList(mappedEscalations);
      setDatesState(heatData.dates);
      setHeatmapDataState(heatData.data);
      setHeatmapDepts(heatData.departments || []);

    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to fetch live database metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const handleApprove = async (id) => {
    const item = approvalsList.find(a => a.id === id);
    if (!item) return;

    try {
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      let res;
      if (item.rawType === "payroll") {
        res = await fetch(`/api/ceo-portal/payroll/runs/${item.dbId}/sign-checker`, { method: 'POST', headers });
      } else if (item.rawType === "expense") {
        res = await fetch(`/api/ceo-portal/expenses/${item.dbId}/approve`, { method: 'POST', headers });
      } else if (item.rawType === "leave") {
        res = await fetch(`/api/ceo-portal/leaves/${item.dbId}/approve`, { method: 'POST', headers });
      } else if (item.rawType === "loan") {
        res = await fetch(`/api/ceo-portal/loans/${item.dbId}/approve`, { method: 'POST', headers });
      }

      if (res && res.ok) {
        setApprovalsList(prev => prev.filter(a => a.id !== id));
        // Refresh summary
        const summaryRes = await fetch('/api/ceo-portal/dashboard/summary', { headers });
        if (summaryRes.ok) {
          const s = await summaryRes.json();
          setSummaryData(s);
        }
        window.toast.success(`✅ ${item.type} approved successfully!`);
      } else {
        const err = res ? await res.json().catch(() => ({})) : {};
        window.toast.error(`❌ Failed to approve: ${err.detail || 'Server error'}`);
      }
    } catch (e) {
      console.error(e);
      window.toast.error('❌ Connection failed.');
    }
  };

  const handleResolveEscalation = async (escId, dbId) => {
    try {
      const res = await fetch(`/api/ceo-portal/projects/escalations/${dbId}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEscalationsList(prev => prev.filter(e => e.id !== escId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAcknowledgeEscalation = async (escId, dbId) => {
    try {
      const res = await fetch(`/api/ceo-portal/projects/escalations/${dbId}/acknowledge`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEscalationsList(prev => prev.map(e => e.id === escId ? { ...e, ceo_viewed: true } : e));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDismissEscalation = async (escId, dbId) => {
    if (!window.confirm("Are you sure you want to reject this escalation?")) return;
    try {
      const res = await fetch(`/api/ceo-portal/projects/escalations/${dbId}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setEscalationsList(prev => prev.filter(e => e.id !== escId));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkApprove = async () => {
    const itemsToApprove = approvalsList.filter(a => selectedApprovals.has(a.id));
    if (itemsToApprove.length === 0) return;

    const headers = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    let successCount = 0;
    for (const item of itemsToApprove) {
      try {
        let res;
        if (item.rawType === "payroll") {
          res = await fetch(`/api/ceo-portal/payroll/runs/${item.dbId}/sign-checker`, { method: 'POST', headers });
        } else if (item.rawType === "expense") {
          res = await fetch(`/api/ceo-portal/expenses/${item.dbId}/approve`, { method: 'POST', headers });
        } else if (item.rawType === "leave") {
          res = await fetch(`/api/ceo-portal/leaves/${item.dbId}/approve`, { method: 'POST', headers });
        } else if (item.rawType === "loan") {
          res = await fetch(`/api/ceo-portal/loans/${item.dbId}/approve`, { method: 'POST', headers });
        }
        if (res && res.ok) successCount++;
      } catch (e) {
        console.error(e);
      }
    }

    fetchData();
    setSelectedApprovals(new Set());
    window.toast.success(`✅ Bulk action complete: ${successCount} of ${itemsToApprove.length} approvals processed successfully.`);
  };

  // Helper for heatmap colors based on %
  const getHeatmapColor = (percent) => {
    if (percent >= 95) return 'var(--ceo-success)';
    if (percent >= 85) return 'var(--ceo-warning)';
    return 'var(--ceo-danger)';
  };

  // Dynamic KPI mapping
  const formatCurrency = (val) => {
    if (val >= 1000000) return `₹${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  const kpiData = [
    { id: 'hc', label: "TOTAL EMPLOYEES", value: summaryData.headcount.toString(), trend: "up", trendValue: "+4%", icon: Users, color: "var(--ceo-primary)" },
    { id: 'pr', label: "Monthly Payroll", value: formatCurrency(summaryData.monthlyPayroll || 0), trend: "up", trendValue: "+2%", icon: IndianRupee, color: "var(--ceo-danger)" },
    { id: 'pj', label: "Active Projects", value: (summaryData.activeProjects || 0).toString(), trend: "flat", trendValue: "0", icon: Layers, color: "var(--ceo-purple)" },
    { id: 'es', label: "Escalations", value: summaryData.activeBlockers.toString(), trend: summaryData.activeBlockers > 0 ? "up" : "down", trendValue: summaryData.activeBlockers > 0 ? `+${summaryData.activeBlockers}` : "0", icon: AlertCircle, color: "var(--ceo-warning)" },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '12px' }}>
        <Clock className="animate-spin" size={32} color="var(--ceo-primary)" style={{ opacity: 0.6 }} />
        <div style={{ color: 'var(--ceo-text-secondary)', fontSize: '15px', fontWeight: 600 }}>
          Connecting to secure API server...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '12px' }}>
        <AlertCircle size={36} color="var(--ceo-danger)" />
        <div style={{ color: 'var(--ceo-danger)', fontSize: '15px', fontWeight: 600 }}>
          {error}
        </div>
        <button className="ceo-btn" onClick={fetchData} style={{ marginTop: '8px' }}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Executive Command Center</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Real-time telemetry and enterprise oversight</p>
      </div>

      {/* CSS GRID LAYOUT */}
      <div className="ceo-dashboard-grid" style={{
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
        <div className="ceo-kpi-strip" style={{ gridArea: 'kpi', display: 'flex', gap: '24px' }}>
          {kpiData.map(kpi => (
            <div key={kpi.id} className="ceo-command-panel kpi-panel" style={{ flex: 1 }}>
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
          <div className="ceo-command-header" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="ceo-typography-card-title">Pending Approvals ({approvalsList.length})</div>
              <button 
                style={{ padding: '4px 10px', fontSize: '12px', background: 'transparent', border: '1px solid var(--ceo-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--ceo-primary)', fontWeight: 600, transition: 'all 0.2s' }} 
                onMouseOver={(e) => e.target.style.background = 'var(--ceo-hover)'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
                onClick={() => window.location.hash = '#/CEO/approvals'}
              >
                View All
              </button>
            </div>
            {selectedApprovals.size > 0 && (
              <button className="ceo-btn ceo-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleBulkApprove}>
                Bulk Approve ({selectedApprovals.size})
              </button>
            )}
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1, minHeight: '350px' }}>
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
                  {approvalsList.slice((approvalPage - 1) * approvalsPerPage, approvalPage * approvalsPerPage).map(item => (
                    <tr key={item.id} style={{ background: selectedApprovals.has(item.id) ? 'var(--ceo-hover)' : '' }}>
                      <td>
                        <input type="checkbox" checked={selectedApprovals.has(item.id)} onChange={() => toggleApproval(item.id)} />
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.type}</div>
                        <div className="ceo-typography-meta">{item.amount || item.date}</div>
                      </td>
                      <td>
                        <div>{item.by}</div>
                        <div className="ceo-typography-meta">{item.dept}</div>
                      </td>
                      <td>
                        <span className={`ceo-badge ${item.urgency === 'Critical' || item.urgency === 'High' ? 'critical' : 'neutral'}`}>{item.urgency}</span>
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
          {approvalsList.length > approvalsPerPage && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', borderTop: '1px solid var(--ceo-border)', gap: '16px' }}>
              <button 
                disabled={approvalPage === 1}
                onClick={() => setApprovalPage(p => p - 1)}
                className="ceo-btn" style={{ padding: '4px 12px', opacity: approvalPage === 1 ? 0.5 : 1 }}
              >Prev</button>
              <span className="ceo-typography-meta">Page {approvalPage} of {Math.ceil(approvalsList.length / approvalsPerPage)}</span>
              <button 
                disabled={approvalPage === Math.ceil(approvalsList.length / approvalsPerPage)}
                onClick={() => setApprovalPage(p => p + 1)}
                className="ceo-btn" style={{ padding: '4px 12px', opacity: approvalPage === Math.ceil(approvalsList.length / approvalsPerPage) ? 0.5 : 1 }}
              >Next</button>
            </div>
          )}
        </div>

        {/* ZONE: ESCALATION PANEL */}
        <div className="ceo-command-panel" style={{ gridArea: 'esc', display: 'flex', flexDirection: 'column' }}>
          <div className="ceo-command-header" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="ceo-typography-card-title">Executive Escalations</div>
              <button 
                style={{ padding: '4px 10px', fontSize: '12px', background: 'transparent', border: '1px solid var(--ceo-border)', borderRadius: '6px', cursor: 'pointer', color: 'var(--ceo-primary)', fontWeight: 600, transition: 'all 0.2s' }} 
                onMouseOver={(e) => e.target.style.background = 'var(--ceo-hover)'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
                onClick={() => window.location.hash = '#/CEO/projects'}
              >
                View All
              </button>
            </div>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1, minHeight: '350px' }}>
            {escalationsList.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ceo-text-muted)', opacity: 0.5 }}>
                <CheckCircle size={36} color="var(--ceo-success)" style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '13px' }}>No active blockages reported.</div>
              </div>
            ) : (
              escalationsList.slice((escalationPage - 1) * escalationsPerPage, escalationPage * escalationsPerPage).map(esc => (
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
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="ceo-typography-meta"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/>{esc.time}</span>
                      {!esc.ceo_viewed && (
                        <button className="ceo-btn" style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--ceo-primary)', color: '#FFF', border: 'none' }} onClick={() => handleAcknowledgeEscalation(esc.id, esc.id.replace('E-', ''))}>Acknowledge</button>
                      )}
                      <button className="ceo-btn" style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--ceo-success)', color: '#FFF', border: 'none' }} onClick={() => handleResolveEscalation(esc.id, esc.id.replace('E-', ''))}>Resolve</button>
                      <button className="ceo-btn" style={{ padding: '2px 8px', fontSize: '11px', background: 'var(--ceo-danger)', color: '#FFF', border: 'none', opacity: 0.8 }} onClick={() => handleDismissEscalation(esc.id, esc.id.replace('E-', ''))}>Reject</button>
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: '4px' }}>Raised by: {esc.tl_name}</div>
                  <div className="ceo-typography-body" style={{ fontWeight: 500, color: 'var(--ceo-text-primary)' }}>{esc.msg}</div>
                </div>
              ))
            )}
          </div>
          {escalationsList.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', borderTop: '1px solid var(--ceo-border)', gap: '16px' }}>
              <button 
                disabled={escalationPage === 1}
                onClick={() => setEscalationPage(p => p - 1)}
                className="ceo-btn" style={{ padding: '4px 12px', opacity: escalationPage === 1 ? 0.5 : 1 }}
              >Prev</button>
              <span className="ceo-typography-meta">Page {escalationPage} of {Math.ceil(escalationsList.length / escalationsPerPage)}</span>
              <button 
                disabled={escalationPage === Math.ceil(escalationsList.length / escalationsPerPage)}
                onClick={() => setEscalationPage(p => p + 1)}
                className="ceo-btn" style={{ padding: '4px 12px', opacity: escalationPage === Math.ceil(escalationsList.length / escalationsPerPage) ? 0.5 : 1 }}
              >Next</button>
            </div>
          )}
        </div>

        {/* ZONE: ATTENDANCE HEATMAP */}
        <div className="ceo-command-panel" style={{ gridArea: 'heat', overflow: 'hidden' }}>
          <div className="ceo-command-header" style={{ padding: '24px 32px', borderBottom: 'none' }}>
            <div className="ceo-typography-card-title" style={{ fontSize: '18px' }}>Department Wise Attendance (Last 14 Days)</div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #10B981, #059669)', boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)' }}></div>
                <span className="ceo-typography-meta" style={{ fontWeight: 600, fontSize: '13px' }}>95-100% (Healthy)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #FBBF24, #D97706)', boxShadow: '0 2px 4px rgba(245, 158, 11, 0.2)' }}></div>
                <span className="ceo-typography-meta" style={{ fontWeight: 600, fontSize: '13px' }}>85-94% (Warning)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'linear-gradient(135deg, #EF4444, #DC2626)', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.2)' }}></div>
                <span className="ceo-typography-meta" style={{ fontWeight: 600, fontSize: '13px' }}>&lt;85% (Critical)</span>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 0 12px 0', overflowX: 'auto', minHeight: '350px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '0 24px 16px 32px', textAlign: 'left', borderBottom: '2px solid var(--ceo-border)' }}></th>
                  {datesState.map((d, i) => (
                    <th key={i} style={{ padding: '0 8px 16px 8px', textAlign: 'center', borderBottom: '2px solid var(--ceo-border)' }}>
                      <div className="ceo-typography-meta" style={{ fontWeight: 700, color: 'var(--ceo-text-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {d.split(' ')[0]}<br/>
                        <span style={{ fontSize: '14px', color: 'var(--ceo-text-primary)' }}>{d.split(' ')[1]}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapDepts.slice((heatmapPage - 1) * heatmapPerPage, heatmapPage * heatmapPerPage).map((dept, idx) => {
                  const dIdx = (heatmapPage - 1) * heatmapPerPage + idx;
                  return (
                  <tr key={dept} style={{ transition: 'background 0.2s ease', borderBottom: '1px solid var(--ceo-border)' }}
                      onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--ceo-hover)'}
                      onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '16px 24px 16px 32px', fontWeight: 600, color: 'var(--ceo-text-secondary)', fontSize: '14px' }}>
                      {dept}
                    </td>
                    {heatmapDataState[dIdx] && heatmapDataState[dIdx].map((pct, pIdx) => (
                      <td key={pIdx} style={{ padding: '12px 8px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', justifyContent: 'center' }}>
                          <div title={`${dept} - ${datesState[pIdx]}: ${pct}%`} style={{
                            background: pct >= 95 ? 'linear-gradient(135deg, #10B981, #059669)' : pct >= 85 ? 'linear-gradient(135deg, #FBBF24, #D97706)' : 'linear-gradient(135deg, #EF4444, #DC2626)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            boxShadow: pct >= 95 ? '0 4px 6px rgba(16, 185, 129, 0.2)' : pct >= 85 ? '0 4px 6px rgba(245, 158, 11, 0.2)' : '0 4px 6px rgba(239, 68, 68, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#ffffff',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.2)'
                          }}
                          onMouseOver={(e) => { 
                            e.currentTarget.style.transform = 'scale(1.15) translateY(-2px)'; 
                            e.currentTarget.style.boxShadow = pct >= 95 ? '0 8px 12px rgba(16, 185, 129, 0.4)' : pct >= 85 ? '0 8px 12px rgba(245, 158, 11, 0.4)' : '0 8px 12px rgba(239, 68, 68, 0.4)';
                            e.currentTarget.style.zIndex = '10';
                            e.currentTarget.style.position = 'relative';
                          }}
                          onMouseOut={(e) => { 
                            e.currentTarget.style.transform = 'scale(1) translateY(0)'; 
                            e.currentTarget.style.boxShadow = pct >= 95 ? '0 4px 6px rgba(16, 185, 129, 0.2)' : pct >= 85 ? '0 4px 6px rgba(245, 158, 11, 0.2)' : '0 4px 6px rgba(239, 68, 68, 0.2)';
                            e.currentTarget.style.zIndex = '1';
                          }}
                          >
                            {pct}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          {heatmapDepts.length > heatmapPerPage && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '12px', borderTop: '1px solid var(--ceo-border)', gap: '16px' }}>
              <button 
                disabled={heatmapPage === 1}
                onClick={() => setHeatmapPage(p => p - 1)}
                className="ceo-btn" style={{ padding: '4px 12px', opacity: heatmapPage === 1 ? 0.5 : 1 }}
              >Prev</button>
              <span className="ceo-typography-meta">Page {heatmapPage} of {Math.ceil(heatmapDepts.length / heatmapPerPage)}</span>
              <button 
                disabled={heatmapPage === Math.ceil(heatmapDepts.length / heatmapPerPage)}
                onClick={() => setHeatmapPage(p => p + 1)}
                className="ceo-btn" style={{ padding: '4px 12px', opacity: heatmapPage === Math.ceil(heatmapDepts.length / heatmapPerPage) ? 0.5 : 1 }}
              >Next</button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
