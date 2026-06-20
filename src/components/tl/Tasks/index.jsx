import React, { useState, useRef } from 'react';
import useSWR from 'swr';
import AvatarFallback from '../../common/AvatarFallback';
import styles from './tasks.module.css';
import { PlusSquare, List, XCircle, GitPullRequest, Edit, UserPlus, RotateCcw, Check, X } from 'lucide-react';

export default function Tasks({ currentUser }) {
  const [activeView, setActiveView] = useState('create'); // 'create', 'list', 'rejected', 'pr'
  const previousViewRef = useRef('list'); // ref so async closures always read the latest value
  const [subtasks, setSubtasks] = useState(['']);
  const [groupBy, setGroupBy] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

  const { data: teamMembers = [], mutate: mutateTeam } = useSWR('/api/team-lead/team-members', fetcher);
  const { data: tasks = [], mutate: mutateTasks } = useSWR('/api/team-lead/tasks', fetcher);
  const { data: projectsData = [], mutate: mutateProjects } = useSWR('/api/team-lead/projects', fetcher);
  const { data: backendSprints } = useSWR('/api/team-lead/sprints', fetcher);

  const savedSprints = (() => {
    if (backendSprints && backendSprints.length > 0) {
      return backendSprints;
    }
    const local = localStorage.getItem('nsg_saved_sprints');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.length > 0) return parsed;
    }
    return [];
  })();

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPoints, setTaskPoints] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskProject, setTaskProject] = useState('');
  const [taskProjectId, setTaskProjectId] = useState(null);
  const [taskSprint, setTaskSprint] = useState('');
  const [taskAcceptance, setTaskAcceptance] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskAttachments, setTaskAttachments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [statusNotes, setStatusNotes] = useState({});
  const [statusAttachments, setStatusAttachments] = useState({});
  const [customFields, setCustomFields] = useState({});

  const selectedProj = projectsData.find(p => p.id === taskProjectId);
  const targetDept = selectedProj?.department || currentUser?.department || 'IT';
  const { data: schemaData } = useSWR(`/api/team-lead/tasks/schema?department=${targetDept}`, fetcher);
  const schema = schemaData?.schema || [];

  // Do not auto-select first project — let user choose


  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignTaskId, setReassignTaskId] = useState(null);
  const [reassignAssigneeId, setReassignAssigneeId] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTaskId, setRejectTaskId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (taskAttachments.length + files.length > 10) {
      alert("You can upload a maximum of 10 files per task.");
      return;
    }

    setUploading(true);
    const uploaded = [];
    const token = localStorage.getItem('nsg_jwt_token');

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const res = await fetch('/api/team-lead/tasks/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          uploaded.push({ filename: data.filename, file_url: data.file_url });
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error(err);
        alert(`Error uploading ${file.name}`);
      }
    }
    setTaskAttachments(prev => [...prev, ...uploaded]);
    setUploading(false);
  };

  const removeAttachment = (index) => {
    setTaskAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddSubtask = () => setSubtasks([...subtasks, '']);
  const handleRemoveSubtask = (index) => setSubtasks(subtasks.filter((_, i) => i !== index));
  const handleSubtaskChange = (index, value) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  const handleEditTask = (task) => {
    const rawTask = tasks.find(t => t.id === task.id) || task;
    setTaskTitle(rawTask.title);
    setTaskDescription(rawTask.description || '');
    setTaskProject(rawTask.project);
    const matchedProj = projectsData.find(p => p.name === rawTask.project);
    setTaskProjectId(matchedProj ? matchedProj.id : null);
    setTaskSprint(rawTask.sprint);
    // Standardize priority casing
    const originalPriority = rawTask.priority || 'Medium';
    setTaskPriority(originalPriority.charAt(0).toUpperCase() + originalPriority.slice(1));
    setTaskAssignee(rawTask.user_id || '');
    setTaskPoints(rawTask.sp || '');
    setTaskDue(rawTask.due || '');
    setTaskAcceptance(rawTask.acceptance ? rawTask.acceptance.join('\n') : '');
    setSubtasks(rawTask.subtasks && rawTask.subtasks.length > 0 ? rawTask.subtasks.map(s => s.title) : ['']);
    setTaskAttachments(rawTask.attachments || []);
    try {
      const data = rawTask.custom_data ? JSON.parse(rawTask.custom_data) : {};
      setStatusNotes(data.status_notes || {});
      setStatusAttachments(data.status_attachments || {});
      const { status_notes, status_attachments, ...rest } = data;
      setCustomFields(rest);
    } catch(e) {
      setStatusNotes({});
      setStatusAttachments({});
      setCustomFields({});
    }
    setEditingTaskId(rawTask.id);
    previousViewRef.current = activeView; // remember current tab before switching to edit form
    setActiveView('create');
  };

  const handleReassignTask = (taskId) => {
    setReassignTaskId(taskId);
    setReassignAssigneeId('');
    setReassignModalOpen(true);
  };

  const submitReassign = async () => {
    if (!reassignAssigneeId) {
      if (window.toast) window.toast.error("Please select a new assignee");
      return;
    }
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/team-lead/tasks/${reassignTaskId}/reassign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_assignee_id: parseInt(reassignAssigneeId) })
      });
      if (res.ok) {
        if (window.toast) window.toast.success("Task reassigned successfully!");
        setReassignModalOpen(false);
        mutateTasks();
      } else {
        const data = await res.json();
        if (window.toast) window.toast.error(data.detail || "Failed to reassign task");
      }
    } catch (err) { console.error(err); }
  };

  const getStatusLabel = (status) => {
    if (status === 'pending') return 'To Do';
    if (status === 'in-progress') return 'In Progress';
    if (status === 'done') return 'Done';
    if (status === 'blocked') return 'Blocked';
    return status;
  };

  const getAssigneeName = (id) => {
    const member = teamMembers.find(m => m.id === id);
    return member ? member.name : `Unassigned`;
  };

  const getAssigneeAvatar = (name) => {
    if (!name || name === 'Unassigned') return 'UN';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const taskList = tasks
    .filter(t => t.status !== 'done')
    .map(t => ({
      id: t.id,
      project: t.project || 'NSG-ERP Core',
      title: t.title,
      assignee: getAssigneeName(t.user_id),
      avatar: getAssigneeAvatar(getAssigneeName(t.user_id)),
      priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium',
      status: getStatusLabel(t.status),
      points: t.sp || 1,
      due: t.due || 'TBD',
      sprint: t.sprint || 'Backlog'
    }));
  
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if(!taskTitle.trim() || !taskAssignee) {
      alert("Please enter a task title and select an assignee");
      return;
    }
    const priorityVal = taskPriority.toLowerCase();
    let currentCustom = {};
    if (editingTaskId) {
      const existingTask = tasks.find(t => t.id === editingTaskId);
      try {
        currentCustom = existingTask.custom_data ? JSON.parse(existingTask.custom_data) : {};
      } catch(e) {}
    }
    const updatedCustom = {
      ...currentCustom,
      ...customFields,
      status_notes: statusNotes,
      status_attachments: statusAttachments
    };

    const payload = {
      project: taskProject,
      sprint: taskSprint,
      title: taskTitle.trim(),
      description: taskDescription.trim() || 'Created via TL sprint board',
      priority: priorityVal,
      sp: parseInt(taskPoints) || 1,
      due: taskDue || new Date().toISOString().split('T')[0],
      assignee_id: parseInt(taskAssignee),
      subtasks: subtasks.filter(t => t.trim() !== ''),
      acceptance: taskAcceptance.split('\n').map(a => a.trim().replace(/^- /, '')).filter(a => a !== ''),
      attachments: taskAttachments,
      custom_data: JSON.stringify(updatedCustom)
    };
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      let url = '/api/team-lead/tasks';
      let method = 'POST';
      if (editingTaskId) {
        url = `/api/team-lead/tasks/${editingTaskId}`;
        method = 'PATCH';
      }
      const res = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setTaskTitle('');
        setTaskDescription('');
        setTaskAssignee('');
        setTaskPoints('');
        setTaskDue('');
        setTaskAcceptance('');
        setEditingTaskId(null);
        setTaskAttachments([]);
        setStatusNotes({});
        setStatusAttachments({});
        setCustomFields({});
        // Return to the tab the user was on before editing; for new tasks go to list
        setActiveView(editingTaskId ? previousViewRef.current : 'list');
        mutateTasks();
        if (window.toast) window.toast.success(editingTaskId ? "Task updated successfully!" : "Task created successfully!");
        else alert(editingTaskId ? "Task updated successfully!" : "Task created successfully!");
        setSubtasks(['']);
      } else {
        const errorData = await res.json().catch(() => ({ detail: "Unknown error occurred" }));
        console.error("Task creation/update failed:", errorData);
        const errorMsg = errorData.detail 
          ? (typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail)) 
          : "Failed to save task";
        if (window.toast) window.toast.error(errorMsg);
        else alert(errorMsg);
      }
    } catch (e) { 
      console.error(e);
      alert("An error occurred: " + e.message);
    }
  };

  const handleApprovePr = async (taskId) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/team-lead/tasks/${taskId}/approve-pr`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) mutateTasks();
    } catch (e) { console.error(e); }
  };

  const handleRejectPr = (taskId) => {
    setRejectTaskId(taskId);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const submitRejectPr = async () => {
    if (!rejectReason.trim()) {
      if (window.toast) window.toast.error("Please provide a reason.");
      return;
    }
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/team-lead/tasks/${rejectTaskId}/reject-pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: rejectReason })
      });
      if (res.ok) {
        if (window.toast) window.toast.success("PR Rejected successfully.");
        setRejectModalOpen(false);
        mutateTasks();
      }
    } catch (e) { console.error(e); }
  };

  const rejectedTasks = tasks
    .filter(t => t.pr_status === 'rejected' || t.status === 'blocked')
    .map(t => ({
      id: t.id,
      project: t.project || 'NSG-ERP Core',
      title: t.title,
      assignee: getAssigneeName(t.user_id),
      avatar: getAssigneeAvatar(getAssigneeName(t.user_id)),
      priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium',
      status: getStatusLabel(t.status),
      points: t.sp || 1,
      due: t.due || 'TBD',
      reason: t.rejected_reason || 'Rework required.'
    }));

  const prReviews = tasks
    .filter(t => t.pr_status === 'submitted')
    .map(t => ({
      id: t.id,
      title: t.title,
      prUrl: t.pr_url || '#PR',
      author: getAssigneeName(t.user_id),
      due: t.due || 'TBD'
    }));

  const getGroupedTasks = () => {
    const filtered = statusFilter === 'All' ? taskList : taskList.filter(task => {
      if (statusFilter === 'Todo')        return task.status === 'To Do';
      if (statusFilter === 'In-Progress') return task.status === 'In Progress';
      if (statusFilter === 'testing')     return task.status === 'testing';
      if (statusFilter === 'pr')          return task.status === 'pr';
      if (statusFilter === 'Reject')      return task.status === 'Blocked';
      return true;
    });
    if (groupBy === 'None') return { 'All Tasks': filtered };
    return filtered.reduce((acc, task) => {
      let key = 'Other';
      if (groupBy === 'Assignee') key = task.assignee;
      if (groupBy === 'Priority') key = task.priority;
      if (groupBy === 'Sprint') key = task.sprint || 'Backlog'; 
      if (!acc[key]) acc[key] = [];
      acc[key].push(task);
      return acc;
    }, {});
  };

  return (
    <div className={styles.container}>
      <div className={styles.topToolbar}>
        <button className={`${styles.navTab} ${activeView === 'create' ? styles.activeTab : ''}`} onClick={() => setActiveView('create')}>
          <PlusSquare size={16} /> Task Creation Form
        </button>
        <button className={`${styles.navTab} ${activeView === 'list' ? styles.activeTab : ''}`} onClick={() => setActiveView('list')}>
          <List size={16} /> Task List View
        </button>
        <button className={`${styles.navTab} ${activeView === 'todo' ? styles.activeTab : ''}`} onClick={() => setActiveView('todo')}>
          Todo
        </button>
        <button className={`${styles.navTab} ${activeView === 'inprogress' ? styles.activeTab : ''}`} onClick={() => setActiveView('inprogress')}>
          In-Progress
        </button>
        <button className={`${styles.navTab} ${activeView === 'testing' ? styles.activeTab : ''}`} onClick={() => setActiveView('testing')}>
          Testing
        </button>
        <button className={`${styles.navTab} ${activeView === 'rejected' ? styles.activeTab : ''}`} onClick={() => setActiveView('rejected')}>
          Rejected
        </button>
        <button className={`${styles.navTab} ${activeView === 'pr' ? styles.activeTab : ''}`} onClick={() => setActiveView('pr')}>
          PR
        </button>
      </div>

      <div className={styles.viewContainer}>
        {activeView === 'create' && (
          <div>
            <div className={styles.sectionTitle}>Create New Task</div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Task Title</label>
                <input type="text" className={styles.formInput} placeholder="e.g. Build Payment Gateway UI" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Assignee</label>
                <select className={styles.formSelect} value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                  <option value="">Select Team Member...</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.designation})</option>
                  ))}
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Description</label>
                <textarea className={styles.formTextarea} placeholder="Detailed description of the task..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)}></textarea>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Story Points</label>
                <input type="text" className={styles.formInput} placeholder="e.g. 3, 5, 8" value={taskPoints} onChange={(e) => setTaskPoints(e.target.value.replace(/\D/g, ''))} />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Priority</label>
                <select className={styles.formSelect} value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Project</label>
                <select className={styles.formSelect} value={taskProject} onChange={(e) => {
                  const selectedProj = projectsData.find(p => p.name === e.target.value);
                  setTaskProject(e.target.value);
                  setTaskProjectId(selectedProj ? selectedProj.id : null);
                  setTaskSprint('Backlog');
                }}>
                  <option value="">Select Project...</option>
                  {projectsData.map(proj => (
                    <option key={proj.id} value={proj.name}>{proj.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sprint ID</label>
                <select className={styles.formSelect} value={taskSprint} onChange={(e) => setTaskSprint(e.target.value)}>
                  <option value="">Select Sprint ID...</option>
                  {(() => {
                    const filteredSprints = taskProjectId
                      ? savedSprints.filter(s => s.project_id === taskProjectId)
                      : savedSprints;
                    if (filteredSprints.length === 0 && taskProjectId) {
                      return <option disabled value="">No sprints for this project</option>;
                    }
                    return filteredSprints.map(s => (
                      <option key={s.id} value={s.sprintId || s.name}>
                        {s.name} ({s.sprintId || `SPR-${s.id}`})
                      </option>
                    ));
                  })()}
                </select>
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Subtasks</label>
                <div className={styles.subtaskList}>
                  {subtasks.map((subtask, idx) => (
                    <div key={idx} className={styles.subtaskItem}>
                      <input type="text" className={styles.subtaskInput} placeholder={`Subtask ${idx + 1}...`} value={subtask} onChange={(e) => handleSubtaskChange(idx, e.target.value)} />
                      {subtasks.length > 1 && (
                        <button type="button" className={styles.removeSubtaskBtn} onClick={() => handleRemoveSubtask(idx)}>
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className={styles.addSubtaskBtn} onClick={handleAddSubtask}>
                    <PlusSquare size={14} /> Add Subtask
                  </button>
                </div>
              </div>
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Acceptance Criteria</label>
                <textarea className={styles.formTextarea} placeholder="- Given... When... Then..." value={taskAcceptance} onChange={(e) => setTaskAcceptance(e.target.value)}></textarea>
              </div>

              {/* Dynamic Schema Fields */}
              {schema && schema.length > 0 && schema.map(field => {
                const isFile = field.type === 'file';
                const fileUrls = Array.isArray(customFields[field.name]) ? customFields[field.name] : [];

                return (
                  <div key={field.name} className={`${styles.formGroup} ${field.type === 'textarea' || isFile ? styles.fullWidth : ''}`}>
                    <label className={styles.formLabel}>{field.label}</label>
                    {isFile ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {fileUrls.map((file, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid var(--border-card)' }}>
                              <a
                                href={file.file_url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', color: 'var(--primary)' }}
                              >
                                {file.filename}
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  setCustomFields(prev => ({
                                    ...prev,
                                    [field.name]: fileUrls.filter((_, i) => i !== idx)
                                  }));
                                }}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        <input
                          type="file"
                          multiple
                          id={`tl-custom-upload-${field.name}`}
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const files = Array.from(e.target.files);
                            if (files.length === 0) return;
                            const token = localStorage.getItem('nsg_jwt_token');
                            const uploaded = [...fileUrls];
                            for (const f of files) {
                              const formData = new FormData();
                              formData.append('file', f);
                              try {
                                const res = await fetch('/api/team-lead/tasks/upload', {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${token}` },
                                  body: formData
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  uploaded.push({ filename: data.filename, file_url: data.file_url });
                                } else {
                                  alert(`Failed to upload ${f.name}`);
                                }
                              } catch (err) {
                                console.error(err);
                                alert(`Error uploading ${f.name}`);
                              }
                            }
                            setCustomFields(prev => ({ ...prev, [field.name]: uploaded }));
                          }}
                        />
                        <label htmlFor={`tl-custom-upload-${field.name}`} className={styles.addSubtaskBtn} style={{ cursor: 'pointer', margin: 0, alignSelf: 'flex-start' }}>
                          Choose Files
                        </label>
                      </div>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        className={styles.formTextarea}
                        value={customFields[field.name] || ''}
                        onChange={(e) => setCustomFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                      ></textarea>
                    ) : (
                      <input
                        type={field.type}
                        className={styles.formInput}
                        value={customFields[field.name] || ''}
                        onChange={(e) => setCustomFields(prev => ({ ...prev, [field.name]: e.target.value }))}
                      />
                    )}
                  </div>
                );
              })}

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Requirement Attachments (Images, PDFs, Docs, Text - Up to 10 files)</label>
                <input
                  type="file"
                  multiple
                  disabled={uploading}
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                  id="tl-task-file-input"
                />
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="tl-task-file-input" className={styles.addSubtaskBtn} style={{ cursor: 'pointer', margin: 0 }}>
                    {uploading ? 'Uploading...' : 'Choose Files'}
                  </label>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {taskAttachments.length} / 10 files uploaded
                  </span>
                </div>
                {taskAttachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                    {taskAttachments.map((file, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '4px', backgroundColor: '#f1f5f9', border: '1px solid var(--border-card)' }}>
                        <a
                          href={file.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', color: 'var(--primary)' }}
                        >
                          {file.filename}
                        </a>
                        <button type="button" onClick={() => removeAttachment(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {editingTaskId && (
                <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '20px', borderTop: '1px solid var(--border-card)', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'var(--text-main)' }}>Status Descriptions & Phase Attachments</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {['pending', 'in-progress', 'testing', 'pr', 'blocked'].map(stKey => {
                      const label = {
                        'pending': 'Todo',
                        'in-progress': 'In-Progress',
                        'testing': 'Testing',
                        'pr': 'PR',
                        'blocked': 'Reject / Blocked'
                      }[stKey];

                      return (
                        <div key={stKey} style={{ border: '1px solid var(--border-card)', borderRadius: '8px', padding: '16px', backgroundColor: '#f8fafc' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>{label} Phase</h4>
                          
                          {/* Notes */}
                          <div className={styles.formGroup} style={{ marginBottom: '12px' }}>
                            <label className={styles.formLabel}>Notes</label>
                            <textarea
                              className={styles.formTextarea}
                              placeholder={`Enter notes for ${label} status...`}
                              value={statusNotes[stKey] || (stKey === 'pending' ? statusNotes['todo'] : stKey === 'blocked' ? statusNotes['reject'] : '') || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setStatusNotes(prev => {
                                  const updated = { ...prev, [stKey]: val };
                                  if (stKey === 'pending') updated.todo = val;
                                  if (stKey === 'blocked') updated.reject = val;
                                  return updated;
                                });
                              }}
                            />
                          </div>

                          {/* Attachments */}
                          <div className={styles.formGroup}>
                            <label className={styles.formLabel}>Attachments ({(statusAttachments[stKey] || []).length} / 10)</label>
                            
                            {/* File List */}
                            {(statusAttachments[stKey] || []).length > 0 && (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                                {(statusAttachments[stKey] || []).map((file, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '4px', backgroundColor: '#fff', border: '1px solid var(--border-card)' }}>
                                    <a
                                      href={file.file_url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'none', color: 'var(--primary)' }}
                                    >
                                      {file.filename}
                                    </a>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setStatusAttachments(prev => {
                                          const currentList = prev[stKey] || [];
                                          const updatedList = currentList.filter((_, i) => i !== idx);
                                          return { ...prev, [stKey]: updatedList };
                                        });
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Uploader */}
                            <input
                              type="file"
                              multiple
                              id={`tl-upload-${stKey}`}
                              style={{ display: 'none' }}
                              onChange={async (e) => {
                                const files = Array.from(e.target.files);
                                if (files.length === 0) return;
                                
                                const currentList = statusAttachments[stKey] || [];
                                if (currentList.length + files.length > 10) {
                                  alert("You can upload a maximum of 10 files per status.");
                                  return;
                                }

                                const token = localStorage.getItem('nsg_jwt_token');
                                const uploaded = [...currentList];

                                for (const file of files) {
                                  const formData = new FormData();
                                  formData.append('file', file);
                                  try {
                                    const res = await fetch('/api/team-lead/tasks/upload', {
                                      method: 'POST',
                                      headers: { 'Authorization': `Bearer ${token}` },
                                      body: formData
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      uploaded.push({ filename: data.filename, file_url: data.file_url });
                                    } else {
                                      alert(`Failed to upload ${file.name}`);
                                    }
                                  } catch (err) {
                                    console.error(err);
                                    alert(`Error uploading ${file.name}`);
                                  }
                                }

                                setStatusAttachments(prev => ({
                                  ...prev,
                                  [stKey]: uploaded
                                }));
                              }}
                            />
                            <label htmlFor={`tl-upload-${stKey}`} className={styles.addSubtaskBtn} style={{ cursor: 'pointer', margin: 0, padding: '6px 12px', fontSize: '0.75rem', alignSelf: 'flex-start' }}>
                              📎 Add Attachment
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button className={styles.submitBtn} style={{ marginTop: 0 }} onClick={handleCreateTask}>{editingTaskId ? "Update Task" : "Create Task"}</button>
                {editingTaskId && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    style={{ height: '48px', padding: '0 24px' }}
                    onClick={() => {
                      setEditingTaskId(null);
                      setTaskTitle('');
                      setTaskDescription('');
                      setTaskAssignee('');
                      setTaskPoints('');
                      setTaskDue('');
                      setTaskAcceptance('');
                      setTaskAttachments([]);
                      setStatusNotes({});
                      setStatusAttachments({});
                      setCustomFields({});
                      setSubtasks(['']);
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeView === 'list' || activeView === 'todo' || activeView === 'inprogress' || activeView === 'testing' || activeView === 'rejected' || activeView === 'pr') && (() => {
          const statusTitles = {
            list:       'Sprint Backlog Overview — All Tasks',
            todo:       'Todo Tasks',
            inprogress: 'In-Progress Tasks',
            testing:    'Testing Tasks',
            rejected:   'Rejected / Requires Rework',
            pr:         'PR Review'
          };

          // Filter tasks per active tab
          const baseList =
            activeView === 'todo'       ? taskList.filter(t => t.status === 'To Do')
            : activeView === 'inprogress' ? taskList.filter(t => t.status === 'In Progress')
            : activeView === 'testing'    ? taskList.filter(t => t.status === 'testing')
            : activeView === 'rejected'   ? taskList.filter(t => t.status === 'Blocked')
            : activeView === 'pr'         ? taskList.filter(t => t.status === 'pr')
            : taskList; // 'list' = All

          // Extra group-by filter only for the 'All' list view
          const applyGroupFilter = (list) => {
            if (activeView !== 'list') return list;
            if (groupBy === 'Todo')        return list.filter(t => t.status === 'To Do');
            if (groupBy === 'In-Progress') return list.filter(t => t.status === 'In Progress');
            if (groupBy === 'Testing')     return list.filter(t => t.status === 'testing');
            if (groupBy === 'Rejected')    return list.filter(t => t.status === 'Blocked');
            if (groupBy === 'PR')          return list.filter(t => t.status === 'pr');
            return list;
          };

          const viewFilteredList = applyGroupFilter(baseList);

          // Status badge style helper
          const getStatusBadgeStyle = (status) => {
            if (status === 'To Do')      return { background: '#e0f2fe', color: '#0369a1' };
            if (status === 'In Progress') return { background: '#ede9fe', color: '#7c3aed' };
            if (status === 'testing')    return { background: '#fef9c3', color: '#854d0e' };
            if (status === 'Blocked')    return { background: '#fee2e2', color: '#ef4444' };
            if (status === 'pr')         return { background: '#dcfce7', color: '#166534' };
            return { background: '#f1f5f9', color: '#475569' };
          };

          return (
            <div>
              <div className={styles.sectionTitle}>
                <span>{statusTitles[activeView]}</span>
                {activeView === 'list' && (
                  <div className={styles.groupControl}>
                    <label className={styles.formLabel} style={{marginBottom: 0}}>Filter:</label>
                    <select className={styles.groupSelect} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                      <option value="All">All</option>
                      <option value="Todo">Todo</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Testing">Testing</option>
                      <option value="Rejected">Rejected</option>
                      <option value="PR">PR</option>
                    </select>
                  </div>
                )}
              </div>
              <div className={styles.dataTableWrapper}>
                <table className={styles.dataTable}>
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Task Title</th>
                      <th>Assignee</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Points</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewFilteredList.map(task => (
                      <tr key={task.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{task.project}</td>
                        <td className={styles.taskTitle}>{task.title}</td>
                        <td>
                          <div className={styles.assigneeCell}>
                            <AvatarFallback name={task.assignee} size="24px" />
                            {task.assignee}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.badge} ${styles['badge' + task.priority]}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td>
                          <span className={styles.badge} style={getStatusBadgeStyle(task.status)}>
                            {task.status === 'To Do' ? 'TODO'
                              : task.status === 'In Progress' ? 'IN-PROGRESS'
                              : task.status === 'testing' ? 'TESTING'
                              : task.status === 'Blocked' ? 'REJECT'
                              : task.status === 'pr' ? 'PR'
                              : task.status.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{task.points}</td>
                        <td>{task.due}</td>
                        <td>
                          <div className={styles.actionGroup}>
                            <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => handleEditTask(task)}><Edit size={12}/> Edit</button>
                            {activeView === 'pr' ? (
                              <>
                                <button className={`${styles.actionBtn} ${styles.success}`} onClick={() => handleApprovePr(task.id)}><Check size={12}/> Approve</button>
                                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleRejectPr(task.id)}><X size={12}/> Reject</button>
                              </>
                            ) : (
                              <button className={`${styles.actionBtn}`} onClick={() => handleReassignTask(task.id)}><UserPlus size={12}/> Reassign</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {viewFilteredList.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>No tasks found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}

        {reassignModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', width: '400px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Reassign Task</h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Select New Assignee</label>
                <select className={styles.formSelect} value={reassignAssigneeId} onChange={(e) => setReassignAssigneeId(e.target.value)}>
                  <option value="">Choose...</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.designation})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button onClick={() => setReassignModalOpen(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={submitReassign} style={{ backgroundColor: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                  Confirm Reassign
                </button>
              </div>
            </div>
          </div>
        )}

        {rejectModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', width: '400px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <XCircle size={20} /> Request Changes
              </h3>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Revision Notes / Reason</label>
                <textarea 
                  className={styles.formTextarea} 
                  rows={4} 
                  placeholder="Explain what needs to be changed..." 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)}
                  style={{resize: 'vertical'}}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button onClick={() => setRejectModalOpen(false)} style={{ backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={submitRejectPr} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                  Reject PR
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
