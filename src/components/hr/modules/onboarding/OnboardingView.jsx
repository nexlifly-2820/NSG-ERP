import React, { useState } from 'react';
import { Trash2, Edit } from 'lucide-react';

export function OnboardingView({ db, onUpdateDb, queryParams, setQueryParams }) {
  const onboardingTab = queryParams?.get('subTab') || 'active';
  const setOnboardingTab = (val) => setQueryParams({ subTab: val });

  const empIdStr = queryParams?.get('empId');
  const selectedInstance = empIdStr ? db.employees.find(e => String(e.id) === empIdStr) : null;
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

  // Asset Allocation State
  const [allocatingAsset, setAllocatingAsset] = useState(null); // task object
  const [laptopModel, setLaptopModel] = useState('MacBook Pro M3 Max (16")');
  const [serialNumber, setSerialNumber] = useState('NSG-HW-73942');
  const [allocatedMonitors, setAllocatedMonitors] = useState('Dual 27" Dell UltraSharp 4K');

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

  // Auto-seed missing onboarding tasks/progress/esign for any employee in probation (Self-Healing)
  React.useEffect(() => {
    if (!db) return;
    
    const probationers = db.employees.filter(e => e.status === 'probation');
    const existingTasks = db.onboardingTasks || [];
    let needsUpdate = false;
    let updatedTasks = [...existingTasks];
    let updatedProgress = [...(db.trainingProgress || [])];
    let updatedEsigns = [...(db.esignRequests || [])];

    probationers.forEach(emp => {
      const hasTasks = existingTasks.some(t => t.instance_id === emp.id);
      if (!hasTasks) {
        needsUpdate = true;
        const newTasks = [
          { id: Date.now() + emp.id + 1, instance_id: emp.id, task_name: 'Workstation Setup & Laptop Provisioning', assigned_to: 'IT', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: true, requires_esign: false, completed_at: null, status: 'pending' },
          { id: Date.now() + emp.id + 2, instance_id: emp.id, task_name: 'Provision System Logins & Email', assigned_to: 'IT', due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: true, requires_esign: false, completed_at: null, status: 'pending' },
          { id: Date.now() + emp.id + 3, instance_id: emp.id, task_name: 'Mandatory NDA Policy E-Sign', assigned_to: 'Employee', due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: true, requires_esign: true, completed_at: null, status: 'pending' },
          { id: Date.now() + emp.id + 4, instance_id: emp.id, task_name: 'Complete Compliance Induction Quiz', assigned_to: 'Employee', due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: true, requires_esign: false, completed_at: null, status: 'pending' },
          { id: Date.now() + emp.id + 5, instance_id: emp.id, task_name: 'Welcome Kit & Access Badge Handover', assigned_to: 'HR', due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], is_mandatory: false, requires_esign: false, completed_at: null, status: 'pending' }
        ];
        updatedTasks = [...updatedTasks, ...newTasks];

        const hasProgress = updatedProgress.some(p => p.employee_id === emp.id);
        if (!hasProgress) {
          updatedProgress.push({
            id: Date.now() + emp.id + 6,
            employee_id: emp.id,
            track_id: 1,
            completed_modules: 0,
            quiz_score: 0,
            passed: false
          });
        }

        const hasEsign = updatedEsigns.some(r => r.employee_id === emp.id);
        if (!hasEsign) {
          updatedEsigns.push({
            id: Date.now() + emp.id + 7,
            employee_id: emp.id,
            document_name: 'Mandatory NDA Policy Handbook',
            status: 'pending',
            sent_at: new Date().toISOString(),
            signed_at: null
          });
        }
      }
    });

    if (needsUpdate) {
      onUpdateDb({
        ...db,
        onboardingTasks: updatedTasks,
        trainingProgress: updatedProgress,
        esignRequests: updatedEsigns
      });
    }
  }, [db, onUpdateDb]);

  const activeProbationers = db.employees.filter(e => e.status === 'probation');
  const onboardingTasks = db.onboardingTasks || [
    { id: 1, instance_id: 104, task_name: 'Workstation Setup & Laptop Provisioning', assigned_to: 'IT', due_date: '2026-04-17', is_mandatory: true, requires_esign: false, completed_at: '2026-04-16', status: 'completed' },
    { id: 2, instance_id: 104, task_name: 'Provision System Logins & Email', assigned_to: 'IT', due_date: '2026-04-16', is_mandatory: true, requires_esign: false, completed_at: '2026-04-16', status: 'completed' },
    { id: 3, instance_id: 104, task_name: 'Mandatory NDA Policy E-Sign', assigned_to: 'Employee', due_date: '2026-04-18', is_mandatory: true, requires_esign: true, completed_at: null, status: 'pending' },
    { id: 4, instance_id: 104, task_name: 'Complete Compliance Induction Quiz', assigned_to: 'Employee', due_date: '2026-04-20', is_mandatory: true, requires_esign: false, completed_at: null, status: 'pending' },
    { id: 5, instance_id: 104, task_name: 'Welcome Kit & Access Badge Handover', assigned_to: 'HR', due_date: '2026-04-17', is_mandatory: false, requires_esign: false, completed_at: '2026-04-17', status: 'completed' }
  ];

  const esignRequests = db.esignRequests || [
    { id: 1, employee_id: 104, document_name: 'Mandatory NDA Policy Handbook', status: 'pending', sent_at: '2026-04-15T10:00:00Z', signed_at: null }
  ];

  const templates = db.onboardingTemplates || [
    { id: 1, name: 'NSG Corporate Onboarding Template', tasks: [
      { name: 'Workstation Setup & Laptop Provisioning', role: 'IT', offset: 2, mandatory: true, esign: false },
      { name: 'Provision System Logins & Email', role: 'IT', offset: 1, mandatory: true, esign: false },
      { name: 'Mandatory NDA Policy E-Sign', role: 'Employee', offset: 3, mandatory: true, esign: true },
      { name: 'Complete Compliance Induction Quiz', role: 'Employee', offset: 5, mandatory: true, esign: false }
    ]}
  ];

  const handleToggleTask = (taskId) => {
    const updatedTasks = onboardingTasks.map(t => {
      if (t.id === taskId) {
        const isCompleting = t.status !== 'completed';
        return {
          ...t,
          status: isCompleting ? 'completed' : 'pending',
          completed_at: isCompleting ? new Date().toISOString().split('T')[0] : null
        };
      }
      return t;
    });

    // Enforce L&D state auto completion if compliance quiz is checked
    const clickedTask = onboardingTasks.find(t => t.id === taskId);
    let updatedTrainingProgress = db.trainingProgress;
    if (clickedTask && clickedTask.task_name.includes('Compliance Induction Quiz')) {
      const isCompleting = clickedTask.status !== 'completed';
      updatedTrainingProgress = db.trainingProgress?.map(p => {
        if (p.employee_id === clickedTask.instance_id) {
          return {
            ...p,
            passed: isCompleting,
            completed_modules: isCompleting ? 2 : 0,
            quiz_score: isCompleting ? 90 : 0
          };
        }
        return p;
      });
    }

    onUpdateDb({
      ...db,
      onboardingTasks: updatedTasks,
      trainingProgress: updatedTrainingProgress
    });
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
    alert('Task successfully enqueued to onboarding template flow builder.');
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

  const handleSimulateEsign = (requestId) => {
    const request = esignRequests.find(r => r.id === requestId);
    if (!request) return;

    const updatedEsigns = esignRequests.map(r => {
      if (r.id === requestId) {
        return { ...r, status: 'signed', signed_at: new Date().toISOString() };
      }
      return r;
    });

    const updatedTasks = onboardingTasks.map(t => {
      if (t.instance_id === request.employee_id && t.requires_esign) {
        return {
          ...t,
          status: 'completed',
          completed_at: new Date().toISOString().split('T')[0]
        };
      }
      return t;
    });

    onUpdateDb({
      ...db,
      esignRequests: updatedEsigns,
      onboardingTasks: updatedTasks
    });

    alert('Simulation: Employee e-signed document via OTP secure portal. Onboarding task updated.');
  };

  const handleSendEsignRequest = (emp) => {
    const newRequest = {
      id: +new Date(),
      employee_id: emp.id,
      document_name: 'Mandatory NDA Policy Handbook',
      status: 'pending',
      sent_at: new Date().toISOString(),
      signed_at: null
    };

    onUpdateDb({
      ...db,
      esignRequests: [...esignRequests, newRequest]
    });

    alert(`E-signature request for NDA Policy dispatched to ${emp.name} email queue.`);
  };

  const handleSendOverdueReminder = (task) => {
    alert(`Slack & Email alert triggered to Assignee: [${task.assigned_to}] for task: [${task.task_name}]`);
  };

  const handleDeleteEsign = (requestId) => {
    if (!window.confirm('Are you sure you want to void and delete this E-Signature request?')) return;
    const updatedEsigns = esignRequests.filter(r => r.id !== requestId);
    onUpdateDb({
      ...db,
      esignRequests: updatedEsigns
    });
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
          <h1>Active Onboarding Workspace</h1>
          <p>Supervise task checklist progressions, workstation allocations, and signed induction credentials.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { id: 'active', label: 'Active Checklists' },
            { id: 'templates', label: 'Template Builder' },
            { id: 'overdue', label: 'Overdue Alerts' },
            { id: 'esign', label: 'E-Sign Portal' }
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

        {onboardingTab === 'templates' && (
          <button
            onClick={() => setIsAddTaskOpen(true)}
            className="print-btn"
            style={{
              backgroundColor: 'var(--accent-pink)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            ➕ Add Task Flow
          </button>
        )}
      </div>

      {onboardingTab === 'active' && (
        <div className="metrics-grid">
          {activeProbationers.map(emp => {
            const empTasks = onboardingTasks.filter(t => t.instance_id === emp.id);
            const totalTasks = empTasks.length || 5;
            const completedTasks = empTasks.filter(t => t.status === 'completed').length;
            const pct = Math.floor((completedTasks / totalTasks) * 100);
            const nextTaskObj = empTasks.find(t => t.status !== 'completed');
            const nextTask = nextTaskObj ? nextTaskObj.task_name : 'All Onboarding Tasks Complete';

            return (
              <div key={emp.id} className="card" style={{ borderLeft: '4px solid var(--accent-pink)' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                  <img src={emp.photo} alt={emp.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ margin: 0 }}>{emp.name}</h4>
                    <span className="code-span" style={{ fontSize: '10px' }}>{emp.emp_id}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '12px' }}>
                      <span>Checklist Completion:</span>
                      <strong>{pct}% ({completedTasks}/{totalTasks})</strong>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--accent-pink)' }}></div>
                    </div>
                  </div>

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

                  <button
                    className="print-btn"
                    style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                    onClick={() => setSelectedInstance(emp)}
                  >
                    View Checklist Details
                  </button>
                </div>
              </div>
            );
          })}

          {activeProbationers.length === 0 && (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: 'span 3', padding: '32px' }}>No active hires enqueued under probation checklists.</p>
          )}
        </div>
      )}

      {onboardingTab === 'templates' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active tasks in general template */}
          <div className="table-container" style={{ margin: 0, width: '100%', overflowX: 'auto' }}>
            <div className="pipeline-title" style={{ padding: '16px 16px 0 16px' }}>Corporate Onboarding General Template Task Roster</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ padding: '16px 24px' }}>Task Name</th>
                  <th style={{ padding: '16px 24px' }}>Assigned to Role</th>
                  <th style={{ padding: '16px 24px' }}>Due Day Offset</th>
                  <th style={{ padding: '16px 24px' }}>Mandatory</th>
                  <th style={{ padding: '16px 24px' }}>Requires E-Sign</th>
                  <th style={{ padding: '16px 24px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {templates[0].tasks.map((tk, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '16px 24px' }}><strong>{tk.name}</strong></td>
                    <td style={{ padding: '16px 24px' }}><span className="badge-pill bg-blue">{tk.role}</span></td>
                    <td style={{ padding: '16px 24px' }}>Day +{tk.offset}</td>
                    <td style={{ padding: '16px 24px' }}>{tk.mandatory ? 'Yes ✓' : 'Optional'}</td>
                    <td style={{ padding: '16px 24px' }}>{tk.esign ? 'E-Sign Required' : 'No'}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <button
                        onClick={() => handleDeleteTemplateTask(tk.name)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {onboardingTab === 'overdue' && (
        <div className="table-container">
          <div className="pipeline-title" style={{ padding: '16px 16px 0 16px' }}>Onboarding Overdue Escalations Watchdog</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 24px' }}>Employee</th>
                <th style={{ padding: '16px 24px' }}>Task Name</th>
                <th style={{ padding: '16px 24px' }}>Assigned To Role</th>
                <th style={{ padding: '16px 24px' }}>Due Date</th>
                <th style={{ padding: '16px 24px' }}>Status</th>
                <th style={{ padding: '16px 24px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {overdueTasks.map(t => {
                const emp = db.employees.find(e => e.id === t.instance_id) || { name: 'Unknown' };
                return (
                  <tr key={t.id}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={emp.photo} alt={emp.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                        <strong>{emp.name}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>{t.task_name}</td>
                    <td style={{ padding: '16px 24px' }}><span className="badge-pill bg-pink">{t.assigned_to}</span></td>
                    <td style={{ padding: '16px 24px' }}><span style={{ color: 'red', fontWeight: 'bold' }}>{t.due_date} (Overdue)</span></td>
                    <td style={{ padding: '16px 24px' }}><span className="badge-pill danger">Overdue SLA</span></td>
                    <td style={{ padding: '16px 24px' }}>
                      <button
                        className="print-btn"
                        style={{ padding: '4px 8px', fontSize: '10px' }}
                        onClick={() => handleSendOverdueReminder(t)}
                      >
                        Send Alert Reminder
                      </button>
                    </td>
                  </tr>
                );
              })}
              {overdueTasks.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>No onboarding tasks are currently overdue. SLA compliant ✓</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {onboardingTab === 'esign' && (
        <div className="table-container">
          <div className="pipeline-title" style={{ padding: '16px 16px 0 16px' }}>Digital Document E-Signature Secure Portal</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 24px' }}>Employee</th>
                <th style={{ padding: '16px 24px' }}>Agreement Document Name</th>
                <th style={{ padding: '16px 24px' }}>Sent Timestamp</th>
                <th style={{ padding: '16px 24px' }}>Status</th>
                <th style={{ padding: '16px 24px' }}>Actions</th>
                <th style={{ padding: '16px 24px' }}>Manage</th>
              </tr>
            </thead>
            <tbody>
              {esignRequests.map(req => {
                const emp = db.employees.find(e => e.id === req.employee_id) || { name: 'Unknown' };
                return (
                  <tr key={req.id}>
                    <td style={{ padding: '16px 24px' }}><strong>{emp.name}</strong></td>
                    <td style={{ padding: '16px 24px' }}>
                      <span 
                        style={{ textDecoration: 'underline', color: 'var(--accent-pink)', cursor: req.status === 'pending' ? 'pointer' : 'default' }}
                        onClick={() => req.status === 'pending' && setActiveDocPreview(req)}
                      >
                        {req.document_name}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{new Date(req.sent_at).toLocaleString()}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge-pill ${req.status === 'signed' ? 'badge-green' : 'badge-gold'}`}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="print-btn"
                            style={{ padding: '4px 8px', fontSize: '10px' }}
                            onClick={() => alert(`Resent NDA document signature request to ${emp.name}`)}
                          >
                            Resend Link
                          </button>
                          <button
                            className="print-btn"
                            style={{ padding: '4px 8px', fontSize: '10px', backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none' }}
                            onClick={() => {
                              setActiveDocPreview(req);
                              setTypedSignature(emp.name);
                            }}
                          >
                            ✍️ Secure Sign
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Completed on {new Date(req.signed_at).toLocaleDateString()}</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            setEditingEsign(req);
                            setEditDocName(req.document_name);
                            setEditEmpId(req.employee_id);
                            
                            // Format sent_at for datetime-local (YYYY-MM-DDTHH:MM local time representation)
                            const dateObj = new Date(req.sent_at || Date.now());
                            const tzOffset = dateObj.getTimezoneOffset() * 60000;
                            const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
                            setEditSentAt(localISOTime);
                            
                            setEditStatus(req.status || 'pending');
                          }}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                          title="Edit E-Sign Request"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteEsign(req.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                          title="Void & Delete Request"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Onboarding instance detailed tasks checklist modal */}
      {selectedInstance && (() => {
        const empTasks = onboardingTasks.filter(t => t.instance_id === selectedInstance.id);
        const hasEsign = esignRequests.some(r => r.employee_id === selectedInstance.id && r.status === 'pending');
        
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className="card" style={{ width: '550px', maxHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <img src={selectedInstance.photo} alt={selectedInstance.name} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                  <div>
                    <h3 style={{ margin: 0, border: 'none', padding: 0 }}>Onboarding Checklist — {selectedInstance.name}</h3>
                    <span className="code-span" style={{ fontSize: '10px' }}>{selectedInstance.emp_id}</span>
                  </div>
                </div>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '18px' }} onClick={() => setSelectedInstance(null)}>✕</button>
              </div>

              <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '8px 0', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
                {empTasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', justify: 'space-between', backgroundColor: 'var(--bg-tertiary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        checked={t.status === 'completed'}
                        onChange={() => handleToggleTask(t.id)}
                        disabled={(t.requires_esign && hasEsign) || t.task_name.includes('Workstation Setup')}
                        style={{ width: '18px', height: '18px', cursor: ((t.requires_esign && hasEsign) || t.task_name.includes('Workstation Setup')) ? 'not-allowed' : 'pointer' }}
                      />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{t.task_name}</div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Assigned to: {t.assigned_to} | Due by: {t.due_date}</span>
                      </div>
                    </div>
                    <div>
                      {t.task_name.includes('Workstation Setup') ? (
                        t.status === 'completed' ? (
                          <span style={{ color: 'var(--accent-green)', fontSize: '11.5px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            💻 Configured ✓
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setAllocatingAsset(t);
                              setSerialNumber('NSG-HW-' + Math.floor(10000 + Math.random() * 90000));
                            }}
                            style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--accent-blue)', border: '1px solid var(--accent-blue)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}
                          >
                            💻 Allocate Asset
                          </button>
                        )
                      ) : (
                        t.requires_esign ? (
                          hasEsign ? (
                            <button
                              onClick={() => { setOnboardingTab('esign'); setSelectedInstance(null); }}
                              style={{ backgroundColor: 'rgba(236,72,153,0.1)', color: 'var(--accent-pink)', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                            >
                              Sign Needed
                            </button>
                          ) : (
                            <span style={{ color: 'var(--accent-green)', fontSize: '11px', fontWeight: 'bold' }}>Signed ✓</span>
                          )
                        ) : (
                          <span className={`badge-pill ${t.status === 'completed' ? 'badge-green' : 'badge-gold'}`}>{t.status}</span>
                        )
                      )}
                    </div>
                  </div>
                ))}

                {empTasks.some(t => t.requires_esign && t.status !== 'completed') && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(236,72,153,0.05)', border: '1px dashed var(--accent-pink)', padding: '10px', borderRadius: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>NDA document must be e-signed to complete that task.</span>
                    <button
                      onClick={() => handleSendEsignRequest(selectedInstance)}
                      style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      Send E-Sign Request
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px', flexShrink: 0 }}>
                <button className="print-btn" onClick={() => setSelectedInstance(null)}>Close View</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 💻 IT ASSET CUSTODY ALLOCATOR OVERLAY */}
      {allocatingAsset && (() => {
        const emp = db.employees.find(e => e.id === allocatingAsset.instance_id) || { name: 'Employee' };
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <div className="card" style={{ width: '460px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  💻 Asset Configuration Custody
                </h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setAllocatingAsset(null)}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Target Employee</span>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-primary)' }}>{emp.name} ({emp.designation})</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Laptop Hardware Class</label>
                  <select value={laptopModel} onChange={(e) => setLaptopModel(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px', outline: 'none' }}>
                    <option value='MacBook Pro M3 Max (16")'>MacBook Pro M3 Max (16") - Space Black</option>
                    <option value='MacBook Air M3 (15")'>MacBook Air M3 (15") - Midnight</option>
                    <option value='Lenovo ThinkPad X1 Carbon Gen 12'>Lenovo ThinkPad X1 Carbon Gen 12 - Core Ultra 7</option>
                    <option value='Dell XPS 15 9530 Developer Edition'>Dell XPS 15 9530 Developer Edition - Ubuntu LTS</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Auto-Generated Serial Number</label>
                  <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px', outline: 'none', fontFamily: 'var(--font-mono)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Secondary Display Monitor Allocation</label>
                  <select value={allocatedMonitors} onChange={(e) => setAllocatedMonitors(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px', outline: 'none' }}>
                    <option value='Dual 27" Dell UltraSharp 4K'>Dual 27" Dell UltraSharp 4K Display (Dual U2723QE)</option>
                    <option value='Single 34" LG UltraWide QHD Curved'>Single 34" LG UltraWide QHD Curved Display (34WP65G)</option>
                    <option value='No External Monitor - Single Laptop Console'>No External Monitor - Single Laptop Console</option>
                  </select>
                </div>

                <div style={{ backgroundColor: 'rgba(59,130,246,0.05)', border: '1px dashed var(--accent-blue)', borderRadius: '10px', padding: '12px', fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <strong>🔒 Simulated IT Setup Inductions:</strong>
                  <span>Auto-enrolling MAC Address, provisioning Corporate LDAP, setting up SentinelOne Active Watchdog, and configuring VPN profile configs.</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
                <button style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setAllocatingAsset(null)}>Cancel</button>
                <button 
                  type="button"
                  style={{ backgroundColor: 'var(--accent-blue)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                  onClick={() => {
                    handleToggleTask(allocatingAsset.id);
                    alert(`IT Equipment Allocated Successfully!\n\nSystem: ${laptopModel}\nSerial: ${serialNumber}\nScreen: ${allocatedMonitors}\n\nLDAP logins and security policies provisioned and sent to IT logistics.`);
                    setAllocatingAsset(null);
                  }}
                >
                  Allocate Hardware &amp; Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 📄 INTERACTIVE DIGITAL E-SIGN CONTRACT STAMPER */}
      {activeDocPreview && (() => {
        const emp = db.employees.find(e => e.id === activeDocPreview.employee_id) || { name: 'Employee' };
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
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
                            alert('Invalid validation OTP code! Please type "9432" to simulate.');
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

      {/* ➕ ADD TASK FLOW BUILDER MODAL */}
      {isAddTaskOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <form 
            onSubmit={(e) => {
              handleCreateTemplateTask(e);
              setIsAddTaskOpen(false);
            }} 
            className="card" 
            style={{ width: '460px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ➕ Add Task Flow Builder
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setIsAddTaskOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Task Description Name</label>
                <input type="text" value={taskName} onChange={(e) => setTaskName(e.target.value)} required placeholder="Setup Slack logins..." style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Assigned To Role</label>
                <select value={taskRole} onChange={(e) => setTaskRole(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}>
                  <option value="Employee">Employee (ESS)</option>
                  <option value="IT">IT Department</option>
                  <option value="HR">HR Manager</option>
                  <option value="TL">Team Lead (TL)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Due Offset (Days from Joining)</label>
                <input type="number" value={taskOffset} onChange={(e) => setTaskOffset(Number(e.target.value))} required min={0} max={30} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', gap: '20px', marginTop: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Mandatory Task
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={requiresEsign} onChange={(e) => setRequiresEsign(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  Requires E-Sign
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setIsAddTaskOpen(false)}>Cancel</button>
              <button 
                type="submit"
                style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Add Task to Template
              </button>
            </div>
          </form>
        </div>
      )}

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
              alert('E-Sign request and onboarding status synchronized successfully.');
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
