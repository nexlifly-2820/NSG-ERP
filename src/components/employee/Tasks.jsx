// Crash fix applied
import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

const fetcher = url => fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('nsg_jwt_token')}` } }).then(res => res.json());
import './Tasks.css';



const STATUS_FILTERS = ['All', 'Todo', 'In-Progress', 'testing', 'pr', 'Reject'];

const PRIORITY_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#34d399' };
const STATUS_COLOR   = { 
  'in-progress': '#60a5fa', 
  pending: '#a78bfa', 
  done: '#34d399', 
  blocked: '#f87171',
  testing: '#fbbf24',
  pr: '#8b5cf6',
  reject: '#f87171'
};
const STATUS_LABEL   = { 
  'in-progress': 'In-Progress', 
  pending: 'Todo', 
  done: 'Done', 
  blocked: 'Reject',
  testing: 'testing',
  pr: 'pr',
  reject: 'Reject'
};

const PR_URL_RE = /^https?:\/\/(github\.com\/[^/]+\/[^/]+\/pull\/\d+|gitlab\.com\/[^/]+\/[^/]+\/-\/merge_requests\/\d+)/;

// ─── SprintFilterBar ──────────────────────────────────────────────────────────
function SprintFilterBar({ sprint, setSprint, statusFilter, setStatusFilter, sprintList = [] }) {
  return (
    <div className="tk-toolbar">
      <select className="tk-sprint-select" value={sprint} onChange={e => setSprint(e.target.value)}>
        {sprintList.map(s => <option key={s}>{s}</option>)}
      </select>
      <div className="tk-filter-chips">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            className={`tk-chip ${statusFilter === f ? 'tk-chip--active' : ''}`}
            onClick={() => setStatusFilter(f)}
          >{f}</button>
        ))}
      </div>
    </div>
  );
}

// ─── MyTaskCard ───────────────────────────────────────────────────────────────
function MyTaskCard({ task, isSelected, onClick }) {
  const done      = task.subtasks.filter(s => s.done).length;
  const total     = task.subtasks.length;
  const pct       = total ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className={`tk-task-card ${isSelected ? 'tk-task-card--selected' : ''} tk-task-card--${task.status}`}
      onClick={onClick}
    >
      <div className="tk-task-card__top">
        <p className="tk-task-card__title">{task.title}</p>
        <span className="tk-sp-badge">SP {task.sp}</span>
      </div>
      <div className="tk-task-card__bottom">
        <span className="tk-priority-dot" style={{ background: PRIORITY_COLOR[task.priority] }} />
        <span className="tk-priority-label" style={{ color: PRIORITY_COLOR[task.priority] }}>{task.priority}</span>
        <span className="tk-status-chip" style={{ color: STATUS_COLOR[task.status], borderColor: `${STATUS_COLOR[task.status]}40` }}>
          {STATUS_LABEL[task.status]}
        </span>
        {total > 0 && (
          <div className="tk-progress-wrap">
            <div className="tk-progress-bar">
              <div className="tk-progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? '#34d399' : '#60a5fa' }} />
            </div>
            <span className="tk-progress-label">{done}/{total}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SubtaskChecklist ─────────────────────────────────────────────────────────
function SubtaskChecklist({ subtasks, onToggle }) {
  if (!subtasks || subtasks.length === 0) {
    return (
      <div className="tk-subtasks">
        <div className="tk-detail-section-label">Subtasks</div>
        <div className="tk-empty-state">No subtasks defined.</div>
      </div>
    );
  }

  const allDone = subtasks.every(s => s.done);
  return (
    <div className="tk-subtasks">
      <div className="tk-detail-section-label">Subtasks</div>
      {subtasks.map(s => (
        <div key={s.id} className={`tk-subtask-row ${s.done ? 'tk-subtask-row--done' : ''}`} onClick={() => onToggle(s.id)}>
          <div className={`tk-subtask-cb ${s.done ? 'tk-subtask-cb--checked' : ''}`}>
            {s.done && <span>✓</span>}
          </div>
          <span className={`tk-subtask-title ${s.done ? 'tk-subtask-title--done' : ''}`}>{s.title}</span>
        </div>
      ))}
      {allDone && (
        <div className="tk-subtasks-complete">✓ All subtasks complete</div>
      )}
    </div>
  );
}

// ─── AcceptanceCriteriaList ───────────────────────────────────────────────────
function AcceptanceCriteriaList({ criteria, checkedIds, onToggle }) {
  if (!criteria || criteria.length === 0) {
    return (
      <div className="tk-acceptance">
        <div className="tk-detail-section-label">Acceptance Criteria</div>
        <div className="tk-empty-state">No acceptance criteria provided.</div>
      </div>
    );
  }

  return (
    <div className="tk-acceptance">
      <div className="tk-detail-section-label">Acceptance Criteria</div>
      {criteria.map((c, i) => (
        <div key={i} className={`tk-ac-row ${checkedIds.includes(i) ? 'tk-ac-row--done' : ''}`} onClick={() => onToggle(i)}>
          <div className={`tk-ac-cb ${checkedIds.includes(i) ? 'tk-ac-cb--checked' : ''}`}>
            {checkedIds.includes(i) && <span>✓</span>}
          </div>
          <span>{c}</span>
        </div>
      ))}
    </div>
  );
}

// ─── PrSubmitForm ─────────────────────────────────────────────────────────────
function PrSubmitForm({ task, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [prUrl, setPrUrl] = useState('');
  const [notes, setNotes] = useState('');

  if (task.prStatus === 'submitted') {
    return (
      <div className="tk-pr-section">
        <div className="tk-detail-section-label">Pull Request</div>
        <div className="tk-pr-submitted">
          <span className="tk-pr-status-chip">Pending Review</span>
          <a href={task.prUrl} target="_blank" rel="noreferrer" className="tk-pr-link">{task.prUrl}</a>
        </div>
      </div>
    );
  }

  if (task.prStatus === 'approved') {
    return (
      <div className="tk-pr-section">
        <div className="tk-detail-section-label">Pull Request</div>
        <div className="tk-pr-submitted">
          <span className="tk-pr-status-chip" style={{color: 'var(--tk-emerald)', borderColor: 'var(--tk-emerald)'}}>Approved</span>
          <a href={task.prUrl} target="_blank" rel="noreferrer" className="tk-pr-link">{task.prUrl}</a>
        </div>
      </div>
    );
  }

  return (
    <div className="tk-pr-section">
      <div className="tk-detail-section-label">Pull Request</div>
      
      {task.prStatus === 'rejected' && (
        <div className="tk-rejected-banner">
          <div>
            <strong>Changes Requested</strong>
            <p>{task.rejectedReason}</p>
          </div>
        </div>
      )}

      {!open ? (
        <button className="tk-submit-pr-btn" onClick={() => setOpen(true)}>
          {task.prStatus === 'rejected' ? 'Submit Revisions' : 'Submit PR'}
        </button>
      ) : (
        <div className={`tk-pr-form tk-pr-form--open`}>
          <div className="tk-field-group">
            <label className="tk-label">PR URL <span className="tk-req">*</span></label>
            <input 
              className="tk-input" 
              placeholder="https://github.com/..." 
              value={prUrl} 
              onChange={e => setPrUrl(e.target.value)} 
            />
          </div>
          <div className="tk-field-group">
            <label className="tk-label">Release Notes <span className="tk-optional">(Optional)</span></label>
            <textarea 
              className="tk-textarea" 
              rows={3}
              placeholder="What changes did you make?"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>
          <div style={{display: 'flex', gap: 8, marginTop: 4}}>
            <button className="tk-confirm-btn" style={{flex: 1}} onClick={() => {
              if(!prUrl) return;
              onSubmit(prUrl, notes);
              setOpen(false);
            }}>Submit</button>
            <button className="tk-status-btn" onClick={() => setOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DynamicCustomForm ────────────────────────────────────────────────────────
function DynamicCustomForm({ task, schema, onUpdate, onClose }) {
  const [customData, setCustomData] = useState(() => {
    try { return task.customData ? JSON.parse(task.customData) : {}; }
    catch(e) { return {}; }
  });
  const [loading, setLoading] = useState(false);

  function handleChange(name, value) {
    setCustomData(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit() {
    setLoading(true);
    // Auto-advance to next status on Save
    const nextStatus = {
      'pending':     'in-progress',
      'todo':        'in-progress',
      'in-progress': 'testing',
      'testing':     'pr',
    }[task.status] || task.status; // pr/reject stay as-is

    setTimeout(() => { 
      setLoading(false); 
      onUpdate(task.id, { customData: JSON.stringify(customData), status: nextStatus }); 
      if (onClose) onClose();
    }, 800);
  }

  if (!schema || schema.length === 0) return null;

  return (
    <div className="tk-pr-section">
      <div className="tk-detail-section-label" style={{marginBottom: 12}}>Custom Fields (Schema Driven)</div>
      {schema.map(field => (
        <div key={field.name} className="tk-field-group" style={{marginBottom: 12}}>
          <label className="tk-label" style={{fontWeight: 600}}>{field.label}</label>
          {field.type === 'textarea' ? (
            <textarea
              className="tk-textarea"
              value={customData[field.name] || ''}
              onChange={e => handleChange(field.name, e.target.value)}
            />
          ) : (
            <input
              type={field.type}
              className="tk-input"
              value={customData[field.name] || ''}
              onChange={e => handleChange(field.name, e.target.value)}
            />
          )}
        </div>
      ))}
      <button className={`tk-confirm-btn ${loading ? 'tk-confirm-btn--loading' : ''}`} onClick={handleSubmit} disabled={loading} style={{marginTop: 8}}>
        {loading ? <><span className="tk-spin"/>Saving…</> : 'Save'}
      </button>
    </div>
  );
}

// ─── TaskDetailPanel ──────────────────────────────────────────────────────────
function TaskDetailPanel({ task, onClose, onUpdate }) {
  const [subtasks, setSubtasks]     = useState(task.subtasks);
  const [acChecked, setAcChecked]   = useState([]);
  const [status, setStatus]         = useState(task.status);
  const panelRef = useRef(null);

  useEffect(() => {
    setSubtasks(task.subtasks || []);
    setStatus(task.status);
    setAcChecked([]);
  }, [task.id, task.subtasks, task.status]);

  function toggleSubtask(id) {
    const updated = subtasks.map(s => s.id === id ? { ...s, done: !s.done } : s);
    setSubtasks(updated);
    onUpdate(task.id, { subtasks: updated });
  }

  function toggleAc(i) {
    setAcChecked(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);
  }

  function changeStatus(s) {
    setStatus(s);
    onUpdate(task.id, { status: s });
  }

  function handlePrSubmit(url, notes) {
    onUpdate(task.id, { prStatus: 'submitted', prUrl: url });
  }

  const STATUSES = ['pending', 'in-progress', 'testing', 'pr', 'blocked'];

  return (
    <div className="tk-detail-panel" ref={panelRef}>
      <div className="tk-detail-header">
        <div className="tk-detail-header__top">
          <span className="tk-detail-sprint">{task.sprint}</span>
          <button className="tk-detail-close" onClick={onClose}>✕</button>
        </div>
        <h2 className="tk-detail-title">{task.title}</h2>
        <div className="tk-detail-meta">
          <span className="tk-priority-dot" style={{ background: PRIORITY_COLOR[task.priority] }} />
          <span style={{ color: PRIORITY_COLOR[task.priority], fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize' }}>{task.priority}</span>
          <span className="tk-sp-badge">SP {task.sp}</span>
        </div>
      </div>

      <div className="tk-detail-body">
        {/* Description */}
        <div className="tk-detail-section-label">Description</div>
        <p className="tk-detail-desc">{task.description}</p>

        {/* Status change */}
        <div className="tk-detail-section-label" style={{ marginTop: 16 }}>Update Status</div>
        <div className="tk-status-row">
          {STATUSES.map(s => (
            <button
              key={s}
              className={`tk-status-btn ${status === s ? 'tk-status-btn--active' : ''}`}
              style={status === s ? { borderColor: STATUS_COLOR[s], color: STATUS_COLOR[s], background: `${STATUS_COLOR[s]}18` } : {}}
              onClick={() => changeStatus(s)}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* Subtasks */}
        <SubtaskChecklist subtasks={subtasks} onToggle={toggleSubtask} />

        {/* Acceptance criteria */}
        <AcceptanceCriteriaList criteria={task.acceptance} checkedIds={acChecked} onToggle={toggleAc} />

        {/* PR Form — only show when task is in 'pr' status */}
        {status === 'pr' && (
          <PrSubmitForm task={task} onSubmit={handlePrSubmit} />
        )}

        {/* Save / advance button */}
        {status !== 'pr' && status !== 'blocked' && (() => {
          const nextStatus = {
            'pending':     'in-progress',
            'todo':        'in-progress',
            'in-progress': 'testing',
            'testing':     'pr',
          }[status];
          if (!nextStatus) return null;
          return (
            <button
              className="tk-confirm-btn"
              style={{ marginTop: 20 }}
              onClick={() => {
                changeStatus(nextStatus);
                setTimeout(() => { if (onClose) onClose(); }, 300);
              }}
            >
              Save
            </button>
          );
        })()}      </div>
    </div>
  );
}

// ─── EmpTasksPage (root) ──────────────────────────────────────────────────────
export default function Tasks() {
  const [selectedId, setSelectedId]   = useState(null);
  const [sprint, setSprint]           = useState('All Sprints');
  const [statusFilter, setStatusFilter] = useState('All');

  const { data: schemaData } = useSWR('/api/employee-portal/tasks/schema', fetcher);
  const schema = schemaData?.schema || [];

  const { data: tasksData, mutate } = useSWR('/api/employee-portal/tasks/my-tasks', fetcher);
  
  const tasks = (tasksData?.items || [])
    .filter(t => t.status !== 'done')
    .map(t => ({
      ...t,
      subtasks: t.subtasks || []
    }));

  const selectedTask = tasks.find(t => t.id === selectedId) || null;

  const sprintList = [...new Set(['All Sprints', ...tasks.map(t => t.sprint).filter(Boolean)])];

  const handleUpdate = async (id, changes) => {
    // If the change is a subtask toggle
    if (changes.subtasks) {
      // Find the subtask that changed by comparing
      const task = tasks.find(t => t.id === id);
      const changedSubtask = changes.subtasks.find(s => 
        task.subtasks.find(oldS => oldS.id === s.id)?.done !== s.done
      );
      
      if (changedSubtask) {
        try {
          const token = localStorage.getItem('nsg_jwt_token');
          await fetch(`/api/employee-portal/tasks/${id}/subtasks/${changedSubtask.id}/toggle`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
          });
        } catch (e) { console.error(e); }
      }
    }
    
    // If the change is customData submission
    if (changes.customData) {
      // Typically we'd have a specific endpoint or PATCH to /tasks/:id to update generic tasks.
      // For demonstration, we simply optimistically update the state.
      console.log('Saved custom data:', changes.customData);
    }
    
    // If the change is a PR submission
    if (changes.prUrl && changes.prStatus === 'submitted') {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        await fetch(`/api/employee-portal/tasks/${id}/submit-pr`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ prUrl: changes.prUrl })
        });
        mutate(); // Revalidate — backend now sets status to 'pr'
        return;
      } catch (e) { console.error(e); }
    }

    // If the change is a status update
    if (changes.status) {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        await fetch(`/api/employee-portal/tasks/${id}/status`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ status: changes.status })
        });
        // Revalidate from backend after status change
        mutate();
        return;
      } catch (e) { console.error(e); }
    }
    
    // Optimistic UI update for other changes (subtasks, customData)
    const updatedTasks = (tasksData?.items || []).map(t => t.id === id ? { ...t, ...changes } : t);
    mutate({ ...tasksData, items: updatedTasks }, false);
  };

  const filtered = tasks.filter(t => {
    const sprintOk = sprint === 'All Sprints' || t.sprint === sprint;
    const statusOk = statusFilter === 'All'
      || (statusFilter === 'Todo'        && (t.status === 'pending' || t.status === 'todo'))
      || (statusFilter === 'In-Progress' && t.status === 'in-progress')
      || (statusFilter === 'testing'     && t.status === 'testing')
      || (statusFilter === 'pr'          && t.status === 'pr')
      || (statusFilter === 'Reject'      && (t.status === 'reject' || t.status === 'blocked'));
    return sprintOk && statusOk;
  });

  // Group by sprint
  const groups = [...new Set(filtered.map(t => t.sprint))];

  return (
    <div className="tk-root">
      {/* Page Header */}
      <div className="tk-page-header">
        <h1 className="tk-page-title">📋 Tasks</h1>
        <span className="tk-page-breadcrumb">Employee (ESS) → Tasks</span>
      </div>

      {/* Toolbar */}
      <SprintFilterBar
        sprint={sprint} setSprint={setSprint}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter}
        sprintList={sprintList}
      />

      {/* Main content */}
      <div className={`tk-layout ${selectedTask ? 'tk-layout--split' : ''}`}>
        {/* Task List */}
        <div className="tk-tasklist">
          {filtered.length === 0 && (
            <div className="tk-empty">No tasks match this filter.</div>
          )}
          {groups.map(g => (
            <div key={g} className="tk-sprint-group">
              <div className="tk-sprint-group-label">{g}</div>
              {filtered.filter(t => t.sprint === g).map(t => (
                <MyTaskCard
                  key={t.id}
                  task={t}
                  isSelected={t.id === selectedId}
                  onClick={() => setSelectedId(t.id === selectedId ? null : t.id)}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selectedTask && (
          <TaskDetailPanel
            task={{...selectedTask, schema}}
            onClose={() => setSelectedId(null)}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  );
}
