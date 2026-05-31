import React, { useState } from 'react';
import { 
  Search, Filter, Plus, Download, UserPlus, XCircle, 
  Mail, Phone, MapPin, Briefcase, Calendar, Shield
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const mockEmployees = [
  { id: 'EMP-104', name: 'Rajiv Sharma', dept: 'Engineering', role: 'Senior Frontend Dev', status: 'Active', join: '2021-04-12', avatar: 'https://ui-avatars.com/api/?name=Rajiv+Sharma&background=2563EB&color=fff', email: 'rajiv.s@nsg.com', phone: '+91 98765 43210', location: 'Mumbai HQ' },
  { id: 'EMP-105', name: 'Priya Patel', dept: 'HR', role: 'HR Manager', status: 'Active', join: '2020-08-01', avatar: 'https://ui-avatars.com/api/?name=Priya+Patel&background=10B981&color=fff', email: 'priya.p@nsg.com', phone: '+91 98765 43211', location: 'Mumbai HQ' },
  { id: 'EMP-106', name: 'Amit Singh', dept: 'Sales', role: 'VP Sales', status: 'On Leave', join: '2019-11-15', avatar: 'https://ui-avatars.com/api/?name=Amit+Singh&background=F59E0B&color=fff', email: 'amit.s@nsg.com', phone: '+91 98765 43212', location: 'Delhi Branch' },
  { id: 'EMP-107', name: 'Sarah Connor', dept: 'IT', role: 'Systems Admin', status: 'Active', join: '2023-01-10', avatar: 'https://ui-avatars.com/api/?name=Sarah+Connor&background=8B5CF6&color=fff', email: 'sarah.c@nsg.com', phone: '+91 98765 43213', location: 'Remote' },
  { id: 'EMP-108', name: 'David Lee', dept: 'Marketing', role: 'Marketing Director', status: 'Notice Period', join: '2022-05-22', avatar: 'https://ui-avatars.com/api/?name=David+Lee&background=EF4444&color=fff', email: 'david.l@nsg.com', phone: '+91 98765 43214', location: 'Remote' }
];

const PROFILE_TABS = ['Info', 'Documents', 'Leave Balance', 'Payroll'];

export default function People() {
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [profileTab, setProfileTab] = useState('Info');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px', position: 'relative', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Enterprise Directory</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Manage workforce profiles, access controls, and employee records.</p>
      </div>

      {/* CSS GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedEmp ? '1fr 380px' : '1fr',
        gridTemplateRows: '60px 1fr',
        gridTemplateAreas: selectedEmp ? `
          "search search"
          "table profile"
        ` : `
          "search"
          "table"
        `,
        gap: '24px',
        flex: 1,
        transition: 'all 0.3s ease'
      }}>
        
        {/* SEARCH & FILTER BAR */}
        <div style={{ gridArea: 'search', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '350px' }}>
            <Search size={16} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input type="text" className="ceo-form-input" placeholder="Search by name, ID, or department..." style={{ paddingLeft: '36px', height: '40px' }} />
          </div>
          
          <button className="ceo-btn" style={{ padding: '8px 12px' }}><Filter size={16}/> Filters</button>
          
          <div style={{ flex: 1 }}></div>

          <button className="ceo-btn" style={{ padding: '8px 16px' }}><Download size={16} /> Export List</button>
          <button className="ceo-btn ceo-btn-primary" style={{ padding: '8px 16px' }}><UserPlus size={16} /> Add Employee</button>
        </div>

        {/* EMPLOYEE TABLE */}
        <div className="ceo-command-panel" style={{ gridArea: 'table', overflowY: 'auto' }}>
          <div className="ceo-command-content" style={{ padding: 0 }}>
            <table className="ceo-erp-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                {mockEmployees.map(emp => (
                  <tr 
                    key={emp.id} 
                    onClick={() => setSelectedEmp(emp)}
                    style={{ 
                      background: (selectedEmp?.id === emp.id) ? 'var(--ceo-hover)' : 'var(--ceo-card-bg)',
                      cursor: 'pointer'
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={emp.avatar} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '16px' }} />
                        <span style={{ fontWeight: 600 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td><span className="ceo-typography-meta">{emp.id}</span></td>
                    <td style={{ fontWeight: 500 }}>{emp.dept}</td>
                    <td style={{ color: 'var(--ceo-text-secondary)' }}>{emp.role}</td>
                    <td>
                      <span className={`ceo-badge ${emp.status === 'Active' ? 'success' : emp.status === 'On Leave' ? 'warning' : 'critical'}`}>
                        {emp.status}
                      </span>
                    </td>
                    <td><span className="ceo-typography-meta">{emp.join}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PROFILE SIDEBAR */}
        {selectedEmp && (
          <div className="ceo-command-panel" style={{ gridArea: 'profile', borderLeft: '1px solid var(--ceo-border)', boxShadow: '-4px 0 15px rgba(0,0,0,0.05)' }}>
            
            <div className="ceo-command-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px', paddingBottom: '16px', borderBottom: 'none' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img src={selectedEmp.avatar} alt={selectedEmp.name} style={{ width: '64px', height: '64px', borderRadius: '32px', border: '2px solid var(--ceo-border)' }} />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{selectedEmp.name}</div>
                  <div className="ceo-typography-meta">{selectedEmp.id}</div>
                </div>
              </div>
              <button className="ceo-btn" onClick={() => setSelectedEmp(null)} style={{ padding: '4px', border: 'none', background: 'transparent' }}><XCircle size={20} color="var(--ceo-text-muted)"/></button>
            </div>

            <div style={{ padding: '0 24px', display: 'flex', gap: '8px' }}>
              <span className={`ceo-badge ${selectedEmp.status === 'Active' ? 'success' : selectedEmp.status === 'On Leave' ? 'warning' : 'critical'}`}>
                {selectedEmp.status}
              </span>
              <span className="ceo-badge neutral">{selectedEmp.dept}</span>
            </div>

            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--ceo-border)', marginTop: '24px', padding: '0 16px', overflowX: 'auto' }}>
              {PROFILE_TABS.map(tab => (
                <button
                  key={tab}
                  onClick={() => setProfileTab(tab)}
                  style={{
                    padding: '8px 12px',
                    background: profileTab === tab ? 'var(--tab-active-bg)' : 'transparent',
                    color: profileTab === tab ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                    border: 'none',
                    borderBottom: profileTab === tab ? '2px solid var(--ceo-primary)' : '2px solid transparent',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="ceo-command-content" style={{ padding: '24px', overflowY: 'auto' }}>
              
              {profileTab === 'Info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  <div>
                    <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact Details</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Mail size={16} color="var(--ceo-text-muted)" />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEmp.email}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Phone size={16} color="var(--ceo-text-muted)" />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEmp.phone}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <MapPin size={16} color="var(--ceo-text-muted)" />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEmp.location}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--ceo-divider)', paddingTop: '24px' }}>
                    <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employment Details</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Briefcase size={16} color="var(--ceo-text-muted)" />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{selectedEmp.role}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Calendar size={16} color="var(--ceo-text-muted)" />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>Joined: {selectedEmp.join}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Shield size={16} color="var(--ceo-text-muted)" />
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>RBAC Profile: Employee</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {profileTab !== 'Info' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ceo-text-muted)' }}>
                  Data protected under access control. (Restricted to HR)
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
