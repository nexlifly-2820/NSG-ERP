import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Crosshair, Flag, Settings, ChevronRight, Activity, 
  ChevronDown, FileText
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const kpiStripData = [
  { title: "Company Objectives", value: "4", trend: "flat", percent: "0%", color: "#2563EB" },
  { title: "Overall Progress", value: "72%", trend: "up", percent: "8%", color: "#10B981" },
  { title: "At Risk OKRs", value: "2", trend: "down", percent: "1", color: "#EF4444" },
  { title: "Aligned Departments", value: "100%", trend: "flat", percent: "0%", color: "#10B981" },
  { title: "Strategic Initiatives", value: "18", trend: "up", percent: "3", color: "#8B5CF6" },
  { title: "Budget Committed", value: "₹4.2M", trend: "flat", percent: "0%", color: "#F59E0B" },
];

const okrHierarchy = [
  {
    id: "OBJ-1", title: "Achieve $50M ARR and Sustainable Profitability", owner: "Vivek C. (CEO)", progress: 68, status: "On Track", 
    krs: [
      { id: "KR-1.1", title: "Increase Q2 New Business Revenue by 25%", owner: "Sales", progress: 85, status: "On Track" },
      { id: "KR-1.2", title: "Reduce Cloud Infrastructure Costs by 15%", owner: "Engineering", progress: 40, status: "At Risk" },
    ]
  },
  {
    id: "OBJ-2", title: "Launch Enterprise Portal V2 to Global Market", owner: "Sarah Connor (VP Eng)", progress: 92, status: "Near Completion",
    krs: [
      { id: "KR-2.1", title: "Complete Beta Testing with 5 Enterprise Clients", owner: "Product", progress: 100, status: "Completed" },
      { id: "KR-2.2", title: "Achieve 99.99% Uptime across all clusters", owner: "IT Infra", progress: 85, status: "On Track" },
    ]
  },
  {
    id: "OBJ-3", title: "Expand Market Presence in EU Region", owner: "Harvey Specter", progress: 34, status: "Behind Schedule",
    krs: [
      { id: "KR-3.1", title: "Open Regional HQ in London", owner: "Operations", progress: 60, status: "On Track" },
      { id: "KR-3.2", title: "Hire 20 Regional Sales Representatives", owner: "HR", progress: 10, status: "At Risk" },
    ]
  }
];

const alignmentData = [
  { dept: 'Sales', score: 95 },
  { dept: 'Engineering', score: 88 },
  { dept: 'Marketing', score: 72 },
  { dept: 'Operations', score: 85 },
  { dept: 'HR & Fin', score: 90 },
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

export default function StrategyOKRs() {
  const [expandedObj, setExpandedObj] = useState(null);

  const toggleObj = (id) => {
    if(expandedObj === id) setExpandedObj(null);
    else setExpandedObj(id);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'On Track': return 'var(--ceo-success)';
      case 'Near Completion': return 'var(--ceo-success)';
      case 'Completed': return 'var(--ceo-primary)';
      case 'Behind Schedule': return 'var(--ceo-warning)';
      case 'At Risk': return 'var(--ceo-danger)';
      default: return 'var(--ceo-text-muted)';
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
            <span className="ceo-badge neutral">Boardroom Intelligence</span>
            <ChevronRight size={14} color="var(--ceo-text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Strategic Planning System</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Enterprise Strategy & OKRs</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="ceo-btn"><FileText size={16} /> Board Report</button>
          <button className="ceo-btn"><Activity size={16} /> Strategy Map</button>
          <button className="ceo-btn ceo-btn-primary"><Target size={16} /> Define Objective</button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* SECTION 2: OKR KPI Dashboard */}
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

        {/* SECTION 3: Split View - Strategic Objectives Hierarchy */}
        <div className="ceo-split-layout">
          
          <motion.div variants={itemVariants} className="ceo-command-panel ceo-split-left" style={{ flex: 2.5 }}>
            <div className="ceo-command-header">
              <div className="ceo-dash-card-title"><Target size={18} color="var(--ceo-primary)" /> Company Objectives & Key Results</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select className="ceo-form-input" style={{ width: '150px', padding: '6px 12px', fontSize: '12px' }}>
                  <option>FY 2026 Q2</option>
                  <option>FY 2026 Q1</option>
                  <option>FY 2025 Annual</option>
                </select>
                <button className="ceo-btn" style={{ padding: '6px 12px' }}><Settings size={14} /> Filter</button>
              </div>
            </div>
            
            <div className="ceo-command-content" style={{ padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Header Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', padding: '12px 24px', background: 'var(--ceo-bg)', borderBottom: '1px solid var(--ceo-border)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ceo-text-secondary)' }}>
                  <div>Objective / Key Result</div>
                  <div>Owner</div>
                  <div>Progress</div>
                  <div style={{ textAlign: 'right' }}>Status</div>
                </div>

                {/* Rows */}
                {okrHierarchy.map((obj, i) => (
                  <div key={i} style={{ borderBottom: '1px solid var(--ceo-border)' }}>
                    <div onClick={() => toggleObj(obj.id)} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', padding: '16px 24px', cursor: 'pointer', transition: 'background 0.2s', background: expandedObj === obj.id ? '#F8FAFC' : 'transparent', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ChevronDown size={16} style={{ transform: expandedObj === obj.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: 'var(--ceo-text-muted)' }} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', color: 'var(--ceo-text-primary)' }}>{obj.title}</div>
                          <div style={{ fontFamily: 'monospace', color: 'var(--ceo-text-muted)', fontSize: '11px' }}>{obj.id}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--ceo-text-primary)' }}>{obj.owner}</div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, minWidth: '100px', height: '6px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${obj.progress}%`, height: '100%', background: getStatusColor(obj.status) }}></div>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: 600 }}>{obj.progress}%</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: getStatusColor(obj.status), fontWeight: 600, fontSize: '12px' }}>{obj.status}</span>
                      </div>
                    </div>

                    {/* Expanded Key Results */}
                    <AnimatePresence>
                      {expandedObj === obj.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', background: '#F8FAFC' }}>
                          {obj.krs.map((kr, k) => (
                            <div key={k} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.5fr 1fr', padding: '12px 24px 12px 56px', borderTop: '1px dashed var(--ceo-border)', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Crosshair size={14} color="var(--ceo-text-muted)" />
                                <div>
                                  <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--ceo-text-primary)' }}>{kr.title}</div>
                                  <div style={{ fontFamily: 'monospace', color: 'var(--ceo-text-muted)', fontSize: '10px' }}>{kr.id}</div>
                                </div>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)' }}>{kr.owner}</div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <div style={{ flex: 1, minWidth: '100px', height: '4px', background: '#E2E8F0', borderRadius: '2px', overflow: 'hidden' }}>
                                    <div style={{ width: `${kr.progress}%`, height: '100%', background: getStatusColor(kr.status) }}></div>
                                  </div>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ceo-text-secondary)' }}>{kr.progress}%</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ color: getStatusColor(kr.status), fontWeight: 500, fontSize: '11px' }}>{kr.status}</span>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div className="ceo-split-right" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <motion.div variants={itemVariants} className="ceo-command-panel">
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><Activity size={18} color="var(--ceo-success)" /> Strategic Alignment Score</div>
              </div>
              <div className="ceo-command-content" style={{ height: '220px', padding: '24px 24px 0 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alignmentData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="var(--ceo-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis dataKey="dept" type="category" stroke="var(--ceo-text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--ceo-card-bg)', borderColor: 'var(--ceo-border)', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} itemStyle={{ color: 'var(--ceo-text-primary)' }} cursor={{ fill: 'var(--ceo-bg)' }} />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={16}>
                      {alignmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.score < 80 ? 'var(--ceo-warning)' : 'var(--ceo-success)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="ceo-command-panel" style={{ borderTop: '4px solid var(--ceo-warning)' }}>
              <div className="ceo-command-header" style={{ background: 'transparent' }}>
                <div className="ceo-dash-card-title"><Flag size={18} color="var(--ceo-warning)" /> OKR Exceptions</div>
              </div>
              <div className="ceo-command-content" style={{ paddingTop: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ padding: '12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#B45309', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>KR-1.2: Cloud Costs</div>
                    <div style={{ fontSize: '13px', color: '#92400E' }}>Cloud provider pricing changes impacted Q2 budget. Restructuring required.</div>
                  </div>
                  <div style={{ padding: '12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#B91C1C', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>KR-3.2: Sales Hiring</div>
                    <div style={{ fontSize: '13px', color: '#991B1B' }}>Recruiting pipeline in EU dried up. Need executive intervention for agency hire.</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </div>

      </motion.div>
    </div>
  );
}
