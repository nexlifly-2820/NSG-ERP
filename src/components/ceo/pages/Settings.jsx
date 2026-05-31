import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, Shield, Bell, Key, User,
  Monitor, Database, Lock, ChevronRight, Save, Link
} from 'lucide-react';
import '../CEO.css';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('account');

  const navItems = [
    { id: 'account', label: 'Executive Account', icon: <User size={16} /> },
    { id: 'security', label: 'Access & Security', icon: <Shield size={16} /> },
    { id: 'notifications', label: 'Notification Preferences', icon: <Bell size={16} /> },
    { id: 'integrations', label: 'ERP Integrations', icon: <Link size={16} /> },
    { id: 'system', label: 'System Preferences', icon: <Monitor size={16} /> },
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
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Portal Configuration</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Executive Preferences</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
          
          {activeTab === 'account' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="ceo-command-panel">
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><User size={18} color="var(--ceo-primary)" /> Personal Executive Profile</div>
              </div>
              <div className="ceo-command-content">
                <div style={{ display: 'flex', gap: '32px', marginBottom: '32px' }}>
                  <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#F1F5F9', border: '1px solid var(--ceo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 700, color: 'var(--ceo-text-muted)' }}>
                    VC
                  </div>
                  <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div className="ceo-form-group">
                      <label>Full Name</label>
                      <input type="text" className="ceo-form-input" defaultValue="Vivek C." />
                    </div>
                    <div className="ceo-form-group">
                      <label>Corporate Title</label>
                      <input type="text" className="ceo-form-input" defaultValue="Chief Executive Officer" disabled style={{ background: '#F8FAFC' }} />
                    </div>
                    <div className="ceo-form-group">
                      <label>Primary Email</label>
                      <input type="email" className="ceo-form-input" defaultValue="vivek@nsg-erp.com" />
                    </div>
                    <div className="ceo-form-group">
                      <label>Contact Number</label>
                      <input type="text" className="ceo-form-input" defaultValue="+91 98765 43210" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="ceo-command-panel">
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><Shield size={18} color="var(--ceo-success)" /> Security & Authentication</div>
              </div>
              <div className="ceo-command-content" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '20px', border: '1px solid var(--ceo-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Two-Factor Authentication (2FA)</div>
                    <div style={{ fontSize: '13px', color: 'var(--ceo-text-muted)' }}>Add an extra layer of security to your executive account.</div>
                  </div>
                  <button className="ceo-btn" style={{ color: 'var(--ceo-success)', borderColor: 'var(--ceo-success)' }}>Enabled</button>
                </div>
                
                <div style={{ padding: '20px', border: '1px solid var(--ceo-border)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>Change Password</div>
                    <div style={{ fontSize: '13px', color: 'var(--ceo-text-muted)' }}>Last changed 45 days ago. Required every 90 days.</div>
                  </div>
                  <button className="ceo-btn">Update Password</button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab !== 'account' && activeTab !== 'security' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="ceo-command-panel">
              <div className="ceo-command-header">
                <div className="ceo-dash-card-title"><SettingsIcon size={18} color="var(--ceo-text-muted)" /> Preference Module</div>
              </div>
              <div className="ceo-command-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--ceo-text-muted)', fontSize: '14px' }}>
                Select a preference module from the sidebar to configure your settings.
              </div>
            </motion.div>
          )}

        </div>
      </div>

    </div>
  );
}
