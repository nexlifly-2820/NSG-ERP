import React, { useState } from 'react';
import styles from './tasks.module.css';
import { PlusSquare, List, XCircle, GitPullRequest, Edit, UserPlus, RotateCcw, Check, X } from 'lucide-react';

const Tasks = ({ db, onUpdateDb, currentUser }) => {
  const [activeView, setActiveView] = useState('create'); // 'create', 'list', 'rejected', 'pr'
  const [subtasks, setSubtasks] = useState(['']);
  const [groupBy, setGroupBy] = useState('None');

  const handleAddSubtask = () => setSubtasks([...subtasks, '']);
  const handleRemoveSubtask = (index) => setSubtasks(subtasks.filter((_, i) => i !== index));
  const handleSubtaskChange = (index, value) => {
    const newSubtasks = [...subtasks];
    newSubtasks[index] = value;
    setSubtasks(newSubtasks);
  };

  // --- Dynamic Database Mapping ---
  const getStatusLabel = (status) => {
    if (status === 'pending') return 'To Do';
    if (status === 'in-progress') return 'In Progress';
    if (status === 'done') return 'Done';
    if (status === 'blocked') return 'Blocked';
    return status;
  };

  const getAssigneeAvatar = (name) => {
    if (!name || name === 'Unassigned') return 'UN';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const allTasks = db?.tasks || [];

  const taskList = allTasks.map(t => ({
    id: t.id,
    project: t.project || 'NSG-ERP Core',
    title: t.title,
    assignee: t.assignee,
    avatar: t.avatar || getAssigneeAvatar(t.assignee),
    priority: t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : 'Medium',
    status: getStatusLabel(t.status),
    points: t.sp || 1,
    due: t.due || 'TBD'
  }));
  
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPoints, setTaskPoints] = useState('');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssignee, setTaskAssignee] = useState('Select Team Member...');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskProject, setTaskProject] = useState('NSG-ERP Core');
  const [taskSprint, setTaskSprint] = useState('Sprint 14');
  const [taskAcceptance, setTaskAcceptance] = useState('');

  const handleCreateTask = (e) => {
    e.preventDefault();
    
    if(!taskTitle.trim()) {
      alert("Please enter a task title");
      return;
    }

    const assignedUser = taskAssignee === 'Select Team Member...' ? 'Unassigned' : taskAssignee;
    const priorityVal = taskPriority.toLowerCase();

    const newDbTask = {
      id: Date.now(),
      project: taskProject,
      sprint: taskSprint,
      title: taskTitle.trim(),
      description: taskDescription.trim() || 'Created via TL sprint board',
      priority: priorityVal,
      status: 'pending',
      sp: parseInt(taskPoints) || 1,
      assignee: assignedUser,
      avatar: assignedUser !== 'Unassigned' ? assignedUser.split(' ').map(n => n[0]).join('').toUpperCase() : 'UN',
      due: '2026-06-15',
      subtasks: subtasks.filter(t => t.trim() !== '').map((s, idx) => ({ id: Date.now() + idx, title: s, done: false })),
      acceptance: taskAcceptance.trim() ? taskAcceptance.split('\n').map(c => c.trim().replace(/^-\s*/, '')).filter(Boolean) : [
        'Meets general code quality guidelines',
        'Verified on local staging build'
      ],
      prStatus: null,
      prUrl: '',
      rejectedReason: ''
    };

    if (db && onUpdateDb) {
      const currentTasks = Array.isArray(db.tasks) ? db.tasks : [];
      const updatedTasks = [...currentTasks, newDbTask];
      onUpdateDb({ ...db, tasks: updatedTasks });
    }
    
    // Dispatch to global kanban board in Projects module
    const kanbanTask = {
      id: `t${newDbTask.id}`,
      title: newDbTask.title,
      points: newDbTask.sp,
      priority: taskPriority,
      assignee: newDbTask.avatar,
      blocked: false
    };
    window.dispatchEvent(new CustomEvent('add_kanban_task', { detail: kanbanTask }));

    setTaskTitle('');
    setTaskPoints('');
    setTaskPriority('Medium');
    setTaskAssignee('Select Team Member...');
    setTaskDescription('');
    setTaskProject('NSG-ERP Core');
    setTaskSprint('Sprint 14');
    setTaskAcceptance('');
    setSubtasks(['']);
    setActiveView('list');
  };

  const handleApprovePr = (taskId) => {
    if (db && onUpdateDb) {
      const currentTasks = Array.isArray(db.tasks) ? db.tasks : [];
      const updatedTasks = currentTasks.map(t => {
        if (t.id === taskId) {
          return { ...t, prStatus: 'approved', status: 'done', rejectedReason: '' };
        }
        return t;
      });
      onUpdateDb({ ...db, tasks: updatedTasks });
    }
  };

  const handleRejectPr = (taskId) => {
    const reason = prompt("Enter revision notes / rejection reason for the developer:");
    if (reason === null) return;
    
    if (db && onUpdateDb) {
      const currentTasks = Array.isArray(db.tasks) ? db.tasks : [];
      const updatedTasks = currentTasks.map(t => {
        if (t.id === taskId) {
          return { ...t, prStatus: 'rejected', status: 'blocked', rejectedReason: reason || 'Rework requested.' };
        }
        return t;
      });
      onUpdateDb({ ...db, tasks: updatedTasks });
    }
  };

  const rejectedTasks = allTasks
    .filter(t => t.prStatus === 'rejected')
    .map(t => ({
      id: t.id,
      title: t.title,
      reason: t.rejectedReason || 'Rework required.',
      rejectedBy: currentUser?.name || 'Marcus Vance',
      rejectedAt: 'Recently',
      resubmitDue: t.due || 'TBD'
    }));

  const prReviews = allTasks
    .filter(t => t.prStatus === 'submitted')
    .map(t => ({
      id: t.id,
      title: t.title,
      prUrl: t.prUrl || '#PR',
      author: t.assignee,
      openedAt: 'Today',
      hoursPending: 2
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
      {/* Navigation Toolbar */}
      <div className={styles.topToolbar}>
        <button 
          className={`${styles.navTab} ${activeView === 'create' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('create')}
        >
          <PlusSquare size={16} /> Task Creation Form
        </button>
        <button 
          className={`${styles.navTab} ${activeView === 'list' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('list')}
        >
          <List size={16} /> Task List View
        </button>
        <button 
          className={`${styles.navTab} ${activeView === 'rejected' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('rejected')}
        >
          <XCircle size={16} /> Rejected Tasks Queue
        </button>
        <button 
          className={`${styles.navTab} ${activeView === 'pr' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('pr')}
        >
          <GitPullRequest size={16} /> PR Review Gates
        </button>
      </div>

      <div className={styles.viewContainer}>
        
        {/* View 1: Task Creation Form */}
        {activeView === 'create' && (
          <div>
            <div className={styles.sectionTitle}>Create New Task</div>
            <div className={styles.formGrid}>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Task Title</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  placeholder="e.g. Build Payment Gateway UI" 
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Assignee</label>
                <select 
                  className={styles.formSelect}
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                >
                  <option>Select Team Member...</option>
                  <option>Jane Smith</option>
                  <option>Sarah Jenkins</option>
                  <option>Michael Chang</option>
                  <option>David Miller</option>
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Description</label>
                <textarea 
                  className={styles.formTextarea} 
                  placeholder="Detailed description of the task..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                ></textarea>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Story Points</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  placeholder="e.g. 3, 5, 8" 
                  value={taskPoints}
                  onChange={(e) => setTaskPoints(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Priority</label>
                <select 
                  className={styles.formSelect}
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Project</label>
                <select 
                  className={styles.formSelect}
                  value={taskProject}
                  onChange={(e) => setTaskProject(e.target.value)}
                >
                  <option>Select Project...</option>
                  <option>NSG-ERP Core</option>
                  <option>Mobile App</option>
                  <option>Marketing Website</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sprint ID</label>
                <select 
                  className={styles.formSelect}
                  value={taskSprint}
                  onChange={(e) => setTaskSprint(e.target.value)}
                >
                  {[...new Set(['Sprint 14', 'Sprint 13', ...((db?.tasks || []).map(t => t.sprint).filter(Boolean))])].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                  <option value="Backlog">Backlog</option>
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Labels (Comma separated)</label>
                <input type="text" className={styles.formInput} placeholder="frontend, bug, ui" />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Subtasks</label>
                <div className={styles.subtaskList}>
                  {subtasks.map((subtask, idx) => (
                    <div key={idx} className={styles.subtaskItem}>
                      <input 
                        type="text" 
                        className={styles.subtaskInput} 
                        placeholder={`Subtask ${idx + 1}...`}
                        value={subtask}
                        onChange={(e) => handleSubtaskChange(idx, e.target.value)}
                      />
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
                <textarea 
                  className={styles.formTextarea} 
                  placeholder="- Given... When... Then..."
                  value={taskAcceptance}
                  onChange={(e) => setTaskAcceptance(e.target.value)}
                ></textarea>
              </div>

              <button className={styles.submitBtn} onClick={handleCreateTask}>Create Task</button>
            </div>
          </div>
        )}

        {/* View 2: Task List View */}
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
                              <div className={styles.avatar}>{task.avatar}</div>
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
                              <button className={`${styles.actionBtn} ${styles.primary}`}><Edit size={12}/> Edit</button>
                              <button className={styles.actionBtn}><UserPlus size={12}/> Reassign</button>
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

        {/* View 3: Rejected Tasks Queue */}
        {activeView === 'rejected' && (
          <div>
            <div className={styles.sectionTitle}>Requires Rework & Fixes</div>
            <div className={styles.dataTableWrapper}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Rejection Reason</th>
                    <th>Rejected By</th>
                    <th>Rejected At</th>
                    <th>Resubmit Deadline</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rejectedTasks.map(task => (
                    <tr key={task.id}>
                      <td className={styles.taskTitle}>{task.title}</td>
                      <td style={{ color: 'var(--danger)', fontWeight: 500 }}>{task.reason}</td>
                      <td>{task.rejectedBy}</td>
                      <td>{task.rejectedAt}</td>
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

        {/* View 4: PR Review Gates Panel */}
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
                    <th>Opened At</th>
                    <th>Time Pending</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {prReviews.map(pr => (
                    <tr key={pr.id}>
                      <td className={styles.taskTitle}>{pr.title}</td>
                      <td>
                        <a 
                          href={pr.prUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.prLink}
                        >
                          {pr.prUrl}
                        </a>
                      </td>
                      <td>{pr.author}</td>
                      <td>{pr.openedAt}</td>
                      <td>
                        <span className={`${styles.timePending} ${pr.hoursPending > 24 ? styles.red : ''}`}>
                          {pr.hoursPending} hours
                        </span>
                      </td>
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

      </div>
    </div>
  );
};

export default Tasks;
