import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, Search, Download, Lock, RefreshCw, Trash2, Edit3 } from 'lucide-react';
import { notify } from '../../utils/notify';

export function EmployeeRegistryView({ db, onUpdateDb, queryParams, setQueryParams }) {

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [apiEmployees, setApiEmployees] = useState(null);
  const employeeList = apiEmployees || db.employees;
  
  const empIdStr = queryParams?.get('empId');
  const selectedEmp = empIdStr ? employeeList.find(e => String(e.id) === empIdStr) : null;
  const setSelectedEmp = (emp) => {
    setQueryParams({ empId: emp ? String(emp.id) : '', subTab: emp ? 'info' : '' });
  };

  const subTab = queryParams?.get('subTab') || '';
  const showAddWizard = subTab === 'addEmployee';
  const setShowAddWizard = (val) => setQueryParams({ subTab: val ? 'addEmployee' : '' });

  const profileTab = (subTab && subTab !== 'addEmployee') ? subTab : 'info';
  const setProfileTab = (val) => setQueryParams({ subTab: val });

  const [revealBank, setRevealBank] = useState(false);
  const [scanningDoc, setScanningDoc] = useState(null); // type of doc being scanned

  // New Employee Form States
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Engineering');
  const [newRole, setNewRole] = useState('Developer');
  const [newPhoto, setNewPhoto] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState('probation');

  // Edit Employee Modal States
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGrade, setEditGrade] = useState(3);
  const [editManager, setEditManager] = useState('');
  const [editPhoto, setEditPhoto] = useState('');

  // Reset Password States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmp, setResetEmp] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Fetch employees from backend API
  const fetchEmployees = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      setIsLoading(true);
      const res = await fetch('/api/hr-portal/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const enriched = data.map(emp => ({
          ...emp,
          phone: emp.phone || '+91 99000 11000',
          bank_name: emp.bank_name || 'HDFC Bank',
          account_number: emp.account_number || '50100000000000',
          ifsc_code: emp.ifsc_code || 'HDFC0000012',
          grade: emp.grade || 3,
          manager: emp.manager || 'John Doe',
          documents: emp.documents ? (typeof emp.documents === 'string' ? JSON.parse(emp.documents) : emp.documents) : [
            { type: 'Aadhaar Card', name: 'aadhaar_verify.pdf', status: 'verified', date: emp.join_date },
            { type: 'Degree Certificate', name: 'bachelors_degree.pdf', status: 'pending', date: emp.join_date }
          ]
        }));
        setApiEmployees(enriched);
        onUpdateDb({
          ...db,
          employees: enriched
        });
      }
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filtered = employeeList.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || (e.emp_id && e.emp_id.toLowerCase().includes(search.toLowerCase()));
    const matchesDept = deptFilter === 'All' || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleExportCSV = () => {
    let csv = 'Employee ID,Name,Email,Department,Designation,Status,Join Date\n';
    filtered.forEach(e => {
      csv += `${e.emp_id},${e.name},${e.email},${e.department},${e.designation},${e.status},${e.join_date}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `NSG_Employee_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    
    // Log csv export to audit
    const newLogs = [...db.auditLogs, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      initiator_id: 'Sarah Jenkins',
      module: 'Employees',
      record_id: 0,
      action_type: 'verify_doc', // Export action
      change_diff: { export_action: 'Employee Registry CSV Exported', row_count: filtered.length },
      ip_address: '192.168.1.104',
      client_agent: 'Chrome / Windows'
    }];
    onUpdateDb({ ...db, auditLogs: newLogs });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const response = await fetch('/api/hr-portal/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          department: newDept,
          designation: newRole,
          status: newStatus,
          join_date: newJoinDate,
          photo: newPhoto
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to add employee on the server.');
      }

      const result = await response.json();
      const createdEmp = result.employee;
      const tempPassword = result.temporary_password;

      const newEmp = {
        ...createdEmp,
        phone: '+91 99887 76655',
        bank_name: createdEmp.bank_name || 'HDFC Bank',
        account_number: createdEmp.account_number || ('50100' + Math.floor(100000000 + Math.random() * 900000000)),
        ifsc_code: createdEmp.ifsc_code || 'HDFC0000012',
        grade: createdEmp.grade || 3,
        manager: createdEmp.manager || 'John Doe',
        documents: createdEmp.documents ? JSON.parse(createdEmp.documents) : [
          { type: 'Aadhaar Card', name: 'aadhaar_verify.pdf', status: 'verified', date: new Date().toISOString().split('T')[0] },
          { type: 'Degree Certificate', name: 'bachelors_degree.pdf', status: 'pending', date: new Date().toISOString().split('T')[0] }
        ]
      };
      
      // Add default training progress for the employee
      const newProgress = [...(db.trainingProgress || []), {
        id: Date.now() + 1,
        employee_id: newEmp.id,
        track_id: 1,
        completed_modules: 0,
        quiz_score: 0,
        passed: false
      }];

      const newLogs = [...db.auditLogs, {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        initiator_id: 'Sarah Jenkins',
        module: 'Employees',
        record_id: newEmp.id,
        action_type: 'create',
        change_diff: { created_employee: newEmp.name, assigned_role: newEmp.designation },
        ip_address: '192.168.1.104',
        client_agent: 'Chrome / Windows'
      }];

      // Also auto initialize onboarding tasks for them
      const newOnboardingTasks = [
        { id: Date.now() + 10, instance_id: newEmp.id, task_name: 'Workstation Setup & Laptop Provisioning', assigned_to: 'IT', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: true, requires_esign: false, completed_at: null, status: 'pending' },
        { id: Date.now() + 11, instance_id: newEmp.id, task_name: 'Provision System Logins & Email', assigned_to: 'IT', due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: true, requires_esign: false, completed_at: null, status: 'pending' },
        { id: Date.now() + 12, instance_id: newEmp.id, task_name: 'Mandatory NDA Policy E-Sign', assigned_to: 'Employee', due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: true, requires_esign: true, completed_at: null, status: 'pending' },
        { id: Date.now() + 13, instance_id: newEmp.id, task_name: 'Complete Compliance Induction Quiz', assigned_to: 'Employee', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: true, requires_esign: false, completed_at: null, status: 'pending' },
        { id: Date.now() + 14, instance_id: newEmp.id, task_name: 'Welcome Kit & Access Badge Handover', assigned_to: 'HR', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: false, requires_esign: false, completed_at: null, status: 'pending' }
      ];

      onUpdateDb({
        ...db,
        employees: [...db.employees, newEmp],
        trainingProgress: newProgress,
        onboardingTasks: [...(db.onboardingTasks || []), ...newOnboardingTasks],
        auditLogs: newLogs
      });

      setNewName('');
      setNewEmail('');
      setNewPhoto('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80');
      setNewJoinDate(new Date().toISOString().split('T')[0]);
      setNewStatus('probation');
      setShowAddWizard(false);
      await fetchEmployees();
      notify(`Employee ${newEmp.name} successfully added!\n\nTemporary Login Credentials:\nUsername (Email): ${newEmp.email}\nPassword: ${tempPassword}\n\nPlease share these credentials with the employee so they can log in.`);
    } catch (err) {
      notify(`Failed to add employee: ${err.message}`, 'error');
    }
  };

  const handleConfirmProbation = async (id) => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/hr-portal/employees/${id}/confirm-probation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to confirm probation.');
      }
      await fetchEmployees();
      notify('Employee probation confirmed! Status set to Fully Active.');
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  const handleExtendProbation = async (id) => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/hr-portal/employees/${id}/extend-probation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to extend probation.');
      }
      const updated = await res.json();
      await fetchEmployees();
      notify(`Probation successfully extended by 90 days. New end date: ${updated.probation_end_date}`);
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  const handleTerminateProbation = async (id) => {
    if (!confirm('Are you sure you want to terminate this employee during probation? This will update their status to inactive immediately.')) return;
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/hr-portal/employees/${id}/terminate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to terminate employee.');
      }
      await fetchEmployees();
      notify('Employment terminated. Employee status marked as Inactive.');
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  // ─── Edit Employee (PUT) ────────────────────────────────────────────────────
  const handleEditEmployee = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/hr-portal/employees/${editEmp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          department: editDept,
          designation: editRole,
          phone: editPhone,
          grade: editGrade,
          manager: editManager,
          photo: editPhoto
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to update employee.');
      }
      setShowEditModal(false);
      setEditEmp(null);
      await fetchEmployees();
      notify('Employee profile updated successfully!');
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  // ─── Delete Employee (DELETE) ───────────────────────────────────────────────
  const handleDeleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to permanently delete this employee record? This action cannot be undone.')) return;
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/hr-portal/employees/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to delete employee.');
      }
      setSelectedEmp(null);
      await fetchEmployees();
      notify('Employee record permanently deleted.');
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      notify('Please enter a valid password.', 'warning');
      return;
    }
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/hr-portal/employees/${resetEmp.id}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to reset employee password.');
      }
      setShowResetModal(false);
      setResetEmp(null);
      setNewPassword('');
      notify('Employee password successfully updated / reset!');
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  const openResetModal = (emp) => {
    setResetEmp(emp);
    setNewPassword('');
    setShowResetModal(true);
  };

  const openEditModal = (emp) => {
    setEditEmp(emp);
    setEditName(emp.name);
    setEditEmail(emp.email);
    setEditDept(emp.department || 'Engineering');
    setEditRole(emp.designation || 'Developer');
    setEditPhone(emp.phone || '');
    setEditGrade(emp.grade || 3);
    setEditManager(emp.manager || '');
    setEditPhoto(emp.photo || '');
    setShowEditModal(true);
  };

  const handleRevealBankDetails = (emp) => {
    setRevealBank(true);
    const newLogs = [...db.auditLogs, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      initiator_id: 'Sarah Jenkins',
      module: 'Employees',
      record_id: emp.id,
      action_type: 'verify_doc', // monospaced audit trails action
      change_diff: { revealed_sensitive_data: `Bank account of ${emp.name} was revealed` },
      ip_address: '192.168.1.104',
      client_agent: 'Chrome / Windows'
    }];
    onUpdateDb({
      ...db,
      auditLogs: newLogs
    });
  };

  const handleUploadDocument = (docType) => {
    setScanningDoc(docType);
    setTimeout(() => {
      // simulated malware scan complete in 1.5s
      const currentDocs = selectedEmp.documents || [
        { type: 'Aadhaar Card', name: 'aadhaar_verify.pdf', status: 'verified', date: '2026-05-20' },
        { type: 'Degree Certificate', name: 'bachelors_degree.pdf', status: 'pending', date: '2026-05-22' }
      ];
      const updatedDocs = [
        ...currentDocs.filter(d => d.type !== docType),
        { type: docType, name: `${docType.toLowerCase().replace(/ /g, '_')}_upload.pdf`, status: 'pending', date: new Date().toISOString().split('T')[0] }
      ];
      
      const updatedEmployees = db.employees.map(emp => {
        if (emp.id === selectedEmp.id) {
          return { ...emp, documents: updatedDocs };
        }
        return emp;
      });

      const newLogs = [...db.auditLogs, {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        initiator_id: 'Sarah Jenkins',
        module: 'Employees',
        record_id: selectedEmp.id,
        action_type: 'verify_doc',
        change_diff: { uploaded_document: docType },
        ip_address: '192.168.1.104',
        client_agent: 'Chrome / Windows'
      }];

      onUpdateDb({
        ...db,
        employees: updatedEmployees,
        auditLogs: newLogs
      });

      setSelectedEmp({
        ...selectedEmp,
        documents: updatedDocs
      });

      setScanningDoc(null);
      notify(`Malware Scan Clean! Document ${docType} successfully uploaded & enqueued for verification.`);
    }, 1500);
  };

  const handleVerifyDocument = (docType) => {
    const currentDocs = selectedEmp.documents || [];
    const updatedDocs = currentDocs.map(d => {
      if (d.type === docType) {
        return { ...d, status: 'verified' };
      }
      return d;
    });

    const updatedEmployees = db.employees.map(emp => {
      if (emp.id === selectedEmp.id) {
        return { ...emp, documents: updatedDocs };
      }
      return emp;
    });

    const newLogs = [...db.auditLogs, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      initiator_id: 'Sarah Jenkins',
      module: 'Employees',
      record_id: selectedEmp.id,
      action_type: 'verify_doc',
      change_diff: { verified_document: docType },
      ip_address: '192.168.1.104',
      client_agent: 'Chrome / Windows'
    }];

    onUpdateDb({
      ...db,
      employees: updatedEmployees,
      auditLogs: newLogs
    });

    setSelectedEmp({
      ...selectedEmp,
      documents: updatedDocs
    });

    notify(`Document ${docType} successfully verified and stamped ✓`);
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Employee Registry</h1>
          <p>Monitor staffing rosters, verify identity records, and oversee onboarding completions.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="print-btn" style={{ padding: '8px 16px', fontSize: '13px' }} onClick={handleExportCSV}>
            <Download size={16} /> Export CSV
          </button>
          <button className="strategic-list-item" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowAddWizard(true)}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Searching filters */}
      <div style={{ display: 'flex', gap: '16px', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '8px', gap: '8px' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input type="text" placeholder="Search by name, ID or role..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ background: 'none', border: 'none', color: '#fff', width: '100%', outline: 'none', fontSize: '13px' }} />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 16px', borderRadius: '8px', outline: 'none' }}>
          <option value="All">All Departments</option>
          <option value="Executive">Executive</option>
          <option value="Engineering">Engineering</option>
          <option value="IT">IT</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="Human Resources">Human Resources</option>
          <option value="Finance">Finance</option>
        </select>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Directory Tables */}
        <div className="table-container" style={{ flex: 1, margin: 0, overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Status</th>
                <th>Join Date</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id} onClick={() => { setSelectedEmp(emp); setProfileTab('info'); setRevealBank(false); }} style={{ cursor: 'pointer' }}>
                  <td>
                    <img src={emp.photo} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                  </td>
                  <td><span className="code-span">{emp.emp_id}</span></td>
                  <td><strong>{emp.name}</strong></td>
                  <td>{emp.email}</td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td>
                    <span className={`badge-pill ${emp.status === 'active' ? 'badge-green' : emp.status === 'probation' ? 'badge-gold' : 'danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td>{emp.join_date}</td>
                  <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button title="Edit Employee" onClick={() => openEditModal(emp)} style={{ background: 'none', border: '1px solid var(--border-color)', color: '#60a5fa', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}>
                        <Edit3 size={11} /> Edit
                      </button>
                      <button title="Reset Password" onClick={() => openResetModal(emp)} style={{ background: 'none', border: '1px solid var(--border-color)', color: '#f59e0b', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}>
                        <Lock size={11} /> Reset
                      </button>
                      <button title="Delete Employee" onClick={() => handleDeleteEmployee(emp.id)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px' }}>
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Profile Side Panels */}
        {selectedEmp && (() => {
          const progress = db.trainingProgress?.find(p => p.employee_id === selectedEmp.id) || { completed_modules: 0, quiz_score: 0, passed: false };
          const docs = selectedEmp.documents || [
            { type: 'Aadhaar Card', name: 'aadhaar_verify.pdf', status: 'verified', date: '2026-05-20' },
            { type: 'Degree Certificate', name: 'bachelors_degree.pdf', status: 'pending', date: '2026-05-22' }
          ];
          const leave = db.leaveBalances?.find(b => b.employee_id === selectedEmp.id) || { CL: 0, SL: 0, EL: 0 };
          const attendance = db.attendanceLogs?.filter(l => l.employee_id === selectedEmp.id) || [];
          const payslipsList = db.payslips?.filter(p => p.employee_id === selectedEmp.id) || [];

          return (
            <div className="card" style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <img src={selectedEmp.photo} alt={selectedEmp.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ margin: 0, border: 'none', padding: 0 }}>{selectedEmp.name}</h3>
                    <span className="code-span">{selectedEmp.emp_id}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button title="Edit Employee" onClick={() => openEditModal(selectedEmp)} style={{ background: 'none', border: '1px solid var(--border-color)', color: '#60a5fa', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button title="Delete Employee" onClick={() => handleDeleteEmployee(selectedEmp.id)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                  <button title="Reset Password" onClick={() => openResetModal(selectedEmp)} style={{ background: 'none', border: '1px solid var(--border-color)', color: '#f59e0b', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                    <Lock size={12} /> Reset
                  </button>
                  <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }} onClick={() => setSelectedEmp(null)}>✕</button>
                </div>
              </div>

              {/* Tab Selector Inside Drawer */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '8px', paddingBottom: '4px' }}>
                {['info', 'docs', 'probation', 'attendance', 'payroll'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setProfileTab(tab); setRevealBank(false); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: profileTab === tab ? 'var(--accent-pink)' : 'var(--text-muted)',
                      borderBottom: profileTab === tab ? '2px solid var(--accent-pink)' : 'none',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}
                  >
                    {tab === 'docs' ? 'Docs Vault' : tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div style={{ minHeight: '240px' }}>
                {profileTab === 'info' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Email Address</span>
                      <strong>{selectedEmp.email}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Phone Number</span>
                      <strong>{selectedEmp.phone || '+91 99000 11000'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Structural Grade & Designation</span>
                      <strong>Grade {selectedEmp.grade} — {selectedEmp.designation}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Active Manager & Dept</span>
                      <strong>{selectedEmp.manager} ({selectedEmp.department})</strong>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Masked Bank Details</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                          {selectedEmp.bank_name} — {revealBank ? selectedEmp.account_number : `****${selectedEmp.account_number.slice(-4)}`}
                        </span>
                        {!revealBank ? (
                          <button
                            onClick={() => handleRevealBankDetails(selectedEmp)}
                            style={{
                              backgroundColor: 'rgba(236,72,153,0.1)',
                              color: 'var(--accent-pink)',
                              border: 'none',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            Reveal Account
                          </button>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--accent-green)', fontWeight: 'bold' }}>Logged ✓</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === 'docs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Verified Employee Credentials Vault</span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {docs.map((doc, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: '600' }}>{doc.type}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{doc.name} ({doc.date})</div>
                          </div>
                          <div>
                            {doc.status === 'verified' ? (
                              <span style={{ color: 'var(--accent-green)', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={14} /> Verified
                              </span>
                            ) : (
                              <button
                                onClick={() => handleVerifyDocument(doc.type)}
                                style={{
                                  backgroundColor: 'var(--accent-pink)',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                Verify
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Upload simulated box */}
                    <div style={{ border: '2px dashed var(--border-color)', borderRadius: '8px', padding: '16px', textAlign: 'center', marginTop: '8px' }}>
                      {scanningDoc ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                          <RefreshCw size={24} className="animate-spin" style={{ color: 'var(--accent-pink)' }} />
                          <span style={{ fontSize: '12px', color: 'var(--accent-pink)', fontWeight: 'bold' }} className="pulse">Malware Scanner Active: Analyzing {scanningDoc}...</span>
                        </div>
                      ) : (
                        <div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Upload document into verified vault</span>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleUploadDocument('PAN Card')}
                              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              + PAN Card
                            </button>
                            <button
                              onClick={() => handleUploadDocument('Degree Certificate')}
                              style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              + Degree
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {profileTab === 'probation' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Onboarding Status</span>
                      <strong style={{ fontSize: '14px', color: selectedEmp.status === 'probation' ? 'var(--accent-gold)' : 'var(--accent-green)' }}>
                        {selectedEmp.status.toUpperCase()}
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Probation Timeline End Date</span>
                      <strong>{selectedEmp.probation_end_date}</strong>
                    </div>

                    {selectedEmp.status === 'probation' && (
                      <div style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                          {progress.passed ? (
                            <span style={{ color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                              <CheckCircle size={16} style={{ color: 'var(--accent-green)' }} /> L&D Compliance Quiz Passed ({progress.quiz_score}%)
                            </span>
                          ) : (
                            <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                              <Lock size={16} style={{ color: '#fbbf24' }} /> L&D Quiz Lock Prerequisite Engaged (Score: {progress.quiz_score}%)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <button
                            className="print-btn"
                            disabled={!progress.passed}
                            style={{
                              width: '100%',
                              justifyContent: 'center',
                              backgroundColor: progress.passed ? 'var(--accent-pink)' : 'rgba(255,255,255,0.05)',
                              color: progress.passed ? '#fff' : 'var(--text-muted)',
                              cursor: progress.passed ? 'pointer' : 'not-allowed',
                              border: progress.passed ? 'none' : '1px solid var(--border-color)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            onClick={() => handleConfirmProbation(selectedEmp.id)}
                          >
                            {!progress.passed && <Lock size={14} />} Confirm Probation Active
                          </button>

                          <button
                            className="print-btn"
                            style={{ width: '100%', justifyContent: 'center' }}
                            onClick={() => handleExtendProbation(selectedEmp.id)}
                          >
                            Extend Probation Timeline (90 Days)
                          </button>

                          <button
                            className="print-btn"
                            style={{ width: '100%', justifyContent: 'center', backgroundColor: '#ef4444', color: '#fff', border: 'none' }}
                            onClick={() => handleTerminateProbation(selectedEmp.id)}
                          >
                            Terminate Employment Status
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {profileTab === 'attendance' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyBetween: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Casual Leave (CL)</span>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{leave.CL} Days</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sick Leave (SL)</span>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{leave.SL} Days</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Earned Leave (EL)</span>
                        <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{leave.EL} Days</div>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Recent Presence Logs (This Month)</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px', maxHeight: '150px', overflowY: 'auto' }}>
                        {attendance.map((log, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', backgroundColor: 'var(--bg-tertiary)', padding: '6px 10px', borderRadius: '4px' }}>
                            <span>{log.date} ({log.work_mode.toUpperCase()})</span>
                            <span style={{ color: log.is_late ? 'var(--accent-gold)' : 'var(--accent-green)', fontWeight: 'bold' }}>
                              {log.is_late ? 'Late punch' : 'On-time punch'}
                            </span>
                          </div>
                        ))}
                        {attendance.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No attendance logs captured for active period.</span>}
                      </div>
                    </div>
                  </div>
                )}

                {profileTab === 'payroll' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Salary Grade Bracket</span>
                      <strong>Grade {selectedEmp.grade} — Fixed Base Bracket</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Historical Monthly Payslips</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        {payslipsList.map((payslip, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                            <div>
                              <span style={{ fontWeight: '600' }}>Month {payslip.month} / {payslip.year}</span>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Net Salary: ₹{payslip.net.toLocaleString()}</div>
                            </div>
                            <button
                              onClick={() => alert(`Downloading payslip PDF structure for Month ${payslip.month}...`)}
                              style={{
                                background: 'none',
                                border: '1px solid var(--accent-pink)',
                                color: 'var(--accent-pink)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}
                            >
                              PDF Download
                            </button>
                          </div>
                        ))}
                        {payslipsList.length === 0 && <span style={{ color: 'var(--text-muted)' }}>No payslip ledgers processed for employee.</span>}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Popups Adding */}
      {showAddWizard && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleAddEmployee} className="card" style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px' }}>
            <h3>🧑‍💼 Add New Employee Wizard</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
              <label style={{ fontSize: '12px' }}>Employee Full Name</label>
              <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Jane Doe" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              
              <label style={{ fontSize: '12px' }}>Email Address</label>
              <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="jane@hnms.com" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Department</label>
              <select value={newDept} onChange={(e) => setNewDept(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}>
                <option value="Executive">Executive</option>
                <option value="Engineering">Engineering</option>
                <option value="IT">IT</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
              </select>

              <label style={{ fontSize: '12px' }}>Designation / Title</label>
              <input type="text" value={newRole} onChange={(e) => setNewRole(e.target.value)} required placeholder="Staff Developer" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Profile Photo URL</label>
              <input type="text" value={newPhoto} onChange={(e) => setNewPhoto(e.target.value)} placeholder="https://images.unsplash.com/..." style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Joining Date</label>
              <input type="date" value={newJoinDate} onChange={(e) => setNewJoinDate(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Employment Status</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}>
                <option value="probation">Probation</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setShowAddWizard(false)}>Cancel</button>
              <button type="submit" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Create Profile</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && editEmp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleEditEmployee} className="card" style={{ width: '450px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px' }}>
            <h3>✏️ Edit Employee Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
              <label style={{ fontSize: '12px' }}>Employee Full Name</label>
              <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Email Address</label>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Department</label>
              <select value={editDept} onChange={(e) => setEditDept(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}>
                <option value="Executive">Executive</option>
                <option value="Engineering">Engineering</option>
                <option value="IT">IT</option>
                <option value="Marketing">Marketing</option>
                <option value="Sales">Sales</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
              </select>

              <label style={{ fontSize: '12px' }}>Designation / Title</label>
              <input type="text" value={editRole} onChange={(e) => setEditRole(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Phone Number</label>
              <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 99000 11000" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Structural Grade</label>
              <input type="number" value={editGrade} onChange={(e) => setEditGrade(Number(e.target.value))} min={1} max={10} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Reporting Manager</label>
              <input type="text" value={editManager} onChange={(e) => setEditManager(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Profile Photo URL</label>
              <input type="text" value={editPhoto} onChange={(e) => setEditPhoto(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowEditModal(false); setEditEmp(null); }} style={{ background: 'none', border: '1px solid var(--border-color)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Save Changes</button>
            </div>
          </form>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetModal && resetEmp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleResetPassword} className="card" style={{ width: '400px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px' }}>
            <h3>🔒 Reset Employee Password</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0 16px 0' }}>
              Resetting password for <strong>{resetEmp.name}</strong> ({resetEmp.email}).
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>New Password</label>
              <input 
                type="text" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                placeholder="e.g. NewSecretPassword@123"
                style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} 
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => { setShowResetModal(false); setResetEmp(null); }} style={{ background: 'none', border: '1px solid var(--border-color)', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Update Password</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
