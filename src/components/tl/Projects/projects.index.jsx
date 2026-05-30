import React, { useState } from 'react';
import styles from './projects.module.css';
import { Briefcase, Calendar, Users, ListTodo, KanbanSquare, GitCommit, Search, Plus, Play, MoreVertical, Flag, Clock } from 'lucide-react';

const Projects = () => {
  const [activeProject, setActiveProject] = useState(null);
  const [activeView, setActiveView] = useState('board'); // board, create_sprint, kanban, timeline
  const [activeFilter, setActiveFilter] = useState('All');

  // 1. My Projects Board Data
  const projectsData = [
    { id: 1, name: 'NSG ERP Core', client: 'Internal', status: 'Active', sprintCount: 4, budgetUsed: 65, deadline: '2026-06-15' },
    { id: 2, name: 'Video Huddles v2', client: 'External - Alpha Corp', status: 'On Hold', sprintCount: 2, budgetUsed: 30, deadline: '2026-07-01' },
    { id: 3, name: 'Payroll Engine', client: 'Internal', status: 'Completed', sprintCount: 8, budgetUsed: 95, deadline: '2026-04-10' },
  ];

  // 2. Create Sprint Form Data
  const backlogItems = [
    { id: 'b1', title: 'Implement OAuth 2.0 Login', points: 5, okr: 'Q2-Obj-1' },
    { id: 'b2', title: 'Design Database Schema for Video Huddles', points: 8, okr: 'Q2-Obj-2' },
    { id: 'b3', title: 'Setup CI/CD Pipeline', points: 3, okr: 'Q2-Obj-1' },
    { id: 'b4', title: 'Refactor Auth Middleware', points: 2, okr: 'Q2-Obj-3' },
  ];

  // 3. Kanban Task Board Data
  const [kanbanData, setKanbanData] = useState({
    todo: [
      { id: 't1', title: 'Design Timeline UI', points: 3, priority: 'High', assignee: 'AC', blocked: false },
      { id: 't2', title: 'API Integration', points: 5, priority: 'Medium', assignee: 'BS', blocked: false }
    ],
    inProgress: [
      { id: 't3', title: 'Sprint Form Validation', points: 2, priority: 'High', assignee: 'MC', blocked: true }
    ],
    codeReview: [
      { id: 't4', title: 'Authentication Service', points: 8, priority: 'Critical', assignee: 'ER', blocked: false }
    ],
    testing: [],
    done: [
      { id: 't5', title: 'Setup Repository', points: 1, priority: 'Low', assignee: 'MC', blocked: false }
    ]
  });

  // 4. Milestones Timeline Data
  const milestonesData = [
    { id: 'm1', name: 'Project Kickoff & Requirements', dueDate: '2026-05-01', status: 'completed', progress: 100, tasks: 12 },
    { id: 'm2', name: 'Alpha Release (Internal)', dueDate: '2026-06-15', status: 'in-progress', progress: 65, tasks: 34 },
    { id: 'm3', name: 'Beta Release (Public)', dueDate: '2026-07-15', status: 'pending', progress: 0, tasks: 45 },
    { id: 'm4', name: 'Final Production Rollout', dueDate: '2026-08-01', status: 'pending', progress: 0, tasks: 20 },
  ];

  const handleDragStart = (e, taskId, sourceCol) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceCol', sourceCol);
  };

  const handleDrop = (e, targetCol) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const sourceCol = e.dataTransfer.getData('sourceCol');

    if (sourceCol && sourceCol !== targetCol) {
      const task = kanbanData[sourceCol].find(t => t.id === taskId);
      setKanbanData(prev => ({
        ...prev,
        [sourceCol]: prev[sourceCol].filter(t => t.id !== taskId),
        [targetCol]: [...prev[targetCol], task]
      }));
    }
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  const renderBoard = () => {
    if (activeView !== 'board') {
      const viewTitle = activeView === 'kanban' ? 'Kanban Board' : activeView === 'create_sprint' ? 'Sprint Configuration' : 'Milestones';
      return (
        <div className={styles.boardContainer}>
          <div className={styles.selectionPrompt}>
            <h3>Select a Project to view {viewTitle}</h3>
          </div>
          <div className={styles.projectListSelection}>
            {projectsData.map(proj => (
              <div
                key={proj.id}
                className={styles.projectCardSelection}
                onClick={() => setActiveProject(proj)}
              >
                <div className={styles.pcsInfo}>
                  <span className={`${styles.pBadge} ${styles[proj.status.toLowerCase().replace(' ', '')]}`}>{proj.status}</span>
                  <span className={styles.pClient}>{proj.client}</span>
                </div>
                <h3 className={styles.pcsTitle}>{proj.name}</h3>
                <p className={styles.pSelectHint}>Click to open {viewTitle} →</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.boardContainer}>
        <div className={styles.filtersBar}>
          <div className={styles.filterTabs}>
            {['All', 'Active', 'On Hold', 'Completed'].map(f => (
              <button
                key={f}
                className={`${styles.filterBtn} ${activeFilter === f ? styles.activeFilter : ''}`}
                onClick={() => setActiveFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
          <div className={styles.searchBox}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" placeholder="Search projects..." />
          </div>
        </div>

        <div className={styles.projectGrid}>
          {projectsData.filter(p => activeFilter === 'All' || p.status === activeFilter).map(proj => (
            <div key={proj.id} className={styles.projectCard}>
              <div className={styles.pCardHeader}>
                <span className={`${styles.pBadge} ${styles[proj.status.toLowerCase().replace(' ', '')]}`}>{proj.status}</span>
                <span className={styles.pClient}>{proj.client}</span>
              </div>
              <h3 className={styles.pTitle}>{proj.name}</h3>

              <div className={styles.pStats}>
                <div className={styles.pStatItem}>
                  <GitCommit size={14} /> {proj.sprintCount} Sprints
                </div>
                <div className={styles.pStatItem}>
                  <Calendar size={14} /> Due {proj.deadline}
                </div>
              </div>

              <div className={styles.pProgressBox}>
                <div className={styles.pProgressText}>
                  <span>Budget Used</span>
                  <strong>{proj.budgetUsed}%</strong>
                </div>
                <div className={styles.pProgressBar}>
                  <div className={styles.pProgressFill} style={{ width: `${proj.budgetUsed}%` }}></div>
                </div>
              </div>

              <div className={styles.pActions}>
                <button className={styles.pBtnAction} onClick={() => { setActiveProject(proj); setActiveView('kanban'); }}>
                  <KanbanSquare size={14} /> Board
                </button>
                <button className={styles.pBtnAction} onClick={() => { setActiveProject(proj); setActiveView('create_sprint'); }}>
                  <Plus size={14} /> Sprint
                </button>
                <button className={styles.pBtnAction} onClick={() => { setActiveProject(proj); setActiveView('timeline'); }}>
                  <ListTodo size={14} /> Milestones
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCreateSprint = () => (
    <div className={styles.createSprintContainer}>
      <div className={styles.sprintFormSection}>
        <h3 className={styles.sectionTitle}>Sprint Configuration</h3>
        <div className={styles.sprintForm}>
          <div className={styles.formGroup}>
            <label>Sprint Name</label>
            <input type="text" placeholder="e.g. Sprint 42: Alpha Release" defaultValue="Sprint 43" />
          </div>
          <div className={styles.formGroup}>
            <label>Sprint Goal</label>
            <textarea placeholder="What are we trying to achieve?" rows="3"></textarea>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Start Date</label>
              <input type="date" />
            </div>
            <div className={styles.formGroup}>
              <label>End Date</label>
              <input type="date" />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Story Points Target</label>
            <input type="number" placeholder="e.g. 50" defaultValue="40" />
          </div>
          <button className={styles.startSprintBtn}><Play size={16} /> Start Sprint</button>
        </div>
      </div>

      <div className={styles.backlogSection}>
        <div className={styles.backlogHeader}>
          <h3 className={styles.sectionTitle}>Product Backlog</h3>
          <p className={styles.backlogHelp}>Drag items from here to your sprint backlog.</p>
        </div>
        <div className={styles.backlogList}>
          {backlogItems.map(item => (
            <div key={item.id} className={styles.backlogItem} draggable>
              <div className={styles.bItemHeader}>
                <span className={styles.bItemTitle}>{item.title}</span>
                <MoreVertical size={14} className={styles.dragIcon} />
              </div>
              <div className={styles.bItemMeta}>
                <span className={styles.bItemPoints}>{item.points} pts</span>
                <span className={styles.bItemOkr}>🎯 {item.okr}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const getPriorityColor = (prio) => {
    switch (prio) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#3b82f6';
      default: return '#94a3b8';
    }
  };

  const renderKanban = () => {
    const columns = [
      { id: 'todo', title: 'To Do' },
      { id: 'inProgress', title: 'In Progress' },
      { id: 'codeReview', title: 'Code Review' },
      { id: 'testing', title: 'Testing' },
      { id: 'done', title: 'Done' }
    ];

    return (
      <div className={styles.kanbanContainer}>
        {columns.map(col => (
          <div
            key={col.id}
            className={styles.kanbanColumn}
            onDragOver={allowDrop}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={styles.kanbanColHeader}>
              <h4>{col.title}</h4>
              <span className={styles.kanbanCount}>{kanbanData[col.id].length}</span>
            </div>
            <div className={styles.kanbanTasks}>
              {kanbanData[col.id].map(task => (
                <div
                  key={task.id}
                  className={`${styles.kTaskCard} ${task.blocked ? styles.blockedTask : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id, col.id)}
                >
                  {task.blocked && <div className={styles.blockerFlag}><Flag size={12} /> Blocked</div>}
                  <h5 className={styles.kTaskTitle}>{task.title}</h5>
                  <div className={styles.kTaskMeta}>
                    <span className={styles.kPriority} style={{ backgroundColor: getPriorityColor(task.priority) + '20', color: getPriorityColor(task.priority) }}>
                      {task.priority}
                    </span>
                    <span className={styles.kPoints}>{task.points} pts</span>
                  </div>
                  <div className={styles.kTaskFooter}>
                    <div className={styles.kAssignee}>{task.assignee}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderTimeline = () => (
    <div className={styles.timelineContainer}>
      <div className={styles.timelineHeaderRow}>
        <div className={styles.tlColName}>Milestone</div>
        <div className={styles.tlColDate}>Due Date</div>
        <div className={styles.tlColStatus}>Status</div>
        <div className={styles.tlColTasks}>Linked Tasks</div>
        <div className={styles.tlColProgress}>Progress</div>
      </div>

      <div className={styles.timelineList}>
        {milestonesData.map(milestone => (
          <div key={milestone.id} className={styles.timelineRow}>
            <div className={styles.tlColName}>
              <div className={styles.milestoneIcon}><Clock size={16} /></div>
              {milestone.name}
            </div>
            <div className={styles.tlColDate}>{milestone.dueDate}</div>
            <div className={styles.tlColStatus}>
              <span className={`${styles.mStatusBadge} ${styles[milestone.status]}`}>{milestone.status.replace('-', ' ')}</span>
            </div>
            <div className={styles.tlColTasks}>{milestone.tasks} tasks</div>
            <div className={styles.tlColProgress}>
              <div className={styles.mProgressBar}>
                <div className={styles.mProgressFill} style={{ width: `${milestone.progress}%`, backgroundColor: milestone.progress === 100 ? '#10b981' : 'var(--primary)' }}></div>
              </div>
              <span className={styles.mProgressText}>{milestone.progress}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={`fade-in ${styles.container}`}>
      <div className={styles.topToolbar}>
        {!activeProject ? (
          <div className={styles.navTabs}>
            <button className={`${styles.navTab} ${activeView === 'board' ? styles.activeTab : ''}`} onClick={() => setActiveView('board')}>
              <Briefcase size={16} /> My Projects
            </button>
            <button className={`${styles.navTab} ${activeView === 'kanban' ? styles.activeTab : ''}`} onClick={() => setActiveView('kanban')}>
              <KanbanSquare size={16} /> Board
            </button>
            <button className={`${styles.navTab} ${activeView === 'create_sprint' ? styles.activeTab : ''}`} onClick={() => setActiveView('create_sprint')}>
              <Plus size={16} /> Sprint
            </button>
            <button className={`${styles.navTab} ${activeView === 'timeline' ? styles.activeTab : ''}`} onClick={() => setActiveView('timeline')}>
              <ListTodo size={16} /> Milestones
            </button>
          </div>
        ) : (
          <div className={styles.projectNav}>
            <button className={styles.backBtn} onClick={() => { setActiveProject(null); setActiveView('board'); }}>
              ← Back to Projects
            </button>
            <div className={styles.projectNameDivider}>|</div>
            <h2 className={styles.headerTitle}>{activeProject.name}</h2>

            <div className={styles.navTabs}>
              <button className={`${styles.navTab} ${activeView === 'kanban' ? styles.activeTab : ''}`} onClick={() => setActiveView('kanban')}>
                <KanbanSquare size={16} /> Board
              </button>
              <button className={`${styles.navTab} ${activeView === 'create_sprint' ? styles.activeTab : ''}`} onClick={() => setActiveView('create_sprint')}>
                <Plus size={16} /> Sprint
              </button>
              <button className={`${styles.navTab} ${activeView === 'timeline' ? styles.activeTab : ''}`} onClick={() => setActiveView('timeline')}>
                <ListTodo size={16} /> Milestones
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={styles.contentArea}>
        {!activeProject && renderBoard()}
        {activeProject && activeView === 'create_sprint' && renderCreateSprint()}
        {activeProject && activeView === 'kanban' && renderKanban()}
        {activeProject && activeView === 'timeline' && renderTimeline()}
      </div>
    </div>
  );
};

export default Projects;
