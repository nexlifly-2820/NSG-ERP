import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, TrendingDown, Users, Briefcase, IndianRupee, PieChart, 
  Target, ShieldCheck, CheckCircle, AlertTriangle, ArrowRight, Activity 
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
  { title: "Total Revenue", value: "₹42.5M", trend: "up", percent: "12%", color: "#2563EB" },
  { title: "Operating Profit", value: "₹12.8M", trend: "up", percent: "8%", color: "#10B981" },
  { title: "Active Projects", value: "34", trend: "up", percent: "2", color: "#8B5CF6" },
  { title: "Headcount", value: "842", trend: "up", percent: "4%", color: "#3B82F6" },
  { title: "Risk Score", value: "Low", trend: "down", percent: "2 pts", color: "#10B981" },
  { title: "Pending Approvals", value: "14", trend: "flat", percent: "0", color: "#F59E0B" },
];

const revenueData = [
  { name: 'Jan', rev: 4000, target: 4500, profit: 2400 },
  { name: 'Feb', rev: 3000, target: 4000, profit: 1398 },
  { name: 'Mar', rev: 5500, target: 5000, profit: 3800 },
  { name: 'Apr', rev: 6780, target: 6000, profit: 4908 },
  { name: 'May', rev: 6890, target: 6500, profit: 4800 },
  { name: 'Jun', rev: 7390, target: 7000, profit: 5800 },
  { name: 'Jul', rev: 8490, target: 8000, profit: 6300 },
];

const okrData = [
  { id: "OBJ-1", title: "Achieve $50M ARR", progress: 68, status: "On Track" },
  { id: "OBJ-2", title: "Launch Enterprise Portal V2", progress: 92, status: "Near Completion" },
  { id: "OBJ-3", title: "Expand Market Presence in EU", progress: 34, status: "Behind Schedule" }
];

const urgentApprovals = [
  { id: "REQ-2041", type: "Capex Request", amount: "₹4.5M", dept: "IT Infra", date: "Today" },
  { id: "REQ-2042", type: "New Hire VP", amount: "₹2.4M (CTC)", dept: "Marketing", date: "Yesterday" },
  { id: "REQ-2043", type: "Vendor Contract", amount: "₹1.2M", dept: "Legal", date: "28 May" },
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

export default function Dashboard() {
  return (
    <div style={{ padding: '0 0 32px 0', maxWidth: '1800px', margin: '0 auto', color: 'var(--ceo-text-primary)' }}>
      
      {/* SECTION 1: Executive Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', borderBottom: '1px solid var(--ceo-border)', paddingBottom: '24px' }}
      >
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '-0.5px' }}>Executive Command Center</h1>
          <div style={{ fontSize: '13px', color: 'var(--ceo-text-muted)' }}>Financial Year 2026 • Q2 Performance Overview</div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="ceo-btn">Download PDF</button>
          <button className="ceo-btn ceo-btn-primary">Generate Board Report</button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 2: KPI Strip (Replacing old card grid) */}
        <motion.div variants={itemVariants} className="ceo-kpi-strip">
          {kpiStripData.map((kpi, idx) => (
            <div key={idx} className="ceo-kpi-strip-item">
              <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>{kpi.title}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px', color: 'var(--ceo-text-primary)' }}>{kpi.value}</span>
                <span style={{ display: 'flex', alignItems: 'center', color: kpi.color, fontSize: '12px', fontWeight: 600, background: `${kpi.color}15`, padding: '2px 6px', borderRadius: '4px' }}>
                  {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'} {kpi.percent}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* SECTION 3: Edge-to-Edge Business Analytics */}
        <motion.div variants={itemVariants} className="ceo-command-panel">
          <div className="ceo-command-header">
            <div className="ceo-dash-card-title"><IndianRupee size={18} color="var(--ceo-primary)" /> Revenue & Profit Performance vs Target</div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 500 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'var(--ceo-primary)', borderRadius: '2px' }}></div> Revenue</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'var(--ceo-success)', borderRadius: '2px' }}></div> Profit</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '2px', background: 'var(--ceo-text-muted)' }}></div> Target</span>
            </div>
          </div>
          <div className="ceo-command-content" style={{ height: '350px', padding: '24px 24px 0 0' }}>
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
                <Tooltip contentStyle={{ backgroundColor: 'var(--ceo-card-bg)', borderColor: 'var(--ceo-border)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--ceo-text-primary)' }} />
                <Area type="monotone" dataKey="rev" stroke="var(--ceo-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Bar dataKey="profit" fill="var(--ceo-success)" radius={[4, 4, 0, 0]} barSize={32} />
                <Line type="monotone" dataKey="target" stroke="var(--ceo-text-muted)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* SECTION 4: Split Screen Action Center */}
        <div className="ceo-split-layout">
          
          {/* Action Center - Left */}
          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-left">
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><CheckCircle size={18} color="var(--ceo-warning)" /> Priority Approval Queue</div>
              <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-primary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>View All →</button>
            </div>
            <div className="ceo-erp-table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="ceo-erp-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Type & Dept</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentApprovals.map((req, i) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--ceo-text-secondary)' }}>{req.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{req.type}</div>
                        <div style={{ color: 'var(--ceo-text-muted)', fontSize: '11px' }}>{req.dept}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{req.amount}</td>
                      <td style={{ color: 'var(--ceo-text-secondary)' }}>{req.date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="ceo-btn ceo-btn-primary" style={{ padding: '4px 12px', fontSize: '11px' }}>Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Strategic OKRs - Right */}
          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-right">
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><Target size={18} color="var(--ceo-purple)" /> Strategic Objectives</div>
            </div>
            <div className="ceo-command-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {okrData.map((okr, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '2px' }}>{okr.title}</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--ceo-text-muted)' }}>{okr.id}</div>
                    </div>
                    <span className={`ceo-badge ${okr.status === 'On Track' || okr.status === 'Near Completion' ? 'success' : 'warning'}`}>
                      {okr.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${okr.progress}%`, height: '100%', background: okr.status === 'Behind Schedule' ? 'var(--ceo-warning)' : 'var(--ceo-success)' }}></div>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 600, minWidth: '35px', textAlign: 'right' }}>{okr.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

      </motion.div>
    </div>
  );
}
