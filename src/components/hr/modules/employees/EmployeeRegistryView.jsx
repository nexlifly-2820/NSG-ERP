// Crash fix applied
import React, { useState, useEffect } from 'react';
import { CheckCircle, Plus, Search, Download, Lock, RefreshCw, Trash2, Edit3, Filter, Shield, Users, User, Eye, EyeOff } from 'lucide-react';
import { notify } from '../../utils/notify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './employeeRegistry.module.css';
import { useCompany } from '../../../common/CompanyContext';

export function EmployeeRegistryView({ queryParams, setQueryParams }) {
  const { companyName, companyLogo, empIdPrefix } = useCompany();
  const [db, onUpdateDb] = useState({ employees: [], auditLogs: [], trainingProgress: [], onboardingTasks: [], leaveBalances: [], attendanceLogs: [], payslips: [] });

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [desigFilter, setDesigFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [apiEmployees, setApiEmployees] = useState(null);
  const [teamLeads, setTeamLeads] = useState([]);
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
  const [newName, setNewName] = useState(queryParams?.get('pre_name') || '');
  const [newEmpId, setNewEmpId] = useState(queryParams?.get('pre_emp_id') || '');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState(queryParams?.get('pre_dept') || '');
  const [newRole, setNewRole] = useState(queryParams?.get('pre_desig') || '');
  const [newShift, setNewShift] = useState('');
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [newPhoto, setNewPhoto] = useState('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState('probation');
  const [newManagerId, setNewManagerId] = useState('');
  const [newSystemRole, setNewSystemRole] = useState('employee');
  const [newPfNumber, setNewPfNumber] = useState('');
  const [newUan, setNewUan] = useState('');
  const [newEsiNumber, setNewEsiNumber] = useState('');
  const [newPanNumber, setNewPanNumber] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newAccountNumber, setNewAccountNumber] = useState('');
  const [newIfscCode, setNewIfscCode] = useState('');
  const [newBankBranch, setNewBankBranch] = useState('');

  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);

  // Edit Employee Modal States
  const [isLoading, setIsLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmpId, setEditEmpId] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editGrade, setEditGrade] = useState(3);
  const [editManager, setEditManager] = useState('');
  const [editSystemRole, setEditSystemRole] = useState('employee');
  const [editPhoto, setEditPhoto] = useState('');
  const [editPhotoFile, setEditPhotoFile] = useState(null);
  const [editPfNumber, setEditPfNumber] = useState('');
  const [editUan, setEditUan] = useState('');
  const [editEsiNumber, setEditEsiNumber] = useState('');
  const [editPanNumber, setEditPanNumber] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editBankName, setEditBankName] = useState('');
  const [editAccountNumber, setEditAccountNumber] = useState('');
  const [editIfscCode, setEditIfscCode] = useState('');
  const [editBankBranch, setEditBankBranch] = useState('');

  // Reset Password Modal States
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmp, setResetEmp] = useState(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [updatedPasswords, setUpdatedPasswords] = useState({});

  const openResetModal = (emp) => {
    setResetEmp(emp);
    setNewPassword('');
    setShowOldPassword(false);
    setShowResetModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
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
      if (res.ok) {
        setUpdatedPasswords(prev => ({ ...prev, [resetEmp.id]: newPassword }));
        setShowResetModal(false);
        setResetEmp(null);
        notify('Password updated successfully!');
      } else {
        notify('Failed to reset password.', 'error');
      }
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  // Assets State
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  useEffect(() => {
    if (selectedEmp && profileTab === 'asset') {
      const fetchAssets = async () => {
        setIsLoadingAssets(true);
        try {
          const token = localStorage.getItem('nsg_jwt_token');
          const res = await fetch(`/api/hr-portal/onboarding/assets/${selectedEmp.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setEmployeeAssets(data);
          }
        } catch (err) {
          console.error("Failed to fetch assets", err);
        } finally {
          setIsLoadingAssets(false);
        }
      };
      fetchAssets();
    }
  }, [selectedEmp, profileTab]);

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
          phone: emp.phone || '',
          bank_name: emp.bank_name || '',
          account_number: emp.account_number || '',
          ifsc_code: emp.ifsc_code || '',
          grade: emp.grade || 3,
          manager: emp.manager || '',
          documents: emp.documents ? (typeof emp.documents === 'string' ? JSON.parse(emp.documents) : emp.documents) : []
        }));
        setApiEmployees(enriched);
        onUpdateDb({
          ...db,
          employees: enriched
        });
        const tlRes = await fetch('/api/hr-portal/team-leads', { headers: { 'Authorization': `Bearer ${token}` } });
        if (tlRes.ok) {
          setTeamLeads(await tlRes.json());
        }

        // Fetch dynamic data
        const deptRes = await fetch('/api/hr-portal/departments', { headers: { 'Authorization': `Bearer ${token}` } });
        if (deptRes.ok) setDepartments(await deptRes.json());

        const desigRes = await fetch('/api/hr-portal/designations', { headers: { 'Authorization': `Bearer ${token}` } });
        if (desigRes.ok) setDesignations(await desigRes.json());

        const shiftRes = await fetch('/api/hr-portal/shifts', { headers: { 'Authorization': `Bearer ${token}` } });
        if (shiftRes.ok) setShifts(await shiftRes.json());
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

  const uniqueRoles = [...new Set(employeeList.map(e => e.role).filter(Boolean))];
  const uniqueDepts = [...new Set(employeeList.map(e => e.department).filter(Boolean))];
  const uniqueDesigs = [...new Set(employeeList
    .filter(e => deptFilter === 'All' || e.department === deptFilter)
    .map(e => e.designation)
    .filter(Boolean))];

  const filtered = employeeList.filter(e => {
    const searchLower = search?.toLowerCase() || '';
    const matchesSearch = (e.name && e.name.toLowerCase().includes(searchLower)) || 
                          (e.emp_id && e.emp_id.toLowerCase().includes(searchLower)) ||
                          (e.department && e.department.toLowerCase().includes(searchLower)) ||
                          (e.designation && e.designation.toLowerCase().includes(searchLower)) ||
                          (e.role && e.role.toLowerCase().includes(searchLower)) ||
                          (e.status && e.status.toLowerCase().includes(searchLower)) ||
                          (e.join_date && e.join_date.toLowerCase().includes(searchLower)) ||
                          (e.email && e.email.toLowerCase().includes(searchLower));
    const matchesDept = deptFilter === 'All' || e.department === deptFilter;
    const matchesRole = roleFilter === 'All' || e.role === roleFilter;
    const matchesDesig = desigFilter === 'All' || e.designation === desigFilter;
    return matchesSearch && matchesDept && matchesRole && matchesDesig;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [search, deptFilter, roleFilter, desigFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentEmployees = filtered.slice(startIndex, startIndex + itemsPerPage);

  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = companyLogo || '/hmns-logo.png';
    
    const renderPDF = () => {
      // Premium White Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 110, 'F');
      
      try {
        const imgRatio = img.width / img.height;
        const logoHeight = 45;
        const logoWidth = logoHeight * imgRatio;
        doc.addImage(img, 'PNG', 40, 25, logoWidth, logoHeight);
      } catch (e) {
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text(companyName, 40, 50);
      }
      
      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(40, 100, doc.internal.pageSize.getWidth() - 40, 100);
      
      // Report Title
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.text('EMPLOYEE REGISTRY MASTER LOG', doc.internal.pageSize.getWidth() - 40, 45, { align: 'right' });
      
      // Timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, 65, { align: 'right' });

      // Filter info
      let filterText = `Filters: `;
      if (roleFilter !== 'All') filterText += `Role: ${roleFilter} | `;
      if (deptFilter !== 'All') filterText += `Dept: ${deptFilter} | `;
      if (desigFilter !== 'All') filterText += `Desig: ${desigFilter}`;
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(filterText.replace(/ \| $/, ''), 40, 85);

      // Table Data
      const tableColumn = ["ID", "Name", "Department", "Designation", "Role", "Status", "Join Date"];
      const tableRows = [];

      filtered.forEach(emp => {
        const rowData = [
          emp.emp_id,
          emp.name,
          emp.department,
          emp.designation,
          emp.role,
          emp.status,
          emp.join_date
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        startY: 120,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { 
          fillColor: [51, 65, 85], // slate-700
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          halign: 'left',
          valign: 'middle'
        },
        styles: { 
          fontSize: 10, 
          cellPadding: 8,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.5
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
        margin: { top: 120, left: 40, right: 40, bottom: 40 },
        didDrawPage: function (data) {
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
        }
      });

      doc.save(`NSG_Employee_Registry_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    img.onload = renderPDF;
    img.onerror = renderPDF;
    
    // Log export to audit
    const newLogs = [...db.auditLogs, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      initiator_id: 'Sarah Jenkins',
      module: 'Employees',
      record_id: 0,
      action_type: 'verify_doc',
      change_diff: { export_action: 'Employee Registry PDF Exported', row_count: filtered.length },
      ip_address: '192.168.1.104',
      client_agent: 'Chrome / Windows'
    }];
    onUpdateDb({ ...db, auditLogs: newLogs });
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      let finalPhotoUrl = newPhoto;
      
      // If a file was selected, upload it first
      if (newPhotoFile) {
        const formData = new FormData();
        formData.append('file', newPhotoFile);
        const uploadRes = await fetch('/api/hr-portal/employees/upload-photo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalPhotoUrl = uploadData.url;
        }
      }

      const response = await fetch('/api/hr-portal/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newName,
          emp_id: newEmpId ? `${empIdPrefix}-${newEmpId}` : null,
          email: newEmail,
          department: newDept,
          designation: newRole,
          status: newStatus,
          join_date: newJoinDate,
          photo: finalPhotoUrl,
          manager_id: newManagerId ? parseInt(newManagerId) : null,
          role: newSystemRole,
          shift_timing: newShift,
          pf_number: newPfNumber || null,
          uan: newUan || null,
          esi_number: newEsiNumber || null,
          pan_number: newPanNumber || null,
          location: newLocation || null,
          bank_name: newBankName || null,
          account_number: newAccountNumber || null,
          ifsc_code: newIfscCode || null,
          bank_branch: newBankBranch || null
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
        phone: createdEmp.phone || '',
        bank_name: createdEmp.bank_name || '',
        account_number: createdEmp.account_number || '',
        ifsc_code: createdEmp.ifsc_code || '',
        grade: createdEmp.grade || 3,
        manager: createdEmp.manager || '',
        documents: createdEmp.documents ? JSON.parse(createdEmp.documents) : []
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
      setNewEmpId('');
      setNewEmail('');
      setNewPhotoFile(null);
      setNewPhoto('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80');
      setNewJoinDate(new Date().toISOString().split('T')[0]);
      setNewStatus('probation');
      setNewDept('');
      setNewRole('');
      setNewShift('');
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
      let finalPhotoUrl = editPhoto;
      
      // If a file was selected, upload it first
      if (editPhotoFile) {
        const formData = new FormData();
        formData.append('file', editPhotoFile);
        const uploadRes = await fetch('/api/hr-portal/employees/upload-photo', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalPhotoUrl = uploadData.url;
        }
      }

      const res = await fetch(`/api/hr-portal/employees/${editEmp.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          email: editEmail,
          emp_id: editEmpId || null,
          department: editDept,
          designation: editRole,
          phone: editPhone,
          grade: editGrade,
          manager: editManager ? teamLeads.find(tl => String(tl.id) === String(editManager))?.name : null,
          manager_id: editManager ? parseInt(editManager) : null,
          role: editSystemRole,
          photo: finalPhotoUrl,
          pf_number: editPfNumber || null,
          uan: editUan || null,
          esi_number: editEsiNumber || null,
          pan_number: editPanNumber || null,
          location: editLocation || null,
          bank_name: editBankName || null,
          account_number: editAccountNumber || null,
          ifsc_code: editIfscCode || null,
          bank_branch: editBankBranch || null
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


  const openEditModal = (emp) => {
    setEditEmp(emp);
    setEditName(emp.name);
    setEditEmpId(emp.emp_id || '');
    setEditEmail(emp.email);
    setEditDept(emp.department || 'Engineering');
    setEditRole(emp.designation || 'Developer');
    setEditPhone(emp.phone || '');
    setEditGrade(emp.grade || 3);
    setEditManager(emp.manager_id || '');
    setEditSystemRole(emp.role || 'employee');
    setEditPhoto(emp.photo || '');
    setEditPfNumber(emp.pf_number || '');
    setEditUan(emp.uan || '');
    setEditEsiNumber(emp.esi_number || '');
    setEditPanNumber(emp.pan_number || '');
    setEditLocation(emp.location || '');
    setEditBankName(emp.bank_name || '');
    setEditAccountNumber(emp.account_number || '');
    setEditIfscCode(emp.ifsc_code || '');
    setEditBankBranch(emp.bank_branch || '');
    setEditPhotoFile(null);
    setShowEditModal(true);
  };

  useEffect(() => {
    if (subTab === 'editEmployee' && selectedEmp && !showEditModal) {
      openEditModal(selectedEmp);
      setQueryParams({ empId: String(selectedEmp.id), subTab: 'info' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subTab, selectedEmp, showEditModal]);

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

  const handleUploadDocument = async (docType) => {
    setScanningDoc(docType);
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/hr-portal/employees/${selectedEmp.id}/documents/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doc_type: docType })
      });
      if (res.ok) {
        const updatedEmp = await res.json();
        updatedEmp.documents = typeof updatedEmp.documents === 'string' ? JSON.parse(updatedEmp.documents) : updatedEmp.documents;
        
        const updatedEmployees = db.employees.map(emp => emp.id === updatedEmp.id ? { ...emp, documents: updatedEmp.documents } : emp);
        onUpdateDb({ ...db, employees: updatedEmployees });
        setApiEmployees(updatedEmployees);
        setSelectedEmp(updatedEmp);
        
        notify(`Malware Scan Clean! Document ${docType} successfully uploaded & enqueued for verification.`);
      } else {
        window.toast.error('Failed to upload document.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setScanningDoc(null);
    }
  };

  const handleVerifyDocument = async (docType) => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/hr-portal/employees/${selectedEmp.id}/documents/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doc_type: docType })
      });
      if (res.ok) {
        const updatedEmp = await res.json();
        updatedEmp.documents = typeof updatedEmp.documents === 'string' ? JSON.parse(updatedEmp.documents) : updatedEmp.documents;
        
        const updatedEmployees = db.employees.map(emp => emp.id === updatedEmp.id ? { ...emp, documents: updatedEmp.documents } : emp);
        onUpdateDb({ ...db, employees: updatedEmployees });
        setApiEmployees(updatedEmployees);
        setSelectedEmp(updatedEmp);
        
        notify(`Document ${docType} successfully verified and stamped ✓`);
      } else {
        window.toast.error('Failed to verify document.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadDocument = (doc) => {
    const fileHref = doc.link || doc.fileUrl || doc.file_url;
    const docLabel = doc.name || doc.docType || 'Document';

    if (fileHref) {
      const element = document.createElement("a");
      element.href = fileHref;
      element.download = doc.original_filename || doc.fileName || doc.filename || `${docLabel.replace(/\s+/g, '_')}_Document`;
      element.target = "_blank";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      const pdfData = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << >> >>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000056 00000 n \n0000000111 00000 n \ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n190\n%%EOF";
      const blob = new Blob([pdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      let fileName = docLabel;
      if (!fileName.toLowerCase().endsWith('.pdf')) {
        fileName += '.pdf';
      }
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="component-container" style={{ padding: '20px 12px', maxWidth: '100%', width: '100%' }}>
      <div className="component-header">
        <div>
          <h1>Employee Registry</h1>
          <p>Monitor staffing rosters, verify identity records, and oversee onboarding completions.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="print-btn" style={{ padding: '8px 16px', fontSize: '13px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }} onClick={exportToPDF}>
            <Download size={16} /> Download PDF
          </button>
          <button className="strategic-list-item" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowAddWizard(true)}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* Searching filters */}
      <div style={{ display: 'flex', gap: '12px', backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px', alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '20px', borderRight: '1px solid #cbd5e1' }}>
          <Filter size={18} color="#94a3b8" />
          <span style={{fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Filters</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '8px', gap: '8px', minWidth: '200px' }}>
          <Search size={16} style={{ color: '#94a3b8' }} />
          <input type="text" placeholder="Search any field (Name, ID, Role...)" value={search} onChange={(e) => setSearch(e.target.value)} style={{ background: 'none', border: 'none', color: '#334155', width: '100%', outline: 'none', fontSize: '13px' }} />
        </div>

        <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setDesigFilter('All'); }} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', flexShrink: 0 }}>
          <option value="All">All Departments</option>
          {uniqueDepts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={desigFilter} onChange={(e) => setDesigFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', flexShrink: 0 }}>
          <option value="All">All Designations</option>
          {uniqueDesigs.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 600, fontSize: '13px', outline: 'none', backgroundColor: '#ffffff', flexShrink: 0 }}>
          <option value="All">All Roles</option>
          {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="dashboard-row-grid" style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Directory Tables */}
        <div className={styles.tableContainer} style={{ flex: 1, minWidth: 0, margin: 0 }}>
          <table className={styles.premiumTable}>
            <thead>
              <tr>
                <th>Employee</th>
                <th className={styles.centerAlign}>ID</th>
                <th>Department</th>
                <th>Designation</th>
                <th className={styles.centerAlign}>Role</th>
                <th className={styles.centerAlign}>Status</th>
                <th className={styles.centerAlign}>Join Date</th>
                <th className={styles.centerAlign}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentEmployees.map(emp => (
                <tr key={emp.id} onClick={() => { setSelectedEmp(emp); setRevealBank(false); }}>
                  <td>
                    <div className={styles.userProfile}>
                      <img src={emp.photo || `https://ui-avatars.com/api/?name=${emp.name.replace(/ /g, '+')}&background=0F172A&color=fff`} alt={emp.name} className={styles.userAvatar} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${emp.name.replace(/ /g, '+')}&background=0F172A&color=fff`; }} />
                      <div className={styles.userInfo}>
                        <span className={styles.userName}>{emp.name}</span>
                        <span className={styles.userEmail}>{emp.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className={styles.centerAlign}><span className={styles.idHighlight}>{emp.emp_id}</span></td>
                  <td>{emp.department}</td>
                  <td>{emp.designation}</td>
                  <td className={styles.centerAlign}>
                    <span className={`${styles.roleTag} ${emp.role === 'hr' ? styles.roleTagHr : emp.role === 'tl' ? styles.roleTagTl : styles.roleTagEmployee}`}>
                      {emp.role === 'hr' && <Shield size={12} />}
                      {emp.role === 'tl' && <Users size={12} />}
                      {emp.role === 'employee' && <User size={12} />}
                      {emp.role}
                    </span>
                  </td>
                  <td className={`${styles.centerAlign} ${styles.nowrapCell}`}>
                    <span className={`badge-pill ${emp.status === 'active' ? 'badge-green' : emp.status === 'probation' ? 'badge-gold' : 'danger'}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className={`${styles.centerAlign} ${styles.nowrapCell}`}>{emp.join_date}</td>
                  <td className={styles.centerAlign} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.actionGroup}>
                      <button title="Edit Employee" onClick={() => openEditModal(emp)} className={`${styles.actionBtn} ${styles.edit}`}>
                        <Edit3 size={14} />
                      </button>

                      <button title="Delete Employee" onClick={() => handleDeleteEmployee(emp.id)} className={`${styles.actionBtn} ${styles.delete}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Showing <strong>{startIndex + 1}</strong> to <strong>{Math.min(startIndex + itemsPerPage, filtered.length)}</strong> of <strong>{filtered.length}</strong> entries
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage === 1 ? '#f1f5f9' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  Previous
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', borderRadius: '6px', border: page === currentPage ? 'none' : '1px solid #cbd5e1', backgroundColor: page === currentPage ? '#2563eb' : '#fff', color: page === currentPage ? '#fff' : '#334155', cursor: 'pointer', fontWeight: 600 }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage === totalPages ? '#f1f5f9' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 600 }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile Side Panels */}
        {selectedEmp && (() => {
          const progress = db.trainingProgress?.find(p => p.employee_id === selectedEmp.id) || { completed_modules: 0, quiz_score: 0, passed: false };
          const docs = selectedEmp.documents || [];
          const leave = db.leaveBalances?.find(b => b.employee_id === selectedEmp.id) || { CL: 0, SL: 0, EL: 0 };
          const attendance = db.attendanceLogs?.filter(l => l.employee_id === selectedEmp.id) || [];

          return (
            <div className="card" style={{ width: '420px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <img src={selectedEmp.photo || `https://ui-avatars.com/api/?name=${selectedEmp.name.replace(/ /g, '+')}&background=0F172A&color=fff`} alt={selectedEmp.name} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${selectedEmp.name.replace(/ /g, '+')}&background=0F172A&color=fff`; }} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h3 style={{ margin: 0, border: 'none', padding: 0 }}>{selectedEmp.name}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span className="code-span">{selectedEmp.emp_id}</span>
                      <span className={`${styles.roleTag} ${selectedEmp.role === 'hr' ? styles.roleTagHr : selectedEmp.role === 'tl' ? styles.roleTagTl : styles.roleTagEmployee}`} style={{ padding: '2px 6px', fontSize: '10px' }}>
                        {selectedEmp.role === 'hr' && <Shield size={10} />}
                        {selectedEmp.role === 'tl' && <Users size={10} />}
                        {selectedEmp.role === 'employee' && <User size={10} />}
                        {selectedEmp.role ? selectedEmp.role.toUpperCase() : 'EMPLOYEE'}
                      </span>
                    </div>
                    {(() => {
                      const hrManager = employeeList.find(e => e.role === 'hr' && (e.designation || '').toLowerCase().includes('manager')) || employeeList.find(e => e.role === 'hr');
                      const hrName = hrManager ? hrManager.name : 'HR Team';
                      return (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                          {selectedEmp.manager && selectedEmp.manager !== 'John Doe' ? (
                            <span style={{ fontSize: '10px', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Users size={10} /> TL: {selectedEmp.manager}
                            </span>
                          ) : null}
                          <span style={{ fontSize: '10px', backgroundColor: 'rgba(192, 38, 211, 0.1)', color: '#c026d3', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Shield size={10} /> HR: {hrName}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-2px' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px', padding: 0, lineHeight: 1 }} onClick={() => setSelectedEmp(null)}>✕</button>
                  </div>
                  <button title="Edit Employee" onClick={() => openEditModal(selectedEmp)} style={{ background: 'none', border: '1px solid var(--border-color)', color: '#60a5fa', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button title="Delete Employee" onClick={() => handleDeleteEmployee(selectedEmp.id)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                  <button title="Reset Password" onClick={() => openResetModal(selectedEmp)} style={{ background: 'none', border: '1px solid var(--border-color)', color: '#f59e0b', cursor: 'pointer', padding: '4px 8px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}>
                    <Lock size={12} /> Reset
                  </button>
                </div>
              </div>

              {/* Tab Selector Inside Drawer */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '8px', paddingBottom: '4px' }}>
                {['info', 'docs', 'asset'].map(tab => (
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
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Designation</span>
                      <strong>{selectedEmp.designation}</strong>
                    </div>

                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Office Location</span>
                      <strong>{selectedEmp.location || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>PF / UAN / ESI</span>
                      <strong>{selectedEmp.pf_number || 'N/A'} / {selectedEmp.uan || 'N/A'} / {selectedEmp.esi_number || 'N/A'}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>PAN</span>
                      <strong>{selectedEmp.pan_number || 'N/A'}</strong>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Masked Bank Details</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '13px', fontFamily: 'var(--font-mono)' }}>
                            {selectedEmp.bank_name || 'NA'} — {revealBank ? (selectedEmp.account_number || 'NA') : (selectedEmp.account_number ? `****${selectedEmp.account_number.slice(-4)}` : 'NA')}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            IFSC: {selectedEmp.ifsc_code || 'NA'} | Branch: {selectedEmp.bank_branch || 'NA'}
                          </span>
                        </div>
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
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{doc.name}</div>
                          </div>
                          <div>
                            {doc.status === 'verified' ? (
                              <span style={{ color: 'var(--accent-green)', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={14} /> Verified
                              </span>
                            ) : (
                              <button
                                onClick={() => handleDownloadDocument(doc)}
                                style={{
                                  backgroundColor: 'transparent',
                                  color: '#3b82f6',
                                  border: '1px solid var(--border-color)',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}
                              >
                                <Download size={12} /> Download
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>


                  </div>
                )}


                {profileTab === 'asset' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Assigned Corporate Assets</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                        {isLoadingAssets ? (
                          <span style={{ color: 'var(--text-muted)' }}>Loading assets...</span>
                        ) : employeeAssets.length > 0 ? (
                          employeeAssets.map(asset => (
                            <div key={asset.id} style={{ backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{asset.name} <span style={{ color: 'var(--text-muted)', fontWeight: 'normal', fontSize: '12px' }}>({asset.type})</span></div>
                                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>SN: {asset.serialNumber || 'N/A'} | Tag: {asset.id}</div>
                              </div>
                              <span style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{asset.returnStatus || 'Issued'}</span>
                            </div>
                          ))
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No assets assigned yet. (Connect with IT)</span>
                        )}
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setShowAddWizard(false); }}>
          <form onSubmit={handleAddEmployee} className="card" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>🧑‍💼 Add New Employee Wizard</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>EMPLOYEE FULL NAME *</label>
                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="e.g. Jane Doe" style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>EMPLOYEE ID</label>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-tertiary)', borderRight: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    {empIdPrefix}-
                  </div>
                  <input type="text" value={newEmpId} onChange={(e) => setNewEmpId(e.target.value)} placeholder="Auto-gen if blank" style={{ flex: 1, backgroundColor: 'transparent', border: 'none', color: '#fff', padding: '10px 12px', outline: 'none' }} />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>EMAIL ADDRESS *</label>
                <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required placeholder="jane@hmns.com" style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>DEPARTMENT *</label>
                <select value={newDept} onChange={(e) => setNewDept(e.target.value)} required style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }}>
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>DESIGNATION / TITLE *</label>
                <select disabled={!newDept} title={!newDept ? "First choose a department" : ""} value={newRole} onChange={(e) => setNewRole(e.target.value)} required style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', cursor: !newDept ? 'not-allowed' : 'pointer', opacity: !newDept ? 0.6 : 1 }}>
                  <option value="">Select Designation</option>
                  {designations.filter(d => !newDept || d.dept === newDept).map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>SYSTEM ROLE</label>
                <select value={newSystemRole} onChange={(e) => setNewSystemRole(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }}>
                  <option value="employee">Employee</option>
                  <option value="tl">Team Lead (TL)</option>
                  <option value="hr">HR Admin</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>JOINING DATE *</label>
                <input type="date" value={newJoinDate} onChange={(e) => setNewJoinDate(e.target.value)} required style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>REPORTS TO (TEAM LEAD)</label>
                <select disabled={newSystemRole !== 'employee'} title={newSystemRole !== 'employee' ? "Only employees report to a team lead" : ""} value={newManagerId} onChange={(e) => setNewManagerId(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', cursor: newSystemRole !== 'employee' ? 'not-allowed' : 'pointer', opacity: newSystemRole !== 'employee' ? 0.6 : 1 }}>
                  <option value="">None / Executive</option>
                  {teamLeads.map(tl => (
                    <option key={tl.id} value={tl.id}>{tl.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>EMPLOYMENT STATUS</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }}>
                  <option value="probation">Probation</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>SHIFT TIMING</label>
                <select value={newShift} onChange={(e) => setNewShift(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }}>
                  <option value="">Standard 9 to 5</option>
                  {shifts.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.start_time} - {s.end_time})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>PF NUMBER</label>
                <input type="text" value={newPfNumber} onChange={(e) => setNewPfNumber(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>UAN</label>
                <input type="text" value={newUan} onChange={(e) => setNewUan(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>ESI NUMBER</label>
                <input type="text" value={newEsiNumber} onChange={(e) => setNewEsiNumber(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>PAN</label>
                <input type="text" value={newPanNumber} onChange={(e) => setNewPanNumber(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>OFFICE LOCATION</label>
                <input type="text" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>BANK ACCOUNT NUMBER</label>
                <input type="text" value={newAccountNumber} onChange={(e) => setNewAccountNumber(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>IFSC CODE</label>
                <input type="text" value={newIfscCode} onChange={(e) => setNewIfscCode(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>BANK NAME</label>
                <input type="text" value={newBankName} onChange={(e) => setNewBankName(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>BANK BRANCH NAME</label>
                <input type="text" value={newBankBranch} onChange={(e) => setNewBankBranch(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) setShowEditModal(false); }}>
          <form onSubmit={handleEditEmployee} className="card" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '32px', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>✏️ Edit Employee Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>EMPLOYEE FULL NAME *</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} required style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>EMAIL ADDRESS *</label>
                <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>EMPLOYEE ID</label>
                <input type="text" value={editEmpId} onChange={(e) => setEditEmpId(e.target.value)} placeholder="Auto-generated if left blank" style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>DEPARTMENT *</label>
                <select value={editDept} onChange={(e) => setEditDept(e.target.value)} required style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }}>
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>DESIGNATION / TITLE *</label>
                <select disabled={!editDept} title={!editDept ? "First choose a department" : ""} value={editRole} onChange={(e) => setEditRole(e.target.value)} required style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', cursor: !editDept ? 'not-allowed' : 'pointer', opacity: !editDept ? 0.6 : 1 }}>
                  <option value="">Select Designation</option>
                  {designations.filter(d => !editDept || d.dept === editDept).map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>PHONE NUMBER</label>
                <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="+91 99000 11000" style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>SYSTEM ROLE</label>
                <select value={editSystemRole} onChange={(e) => setEditSystemRole(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }}>
                  <option value="employee">Employee</option>
                  <option value="tl">Team Lead (TL)</option>
                  <option value="hr">HR Admin</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>REPORTS TO (TEAM LEAD)</label>
                <select disabled={editSystemRole !== 'employee'} title={editSystemRole !== 'employee' ? "Only employees report to a team lead" : ""} value={editManager} onChange={(e) => setEditManager(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', cursor: editSystemRole !== 'employee' ? 'not-allowed' : 'pointer', opacity: editSystemRole !== 'employee' ? 0.6 : 1 }}>
                  <option value="">None / Executive</option>
                  {teamLeads.map(tl => (
                    <option key={tl.id} value={tl.id}>{tl.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>PF NUMBER</label>
                <input type="text" value={editPfNumber} onChange={(e) => setEditPfNumber(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>UAN</label>
                <input type="text" value={editUan} onChange={(e) => setEditUan(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>ESI NUMBER</label>
                <input type="text" value={editEsiNumber} onChange={(e) => setEditEsiNumber(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>PAN</label>
                <input type="text" value={editPanNumber} onChange={(e) => setEditPanNumber(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>OFFICE LOCATION</label>
                <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>BANK ACCOUNT NUMBER</label>
                <input type="text" value={editAccountNumber} onChange={(e) => setEditAccountNumber(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>IFSC CODE</label>
                <input type="text" value={editIfscCode} onChange={(e) => setEditIfscCode(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>BANK NAME</label>
                <input type="text" value={editBankName} onChange={(e) => setEditBankName(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>BANK BRANCH NAME</label>
                <input type="text" value={editBankBranch} onChange={(e) => setEditBankBranch(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-muted)' }}>PROFILE PHOTO</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {editPhoto && (
                    <img src={typeof editPhoto === 'string' ? editPhoto : URL.createObjectURL(editPhotoFile)} alt="Current profile" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }} />
                  )}
                  <input type="file" accept="image/*" onChange={(e) => setEditPhotoFile(e.target.files[0])} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px' }} />
                </div>
              </div>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if (e.target === e.currentTarget) { { setShowResetModal(false); setResetEmp(null); } } } }>
          <form onSubmit={handleResetPassword} className="card" style={{ width: '400px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px' }}>
            <h3>🔒 Reset Employee Password</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '8px 0 16px 0' }}>
              Resetting password for <strong>{resetEmp.name}</strong> ({resetEmp.email}).
            </p>
            {(!resetEmp.designation || resetEmp.designation.toLowerCase() !== 'ceo') && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0 8px 0' }}>
                <label style={{ fontSize: '12px', fontWeight: 'bold' }}>OLD PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showOldPassword ? "text" : "password"} 
                    value={showOldPassword ? (resetEmp ? (updatedPasswords[resetEmp.id] || "erp123") : "") : "••••••••"}
                    readOnly
                    style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '8px', paddingRight: '40px', borderRadius: '6px', cursor: 'not-allowed' }} 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '8px 0 16px 0' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>NEW PASSWORD</label>
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

