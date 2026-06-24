import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Edit, Users, AlertCircle } from 'lucide-react';
import { notify } from '../../utils/notify';
import { generateOfferLetterPDF, getOfferLetterHTML } from '../../../../utils/offerLetterGenerator';

export function OnboardingView({ queryParams, setQueryParams }) {
  const [db, setDb] = useState({
    employees: [],
    auditLogs: [],
    onboardingTasks: null,
    esignRequests: null,
    trainingProgress: null,
    onboardingTemplates: null
  });
  const onUpdateDb = setDb;
  useEffect(() => {
    const syncOnboardingData = async () => {
      const token = localStorage.getItem('nsg_jwt_token');

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [tasksRes, esignRes, empRes] = await Promise.all([
          fetch('/api/hr-portal/onboarding/tasks', { headers }),
          fetch('/api/hr-portal/onboarding/esign-requests', { headers }),
          fetch('/api/hr-portal/employees', { headers }),
        ]);

        const updates = { ...db };
        if (tasksRes.ok) updates.onboardingTasks = await tasksRes.json();
        if (esignRes.ok) updates.esignRequests = await esignRes.json();
        if (empRes.ok) updates.employees = await empRes.json();

        if (tasksRes.ok || esignRes.ok || empRes.ok) {
          onUpdateDb(updates);
        }
      } catch (err) {
        console.error('Failed to sync onboarding data:', err);
      }
    };

    syncOnboardingData();
  }, []);
  const onboardingTab = queryParams?.get('subTab') || 'active';
  const setOnboardingTab = (val) => setQueryParams({ subTab: val });

  const empIdStr = queryParams?.get('empId');
  const selectedInstance = empIdStr ? (db?.employees || []).find(e => String(e.id) === empIdStr) : null;
  const setSelectedInstance = (emp) => {
    setQueryParams({ empId: emp ? String(emp.id) : '' });
  };
  
  // Template Builder States
  const [taskName, setTaskName] = useState('');
  const [taskRole, setTaskRole] = useState('Employee'); // Employee | IT | HR | TL
  const [taskOffset, setTaskOffset] = useState(2);
  const [isMandatory, setIsMandatory] = useState(true);
  const [requiresEsign, setRequiresEsign] = useState(false);
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  // Asset Provisioning State
  const [employeeAssets, setEmployeeAssets] = useState([]);
  const [newAssetType, setNewAssetType] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');
  const [isAssigningAsset, setIsAssigningAsset] = useState(false);
  const [assetErrors, setAssetErrors] = useState({});

  // Document Provisioning State
  const [selectedDocInstance, setSelectedDocInstance] = useState(null);
  const [employeeDocs, setEmployeeDocs] = useState([]);
  const [newDocName, setNewDocName] = useState('');
  const [newDocFile, setNewDocFile] = useState(null);
  const [isAssigningDoc, setIsAssigningDoc] = useState(false);
  const [docErrors, setDocErrors] = useState({});

  useEffect(() => {
    if (selectedDocInstance) {
      let ignore = false;
      setEmployeeDocs([]);
      setNewDocName('');
      setNewDocFile(null);
      setDocErrors({});
      
      const fetchDocs = async () => {
        try {
          const token = localStorage.getItem('nsg_jwt_token');
          const res = await fetch(`/api/hr-portal/onboarding/documents/${selectedDocInstance.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (!ignore) {
              setEmployeeDocs(data);
            }
          }
        } catch (err) {
          console.error('Failed to fetch documents', err);
        }
      };
      fetchDocs();
      return () => { ignore = true; };
    }
  }, [selectedDocInstance]);

  const handleAssignDoc = async (e) => {
    e.preventDefault();
    if (!selectedDocInstance) return;
    
    let hasErr = false;
    const errors = {};
    if (!newDocName.trim()) { errors.name = 'Please enter Document Name.'; hasErr = true; }
    if (!newDocFile) { errors.file = 'Please select a file to upload.'; hasErr = true; }
    if (hasErr) {
      setDocErrors(errors);
      return;
    }
    
    setIsAssigningDoc(true);
    
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const formData = new FormData();
      formData.append('name', newDocName);
      formData.append('file', newDocFile);
      
      const res = await fetch(`/api/hr-portal/onboarding/documents/${selectedDocInstance.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        const addedDoc = await res.json();
        setEmployeeDocs([...employeeDocs, addedDoc]);
        setNewDocName('');
        setNewDocFile(null);
        setDocErrors({});
        notify('Document saved to database successfully', 'success');
      } else {
        notify('Failed to save document', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Failed to save document', 'error');
    } finally {
      setIsAssigningDoc(false);
    }
  };

  useEffect(() => {
    if (selectedInstance) {
      let ignore = false;
      setEmployeeAssets([]);
      setNewAssetType('');
      setNewAssetName('');
      setNewAssetSerial('');
      setAssetErrors({});
      const fetchAssets = async () => {
        try {
          const token = localStorage.getItem('nsg_jwt_token');
          const res = await fetch(`/api/hr-portal/onboarding/assets/${selectedInstance.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (!ignore) {
              setEmployeeAssets(data);
            }
          }
        } catch (err) {
          console.error('Failed to fetch assets', err);
        }
      };
      fetchAssets();
      return () => { ignore = true; };
    }
  }, [selectedInstance]);

  const handleAssignAsset = async (e) => {
    e.preventDefault();
    if (!selectedInstance) return;
    
    // Validate required fields on submit
    let hasErr = false;
    const errors = {};
    if (!newAssetType.trim()) { errors.type = 'Please enter Asset Type.'; hasErr = true; }
    if (!newAssetName.trim()) { errors.name = 'Please enter Asset Name / Model.'; hasErr = true; }
    if (!newAssetSerial.trim()) { errors.serial = 'Please enter Serial Number.'; hasErr = true; }
    if (hasErr) {
      setAssetErrors(errors);
      return;
    }
    
    setIsAssigningAsset(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const generatedTag = 'NSG-' + newAssetType.substring(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
      const payload = {
        assetTag: generatedTag,
        type: newAssetType,
        name: newAssetName,
        serialNumber: newAssetSerial,
        condition: 'New'
      };
      const res = await fetch(`/api/hr-portal/onboarding/assets/${selectedInstance.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const addedAsset = await res.json();
        setEmployeeAssets([...employeeAssets, addedAsset]);
        setNewAssetType('');
        setNewAssetName('');
        setNewAssetSerial('');
        setAssetErrors({});
        notify('Asset assigned successfully', 'success');
      } else {
        notify('Failed to assign asset', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Error assigning asset', 'error');
    } finally {
      setIsAssigningAsset(false);
    }
  };

  // E-Sign Document Preview State
  const [activeDocPreview, setActiveDocPreview] = useState(null); // request object
  const [typedSignature, setTypedSignature] = useState('');
  const [signatureStyle, setSignatureStyle] = useState('cursive'); // cursive | classic
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [signingProgress, setSigningProgress] = useState(0);
  const [isSigning, setIsSigning] = useState(false);
  const otpCode = '9432';
  const [editingEsign, setEditingEsign] = useState(null);
  const [editDocName, setEditDocName] = useState('');
  const [editEmpId, setEditEmpId] = useState('');
  const [editSentAt, setEditSentAt] = useState('');
  const [editStatus, setEditStatus] = useState('');

  // Offer Letter Generation State
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [offerEmp, setOfferEmp] = useState(null);
  const [offerRefStr, setOfferRefStr] = useState(`SS${new Date().getMonth()+1}${new Date().getFullYear().toString().slice(-2)}HYD${Math.floor(100 + Math.random() * 900)}`);
  const [offerReportingTime, setOfferReportingTime] = useState('11:00 AM');
  const [offerCtcLpa, setOfferCtcLpa] = useState('4 LPA');
  const [offerMonthlyTakeHome, setOfferMonthlyTakeHome] = useState('32,000');

  const [showOfferPreviewModal, setShowOfferPreviewModal] = useState(false);
  const [offerPreviewHTML, setOfferPreviewHTML] = useState('');
  const offerPreviewRef = useRef(null);

  const handlePreviewOfferLetter = (e) => {
    e.preventDefault();
    if (!offerEmp) return;
    
    const data = {
      refNumber: offerRefStr,
      offerDate: new Date().toLocaleDateString('en-GB'),
      candidateName: offerEmp.name,
      role: offerEmp.designation || 'EMPLOYEE',
      joiningDate: new Date(offerEmp.join_date || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-'),
      reportingTime: offerReportingTime,
      ctcLpa: offerCtcLpa,
      monthlySalary: offerMonthlyTakeHome
    };
    
    const html = getOfferLetterHTML(data);
    setOfferPreviewHTML(html);
    setShowOfferModal(false);
    setShowOfferPreviewModal(true);
  };

  const handleOfferTemplateUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      
      if (file.type === 'application/pdf') {
        reader.onload = (event) => {
          if (offerPreviewRef.current) {
            offerPreviewRef.current.innerHTML = `<iframe src="${event.target.result}" width="100%" height="1000px" style="border: none;"></iframe>`;
          }
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('image/')) {
        reader.onload = (event) => {
          if (offerPreviewRef.current) {
            offerPreviewRef.current.innerHTML = `<div style="text-align: center;"><img src="${event.target.result}" style="max-width: 100%;" /></div>`;
          }
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          if (offerPreviewRef.current) {
            offerPreviewRef.current.innerHTML = event.target.result;
          }
        };
        reader.readAsText(file);
      }
    }
  };

  const handleDownloadEditedOffer = async () => {
    try {
      const data = {
        candidateName: offerEmp.name,
      };
      // Pass the edited innerHTML as customHTML
      await generateOfferLetterPDF(data, offerPreviewRef.current.innerHTML);
      notify(`Offer Letter PDF for ${offerEmp.name} generated successfully.`, 'success');
      setShowOfferPreviewModal(false);
    } catch (err) {
      notify(`Error generating PDF: ${err.message}`, 'error');
    }
  };

  const activeProbationers = (db?.employees || []).filter(e => e.status === 'probation');
  
  // Pagination State for "New Hires" tab
  const [currentPage, setCurrentPage] = useState(1);
  const cardsPerPage = 6;
  const indexOfLastCard = currentPage * cardsPerPage;
  const indexOfFirstCard = indexOfLastCard - cardsPerPage;
  const currentCards = activeProbationers.slice(indexOfFirstCard, indexOfLastCard);
  const totalPages = Math.ceil(activeProbationers.length / cardsPerPage);

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [onboardingTab]);

  const onboardingTasks = db.onboardingTasks || [];
  const esignRequests = db.esignRequests || [];

  const templates = db.onboardingTemplates || [
    { id: 1, name: 'NSG Corporate Onboarding Template', tasks: [
      { name: 'Workstation Setup & Laptop Provisioning', role: 'IT', offset: 2, mandatory: true, esign: false },
      { name: 'Provision System Logins & Email', role: 'IT', offset: 1, mandatory: true, esign: false },
      { name: 'Mandatory NDA Policy E-Sign', role: 'Employee', offset: 3, mandatory: true, esign: true },
      { name: 'Complete Compliance Induction Quiz', role: 'Employee', offset: 5, mandatory: true, esign: false }
    ]}
  ];

  const handleToggleTask = async (taskId) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/onboarding/tasks/${taskId}/toggle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // re-fetch data
        const tasksRes = await fetch('/api/hr-portal/onboarding/tasks', { headers: { 'Authorization': `Bearer ${token}` } });
        if (tasksRes.ok) {
          const newTasks = await tasksRes.json();
          onUpdateDb({ ...db, onboardingTasks: newTasks });
        }
      } else {
        window.toast.error('Failed to toggle task.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTemplateTask = (e) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const newTask = {
      name: taskName,
      role: taskRole,
      offset: taskOffset,
      mandatory: isMandatory,
      esign: requiresEsign
    };

    const updatedTemplates = templates.map(t => {
      if (t.id === 1) {
        return { ...t, tasks: [...t.tasks, newTask] };
      }
      return t;
    });

    onUpdateDb({
      ...db,
      onboardingTemplates: updatedTemplates
    });

    setTaskName('');
    notify('Task successfully enqueued to onboarding template flow builder.');
  };

  const handleDeleteTemplateTask = (taskName) => {
    const updatedTemplates = templates.map(t => {
      if (t.id === 1) {
        return { ...t, tasks: t.tasks.filter(tk => tk.name !== taskName) };
      }
      return t;
    });
    onUpdateDb({
      ...db,
      onboardingTemplates: updatedTemplates
    });
  };

  const handleSimulateEsign = async (requestId) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/onboarding/esign-requests/${requestId}/simulate-sign`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // refresh data
        const [esignRes, tasksRes] = await Promise.all([
          fetch('/api/hr-portal/onboarding/esign-requests', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/hr-portal/onboarding/tasks', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const updates = { ...db };
        if (esignRes.ok) updates.esignRequests = await esignRes.json();
        if (tasksRes.ok) updates.onboardingTasks = await tasksRes.json();
        onUpdateDb(updates);
        notify('Employee e-signed document via OTP secure portal. Onboarding task updated.');
      } else {
        window.toast.error('Failed to simulate esign.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendEsignRequest = async (emp) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const reqPayload = { employee_id: emp.id, document_name: 'Mandatory NDA Policy Handbook' };
      const res = await fetch('/api/hr-portal/onboarding/esign-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(reqPayload)
      });
      if (res.ok) {
        const newReq = await res.json();
        onUpdateDb({ ...db, esignRequests: [...esignRequests, newReq] });
        notify(`E-signature request for NDA Policy dispatched to ${emp.name} email queue.`, 'info');
      } else {
        window.toast.error('Failed to send request.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendOverdueReminder = (task) => {
    notify(`Alert sent to ${task.assigned_to} for: ${task.task_name}`, 'info');
  };

  const handleDeleteEsign = async (requestId) => {
    if (!window.confirm('Are you sure you want to void and delete this E-Signature request?')) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/onboarding/esign-requests/${requestId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedEsigns = esignRequests.filter(r => r.id !== requestId);
        onUpdateDb({ ...db, esignRequests: updatedEsigns });
      } else {
        window.toast.error('Failed to delete request.');
      }
    } catch (e) {
      console.error(e);
    }
  };



  // Pre-calculate overdue tasks
  const overdueTasks = onboardingTasks.filter(t => {
    if (t.status === 'completed') return false;
    const dueDate = new Date(t.due_date);
    return dueDate < new Date();
  });

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Employee Onboarding</h1>
          <p>Welcome new hires, track their setup tasks, and manage their documents.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { id: 'active', label: 'New Hires' },
            { id: 'templates', label: 'Asset Provided' },
            { id: 'esign', label: 'Documents' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setOnboardingTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: onboardingTab === tab.id ? 'var(--accent-pink)' : 'var(--text-muted)',
                borderBottom: onboardingTab === tab.id ? '2.5px solid var(--accent-pink)' : 'none',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>



        </div>
      </div>

      {onboardingTab === 'active' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="metrics-grid">
            {currentCards.map(emp => {
              const empTasks = onboardingTasks.filter(t => t.instance_id === emp.id);
            const totalTasks = empTasks.length || 5;
            const completedTasks = empTasks.filter(t => t.status === 'completed').length;
            const pct = Math.floor((completedTasks / totalTasks) * 100);
            const nextTaskObj = empTasks.find(t => t.status !== 'completed');
            const nextTask = nextTaskObj ? nextTaskObj.task_name : 'All Onboarding Tasks Complete';

            return (
              <div key={emp.id} className="card" style={{ borderLeft: '4px solid var(--accent-pink)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo} alt={emp.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}  />
                  <div>
                    <h4 style={{ margin: 0 }}>{emp.name}</h4>
                    <span className="code-span" style={{ fontSize: '10px' }}>{emp.emp_id}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>


                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    <span style={{ textTransform: 'uppercase', display: 'block', fontSize: '9px' }}>Next Pending Action</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', gap: '8px' }}>
                      <strong style={{ color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', flex: 1 }} title={nextTask}>{nextTask}</strong>
                      {nextTaskObj && (
                        <span className={`badge-pill ${
                          nextTaskObj.assigned_to === 'IT' ? 'bg-blue' :
                          nextTaskObj.assigned_to === 'HR' ? 'bg-pink' :
                          nextTaskObj.assigned_to === 'Employee' ? 'bg-green' : 'bg-gold'
                        }`} style={{ fontSize: '9px', padding: '2px 6px', color: '#fff', flexShrink: 0, textTransform: 'uppercase' }}>
                          {nextTaskObj.assigned_to}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '4px', marginTop: '12px' }}>
                    <button
                      className="print-btn"
                      title="Open in Edit Employee Profile"
                      style={{ flex: 'none', justifyContent: 'center', padding: '6px', fontSize: '11px', width: '32px' }}
                      onClick={() => {
                        const q = new URLSearchParams({
                          empId: emp.id,
                          subTab: 'editEmployee'
                        });
                        window.location.hash = `#/HR/employees?${q.toString()}`;
                      }}
                    >
                      <Users size={14} />
                    </button>
                    <button
                      className="print-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '6px', fontSize: '11px' }}
                      onClick={() => setSelectedInstance(emp)}
                    >
                      Assets
                    </button>
                    <button
                      className="print-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '6px', fontSize: '11px' }}
                      onClick={() => setSelectedDocInstance(emp)}
                    >
                      Docs
                    </button>
                    <button
                      className="print-btn"
                      style={{ flex: 1, justifyContent: 'center', padding: '6px', fontSize: '11px', backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none' }}
                      onClick={() => {
                        setOfferEmp(emp);
                        setOfferRefStr(`SS${new Date().getMonth()+1}${new Date().getFullYear().toString().slice(-2)}HYD${Math.floor(100 + Math.random() * 900)}`);
                        setShowOfferModal(true);
                      }}
                    >
                      Offer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {activeProbationers.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: 'span 3', padding: '32px', fontSize: '15px' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>👋</span>
              No new hires are currently onboarding.
            </p>
          )}
          </div>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '8px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: currentPage === 1 ? 'var(--bg-tertiary)' : 'var(--bg-primary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: currentPage === totalPages ? 'var(--bg-tertiary)' : 'var(--bg-primary)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {onboardingTab === 'templates' && (
        <div className="table-container">
          <div className="pipeline-title" style={{ padding: '16px 16px 0 16px' }}>Asset Provisioning Status</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 24px' }}>Candidate Name</th>
                <th style={{ padding: '16px 24px' }}>Employee ID</th>
                <th style={{ padding: '16px 24px' }}>Designation</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCards.map(emp => (
                <tr key={emp.id}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}  />
                      <strong>{emp.name}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}><span className="code-span">{emp.emp_id}</span></td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{emp.designation}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button
                      className="print-btn"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setSelectedInstance(emp)}
                    >
                      View Assets
                    </button>
                  </td>
                </tr>
              ))}
              {activeProbationers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No active candidates found.</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', marginBottom: '16px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: currentPage === 1 ? 'var(--bg-tertiary)' : 'var(--bg-primary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: currentPage === totalPages ? 'var(--bg-tertiary)' : 'var(--bg-primary)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {onboardingTab === 'esign' && (
        <div className="table-container">
          <div className="pipeline-title" style={{ padding: '16px 16px 0 16px' }}>Document Provisioning Status</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 24px' }}>Candidate Name</th>
                <th style={{ padding: '16px 24px' }}>Employee ID</th>
                <th style={{ padding: '16px 24px' }}>Designation</th>
                <th style={{ padding: '16px 24px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCards.map(emp => (
                <tr key={emp.id}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}  />
                      <strong>{emp.name}</strong>
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px' }}><span className="code-span">{emp.emp_id}</span></td>
                  <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{emp.designation}</td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <button
                      className="print-btn"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                      onClick={() => setSelectedDocInstance(emp)}
                    >
                      View Docs
                    </button>
                  </td>
                </tr>
              ))}
              {activeProbationers.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No active candidates found.</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px', marginBottom: '16px' }}>
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: currentPage === 1 ? 'var(--bg-tertiary)' : 'var(--bg-primary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: currentPage === totalPages ? 'var(--bg-tertiary)' : 'var(--bg-primary)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* 💻 ASSET PROVISIONING MODAL */}
      {selectedInstance && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { setSelectedInstance(null) } }}>
          <div className="card" style={{ width: '600px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '24px 24px 16px 24px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                💻 Asset Provisioning — {selectedInstance.name}
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }} onClick={() => setSelectedInstance(null)}>✕</button>
            </div>

            <div className="custom-scroll" style={{ overflowY: 'auto', padding: '20px 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
              {/* List of currently assigned assets */}
              <div>
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>Currently Assigned Assets</h4>
                {employeeAssets.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employeeAssets.map(asset => (
                      <div key={asset.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>{asset.name} <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>({asset.type})</span></div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>SN: {asset.serialNumber || 'N/A'} | Tag: {asset.assetTag}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span className="badge-pill bg-blue">{asset.returnStatus}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', fontSize: '12px' }}>
                    No assets assigned yet.
                  </div>
                )}
              </div>

              {/* Form to assign a new asset */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase' }}>Assign New Asset</h4>
                <form onSubmit={handleAssignAsset} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Asset Type *</label>
                    {assetErrors.type && <div style={{ color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {assetErrors.type}</div>}
                    <input type="text" value={newAssetType} 
                           onFocus={(e) => { if (!e.target.value.trim()) setAssetErrors(p => ({...p, type: 'Please enter Asset Type.'})); }}
                           onBlur={(e) => { if (!e.target.value.trim()) setAssetErrors(p => ({...p, type: 'Please enter Asset Type.'})); else setAssetErrors(p => ({...p, type: ''})); }}
                           onChange={(e) => { setNewAssetType(e.target.value); if (!e.target.value.trim()) setAssetErrors(p => ({...p, type: 'Please enter Asset Type.'})); else setAssetErrors(p => ({...p, type: ''})); }} 
                           required placeholder="e.g. Laptop, Monitor, Headset..." 
                           style={{ backgroundColor: 'var(--bg-primary)', border: assetErrors.type ? '1px solid #ef4444' : '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Asset Name / Model *</label>
                    {assetErrors.name && <div style={{ color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {assetErrors.name}</div>}
                    <input type="text" value={newAssetName} 
                           onFocus={(e) => { if (!e.target.value.trim()) setAssetErrors(p => ({...p, name: 'Please enter Asset Name / Model.'})); }}
                           onBlur={(e) => { if (!e.target.value.trim()) setAssetErrors(p => ({...p, name: 'Please enter Asset Name / Model.'})); else setAssetErrors(p => ({...p, name: ''})); }}
                           onChange={(e) => { setNewAssetName(e.target.value); if (!e.target.value.trim()) setAssetErrors(p => ({...p, name: 'Please enter Asset Name / Model.'})); else setAssetErrors(p => ({...p, name: ''})); }} 
                           required placeholder="e.g. MacBook Pro M3 16-inch" 
                           style={{ backgroundColor: 'var(--bg-primary)', border: assetErrors.name ? '1px solid #ef4444' : '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Serial Number *</label>
                    {assetErrors.serial && <div style={{ color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {assetErrors.serial}</div>}
                    <input type="text" value={newAssetSerial} 
                           onFocus={(e) => { if (!e.target.value.trim()) setAssetErrors(p => ({...p, serial: 'Please enter Serial Number.'})); }}
                           onBlur={(e) => { if (!e.target.value.trim()) setAssetErrors(p => ({...p, serial: 'Please enter Serial Number.'})); else setAssetErrors(p => ({...p, serial: ''})); }}
                           onChange={(e) => { setNewAssetSerial(e.target.value); if (!e.target.value.trim()) setAssetErrors(p => ({...p, serial: 'Please enter Serial Number.'})); else setAssetErrors(p => ({...p, serial: ''})); }} 
                           required placeholder="e.g. C02X123456" 
                           style={{ backgroundColor: 'var(--bg-primary)', border: assetErrors.serial ? '1px solid #ef4444' : '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="submit" disabled={isAssigningAsset} style={{ backgroundColor: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: isAssigningAsset ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', opacity: isAssigningAsset ? 0.7 : 1 }}>
                      {isAssigningAsset ? 'Assigning...' : 'Assign Asset'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📄 DOCUMENT PROVISIONING MODAL */}
      {selectedDocInstance && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { setSelectedDocInstance(null) } }}>
          <div className="card" style={{ width: '600px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', padding: 0, overflow: 'hidden', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', padding: '24px 24px 16px 24px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 Document Provisioning — {selectedDocInstance.name}
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }} onClick={() => setSelectedDocInstance(null)}>✕</button>
            </div>

            <div className="custom-scroll" style={{ overflowY: 'auto', padding: '20px 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: 0 }}>
              {/* List of currently assigned docs */}
              <div>
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>Currently Assigned Documents</h4>
                {employeeDocs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {employeeDocs.map(doc => (
                      <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--text-primary)' }}>{doc.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>File: {doc.link ? doc.link.split('\\\\').pop().split('/').pop() : 'Uploaded'}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge-pill bg-green">{doc.status}</span>
                          {doc.link && doc.link !== 'N/A' && (
                            <a 
                              href={doc.link} 
                              download={doc.original_filename || 'document'}
                              target="_blank"
                              rel="noreferrer"
                              style={{ 
                                backgroundColor: 'var(--accent-blue)', 
                                color: '#fff', 
                                padding: '4px 8px', 
                                borderRadius: '4px', 
                                fontSize: '11px', 
                                textDecoration: 'none',
                                fontWeight: 'bold'
                              }}
                            >
                              Download
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', fontSize: '12px' }}>
                    No documents assigned yet.
                  </div>
                )}
              </div>

              {/* Form to assign a new doc */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase' }}>Assign New Document</h4>
                <form onSubmit={handleAssignDoc} style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Document Name *</label>
                    {docErrors.name && <div style={{ color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {docErrors.name}</div>}
                    <input type="text" value={newDocName} 
                           onFocus={(e) => { if (!e.target.value.trim()) setDocErrors(p => ({...p, name: 'Please enter Document Name.'})); }}
                           onBlur={(e) => { if (!e.target.value.trim()) setDocErrors(p => ({...p, name: 'Please enter Document Name.'})); else setDocErrors(p => ({...p, name: ''})); }}
                           onChange={(e) => { setNewDocName(e.target.value); if (!e.target.value.trim()) setDocErrors(p => ({...p, name: 'Please enter Document Name.'})); else setDocErrors(p => ({...p, name: ''})); }} 
                           required placeholder="e.g. Aadhar Card Copy" 
                           style={{ backgroundColor: 'var(--bg-primary)', border: docErrors.name ? '1px solid #ef4444' : '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>File Upload *</label>
                    {docErrors.file && <div style={{ color: '#ef4444', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={12} /> {docErrors.file}</div>}
                    <input type="file" 
                           onFocus={(e) => { if (!e.target.files || e.target.files.length === 0) setDocErrors(p => ({...p, file: 'Please select a file to upload.'})); }}
                           onBlur={(e) => { if (!e.target.files || e.target.files.length === 0) setDocErrors(p => ({...p, file: 'Please select a file to upload.'})); else setDocErrors(p => ({...p, file: ''})); }}
                           onChange={(e) => { setNewDocFile(e.target.files[0]); if (!e.target.files || e.target.files.length === 0) setDocErrors(p => ({...p, file: 'Please select a file to upload.'})); else setDocErrors(p => ({...p, file: ''})); }} 
                           required style={{ backgroundColor: 'var(--bg-primary)', border: docErrors.file ? '1px solid #ef4444' : '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="submit" disabled={isAssigningDoc} style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: isAssigningDoc ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 'bold', opacity: isAssigningDoc ? 0.7 : 1 }}>
                      {isAssigningDoc ? 'Uploading...' : 'Upload Document'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📄 OFFER LETTER GENERATION OVERLAY */}
      {showOfferModal && offerEmp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { setShowOfferModal(false) } }}>
          <div className="card" style={{ width: '460px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📄 Issue Offer Letter PDF
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setShowOfferModal(false)}>✕</button>
            </div>

            <form onSubmit={handlePreviewOfferLetter} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Employee</span>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{offerEmp.name} ({offerEmp.designation})</div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label>Reference Number</label>
                  <input type="text" value={offerRefStr} onChange={(e) => setOfferRefStr(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label>Reporting Time</label>
                  <input type="text" value={offerReportingTime} onChange={(e) => setOfferReportingTime(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label>Annual CTC (LPA)</label>
                  <input type="text" value={offerCtcLpa} onChange={(e) => setOfferCtcLpa(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <label>Monthly Take-Home</label>
                  <input type="text" value={offerMonthlyTakeHome} onChange={(e) => setOfferMonthlyTakeHome(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '14px' }}>
                <button type="button" onClick={() => setShowOfferModal(false)}>Cancel</button>
                <button type="submit">
                  Preview &amp; Edit Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📄 OFFER LETTER EDIT PREVIEW OVERLAY */}
      {showOfferPreviewModal && offerEmp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { setShowOfferPreviewModal(false) } }}>
          <div className="card" style={{ width: '900px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '90vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ✏️ Edit Offer Letter
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Upload Custom Format (Any File)</label>
                  <input type="file" onChange={handleOfferTemplateUpload} style={{ fontSize: '12px', maxWidth: '200px', backgroundColor: 'var(--bg-primary)', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setShowOfferPreviewModal(false)}>✕</button>
              </div>
            </div>

            <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', backgroundColor: '#e5e7eb', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'center' }}>
               <div 
                  ref={offerPreviewRef} 
                  contentEditable 
                  suppressContentEditableWarning 
                  dangerouslySetInnerHTML={{ __html: offerPreviewHTML }}
                  style={{ outline: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', minHeight: '800px', backgroundColor: '#fff', zoom: '0.85' }}
               />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '14px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                💡 You can click directly on the letter text above to edit any contents before downloading.
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setShowOfferPreviewModal(false); setShowOfferModal(true); }}>Back to Details</button>
                <button type="submit" onClick={handleDownloadEditedOffer}>
                  Download Final PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* 📄 INTERACTIVE DIGITAL E-SIGN CONTRACT STAMPER */}
      {activeDocPreview && (() => {
        const emp = db.employees.find(e => e.id === activeDocPreview.employee_id) || { name: 'Employee' };
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { { setActiveDocPreview(null); setOtpVerified(false); setEnteredOtp(''); setIsSigning(false); setSigningProgress(0); } } } }>
            <div className="card" style={{ width: '560px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  📄 Digital Signature Portal &amp; Verification
                </h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => { setActiveDocPreview(null); setOtpVerified(false); setEnteredOtp(''); setIsSigning(false); setSigningProgress(0); }}>✕</button>
              </div>

              {/* Document Mock Sheet */}
              <div style={{ backgroundColor: '#ffffff', color: '#111827', padding: '24px', borderRadius: '8px', fontSize: '11px', maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-color)', fontFamily: 'serif', lineHeight: '1.6' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '14px', marginBottom: '16px' }}>MUTUAL NON-DISCLOSURE AGREEMENT (NDA)</div>
                <p>This Agreement is entered into on this {new Date(activeDocPreview.sent_at).toLocaleDateString()} by and between <strong>NSG Technologies India Private Limited</strong> ("Disclosing Party") and <strong>{emp.name}</strong> ("Receiving Party").</p>
                <h4 style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>1. Confidential Information</h4>
                <p>Receiving Party agrees to protect, safeguard, and maintain strict confidentiality regarding all proprietary source code, client schemas, ERP designs, and internal database tables disclosed during their operational lifecycle at NSG Technologies.</p>
                <h4 style={{ fontWeight: 'bold', marginTop: '12px', marginBottom: '4px' }}>2. Term and IP Protection</h4>
                <p>The duty to safeguard confidential structures survives employment indefinitely. Any unauthorized disclosure of systems configuration or user data logs triggers immediate IP civil review, disciplinary action PIPs, and contract termination.</p>
                <div style={{ borderTop: '1px dashed #d1d5db', marginTop: '24px', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontStyle: 'italic' }}>
                  <div>
                    <span>Authorized Signatory:</span>
                    <div style={{ fontFamily: 'cursive', fontSize: '14px', color: '#1d4ed8', marginTop: '4px' }}>Sarah Jenkins</div>
                    <span style={{ fontSize: '9px', color: '#6b7280' }}>HR Manager, NSG Corp</span>
                  </div>
                  <div>
                    <span>Receiving Party Signature:</span>
                    {otpVerified ? (
                      <div>
                        <div style={{ 
                          fontFamily: signatureStyle === 'cursive' ? 'cursive' : 'serif', 
                          fontSize: '14px', 
                          color: 'var(--accent-pink)', 
                          marginTop: '4px',
                          borderBottom: '1px solid #4b5563',
                          paddingBottom: '2px',
                          fontWeight: 'bold'
                        }}>
                          {typedSignature || emp.name}
                        </div>
                        <span style={{ fontSize: '9px', color: 'var(--accent-green)', fontWeight: 'bold' }}>✓ Secure OTP Verified</span>
                      </div>
                    ) : (
                      <div style={{ color: '#ef4444', fontSize: '10px', fontStyle: 'normal' }}>[ Awaiting Signature ]</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                {!otpVerified ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '600' }}>🔒 Step 1: Signatory OTP Validation</div>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>We simulated sending a 4-digit verification secure OTP code to {emp.name}'s phone. Code for demo: <strong>{otpCode}</strong></p>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input 
                        type="text" 
                        placeholder="Enter 4-Digit OTP" 
                        value={enteredOtp} 
                        onChange={(e) => setEnteredOtp(e.target.value)} 
                        maxLength={4}
                        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px', outline: 'none', width: '130px', textAlign: 'center', fontFamily: 'var(--font-mono)' }} 
                      />
                      <button 
                        type="button"
                        style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        onClick={() => {
                          if (enteredOtp === otpCode) {
                            setOtpVerified(true);
                            setTypedSignature(emp.name);
                          } else {
                            notify('Invalid OTP code. Use 9432 for demo signing.', 'warning');
                          }
                        }}
                      >
                        Verify &amp; Unlock Signatures
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--bg-tertiary)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '600' }}>🖋️ Step 2: Stylize E-Signature</div>
                    
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Type Signature Name</label>
                        <input 
                          type="text" 
                          value={typedSignature} 
                          onChange={(e) => setTypedSignature(e.target.value)} 
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px', outline: 'none' }} 
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Font Style</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button type="button" style={{ backgroundColor: signatureStyle === 'cursive' ? 'var(--accent-pink)' : 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }} onClick={() => setSignatureStyle('cursive')}>Cursive</button>
                          <button type="button" style={{ backgroundColor: signatureStyle === 'classic' ? 'var(--accent-pink)' : 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }} onClick={() => setSignatureStyle('classic')}>Classic</button>
                        </div>
                      </div>
                    </div>

                    {isSigning ? (
                      <div style={{ marginTop: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginBottom: '4px' }}>
                          <span>Applying Digital Cryptographic Seal...</span>
                          <strong>{signingProgress}%</strong>
                        </div>
                        <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${signingProgress}%`, backgroundColor: 'var(--accent-green)' }} />
                        </div>
                      </div>
                    ) : (
                      <button 
                        type="button"
                        style={{ backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', marginTop: '8px', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        onClick={() => {
                          setIsSigning(true);
                          let progress = 0;
                          const interval = setInterval(() => {
                            progress += 10;
                            setSigningProgress(progress);
                            if (progress >= 100) {
                              clearInterval(interval);
                              handleSimulateEsign(activeDocPreview.id);
                              setActiveDocPreview(null);
                              setOtpVerified(false);
                              setEnteredOtp('');
                              setIsSigning(false);
                              setSigningProgress(0);
                            }
                          }, 100);
                        }}
                      >
                        Apply Certified Digital Signature &amp; Stamp
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}



      {/* 📝 EDIT E-SIGN DOCUMENT MODAL */}
      {editingEsign && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (!editDocName.trim()) return;

              const oldEmpId = editingEsign.employee_id;
              const newEmpId = Number(editEmpId);

              const updatedEsigns = esignRequests.map(r => {
                if (r.id === editingEsign.id) {
                  const newStatus = editStatus;
                  const newSignedAt = newStatus === 'signed' ? (r.signed_at || new Date().toISOString()) : null;
                  return { 
                    ...r, 
                    employee_id: newEmpId,
                    document_name: editDocName,
                    sent_at: new Date(editSentAt).toISOString(),
                    status: newStatus,
                    signed_at: newSignedAt
                  };
                }
                return r;
              });

              // Self-healing synchronization of onboarding tasks:
              // If employee assignment or e-sign status is modified, update corresponding checklist gates.
              const updatedTasks = onboardingTasks.map(t => {
                if (t.requires_esign) {
                  if (t.instance_id === oldEmpId) {
                    const otherSignedForOld = updatedEsigns.some(r => r.employee_id === oldEmpId && r.status === 'signed');
                    return {
                      ...t,
                      status: otherSignedForOld ? 'completed' : 'pending',
                      completed_at: otherSignedForOld ? t.completed_at : null
                    };
                  }
                  if (t.instance_id === newEmpId) {
                    const isSigned = editStatus === 'signed';
                    return {
                      ...t,
                      status: isSigned ? 'completed' : 'pending',
                      completed_at: isSigned ? (t.completed_at || new Date().toISOString().split('T')[0]) : null
                    };
                  }
                }
                return t;
              });

              onUpdateDb({
                ...db,
                esignRequests: updatedEsigns,
                onboardingTasks: updatedTasks
              });

              setEditingEsign(null);
              notify('E-Sign request and onboarding status synchronized successfully.');
            }} 
            className="card" 
            style={{ width: '460px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-blue)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📝 Edit E-Sign Request
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setEditingEsign(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Employee</label>
                <select 
                  value={editEmpId} 
                  onChange={(e) => setEditEmpId(Number(e.target.value))} 
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                >
                  {activeProbationers.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.emp_id})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Agreement Document Name</label>
                <input 
                  type="text" 
                  value={editDocName} 
                  onChange={(e) => setEditDocName(e.target.value)} 
                  required 
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sent Timestamp</label>
                <input 
                  type="datetime-local" 
                  value={editSentAt} 
                  onChange={(e) => setEditSentAt(e.target.value)} 
                  required 
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</label>
                <select 
                  value={editStatus} 
                  onChange={(e) => setEditStatus(e.target.value)} 
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="pending">pending</option>
                  <option value="signed">signed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setEditingEsign(null)}>Cancel</button>
              <button 
                type="submit"
                style={{ backgroundColor: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 7. ATTENDANCE VIEW
