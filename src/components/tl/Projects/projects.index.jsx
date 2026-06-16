import React, { useState, useEffect } from 'react';
import styles from './projects.module.css';
import { Briefcase, Calendar, Users, ListTodo, KanbanSquare, GitCommit, Search, Plus, Play, MoreVertical, Flag, Clock, X, HelpCircle, Eye, CheckCircle, AlertCircle, ChevronRight, AlertTriangle, Menu, CheckSquare, Paperclip, MessageSquare, User, Tag, Info, Lock, ChevronDown, XCircle, GitPullRequest } from 'lucide-react';


const Projects = () => {
  const [activeProject, setActiveProject] = useState(null);
  const [activeView, setActiveView] = useState('board'); // board, create_sprint, kanban, timeline

  // 1. My Projects Board Data — from backend
  const [projectsData, setProjectsData] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState('All');

  // Sprint Config States
  const [sprintName, setSprintName] = useState('Sprint 43');
  const [sprintGoal, setSprintGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [spTarget, setSpTarget] = useState(40);

  // 2. Create Sprint Form Data
  const [productBacklog, setProductBacklog] = useState([]);
  const [milestonesData, setMilestonesData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [sprintBacklog, setSprintBacklog] = useState([]);

  // 3. Kanban Task Board Data — from backend
  const [kanbanData, setKanbanData] = useState({
    todo: [],
    inProgress: [],
    testing: [],
    rejected: [],
    pr: []
  });
  const [kanbanLoading, setKanbanLoading] = useState(false);

  const token = () => localStorage.getItem('nsg_jwt_token');

  // Fetch real projects from backend
  useEffect(() => {
    const fetchProjectsAndTeam = async () => {
      setProjectsLoading(true);
      try {
        const [projRes, teamRes] = await Promise.all([
          fetch('/api/team-lead/projects', { headers: { 'Authorization': `Bearer ${token()}` } }),
          fetch('/api/team-lead/team-members', { headers: { 'Authorization': `Bearer ${token()}` } })
        ]);
        if (projRes.ok) setProjectsData(await projRes.json());
        if (teamRes.ok) setTeamMembers(await teamRes.json());
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjectsAndTeam();
  }, []);

  const fetchBacklog = async (projectId) => {
    try {
      const res = await fetch(`/api/team-lead/projects/${projectId}/backlog`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      if (res.ok) {
        const tasks = await res.json();
        setProductBacklog(tasks.map(t => ({
          id: String(t.id),
          title: t.title,
          points: t.sp || 1,
          okr: 'Q2-Obj',
          description: t.description || '',
          priority: (t.priority || 'Medium').charAt(0).toUpperCase() + (t.priority || 'Medium').slice(1),
          assignee: t.user_id ? String(t.user_id) : 'Select Team Member...',
          project: t.project || '',
          labels: 'task',
          criteria: Array.isArray(t.acceptance)
            ? t.acceptance.join('\n')
            : (typeof t.acceptance === 'string' && t.acceptance.trim() !== ''
              ? (() => {
                  try {
                    const parsed = JSON.parse(t.acceptance);
                    return Array.isArray(parsed) ? parsed.join('\n') : String(parsed);
                  } catch (e) {
                    return t.acceptance;
                  }
                })()
              : '')
        })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMilestones = async (projectId) => {
    try {
      const res = await fetch(`/api/team-lead/projects/${projectId}/milestones`, {
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      if (res.ok) {
        setMilestonesData(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeProject) {
      if (activeView === 'create_sprint') {
        fetchBacklog(activeProject.id);
      } else if (activeView === 'timeline') {
        fetchMilestones(activeProject.id);
      } else if (activeView === 'kanban') {
        fetchTasks();
      }
    }
  }, [activeProject, activeView]);

  // Fetch real tasks from backend for Kanban board
  const fetchTasks = async () => {
    setKanbanLoading(true);
    try {
      const res = await fetch('/api/team-lead/tasks', {
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      if (res.ok) {
        let tasks = await res.json();
        // Filter tasks so we only show those belonging to the currently active project!
        if (activeProject) {
          tasks = tasks.filter(t => t.project === activeProject.name);
        }
        // Map task status → kanban column
        const columns = { todo: [], inProgress: [], testing: [], rejected: [], pr: [] };
        tasks.forEach(t => {
          const card = {
            id: String(t.id),
            title: t.title,
            points: t.sp,
            priority: t.priority || 'medium',
            assignee: t.user_id ? String(t.user_id) : 'UN',
            blocked: t.pr_status === 'rejected',
            date: t.due || '',
            progress: t.status === 'pr' ? 90 : t.status === 'testing' ? 70 : t.status === 'in-progress' ? 50 : 0,
            dbId: t.id
          };
          if (t.status === 'pending')          columns.todo.push(card);
          else if (t.status === 'in-progress') columns.inProgress.push(card);
          else if (t.status === 'testing')     columns.testing.push(card);
          else if (t.status === 'blocked')     columns.rejected.push(card);
          else if (t.status === 'pr')          columns.pr.push(card);
          else columns.todo.push(card);
        });
        setKanbanData(columns);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setKanbanLoading(false);
    }
  };

  useEffect(() => {
    if (activeView === 'kanban') {
      fetchTasks();
    }
  }, [activeView]);

  useEffect(() => {
    const handleNewTask = (e) => {
      const task = e.detail;
      setKanbanData(prev => ({
        ...prev,
        todo: [...prev.todo, task]
      }));
    };
    window.addEventListener('add_kanban_task', handleNewTask);
    return () => window.removeEventListener('add_kanban_task', handleNewTask);
  }, []);

  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);

  const getAssigneeDisplay = (assigneeStr) => {
    if (!assigneeStr || assigneeStr === 'Select Team Member...' || assigneeStr === 'UN') return { avatar: '?', name: 'Unassigned' };
    const member = teamMembers.find(m => String(m.id) === assigneeStr || m.name === assigneeStr);
    if (member) return { avatar: member.name.substring(0, 2).toUpperCase(), name: member.name };
    return { avatar: assigneeStr.substring(0, 2).toUpperCase(), name: assigneeStr };
  };

  const handleDragStart = (e, taskId, sourceCol) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.setData('sourceCol', sourceCol);
  };

  const handleDrop = async (e, targetCol) => {
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

      const statusMap = {
        todo: 'pending',
        inProgress: 'in-progress',
        codeReview: 'blocked',
        testing: 'pending',
        completed: 'done'
      };

      try {
        await fetch(`/api/team-lead/tasks/${task.dbId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token()}`
          },
          body: JSON.stringify({ status: statusMap[targetCol] || 'pending' })
        });
      } catch (err) {
        console.error('Failed to update task status:', err);
      }
    }
  };

  const allowDrop = (e) => {
    e.preventDefault();
  };

  const handleSprintDragStart = (e, item, source) => {
    e.dataTransfer.setData('itemId', item.id);
    e.dataTransfer.setData('source', source);
  };

  const handleSprintDrop = (e, target) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('itemId');
    const source = e.dataTransfer.getData('source');

    if (source && source !== target) {
      if (source === 'product' && target === 'sprint') {
        const item = productBacklog.find(i => i.id === itemId);
        if(item) {
          setProductBacklog(prev => prev.filter(i => i.id !== itemId));
          setSprintBacklog(prev => [...prev, item]);
        }
      } else if (source === 'sprint' && target === 'product') {
        const item = sprintBacklog.find(i => i.id === itemId);
        if(item) {
          setSprintBacklog(prev => prev.filter(i => i.id !== itemId));
          setProductBacklog(prev => [...prev, item]);
        }
      }
    }
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

        {projectsLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading projects from server...</div>
        ) : (
        <div className={styles.projectGrid}>
          {projectsData.filter(p => activeFilter === 'All' || (p.status || '').toLowerCase() === activeFilter.toLowerCase()).map(proj => {
            const budgetPct = proj.budget > 0 ? Math.min(100, Math.round((proj.used / proj.budget) * 100)) : 0;
            return (
            <div key={proj.id} className={styles.projectCard}>
              <div className={styles.pCardHeader}>
                <span className={`${styles.pBadge} ${styles[(proj.status || 'active').toLowerCase().replace(' ', '')]}`}>{proj.status}</span>
                <span className={styles.pClient}>{proj.client}</span>
              </div>
              <h3 className={styles.pTitle}>{proj.name}</h3>

              <div className={styles.pStats}>
                <div className={styles.pStatItem}>
                  <Calendar size={14} /> Due {proj.deadline || 'TBD'}
                </div>
                <div className={styles.pStatItem}>
                  ₹{(proj.used/1000).toFixed(0)}K / ₹{(proj.budget/1000).toFixed(0)}K
                </div>
              </div>

              <div className={styles.pProgressBox}>
                <div className={styles.pProgressText}>
                  <span>Budget Used</span>
                  <strong>{budgetPct}%</strong>
                </div>
                <div className={styles.pProgressBar}>
                  <div className={styles.pProgressFill} style={{ width: `${budgetPct}%`, background: budgetPct > 90 ? '#ef4444' : budgetPct > 75 ? '#f59e0b' : undefined }}></div>
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
            );
          })}
        </div>
        )}
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
            <input 
              type="text" 
              placeholder="e.g. Sprint 42: Alpha Release" 
              value={sprintName} 
              onChange={(e) => setSprintName(e.target.value)} 
            />
          </div>
          <div className={styles.formGroup}>
            <label>Sprint Goal</label>
            <textarea 
              placeholder="What are we trying to achieve?" 
              rows="3"
              value={sprintGoal}
              onChange={(e) => setSprintGoal(e.target.value)}
            ></textarea>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Story Points Target</label>
            <input 
              type="number" 
              placeholder="e.g. 50" 
              value={spTarget}
              onChange={(e) => setSpTarget(parseInt(e.target.value) || 0)}
            />
          </div>
          
          {/* Sprint Backlog Dropzone */}
          <div 
            onDragOver={allowDrop}
            onDrop={(e) => handleSprintDrop(e, 'sprint')}
            style={{
              border: '2px dashed #3b82f6',
              borderRadius: '8px',
              padding: '16px',
              minHeight: '150px',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '10px',
              marginBottom: '10px'
            }}
          >
            <label style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
              Sprint Backlog ({sprintBacklog.length} items)
            </label>
            {sprintBacklog.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '30px 0', border: '1px dashed #e2e8f0', borderRadius: '6px', background: '#fff' }}>
                Drag tasks from Product Backlog here to add them to this sprint
              </div>
            ) : (
              sprintBacklog.map(item => (
                <div 
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleSprintDragStart(e, item, 'sprint')}
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    fontSize: '13px',
                    cursor: 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                  }}
                >
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.title}</span>
                  <span style={{ fontSize: '11px', background: '#eff6ff', color: '#3b82f6', padding: '3px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    {item.points} pts
                  </span>
                </div>
              ))
            )}
          </div>

          <button 
            className={styles.startSprintBtn}
            onClick={async () => {
              if (sprintBacklog.length > 0) {
                const taskIds = sprintBacklog.map(item => parseInt(item.id.replace('t', '')));
                
                try {
                  const res = await fetch('/api/team-lead/tasks/batch-update', {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token()}`
                    },
                    body: JSON.stringify({
                      task_ids: taskIds,
                      sprint: sprintName,
                      status: 'pending'
                    })
                  });

                  if (res.ok) {
                    const newTasks = sprintBacklog.map(item => {
                      const assignedUser = item.assignee === 'Select Team Member...' || !item.assignee ? 'Unassigned' : item.assignee;
                      const member = teamMembers.find(m => String(m.id) === assignedUser || m.name === assignedUser);
                      const initials = member ? member.name.substring(0, 2).toUpperCase() : (assignedUser !== 'Unassigned' ? assignedUser.substring(0, 2).toUpperCase() : 'UN');
                      return {
                        id: String(item.id),
                        dbId: parseInt(item.id),
                        title: item.title,
                        points: item.points,
                        priority: item.priority || 'Medium',
                        assignee: assignedUser,
                        blocked: false,
                        progress: 0,
                        date: endDate || ''
                      };
                    });

                    setKanbanData(prev => ({
                      ...prev,
                      todo: [...prev.todo, ...newTasks]
                    }));

                    setSprintBacklog([]);
                    setActiveView('kanban');
                  }
                } catch (err) {
                  console.error('Failed to start sprint', err);
                }
              } else {
                setActiveView('kanban');
              }
            }}
          >
            <Play size={16} /> Start Sprint
          </button>
        </div>
      </div>

      <div 
        className={styles.backlogSection}
        onDragOver={allowDrop}
        onDrop={(e) => handleSprintDrop(e, 'product')}
      >
        <div className={styles.backlogHeader}>
          <h3 className={styles.sectionTitle}>Product Backlog</h3>
          <p className={styles.backlogHelp}>Available backlog items.</p>
        </div>
        <div className={styles.backlogList}>
          {productBacklog.length === 0 && (
            <div className={styles.emptyDropzone}>
              No items in product backlog
            </div>
          )}
          {productBacklog.map(item => (
            <div 
              key={item.id} 
              draggable
              onDragStart={(e) => handleSprintDragStart(e, item, 'product')}
              className={`${styles.backlogItem} ${selectedTaskDetails?.id === item.id ? styles.activeBacklogItem : ''}`} 
              onClick={() => setSelectedTaskDetails({...item, source: 'backlog'})}
            >
              <div className={styles.bItemHeader}>
                <span className={styles.bItemTitle}>{item.title}</span>
                <div style={{ position: 'relative' }}>
                  <MoreVertical 
                    size={14} 
                    className={styles.dragIcon} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenDropdownId(openDropdownId === item.id ? null : item.id);
                    }} 
                  />
                  {openDropdownId === item.id && (
                    <div className={styles.dropdownMenu}>
                      <button className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setSelectedTaskDetails(item); setOpenDropdownId(null); }}>Show Details</button>
                      <button className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }}>Edit</button>
                    </div>
                  )}
                </div>
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

  const getPriorityStyle = (prio) => {
    const p = prio.toUpperCase();
    switch (p) {
      case 'CRITICAL': 
      case 'HIGH': return { color: '#ef4444', bg: '#fef2f2', border: '#ef4444' };
      case 'MEDIUM': return { color: '#0f172a', bg: '#f1f5f9', border: '#0f172a' };
      case 'LOW': return { color: '#10b981', bg: '#dcfce7', border: '#10b981' };
      default: return { color: '#64748b', bg: '#f1f5f9', border: '#64748b' };
    }
  };

  const renderKanban = () => {
    const columns = [
      { id: 'todo',       title: 'TODO',        Icon: HelpCircle },
      { id: 'inProgress', title: 'IN-PROGRESS',  Icon: Play },
      { id: 'testing',    title: 'TESTING',      Icon: Search },
      { id: 'rejected',   title: 'REJECTED',     Icon: XCircle },
      { id: 'pr',         title: 'PR',           Icon: GitPullRequest },
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
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <div className={styles.kColIcon}><col.Icon size={14} /></div>
                <h4>{col.title}</h4>
              </div>
              <span className={styles.kanbanCount}>{kanbanData[col.id].length}</span>
            </div>
            <div className={styles.kanbanTasks}>
              {kanbanData[col.id].map(task => {
                const prioStyle = getPriorityStyle(task.priority);
                return (
                  <div
                    key={task.id}
                    className={styles.kTaskCard}
                    style={{ borderLeft: `4px solid ${prioStyle.border}` }}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id, col.id)}
                    onClick={() => setSelectedTaskDetails({...task, colId: col.id})}
                  >
                    <div className={styles.kTaskTitleRow}>
                      <AlertCircle size={14} style={{ color: '#ef4444', minWidth: '14px' }} />
                      <h5 className={styles.kTaskTitle}>{task.title}</h5>
                      <ChevronRight size={14} style={{ color: '#94a3b8', minWidth: '14px' }} />
                    </div>
                    
                    <div className={styles.kTaskMetaRow}>
                      <div className={styles.kMetaLeft}>
                        <span className={styles.kPriorityBadge} style={{ color: prioStyle.color, backgroundColor: prioStyle.bg }}>
                          {task.priority.toUpperCase()}
                        </span>
                        <span className={styles.kPoints}>{task.points} pts</span>
                        <div className={styles.kDateBox}>
                          <AlertTriangle size={12} style={{ color: '#94a3b8' }} />
                          <span>{task.date}</span>
                        </div>
                      </div>
                      <span className={styles.kProgressBadge}>
                        {task.progress}% done
                      </span>
                    </div>
                  </div>
                );
              })}
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
            <div className={styles.tlColDate}>{milestone.dueDate || milestone.due_date}</div>
            <div className={styles.tlColStatus}>
              <span className={`${styles.mStatusBadge} ${styles[milestone.status]}`}>{milestone.status.replace('-', ' ')}</span>
            </div>
            <div className={styles.tlColTasks}>{(milestone.tasks !== undefined ? milestone.tasks : milestone.tasks_count) || 0} tasks</div>
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

      {/* Backlog Item Form Modal */}
      {selectedTaskDetails && selectedTaskDetails.source === 'backlog' && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTaskDetails(null)}>
          <div className={styles.modalContentLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.mHeaderTitle}>Backlog Item Details</h2>
              <button className={styles.closeModalBtn} onClick={() => setSelectedTaskDetails(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>Task Title</label>
                <input type="text" defaultValue={selectedTaskDetails.title} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>Assignee</label>
                <select defaultValue={selectedTaskDetails.assignee} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc', appearance: 'auto' }}>
                  <option value="Select Team Member...">Select Team Member...</option>
                  {teamMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>Description</label>
              <textarea defaultValue={selectedTaskDetails.description} rows="4" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>Story Points</label>
                <input type="number" defaultValue={selectedTaskDetails.points} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>Priority</label>
                <select defaultValue={selectedTaskDetails.priority} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc', appearance: 'auto' }}>
                  <option>Critical</option>
                  <option>High</option>
                  <option>Medium</option>
                  <option>Low</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>Project</label>
                <select defaultValue={selectedTaskDetails.project} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc', appearance: 'auto' }}>
                  <option>NSG-ERP Core</option>
                  <option>Infrastructure</option>
                  <option>Video Huddles v2</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>Sprint ID</label>
                <select defaultValue="Backlog" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc', appearance: 'auto' }}>
                  <option>Backlog</option>
                  <option>Sprint 42</option>
                  <option>Sprint 43</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>Labels (Comma separated)</label>
              <input type="text" defaultValue={selectedTaskDetails.labels} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc' }} />
            </div>

            <div style={{ marginTop: '16px' }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '13px', color: '#0f172a', marginBottom: '6px' }}>Acceptance Criteria</label>
              <textarea defaultValue={selectedTaskDetails.criteria} rows="4" style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc', resize: 'vertical' }} />
            </div>
          </div>
        </div>
      )}

      {/* Kanban Task Details Modal */}
      {selectedTaskDetails && selectedTaskDetails.source !== 'backlog' && (
        <div className={styles.modalOverlay} onClick={() => setSelectedTaskDetails(null)}>
          <div className={styles.modalContentLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.mHeaderTitle}>{selectedTaskDetails.title}</h2>
              <button className={styles.closeModalBtn} onClick={() => setSelectedTaskDetails(null)}>
                <X size={24} />
              </button>
            </div>
            
            <div className={styles.modalTwoColumn}>
              {/* LEFT COLUMN */}
              <div className={styles.modalLeft}>
                <div className={styles.mBoxedRow}>
                  <div className={styles.mBoxLeft}>
                    <div className={styles.mIconWrapper} style={{ backgroundColor: '#eff6ff', color: '#3b82f6' }}>
                      <Menu size={16} />
                    </div>
                    <span className={styles.mBoxTitle}>ABOUT TASK</span>
                    <span className={styles.mBoxSnippet}>Verify negative dates and overlaps li...</span>
                  </div>
                  <ChevronDown size={16} style={{ color: '#cbd5e1' }} />
                </div>
                
                <div className={styles.mBoxedRow}>
                  <div className={styles.mBoxLeft}>
                    <div className={styles.mIconWrapper} style={{ backgroundColor: '#dcfce7', color: '#10b981' }}>
                      <CheckSquare size={16} />
                    </div>
                    <span className={styles.mBoxTitle}>SUBTASK CHECKLIST</span>
                    <span className={styles.mSubtaskBadge}>50% Completed</span>
                    <span className={styles.mBoxSnippet}>1/2 done</span>
                  </div>
                  <ChevronDown size={16} style={{ color: '#cbd5e1' }} />
                </div>
                
                <div className={styles.mBoxedRow}>
                  <div className={styles.mBoxLeft}>
                    <div className={styles.mIconWrapper} style={{ backgroundColor: '#f3e8ff', color: '#a855f7' }}>
                      <Paperclip size={16} />
                    </div>
                    <span className={styles.mBoxTitle}>ATTACHMENTS</span>
                    <span className={styles.mAttachmentBadge}>0 Files Attached</span>
                  </div>
                  <ChevronDown size={16} style={{ color: '#cbd5e1' }} />
                </div>
                
                <div className={styles.mBoxedRow}>
                  <div className={styles.mBoxLeft}>
                    <div className={styles.mIconWrapper} style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                      <MessageSquare size={16} />
                    </div>
                    <span className={styles.mBoxTitle}>DESCRIPTION</span>
                    <span className={styles.mDescBadge}>Pending</span>
                  </div>
                  <ChevronDown size={16} style={{ color: '#cbd5e1' }} />
                </div>
              </div>
              
              {/* RIGHT COLUMN */}
              <div className={styles.modalRight}>
                <div className={styles.mRightHeader}>
                  <h4 className={styles.mRightTitle}>TASK PARAMETERS</h4>
                  <button className={styles.mPortalBtn}>EMPLOYEE PORTAL VIEW</button>
                </div>
                
                <div className={styles.mStatusSection}>
                  <span className={styles.mLabel}>WORKFLOW STATUS</span>
                  <select 
                    className={styles.mStatusDropdownNative} 
                    defaultValue={
                      selectedTaskDetails.colId === 'inProgress' ? 'In Progress' :
                      selectedTaskDetails.colId === 'codeReview' ? 'Code Review' :
                      selectedTaskDetails.colId === 'testing' ? 'Testing' :
                      selectedTaskDetails.colId === 'completed' ? 'Completed' :
                      'To Do'
                    }
                  >
                    <option>To Do</option>
                    <option>In Progress</option>
                    <option>Code Review</option>
                    <option>Testing</option>
                    <option>Completed</option>
                  </select>
                </div>
                
                <div className={styles.mMetaList}>
                  <div className={styles.mMetaRow}>
                    <div className={styles.mMetaLabel}><KanbanSquare size={14} /> Project Name</div>
                    <div className={styles.mMetaValueBox}>HMNS ERP Platform</div>
                  </div>
                  <div className={styles.mMetaRow}>
                    <div className={styles.mMetaLabel}><Menu size={14} /> Task Name</div>
                    <div className={styles.mMetaValueBox}>{selectedTaskDetails.title}</div>
                  </div>
                  <div className={styles.mMetaRow}>
                    <div className={styles.mMetaLabel}><User size={14} /> Assignee</div>
                    <div className={styles.mAssigneeValue}>
                      <div className={styles.mAssigneeAvatar}>
                        {selectedTaskDetails ? getAssigneeDisplay(selectedTaskDetails.assignee).avatar : ''}
                      </div>
                      <span style={{fontWeight: 700, fontSize: '13px', color: '#0f172a'}}>
                        {selectedTaskDetails ? getAssigneeDisplay(selectedTaskDetails.assignee).name : ''}
                      </span>
                    </div>
                  </div>
                  <div className={styles.mMetaRow}>
                    <div className={styles.mMetaLabel}><Info size={14} /> Priority Level</div>
                    <div className={styles.mPriorityValue}>{selectedTaskDetails.priority.toUpperCase()}</div>
                  </div>
                  <div className={styles.mMetaRow}>
                    <div className={styles.mMetaLabel}><Clock size={14} /> Target Deadline</div>
                    <div className={styles.mMetaValueBox}>{selectedTaskDetails.date || '2026-05-27'}</div>
                  </div>
                  <div className={styles.mMetaRow}>
                    <div className={styles.mMetaLabel}><ListTodo size={14} /> Effort Estimate</div>
                    <div className={styles.mMetaValueBox}>8h</div>
                  </div>
                  <div className={styles.mMetaRow} style={{alignItems: 'flex-start'}}>
                    <div className={styles.mMetaLabel} style={{marginTop: '4px'}}><Tag size={14} /> Workspace Labels</div>
                    <div className={styles.mLabelsList}>
                      <span className={styles.mLabelBadge}>React 19</span>
                      <span className={styles.mLabelBadge}>CSS Modules</span>
                      <span className={styles.mLabelBadge}>ERP-v2</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.mProgressCard}>
                  <div className={styles.mProgHeader}>
                    <span className={styles.mProgTitle}>Overall Progress</span>
                    <span className={styles.mProgPercent}>{selectedTaskDetails.progress || 50}%</span>
                  </div>
                  <div className={styles.mProgBarBg}>
                    <div className={styles.mProgBarFill} style={{ width: `${selectedTaskDetails.progress || 50}%` }}></div>
                  </div>
                  <div className={styles.mProgFooter}>
                    <span>1 of 2 subtasks done</span>
                    <span>Desc Pending</span>
                  </div>
                </div>
                
                <div className={styles.mSecurityNotice}>
                  <h5 className={styles.mSecTitle}>SECURITY NOTICE</h5>
                  <p className={styles.mSecText}>
                    Deadlines, priorities, and effort allocation rules are locked under organizational policies and are editable only by managers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
