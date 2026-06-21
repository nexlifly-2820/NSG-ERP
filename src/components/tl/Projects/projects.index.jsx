import React, { useState, useEffect } from 'react';
import styles from './projects.module.css';
import { Briefcase, Calendar, Users, ListTodo, KanbanSquare, GitCommit, Search, Plus, Play, MoreVertical, Flag, Clock, X, HelpCircle, Eye, CheckCircle, AlertCircle, ChevronRight, AlertTriangle, Menu, CheckSquare, Paperclip, MessageSquare, User, Tag, Info, Lock, ChevronDown, XCircle, GitPullRequest, Edit, Trash2 } from 'lucide-react';
import { useCompany } from '../../common/CompanyContext';

const Projects = () => {
  const { companyName } = useCompany();
  const [activeProject, setActiveProject] = useState(null);
  const [activeView, setActiveView] = useState('board'); // board, create_sprint, kanban, timeline

  // 1. My Projects Board Data — from backend
  const [projectsData, setProjectsData] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState('All');

  // Sprint Config States
  const [sprintName, setSprintName] = useState('');
  const [sprintGoal, setSprintGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [spTarget, setSpTarget] = useState(40);
  const [editingSprintId, setEditingSprintId] = useState(null);
  const [sprintPage, setSprintPage] = useState(1);

  useEffect(() => {
    setSprintPage(1);
  }, [activeProject]);

  // 2. Create Sprint Form Data
  const [productBacklog, setProductBacklog] = useState([]);
  const [milestonesData, setMilestonesData] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [sprintBacklog, setSprintBacklog] = useState([]);

  // Milestone Form States
  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneDueDate, setMilestoneDueDate] = useState('');
  const [selectedMilestoneTasks, setSelectedMilestoneTasks] = useState([]);
  const [projectTasks, setProjectTasks] = useState([]);
  const [milestoneTaskSprintFilter, setMilestoneTaskSprintFilter] = useState('All');


  // 3. Kanban Task Board Data — from backend
  const [kanbanData, setKanbanData] = useState({
    todo: [],
    inProgress: [],
    testing: [],
    rejected: [],
    pr: []
  });
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [expandedColumns, setExpandedColumns] = useState({});  // tracks which columns show all cards
  const [fullPageColumn, setFullPageColumn] = useState(null); // { id, title, cards } for full-page view
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [backendSprints, setBackendSprints] = useState(undefined);
  const [savedSprints, setSavedSprints] = useState(() => {
    if (backendSprints !== undefined) {
      return backendSprints;
    }
    const local = localStorage.getItem('nsg_saved_sprints');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.length > 0) return parsed;
    }
    return [];
  });
  const [selectedSprintFilter, setSelectedSprintFilter] = useState('All');

  const token = () => localStorage.getItem('nsg_jwt_token');

  // Fetch real projects, team, and sprints from backend
  useEffect(() => {
    const fetchInitialData = async () => {
      setProjectsLoading(true);
      try {
        const [projRes, teamRes, sprintRes] = await Promise.all([
          fetch('/api/team-lead/projects', { headers: { 'Authorization': `Bearer ${token()}` } }),
          fetch('/api/team-lead/team-members', { headers: { 'Authorization': `Bearer ${token()}` } }),
          fetch('/api/team-lead/sprints', { headers: { 'Authorization': `Bearer ${token()}` } })
        ]);
        if (projRes.ok) setProjectsData(await projRes.json());
        if (teamRes.ok) setTeamMembers(await teamRes.json());
        if (sprintRes.ok) {
          const sprints = await sprintRes.json();
          if (sprints && sprints.length > 0) {
            setSavedSprints(sprints);
            localStorage.setItem('nsg_saved_sprints', JSON.stringify(sprints));
          } else {
            setSavedSprints([]);
            localStorage.setItem('nsg_saved_sprints', JSON.stringify([]));
          }
        }
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchInitialData();
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

  const fetchTasksForTimeline = async () => {
    try {
      const res = await fetch('/api/team-lead/tasks', {
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      if (res.ok) {
        const allTasks = await res.json();
        const filtered = allTasks.filter(t => t.project === activeProject?.name);
        setProjectTasks(filtered);
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
        fetchTasksForTimeline();
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
            dbId: t.id,
            sprint: t.sprint,
            description: t.description || '',
            attachments: t.attachments || [],
            custom_data: t.custom_data || null
          };
          if (t.status === 'pending') columns.todo.push(card);
          else if (t.status === 'in-progress') columns.inProgress.push(card);
          else if (t.status === 'testing') columns.testing.push(card);
          else if (t.status === 'blocked') columns.rejected.push(card);
          else if (t.status === 'pr') columns.pr.push(card);
          else if (t.status === 'assignee') { /* skip — not yet accepted */ }
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
        if (item) {
          setProductBacklog(prev => prev.filter(i => i.id !== itemId));
          setSprintBacklog(prev => [...prev, item]);
        }
      } else if (source === 'sprint' && target === 'product') {
        const item = sprintBacklog.find(i => i.id === itemId);
        if (item) {
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
                      ₹{(proj.used / 1000).toFixed(0)}K / ₹{(proj.budget / 1000).toFixed(0)}K
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
                    <button className={styles.pBtnAction} onClick={() => { setActiveProject(proj); setActiveView('create_sprint'); }}>
                      <Plus size={14} /> Sprint
                    </button>
                    <button className={styles.pBtnAction} onClick={() => { setActiveProject(proj); setActiveView('kanban'); }}>
                      <KanbanSquare size={14} /> Board
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

  const renderCreateSprint = () => {
    return (
      <div style={{ padding: '24px', width: '100%', boxSizing: 'border-box' }}>
        {/* Header row */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Sprint Management</h3>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Manage sprints and backlog for {activeProject?.name}</p>
        </div>

        {/* Side by side: Sprint List / Sprint Configuration + Product Backlog */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch' }}>

          {/* LEFT CARD */}
          {!showSprintModal ? (
            /* LEFT — Sprint List Card */
            <div style={{
              flex: 1, background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '12px', padding: '24px', minHeight: '650px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Sprints</h3>
                <button
                  onClick={() => {
                    setEditingSprintId(null);
                    setSprintName('');
                    setSprintGoal('');
                    setStartDate('');
                    setEndDate('');
                    setSpTarget(40);
                    setShowSprintModal(true);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: '#8b5cf6', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
                    fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Add Sprint
                </button>
              </div>
              {savedSprints.filter(s => s.project_id === activeProject?.id).length === 0 ? (
                <div style={{
                  textAlign: 'center', padding: '60px 20px', color: '#94a3b8',
                  border: '2px dashed #e2e8f0', borderRadius: '10px', flex: 1,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}>
                  <p style={{ fontSize: '14px', marginBottom: '6px' }}>No sprints yet</p>
                  <p style={{ fontSize: '12px' }}>Click "+ Add Sprint" to get started</p>
                </div>
              ) : (
                (() => {
                  const projectSprints = savedSprints.filter(s => s.project_id === activeProject?.id);
                  const SPRINTS_PER_PAGE = 4;
                  const totalPages = Math.ceil(projectSprints.length / SPRINTS_PER_PAGE);
                  const currentSprints = projectSprints.slice((sprintPage - 1) * SPRINTS_PER_PAGE, sprintPage * SPRINTS_PER_PAGE);

                  return (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1, overflowY: 'auto' }}>
                        {currentSprints.map(sprint => (
                          <div key={sprint.id} style={{
                      background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px',
                      padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>{sprint.name}</span>
                          <span style={{
                            fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                            background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe'
                          }}>
                            {sprint.sprintId}
                          </span>
                        </div>
                        {sprint.goal && <span style={{ fontSize: '12px', color: '#64748b' }}>{sprint.goal}</span>}
                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                          {sprint.start && <span style={{ fontSize: '11px', color: '#94a3b8' }}>Start: {sprint.start}</span>}
                          {sprint.end && <span style={{ fontSize: '11px', color: '#94a3b8' }}>End: {sprint.end}</span>}
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>SP Target: {sprint.sp}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => {
                            setEditingSprintId(sprint.id);
                            setSprintName(sprint.name);
                            setSprintGoal(sprint.goal || '');
                            setStartDate(sprint.start || '');
                            setEndDate(sprint.end || '');
                            setSpTarget(sprint.sp || 40);
                            setShowSprintModal(true);
                          }}
                          style={{ fontSize: '12px', background: 'transparent', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit size={12} />Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Are you sure you want to delete this sprint?')) return;
                            try {
                              const res = await fetch(`/api/team-lead/sprints/${sprint.id}`, {
                                method: 'DELETE',
                                headers: { 'Authorization': `Bearer ${token()}` }
                              });
                              if (res.ok) {
                                setSavedSprints(prev => {
                                  const updated = prev.filter(s => s.id !== sprint.id);
                                  localStorage.setItem('nsg_saved_sprints', JSON.stringify(updated));
                                  return updated;
                                });
                              }
                            } catch(err) { console.error('Delete sprint failed', err); }
                          }}
                          style={{ fontSize: '12px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={12} />Delete
                        </button>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px',
                          background: sprint.status === 'Active' ? '#dcfce7' : '#eff6ff',
                          color: sprint.status === 'Active' ? '#16a34a' : '#3b82f6'
                        }}>{sprint.status}</span>
                        <button
                          onClick={() => { setActiveView('kanban'); }}
                          style={{ fontSize: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Play size={12} />Start
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      onClick={() => setSprintPage(prev => Math.max(prev - 1, 1))}
                      disabled={sprintPage === 1}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: sprintPage === 1 ? '#f8fafc' : '#fff', color: sprintPage === 1 ? '#94a3b8' : '#334155', cursor: sprintPage === 1 ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}
                    >
                      Previous
                    </button>
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>
                      Page {sprintPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setSprintPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={sprintPage === totalPages}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: sprintPage === totalPages ? '#f8fafc' : '#fff', color: sprintPage === totalPages ? '#94a3b8' : '#334155', cursor: sprintPage === totalPages ? 'not-allowed' : 'pointer', fontSize: '13px', fontWeight: 600 }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            );
          })()
        )}
      </div>
          ) : (
            /* LEFT — Sprint Configuration Card (Inline, replaces Sprints list) */
            <div style={{
              flex: 1, background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '12px', padding: '24px', minHeight: '650px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column',
              position: 'relative'
            }}>

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{editingSprintId ? 'Edit Sprint' : 'Sprint Configuration'}</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Sprint Name</label>
                  <input type="text" placeholder="e.g. Sprint 44" value={sprintName} onChange={(e) => setSprintName(e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Sprint Goal</label>
                  <textarea placeholder="What are we trying to achieve?" rows="3" value={sprintGoal} onChange={(e) => setSprintGoal(e.target.value)}></textarea>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Start Date</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div className={styles.formGroup} style={{ flex: 1 }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>End Date</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div className={styles.formGroup}>
                  <label style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>Story Points Target</label>
                  <input type="text" placeholder="e.g. 40" value={spTarget} onChange={(e) => setSpTarget(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button
                  onClick={() => setShowSprintModal(false)}
                  style={{
                    padding: '12px 24px',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontWeight: 600,
                    color: '#64748b'
                  }}
                >
                  Cancel
                </button>
                <button
                  className={styles.startSprintBtn}
                  style={{ background: '#8b5cf6', marginTop: 0, padding: '12px 24px' }}
                  onClick={async () => {
                    if (!sprintName.trim()) { alert('Please enter a sprint name.'); return; }
                    
                    if (editingSprintId) {
                      const updatedSprintData = { name: sprintName, goal: sprintGoal, start_date: startDate, end_date: endDate, sp_target: spTarget };
                      setSavedSprints(prev => {
                        const updated = prev.map(s => s.id === editingSprintId ? { ...s, name: sprintName, goal: sprintGoal, start: startDate, end: endDate, sp: spTarget } : s);
                        localStorage.setItem('nsg_saved_sprints', JSON.stringify(updated));
                        return updated;
                      });
                      try {
                        const res = await fetch(`/api/team-lead/sprints/${editingSprintId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
                          body: JSON.stringify(updatedSprintData)
                        });
                        if (res.ok) {
                          const saved = await res.json();
                          setSavedSprints(prev => {
                            const updated = prev.map(s => s.id === editingSprintId ? saved : s);
                            localStorage.setItem('nsg_saved_sprints', JSON.stringify(updated));
                            return updated;
                          });
                        }
                      } catch (_) {}
                    } else {
                      const generatedId = `SPR-${Date.now().toString().slice(-6)}`;
                      const tempId = Date.now();
                      const newSprint = { id: tempId, sprintId: generatedId, name: sprintName, goal: sprintGoal, start: startDate, end: endDate, sp: spTarget, status: 'Planning', project_id: activeProject?.id };
                      setSavedSprints(prev => {
                        const updated = [...prev, newSprint];
                        localStorage.setItem('nsg_saved_sprints', JSON.stringify(updated));
                        return updated;
                      });
                      try {
                        const res = await fetch('/api/team-lead/sprints', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` },
                          body: JSON.stringify({ name: sprintName, goal: sprintGoal, start_date: startDate, end_date: endDate, sp_target: spTarget, project_id: activeProject?.id })
                        });
                        if (res.ok) {
                          const saved = await res.json();
                          setSavedSprints(prev => {
                            const filtered = prev.filter(s => s.id !== tempId);
                            const updated = [...filtered, saved];
                            localStorage.setItem('nsg_saved_sprints', JSON.stringify(updated));
                            return updated;
                          });
                        }
                      } catch (_) {}
                    }
                    setShowSprintModal(false);
                    setEditingSprintId(null);
                  }}
                >
                  <Plus size={16} /> Save Sprint
                </button>
              </div>
            </div>
          )}

          {/* RIGHT — Product Backlog Card */}
          <div style={{
            flex: 1, background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: '12px', padding: '24px', minHeight: '650px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Product Backlog</h3>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '4px 0 0' }}>Managed by the CEO portal.</p>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                let atts = [];
                try {
                  if (activeProject && activeProject.attachments) {
                    atts = JSON.parse(activeProject.attachments);
                  }
                } catch(e) {}
                
                if (atts.length === 0) {
                  return (
                    <div style={{
                      border: '2px dashed #e2e8f0', borderRadius: '10px',
                      padding: '60px 20px', textAlign: 'center', color: '#94a3b8',
                      background: '#f8fafc', flex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <p style={{ fontSize: '13px', margin: 0 }}>No attachments available for this project.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#334155', margin: '0 0 4px 0' }}>Project Attachments</p>
                    {atts.map((att, i) => (
                      <div key={i} style={{fontSize: '13px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center'}}>
                        <a href={att.url} target="_blank" rel="noreferrer" style={{color: '#2563eb', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px'}}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                          {att.name}
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

        </div>
      </div>
    );
  };

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
      { id: 'todo', title: 'TODO', Icon: HelpCircle },
      { id: 'inProgress', title: 'IN-PROGRESS', Icon: Play },
      { id: 'testing', title: 'TESTING', Icon: Search },
      { id: 'rejected', title: 'REJECTED', Icon: XCircle },
      { id: 'pr', title: 'PR', Icon: GitPullRequest },
    ];

    // Filter tasks based on selected Sprint ID
    const filteredKanbanData = {};
    columns.forEach(col => {
      filteredKanbanData[col.id] = (kanbanData[col.id] || []).filter(task => {
        if (selectedSprintFilter === 'All') return true;
        if (selectedSprintFilter === 'Backlog') return !task.sprint || task.sprint === 'Backlog' || task.sprint === '';
        
        // Find if task sprint matches selected Sprint name or ID
        const matchedSprint = savedSprints.find(s => s.sprintId === selectedSprintFilter || s.name === selectedSprintFilter);
        if (matchedSprint) {
          return task.sprint === matchedSprint.name || task.sprint === matchedSprint.sprintId;
        }
        return task.sprint === selectedSprintFilter;
      });
    });

    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
          {/* Sprint Filter Bar */}
          <div style={{
            display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: '12px',
            background: '#fff', padding: '12px 20px', borderRadius: '12px',
            border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Sprint Filter:</label>
            <select
              value={selectedSprintFilter}
              onChange={(e) => setSelectedSprintFilter(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                fontSize: '13px', color: '#0f172a', background: '#f8fafc',
                cursor: 'pointer', outline: 'none'
              }}
            >
              <option value="All">All Sprints</option>
              <option value="Backlog">Backlog / Unassigned</option>
              {savedSprints.filter(s => s.project_id === activeProject?.id).map(s => (
                <option key={s.id} value={s.sprintId || s.name}>
                  {s.name} ({s.sprintId || `SPR-${s.id}`})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.kanbanContainer}>
            {columns.map(col => (
              <div
                key={col.id}
                className={styles.kanbanColumn}
              >
                <div className={styles.kanbanColHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className={styles.kColIcon}><col.Icon size={14} /></div>
                    <h4>{col.title}</h4>
                  </div>
                  <span className={styles.kanbanCount}>{filteredKanbanData[col.id].length}</span>
                </div>
                <div className={styles.kanbanTasks}>
                  {(() => {
                    const allCards = filteredKanbanData[col.id];
                    const isExpanded = expandedColumns[col.id];
                    const LIMIT = 2;
                    const visibleCards = isExpanded ? allCards : allCards.slice(0, LIMIT);
                    const hasMore = allCards.length > LIMIT;
                    return (
                      <>
                        {visibleCards.map(task => {
                          const prioStyle = getPriorityStyle(task.priority);
                          return (
                            <div
                              key={task.id}
                              className={styles.kTaskCard}
                              style={{ borderLeft: `4px solid ${prioStyle.border}` }}
                              onClick={() => setSelectedTaskDetails({ ...task, colId: col.id })}
                            >
                              <div className={styles.kTaskTitleRow}>
                                <AlertCircle size={14} style={{ color: '#ef4444', minWidth: '14px' }} />
                                <h5 className={styles.kTaskTitle}>{task.title}</h5>
                                <ChevronRight size={14} style={{ color: '#94a3b8', minWidth: '14px' }} />
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8', margin: '4px 0 8px' }}>
                                Sprint: {task.sprint || 'Backlog'}
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
                        {hasMore && (
                          <button
                            onClick={() => setFullPageColumn({ id: col.id, title: col.title, cards: allCards })}
                            style={{
                              width: '100%', padding: '8px', marginTop: '6px',
                              background: '#eff6ff', color: '#3b82f6',
                              border: '1px solid #bfdbfe',
                              borderRadius: '8px', fontSize: '12px', fontWeight: 600,
                              cursor: 'pointer', transition: 'all 0.2s'
                            }}
                          >
                            {`▼ View All (${allCards.length})`}
                          </button>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full-page column overlay */}
        {fullPageColumn && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: '#f8fafc', display: 'flex', flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '18px 28px',
              background: '#0f172a', color: '#fff',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)'
            }}>
              <button
                onClick={() => setFullPageColumn(null)}
                style={{
                  background: '#1e293b', border: '1px solid #334155', color: '#94a3b8',
                  borderRadius: '8px', padding: '7px 16px', fontSize: '13px',
                  fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                ← Back
              </button>
              <div style={{ width: '1px', height: '28px', background: '#334155' }} />
              <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '0.04em' }}>
                {fullPageColumn.title}
              </span>
              <span style={{
                background: '#3b82f6', color: '#fff',
                borderRadius: '20px', padding: '2px 12px', fontSize: '13px', fontWeight: 700
              }}>
                {fullPageColumn.cards.length} Tasks
              </span>
            </div>

            {/* Task grid */}
            <div style={{
              flex: 1, overflowY: 'auto', padding: '28px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '16px', alignContent: 'start'
            }}>
              {fullPageColumn.cards.map(task => {
                const prioStyle = getPriorityStyle(task.priority);
                return (
                  <div
                    key={task.id}
                    style={{
                      background: '#fff', borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${prioStyle.border}`,
                      padding: '16px 18px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                      cursor: 'pointer'
                    }}
                    onClick={() => { setSelectedTaskDetails({ ...task, colId: fullPageColumn.id }); setFullPageColumn(null); }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ color: '#ef4444', fontSize: '14px', marginTop: '1px' }}>⊙</span>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#0f172a', flex: 1 }}>{task.title}</span>
                      <span style={{ color: '#94a3b8', fontSize: '13px' }}>›</span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '10px' }}>
                      Sprint: {task.sprint || 'Backlog'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                          color: prioStyle.color, background: prioStyle.bg
                        }}>{task.priority.toUpperCase()}</span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{task.points} pts</span>
                        <span style={{ fontSize: '11px', color: '#94a3b8' }}>📅 {task.date}</span>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 600, padding: '3px 10px',
                        borderRadius: '20px', background: '#ede9fe', color: '#7c3aed'
                      }}>{task.progress}% done</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </>
    );
  };

  const renderTimeline = () => {
    return (
      <div style={{ padding: '24px', width: '100%', boxSizing: 'border-box' }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Project Milestones</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>Track key phases and deliverables for {activeProject?.name}</p>
          </div>
          {!showMilestoneForm && (
            <button
              onClick={() => {
                setShowMilestoneForm(true);
                setMilestoneName('');
                setMilestoneDueDate('');
                setSelectedMilestoneTasks([]);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: '#8b5cf6', color: '#fff', border: 'none',
                borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              <Plus size={14} /> Add Milestone
            </button>
          )}
        </div>

        {/* Form and List Layout */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch', width: '100%' }}>
          
          {showMilestoneForm && (
            /* Left side: Add Milestone form card */
            <div style={{
              flex: '0 0 380px', background: '#fff', border: '1px solid #e2e8f0',
              borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', flexDirection: 'column', gap: '16px'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Create Milestone</h4>
              
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#374151', marginBottom: '6px' }}>Milestone Name</label>
                <input
                  type="text"
                  placeholder="e.g. Milestone 4: QA Signoff"
                  value={milestoneName}
                  onChange={(e) => setMilestoneName(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#374151', marginBottom: '6px' }}>Due Date</label>
                <input
                  type="date"
                  value={milestoneDueDate}
                  onChange={(e) => setMilestoneDueDate(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#374151', marginBottom: '6px' }}>Filter Tasks by Sprint</label>
                <select
                  value={milestoneTaskSprintFilter}
                  onChange={(e) => setMilestoneTaskSprintFilter(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc',
                    boxSizing: 'border-box', cursor: 'pointer', outline: 'none'
                  }}
                >
                  <option value="All">All Sprints</option>
                  {savedSprints.filter(s => s.project_id === activeProject?.id).map(s => (
                    <option key={s.id} value={s.sprintId || s.name}>
                      {s.name} ({s.sprintId || `SPR-${s.id}`})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '200px' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '12px', color: '#374151', marginBottom: '6px' }}>
                  Link Tasks ({selectedMilestoneTasks.length} selected)
                </label>
                <div style={{
                  border: '1.5px solid #e2e8f0', borderRadius: '8px', padding: '8px',
                  background: '#f8fafc', flex: 1, overflowY: 'auto', maxHeight: '250px',
                  display: 'flex', flexDirection: 'column', gap: '6px'
                }}>
                  {(() => {
                    const displayedTasks = projectTasks.filter(task => {
                      if (milestoneTaskSprintFilter === 'All') return true;
                      if (milestoneTaskSprintFilter === 'Backlog') return !task.sprint || task.sprint === 'Backlog' || task.sprint === '';
                      const matchedSprint = savedSprints.find(s => s.sprintId === milestoneTaskSprintFilter || s.name === milestoneTaskSprintFilter);
                      if (matchedSprint) {
                        return task.sprint === matchedSprint.name || task.sprint === matchedSprint.sprintId;
                      }
                      return task.sprint === milestoneTaskSprintFilter;
                    });

                    if (displayedTasks.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '12px' }}>
                          No tasks found in this sprint to link.
                        </div>
                      );
                    }

                    return displayedTasks.map(task => {
                      const isChecked = selectedMilestoneTasks.includes(task.id);
                      return (
                        <label
                          key={task.id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 10px', borderRadius: '6px', cursor: 'pointer',
                            background: isChecked ? '#eff6ff' : '#fff',
                            border: isChecked ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                            transition: 'all 0.2s', fontSize: '12px', fontWeight: 500
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMilestoneTasks([...selectedMilestoneTasks, task.id]);
                              } else {
                                setSelectedMilestoneTasks(selectedMilestoneTasks.filter(id => id !== task.id));
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <span style={{ color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {task.title}
                          </span>
                          <span style={{
                            fontSize: '10px', fontWeight: 600, padding: '2px 6px', borderRadius: '4px',
                            background: 
                              task.status === 'done' || task.status === 'completed' ? '#dcfce7' :
                              task.status === 'in-progress' || task.status === 'inprogress' ? '#eff6ff' :
                              task.status === 'testing' ? '#f3e8ff' :
                              task.status === 'blocked' || task.status === 'rejected' ? '#fee2e2' :
                              task.status === 'pr' ? '#fff7ed' : '#f1f5f9',
                            color: 
                              task.status === 'done' || task.status === 'completed' ? '#16a34a' :
                              task.status === 'in-progress' || task.status === 'inprogress' ? '#3b82f6' :
                              task.status === 'testing' ? '#a855f7' :
                              task.status === 'blocked' || task.status === 'rejected' ? '#ef4444' :
                              task.status === 'pr' ? '#ea580c' : '#64748b'
                          }}>
                            {task.status}
                          </span>
                        </label>
                      );
                    });
                  })()}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  onClick={() => setShowMilestoneForm(false)}
                  style={{
                    flex: 1, padding: '10px', border: '1px solid #e2e8f0',
                    borderRadius: '8px', background: '#f8fafc', cursor: 'pointer',
                    fontWeight: 600, color: '#64748b', fontSize: '13px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!milestoneName.trim()) { alert('Please enter a milestone name.'); return; }
                    if (!milestoneDueDate) { alert('Please select a due date.'); return; }
                    try {
                      const res = await fetch(`/api/team-lead/projects/${activeProject.id}/milestones`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token()}`
                        },
                        body: JSON.stringify({
                          name: milestoneName.trim(),
                          due_date: milestoneDueDate,
                          task_ids: selectedMilestoneTasks
                        })
                      });
                      if (res.ok) {
                        fetchMilestones(activeProject.id);
                        setShowMilestoneForm(false);
                        if (window.toast) window.toast.success("Milestone created successfully!");
                      } else {
                        alert("Failed to create milestone");
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  style={{
                    flex: 1, padding: '10px', background: '#8b5cf6', color: '#fff',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    fontWeight: 600, fontSize: '13px'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Right side: Milestone Table */}
          <div style={{
            flex: 1, background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
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
                        <div className={styles.mProgressFill} style={{ width: `${milestone.progress}%`, backgroundColor: milestone.progress === 100 ? '#10b981' : '#8b5cf6' }}></div>
                      </div>
                      <span className={styles.mProgressText}>{milestone.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className={`fade-in ${styles.container}`}>
      <div className={styles.topToolbar}>
        {!activeProject ? (
          <div className={styles.navTabs}>
            <button className={`${styles.navTab} ${activeView === 'board' ? styles.activeTab : ''}`} onClick={() => setActiveView('board')}>
              <Briefcase size={16} /> My Projects
            </button>
            <button className={`${styles.navTab} ${activeView === 'create_sprint' ? styles.activeTab : ''}`} onClick={() => setActiveView('create_sprint')}>
              <Plus size={16} /> Sprint
            </button>
            <button className={`${styles.navTab} ${activeView === 'kanban' ? styles.activeTab : ''}`} onClick={() => setActiveView('kanban')}>
              <KanbanSquare size={16} /> Board
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
              <button className={`${styles.navTab} ${activeView === 'create_sprint' ? styles.activeTab : ''}`} onClick={() => setActiveView('create_sprint')}>
                <Plus size={16} /> Sprint
              </button>
              <button className={`${styles.navTab} ${activeView === 'kanban' ? styles.activeTab : ''}`} onClick={() => setActiveView('kanban')}>
                <KanbanSquare size={16} /> Board
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
                <input type="text" defaultValue={selectedTaskDetails.points} onChange={(e) => e.target.value = e.target.value.replace(/\D/g, '')} style={{ width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', color: '#0f172a', background: '#f8fafc' }} />
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

                {/* Resolve per-status notes and attachments from custom_data */}
                {(() => {
                  // Map kanban column -> status key used in custom_data
                  const colStatusMap = {
                    todo: 'pending',
                    inProgress: 'in-progress',
                    testing: 'testing',
                    pr: 'pr',
                    rejected: 'blocked'
                  };
                  const stKey = colStatusMap[selectedTaskDetails.colId] || 'pending';
                  let customData = {};
                  try {
                    customData = selectedTaskDetails.custom_data ? JSON.parse(selectedTaskDetails.custom_data) : {};
                  } catch(e) {}
                  const phaseNote = (customData.status_notes || {})[stKey] || '';
                  const phaseAttachments = (customData.status_attachments || {})[stKey] || [];
                  const phaseLabels = { pending: 'Todo', 'in-progress': 'In-Progress', testing: 'Testing', pr: 'PR', blocked: 'Reject' };
                  const phaseLabel = phaseLabels[stKey] || stKey;

                  return (
                    <>
                      <div className={styles.mBoxedRow}>
                        <div className={styles.mBoxLeft}>
                          <div className={styles.mIconWrapper} style={{ backgroundColor: '#f3e8ff', color: '#a855f7' }}>
                            <Paperclip size={16} />
                          </div>
                          <span className={styles.mBoxTitle}>ATTACHMENTS</span>
                          <span className={styles.mAttachmentBadge}>{phaseAttachments.length} Files Attached ({phaseLabel})</span>
                        </div>
                        <ChevronDown size={16} style={{ color: '#cbd5e1' }} />
                      </div>
                      {phaseAttachments.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', padding: '8px 12px 12px', background: '#faf5ff', borderRadius: '6px', marginBottom: '4px' }}>
                          {phaseAttachments.map((file, idx) => (
                            <a
                              key={idx}
                              href={file.file_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#fff', border: '1px solid #e2d9f3', borderRadius: '4px', fontSize: '12px', color: '#7c3aed', textDecoration: 'none', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            >
                              📎 {file.filename}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className={styles.mBoxedRow}>
                        <div className={styles.mBoxLeft}>
                          <div className={styles.mIconWrapper} style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                            <MessageSquare size={16} />
                          </div>
                          <span className={styles.mBoxTitle}>DESCRIPTION</span>
                          <span className={styles.mDescBadge}>{phaseNote ? phaseLabel : 'Pending'}</span>
                        </div>
                        <ChevronDown size={16} style={{ color: '#cbd5e1' }} />
                      </div>
                      {phaseNote && (
                        <div style={{ padding: '10px 14px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px', color: '#334155', lineHeight: '1.6', marginBottom: '4px', borderLeft: '3px solid #94a3b8' }}>
                          {phaseNote}
                        </div>
                      )}
                    </>
                  );
                })()}
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
                    <div className={styles.mMetaValueBox}>{activeProject?.name || `${companyName || 'HMNS'} ERP Platform`}</div>
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
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
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
                  <div className={styles.mMetaRow} style={{ alignItems: 'flex-start' }}>
                    <div className={styles.mMetaLabel} style={{ marginTop: '4px' }}><Tag size={14} /> Workspace Labels</div>
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
