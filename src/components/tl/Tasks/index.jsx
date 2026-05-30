import React, { useState } from 'react';
import styles from './tasks.module.css';
import { PlusSquare, List, XCircle, GitPullRequest, Edit, UserPlus, RotateCcw, Check, X } from 'lucide-react';

const Tasks = () => {
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

  // --- Mock Data ---
  const [taskList, setTaskList] = useState([
    { id: 1, project: 'NSG-ERP Core', title: 'Implement JWT Auth Service', assignee: 'Sarah Jenkins', avatar: 'SJ', priority: 'High', status: 'Done', points: 8, due: 'May 10' },
    { id: 2, project: 'Mobile App', title: 'Database Migration Script', assignee: 'Michael Chang', avatar: 'MC', priority: 'Medium', status: 'In Progress', points: 5, due: 'May 15' },
    { id: 3, project: 'Marketing Website', title: 'Update Dashboard Layout', assignee: 'David Miller', avatar: 'DM', priority: 'Low', status: 'To Do', points: 3, due: 'May 20' }
  ]);
  
  const [taskTitle, setTaskTitle] = useState('');

  const handleCreateTask = (e) => {
    e.preventDefault();
    const newTask = {
      id: Date.now(),
      project: 'NSG-ERP Core',
      title: taskTitle.trim() || 'Untitled Task',
      assignee: 'Unassigned',
      avatar: '?',
      priority: 'Medium',
      status: 'To Do',
      points: 1,
      due: 'TBD'
    };
    setTaskList([...taskList, newTask]);
    setTaskTitle('');
    setSubtasks(['']);
    setActiveView('list');
  };

  const rejectedTasks = [
    { id: 1, title: 'Export to CSV Feature', reason: 'Missing edge case for large files >50MB. Memory leak detected.', rejectedBy: 'Nirmal (CEO)', rejectedAt: '2 hours ago', resubmitDue: 'May 18' },
    { id: 2, title: 'User Onboarding Flow', reason: 'Figma design mismatch on mobile screens.', rejectedBy: 'Sarah Jenkins', rejectedAt: '1 day ago', resubmitDue: 'May 19' }
  ];

  const prReviews = [
    { id: 1, title: 'Fix notification socket bug', prUrl: '#PR-402', author: 'Michael Chang', openedAt: 'May 16, 10:00 AM', hoursPending: 28 }, // > 24h
    { id: 2, title: 'Add dark mode toggle', prUrl: '#PR-408', author: 'David Miller', openedAt: 'May 17, 09:30 AM', hoursPending: 4 }
  ];

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
                <select className={styles.formSelect}>
                  <option>Select Team Member...</option>
                  <option>Sarah Jenkins</option>
                  <option>Michael Chang</option>
                  <option>David Miller</option>
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.formLabel}>Description</label>
                <textarea className={styles.formTextarea} placeholder="Detailed description of the task..."></textarea>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Story Points</label>
                <input type="number" className={styles.formInput} placeholder="e.g. 3, 5, 8" />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Priority</label>
                <select className={styles.formSelect}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Critical</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Project</label>
                <select className={styles.formSelect}>
                  <option>Select Project...</option>
                  <option>NSG-ERP Core</option>
                  <option>Mobile App</option>
                  <option>Marketing Website</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Sprint ID</label>
                <select className={styles.formSelect}>
                  <option>Sprint 42 (Current)</option>
                  <option>Sprint 43 (Next)</option>
                  <option>Backlog</option>
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
                <textarea className={styles.formTextarea} placeholder="- Given... When... Then..."></textarea>
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
                      <td><a href="#" className={styles.prLink}>{pr.prUrl}</a></td>
                      <td>{pr.author}</td>
                      <td>{pr.openedAt}</td>
                      <td>
                        <span className={`${styles.timePending} ${pr.hoursPending > 24 ? styles.red : ''}`}>
                          {pr.hoursPending} hours
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionGroup}>
                          <button className={`${styles.actionBtn} ${styles.success}`}><Check size={12}/> Approve PR</button>
                          <button className={`${styles.actionBtn} ${styles.danger}`}><X size={12}/> Request Changes</button>
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
