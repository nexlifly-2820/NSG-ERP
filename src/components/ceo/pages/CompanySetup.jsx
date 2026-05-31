import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, Users, Globe, Shield, MapPin, 
  Briefcase, Save, Plus, ChevronRight, Settings
} from 'lucide-react';
import '../CEO.css';

export default function CompanySetup() {
  const [activeTab, setActiveTab] = useState('profile');

  const navItems = [
    { id: 'profile', label: 'Company Profile', icon: <Building size={16} /> },
    { id: 'org', label: 'Organization Structure', icon: <Users size={16} /> },
    { id: 'locations', label: 'Global Locations', icon: <MapPin size={16} /> },
    { id: 'departments', label: 'Departments', icon: <Briefcase size={16} /> },
    { id: 'policies', label: 'Compliance & Policies', icon: <Shield size={16} /> },
  ];

  return (
    <div style={{ padding: '0 32px 32px 32px', maxWidth: '1800px', margin: '0 auto', color: 'var(--ceo-text-primary)' }}>
      
      {/* SECTION 1: Executive Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', borderBottom: '1px solid var(--ceo-border)', paddingBottom: '24px' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="ceo-badge neutral">Administration</span>
            <ChevronRight size={14} color="var(--ceo-text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>System Configuration</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Enterprise Setup Workspace</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="ceo-btn"><Settings size={16} /> Advanced Config</button>
          <button className="ceo-btn ceo-btn-primary"><Save size={16} /> Save Changes</button>
        </div>
      </motion.div>

      {/* SECTION 2: Master-Detail Setup Layout */}
      <div className="ceo-setup-layout">
        
        {/* Sidebar */}
        <div className="ceo-setup-sidebar">
          {navItems.map(item => (
            <div 
              key={item.id} 
              className={`ceo-setup-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="ceo-command-panel">
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><Building size={18} color="var(--ceo-primary)" /> Corporate Entity Profile</div>
              </div>
              <div className="ceo-command-content">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="ceo-form-group">
                    <label>Legal Entity Name</label>
                    <input type="text" className="ceo-form-input" defaultValue="NSG Enterprise Holdings Ltd." />
                  </div>
                  <div className="ceo-form-group">
                    <label>Registration Number (CIN)</label>
                    <input type="text" className="ceo-form-input" defaultValue="U72900TG2026PTC123456" />
                  </div>
                  <div className="ceo-form-group">
                    <label>Primary Industry</label>
                    <select className="ceo-form-input"><option>Technology / SaaS</option></select>
                  </div>
                  <div className="ceo-form-group">
                    <label>Date of Incorporation</label>
                    <input type="date" className="ceo-form-input" defaultValue="2018-05-14" />
                  </div>
                  <div className="ceo-form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Registered Office Address</label>
                    <textarea className="ceo-form-input" defaultValue="Level 4, Cyber Towers, HITEC City, Hyderabad, Telangana 500081, India" style={{ minHeight: '80px', resize: 'vertical' }}></textarea>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'org' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="ceo-command-panel">
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><Users size={18} color="var(--ceo-purple)" /> Organizational Hierarchy</div>
                <button className="ceo-btn"><Plus size={14} /> Add Node</button>
              </div>
              <div className="ceo-command-content" style={{ background: '#F8FAFC' }}>
                <div className="ceo-tree-node">
                  <div style={{ width: '32px', height: '32px', background: 'var(--ceo-primary)', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>HQ</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Board of Directors & CEO</div>
                    <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>Top Level Executive</div>
                  </div>
                </div>
                
                <div className="ceo-tree-children">
                  <div className="ceo-tree-node">
                    <div style={{ width: '32px', height: '32px', background: 'var(--ceo-success)', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>OP</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>Chief Operating Officer (COO)</div>
                      <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>Operations & Delivery</div>
                    </div>
                  </div>
                  
                  <div className="ceo-tree-children">
                    <div className="ceo-tree-node">
                      <div style={{ width: '32px', height: '32px', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', color: 'var(--ceo-text-primary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>EN</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>Engineering Department</div>
                        <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>320 Employees</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ceo-tree-children">
                  <div className="ceo-tree-node">
                    <div style={{ width: '32px', height: '32px', background: 'var(--ceo-warning)', color: 'white', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>FI</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>Chief Financial Officer (CFO)</div>
                      <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>Finance & Legal</div>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {activeTab !== 'profile' && activeTab !== 'org' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="ceo-command-panel">
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><Settings size={18} color="var(--ceo-text-muted)" /> System Module</div>
              </div>
              <div className="ceo-command-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--ceo-text-muted)', fontSize: '14px' }}>
                Select a configuration module from the sidebar to manage enterprise settings.
              </div>
            </motion.div>
          )}

        </div>
      </div>

    </div>
  );
}
