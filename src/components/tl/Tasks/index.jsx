import React, { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';
import AvatarFallback from '../../common/AvatarFallback';
import styles from './tasks.module.css';
import { PlusSquare, List, XCircle, GitPullRequest, Edit, UserPlus, RotateCcw, Check, X, Eye, Trash2, Download } from 'lucide-react';

export default function Tasks({ currentUser }) {
  const [activeView, setActiveView] = useState('create'); // 'create', 'list', 'rejected', 'pr'
  const previousViewRef = useRef('list'); // ref so async closures always read the latest value
  const [subtasks, setSubtasks] = useState(['']);
  const [groupBy, setGroupBy] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeView, groupBy]);

  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

  const { data: teamMembers = [], mutate: mutateTeam } = useSWR('/api/team-lead/team-members', fetcher);
  const { data: tasks = [], mutate: mutateTasks } = useSWR('/api/team-lead/tasks', fetcher);
  const { data: projectsData = [], mutate: mutateProjects } = useSWR('/api/team-lead/projects', fetcher);
  const { data: backendSprints } = useSWR('/api/team-lead/sprints', fetcher);

  const savedSprints = (() => {
    if (backendSprints !== undefined) {
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
  const [taskAssignees, setTaskAssignees] = useState([]);
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setAssigneeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const [viewTaskData, setViewTaskData] = useState(null);

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
    setTaskAssignees(rawTask.user_id ? [rawTask.user_id.toString()] : []);
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

  const confirmDelete = (taskId) => {
    setTaskToDelete(taskId);
    setDeleteModalOpen(true);
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/team-lead/tasks/${taskToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        if (window.toast) window.toast.success("Task deleted successfully!");
        else alert("Task deleted successfully!");
        mutateTasks();
      } else {
        const data = await res.json();
        if (window.toast) window.toast.error(data.detail || "Failed to delete task");
        else alert(data.detail || "Failed to delete task");
      }
    } catch (err) { console.error(err); } finally {
      setDeleteModalOpen(false);
      setTaskToDelete(null);
    }
  };

  const handleViewTask = (task) => {
    setViewTaskData(task);
    previousViewRef.current = activeView;
    setActiveView('view');
  };

  const handleAcceptRequest = async (taskId, currentCustomData, currentStatus) => {
    // REJECT → Approve → Reassign
    if (currentStatus === 'blocked') {
      // Open the reassign modal instead of changing status
      const updatedCustomData = { ...currentCustomData };
      delete updatedCustomData.approval_requested;
      try {
        const res = await fetch(`/api/team-lead/tasks/${taskId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('nsg_jwt_token')}`
          },
          body: JSON.stringify({
            status: 'blocked',
            custom_data: JSON.stringify(updatedCustomData)
          })
        });
        if (res.ok) mutateTasks();
      } catch (err) { console.error(err); }
      handleReassignTask(taskId);
      return;
    }

    // TODO (pending) → Approve → IN-PROGRESS
    // IN-PROGRESS → Approve → TESTING
    // TESTING → Approve → PR
    // PR → Approve → DONE
    let nextStatus = 'in-progress';
    if (currentStatus === 'pending') nextStatus = 'in-progress';
    else if (currentStatus === 'in-progress') nextStatus = 'testing';
    else if (currentStatus === 'testing') nextStatus = 'pr';
    else if (currentStatus === 'pr') nextStatus = 'done';

    try {
      const updatedCustomData = { ...currentCustomData };
      delete updatedCustomData.approval_requested;
      const res = await fetch(`/api/team-lead/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('nsg_jwt_token')}`
        },
        body: JSON.stringify({
          status: nextStatus,
          custom_data: JSON.stringify(updatedCustomData)
        })
      });
      if (res.ok) {
        if (window.toast) window.toast.success(`Task moved to ${nextStatus}`);
        mutateTasks();
      } else {
        const data = await res.json();
        if (window.toast) window.toast.error(data.detail || "Failed to accept request");
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
      sprint: t.sprint || 'Backlog',
      custom_data: t.custom_data,
      raw_status: t.status
    }));
  
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if(!taskTitle.trim() || taskAssignees.length === 0 || !taskProject || !taskSprint) {
      alert("Please enter a task title, select at least one assignee, select a project, and select a sprint ID");
      return;
    }
    setLoading(true);
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
      assignee_ids: taskAssignees.map(id => parseInt(id)),
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
        setTaskAssignees([]);
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
    } finally {
      setLoading(false);
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
        <button className={`${styles.navTab} ${activeView === 'assignee' ? styles.activeTab : ''}`} onClick={() => setActiveView('assignee')}>
          Assignee
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
        <button className={`${styles.navTab} ${activeView === 'history' ? styles.activeTab : ''}`} onClick={() => setActiveView('history')}>
          History
        </button>
      </div>

      <div className={styles.viewContainer}>
        {activeView === 'create' && (
          <div>
            <div className={styles.sectionTitle}>{editingTaskId ? "Edit Task" : "Create New Task"}</div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Task Title</label>
                <input type="text" className={styles.formInput} placeholder="e.g. Build Payment Gateway UI" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              </div>
              <div className={styles.formGroup} style={{ position: 'relative', zIndex: assigneeDropdownOpen ? 100 : 1 }} ref={assigneeDropdownRef}>
                <label className={styles.formLabel}>Assignees</label>
                <div 
                  className={styles.formInput} 
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', minHeight: '42px', backgroundColor: '#fff', border: '1px solid var(--border-color)', borderRadius: '6px' }}
                  onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                >
                  {taskAssignees.length === 0 
                    ? <span style={{ color: 'var(--text-muted)' }}>Select Team Members... ▾</span> 
                    : <span>{taskAssignees.length} member{taskAssignees.length > 1 ? 's' : ''} selected ▾</span>
                  }
                </div>
                {assigneeDropdownOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' }}>
                    {teamMembers.map(m => (
                      <label key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1f2937', padding: '6px 8px', borderRadius: '4px', transition: 'background-color 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <input
                          type="checkbox"
                          checked={taskAssignees.includes(m.id.toString())}
                          onChange={(e) => {
                            if (e.target.checked) setTaskAssignees([...taskAssignees, m.id.toString()]);
                            else setTaskAssignees(taskAssignees.filter(id => id !== m.id.toString()));
                          }}
                        />
                        {m.name} ({m.designation})
                      </label>
                    ))}
                  </div>
                )}
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
              {taskProject && (
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
              )}
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
                {!editingTaskId ? (
                  <button className={styles.submitBtn} style={{ marginTop: 0 }} onClick={handleCreateTask} disabled={loading}>
                    {loading ? 'Processing...' : 'Create Task'}
                  </button>
                ) : (
                  <button className={styles.submitBtn} style={{ marginTop: 0 }} onClick={handleCreateTask} disabled={loading}>
                    {loading ? 'Processing...' : 'Save Changes'}
                  </button>
                )}
                {editingTaskId && (
                  <button
                    type="button"
                    className={styles.actionBtn}
                    style={{ height: '48px', padding: '0 24px' }}
                    onClick={() => {
                      setEditingTaskId(null);
                      setTaskTitle('');
                      setTaskDescription('');
                      setTaskAssignees([]);
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
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {(activeView === 'list' || activeView === 'assignee' || activeView === 'todo' || activeView === 'inprogress' || activeView === 'testing' || activeView === 'rejected' || activeView === 'pr' || activeView === 'history') && (() => {
          const statusTitles = {
            list:       'Sprint Backlog Overview — All Tasks',
            assignee:   'Assignee Tasks',
            todo:       'Todo Tasks',
            inprogress: 'In-Progress Tasks',
            testing:    'Testing Tasks',
            rejected:   'Rejected / Requires Rework',
            pr:         'PR Review',
            history:    'History (Done Tasks)'
          };

          // Filter tasks per active tab
          const baseList =
            activeView === 'assignee'   ? taskList.filter(t => t.status === 'assignee')
            : activeView === 'todo'       ? taskList.filter(t => t.status === 'pending' || t.status === 'To Do')
            : activeView === 'inprogress' ? taskList.filter(t => t.status === 'In Progress')
            : activeView === 'testing'    ? taskList.filter(t => t.status === 'testing')
            : activeView === 'rejected'   ? taskList.filter(t => t.status === 'Blocked')
            : activeView === 'pr'         ? taskList.filter(t => t.status === 'pr')
            : activeView === 'history'    ? taskList.filter(t => t.status === 'Done')
            : taskList.filter(t => t.status !== 'Done'); // 'list' = All (excluding done)

          // Extra group-by filter only for the 'All' list view
          const applyGroupFilter = (list) => {
            if (activeView !== 'list') return list;
            if (groupBy === 'Assignee')    return list.filter(t => t.status === 'assignee');
            if (groupBy === 'Todo')        return list.filter(t => t.status === 'To Do');
            if (groupBy === 'In-Progress') return list.filter(t => t.status === 'In Progress');
            if (groupBy === 'Testing')     return list.filter(t => t.status === 'testing');
            if (groupBy === 'Rejected')    return list.filter(t => t.status === 'Blocked');
            if (groupBy === 'PR')          return list.filter(t => t.status === 'pr');
            return list;
          };

          const viewFilteredList = applyGroupFilter(baseList);

          const ITEMS_PER_PAGE = 10;
          const totalPages = Math.ceil(viewFilteredList.length / ITEMS_PER_PAGE);
          const paginatedList = viewFilteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

          // Status badge style helper
          const getStatusBadgeStyle = (status) => {
            if (status === 'assignee')   return { background: '#dbeafe', color: '#1e40af' };
            if (status === 'To Do' || status === 'pending')      return { background: '#e0f2fe', color: '#0369a1' };
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
                      <option value="Assignee">Assignee</option>
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
                    {paginatedList.map(task => (
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
                            {task.status === 'assignee' ? 'ASSIGNEE'
                              : task.status === 'To Do' || task.status === 'pending' ? 'TODO'
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
                            <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => handleViewTask(task)}><Eye size={12}/> View</button>
                            <button className={`${styles.actionBtn} ${styles.warning}`} onClick={() => handleEditTask(task)}><Edit size={12}/> Edit</button>
                            <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => confirmDelete(task.id)}><Trash2 size={12}/> Delete</button>
                            {activeView === 'pr' ? (
                              <>
                                <button className={`${styles.actionBtn} ${styles.success}`} onClick={() => handleApprovePr(task.id)}><Check size={12}/> Approve</button>
                                <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleRejectPr(task.id)}><X size={12}/> Reject</button>
                              </>
                            ) : (
                              <>
                                {(() => {
                                  try {
                                    const customData = task.custom_data ? JSON.parse(task.custom_data) : {};
                                    if (customData.approval_requested) {
                                      return (
                                        <button className={`${styles.actionBtn} ${styles.success}`} onClick={() => handleAcceptRequest(task.id, customData, task.raw_status)}>
                                          <Check size={12}/> Approve
                                        </button>
                                      );
                                    }
                                  } catch(e) {}
                                  return null;
                                })()}
                                {activeView !== 'history' && (
                                  <button className={`${styles.actionBtn}`} onClick={() => handleReassignTask(task.id)}><UserPlus size={12}/> Reassign</button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {paginatedList.length === 0 && (
                      <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '32px' }}>No tasks found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '16px' }}>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 500, border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage === 1 ? '#f8fafc' : '#fff', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                  >Previous</button>
                  <span style={{ padding: '4px 12px', fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 500, border: '1px solid #e2e8f0', borderRadius: '6px', background: currentPage === totalPages ? '#f8fafc' : '#fff', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
                  >Next</button>
                </div>
              )}
            </div>
          );
        })()}

        {reassignModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if(e.target === e.currentTarget) setReassignModalOpen(false); }}>
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
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if(e.target === e.currentTarget) setRejectModalOpen(false); }}>
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

        {deleteModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={(e) => { if(e.target === e.currentTarget) { setDeleteModalOpen(false); setTaskToDelete(null); } }}>
            <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', width: '400px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#ef4444' }}>Confirm Deletion</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this task? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
                <button onClick={() => { setDeleteModalOpen(false); setTaskToDelete(null); }} style={{ backgroundColor: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleDeleteTask} style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' }}>
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'view' && viewTaskData && (
          <div style={{ backgroundColor: 'var(--bg-primary)', padding: '24px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', color: 'var(--text-main)' }}>Task Details</h2>
              <button onClick={() => setActiveView(previousViewRef.current || 'list')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={24} /></button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Title</label>
                <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-main)', marginTop: '4px' }}>{viewTaskData.title}</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Project</label>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '4px' }}>{viewTaskData.project}</div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Status</label>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '4px' }}>{viewTaskData.status}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Assignee</label>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AvatarFallback name={viewTaskData.assignee} size="24px" />
                    {viewTaskData.assignee}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Priority & Points</label>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '4px' }}>{viewTaskData.priority} / {viewTaskData.points} SP</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Due Date</label>
                <div style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '4px' }}>{viewTaskData.due}</div>
              </div>

              {viewTaskData.description && (
                <div>
                  <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Description</label>
                  <div style={{ fontSize: '14px', color: 'var(--text-main)', marginTop: '4px', whiteSpace: 'pre-wrap', backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px' }}>{viewTaskData.description}</div>
                </div>
              )}
            </div>

            {/* Status Notes and Attachments */}
            {(() => {
              let customData = {};
              try {
                customData = viewTaskData.custom_data ? JSON.parse(viewTaskData.custom_data) : {};
              } catch(e) {}
              
              const statusNotes = customData.status_notes || {};
              const statusAtts = customData.status_attachments || {};
              const statusAuthors = customData.status_authors || {};
              const statusesWithData = [...new Set([...Object.keys(statusNotes), ...Object.keys(statusAtts)])];

              if (statusesWithData.length === 0) return null;

              return (
                <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                  <h3 style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '16px', textTransform: 'uppercase' }}>Status Notes & Attachments</h3>
                  {statusesWithData.map(status => (
                    <div key={status} style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        {status} Status
                        {statusAuthors[status] && <span style={{ textTransform: 'none', fontWeight: 'normal', color: 'var(--text-secondary)', marginLeft: '8px' }}>by {statusAuthors[status]}</span>}
                      </h4>
                      {statusNotes[status] && (
                        <div style={{ fontSize: '14px', color: 'var(--text-main)', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', marginBottom: '8px', whiteSpace: 'pre-wrap' }}>
                          {statusNotes[status]}
                        </div>
                      )}
                      {statusAtts[status] && statusAtts[status].length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {statusAtts[status].map((att, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', background: '#f0fdf4', padding: '6px 12px', borderRadius: '4px', border: '1px solid #bbf7d0', gap: '8px' }}>
                              <a href={att.file_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--brand-main)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                📄 {att.filename}
                              </a>
                              <a href={att.file_url} download={att.filename} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-main)', padding: '4px', borderRadius: '4px', cursor: 'pointer', background: 'rgba(34, 197, 94, 0.1)', textDecoration: 'none' }} title="Download">
                                <Download size={14} />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })()}
            

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setActiveView(previousViewRef.current || 'list')} style={{ backgroundColor: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}>
                Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
