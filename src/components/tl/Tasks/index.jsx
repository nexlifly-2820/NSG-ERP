import React, { useState } from 'react';
import useSWR from 'swr';
import AvatarFallback from '../../common/AvatarFallback';
import styles from './tasks.module.css';
import { PlusSquare, List, XCircle, GitPullRequest, Edit, UserPlus, RotateCcw, Check, X } from 'lucide-react';

export default function Tasks({ currentUser }) {
  const [activeView, setActiveView] = useState('create'); // 'create', 'list', 'rejected', 'pr'
  const [subtasks, setSubtasks] = useState(['']);
  const [groupBy, setGroupBy] = useState('None');
  
  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

  const { data: teamMembers = [], mutate: mutateTeam } = useSWR('/api/team-lead/team-members', fetcher);
  const { data: tasks = [], mutate: mutateTasks } = useSWR('/api/team-lead/tasks', fetcher);
  const { data: projectsData = [], mutate: mutateProjects } = useSWR('/api/team-lead/projects', fetcher);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskPoints, setTaskPoints] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskProject, setTaskProject] = useState('NSG-ERP Core');
  const [taskSprint, setTaskSprint] = useState('Sprint 1');
  const [taskAcceptance, setTaskAcceptance] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignTaskId, setReassignTaskId] = useState(null);
  const [reassignAssigneeId, setReassignAssigneeId] = useState('');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTaskId, setRejectTaskId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');



  const handleAddSubtask = () => setSubtasks([...subtasks, '']);
  const handleRemoveSubtask = (index) => setSubtasks(subtasks.filter((_, i) => i !== index));
  const handleSubtaskChange = (index, value) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  const handleEditTask = (task) => {
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskProject(task.project);
    setTaskSprint(task.sprint);
    setTaskPriority(task.priority);
    setTaskAssignee(task.user_id || '');
    setTaskPoints(task.sp || '');
    setTaskDue(task.due || '');
    setTaskAcceptance(task.acceptance ? task.acceptance.join('\n') : '');
    setSubtasks(task.subtasks && task.subtasks.length > 0 ? task.subtasks.map(s => s.title) : ['']);
    setEditingTaskId(task.id);
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

  const taskList = tasks.map(t => ({
    id: t.id,
    project: t.project || 'NSG-ERP Core',
    title: t.title,
    assignee: getAssigneeName(t.user_id),
    avatar: getAssigneeAvatar(getAssigneeName(t.user_id)),
    priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium',
    status: getStatusLabel(t.status),
    points: t.sp || 1,
    due: t.due || 'TBD'
  }));
  
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if(!taskTitle.trim() || !taskAssignee) {
      alert("Please enter a task title and select an assignee");
      return;
    }
    const priorityVal = taskPriority.toLowerCase();
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
      acceptance: taskAcceptance.split('\n').map(a => a.trim().replace(/^- /, '')).filter(a => a !== '')
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
        setActiveView('list');
        mutateTasks();
        if (window.toast) window.toast.success(editingTaskId ? "Task updated successfully!" : "Task created successfully!");
        else alert(editingTaskId ? "Task updated successfully!" : "Task created successfully!");
        setSubtasks(['']);
      }
    } catch (e) { console.error(e); }
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
    .filter(t => t.pr_status === 'rejected')
    .map(t => ({
      id: t.id,
      title: t.title,
      reason: t.rejected_reason || 'Rework required.',
      resubmitDue: t.due || 'TBD'
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
    if (groupBy === 'None') return { 'All Tasks': taskList };
    return taskList.reduce((acc, task) => {
      let key = 'Other';
      if (groupBy === 'Assignee') key = task.assignee;
      if (groupBy === 'Priority') key = task.priority;
      if (groupBy === 'Sprint') key = 'Sprint 42'; 
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
        <button className={`${styles.navTab} ${activeView === 'rejected' ? styles.activeTab : ''}`} onClick={() => setActiveView('rejected')}>
          <XCircle size={16} /> Rejected Tasks Queue
        </button>
        <button className={`${styles.navTab} ${activeView === 'pr' ? styles.activeTab : ''}`} onClick={() => setActiveView('pr')}>
          <GitPullRequest size={16} /> PR Review Gates
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
                <input type="number" className={styles.formInput} placeholder="e.g. 3, 5, 8" value={taskPoints} onChange={(e) => setTaskPoints(e.target.value)} />
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
                <select className={styles.formSelect} value={taskProject} onChange={(e) => setTaskProject(e.target.value)}>
                  <option value="">Select Project...</option>
                  {projectsData.map(proj => (
                    <option key={proj.id} value={proj.name}>{proj.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sprint ID</label>
                <select className={styles.formSelect} value={taskSprint} onChange={(e) => setTaskSprint(e.target.value)}>
                  {[...new Set(((tasks || []).map(t => t.sprint).filter(Boolean)))].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Backlog">Backlog</option>
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
              <button className={styles.submitBtn} onClick={handleCreateTask}>{editingTaskId ? "Update Task" : "Create Task"}</button>
            </div>
          </div>
        )}

        {activeView === 'list' && (
          <div>
            <div className={styles.sectionTitle}>
              <span>Sprint Backlog Overview</span>
              <div className={styles.groupControl}>
                <label className={styles.formLabel} style={{marginBottom: 0}}>Group By:</label>
                <select className={styles.groupSelect} value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <option value="None">None</option>
                  <option value="Assignee">Assignee</option>
                  <option value="Priority">Priority</option>
                  <option value="Sprint">Sprint</option>
                </select>
              </div>
            </div>
            <div className={styles.dataTableWrapper}>
              {Object.entries(getGroupedTasks()).map(([groupName, tasks]) => (
                <div key={groupName} style={{ marginBottom: groupBy === 'None' ? 0 : '24px' }}>
                  {groupBy !== 'None' && (
                    <div className={styles.groupHeader}>
                      {groupName} <span className={styles.groupBadge}>{tasks.length}</span>
                    </div>
                  )}
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
                      {tasks.map(task => (
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
                            <span className={`${styles.badge} ${task.status === 'Done' ? styles.badgeDone : task.status === 'In Progress' ? styles.badgeProgress : styles.badgeTodo}`}>
                              {task.status}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{task.points}</td>
                          <td>{task.due}</td>
                          <td>
                            <div className={styles.actionGroup}>
                              <button className={`${styles.actionBtn} ${styles.primary}`} onClick={() => handleEditTask(task)}><Edit size={12}/> Edit</button>
                              <button className={`${styles.actionBtn}`} onClick={() => handleReassignTask(task.id)}><UserPlus size={12}/> Reassign</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'rejected' && (
          <div>
            <div className={styles.sectionTitle}>Requires Rework & Fixes</div>
            <div className={styles.dataTableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Rejection Reason</th>
                    <th>Resubmit Deadline</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rejectedTasks.map(task => (
                    <tr key={task.id}>
                      <td className={styles.taskTitle}>{task.title}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 500 }}>{task.reason}</td>
                      <td style={{ fontWeight: 600 }}>{task.resubmitDue}</td>
                      <td>
                        <button className={`${styles.actionBtn} ${styles.primary}`}>
                          <RotateCcw size={12}/> Reopen & Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'pr' && (
          <div>
            <div className={styles.sectionTitle}>Pending Pull Requests</div>
            <div className={styles.dataTableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>PR Link</th>
                    <th>Author</th>
                    <th>Due Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prReviews.map(pr => (
                    <tr key={pr.id}>
                      <td className={styles.taskTitle}>{pr.title}</td>
                      <td>
                        <a href={pr.prUrl} target="_blank" rel="noopener noreferrer" className={styles.prLink}>
                          {pr.prUrl}
                        </a>
                      </td>
                      <td>{pr.author}</td>
                      <td>{pr.due}</td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button className={`${styles.actionBtn} ${styles.success}`} onClick={() => handleApprovePr(pr.id)}><Check size={12}/> Approve PR</button>
                          <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleRejectPr(pr.id)}><X size={12}/> Request Changes</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
