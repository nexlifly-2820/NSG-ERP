import React, { useState } from 'react';
import { 
  Building2, Network, Briefcase, Clock, CalendarDays, Plus, 
  Trash2, Edit2, Save, AlertCircle, ChevronDown, ChevronRight, Upload
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA & COMPONENTS
// ==========================================

const TABS = [
  { id: 'profile', label: 'Company Profile', icon: Building2 },
  { id: 'departments', label: 'Departments', icon: Network },
  { id: 'designations', label: 'Designations', icon: Briefcase },
  { id: 'hours', label: 'Working Hours', icon: Clock },
  { id: 'holidays', label: 'Holidays', icon: CalendarDays }
];

const mockDeptTree = [
  {
    id: 1, name: 'Executive', headcount: 4, children: []
  },
  {
    id: 2, name: 'Technology', headcount: 145, children: [
      { id: 21, name: 'Engineering', headcount: 100, children: [
        { id: 211, name: 'Frontend', headcount: 40, children: [] },
        { id: 212, name: 'Backend', headcount: 60, children: [] }
      ]},
      { id: 22, name: 'Product', headcount: 45, children: [] }
    ]
  },
  {
    id: 3, name: 'Sales & Marketing', headcount: 80, children: [
      { id: 31, name: 'Inbound Sales', headcount: 50, children: [] },
      { id: 32, name: 'Field Marketing', headcount: 30, children: [] }
    ]
  }
];

// Recursive Tree Node Component
const DeptTreeNode = ({ dept, level = 0 }) => {
  const [expanded, setExpanded] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const hasChildren = dept.children && dept.children.length > 0;

  return (
    <div style={{ marginLeft: `${level > 0 ? 24 : 0}px`, marginTop: '8px' }}>
      <div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          display: 'flex', alignItems: 'center', padding: '8px 12px',
          background: isHovered ? 'var(--ceo-hover)' : 'var(--ceo-card-bg)',
          border: '1px solid var(--ceo-border)',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <div 
          style={{ display: 'flex', alignItems: 'center', width: '24px' }} 
          onClick={() => setExpanded(!expanded)}
        >
          {hasChildren ? (
            expanded ? <ChevronDown size={16} color="var(--ceo-text-muted)" /> : <ChevronRight size={16} color="var(--ceo-text-muted)" />
          ) : (
            <div style={{ width: 16, height: 16, borderLeft: '1px solid var(--ceo-border)', borderBottom: '1px solid var(--ceo-border)', marginLeft: 8, marginTop: -8 }}></div>
          )}
        </div>
        
        <span style={{ fontWeight: 600, flex: 1, fontSize: '14px' }}>{dept.name}</span>
        
        <span className="ceo-badge neutral" style={{ marginRight: '16px' }}>{dept.headcount} EMP</span>
        
        <div style={{ display: 'flex', gap: '8px', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          <button className="ceo-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }} title="Add Child Dept">
            <Plus size={16} color="var(--ceo-primary)" />
          </button>
          <button className="ceo-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }} title="Edit Dept">
            <Edit2 size={16} color="var(--ceo-text-secondary)" />
          </button>
          <button className="ceo-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }} title="Delete Dept">
            <Trash2 size={16} color="var(--ceo-danger)" />
          </button>
        </div>
      </div>
      
      {expanded && hasChildren && (
        <div style={{ borderLeft: '1px solid var(--ceo-border)', marginLeft: '12px', paddingLeft: '4px' }}>
          {dept.children.map(child => (
            <DeptTreeNode key={child.id} dept={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};


// ==========================================
// MAIN PAGE
// ==========================================
export default function CompanySetup() {
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Company Configuration</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Core structural parameters and global organization settings.</p>
      </div>

      {/* CSS GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '200px 1fr',
        gap: '24px',
        flex: 1
      }}>
        
        {/* NAV SIDEBAR */}
        <div className="ceo-command-panel" style={{ padding: '12px 0' }}>
          {TABS.map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                background: activeTab === tab.id ? 'var(--tab-active-bg)' : 'transparent',
                border: 'none',
                borderRight: activeTab === tab.id ? '3px solid var(--tab-active-border)' : '3px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                color: activeTab === tab.id ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                fontWeight: activeTab === tab.id ? 600 : 500,
                transition: 'all 0.2s ease'
              }}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT PANEL */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Building2 size={18} color="var(--ceo-primary)" /> Legal Profile</div>
                {isSaved && <div className="ceo-badge success"><CheckCircle size={14}/> Saved Successfully</div>}
              </div>
              <div className="ceo-command-content" style={{ overflowY: 'auto' }}>
                <form onSubmit={handleSaveProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '800px' }}>
                  
                  {/* Logo Upload */}
                  <div style={{ gridColumn: '1 / -1', marginBottom: '16px', display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--ceo-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--ceo-border)' }}>
                      <Building2 size={32} color="var(--ceo-text-muted)" />
                    </div>
                    <div>
                      <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '4px' }}>Company Logo</div>
                      <div className="ceo-typography-meta" style={{ marginBottom: '12px' }}>Recommended 400x400px PNG or SVG</div>
                      <button type="button" className="ceo-btn" style={{ padding: '6px 12px', fontSize: '12px' }}><Upload size={14} /> Upload New</button>
                    </div>
                  </div>

                  <div className="ceo-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Company Name (Legal)</label>
                    <input className="ceo-form-input" required defaultValue="NSG Technologies Pvt Ltd" />
                  </div>
                  
                  <div className="ceo-form-group">
                    <label>GST Number</label>
                    <input className="ceo-form-input" required defaultValue="27AADCN4521E1Z8" />
                  </div>
                  
                  <div className="ceo-form-group">
                    <label>CIN</label>
                    <input className="ceo-form-input" required defaultValue="U74900MH2010PTC123456" />
                  </div>
                  
                  <div className="ceo-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Registered Address</label>
                    <textarea className="ceo-form-input" required rows={3} defaultValue="Unit 401, Mindspace IT Park, Malad West, Mumbai, Maharashtra 400064"></textarea>
                  </div>
                  
                  <div className="ceo-form-group">
                    <label>Financial Year Start</label>
                    <select className="ceo-form-input" defaultValue="apr">
                      <option value="apr">April (recommended)</option>
                      <option value="jan">January</option>
                      <option value="jul">July</option>
                    </select>
                  </div>
                  
                  <div className="ceo-form-group">
                    <label>Default Currency</label>
                    <select className="ceo-form-input" defaultValue="inr">
                      <option value="inr">INR ₹</option>
                      <option value="usd">USD $</option>
                      <option value="eur">EUR €</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--ceo-border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="ceo-btn ceo-btn-primary" disabled={isSaving}>
                      {isSaving ? <Clock size={16} className="spin" /> : <Save size={16} />} 
                      {isSaving ? 'Saving...' : 'Save Profile'}
                    </button>
                  </div>

                </form>
              </div>
            </>
          )}

          {/* DEPARTMENTS TAB */}
          {activeTab === 'departments' && (
            <>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Network size={18} color="var(--ceo-primary)" /> Organization Chart</div>
                <button className="ceo-btn ceo-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}><Plus size={14} /> Add Root Dept</button>
              </div>
              <div className="ceo-command-content" style={{ overflowY: 'auto' }}>
                <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {mockDeptTree.map(dept => (
                    <DeptTreeNode key={dept.id} dept={dept} />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* OTHER TABS PLACEHOLDER */}
          {['designations', 'hours', 'holidays'].includes(activeTab) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ceo-text-muted)' }}>
              <AlertCircle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <div className="ceo-typography-section-title">Coming Soon</div>
              <p className="ceo-typography-body">This module is part of Phase 2 rollout.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
