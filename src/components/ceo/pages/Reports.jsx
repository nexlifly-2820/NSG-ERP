import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart2, Download, Filter, Calendar, Settings, ChevronRight, 
  Users, Briefcase, IndianRupee, PieChart, Target, ShieldCheck, 
  TrendingUp, TrendingDown, Clock, Sparkles, CheckCircle, Search,
  AlignLeft, Play, X, Zap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, ComposedChart, Legend
} from 'recharts';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const kpiStripData = [
  { title: "Generated Reports", value: "24", trend: "up", percent: "5%", color: "#2563EB" },
  { title: "Data Health", value: "98%", trend: "up", percent: "1%", color: "#10B981" },
  { title: "Scheduled Runs", value: "14", trend: "flat", percent: "0%", color: "#F59E0B" },
  { title: "System Sync", value: "Live", trend: "flat", percent: "-", color: "#8B5CF6" },
  { title: "Queries Today", value: "842", trend: "up", percent: "12%", color: "#2563EB" },
  { title: "Avg Load Time", value: "1.2s", trend: "down", percent: "0.4s", color: "#10B981" },
];

const insights = [
  { msg: "Payroll cost increased 12% compared to previous month due to annual appraisals.", type: "warning" },
  { msg: "Project delivery efficiency improved by 8% in Engineering department.", type: "success" },
  { msg: "Employee retention reached 94%, highest level this financial year.", type: "success" },
  { msg: "Marketing ad spend is projecting a 15% budget overrun for Q3.", type: "critical" },
];

const scheduledReports = [
  { name: "Monthly Financial Rollup", freq: "Monthly (1st)", recipients: "CEO, CFO", next: "01 Jul 2026" },
  { name: "Weekly Workforce Health", freq: "Weekly (Mon)", recipients: "CEO, HR Head", next: "08 Jun 2026" },
  { name: "Quarterly OKR Status", freq: "Quarterly", recipients: "Board of Directors", next: "01 Oct 2026" },
];

const tableData = [
  { id: "RPT-001", dept: "Engineering", metric1: "145", metric2: "92%", metric3: "₹4.2M", status: "Healthy" },
  { id: "RPT-002", dept: "Sales", metric1: "85", metric2: "88%", metric3: "₹2.8M", status: "Warning" },
  { id: "RPT-003", dept: "Marketing", metric1: "42", metric2: "75%", metric3: "₹1.5M", status: "Critical" },
  { id: "RPT-004", dept: "Operations", metric1: "120", metric2: "95%", metric3: "₹3.1M", status: "Healthy" },
  { id: "RPT-005", dept: "HR & Finance", metric1: "35", metric2: "98%", metric3: "₹1.1M", status: "Healthy" },
];

const chartData = [
  { name: 'Jan', val1: 4000, val2: 2400 },
  { name: 'Feb', val1: 3000, val2: 1398 },
  { name: 'Mar', val1: 2000, val2: 9800 },
  { name: 'Apr', val1: 2780, val2: 3908 },
  { name: 'May', val1: 1890, val2: 4800 },
  { name: 'Jun', val1: 2390, val2: 3800 },
  { name: 'Jul', val1: 3490, val2: 4300 },
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

export default function Reports() {
  const [activeTab, setActiveTab] = useState("Financial Reports");
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <div style={{ padding: '0 32px 32px 32px', maxWidth: '1800px', margin: '0 auto', color: 'var(--ceo-text-primary)' }}>
      
      {/* SECTION 1: Executive Reports Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', borderBottom: '1px solid var(--ceo-border)', paddingBottom: '24px' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="ceo-badge neutral">Enterprise Intelligence</span>
            <ChevronRight size={14} color="var(--ceo-text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Data & Reports Center</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Business Intelligence Center</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="ceo-btn"><Settings size={16} /> Data Settings</button>
          <button className="ceo-btn"><Clock size={16} /> Schedules</button>
          <button className="ceo-btn"><Download size={16} /> Export View</button>
          <button className="ceo-btn ceo-btn-primary"><BarChart2 size={16} /> Custom Query</button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 2: BI KPI Strip */}
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

        {/* SECTION 3: Executive Insights Matrix */}
        <motion.div variants={itemVariants} className="ceo-command-panel" style={{ borderLeft: '4px solid var(--ceo-purple)' }}>
          <div className="ceo-command-header" style={{ padding: '16px 24px' }}>
            <div className="ceo-dash-card-title"><Sparkles size={18} color="var(--ceo-purple)" /> AI-Generated Executive Insights</div>
          </div>
          <div className="ceo-matrix-grid" style={{ padding: '20px 24px' }}>
            {insights.map((ins, i) => (
              <div key={i} className="ceo-matrix-cell" style={{ background: ins.type === 'critical' ? '#FEF2F2' : ins.type === 'warning' ? '#FFFBEB' : '#F0FDF4', borderColor: ins.type === 'critical' ? '#FECACA' : ins.type === 'warning' ? '#FDE68A' : '#A7F3D0' }}>
                <div style={{ fontSize: '13px', lineHeight: '1.5', color: ins.type === 'critical' ? '#B91C1C' : ins.type === 'warning' ? '#B45309' : '#047857' }}>
                  {ins.msg}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* SECTION 4: Split Layout for Analytics and Schedule */}
        <div className="ceo-split-layout">
          
          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-left" style={{ flex: 2 }}>
            <div className="ceo-command-header">
              <div style={{ display: 'flex', gap: '24px' }}>
                {["Workforce", "Financial", "Project", "Compliance"].map(tab => (
                  <div key={tab} onClick={() => setActiveTab(tab)} style={{ fontSize: '13px', fontWeight: 600, color: activeTab === tab ? 'var(--ceo-primary)' : 'var(--ceo-text-muted)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                    {tab} Data
                    {activeTab === tab && <motion.div layoutId="activeRptTab" style={{ position: 'absolute', bottom: '-21px', left: 0, right: 0, height: '2px', background: 'var(--ceo-primary)' }}></motion.div>}
                  </div>
                ))}
              </div>
              <button onClick={() => setFilterOpen(!filterOpen)} className="ceo-btn" style={{ background: filterOpen ? 'var(--ceo-primary)' : 'transparent', color: filterOpen ? 'white' : 'var(--ceo-text-primary)' }}>
                <Filter size={14} /> Filters
              </button>
            </div>
            
            <AnimatePresence>
              {filterOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '20px 24px', background: 'var(--ceo-bg)', borderBottom: '1px solid var(--ceo-border)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) auto', gap: '16px', alignItems: 'end' }}>
                    <div className="ceo-form-group" style={{ margin: 0 }}>
                      <label>Date Range</label>
                      <select className="ceo-form-input" style={{ padding: '8px', fontSize: '12px' }}><option>This Quarter</option><option>This Year</option></select>
                    </div>
                    <div className="ceo-form-group" style={{ margin: 0 }}>
                      <label>Department</label>
                      <select className="ceo-form-input" style={{ padding: '8px', fontSize: '12px' }}><option>All</option><option>Engineering</option></select>
                    </div>
                    <div className="ceo-form-group" style={{ margin: 0 }}>
                      <label>Location</label>
                      <select className="ceo-form-input" style={{ padding: '8px', fontSize: '12px' }}><option>All</option><option>HQ</option></select>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="ceo-btn ceo-btn-primary" style={{ padding: '8px 16px' }}>Apply</button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="ceo-command-content" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVal1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--ceo-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--ceo-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--ceo-card-bg)', borderColor: 'var(--ceo-border)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--ceo-text-primary)' }} cursor={{ fill: 'var(--ceo-bg)' }} />
                  <Area type="monotone" dataKey="val1" stroke="var(--ceo-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal1)" />
                  <Bar dataKey="val2" fill="var(--ceo-success)" radius={[4, 4, 0, 0]} barSize={24} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-right" style={{ flex: 1 }}>
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><Calendar size={18} color="var(--ceo-warning)" /> Scheduled Dispatch</div>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-warning)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>+ New</button>
            </div>
            <div className="ceo-command-content" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {scheduledReports.map((sch, i) => (
                  <div key={i} style={{ padding: '12px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>{sch.name}</div>
                      <span className="ceo-badge neutral">{sch.freq}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ceo-text-muted)', marginBottom: '8px' }}>Recipients: {sch.recipients}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--ceo-success)', fontWeight: 600 }}>Next: {sch.next}</div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Play size={14} color="var(--ceo-text-muted)" style={{ cursor: 'pointer' }} />
                        <Settings size={14} color="var(--ceo-text-muted)" style={{ cursor: 'pointer' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>

        {/* SECTION 5: Enterprise Data Grid Preview */}
        <motion.div variants={itemVariants} className="ceo-command-panel">
          <div className="ceo-command-header">
            <div className="ceo-dash-card-title"><AlignLeft size={18} color="var(--ceo-success)" /> Data Grid Explorer</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '10px', top: '8px' }} />
                <input type="text" placeholder="Search data..." className="ceo-form-input" style={{ width: '200px', padding: '6px 12px 6px 30px' }} />
              </div>
              <button className="ceo-btn" style={{ padding: '6px 12px' }}><Download size={14} /> CSV</button>
            </div>
          </div>
          
          <div className="ceo-erp-table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table className="ceo-erp-table">
              <thead>
                <tr>
                  <th>Record ID</th>
                  <th>Department Segment</th>
                  <th>Metric A (Count)</th>
                  <th>Metric B (Score)</th>
                  <th>Metric C (Value)</th>
                  <th style={{ textAlign: 'right' }}>Status Indicator</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--ceo-text-muted)' }}>{row.id}</td>
                    <td style={{ fontWeight: 600 }}>{row.dept}</td>
                    <td>{row.metric1}</td>
                    <td>{row.metric2}</td>
                    <td style={{ fontFamily: 'monospace' }}>{row.metric3}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span className={`ceo-badge ${row.status === 'Healthy' ? 'success' : row.status === 'Warning' ? 'warning' : 'critical'}`}>
                        {row.status}
                      </span>
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
