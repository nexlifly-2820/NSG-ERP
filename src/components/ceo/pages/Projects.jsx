import React from 'react';
import { motion } from 'framer-motion';
import { 
  Briefcase, Activity, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, Users, Target, ShieldAlert, ChevronRight, Settings, Filter
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const kpiStripData = [
  { title: "Total Portfolio Value", value: "₹18.4M", trend: "up", percent: "5%", color: "#2563EB" },
  { title: "Active Initiatives", value: "34", trend: "up", percent: "2", color: "#10B981" },
  { title: "At Risk / Delayed", value: "3", trend: "down", percent: "1", color: "#EF4444" },
  { title: "Avg Velocity", value: "92%", trend: "up", percent: "4%", color: "#8B5CF6" },
  { title: "Resource Allocation", value: "88%", trend: "flat", percent: "0%", color: "#3B82F6" },
  { title: "Upcoming Milestones", value: "12", trend: "up", percent: "3", color: "#F59E0B" },
];

const portfolioTable = [
  { id: "PRJ-992", name: "Enterprise ERP Cloud Migration", sponsor: "CTO Office", budget: "₹4.2M", health: "Healthy", progress: 68, status: "Active" },
  { id: "PRJ-993", name: "Q3 Marketing Campaign Rollout", sponsor: "CMO Office", budget: "₹1.8M", health: "At Risk", progress: 34, status: "Delayed" },
  { id: "PRJ-994", name: "Data Center Infrastructure Upgrade", sponsor: "IT Dept", budget: "₹8.5M", health: "Healthy", progress: 92, status: "Closing" },
  { id: "PRJ-995", name: "Compliance & Security Audit 2026", sponsor: "Legal", budget: "₹0.9M", health: "Healthy", progress: 15, status: "Planning" },
  { id: "PRJ-996", name: "Sales Portal V2 Beta Launch", sponsor: "Sales", budget: "₹2.2M", health: "Warning", progress: 75, status: "Active" },
];

const allocationData = [
  { dept: 'Engineering', load: 95 },
  { dept: 'Design', load: 85 },
  { dept: 'Marketing', load: 110 },
  { dept: 'QA / Testing', load: 75 },
  { dept: 'Operations', load: 60 },
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

export default function Projects() {
  const getHealthBadge = (health) => {
    switch(health) {
      case 'Healthy': return <span className="ceo-badge success">Healthy</span>;
      case 'Warning': return <span className="ceo-badge warning">Warning</span>;
      case 'At Risk': return <span className="ceo-badge critical">At Risk</span>;
      default: return <span className="ceo-badge neutral">{health}</span>;
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
            <span className="ceo-badge neutral">Delivery & Operations</span>
            <ChevronRight size={14} color="var(--ceo-text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Portfolio Intelligence</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Strategic Project Portfolio</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="ceo-btn"><Settings size={16} /> Portfolio Settings</button>
          <button className="ceo-btn ceo-btn-primary"><Target size={16} /> New Strategic Initiative</button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 2: Portfolio KPI Dashboard */}
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

        {/* SECTION 3: Main Layout - Table & Analytics */}
        <div className="ceo-split-layout">
          
          {/* Main Portfolio Matrix */}
          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-left" style={{ flex: 2 }}>
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><Briefcase size={18} color="var(--ceo-primary)" /> Tier 1 Enterprise Initiatives Matrix</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="Search initiatives..." className="ceo-form-input" style={{ width: '200px', padding: '6px 12px', fontSize: '12px' }} />
                <button className="ceo-btn" style={{ padding: '6px 12px' }}><Filter size={14} /> Filter</button>
              </div>
            </div>
            
            <div className="ceo-erp-table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="ceo-erp-table">
                <thead>
                  <tr>
                    <th>Initiative ID / Name</th>
                    <th>Executive Sponsor</th>
                    <th>Approved Budget</th>
                    <th>Delivery Progress</th>
                    <th style={{ textAlign: 'right' }}>Health / Status</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioTable.map((prj, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{prj.name}</div>
                        <div style={{ fontFamily: 'monospace', color: 'var(--ceo-text-muted)', fontSize: '11px', marginTop: '2px' }}>{prj.id}</div>
                      </td>
                      <td>{prj.sponsor}</td>
                      <td style={{ fontWeight: 600 }}>{prj.budget}</td>
                      <td style={{ width: '200px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${prj.progress}%`, height: '100%', background: prj.health === 'At Risk' ? 'var(--ceo-danger)' : prj.health === 'Warning' ? 'var(--ceo-warning)' : 'var(--ceo-success)' }}></div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600, width: '35px', textAlign: 'right' }}>{prj.progress}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ marginBottom: '4px' }}>{getHealthBadge(prj.health)}</div>
                        <div style={{ fontSize: '11px', color: 'var(--ceo-text-muted)', fontWeight: 600 }}>{prj.status}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <div className="ceo-split-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Project Risk Board */}
            <motion.div variants={itemVariants} className="ceo-command-panel" style={{ borderTop: '4px solid var(--ceo-danger)' }}>
              <div className="ceo-command-header" style={{ background: 'transparent' }}>
                <div className="ceo-dash-card-title"><ShieldAlert size={18} color="var(--ceo-danger)" /> Escalation Board</div>
              </div>
              <div className="ceo-command-content" style={{ paddingTop: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '16px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span className="ceo-badge critical">PRJ-993</span>
                      <span style={{ fontSize: '11px', color: 'var(--ceo-danger)', fontWeight: 600 }}>Over Budget</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ceo-text-primary)', marginBottom: '4px' }}>Q3 Marketing Campaign</div>
                    <div style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)' }}>Resource bottleneck in content production. Requires executive override for external agency hire.</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Resource Allocation */}
            <motion.div variants={itemVariants} className="ceo-command-panel">
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><Users size={18} color="var(--ceo-primary)" /> Department Utilization Matrix</div>
              </div>
              <div className="ceo-command-content" style={{ height: '220px', padding: '16px 24px 0 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={allocationData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" horizontal={false} />
                    <XAxis type="number" domain={[0, 120]} stroke="var(--ceo-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="dept" type="category" stroke="var(--ceo-text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--ceo-card-bg)', borderColor: 'var(--ceo-border)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--ceo-text-primary)' }} cursor={{ fill: 'var(--ceo-bg)' }} />
                    <Bar dataKey="load" radius={[0, 4, 4, 0]} barSize={16}>
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.load > 100 ? 'var(--ceo-danger)' : 'var(--ceo-success)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
