import React from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, TrendingUp, TrendingDown, Activity, 
  BarChart2, FileText, Download, ChevronRight, Briefcase, 
  Settings, CheckCircle, PieChart, AlertTriangle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, ComposedChart, Line
} from 'recharts';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const kpiStripData = [
  { title: "Net Revenue (Q2)", value: "₹42.5M", trend: "up", percent: "12%", color: "#2563EB" },
  { title: "Operating Profit", value: "₹12.8M", trend: "up", percent: "8%", color: "#10B981" },
  { title: "EBITDA Margin", value: "28.5%", trend: "up", percent: "1.2%", color: "#8B5CF6" },
  { title: "Cash Flow", value: "₹6.4M", trend: "down", percent: "2%", color: "#EF4444" },
  { title: "Operating Exp.", value: "₹18.2M", trend: "up", percent: "4%", color: "#F59E0B" },
  { title: "Runway", value: "24 Mo", trend: "flat", percent: "-", color: "#3B82F6" },
];

const revenueData = [
  { name: 'Jan', revenue: 4000, expenses: 2400 },
  { name: 'Feb', revenue: 3000, expenses: 1398 },
  { name: 'Mar', revenue: 5500, expenses: 2800 },
  { name: 'Apr', revenue: 6780, expenses: 3908 },
  { name: 'May', revenue: 6890, expenses: 3800 },
  { name: 'Jun', revenue: 7390, expenses: 4300 },
];

const departmentExpenses = [
  { dept: "Engineering", amount: "₹8.4M", percent: 42, variance: "+4%" },
  { dept: "Sales & Mktg", amount: "₹4.2M", percent: 25, variance: "+12%" },
  { dept: "Operations", amount: "₹3.8M", percent: 20, variance: "-2%" },
  { dept: "HR & Admin", amount: "₹1.8M", percent: 13, variance: "0%" },
];

const transactions = [
  { id: "TRX-8829", desc: "Cloud Provider Services", type: "Expense", amount: "₹1.2M", status: "Processed", date: "Today" },
  { id: "TRX-8830", desc: "Enterprise License Renewal", type: "Revenue", amount: "₹4.5M", status: "Cleared", date: "Yesterday" },
  { id: "TRX-8831", desc: "Consulting Retainer", type: "Expense", amount: "₹0.8M", status: "Pending", date: "28 May" },
  { id: "TRX-8832", desc: "Q1 Performance Bonus", type: "Payroll", amount: "₹2.4M", status: "Processed", date: "25 May" },
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

export default function Finance() {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Processed': 
      case 'Cleared': return <span className="ceo-badge success">{status}</span>;
      case 'Pending': return <span className="ceo-badge warning">{status}</span>;
      default: return <span className="ceo-badge neutral">{status}</span>;
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
            <span className="ceo-badge neutral">Financial Operations</span>
            <ChevronRight size={14} color="var(--ceo-text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Treasury & Planning</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Financial Command Center</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="ceo-btn"><FileText size={16} /> P&L Statement</button>
          <button className="ceo-btn"><Download size={16} /> Export Ledgers</button>
          <button className="ceo-btn ceo-btn-primary"><Settings size={16} /> Budget Forecast</button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 2: Finance KPI Strip */}
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

        {/* SECTION 3: Split View - Financial Analytics & Department Burn */}
        <div className="ceo-split-layout">
          
          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-left" style={{ flex: 2 }}>
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><Activity size={18} color="var(--ceo-primary)" /> Revenue vs Expenses (Year-to-Date)</div>
            </div>
            <div className="ceo-command-content" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ceo-primary)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="var(--ceo-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--ceo-card-bg)', borderColor: 'var(--ceo-border)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--ceo-text-primary)' }} cursor={{ fill: 'var(--ceo-bg)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="var(--ceo-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                  <Bar dataKey="expenses" fill="var(--ceo-danger)" radius={[4, 4, 0, 0]} barSize={24} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-right" style={{ flex: 1 }}>
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><PieChart size={18} color="var(--ceo-warning)" /> OpEx by Department</div>
            </div>
            <div className="ceo-command-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {departmentExpenses.map((dept, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{dept.dept}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline' }}>
                      <span style={{ fontSize: '11px', color: dept.variance.startsWith('+') ? 'var(--ceo-danger)' : 'var(--ceo-success)' }}>{dept.variance} var</span>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>{dept.amount}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${dept.percent}%`, height: '100%', background: 'var(--ceo-warning)' }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* SECTION 4: Enterprise Ledger (Recent High-Value Transactions) */}
        <motion.div variants={itemVariants} className="ceo-command-panel">
          <div className="ceo-command-header">
            <div className="ceo-dash-card-title"><DollarSign size={18} color="var(--ceo-success)" /> High-Value Transaction Ledger</div>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>View General Ledger →</button>
          </div>
          
          <div className="ceo-erp-table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table className="ceo-erp-table">
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Description</th>
                  <th>Classification</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount & Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((trx, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--ceo-text-muted)' }}>{trx.id}</td>
                    <td style={{ fontWeight: 600 }}>{trx.desc}</td>
                    <td>{trx.type}</td>
                    <td style={{ color: 'var(--ceo-text-secondary)' }}>{trx.date}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px', color: trx.type === 'Revenue' ? 'var(--ceo-success)' : 'var(--ceo-text-primary)' }}>
                        {trx.type === 'Expense' || trx.type === 'Payroll' ? '-' : '+'}{trx.amount}
                      </div>
                      <div>{getStatusBadge(trx.status)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

      </motion.div>

    </div>
  );
}
