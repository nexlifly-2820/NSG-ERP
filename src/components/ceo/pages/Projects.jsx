import React, { useState } from 'react';
import { 
  Search, Filter, LayoutGrid, List, CheckCircle, 
  AlertTriangle, Clock, Target, PlayCircle, Lock
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const mockProjects = [
  { id: 1, name: "ERP Migration V2", client: "Internal", budget: 1500000, used: 1250000, status: "Active", deadline: "Dec 31, 2025" },
  { id: 2, name: "Q3 Marketing Campaign", client: "Acme Corp", budget: 500000, used: 480000, status: "At Risk", deadline: "Oct 15, 2025" },
  { id: 3, name: "Data Center Upgrade", client: "TechCorp", budget: 2000000, used: 900000, status: "Active", deadline: "Feb 28, 2026" },
  { id: 4, name: "Mobile App Rebuild", client: "FinBank", budget: 850000, used: 200000, status: "Active", deadline: "Nov 30, 2025" },
  { id: 5, name: "Q1 Training Program", client: "Internal", budget: 150000, used: 150000, status: "Completed", deadline: "Aug 10, 2025" },
];

const mockKanban = [
  { id: 'todo', title: 'To Do', tasks: [
    { id: 'T1', title: 'Setup staging environment' },
    { id: 'T2', title: 'Finalize DB schema' }
  ]},
  { id: 'prog', title: 'In Progress', tasks: [
    { id: 'T3', title: 'API Gateway integration' },
  ]},
  { id: 'review', title: 'Review', tasks: [
    { id: 'T4', title: 'Security Audit' }
  ]},
  { id: 'done', title: 'Done', tasks: [
    { id: 'T5', title: 'Requirements gathering' },
    { id: 'T6', title: 'Vendor shortlisting' }
  ]}
];

export default function Projects() {
  const [viewMode, setViewMode] = useState('grid');
  const [signoffProject, setSignoffProject] = useState(null);
  const [signature, setSignature] = useState(false); // mock digital signature

  const getBudgetColor = (used, total) => {
    const pct = used / total;
    if (pct > 0.9) return 'var(--ceo-danger)';
    if (pct > 0.75) return 'var(--ceo-warning)';
    return 'var(--ceo-success)';
  };

  const handleSignoff = () => {
    // Perform sign off logic
    setSignoffProject(null);
    setSignature(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px', position: 'relative' }}>
      
      {/* HEADER & TOOLBAR */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="ceo-typography-page-title">Enterprise Project Portfolio</h1>
          <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Strategic oversight of budgets, deadlines, and deliverables.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={16} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input type="text" className="ceo-form-input" placeholder="Search projects..." style={{ paddingLeft: '36px', height: '40px' }} />
          </div>
          <button className="ceo-btn" style={{ padding: '8px 12px' }}><Filter size={16}/> Filters</button>
          
          <div style={{ display: 'flex', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', borderRadius: '8px', overflow: 'hidden', marginLeft: '16px' }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ padding: '8px 12px', border: 'none', background: viewMode === 'grid' ? 'var(--ceo-card-bg)' : 'transparent', color: viewMode === 'grid' ? 'var(--ceo-primary)' : 'var(--ceo-text-muted)', cursor: 'pointer', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              style={{ padding: '8px 12px', border: 'none', background: viewMode === 'kanban' ? 'var(--ceo-card-bg)' : 'transparent', color: viewMode === 'kanban' ? 'var(--ceo-primary)' : 'var(--ceo-text-muted)', cursor: 'pointer', boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: GRID */}
      {viewMode === 'grid' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
          {mockProjects.map(proj => (
            <div key={proj.id} className="ceo-command-panel" style={{ padding: '24px', opacity: proj.status === 'Completed' ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className={`ceo-badge ${proj.status === 'At Risk' ? 'critical' : proj.status === 'Active' ? 'success' : 'neutral'}`}>
                  {proj.status}
                </span>
                <span className="ceo-typography-meta"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/> {proj.deadline}</span>
              </div>
              
              <div className="ceo-typography-section-title" style={{ fontSize: '18px' }}>{proj.name}</div>
              <div className="ceo-typography-meta" style={{ fontStyle: 'italic', marginBottom: '24px', marginTop: '4px' }}>Client: {proj.client}</div>
              
              {/* Budget Bar */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="ceo-typography-meta">Budget Usage</span>
                  <span className="ceo-typography-meta" style={{ fontWeight: 600, color: 'var(--ceo-text-primary)' }}>
                    ₹{(proj.used/1000).toFixed(0)}K / ₹{(proj.budget/1000).toFixed(0)}K
                  </span>
                </div>
                <div style={{ height: '8px', background: 'var(--ceo-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(100, (proj.used / proj.budget) * 100)}%`, 
                    background: getBudgetColor(proj.used, proj.budget) 
                  }}></div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--ceo-border)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="ceo-btn" onClick={() => setSignoffProject(proj)} disabled={proj.status === 'Completed'}>
                  <Target size={16} /> Sign-off Milestone
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW: KANBAN (Read-Only) */}
      {viewMode === 'kanban' && (
        <div style={{ display: 'flex', gap: '24px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
          <div style={{ position: 'absolute', top: 80, right: 0, background: 'var(--ceo-warning)', color: '#fff', padding: '4px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={14}/> Executive Read-Only View
          </div>
          
          {mockKanban.map(col => (
            <div key={col.id} style={{ minWidth: '300px', flex: 1, background: 'var(--ceo-bg)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="ceo-typography-section-title" style={{ fontSize: '14px', textTransform: 'uppercase' }}>{col.title}</div>
                <div className="ceo-badge neutral">{col.tasks.length}</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {col.tasks.map(task => (
                  <div key={task.id} style={{ background: 'var(--ceo-card-bg)', padding: '16px', borderRadius: '8px', border: '1px solid var(--ceo-border)', boxShadow: 'var(--ceo-shadow)' }}>
                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ceo-text-primary)' }}>{task.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                      <span className="ceo-typography-meta">{task.id}</span>
                      <img src={`https://ui-avatars.com/api/?name=Dev&background=random&size=24`} alt="assignee" style={{ borderRadius: '12px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SIGNOFF MODAL */}
      {signoffProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ceo-command-panel" style={{ width: '500px', maxWidth: '90vw' }}>
            <div className="ceo-command-header">
              <div className="ceo-typography-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={20} color="var(--ceo-success)"/> Executive Sign-off</div>
            </div>
            <div className="ceo-command-content">
              <div style={{ marginBottom: '24px' }}>
                <div className="ceo-typography-meta">Project</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>{signoffProject.name}</div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="ceo-typography-section-title" style={{ fontSize: '14px' }}>Milestone Checklist</div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input type="checkbox" defaultChecked /> Deliverables verified by QA
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input type="checkbox" defaultChecked /> Client accepted UAT
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                  <input type="checkbox" defaultChecked /> Invoice generated
                </label>
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '8px' }}>Digital Signature</div>
                <div 
                  onClick={() => setSignature(!signature)}
                  style={{ 
                    height: '100px', 
                    background: 'var(--ceo-bg)', 
                    border: '1px dashed var(--ceo-border)', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  {signature ? (
                    <span style={{ fontFamily: 'cursive', fontSize: '32px', color: 'var(--ceo-primary)' }}>CEO Approved</span>
                  ) : (
                    <span className="ceo-typography-meta">Click to sign</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="ceo-btn" onClick={() => setSignoffProject(null)}>Cancel</button>
                <button className="ceo-btn ceo-btn-primary" onClick={handleSignoff} disabled={!signature}>Authorize Sign-off</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
