import React, { useState, useMemo } from 'react';
import { Search, Filter, Download, XCircle, Mail, Phone, Award, UserPlus, FileText, CalendarDays, Users, Building, ShieldCheck, TrendingUp } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import '../CEO.css';




export default function People() {
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [activeTab, setActiveTab] = useState('Info');
  
  // Add Employee Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmp, setNewEmp] = useState({ name: '', dept: '', role: '', email: '', phone: '', status: 'Active', sysRole: 'employee', shift: '' });

  // Full Profile & Messaging State
  const [isFullProfileOpen, setIsFullProfileOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Edit Profile & Password Reset State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editEmpData, setEditEmpData] = useState(null);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [updating, setUpdating] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const [teamLeads, setTeamLeads] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [designationsList, setDesignationsList] = useState([]);
  const [shiftsList, setShiftsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/ceo-portal/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(emp => ({
          ...emp,
          id: emp.emp_id || `EMP-${emp.id}`,
          dbId: emp.id,
          role: emp.designation || 'Employee',
          dept: emp.department || 'Operations',
          joinDate: emp.join_date || 'N/A',
          status: emp.status === 'active' ? 'Active' : (emp.status || 'Active'),
          avatar: emp.photo || `https://ui-avatars.com/api/?name=${emp.name.replace(/ /g, '+')}&background=0F172A&color=fff`,
          sysRole: emp.role,
          email: emp.email,
          manager_id: emp.manager_id,
          shift: emp.shift_timing || ''
        }));
        setEmployees(formatted);
      }
      const tlRes = await fetch('/api/hr-portal/team-leads', { headers: { 'Authorization': `Bearer ${token}` } });
      if (tlRes.ok) {
        setTeamLeads(await tlRes.json());
      }
      
      const deptRes = await fetch('/api/ceo-portal/departments', { headers: { 'Authorization': `Bearer ${token}` } });
      if (deptRes.ok) {
        setDepartmentsList(await deptRes.json());
      }
      
      const desigRes = await fetch('/api/ceo-portal/designations', { headers: { 'Authorization': `Bearer ${token}` } });
      if (desigRes.ok) {
        setDesignationsList(await desigRes.json());
      }
      
      const shiftsRes = await fetch('/api/ceo-portal/shifts', { headers: { 'Authorization': `Bearer ${token}` } });
      if (shiftsRes.ok) {
        setShiftsList(await shiftsRes.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.role || !newEmp.email) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const response = await fetch('/api/ceo-portal/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newEmp.name,
          email: newEmp.email,
          department: newEmp.dept,
          designation: newEmp.role,
          role: newEmp.sysRole,
          phone: newEmp.phone,
          join_date: new Date().toISOString().split('T')[0],
          status: 'active',
          shift_timing: newEmp.shift
        })
      });

      if (!response.ok) {
        const err = await response.json();
        alert(`Error: ${err.detail || 'Failed to add user'}`);
        return;
      }
      
      const result = await response.json();
      alert(`User ${result.name} successfully added!\n\nRole: ${result.role}\nEmail: ${result.email}\nTemporary Password: ${result.temporary_password}\n\nPlease share these credentials.`);
      
      setIsAddModalOpen(false);
      setNewEmp({ name: '', dept: '', role: '', email: '', phone: '', status: 'Active', sysRole: 'employee', shift: '' });
      
      // Reload employees
      const res = await fetch('/api/ceo-portal/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(emp => ({
          ...emp,
          id: emp.emp_id || `EMP-${emp.id}`,
          role: emp.designation || 'Employee',
          dept: emp.department || 'Operations',
          joinDate: emp.join_date || 'N/A',
          status: emp.status === 'active' ? 'Active' : (emp.status || 'Active'),
          avatar: emp.photo || `https://ui-avatars.com/api/?name=${emp.name.replace(/ /g, '+')}&background=0F172A&color=fff`,
          sysRole: emp.role
        }));
        setEmployees(formatted);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while adding user.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    if (!editEmpData || !selectedEmp) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/employees/${selectedEmp.dbId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editEmpData.name,
          email: editEmpData.email,
          department: editEmpData.dept,
          designation: editEmpData.role,
          role: editEmpData.sysRole,
          status: editEmpData.status.toLowerCase(),
          shift_timing: editEmpData.shift,
          manager_id: editEmpData.manager_id ? parseInt(editEmpData.manager_id) : null,
          manager: editEmpData.manager_id ? teamLeads.find(tl => tl.id === parseInt(editEmpData.manager_id))?.name : null
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update profile');
      }
      await fetchEmployees();
      setIsEditProfileOpen(false);
      setIsFullProfileOpen(false); // Close full profile to force refresh on next open
      alert('Profile updated successfully.');
    } catch (err) {
      alert('Error updating profile: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !selectedEmp) return;
    setUpdating(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/ceo-portal/users/${selectedEmp.dbId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to reset password');
      }
      setIsResetPasswordOpen(false);
      setNewPassword('');
      alert('Password reset successfully.');
    } catch (err) {
      alert('Error resetting password: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmp) return;
    const confirmDelete = window.confirm(`Are you sure you want to permanently delete ${selectedEmp.name}? This action cannot be undone.`);
    if (!confirmDelete) return;
    
    setUpdating(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/ceo-portal/users/${selectedEmp.dbId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to delete employee');
      }
      await fetchEmployees();
      setIsFullProfileOpen(false);
      setSelectedEmp(null);
      alert('Employee deleted successfully.');
    } catch (err) {
      alert('Error deleting employee: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleExportPDF = () => {
    if (filteredEmployees.length === 0) {
      alert("No data to export");
      return;
    }
    const doc = new jsPDF('landscape');
    
    doc.setFontSize(18);
    doc.text("Employees Export", 14, 22);

    const headers = [["Employee ID", "Name", "Email", "Department", "Designation", "System Role", "Status", "Join Date"]];
    const data = filteredEmployees.map(emp => [
      emp.id,
      emp.name,
      emp.email,
      emp.dept,
      emp.role,
      emp.sysRole,
      emp.status,
      emp.joinDate
    ]);

    doc.autoTable({
      startY: 30,
      head: headers,
      body: data,
    });

    doc.save('employees_export.pdf');
  };

  const handleDownload = (filename) => {
    // Keep this for document downloads inside full profile modal
    if (filteredEmployees.length === 0) return;
    const csvContent = "Sample Document Download";
    const blob = new Blob([csvContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || emp.id.toLowerCase().includes(searchTerm.toLowerCase()) || emp.role.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = selectedDept ? emp.dept === selectedDept : true;
      const matchStatus = selectedStatus ? emp.status === selectedStatus : true;
      return matchSearch && matchDept && matchStatus;
    });
  }, [employees, searchTerm, selectedDept, selectedStatus]);

  // Dynamic KPIs based on actual data
  const headcount = filteredEmployees.length;
  const activeCount = filteredEmployees.filter(e => e.status === 'Active' || e.status === 'active').length;
  
  // Real dynamic data instead of hardcoded numbers
  const uniqueDepartments = new Set(filteredEmployees.map(e => e.dept)).size;
  
  // Calculate recent joiners (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentJoiners = filteredEmployees.filter(e => {
    if (!e.joinDate || e.joinDate === 'N/A') return false;
    const d = new Date(e.joinDate);
    return d >= thirtyDaysAgo;
  }).length;

  const kpiStats = [
    { label: 'Total Headcount', val: headcount.toLocaleString(), sub: 'Filtered Results', status: 'primary', icon: Users },
    { label: 'Active Employees', val: activeCount.toLocaleString(), sub: 'Matching Active', status: 'success', icon: ShieldCheck },
    { label: 'Total Departments', val: uniqueDepartments.toString(), sub: 'Active Departments', status: 'warning', icon: Building },
    { label: 'Recent Joiners', val: recentJoiners.toString(), sub: 'Last 30 Days', status: 'success', icon: TrendingUp },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">People & Directory</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Global workforce lookup, organizational data, and profiles.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {kpiStats.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} style={{ background: '#FFF', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '16px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ceo-text-secondary)', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Icon size={14} /> {k.label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px', color: 'var(--ceo-text-primary)' }}>{k.val}</div>
              <div style={{ fontSize: '12px', color: `var(--ceo-${k.status})`, fontWeight: 600, marginTop: '4px' }}>{k.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: selectedEmp ? 'minmax(0, 1fr) 350px' : 'minmax(0, 1fr)',
        gap: '24px', flex: 1, minHeight: '500px'
      }}>
        <div className="ceo-command-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', gap: '12px', flexWrap: 'wrap', background: '#F8FAFC' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input 
                type="text" 
                className="ceo-form-input" 
                placeholder="Search name, ID, or role..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '36px', height: '40px', width: '100%', background: '#FFF', fontSize: '13px' }} 
              />
            </div>
            
            <select 
              className="ceo-form-input" 
              value={selectedDept}
              onChange={e => setSelectedDept(e.target.value)}
              style={{ width: '160px', height: '40px', background: '#FFF', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="">All Departments</option>
              {departmentsList.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>

            <select 
              className="ceo-form-input" 
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              style={{ width: '140px', height: '40px', background: '#FFF', fontSize: '13px', fontWeight: 600 }}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
            </select>

            <div style={{ flex: 1 }}></div>
            
            <button onClick={handleExportPDF} className="ceo-btn" style={{ height: '40px', fontSize: '13px', fontWeight: 600, background: '#FFF' }}><Download size={16} /> Export PDF</button>
            <button onClick={() => setIsAddModalOpen(true)} className="ceo-btn ceo-btn-primary" style={{ height: '40px', fontSize: '13px', fontWeight: 600 }}><UserPlus size={16} /> Add Employee</button>
          </div>

          <div style={{ overflowY: 'auto', overflowX: 'auto', flex: 1, background: '#FFF' }}>
            {filteredEmployees.length > 0 ? (
              <table className="ceo-erp-table" style={{ width: '100%', minWidth: '600px', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee & ID</th>
                    <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dept & Designation</th>
                    <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Join Date</th>
                    <th style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr 
                      key={emp.id} 
                      onClick={() => { setSelectedEmp(emp); setActiveTab('Info'); }} 
                      style={{ 
                        background: (selectedEmp?.id === emp.id) ? '#EFF6FF' : 'transparent', 
                        cursor: 'pointer',
                        borderBottom: '1px solid var(--ceo-divider)'
                      }}
                      onMouseEnter={(e) => { if(selectedEmp?.id !== emp.id) e.currentTarget.style.background = '#F8FAFC'; }}
                      onMouseLeave={(e) => { if(selectedEmp?.id !== emp.id) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo ? `http://localhost:8000${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=random`)} alt={emp.name} style={{ width: '40px', height: '40px', borderRadius: '20px', border: '1px solid var(--ceo-border)' }}  />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{emp.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ceo-text-muted)', fontWeight: 600, marginTop: '2px' }}>{emp.id}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ceo-text-primary)' }}>{emp.role}</div>
                        <div style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)', marginTop: '2px' }}>{emp.dept}</div>
                      </td>
                      <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--ceo-text-secondary)' }}>{emp.joinDate}</td>
                      <td style={{ padding: '16px 20px' }}><span className={`ceo-badge ${emp.status === 'Active' ? 'success' : 'warning'}`} style={{ fontWeight: 700, padding: '4px 8px' }}>{emp.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--ceo-text-muted)' }}>
                <Users size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
                <div style={{ fontSize: '16px', fontWeight: 600 }}>No employees found</div>
                <div style={{ fontSize: '13px', marginTop: '4px' }}>Adjust your filters or search term</div>
              </div>
            )}
        </div>
      </div>

      {selectedEmp && (
          <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div className="ceo-command-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)', borderBottom: '1px solid var(--ceo-border)' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={selectedEmp.avatar} alt={selectedEmp.name} style={{ width: '56px', height: '56px', borderRadius: '10px', border: '3px solid #FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}  />
                <div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--ceo-text-primary)' }}>{selectedEmp.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--ceo-text-secondary)', fontWeight: 600, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{selectedEmp.id}</span>
                    <span style={{ width: '4px', height: '4px', borderRadius: '2px', background: 'var(--ceo-divider)' }}></span>
                    <span className={`ceo-badge ${selectedEmp.status === 'Active' ? 'success' : 'warning'}`} style={{ padding: '2px 8px', fontSize: '10px' }}>{selectedEmp.status}</span>
                  </div>
                </div>
              </div>
              <button className="ceo-btn" onClick={() => setSelectedEmp(null)} style={{ padding: '6px', border: '1px solid var(--ceo-border)', background: '#FFF' }}><XCircle size={18}/></button>
            </div>
            
            <div className="ceo-command-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              
              {/* TABS */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--ceo-divider)', padding: '0 20px', background: '#FFF' }}>
                {['Info', 'Documents'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    style={{ 
                      padding: '12px 20px', background: 'transparent', border: 'none', cursor: 'pointer',
                      fontWeight: 700, fontSize: '13px', 
                      color: activeTab === tab ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                      borderBottom: activeTab === tab ? '3px solid var(--ceo-primary)' : '3px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto', background: '#F8FAFC' }}>
                {activeTab === 'Info' && (
                  <>
                    <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', border: '1px solid var(--ceo-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>EMPLOYMENT DETAILS</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                          <div style={{ color: 'var(--ceo-text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Department</div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ceo-text-primary)' }}>{selectedEmp.dept}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--ceo-text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Role</div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ceo-text-primary)' }}>{selectedEmp.role}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--ceo-text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Joined Date</div>
                          <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ceo-text-primary)' }}>{selectedEmp.joinDate}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--ceo-text-secondary)', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>Current Status</div>
                          <span className={`ceo-badge ${selectedEmp.status === 'Active' ? 'success' : 'warning'}`} style={{ padding: '2px 6px', fontSize: '10px' }}>{selectedEmp.status}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: '#FFF', padding: '16px', borderRadius: '8px', border: '1px solid var(--ceo-border)', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>CONTACT DETAILS</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--ceo-border)' }}>
                          <Mail size={16} color="var(--ceo-text-muted)"/> 
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ceo-text-primary)' }}>{selectedEmp.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--ceo-border)' }}>
                          <Phone size={16} color="var(--ceo-text-muted)"/> 
                          <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--ceo-text-primary)' }}>{selectedEmp.phone}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'Documents' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div onClick={() => handleDownload('Employment_Contract.txt')} style={{ padding: '16px 20px', background: '#FFF', border: '1px solid var(--ceo-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={20} color="var(--ceo-primary)"/>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ceo-text-primary)' }}>Employment Contract.pdf</div>
                          <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', marginTop: '2px', fontWeight: 500 }}>Signed on {selectedEmp.joinDate}</div>
                        </div>
                      </div>
                      <Download size={16} color="var(--ceo-primary)" />
                    </div>
                    <div onClick={() => handleDownload('ID_Proof_Aadhar.txt')} style={{ padding: '16px 20px', background: '#FFF', border: '1px solid var(--ceo-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <FileText size={20} color="var(--ceo-primary)"/>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--ceo-text-primary)' }}>ID Proof_Aadhar.pdf</div>
                          <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', marginTop: '2px', fontWeight: 500 }}>Verified</div>
                        </div>
                      </div>
                      <Download size={16} color="var(--ceo-primary)" />
                    </div>
                  </div>
                )}

                {/* Leave Balance tab removed due to fake data rules */}

                <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', gap: '12px' }}>
                  <button onClick={() => setIsMessageOpen(true)} className="ceo-btn" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontWeight: 700, background: '#FFF' }}>Send Message</button>
                  <button onClick={() => setIsFullProfileOpen(true)} className="ceo-btn ceo-btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontWeight: 700 }}>Open Full Profile</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD EMPLOYEE MODAL */}
      {isAddModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#FFF', width: '500px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ceo-text-primary)' }}>Add New Employee</div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-muted)' }}><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleAddEmployee} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>FULL NAME *</label>
                <input required value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }} placeholder="e.g. Rahul Sharma" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>SYSTEM ACCESS ROLE *</label>
                  <select value={newEmp.sysRole} onChange={e => setNewEmp({...newEmp, sysRole: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }}>
                    <option value="employee">Employee</option>
                    <option value="hr">Human Resources (HR)</option>
                    <option value="tl">Team Lead (TL)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>DESIGNATION *</label>
                  <select disabled={!newEmp.dept} title={!newEmp.dept ? "First choose a department" : ""} required value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px', cursor: !newEmp.dept ? 'not-allowed' : 'pointer', opacity: !newEmp.dept ? 0.6 : 1 }}>
                    <option value="">Select Designation</option>
                    {designationsList.filter(d => !newEmp.dept || d.dept === newEmp.dept).map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>DEPARTMENT</label>
                  <select value={newEmp.dept} onChange={e => setNewEmp({...newEmp, dept: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }}>
                    <option value="">Select Department</option>
                    {departmentsList.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>EMAIL ADDRESS *</label>
                  <input required type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }} placeholder="email@nsg.com" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>PHONE NUMBER</label>
                  <input value={newEmp.phone} onChange={e => setNewEmp({...newEmp, phone: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }} placeholder="+91 98765..." />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>SHIFT TIMING</label>
                  <select value={newEmp.shift} onChange={e => setNewEmp({...newEmp, shift: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }}>
                    <option value="">Select Shift</option>
                    {shiftsList.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.start_time} - {s.end_time})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--ceo-divider)', paddingTop: '24px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="ceo-btn" style={{ fontWeight: 700, padding: '10px 20px' }}>Cancel</button>
                <button type="submit" className="ceo-btn ceo-btn-primary" style={{ fontWeight: 700, padding: '10px 20px' }}>Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL PROFILE MODAL */}
      {isFullProfileOpen && selectedEmp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#FFF', width: '800px', height: '80vh', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '32px', borderBottom: '1px solid var(--ceo-divider)', background: 'linear-gradient(to right, #F8FAFC, #FFFFFF)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={selectedEmp.avatar} alt={selectedEmp.name} style={{ width: '80px', height: '80px', borderRadius: '16px', border: '4px solid #FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}  />
                <div>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--ceo-text-primary)' }}>{selectedEmp.name}</div>
                  <div style={{ fontSize: '15px', color: 'var(--ceo-text-secondary)', fontWeight: 600, marginTop: '4px' }}>{selectedEmp.role} &bull; {selectedEmp.dept}</div>
                </div>
              </div>
              <button onClick={() => setIsFullProfileOpen(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--ceo-text-secondary)' }}><XCircle size={24} /></button>
            </div>
            
            <div style={{ padding: '32px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', background: '#F8FAFC' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid var(--ceo-border)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '16px' }}>PERFORMANCE (YTD)</h3>
                  <div style={{ display: 'flex', alignItems: 'end', gap: '12px' }}>
                    <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--ceo-success)' }}>94%</div>
                    <div style={{ fontSize: '13px', color: 'var(--ceo-text-muted)', marginBottom: '8px' }}>Exceeds Expectations</div>
                  </div>
                  <div style={{ height: '8px', background: '#E2E8F0', borderRadius: '4px', marginTop: '16px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '94%', background: 'var(--ceo-success)' }}></div>
                  </div>
                </div>
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid var(--ceo-border)' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '16px' }}>REPORTING STRUCTURE</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <Users size={20} color="var(--ceo-text-muted)" />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Reports to: {selectedEmp.manager_id ? (teamLeads.find(tl => tl.id === selectedEmp.manager_id)?.name || 'Team Lead') : 'CEO/HR'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Users size={20} color="var(--ceo-text-muted)" />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>Direct Reports: 0</span>
                  </div>
                </div>
              </div>
              <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid var(--ceo-border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '16px' }}>COMPENSATION HISTORY</h3>
                <table className="ceo-erp-table" style={{ width: '100%' }}>
                  <thead>
                    <tr><th>Date</th><th>Event</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Jan 2024</td><td>Annual Appraisal</td><td><span className="ceo-badge success">Completed</span></td></tr>
                    <tr><td>{selectedEmp.joinDate}</td><td>Initial Offer</td><td><span className="ceo-badge success">Accepted</span></td></tr>
                  </tbody>
                </table>
              </div>

              {/* Admin Actions */}
              <div style={{ background: '#FFF', padding: '24px', borderRadius: '12px', border: '1px solid var(--ceo-border)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '16px' }}>ADMIN ACTIONS</h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={() => { setEditEmpData({...selectedEmp}); setIsEditProfileOpen(true); }} className="ceo-btn" style={{ fontWeight: 700 }}>Edit Profile</button>
                  <button onClick={() => setIsResetPasswordOpen(true)} className="ceo-btn" style={{ fontWeight: 700, color: 'var(--ceo-danger)', border: '1px solid var(--ceo-danger)' }}>Reset Password</button>
                  <button onClick={handleDeleteEmployee} disabled={updating} className="ceo-btn" style={{ fontWeight: 700, color: '#FFF', background: 'var(--ceo-danger)', border: '1px solid var(--ceo-danger)' }}>
                    {updating ? 'Deleting...' : 'Delete Employee'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SEND MESSAGE MODAL */}
      {isMessageOpen && selectedEmp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ background: '#FFF', width: '500px', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--ceo-divider)', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ceo-text-primary)' }}>Message {selectedEmp.name}</div>
              <button onClick={() => setIsMessageOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-muted)' }}><XCircle size={20} /></button>
            </div>
            <div style={{ padding: '24px' }}>
              <textarea 
                value={messageText} 
                onChange={e => setMessageText(e.target.value)} 
                className="ceo-form-input" 
                placeholder="Type your message here..." 
                style={{ width: '100%', height: '120px', resize: 'none', padding: '16px', fontSize: '14px' }}
              ></textarea>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button onClick={() => setIsMessageOpen(false)} className="ceo-btn" style={{ fontWeight: 700 }}>Cancel</button>
                <button onClick={() => {
                  alert(`Message sent to ${selectedEmp.name}:\n\n${messageText}`);
                  setIsMessageOpen(false);
                  setMessageText('');
                }} className="ceo-btn ceo-btn-primary" style={{ fontWeight: 700 }}>Send Message</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditProfileOpen && editEmpData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ background: '#FFF', width: '500px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ceo-text-primary)' }}>Edit Profile</div>
              <button onClick={() => setIsEditProfileOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-muted)' }}><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleEditProfileSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>FULL NAME</label>
                <input required value={editEmpData.name} onChange={e => setEditEmpData({...editEmpData, name: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>EMAIL ADDRESS</label>
                  <input required type="email" value={editEmpData.email} onChange={e => setEditEmpData({...editEmpData, email: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>SYSTEM ROLE</label>
                  <select value={editEmpData.sysRole} onChange={e => setEditEmpData({...editEmpData, sysRole: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }}>
                    <option value="employee">Employee</option>
                    <option value="hr">Human Resources (HR)</option>
                    <option value="tl">Team Lead (TL)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>DEPARTMENT</label>
                  <select value={editEmpData.dept} onChange={e => setEditEmpData({...editEmpData, dept: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }}>
                    <option value="">Select Department</option>
                    {departmentsList.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>DESIGNATION</label>
                  <select required value={editEmpData.role} onChange={e => setEditEmpData({...editEmpData, role: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }}>
                    <option value="">Select Designation</option>
                    {designationsList.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>STATUS</label>
                  <select value={editEmpData.status} onChange={e => setEditEmpData({...editEmpData, status: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }}>
                    <option value="Active">Active</option>
                    <option value="Probation">Probation</option>
                    <option value="Terminated">Terminated</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>REPORTS TO (TEAM LEAD)</label>
                  <select value={editEmpData.manager_id || ''} onChange={e => setEditEmpData({...editEmpData, manager_id: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }}>
                    <option value="">None (Direct to CEO/HR)</option>
                    {teamLeads.map(tl => (
                      <option key={tl.id} value={tl.id}>{tl.name} ({tl.department})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>SHIFT TIMING</label>
                  <select value={editEmpData.shift || ''} onChange={e => setEditEmpData({...editEmpData, shift: e.target.value})} className="ceo-form-input" style={{ width: '100%', padding: '12px' }}>
                    <option value="">Select Shift</option>
                    {shiftsList.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.start_time} - {s.end_time})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--ceo-divider)', paddingTop: '24px' }}>
                <button type="button" onClick={() => setIsEditProfileOpen(false)} className="ceo-btn" style={{ fontWeight: 700, padding: '10px 20px' }}>Cancel</button>
                <button type="submit" className="ceo-btn ceo-btn-primary" disabled={updating} style={{ fontWeight: 700, padding: '10px 20px' }}>{updating ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {isResetPasswordOpen && selectedEmp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <div style={{ background: '#FFF', width: '400px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', overflow: 'hidden', animation: 'fadeIn 0.2s ease-out' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ceo-danger)' }}>Reset Password</div>
              <button onClick={() => setIsResetPasswordOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-muted)' }}><XCircle size={20} /></button>
            </div>
            <form onSubmit={handleResetPasswordSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p style={{ fontSize: '14px', color: 'var(--ceo-text-secondary)', lineHeight: 1.5 }}>
                You are about to force reset the password for <strong>{selectedEmp.name}</strong>.
              </p>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>NEW PASSWORD *</label>
                <input required type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="ceo-form-input" style={{ width: '100%', padding: '12px' }} placeholder="Enter new password" />
              </div>
              <div style={{ marginTop: '12px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setIsResetPasswordOpen(false)} className="ceo-btn" style={{ fontWeight: 700, padding: '10px 20px' }}>Cancel</button>
                <button type="submit" className="ceo-btn" disabled={updating} style={{ fontWeight: 700, padding: '10px 20px', background: 'var(--ceo-danger)', color: '#FFF', border: 'none' }}>{updating ? 'Resetting...' : 'Reset Password'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
