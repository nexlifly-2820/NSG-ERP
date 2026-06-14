import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Send, Lock, AlertTriangle, CheckCircle, X, Trash2 } from 'lucide-react';
import './Timesheet.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];


function getWeekDates(offset = 0) {
  const now = new Date();
  const day = now.getDay();
  const mon = new Date(now);
  mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  return DAYS.map((_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function fmtDate(d) {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function fmtWeekLabel(dates) {
  return `${fmtDate(dates[0])} – ${fmtDate(dates[4])}`;
}

function dayTotal(row) {
  return DAYS.reduce((sum, d) => sum + (parseFloat(row.hours[d]) || 0), 0);
}

function colTotal(rows, day) {
  return rows.reduce((sum, r) => sum + (parseFloat(r.hours[day]) || 0), 0);
}

function weekTotal(rows) {
  return rows.reduce((sum, r) => sum + dayTotal(r), 0);
}

// ─── AddTaskModal ─────────────────────────────────────────────────────────────

function AddTaskModal({ onAdd, onClose, existingIds, existingNames, availableTasks }) {
  const available = availableTasks.filter(t => !existingIds.includes(t.id));
  const [customTaskName, setCustomTaskName] = useState('');

  const handleAddCustom = () => {
    if (!customTaskName.trim()) return;
    if (existingNames && existingNames.includes(customTaskName.trim().toLowerCase())) {
      alert("This task already exists in your timesheet.");
      return;
    }
    onAdd({
      id: null, // Must be null so backend Pydantic Optional[int] doesn't throw 422
      name: customTaskName.trim(),
      sprint: 'General'
    });
    onClose();
  };

  return (
    <div className="ts-modal-overlay" onClick={onClose}>
      <div className="ts-modal" onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="ts-modal__title">Add Task to Timesheet</div>
            <div className="ts-modal__sub">Pick a sprint task or add a custom one</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ts-text-dim)' }}>
            <X size={18} />
          </button>
        </div>

        <div className="ts-modal__list">
          {available.length === 0 ? (
            <p style={{ color: 'var(--ts-text-muted)', fontSize: 13, textAlign: 'center', padding: '16px 0', margin: 0 }}>
              No assigned sprint tasks. Add a custom task below.
            </p>
          ) : (
            available.map(t => (
              <div key={t.id} className="ts-modal__task-item" onClick={() => { onAdd(t); onClose(); }}>
                <div>
                  <div className="ts-modal__task-name">{t.name}</div>
                  <div className="ts-modal__task-sprint">{t.sprint}</div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '16px', borderTop: '1px solid var(--ts-border)', background: 'var(--ts-bg-inner)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ts-text)', marginBottom: 8 }}>Or add a custom activity</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input 
              type="text" 
              placeholder="e.g., Interviews, Team Meeting, Admin" 
              value={customTaskName}
              onChange={e => setCustomTaskName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCustom()}
              style={{ 
                flex: 1, padding: '8px 12px', borderRadius: 6, 
                border: '1px solid var(--ts-border)', 
                background: 'var(--ts-bg-card)', color: '#fff', fontSize: 13 
              }}
            />
            <button 
              onClick={handleAddCustom}
              disabled={!customTaskName.trim()}
              style={{ 
                padding: '8px 16px', borderRadius: 6, 
                background: customTaskName.trim() ? 'var(--ts-violet)' : 'var(--ts-border)', 
                color: customTaskName.trim() ? '#fff' : 'var(--ts-text-muted)', 
                border: 'none', cursor: customTaskName.trim() ? 'pointer' : 'not-allowed', 
                fontWeight: 600, fontSize: 13, transition: 'background 0.2s'
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SubmitConfirmModal ───────────────────────────────────────────────────────

function SubmitConfirmModal({ weekLabel, total, onConfirm, onClose }) {
  return (
    <div className="ts-modal-overlay" onClick={onClose}>
      <div className="ts-modal" onClick={e => e.stopPropagation()} style={{ width: 380 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
          <div className="ts-modal__title" style={{ fontSize: 16 }}>Submit Timesheet?</div>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ts-text-dim)' }}>
            Week of <strong style={{ color: 'var(--ts-text)' }}>{weekLabel}</strong> · <strong style={{ color: 'var(--ts-text)' }}>{total.toFixed(1)}h</strong> total
          </p>
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ts-text-muted)' }}>
            This will lock the grid and send to TL for review.
          </p>
        </div>
        <div className="ts-modal__actions" style={{ justifyContent: 'stretch', gap: 10 }}>
          <button className="ts-modal__cancel-btn" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="ts-modal__confirm-btn" onClick={onConfirm} style={{ flex: 1 }}>Submit</button>
        </div>
      </div>
    </div>
  );
}

// ─── HoursInput ───────────────────────────────────────────────────────────────

function HoursInput({ value, onChange, isReadOnly, rowIdx, dayIdx, onKeyDown }) {
  const [focused, setFocused] = useState(false);
  const val = value === 0 ? '' : String(value);

  return (
    <input
      type="number"
      inputMode="decimal"
      min={0} max={24} step={0.5}
      placeholder="0"
      value={val}
      readOnly={isReadOnly}
      onChange={e => {
        const v = parseFloat(e.target.value);
        onChange(isNaN(v) ? 0 : Math.min(24, Math.max(0, v)));
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={e => onKeyDown(e, rowIdx, dayIdx)}
      className="ts-hour-input"
      style={{
        width: '100%',
        borderColor: focused ? 'rgba(167,139,250,0.6)' : 'var(--ts-border)',
        background: isReadOnly
          ? 'rgba(255,255,255,0.03)'
          : focused
            ? 'rgba(167,139,250,0.07)'
            : 'var(--ts-bg-inner)',
      }}
      disabled={isReadOnly}
    />
  );
}

// ─── DayTotalBadge ────────────────────────────────────────────────────────────

function DayTotalBadge({ total }) {
  const cls = total >= 8
    ? 'ts-day-total--ok'
    : total > 0
      ? 'ts-day-total--partial'
      : 'ts-day-total--zero';
  return (
    <div className={`ts-day-total--na ${cls}`} style={{ textAlign: 'center', fontWeight: 800, fontSize: 14, fontVariantNumeric: 'tabular-nums' }}>
      {total.toFixed(1)}h
    </div>
  );
}

// ─── Main Timesheet ───────────────────────────────────────────────────────────

export default function Timesheet() {
  const [weekOffset, setWeekOffset] = useState(0);

  const [availableTasks, setAvailableTasks] = useState([]);
  
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('draft');
  const [rejectedReason, setRejectedReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const autoSaveTimer = useRef(null);

  const dates = getWeekDates(weekOffset);
  const weekLabel = fmtWeekLabel(dates);
  const total = weekTotal(rows);
  const allDaysFilled = DAYS.every(d => colTotal(rows, d) >= 8);
  const canSubmit = allDaysFilled && status === 'draft';
  const isLocked = status === 'submitted' || status === 'approved';

  const weekStartDateStr = dates[0].toISOString().slice(0, 10);

  // Fetch Available Tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const res = await fetch('/api/employee-portal/tasks/my-tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAvailableTasks(data.map(t => ({ id: t.id, name: t.title, sprint: t.sprint || 'General' })));
        }
      } catch (e) { console.error(e); }
    };
    fetchTasks();
  }, []);

  // Fetch Timesheet for Week
  useEffect(() => {
    const fetchTimesheet = async () => {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const res = await fetch(`/api/timesheets/my-timesheets?week_start_date=${weekStartDateStr}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            const ts = data[0];
            setRows(ts.rows || []);
            setStatus(ts.status || 'draft');
            setRejectedReason(ts.rejection_comment || '');
          } else {
            // Empty week — start with blank rows
            setRows([]);
            setStatus('draft');
            setRejectedReason('');
          }
        }
      } catch (e) { console.error(e); }
    };
    fetchTimesheet();
  }, [weekStartDateStr]);

  // Autosave draft edits to global database
  const triggerAutoSave = async (updatedRows) => {
    if (status === 'submitted' || status === 'approved') return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        await fetch('/api/timesheets/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ week_start_date: weekStartDateStr, rows: updatedRows })
        });
      } catch (e) { console.error(e); }
    }, 1000);
  };

  function updateHours(rowIdx, day, val) {
    const updatedRows = rows.map((r, i) =>
      i === rowIdx ? { ...r, hours: { ...r.hours, [day]: val } } : r
    );
    setRows(updatedRows);
    triggerAutoSave(updatedRows);
  }

  function removeRow(rowIdx) {
    const updatedRows = rows.filter((_, i) => i !== rowIdx);
    setRows(updatedRows);
    triggerAutoSave(updatedRows);
  }

  function addTask(task) {
    const updatedRows = [...rows, {
      taskId: task.id, name: task.name, sprint: task.sprint,
      hours: { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 },
    }];
    setRows(updatedRows);
    triggerAutoSave(updatedRows);
  }

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      // Save first
      await fetch('/api/timesheets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ week_start_date: weekStartDateStr, rows: rows })
      });
      // Then submit
      const res = await fetch('/api/timesheets/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ week_start_date: weekStartDateStr })
      });
      if (res.ok) {
        setStatus('submitted');
        setShowSubmitModal(false);
      }
    } catch (e) { console.error(e); }
  };

  const inputRefs = useRef({});
  function handleKeyDown(e, rowIdx, dayIdx) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextDay = dayIdx + 1;
      if (nextDay < DAYS.length) inputRefs.current[`${rowIdx}-${nextDay}`]?.querySelector('input')?.focus();
      else inputRefs.current[`${rowIdx + 1}-0`]?.querySelector('input')?.focus();
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      inputRefs.current[`${rowIdx + 1}-${dayIdx}`]?.querySelector('input')?.focus();
    }
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      inputRefs.current[`${rowIdx - 1}-${dayIdx}`]?.querySelector('input')?.focus();
    }
  }

  return (
    <div className="component-container ts-root">
      {/* Header */}
      <div className="component-header">
        <div>
          <h1>Timesheet</h1>
          <p>Log your daily hours per task. Submit by end of week for TL review.</p>
        </div>
      </div>

      {/* Status banners */}
      {status === 'submitted' && (
        <div className="ts-banner ts-banner--success" style={{ marginBottom: 16 }}>
          <CheckCircle size={16} />
          <span>Timesheet submitted — locked for review by TL</span>
          <Lock size={13} style={{ marginLeft: 4 }} />
        </div>
      )}
      {status === 'rejected' && (
        <div className="ts-banner ts-banner--rejected" style={{ marginBottom: 16 }}>
          <AlertTriangle size={16} />
          <span>{rejectedReason || 'Hours incomplete. Please correct and resubmit.'}</span>
          <button className="ts-resubmit-btn" onClick={() => setStatus('draft')}>Resubmit</button>
        </div>
      )}

      {/* Week navigator */}
      <div className="ts-card ts-week-nav" style={{ marginBottom: 16 }}>
        <button
          className="ts-week-nav__btn"
          onClick={() => setWeekOffset(o => o - 1)}
          disabled={isLocked}
        >
          <ChevronLeft size={16} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div className="ts-week-nav__label">
            {weekOffset === 0 ? `Current Week · ${weekLabel}` : weekLabel}
          </div>
        </div>
        <button
          className="ts-week-nav__btn"
          onClick={() => setWeekOffset(o => o + 1)}
          disabled={isLocked}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid */}
      <div className="ts-card" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
        {/* Grid header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px repeat(5, 1fr) 80px 36px',
          background: 'var(--ts-bg-inner)',
          borderBottom: '1px solid var(--ts-border)',
          padding: '0 16px',
        }}>
          <div style={thStyle}>Task</div>
          {DAYS.map((d, i) => (
            <div key={d} style={{ ...thStyle, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: 'var(--ts-text-dim)' }}>{d.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: 'var(--ts-text-muted)', fontWeight: 400 }}>
                {fmtDate(dates[i]).toUpperCase()}
              </div>
            </div>
          ))}
          <div style={{ ...thStyle, textAlign: 'center', color: 'var(--ts-emerald)' }}>Total</div>
          <div style={thStyle} />
        </div>

        {/* Task rows */}
        {rows.map((row, rowIdx) => (
          <div key={rowIdx} style={{
            display: 'grid',
            gridTemplateColumns: '180px repeat(5, 1fr) 80px 36px',
            borderBottom: '1px solid var(--ts-border-subtle)',
            padding: '10px 16px', alignItems: 'center', gap: 8,
            background: rowIdx % 2 === 0 ? 'var(--ts-bg-card)' : 'rgba(255,255,255,0.015)',
          }}>
            {/* Task name */}
            <div style={{ paddingRight: 8 }}>
              <p style={{
                margin: 0, fontSize: 12, fontWeight: 600,
                color: 'var(--ts-text)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }} title={row.name}>{row.name}</p>
              <p style={{ margin: '2px 0 0', fontSize: 10, color: 'var(--ts-text-muted)' }}>
                {row.sprint}
              </p>
            </div>

            {/* Hour inputs */}
            {DAYS.map((d, dayIdx) => (
              <div key={d} ref={el => inputRefs.current[`${rowIdx}-${dayIdx}`] = el}>
                <HoursInput
                  value={row.hours[d]}
                  onChange={val => updateHours(rowIdx, d, val)}
                  isReadOnly={isLocked}
                  rowIdx={rowIdx}
                  dayIdx={dayIdx}
                  onKeyDown={handleKeyDown}
                />
              </div>
            ))}

            {/* Row total */}
            <div style={{
              textAlign: 'center', fontWeight: 800, fontSize: 14,
              color: dayTotal(row) > 0 ? 'var(--ts-emerald)' : 'var(--ts-text-dim)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {dayTotal(row).toFixed(1)}h
            </div>

            {/* Remove */}
            <button
              onClick={() => removeRow(rowIdx)}
              disabled={isLocked}
              style={{
                background: 'none', border: 'none',
                cursor: isLocked ? 'not-allowed' : 'pointer',
                color: 'var(--ts-text-muted)', padding: 4, borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: isLocked ? 0.3 : 1, transition: 'color 150ms',
              }}
              onMouseEnter={e => { if (!isLocked) e.currentTarget.style.color = 'var(--ts-red)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--ts-text-muted)'; }}
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}

        {/* Add task row */}
        {!isLocked && (
          <div style={{ padding: '10px 16px', borderTop: '1px dashed var(--ts-border)' }}>
            <button className="ts-add-btn" onClick={() => setShowAddModal(true)} style={{ width: '100%', justifyContent: 'center' }}>
              <Plus size={15} /> Add Task Row
            </button>
          </div>
        )}

        {/* Footer totals */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px repeat(5, 1fr) 80px 36px',
          padding: '12px 16px',
          background: 'var(--ts-bg-inner)',
          borderTop: '2px solid var(--ts-border)',
          alignItems: 'center', gap: 8,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ts-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Day Total
          </div>
          {DAYS.map(d => (
            <DayTotalBadge key={d} total={colTotal(rows, d)} />
          ))}
          <div style={{
            textAlign: 'center', fontWeight: 900, fontSize: 15,
            color: total >= 40 ? 'var(--ts-emerald)' : 'var(--ts-violet)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {total.toFixed(1)}h
          </div>
          <div />
        </div>
      </div>

      {/* Submit area */}
      <div className="ts-submit-bar" style={{
        border: `1px solid ${canSubmit ? 'var(--ts-violet-border)' : 'var(--ts-border)'}`,
        boxShadow: canSubmit ? '0 0 0 3px rgba(167,139,250,0.08)' : 'none',
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ts-text)' }}>
            Week Total: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{total.toFixed(1)}h</span>
            {!allDaysFilled && status === 'draft' && (
              <span className="ts-submit-bar__warning" style={{ display: 'inline-flex', marginLeft: 10, fontSize: 11 }}>
                ⚠ All weekdays need ≥8h to unlock submit
              </span>
            )}
          </p>
          <p style={{ margin: '3px 0 0', fontSize: 11, color: 'var(--ts-text-muted)' }}>
            Auto-saved · {isLocked ? 'Submitted for review' : 'Draft'}
          </p>
        </div>
        <button
          onClick={() => canSubmit && setShowSubmitModal(true)}
          disabled={!canSubmit}
          className={`ts-submit-btn ${canSubmit ? 'ts-submit-btn--ready' : ''}`}
          style={{
            background: canSubmit ? 'hsl(265,70%,35%)' : 'hsl(240,20%,20%)',
            color: canSubmit ? '#fff' : 'rgba(255,255,255,0.3)',
          }}
        >
          {isLocked ? <Lock size={14} /> : <Send size={14} />}
          {isLocked ? 'Submitted' : 'Submit Timesheet'}
        </button>
      </div>


      {/* Modals */}
      {showAddModal && (
        <AddTaskModal
          onAdd={addTask}
          onClose={() => setShowAddModal(false)}
          existingIds={rows.map(r => r.taskId)}
          existingNames={rows.map(r => r.name.toLowerCase())}
          availableTasks={availableTasks}
        />
      )}
      {showSubmitModal && (
        <SubmitConfirmModal
          weekLabel={weekLabel}
          total={total}
          onConfirm={handleSubmit}
          onClose={() => setShowSubmitModal(false)}
        />
      )}
    </div>
  );
}

const thStyle = {
  padding: '12px 0',
  fontSize: 11, fontWeight: 700,
  color: 'var(--ts-text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};