import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Megaphone, Plus, Calendar, FileText, Send, Clock, 
  BarChart2, Users, AlertTriangle, Eye, ArrowRight, Download,
  MoreVertical, CheckCircle, Bell, ChevronRight, X, Image,
  Paperclip, Bold, Italic, Underline, Link, List, Quote, ShieldAlert
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const kpiStripData = [
  { title: "Total Announcements", value: "142", trend: "up", percent: "12%", color: "#2563EB" },
  { title: "Published This Month", value: "18", trend: "up", percent: "5%", color: "#10B981" },
  { title: "Scheduled Posts", value: "4", trend: "down", percent: "2%", color: "#F59E0B" },
  { title: "Employee Read Rate", value: "86%", trend: "up", percent: "4%", color: "#8B5CF6" },
  { title: "Department Reach", value: "100%", trend: "flat", percent: "0%", color: "#10B981" },
  { title: "Priority Alerts", value: "2", trend: "up", percent: "100%", color: "#EF4444" },
];

const announcements = [
  { id: "COM-042", title: "Q2 Townhall & Strategic Update", cat: "Leadership Message", prio: "High", aud: "Entire Organization", date: "Today, 10:00 AM", status: "Published", reads: "85%" },
  { id: "COM-043", title: "Updated WFH Guidelines 2026", cat: "Policy Update", prio: "Normal", aud: "Entire Organization", date: "28 May 2026", status: "Published", reads: "92%" },
  { id: "COM-044", title: "New ERP Deployment Schedule", cat: "Company Update", prio: "Normal", aud: "IT Department", date: "02 Jun 2026", status: "Scheduled", reads: "0%" },
  { id: "COM-045", title: "Draft: Q3 Financial Goals", cat: "Leadership Message", prio: "Normal", aud: "Finance Department", date: "-", status: "Draft", reads: "0%" },
];

const alerts = [
  { title: "Server Maintenance Downtime (Critical)", time: "Tomorrow, 02:00 AM", cat: "System Alert", level: "Critical" },
  { title: "Compliance Training Deadline", time: "30 May 2026", cat: "Compliance Alert", level: "High" },
];

const chartData = [
  { name: 'Mon', reads: 420 },
  { name: 'Tue', reads: 580 },
  { name: 'Wed', reads: 490 },
  { name: 'Thu', reads: 650 },
  { name: 'Fri', reads: 720 },
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

export default function Announcements() {
  const [composerOpen, setComposerOpen] = useState(false);

  const getPriorityBadge = (p) => {
    switch(p) {
      case 'High': return <span className="ceo-badge warning">High</span>;
      case 'Critical': return <span className="ceo-badge critical">Critical</span>;
      default: return <span className="ceo-badge neutral">Normal</span>;
    }
  };

  const getStatusBadge = (s) => {
    switch(s) {
      case 'Published': return <span style={{ color: 'var(--ceo-success)', fontWeight: 600 }}>Published</span>;
      case 'Scheduled': return <span style={{ color: 'var(--ceo-warning)', fontWeight: 600 }}>Scheduled</span>;
      case 'Draft': return <span style={{ color: 'var(--ceo-text-muted)', fontWeight: 600 }}>Draft</span>;
      default: return <span>{s}</span>;
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
            <span className="ceo-badge neutral">Communications</span>
            <ChevronRight size={14} color="var(--ceo-text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Corporate Information Board</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Organization Broadcasting</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="ceo-btn"><BarChart2 size={16} /> Comms Analytics</button>
          <button onClick={() => setComposerOpen(!composerOpen)} className={`ceo-btn ${composerOpen ? 'ceo-btn-danger' : 'ceo-btn-primary'}`}>
            {composerOpen ? <><X size={16} /> Close Composer</> : <><Plus size={16} /> Create Announcement</>}
          </button>
        </div>
      </motion.div>

      {/* COMPOSER (Expandable) */}
      <AnimatePresence>
        {composerOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginBottom: '32px' }}
          >
            <div className="ceo-command-panel" style={{ border: '1px solid var(--ceo-primary)', boxShadow: 'var(--ceo-shadow-glow)' }}>
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><Megaphone size={18} color="var(--ceo-primary)" /> Executive Announcement Composer</div>
              </div>
              
              <div className="ceo-split-layout" style={{ padding: '24px' }}>
                <div className="ceo-split-left" style={{ flex: 2 }}>
                  <div className="ceo-form-group">
                    <label>Announcement Title <span style={{color: 'var(--ceo-danger)'}}>*</span></label>
                    <input type="text" className="ceo-form-input" placeholder="Enter an executive, attention-grabbing title..." />
                  </div>
                  
                  <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--ceo-bg)' }}>
                    <div style={{ display: 'flex', gap: '12px', padding: '12px', borderBottom: '1px solid var(--ceo-border)', background: '#FFFFFF' }}>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-text-primary)', cursor: 'pointer' }}><Bold size={16} /></button>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-text-primary)', cursor: 'pointer' }}><Italic size={16} /></button>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-text-primary)', cursor: 'pointer' }}><Underline size={16} /></button>
                      <div style={{ width: '1px', height: '16px', background: 'var(--ceo-border)', margin: '0 4px' }}></div>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}><Image size={16} /> Image</button>
                      <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}><Paperclip size={16} /> PDF</button>
                    </div>
                    <textarea 
                      className="ceo-form-input" 
                      style={{ border: 'none', borderRadius: 0, minHeight: '200px', background: 'transparent', resize: 'vertical' }} 
                      placeholder="Write your corporate communication here... (Required)"
                    ></textarea>
                  </div>
                </div>

                <div className="ceo-split-right" style={{ flex: 1, paddingLeft: '24px', borderLeft: '1px solid var(--ceo-border)' }}>
                  <div className="ceo-form-group">
                    <label>Category</label>
                    <select className="ceo-form-input"><option>Leadership Message</option></select>
                  </div>
                  <div className="ceo-form-group">
                    <label>Target Audience</label>
                    <select className="ceo-form-input"><option>Entire Organization</option></select>
                  </div>
                  <div className="ceo-form-group">
                    <label>Publishing</label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input type="radio" name="publish" defaultChecked /> <span style={{ fontSize: '13px' }}>Immediately</span>
                      <input type="radio" name="publish" /> <span style={{ fontSize: '13px' }}>Schedule</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 'auto', display: 'flex', gap: '12px' }}>
                    <button className="ceo-btn" style={{ flex: 1 }}>Save Draft</button>
                    <button className="ceo-btn ceo-btn-primary" style={{ flex: 2 }}><Send size={16} /> Publish</button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 2: Comms KPI Dashboard */}
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

        {/* SECTION 3: Main Layout - Active Announcements and Alerts */}
        <div className="ceo-split-layout">
          
          {/* Main Grid */}
          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-left" style={{ flex: 2 }}>
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><FileText size={18} color="var(--ceo-primary)" /> Active Announcements Library</div>
            </div>
            
            <div className="ceo-erp-table-container" style={{ border: 'none', borderRadius: '0' }}>
              <table className="ceo-erp-table">
                <thead>
                  <tr>
                    <th>Title & Category</th>
                    <th>Priority</th>
                    <th>Audience</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Status / Read</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((ann, i) => (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{ann.title}</div>
                        <div style={{ color: 'var(--ceo-text-muted)', fontSize: '11px', marginTop: '4px' }}>{ann.cat}</div>
                      </td>
                      <td>{getPriorityBadge(ann.prio)}</td>
                      <td>{ann.aud}</td>
                      <td style={{ color: 'var(--ceo-text-secondary)' }}>{ann.date}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ marginBottom: '4px' }}>{getStatusBadge(ann.status)}</div>
                        {ann.status === 'Published' && (
                          <div style={{ fontSize: '11px', color: 'var(--ceo-purple)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontWeight: 600 }}>
                            <Eye size={12} /> {ann.reads} Read
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          <div className="ceo-split-right" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Priority Alerts */}
            <motion.div variants={itemVariants} className="ceo-command-panel" style={{ borderTop: '4px solid var(--ceo-danger)' }}>
              <div className="ceo-command-header" style={{ background: 'transparent' }}>
                <div className="ceo-dash-card-title"><ShieldAlert size={18} color="var(--ceo-danger)" /> Emergency Communications</div>
              </div>
              <div className="ceo-command-content" style={{ paddingTop: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {alerts.map((alert, i) => (
                    <div key={i} style={{ padding: '16px', background: alert.level === 'Critical' ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${alert.level === 'Critical' ? '#FECACA' : '#FDE68A'}`, borderRadius: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span className={`ceo-badge ${alert.level === 'Critical' ? 'critical' : 'warning'}`}>{alert.cat}</span>
                        <span style={{ fontSize: '11px', color: 'var(--ceo-text-muted)' }}>{alert.time}</span>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: alert.level === 'Critical' ? '#B91C1C' : '#B45309' }}>
                        {alert.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Read Trends */}
            <motion.div variants={itemVariants} className="ceo-command-panel">
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><BarChart2 size={18} color="var(--ceo-primary)" /> Read Trends (5 Days)</div>
              </div>
              <div className="ceo-command-content" style={{ height: '220px', padding: '16px 24px 0 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReads" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--ceo-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--ceo-primary)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--ceo-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--ceo-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--ceo-card-bg)', borderColor: 'var(--ceo-border)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--ceo-text-primary)' }} cursor={{ fill: 'var(--ceo-bg)' }} />
                    <Area type="monotone" dataKey="reads" stroke="var(--ceo-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorReads)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
