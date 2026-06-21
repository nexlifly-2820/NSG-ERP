// Crash fix applied
import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

const fetcher = url => fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('nsg_jwt_token')}` } }).then(res => res.json());
import './Tasks.css';



const STATUS_FILTERS = ['All', 'Assignee', 'Todo', 'In-Progress', 'Testing', 'Pr', 'Reject'];

const PRIORITY_COLOR = { high: '#f87171', medium: '#fbbf24', low: '#34d399' };
const STATUS_COLOR   = { 
  'in-progress': '#60a5fa', 
  pending: '#a78bfa', 
  done: '#34d399', 
  blocked: '#f87171',
  testing: '#fbbf24',
  pr: '#8b5cf6',
  reject: '#f87171',
  assignee: '#3b82f6'
};
const STATUS_LABEL   = { 
  'in-progress': 'In-Progress', 
  pending: 'Todo', 
  done: 'Done', 
  blocked: 'Reject',
  testing: 'Testing',
  pr: 'Pr',
  reject: 'Reject',
  assignee: 'Assignee'
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
    // Save custom field data only — do NOT auto-advance status
    setTimeout(() => { 
      setLoading(false); 
      onUpdate(task.id, { customData: JSON.stringify(customData) }); 
      if (onClose) onClose();
    }, 800);
  }

  if (!schema || schema.length === 0) return null;

  return (
    <div className="tk-pr-section">
      <div className="tk-detail-section-label" style={{marginBottom: 12}}>Custom Fields (Schema Driven)</div>
      {schema.map(field => {
        const isFile = field.type === 'file';
        const fileUrls = Array.isArray(customData[field.name]) ? customData[field.name] : [];

        return (
          <div key={field.name} className="tk-field-group" style={{marginBottom: 12}}>
            <label className="tk-label" style={{fontWeight: 600}}>{field.label}</label>
            {isFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {fileUrls.map((file, idx) => (
                    <div key={idx} className="tk-attachment-card" style={{ padding: '6px', minWidth: 'auto' }}>
                      <div className="tk-attachment-card-content">
                        <a href={file.file_url} target="_blank" rel="noreferrer" className="tk-attachment-link" style={{ fontSize: '0.85rem' }}>
                          {file.filename}
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomData(prev => ({
                            ...prev,
                            [field.name]: fileUrls.filter((_, i) => i !== idx)
                          }));
                        }}
                        className="tk-attachment-delete-btn"
                        style={{ position: 'relative', top: 0, right: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <input
                  type="file"
                  multiple
                  id={`emp-custom-upload-${field.name}`}
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
                        const res = await fetch('/api/employee-portal/tasks/upload', {
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
                    setCustomData(prev => ({ ...prev, [field.name]: uploaded }));
                  }}
                />
                <label htmlFor={`emp-custom-upload-${field.name}`} className="tk-upload-btn-label" style={{ display: 'inline-block', width: 'max-content' }}>
                  📎 Choose Files
                </label>
              </div>
            ) : field.type === 'textarea' ? (
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
        );
      })}

    </div>
  );
}

// ─── TaskDetailPanel ──────────────────────────────────────────────────────────
function TaskDetailPanel({ task, onClose, onUpdate }) {
  const [subtasks, setSubtasks]     = useState(task.subtasks);
  const [acChecked, setAcChecked]   = useState([]);
  const [status, setStatus]         = useState(task.status);
  const [attachmentsList, setAttachmentsList] = useState(task.attachments || []);
  const [statusNotes, setStatusNotes] = useState({});
  const [statusAttachments, setStatusAttachments] = useState({});
  const [savingNotes, setSavingNotes] = useState(false);
  const [uploadingStatusAtt, setUploadingStatusAtt] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    setSubtasks(task.subtasks || []);
    setStatus(task.status);
    setAcChecked([]);
    setAttachmentsList(task.attachments || []);
    try {
      const data = task.customData ? JSON.parse(task.customData) : {};
      setStatusNotes(data.status_notes || {});
      setStatusAttachments(data.status_attachments || {});
    } catch(e) {
      setStatusNotes({});
      setStatusAttachments({});
    }
  }, [task.id]); // Only reset panel state when switching to a different task, not on every prop update

  const handleStatusNotesChange = (key, value) => {
    setStatusNotes(prev => ({ ...prev, [key]: value }));
  };

  const saveStatusNotesAndAttachments = async (updatedAttachments = statusAttachments) => {
    setSavingNotes(true);
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      let currentCustomData = {};
      try {
        currentCustomData = task.customData ? JSON.parse(task.customData) : {};
      } catch(e) {}
      
      const updatedCustomData = {
        ...currentCustomData,
        status_notes: {
          ...currentCustomData.status_notes,
          ...statusNotes
        },
        status_attachments: {
          ...currentCustomData.status_attachments,
          ...updatedAttachments
        }
      };

      // Always request approval when employee saves notes/attachments,
      // so the TL can approve and advance the status.
      updatedCustomData.approval_requested = true;

      const res = await fetch(`/api/employee-portal/tasks/${task.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: status,          // use local status state (user's selected status), NOT task.status prop (server value)
          custom_data: JSON.stringify(updatedCustomData)
        })
      });
      if (res.ok) {
        onUpdate(task.id, { customData: JSON.stringify(updatedCustomData), _fromNotes: true });
        if (window.toast) window.toast.success("Notes saved successfully!");
        if (onClose) onClose();
      } else {
        alert("Failed to save notes");
      }
    } catch(err) {
      console.error(err);
      alert("Error saving notes");
    }
    setSavingNotes(false);
  };

  const handleStatusFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const currentList = statusAttachments[status] || [];
    if (currentList.length + files.length > 10) {
      alert("You can upload a maximum of 10 files per status.");
      return;
    }

    setUploadingStatusAtt(true);
    const token = localStorage.getItem('nsg_jwt_token');
    const uploaded = [...currentList];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        const resUpload = await fetch('/api/employee-portal/tasks/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        if (resUpload.ok) {
          const fileData = await resUpload.json();
          uploaded.push({ filename: fileData.filename, file_url: fileData.file_url });
        } else {
          alert(`Failed to upload ${file.name}`);
        }
      } catch (err) {
        console.error(err);
        alert(`Error uploading ${file.name}`);
      }
    }

    const updatedAttachments = {
      ...statusAttachments,
      [status]: uploaded
    };
    setStatusAttachments(updatedAttachments);
    setUploadingStatusAtt(false);
  };

  const handleStatusFileDelete = async (idxToDelete) => {
    if (!window.confirm("Are you sure you want to delete this attachment?")) return;

    const currentList = statusAttachments[status] || [];
    const updatedList = currentList.filter((_, idx) => idx !== idxToDelete);

    const updatedAttachments = {
      ...statusAttachments,
      [status]: updatedList
    };
    setStatusAttachments(updatedAttachments);
  };
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
    // Only update the status — notes/attachments are saved separately via "Save Notes" button
    onUpdate(task.id, { status: s });
  }

  function handlePrSubmit(url, notes) {
    onUpdate(task.id, { prStatus: 'submitted', prUrl: url });
  }

  const STATUSES = ['assignee', 'pending', 'in-progress', 'testing', 'pr', 'blocked'];

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

        {/* Dynamic Schema Fields */}
        <DynamicCustomForm task={task} schema={task.schema} onUpdate={onUpdate} />

        {/* Attachments */}
        <div className="tk-detail-section-label" style={{ marginTop: 16 }}>Requirement Attachments ({attachmentsList.length})</div>
        <div className="tk-attachments-section">
          {attachmentsList.length > 0 ? (
            <div className="tk-attachments-list">
              {attachmentsList.map(att => {
                const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.file_url);
                return (
                  <div key={att.id} className="tk-attachment-card">
                    <div className="tk-attachment-card-content">
                      {isImage ? (
                        <div className="tk-attachment-preview-container">
                          <img src={att.file_url} alt={att.filename} className="tk-attachment-preview" />
                        </div>
                      ) : (
                        <div className="tk-attachment-doc-icon">📄</div>
                      )}
                      <a href={att.file_url} target="_blank" rel="noreferrer" className="tk-attachment-link" title={att.filename}>
                        {att.filename}
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="tk-empty-state" style={{ marginBottom: 8 }}>No attachments uploaded yet.</div>
          )}
        </div>

        {/* Status change */}
        <div className="tk-detail-section-label" style={{ marginTop: 24 }}>Update Status</div>
        <div className="tk-status-row">
          {STATUSES.map(s => (
            <div
              key={s}
              className={`tk-status-btn ${status === s ? 'tk-status-btn--active' : ''}`}
              style={status === s ? { borderColor: STATUS_COLOR[s], color: STATUS_COLOR[s], background: `${STATUS_COLOR[s]}18` } : {}}
            >
              {STATUS_LABEL[s]}
            </div>
          ))}
        </div>

        {/* Status Notes */}
        {(status === 'pending' || status === 'todo' || status === 'in-progress' || status === 'testing' || status === 'blocked' || status === 'reject' || status === 'pr') && (
          <div style={{ marginTop: 20 }}>
            <div className="tk-detail-section-label" style={{ marginBottom: 6 }}>
              {status === 'pending' || status === 'todo' ? 'Todo Status Notes / Description' :
               status === 'in-progress' ? 'In-Progress Status Notes / Description' :
               status === 'testing' ? 'Testing Status Notes / Description' :
               status === 'pr' ? 'PR Status Notes / Description' :
               status === 'assignee' ? 'Assignee Notes / Description' : 'Reject Reason / Description'}
            </div>
            <textarea
              className="tk-textarea"
              rows={3}
              placeholder={`Enter description for ${STATUS_LABEL[status]} status...`}
              value={statusNotes[status] || ''}
              onChange={e => handleStatusNotesChange(status, e.target.value)}
            />

            {/* Status Attachments */}
            <div className="tk-detail-section-label" style={{ marginTop: 16, marginBottom: 6 }}>
              {STATUS_LABEL[status]} Attachments ({(statusAttachments[status] || []).length} / 10)
            </div>
            <div className="tk-attachments-section" style={{ marginBottom: 12 }}>
              {(statusAttachments[status] || []).length > 0 ? (
                <div className="tk-attachments-list">
                  {(statusAttachments[status] || []).map((att, idx) => {
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(att.file_url);
                    return (
                      <div key={idx} className="tk-attachment-card">
                        <div className="tk-attachment-card-content">
                          {isImage ? (
                            <div className="tk-attachment-preview-container">
                              <img src={att.file_url} alt={att.filename} className="tk-attachment-preview" />
                            </div>
                          ) : (
                            <div className="tk-attachment-doc-icon">📄</div>
                          )}
                          <a href={att.file_url} target="_blank" rel="noreferrer" className="tk-attachment-link" title={att.filename}>
                            {att.filename}
                          </a>
                        </div>
                        <button onClick={() => handleStatusFileDelete(idx)} className="tk-attachment-delete-btn" title="Delete status attachment">
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="tk-empty-state" style={{ marginBottom: 8 }}>No attachments uploaded yet.</div>
              )}
              
              <input
                type="file"
                multiple
                disabled={uploadingStatusAtt}
                onChange={handleStatusFileUpload}
                style={{ display: 'none' }}
                id="status-task-file-input"
              />
              <label htmlFor="status-task-file-input" className="tk-upload-btn-label">
                {uploadingStatusAtt ? 'Uploading file...' : '📎 Add Attachment'}
              </label>
            </div>
            

          </div>
        )}

        {/* Subtasks */}
        <SubtaskChecklist subtasks={subtasks} onToggle={toggleSubtask} />

        {/* Acceptance criteria */}
        <AcceptanceCriteriaList criteria={task.acceptance} checkedIds={acChecked} onToggle={toggleAc} />

        {/* PR Form — only show when task is in 'pr' status */}
        {status === 'pr' && (
          <PrSubmitForm task={task} onSubmit={handlePrSubmit} />
        )}

        {/* Save button */}
        <div style={{ display: 'flex', gap: '12px', marginTop: 20 }}>
          <button
            className="tk-confirm-btn"
            style={{ flex: 1 }}
            onClick={() => {
              if (status === 'assignee') {
                changeStatus('pending'); // 'pending' is the internal status for Todo
                if (onClose) onClose();
              } else {
                saveStatusNotesAndAttachments();
              }
            }}
            disabled={savingNotes}
          >
            {savingNotes ? 'Saving...' : (status === 'assignee' ? 'TO GO TODO' : 'Save')}
          </button>
          {status === 'assignee' && (
            <button
              className="tk-confirm-btn"
              style={{ flex: 1, background: '#ef4444', borderColor: '#ef4444' }}
              onClick={() => {
                changeStatus('blocked');
                if (onClose) onClose();
              }}
              disabled={savingNotes}
            >
              GO TO REJECT
            </button>
          )}
        </div>
      </div>
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

  useEffect(() => {
    if (tasksData) {
      const openTaskId = localStorage.getItem('emp_open_task');
      if (openTaskId) {
        setSelectedId(isNaN(Number(openTaskId)) ? openTaskId : Number(openTaskId));
        localStorage.removeItem('emp_open_task');
      }
    }
  }, [tasksData]);

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
    
    // If the change is customData submission without a status change
    if (changes.customData && !changes.status && !changes._fromNotes) {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const currentTask = tasks.find(t => t.id === id);
        await fetch(`/api/employee-portal/tasks/${id}/status`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            status: currentTask.status,
            custom_data: changes.customData
          })
        });
        mutate();
        if (window.toast) window.toast.success("Custom fields saved!");
      } catch (e) { console.error(e); }
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
      // Optimistically update the task status in local cache immediately
      const optimisticTasks = (tasksData?.items || []).map(t => t.id === id ? { ...t, status: changes.status } : t);
      mutate({ ...tasksData, items: optimisticTasks }, false);
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        await fetch(`/api/employee-portal/tasks/${id}/status`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            status: changes.status,
            ...(changes.customData !== undefined && { custom_data: changes.customData })
          })
        });
        // Revalidate from backend to confirm saved status
        mutate();
        return;
      } catch (e) {
        console.error(e);
        mutate(); // Revert optimistic update on error
      }
      return;
    }
    
    // Optimistic UI update for other changes (subtasks, customData)
    const updatedTasks = (tasksData?.items || []).map(t => t.id === id ? { ...t, ...changes } : t);
    mutate({ ...tasksData, items: updatedTasks }, false);
  };

  const filtered = tasks.filter(t => {
    const sprintOk = sprint === 'All Sprints' || t.sprint === sprint;
    const statusOk = statusFilter === 'All' || statusFilter === 'Assignee'
      || (statusFilter === 'Todo'        && (t.status === 'pending' || t.status === 'todo'))
      || (statusFilter === 'In-Progress' && t.status === 'in-progress')
      || (statusFilter === 'Testing'     && t.status === 'testing')
      || (statusFilter === 'Pr'          && t.status === 'pr')
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
