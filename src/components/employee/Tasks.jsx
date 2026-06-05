import React, { useState, useEffect, useRef } from 'react';
import './Tasks.css';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const MOCK_TASKS = [
  {
    id: 1, sprint: 'Sprint 14', title: 'Finalize Q3 sprint report',
    description: 'Compile all sprint metrics, velocity charts, and retrospective notes into the final Q3 report document for stakeholder review.',
    priority: 'high', status: 'in-progress', sp: 5,
    subtasks: [
      { id: 11, title: 'Collect velocity data from Jira', done: true },
      { id: 12, title: 'Write retrospective summary',    done: true },
      { id: 13, title: 'Export charts to PDF',           done: false },
    ],
    acceptance: [
      'Report covers all 3 sprints of Q3',
      'Charts exported as high-res PNG',
      'Approved by Product Owner before submission',
    ],
    prStatus: null, prUrl: '', rejectedReason: '',
  },
  {
    id: 2, sprint: 'Sprint 14', title: 'Code review – auth module',
    description: 'Review pull request #204 for the authentication module refactor. Ensure JWT refresh logic, error handling, and test coverage are complete.',
    priority: 'medium', status: 'pending', sp: 3,
    subtasks: [
      { id: 21, title: 'Review JWT refresh logic', done: false },
      { id: 22, title: 'Check error boundary coverage', done: false },
    ],
    acceptance: [
      'All unit tests pass with >80% coverage',
      'No critical security findings',
    ],
    prStatus: null, prUrl: '', rejectedReason: '',
  },
  {
    id: 3, sprint: 'Sprint 14', title: 'Update Jira board tickets',
    description: 'Update all open Jira tickets with latest status, estimates, and sprint assignment before the end-of-sprint sync.',
    priority: 'low', status: 'pending', sp: 1,
    subtasks: [
      { id: 31, title: 'Update story points', done: false },
      { id: 32, title: 'Reassign stale tickets', done: false },
    ],
    acceptance: ['All tickets have assignee and SP', 'No tickets in backlog without sprint'],
    prStatus: null, prUrl: '', rejectedReason: '',
  },
  {
    id: 4, sprint: 'Sprint 13', title: 'Team sync meeting notes',
    description: 'Document and distribute the weekly team sync notes including decisions made, blockers identified, and action items assigned.',
    priority: 'medium', status: 'done', sp: 2,
    subtasks: [
      { id: 41, title: 'Write meeting summary', done: true },
      { id: 42, title: 'Share via Slack', done: true },
    ],
    acceptance: ['Notes shared within 2 hours of meeting', 'Action items have owners'],
    prStatus: 'submitted', prUrl: 'https://github.com/org/repo/pull/198', rejectedReason: '',
  },
  {
    id: 5, sprint: 'Sprint 13', title: 'Deploy staging build v2.4',
    description: 'Deploy the latest build to the staging environment, run smoke tests, and notify QA team for sign-off.',
    priority: 'high', status: 'blocked', sp: 8,
    subtasks: [
      { id: 51, title: 'Build Docker image', done: true },
      { id: 52, title: 'Run smoke tests', done: false },
      { id: 53, title: 'Notify QA team', done: false },
    ],
    acceptance: ['Smoke tests pass 100%', 'QA sign-off received', 'Deployment log archived'],
    prStatus: 'rejected', prUrl: '', rejectedReason: 'Missing smoke test results in PR description.',
  },
];

const SPRINTS = ['All Sprints', 'Sprint 14', 'Sprint 13'];
const STATUS_FILTERS = ['All', 'Todo', 'In-Progress', 'Done'];

const PRIORITY_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#34d399' };
const STATUS_COLOR   = { 'in-progress': '#60a5fa', pending: '#a78bfa', done: '#34d399', blocked: '#f87171' };
const STATUS_LABEL   = { 'in-progress': 'In Progress', pending: 'Pending', done: 'Done', blocked: 'Blocked' };

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
  const [open, setOpen]   = useState(false);
  const [url, setUrl]     = useState(task.prUrl || '');
  const [notes, setNotes] = useState('');
  const [err, setErr]     = useState('');
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  function handleToggle() { setOpen(o => !o); }

  function handleSubmit() {
    if (!url) { setErr('PR URL is required'); return; }
    if (!PR_URL_RE.test(url)) { setErr('Must be a valid GitHub or GitLab PR URL'); return; }
    setErr('');
    setLoading(true);
    setTimeout(() => { setLoading(false); onSubmit(url, notes); setOpen(false); }, 1000);
  }

  const isSubmitted = task.prStatus === 'submitted';
  const isRejected  = task.prStatus === 'rejected';

  return (
    <div className="tk-pr-section">
      {isRejected && (
        <div className="tk-rejected-banner">
          <span>⛔</span>
          <div>
            <strong>Returned by TL</strong>
            <p>{task.rejectedReason}</p>
          </div>
        </div>
      )}

      {isSubmitted ? (
        <div className="tk-pr-submitted">
          <span className="tk-pr-status-chip">Submitted for Review</span>
          {task.prUrl && (
            <a href={task.prUrl} target="_blank" rel="noreferrer" className="tk-pr-link">
              View PR →
            </a>
          )}
        </div>
      ) : (
        <>
          <button
            className={`tk-submit-pr-btn ${open ? 'tk-submit-pr-btn--open' : ''}`}
            onClick={handleToggle}
          >
            {isRejected ? '↺ Resubmit PR' : '⬆ Submit PR'}
          </button>

          <div className={`tk-pr-form ${open ? 'tk-pr-form--open' : ''}`} ref={panelRef}>
            <div className="tk-field-group">
              <label className="tk-label">PR / MR URL <span className="tk-req">*</span></label>
              <input
                className={`tk-input ${err ? 'tk-input--err' : ''}`}
                placeholder="https://github.com/org/repo/pull/123"
                value={url}
                onChange={e => { setUrl(e.target.value); setErr(''); }}
              />
              {err && <span className="tk-err-msg">{err}</span>}
            </div>
            <div className="tk-field-group">
              <label className="tk-label">Completion Notes <span className="tk-optional">(optional)</span></label>
              <textarea
                className="tk-textarea"
                placeholder="Brief notes on implementation choices…"
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <button className={`tk-confirm-btn ${loading ? 'tk-confirm-btn--loading' : ''}`} onClick={handleSubmit} disabled={loading}>
              {loading ? <><span className="tk-spin"/>Submitting…</> : 'Confirm Submit'}
            </button>
          </div>
        </>
      )}
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

  const STATUSES = ['pending', 'in-progress', 'done', 'blocked'];

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

        {/* PR Submit */}
        <PrSubmitForm task={{ ...task, prStatus: task.prStatus }} onSubmit={handlePrSubmit} />
      </div>
    </div>
  );
}

// ─── EmpTasksPage (root) ──────────────────────────────────────────────────────
export default function Tasks({ db, onUpdateDb }) {
  const [selectedId, setSelectedId]   = useState(null);
  const [sprint, setSprint]           = useState('All Sprints');
  const [statusFilter, setStatusFilter] = useState('All');

  const tasksList = db?.tasks || MOCK_TASKS;
  // View ONLY tasks assigned to Jane Smith in Employee ESS
  const tasks = tasksList.filter(t => !t.assignee || t.assignee === 'Jane Smith');

  const selectedTask = tasks.find(t => t.id === selectedId) || null;

  const sprintList = [...new Set(['All Sprints', 'Sprint 14', 'Sprint 13', ...tasks.map(t => t.sprint).filter(Boolean)])];

  function handleUpdate(id, changes) {
    if (db && onUpdateDb) {
      const currentTasks = Array.isArray(db.tasks) ? db.tasks : [];
      const updatedTasks = currentTasks.map(t => t.id === id ? { ...t, ...changes } : t);
      onUpdateDb({ ...db, tasks: updatedTasks });
    }
  }

  const filtered = tasks.filter(t => {
    const sprintOk = sprint === 'All Sprints' || t.sprint === sprint;
    const statusOk = statusFilter === 'All'
      || (statusFilter === 'Todo'        && t.status === 'pending')
      || (statusFilter === 'In-Progress' && t.status === 'in-progress')
      || (statusFilter === 'Done'        && t.status === 'done');
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
            task={selectedTask}
            onClose={() => setSelectedId(null)}
            onUpdate={handleUpdate}
          />
        )}
      </div>
    </div>
  );
}