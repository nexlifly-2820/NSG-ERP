import React from 'react';
import { motion } from 'framer-motion';
import { 
  Users, UserPlus, TrendingUp, TrendingDown,
  Activity, DollarSign, Target, FileText, Download, Briefcase, 
  MapPin, Settings, ChevronRight, Award, BarChart2, PieChart
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const kpiStripData = [
  { title: "Total Headcount", value: "842", trend: "up", percent: "4.2%", color: "#2563EB" },
  { title: "Retention Rate", value: "94.5%", trend: "up", percent: "1.1%", color: "#10B981" },
  { title: "Payroll (Monthly)", value: "₹18.4M", trend: "up", percent: "2.4%", color: "#F59E0B" },
  { title: "Open Requisitions", value: "24", trend: "down", percent: "15%", color: "#64748B" },
  { title: "eNPS Score", value: "72", trend: "up", percent: "4 pts", color: "#10B981" },
  { title: "Avg Tenure", value: "3.4 Yrs", trend: "flat", percent: "0%", color: "#8B5CF6" },
];

const leadershipDirectory = [
  { id: "EMP-001", name: "Vivek C.", role: "Chief Executive Officer", dept: "Executive", loc: "Hyderabad HQ", rating: "Exceeds", status: "Active" },
  { id: "EMP-002", name: "Sarah Connor", role: "VP of Engineering", dept: "Engineering", loc: "Hyderabad HQ", rating: "Exceeds", status: "Active" },
  { id: "EMP-003", name: "John Doe", role: "Chief Financial Officer", dept: "Finance", loc: "Mumbai Branch", rating: "Meets", status: "Active" },
  { id: "EMP-004", name: "Jane Smith", role: "VP of HR", dept: "Human Resources", loc: "Hyderabad HQ", rating: "Meets", status: "Active" },
  { id: "EMP-005", name: "Mike Ross", role: "Head of Marketing", dept: "Marketing", loc: "Remote - US", rating: "Needs Imprv", status: "Performance Plan" },
  { id: "EMP-012", name: "Harvey Specter", role: "Chief Legal Officer", dept: "Legal", loc: "Remote - US", rating: "Exceeds", status: "Active" },
];

const deptDistribution = [
  { name: 'Engineering', count: 320, cost: '₹8.4M', color: '#2563EB' },
  { name: 'Sales', count: 180, cost: '₹4.2M', color: '#10B981' },
  { name: 'Operations', count: 150, cost: '₹2.8M', color: '#F59E0B' },
  { name: 'Marketing', count: 85, cost: '₹1.5M', color: '#8B5CF6' },
  { name: 'HR & Fin', count: 107, cost: '₹1.5M', color: '#64748B' },
];

const hiringTrends = [
  { name: 'Q1', joined: 45, left: 12 },
  { name: 'Q2', joined: 32, left: 8 },
  { name: 'Q3', joined: 65, left: 15 },
  { name: 'Q4', joined: 28, left: 9 },
  { name: 'Q1 (Cur)', joined: 18, left: 4 },
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

export default function People() {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'Active': return <span className="ceo-badge success">Active</span>;
      case 'On Leave': return <span className="ceo-badge warning">On Leave</span>;
      case 'Performance Plan': return <span className="ceo-badge critical">Action Reqd</span>;
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
            <span className="ceo-badge neutral">Human Capital</span>
            <ChevronRight size={14} color="var(--ceo-text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Workforce Intelligence</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Leadership & Workforce</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="ceo-btn"><BarChart2 size={16} /> Analytics</button>
          <button className="ceo-btn"><Download size={16} /> Export Roster</button>
          <button className="ceo-btn ceo-btn-primary"><UserPlus size={16} /> Open Requisition</button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 2: HR KPI Dashboard */}
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

        {/* SECTION 3: Split View - Hiring Trends & Dept Distribution */}
        <div className="ceo-split-layout">
          
          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-left">
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><Activity size={18} color="var(--ceo-primary)" /> Net Headcount Growth & Attrition</div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px', fontWeight: 500 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'var(--ceo-primary)', borderRadius: '2px' }}></div> Hires</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: 'var(--ceo-danger)', borderRadius: '2px' }}></div> Exits</span>
              </div>
            </div>
            <div className="ceo-command-content" style={{ height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hiringTrends} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'var(--ceo-card-bg)', borderColor: 'var(--ceo-border)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--ceo-text-primary)' }} cursor={{ fill: 'var(--ceo-bg)' }} />
                  <Bar dataKey="joined" fill="var(--ceo-primary)" radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="left" fill="var(--ceo-danger)" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-right">
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><PieChart size={18} color="var(--ceo-success)" /> Distribution & Payroll Map</div>
            </div>
            <div className="ceo-command-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 24px' }}>
              {deptDistribution.map((dept, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{dept.name}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700 }}>{dept.count} <span style={{ fontSize: '11px', color: 'var(--ceo-text-muted)', fontWeight: 500 }}>emps</span></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ flex: 1, height: '6px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(dept.count / 842) * 100}%`, height: '100%', background: dept.color, borderRadius: '3px' }}></div>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)', width: '45px', textAlign: 'right' }}>{dept.cost}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>

        {/* SECTION 4: Enterprise Employee Directory (Leadership View) */}
        <motion.div variants={itemVariants} className="ceo-command-panel">
          <div className="ceo-command-header">
            <div className="ceo-dash-card-title"><Users size={18} color="var(--ceo-purple)" /> Core Leadership & Management Matrix</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="text" placeholder="Search employees..." className="ceo-form-input" style={{ width: '250px', padding: '6px 12px', fontSize: '12px' }} />
              <button className="ceo-btn" style={{ padding: '6px 12px' }}><Settings size={14} /> Filter</button>
            </div>
          </div>
          
          <div className="ceo-erp-table-container" style={{ border: 'none', borderRadius: '0' }}>
            <table className="ceo-erp-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role & Department</th>
                  <th>Location</th>
                  <th>Performance Tier</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leadershipDirectory.map((emp, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', color: 'var(--ceo-text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '12px' }}>
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ceo-text-primary)' }}>{emp.name}</div>
                          <div style={{ fontFamily: 'monospace', color: 'var(--ceo-text-muted)', fontSize: '11px' }}>{emp.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{emp.role}</div>
                      <div style={{ color: 'var(--ceo-text-muted)', fontSize: '12px' }}>{emp.dept}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--ceo-text-secondary)' }}>
                        <MapPin size={14} /> {emp.loc}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                        background: emp.rating === 'Exceeds' ? '#F0FDF4' : emp.rating === 'Meets' ? '#EFF6FF' : '#FEF2F2',
                        border: `1px solid ${emp.rating === 'Exceeds' ? '#A7F3D0' : emp.rating === 'Meets' ? '#BFDBFE' : '#FECACA'}`,
                        color: emp.rating === 'Exceeds' ? '#10B981' : emp.rating === 'Meets' ? '#2563EB' : '#EF4444'
                      }}>
                        <Award size={12} /> {emp.rating}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>{getStatusBadge(emp.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '12px 24px', textAlign: 'center', borderTop: '1px solid var(--ceo-border)', background: 'var(--ceo-bg)' }}>
            <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-primary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Load Full Organization Roster →</button>
          </div>
        </motion.div>

      </motion.div>

    </div>
  );
}
