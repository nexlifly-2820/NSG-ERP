import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  IndianRupee, TrendingUp, TrendingDown, AlertTriangle, 
  Plus, Check, X, Calculator, Settings, Clock, CheckCircle,
  FileText, Landmark, BarChart3, Activity, Briefcase, ShieldAlert, AlertCircle, ArrowUpRight, ArrowDownRight, Wallet, Users
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart
} from 'recharts';
import '../CEO.css';

// ==========================================
// DEFAULT FALLBACKS
// ==========================================
const defaultKpiData = {
  revenue: { val: '₹0M', trend: '0%', up: true },
  grossProfit: { val: '₹0M', trend: '0%', up: true },
  netProfit: { val: '₹0M', trend: '0%', up: true },
  opex: { val: '₹0M', trend: '0%', up: false },
  cash: { val: '₹0M', trend: '0%', up: true },
  burnRate: { val: '₹0/mo', trend: 'Stable', up: null }
};

const defaultRiskData = [
  { category: 'Cash Flow', level: 'Low', desc: 'No data' },
  { category: 'Collections', level: 'Low', desc: 'No data' },
  { category: 'Budget', level: 'Low', desc: 'No data' },
  { category: 'Compliance', level: 'Low', desc: 'No data' },
];

const SUBTABS = [
  { id: 'overview', label: 'Executive Overview' },
  { id: 'governance', label: 'Governance & Approvals' },
  { id: 'arap', label: 'AR / AP Center' },
  { id: 'operations', label: 'Payroll & Operations' }
];

// ==========================================
// SUB-COMPONENTS (TABS)
// ==========================================

const KpiCard = ({ title, value, trend, up }) => (
  <div style={{ background: '#FFF', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <div style={{ color: 'var(--ceo-text-muted)', fontSize: '13px', fontWeight: 600, textTransform: 'uppercase' }}>{title}</div>
    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600, color: up === true ? 'var(--ceo-success)' : up === false ? 'var(--ceo-danger)' : 'var(--ceo-text-secondary)' }}>
      {up === true ? <ArrowUpRight size={14} /> : up === false ? <ArrowDownRight size={14} /> : null}
      {trend} vs Last Month
    </div>
  </div>
);

const OverviewTab = ({ data }) => {
  const kpis = data?.kpiData || defaultKpiData;
  const revTrend = data?.revenueTrend || [];
  const cashFlow = data?.cashFlowData || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION 1: KPI STRIP */}
      <div className="ceo-grid-6">
        <KpiCard title="Total Revenue" value={kpis.revenue.val} trend={kpis.revenue.trend} up={kpis.revenue.up} />
        <KpiCard title="Gross Profit" value={kpis.grossProfit.val} trend={kpis.grossProfit.trend} up={kpis.grossProfit.up} />
        <KpiCard title="Net Profit" value={kpis.netProfit.val} trend={kpis.netProfit.trend} up={kpis.netProfit.up} />
        <KpiCard title="Operating Exp" value={kpis.opex.val} trend={kpis.opex.trend} up={kpis.opex.up} />
        <KpiCard title="Cash Position" value={kpis.cash.val} trend={kpis.cash.trend} up={kpis.cash.up} />
        <KpiCard title="Burn Rate" value={kpis.burnRate.val} trend={kpis.burnRate.trend} up={kpis.burnRate.up} />
      </div>

      {/* SECTION 2 & 5: PERFORMANCE & REVENUE INTELLIGENCE */}
      <div className="ceo-grid-2-1">
        <div className="ceo-command-panel">
          <div className="ceo-command-header"><div className="ceo-typography-card-title">Revenue & Profitability Intelligence (M)</div></div>
          <div className="ceo-command-content" style={{ padding: '24px', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revTrend}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--ceo-primary)" stopOpacity={0.2}/><stop offset="95%" stopColor="var(--ceo-primary)" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ceo-border)" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `₹${v}`} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--ceo-primary)" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                <Area type="monotone" dataKey="profit" name="Net Profit" stroke="var(--ceo-success)" fill="transparent" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* SECTION 2 RIGHT: HEALTH SCORES */}
        <div className="ceo-command-panel">
          <div className="ceo-command-header"><div className="ceo-typography-card-title">Financial Health Panel</div></div>
          <div className="ceo-command-content" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {[
              { label: 'Cash Health Score', score: '92/100', status: 'Excellent', color: 'var(--ceo-success)' },
              { label: 'Budget Adherence', score: '88/100', status: 'Good', color: 'var(--ceo-primary)' },
              { label: 'Profit Margin Score', score: '78/100', status: 'Monitor', color: 'var(--ceo-warning)' },
              { label: 'Compliance Score', score: '100/100', status: 'Perfect', color: 'var(--ceo-success)' }
            ].map(h => (
              <div key={h.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid var(--ceo-divider)' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ceo-text-secondary)' }}>{h.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ceo-text-primary)', marginTop: '4px' }}>{h.score}</div>
                </div>
                <div style={{ padding: '4px 12px', background: `${h.color}20`, color: h.color, borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                  {h.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: CASH FLOW CONTROL CENTER */}
      <div className="ceo-command-panel">
        <div className="ceo-command-header"><div className="ceo-typography-card-title">Cash Flow Control Center (M)</div></div>
        <div className="ceo-command-content" style={{ padding: '24px', height: '300px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cashFlow}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--ceo-border)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
              <YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={(v) => `₹${v}`} />
              <Tooltip cursor={{fill: '#F8FAFC'}} />
              <Bar dataKey="in" name="Cash Inflow" fill="var(--ceo-success)" radius={[4,4,0,0]} barSize={32} />
              <Bar dataKey="out" name="Cash Outflow" fill="var(--ceo-danger)" radius={[4,4,0,0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const GovernanceTab = ({ budgets, approvals, onActionApproval, onActionBudget }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    
    {/* SECTION 10: FINANCIAL RISK MONITORING */}
    <div className="ceo-command-panel">
      <div className="ceo-command-header"><div className="ceo-typography-card-title"><ShieldAlert size={18} color="var(--ceo-danger)" /> Financial Risk Monitoring</div></div>
      <div className="ceo-command-content ceo-grid-4" style={{ padding: '24px' }}>
        {defaultRiskData.map(r => (
          <div key={r.category} style={{ padding: '16px', borderRadius: '8px', border: '1px solid var(--ceo-border)', background: r.level === 'High' ? '#FEF2F2' : '#FFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontWeight: 600, fontSize: '14px' }}>{r.category}</span>
              <span className={`ceo-badge ${r.level === 'High' ? 'danger' : r.level === 'Medium' ? 'warning' : 'success'}`}>{r.level} Risk</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--ceo-text-secondary)', margin: 0, lineHeight: 1.5 }}>{r.desc}</p>
          </div>
        ))}
      </div>
    </div>

    {/* SECTION 9: EXECUTIVE APPROVAL CENTER */}
    <div className="ceo-command-panel">
      <div className="ceo-command-header"><div className="ceo-typography-card-title"><Briefcase size={18} color="var(--ceo-primary)" /> Executive Approval Center (CapEx & Reimbursements)</div></div>
      <div className="ceo-command-content" style={{ padding: 0 }}>
        <table className="ceo-erp-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>Request Type</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Risk Assessment</th>
              <th style={{ paddingRight: '24px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {approvals && approvals.length > 0 ? (
              approvals.map(ex => (
                <tr key={`${ex.rawType}-${ex.id}`}>
                  <td style={{ paddingLeft: '24px', fontWeight: 600 }}>{ex.type}</td>
                  <td>{ex.title}</td>
                  <td style={{ fontWeight: 700 }}>{ex.amount}</td>
                  <td><span className={`ceo-badge ${ex.risk === 'High' ? 'danger' : ex.risk === 'Medium' ? 'warning' : 'success'}`}>{ex.risk}</span></td>
                  <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="ceo-btn ceo-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onActionApproval(ex.id, ex.rawType, 'approve')}>Approve</button>
                      <button className="ceo-btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#FFF' }} onClick={() => onActionApproval(ex.id, ex.rawType, 'reject')}>Reject</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--ceo-text-muted)', fontSize: '14px' }}>
                  No pending CapEx/reimbursement approvals.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* SECTION 4: BUDGET GOVERNANCE */}
    <div className="ceo-command-panel">
      <div className="ceo-command-header"><div className="ceo-typography-card-title"><IndianRupee size={18} color="var(--ceo-primary)" /> Department Budget Governance</div></div>
      <div className="ceo-command-content" style={{ padding: 0 }}>
        <table className="ceo-erp-table">
          <thead>
            <tr>
              <th style={{ paddingLeft: '24px' }}>Department</th>
              <th>Request Title</th>
              <th>Variance Analysis</th>
              <th>Amount</th>
              <th style={{ paddingRight: '24px', textAlign: 'right' }}>Decision</th>
            </tr>
          </thead>
          <tbody>
            {budgets && budgets.map(b => (
              <tr key={b.id} style={{ opacity: b.status === 'approved' ? 0.6 : 1 }}>
                <td style={{ paddingLeft: '24px', fontWeight: 600 }}>{b.dept}</td>
                <td>
                  <div>{b.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>Req by: {b.reqBy}</div>
                </td>
                <td style={{ color: b.variance.includes('+') ? 'var(--ceo-danger)' : 'var(--ceo-text-secondary)' }}>{b.variance}</td>
                <td style={{ fontWeight: 700 }}>{b.amount}</td>
                <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                  {b.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button className="ceo-btn ceo-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onActionBudget(b.id, 'approve')}>Approve</button>
                      <button className="ceo-btn" style={{ padding: '6px 12px', fontSize: '12px', background: '#FFF' }} onClick={() => onActionBudget(b.id, 'reject')}>Reject</button>
                    </div>
                  ) : (
                    <span className={`ceo-badge ${b.status === 'approved' ? 'success' : 'danger'}`}>
                      {b.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

const ArApTab = ({ ar, ap }) => {
  const arList = ar || [];
  const apList = ap || [];

  return (
    <div className="ceo-grid-2">
      
      {/* SECTION 7: ACCOUNTS RECEIVABLE */}
      <div className="ceo-command-panel">
        <div className="ceo-command-header"><div className="ceo-typography-card-title">Accounts Receivable (Incoming Cash)</div></div>
        <div className="ceo-command-content" style={{ padding: 0 }}>
          <table className="ceo-erp-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Client & Invoice</th>
                <th>Amount</th>
                <th style={{ paddingRight: '24px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {arList.map(arItem => (
                <tr key={arItem.invoice}>
                  <td style={{ paddingLeft: '24px' }}>
                    <div style={{ fontWeight: 600 }}>{arItem.client}</div>
                    <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>{arItem.invoice}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--ceo-success)' }}>{arItem.amount}</td>
                  <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                    <span className={`ceo-badge ${arItem.status === 'High Risk' ? 'danger' : arItem.status === 'Overdue' ? 'warning' : 'neutral'}`}>
                      {arItem.status} {arItem.daysOverdue > 0 ? `(${arItem.daysOverdue}d)` : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 8: ACCOUNTS PAYABLE */}
      <div className="ceo-command-panel">
        <div className="ceo-command-header"><div className="ceo-typography-card-title">Accounts Payable (Outgoing Cash)</div></div>
        <div className="ceo-command-content" style={{ padding: 0 }}>
          <table className="ceo-erp-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Vendor & Ref</th>
                <th>Amount</th>
                <th style={{ paddingRight: '24px', textAlign: 'right' }}>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {apList.map(apItem => (
                <tr key={apItem.ref}>
                  <td style={{ paddingLeft: '24px' }}>
                    <div style={{ fontWeight: 600 }}>{apItem.vendor}</div>
                    <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>{apItem.ref}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>{apItem.amount}</td>
                  <td style={{ paddingRight: '24px', textAlign: 'right', fontSize: '13px', color: 'var(--ceo-text-secondary)' }}>
                    {apItem.dueDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const OperationsTab = ({ payroll, statutory, components, onSaveSalaryStructure }) => {
  const [localComponents, setLocalComponents] = useState(components);
  const [editingId, setEditingId] = useState(null);

  React.useEffect(() => {
    setLocalComponents(components);
  }, [components]);

  const updateComponent = (id, field, val) => setLocalComponents(localComponents.map(c => c.id === id ? { ...c, [field]: val } : c));
  const removeComponent = (id) => {
    const updated = localComponents.filter(c => c.id !== id);
    setLocalComponents(updated);
    onSaveSalaryStructure(updated);
  };
  const addComponent = () => {
    const newId = Date.now();
    setLocalComponents([...localComponents, { id: newId, name: '', type: 'Fixed', calc: 'Flat', value: 0, tax: true }]);
    setEditingId(newId);
  };
  const saveComponent = (id) => {
    setEditingId(null);
    onSaveSalaryStructure(localComponents);
  };

  const payrollList = payroll || [];
  const statList = statutory || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SECTION 11: PAYROLL SUMMARY */}
      <div className="ceo-command-panel">
        <div className="ceo-command-header">
          <div className="ceo-typography-card-title"><Users size={18} color="var(--ceo-primary)" /> Payroll Register Summary</div>
        </div>
        <div className="ceo-command-content" style={{ padding: 0 }}>
          <table className="ceo-erp-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '24px' }}>Employee Name</th>
                <th>Department</th>
                <th>Gross Salary</th>
                <th>Net Pay</th>
                <th style={{ paddingRight: '24px', textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrollList.map(pay => (
                <tr key={pay.id}>
                  <td style={{ paddingLeft: '24px', fontWeight: 500 }}>{pay.name}</td>
                  <td style={{ color: 'var(--ceo-text-secondary)', fontSize: '13px' }}>{pay.dept}</td>
                  <td style={{ fontSize: '14px', fontWeight: 500 }}>{pay.gross}</td>
                  <td style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ceo-success)' }}>{pay.net}</td>
                  <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                    <span className="ceo-badge success">{pay.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="ceo-grid-2">
        {/* SECTION 13: STATUTORY */}
        <div className="ceo-command-panel">
          <div className="ceo-command-header"><div className="ceo-typography-card-title"><Landmark size={18} color="var(--ceo-primary)" /> Compliance & Statutory</div></div>
          <div className="ceo-command-content" style={{ padding: 0 }}>
            <table className="ceo-erp-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Type</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {statList.map(stat => (
                  <tr key={stat.id}>
                    <td style={{ paddingLeft: '24px', fontWeight: 500 }}>{stat.type}</td>
                    <td style={{ fontWeight: 600 }}>{stat.amount}</td>
                    <td style={{ fontSize: '13px', color: 'var(--ceo-text-secondary)' }}>{stat.dueDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECTION 12: SALARY BUILDER (Admin) */}
        <div className="ceo-command-panel">
          <div className="ceo-command-header">
            <div className="ceo-typography-card-title"><Calculator size={18} color="var(--ceo-primary)" /> Salary Structure (Admin)</div>
            <button className="ceo-btn" onClick={addComponent} style={{ padding: '4px 12px', fontSize: '12px' }}><Plus size={14} /> Add</button>
          </div>
          <div className="ceo-command-content" style={{ padding: 0 }}>
            <table className="ceo-erp-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Component</th>
                  <th>Value</th>
                  <th style={{ paddingRight: '24px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {localComponents.map(comp => (
                  <tr key={comp.id}>
                    <td style={{ paddingLeft: '24px' }}>
                      {editingId === comp.id ? <input className="ceo-form-input" value={comp.name} onChange={e => updateComponent(comp.id, 'name', e.target.value)} /> : comp.name || '(Unnamed)'}
                    </td>
                    <td>
                      {editingId === comp.id ? <input type="number" className="ceo-form-input" style={{ width: '80px' }} value={comp.value} onChange={e => updateComponent(comp.id, 'value', Number(e.target.value))} /> : (comp.calc === 'Flat' ? `₹${comp.value}` : `${comp.value}%`)}
                    </td>
                    <td style={{ paddingRight: '24px', textAlign: 'right' }}>
                      {editingId === comp.id ? (
                        <button className="ceo-btn" onClick={() => saveComponent(comp.id)} style={{ background: 'var(--ceo-success)', color: 'white', padding: '4px 8px', fontSize: '12px' }}>Save</button>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button className="ceo-btn" onClick={() => setEditingId(comp.id)} style={{ padding: '4px', border: 'none' }}><Settings size={14} /></button>
                          <button className="ceo-btn" onClick={() => removeComponent(comp.id)} style={{ padding: '4px', border: 'none' }}><X size={14} color="var(--ceo-danger)"/></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};


// ==========================================
// MAIN COMPONENT
// ==========================================
export default function Finance() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [kpiData, setKpiData] = useState(null);
  const [revenueTrend, setRevTrend] = useState([]);
  const [cashFlowData, setCashFlow] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [arData, setArData] = useState([]);
  const [apData, setApData] = useState([]);
  const [statutory, setStatutory] = useState([]);
  const [salaryStructure, setSalaryStructure] = useState([]);
  const [payrollRegister, setPayroll] = useState([]);
  const [executiveApprovals, setApprovals] = useState([]);
  
  const [showKpiModal, setShowKpiModal] = useState(false);
  const [kpiErrors, setKpiErrors] = useState({});
  const [kpiForm, setKpiForm] = useState({
    revenue: '₹12.5M', revTrend: '+12%',
    grossProfit: '₹4.2M', gpTrend: '+5%',
    netProfit: '₹2.1M', npTrend: '+8%',
    burnRate: '₹400K/mo', burnTrend: 'Stable'
  });

  const token = localStorage.getItem('nsg_jwt_token');

  const fetchFinanceData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [kpiRes, trRes, budRes, arRes, apRes, statRes, salRes, payRes, appRes] = await Promise.all([
        fetch('/api/ceo-portal/finance/kpis', { headers }),
        fetch('/api/ceo-portal/finance/trends', { headers }),
        fetch('/api/ceo-portal/finance/budgets-list', { headers }),
        fetch('/api/ceo-portal/finance/ar', { headers }),
        fetch('/api/ceo-portal/finance/ap', { headers }),
        fetch('/api/ceo-portal/finance/statutory-list', { headers }),
        fetch('/api/ceo-portal/finance/salary-components', { headers }),
        fetch('/api/ceo-portal/finance/payroll-register', { headers }),
        fetch('/api/ceo-portal/finance/approvals-list', { headers })
      ]);

      if(kpiRes.ok) setKpiData(await kpiRes.json());
      if(trRes.ok) {
        const trends = await trRes.json();
        setRevTrend(trends.map(t => ({ month: t.month, revenue: t.revenue, profit: t.profit })));
        setCashFlow(trends.map(t => ({ month: t.month, in: t.cash_in, out: t.cash_out })));
      }
      if(budRes.ok) setBudgets(await budRes.json());
      if(arRes.ok) setArData(await arRes.json());
      if(apRes.ok) setApData(await apRes.json());
      if(statRes.ok) setStatutory(await statRes.json());
      if(salRes.ok) setSalaryStructure(await salRes.json());
      if(payRes.ok) setPayroll(await payRes.json());
      if(appRes.ok) setApprovals(await appRes.json());
      
    } catch (e) {
      console.error(e);
      setError('Connection error loading finance data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const handleActionApproval = async (id, rawType, action) => {
    try {
      const endpoint = rawType === 'expense' 
        ? `/api/ceo-portal/expenses/${id}/${action}`
        : `/api/ceo-portal/loans/${id}/${action}`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFinanceData();
      else window.toast.error(`Failed to ${action} approval.`);
    } catch (e) { window.toast.error(`Error during ${action} action.`); }
  };

  const handleActionBudget = async (id, action) => {
    try {
      const res = await fetch(`/api/ceo-portal/finance/budgets/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchFinanceData();
      else window.toast.error(`Failed to ${action} budget.`);
    } catch (e) { window.toast.error(`Error during budget action.`); }
  };

  const handleSaveSalaryStructure = async (components) => {
    try {
      const res = await fetch('/api/ceo-portal/finance/salary-components', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ components })
      });
      if (res.ok) fetchFinanceData();
      else window.toast.error('Failed to save salary structure.');
    } catch (e) { window.toast.error('Error saving salary structure.'); }
  };

  const handleSaveKpi = async () => {
    const errors = {};
    if (!kpiForm.revenue.trim()) errors.revenue = 'Please enter Total Revenue.';
    if (!kpiForm.revTrend.trim()) errors.revTrend = 'Please enter Revenue Trend.';
    if (!kpiForm.grossProfit.trim()) errors.grossProfit = 'Please enter Gross Profit.';
    if (!kpiForm.gpTrend.trim()) errors.gpTrend = 'Please enter Gross Profit Trend.';
    if (!kpiForm.netProfit.trim()) errors.netProfit = 'Please enter Net Profit.';
    if (!kpiForm.npTrend.trim()) errors.npTrend = 'Please enter Net Profit Trend.';
    if (!kpiForm.burnRate.trim()) errors.burnRate = 'Please enter Burn Rate.';
    if (!kpiForm.burnTrend.trim()) errors.burnTrend = 'Please enter Burn Rate Trend.';

    if (Object.keys(errors).length > 0) {
      setKpiErrors(errors);
      return;
    }

    const newKpiData = {
      revenue: { val: kpiForm.revenue, trend: kpiForm.revTrend, up: true },
      grossProfit: { val: kpiForm.grossProfit, trend: kpiForm.gpTrend, up: true },
      netProfit: { val: kpiForm.netProfit, trend: kpiForm.npTrend, up: true },
      opex: kpiData?.opex || { val: '₹0M', trend: '0%', up: false }, 
      cash: kpiData?.cash || { val: '₹0M', trend: '0%', up: true }, 
      burnRate: { val: kpiForm.burnRate, trend: kpiForm.burnTrend, up: null }
    };
    try {
      const res = await fetch('/api/ceo-portal/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ key: 'finance_kpi_data', value: JSON.stringify(newKpiData) })
      });
      if (res.ok) {
        setShowKpiModal(false);
        fetchFinanceData();
      } else window.toast.error('Failed to save KPIs.');
    } catch (e) { window.toast.error('Error saving KPIs.'); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', flexDirection: 'column', gap: '16px' }}>
        <div className="ceo-spinner" style={{ width: '40px', height: '40px', border: '3px solid var(--ceo-border)', borderTopColor: 'var(--ceo-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--ceo-text-secondary)', fontSize: '14px', fontWeight: 500 }}>Loading live financial systems...</p>
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
        <button className="ceo-btn ceo-btn-primary" onClick={fetchFinanceData}>Retry Connection</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="ceo-typography-page-title">Executive Finance Command Center</h1>
          <p className="ceo-typography-body" style={{ marginTop: '8px' }}>Monitor financial health, approve capital expenditures, and analyze cash flow intelligence.</p>
        </div>
        <button className="ceo-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--ceo-primary)', color: 'white', border: 'none' }} onClick={() => { setKpiErrors({}); setShowKpiModal(true); }}>
          <Settings size={16} /> Update KPIs
        </button>
      </div>

      {/* CLEAN SUBTABS NAVIGATION */}
      <div style={{ display: 'flex', gap: '32px', borderBottom: '1px solid var(--ceo-divider)', marginBottom: '24px' }}>
        {SUBTABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0 0 12px 0',
              background: 'transparent',
              color: activeTab === tab.id ? 'var(--ceo-primary)' : 'var(--ceo-text-muted)',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--ceo-primary)' : '2px solid transparent',
              fontWeight: activeTab === tab.id ? 600 : 500,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              marginBottom: '-1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* DYNAMIC TAB RENDERING */}
      <div style={{ flex: 1 }}>
        {activeTab === 'overview' && <OverviewTab data={{ kpiData, revenueTrend, cashFlowData }} />}
        {activeTab === 'governance' && (
          <GovernanceTab 
            budgets={budgets} 
            approvals={executiveApprovals}
            onActionApproval={handleActionApproval}
            onActionBudget={handleActionBudget}
          />
        )}
        {activeTab === 'arap' && <ArApTab ar={arData} ap={apData} />}
        {activeTab === 'operations' && (
          <OperationsTab 
            payroll={payrollRegister}
            statutory={statutory}
            components={salaryStructure} 
            onSaveSalaryStructure={handleSaveSalaryStructure}
          />
        )}
      </div>

      {/* UPDATE KPIs MODAL */}
      {showKpiModal && (
        <div className="ceo-modal-overlay" onClick={() => setShowKpiModal(false)}>
          <div className="ceo-modal" onClick={e => e.stopPropagation()} style={{ width: '600px', maxWidth: '90vw' }}>
            <div className="ceo-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Update Financial KPIs</h2>
              <button onClick={() => setShowKpiModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}><X size={20}/></button>
            </div>
            <div className="ceo-modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'white', padding: '24px' }}>
              <div>
                <label className="ceo-form-label">Total Revenue (val) *</label>
                <input className="ceo-form-input" value={kpiForm.revenue} onChange={e => { setKpiForm({...kpiForm, revenue: e.target.value}); if(e.target.value.trim()) setKpiErrors(p => ({...p, revenue: ''})); }} onFocus={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, revenue: 'Please enter Total Revenue.'})); }} onBlur={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, revenue: 'Please enter Total Revenue.'})); else setKpiErrors(p => ({...p, revenue: ''})); }} placeholder="e.g. ₹12.5M" />
                {kpiErrors.revenue && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {kpiErrors.revenue}</div>}
              </div>
              <div>
                <label className="ceo-form-label">Revenue Trend *</label>
                <input className="ceo-form-input" value={kpiForm.revTrend} onChange={e => { setKpiForm({...kpiForm, revTrend: e.target.value}); if(e.target.value.trim()) setKpiErrors(p => ({...p, revTrend: ''})); }} onFocus={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, revTrend: 'Please enter Revenue Trend.'})); }} onBlur={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, revTrend: 'Please enter Revenue Trend.'})); else setKpiErrors(p => ({...p, revTrend: ''})); }} placeholder="e.g. +12%" />
                {kpiErrors.revTrend && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {kpiErrors.revTrend}</div>}
              </div>

              <div>
                <label className="ceo-form-label">Gross Profit (val) *</label>
                <input className="ceo-form-input" value={kpiForm.grossProfit} onChange={e => { setKpiForm({...kpiForm, grossProfit: e.target.value}); if(e.target.value.trim()) setKpiErrors(p => ({...p, grossProfit: ''})); }} onFocus={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, grossProfit: 'Please enter Gross Profit.'})); }} onBlur={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, grossProfit: 'Please enter Gross Profit.'})); else setKpiErrors(p => ({...p, grossProfit: ''})); }} placeholder="e.g. ₹4.2M" />
                {kpiErrors.grossProfit && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {kpiErrors.grossProfit}</div>}
              </div>
              <div>
                <label className="ceo-form-label">Gross Profit Trend *</label>
                <input className="ceo-form-input" value={kpiForm.gpTrend} onChange={e => { setKpiForm({...kpiForm, gpTrend: e.target.value}); if(e.target.value.trim()) setKpiErrors(p => ({...p, gpTrend: ''})); }} onFocus={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, gpTrend: 'Please enter Gross Profit Trend.'})); }} onBlur={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, gpTrend: 'Please enter Gross Profit Trend.'})); else setKpiErrors(p => ({...p, gpTrend: ''})); }} placeholder="e.g. +5%" />
                {kpiErrors.gpTrend && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {kpiErrors.gpTrend}</div>}
              </div>

              <div>
                <label className="ceo-form-label">Net Profit (val) *</label>
                <input className="ceo-form-input" value={kpiForm.netProfit} onChange={e => { setKpiForm({...kpiForm, netProfit: e.target.value}); if(e.target.value.trim()) setKpiErrors(p => ({...p, netProfit: ''})); }} onFocus={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, netProfit: 'Please enter Net Profit.'})); }} onBlur={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, netProfit: 'Please enter Net Profit.'})); else setKpiErrors(p => ({...p, netProfit: ''})); }} placeholder="e.g. ₹2.1M" />
                {kpiErrors.netProfit && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {kpiErrors.netProfit}</div>}
              </div>
              <div>
                <label className="ceo-form-label">Net Profit Trend *</label>
                <input className="ceo-form-input" value={kpiForm.npTrend} onChange={e => { setKpiForm({...kpiForm, npTrend: e.target.value}); if(e.target.value.trim()) setKpiErrors(p => ({...p, npTrend: ''})); }} onFocus={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, npTrend: 'Please enter Net Profit Trend.'})); }} onBlur={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, npTrend: 'Please enter Net Profit Trend.'})); else setKpiErrors(p => ({...p, npTrend: ''})); }} placeholder="e.g. +8%" />
                {kpiErrors.npTrend && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {kpiErrors.npTrend}</div>}
              </div>

              <div>
                <label className="ceo-form-label">Burn Rate (val) *</label>
                <input className="ceo-form-input" value={kpiForm.burnRate} onChange={e => { setKpiForm({...kpiForm, burnRate: e.target.value}); if(e.target.value.trim()) setKpiErrors(p => ({...p, burnRate: ''})); }} onFocus={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, burnRate: 'Please enter Burn Rate.'})); }} onBlur={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, burnRate: 'Please enter Burn Rate.'})); else setKpiErrors(p => ({...p, burnRate: ''})); }} placeholder="e.g. ₹400K/mo" />
                {kpiErrors.burnRate && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {kpiErrors.burnRate}</div>}
              </div>
              <div>
                <label className="ceo-form-label">Burn Rate Trend *</label>
                <input className="ceo-form-input" value={kpiForm.burnTrend} onChange={e => { setKpiForm({...kpiForm, burnTrend: e.target.value}); if(e.target.value.trim()) setKpiErrors(p => ({...p, burnTrend: ''})); }} onFocus={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, burnTrend: 'Please enter Burn Rate Trend.'})); }} onBlur={e => { if(!e.target.value.trim()) setKpiErrors(p => ({...p, burnTrend: 'Please enter Burn Rate Trend.'})); else setKpiErrors(p => ({...p, burnTrend: ''})); }} placeholder="e.g. Stable" />
                {kpiErrors.burnTrend && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {kpiErrors.burnTrend}</div>}
              </div>
            </div>
            <div className="ceo-modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#f8fafc' }}>
              <button className="ceo-btn" onClick={() => setShowKpiModal(false)}>Cancel</button>
              <button className="ceo-btn ceo-btn-primary" onClick={handleSaveKpi}>Save & Update</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

