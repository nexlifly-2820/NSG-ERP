import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

const fetcher = url => fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('nsg_jwt_token')}` } }).then(res => res.json());
import './Leave.css';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function countWorkDays(from, to) {
  if (!from || !to) return 0;
  let count = 0;
  let cur = new Date(from);
  const end = new Date(to);
  while (cur <= end) {
    const d = cur.getDay();
    if (d !== 0 && d !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// ─── LeaveDonut (SVG ring) ────────────────────────────────────────────────────
function LeaveDonut({ used, total, color, size = 80 }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const remaining = total - used;
  const isEmpty = remaining <= 0;
  const ringColor = isEmpty ? 'hsl(0,70%,55%)' : color;
  const pct = isEmpty ? 1 : used / total;
  const dash = pct * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="lv-donut">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10"/>
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={ringColor} strokeWidth="10"
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)' }}
      />
      <text x={size/2} y={size/2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={isEmpty ? 'hsl(0,70%,65%)' : 'var(--lv-text-primary)'}
        fontSize="11" fontWeight="800" fontFamily="inherit">
        {isEmpty ? '0' : remaining}
      </text>
      <text x={size/2} y={size/2 + 13} textAnchor="middle" dominantBaseline="middle"
        fill="var(--lv-text-muted)" fontSize="7" fontWeight="600" fontFamily="inherit" letterSpacing="0.5">
        LEFT
      </text>
    </svg>
  );
}

// ─── LeaveBalanceCard ─────────────────────────────────────────────────────────
function LeaveBalanceCard({ type, label, used, total, color, onApply }) {
  const remaining = total - used;
  const isEmpty = remaining <= 0;
  return (
    <div className="lv-balance-card" style={{ '--card-accent': color }}>
      <div className="lv-balance-top">
        <div className="lv-balance-info">
          <span className="lv-balance-type">{type}</span>
          <span className="lv-balance-label">{label}</span>
        </div>
        <LeaveDonut used={used} total={total} color={color} size={80} />
      </div>
      <div className="lv-balance-stats">
        <span className="lv-stat"><span className="lv-stat-num">{used}</span><span className="lv-stat-lbl">Used</span></span>
        <span className="lv-stat-divider"/>
        <span className="lv-stat"><span className="lv-stat-num">{total}</span><span className="lv-stat-lbl">Total</span></span>
        <span className="lv-stat-divider"/>
        <span className="lv-stat" style={{ color: isEmpty ? 'hsl(0,70%,65%)' : color }}>
          <span className="lv-stat-num">{remaining}</span><span className="lv-stat-lbl">Left</span>
        </span>
      </div>
      <button
        className="lv-apply-btn"
        onClick={() => onApply(type)}
        disabled={isEmpty}
        style={{ '--btn-color': color }}
      >
        {isEmpty ? 'No Balance' : `Apply ${type}`}
      </button>
    </div>
  );
}


// ─── ApplyLeaveForm ───────────────────────────────────────────────────────────
function ApplyLeaveForm({ prefillType, balances, onSuccess, onRefreshData }) {
  const [leaveType, setLeaveType] = useState(prefillType || '');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [dayCount, setDayCount] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const calcTimer = useRef(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (prefillType) setLeaveType(prefillType);
  }, [prefillType]);

  useEffect(() => {
    if (fromDate && toDate && toDate >= fromDate) {
      setCalculating(true);
      setDayCount(0);
      clearTimeout(calcTimer.current);
      calcTimer.current = setTimeout(() => {
        const count = countWorkDays(fromDate, toDate);
        setDayCount(count);
        setCalculating(false);
      }, 600);
    } else {
      setDayCount(0);
    }
    return () => clearTimeout(calcTimer.current);
  }, [fromDate, toDate]);

  function validate() {
    const e = {};
    if (!leaveType) e.leaveType = 'Select a leave type';
    if (!fromDate) e.fromDate = 'Required';
    else if (fromDate < today) e.fromDate = 'Cannot be in the past';
    if (!toDate) e.toDate = 'Required';
    else if (toDate < fromDate) e.toDate = 'Must be after start date';
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);

    const typeAcronym = leaveType === 'Casual Leave' ? 'CL' : leaveType === 'Sick Leave' ? 'SL' : leaveType === 'Earned Leave' ? 'EL' : leaveType === 'Comp Off' ? 'CompOff' : 'Maternity';
    const payload = {
      leave_type: typeAcronym,
      from_date: fromDate,
      to_date: toDate,
      days: parseFloat(dayCount),
      reason: reason || 'Planned leave.'
    };

    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/leave/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to submit leave request');
      }
      setSuccess(true);
      if (onRefreshData) onRefreshData();
    } catch (error) {
      console.error(error);
      alert(error.message || 'Error submitting leave request');
    } finally {
      setLoading(false);
      setTimeout(() => {
        setSuccess(false);
        setLeaveType(''); setFromDate(''); setToDate('');
        setReason(''); setDayCount(0);
        if (onSuccess) onSuccess();
      }, 1800);
    }
  }

  const LEAVE_TYPES = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Comp Off', 'Maternity/Paternity'];

  return (
    <div className="lv-apply-form">
      <div className="lv-form-header">
        <span className="lv-form-title">Apply Leave</span>
        {dayCount > 0 && (
          <span className={`lv-day-count ${calculating ? 'lv-calculating' : ''}`} style={{ color: leaveType ? (balances || []).find(b => b.label === leaveType || b.type === leaveType)?.color || 'var(--lv-emerald)' : 'var(--lv-emerald)' }}>
            {calculating ? <span className="lv-spin-sm"/> : dayCount} {!calculating && 'days'}
          </span>
        )}
      </div>

      {/* Leave Type */}
      <div className="lv-field-group">
        <label className="lv-label">Leave Type <span className="lv-req">*</span></label>
        <select
          className={`lv-select ${errors.leaveType ? 'lv-input-err' : ''}`}
          value={leaveType}
          onChange={e => { setLeaveType(e.target.value); setErrors(p => ({ ...p, leaveType: '' })); }}
        >
          <option value="">Select type…</option>
          {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        {errors.leaveType && <span className="lv-err-msg">{errors.leaveType}</span>}
      </div>

      {/* Date Range */}
      <div className="lv-date-row">
        <div className="lv-field-group">
          <label className="lv-label">From <span className="lv-req">*</span></label>
          <input
            type="date" className={`lv-input ${errors.fromDate ? 'lv-input-err' : ''}`}
            min={today} value={fromDate}
            onChange={e => { setFromDate(e.target.value); setErrors(p => ({ ...p, fromDate: '' })); }}
          />
          {errors.fromDate && <span className="lv-err-msg">{errors.fromDate}</span>}
        </div>
        <div className="lv-field-group">
          <label className="lv-label">To <span className="lv-req">*</span></label>
          <input
            type="date" className={`lv-input ${errors.toDate ? 'lv-input-err' : ''}`}
            min={fromDate || today} value={toDate}
            onChange={e => { setToDate(e.target.value); setErrors(p => ({ ...p, toDate: '' })); }}
          />
          {errors.toDate && <span className="lv-err-msg">{errors.toDate}</span>}
        </div>
      </div>


      {/* Reason */}
      <div className="lv-field-group">
        <label className="lv-label">Reason <span className="lv-optional">(optional)</span></label>
        <textarea
          className="lv-textarea"
          placeholder="Brief reason for planned leaves…"
          rows={3}
          maxLength={500}
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
        <span className="lv-char-count">{reason.length}/500</span>
      </div>

      <button
        className={`lv-submit-btn ${loading ? 'lv-loading' : ''} ${success ? 'lv-success' : ''}`}
        onClick={handleSubmit}
        disabled={loading || success}
      >
        {loading ? <><span className="lv-spin"/> Submitting…</> : success ? '✓ Leave Applied!' : 'Submit Application'}
      </button>
    </div>
  );
}

// ─── CancelModal ─────────────────────────────────────────────────────────────
function CancelModal({ leave, onConfirm, onClose }) {
  return (
    <div className="lv-modal-overlay" onClick={onClose}>
      <div className="lv-modal" onClick={e => e.stopPropagation()}>
        <div className="lv-modal-icon">⚠️</div>
        <h3 className="lv-modal-title">Cancel this leave?</h3>
        <p className="lv-modal-body">
          {leave.type} · {fmtDate(leave.from)} – {fmtDate(leave.to)} · {leave.days} day{leave.days > 1 ? 's' : ''}
        </p>
        <p className="lv-modal-note">This action can only be done before the leave starts.</p>
        <div className="lv-modal-actions">
          <button className="lv-modal-cancel" onClick={onClose}>Keep it</button>
          <button className="lv-modal-confirm" onClick={() => onConfirm(leave.id)}>Yes, Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ─── LeaveHistoryTable ────────────────────────────────────────────────────────
function LeaveHistoryTable({ history, onCancelRequest }) {
  const statusClass = { Approved: 'lv-status-approved', Pending: 'lv-status-pending', Rejected: 'lv-status-rejected', Cancelled: 'lv-status-cancelled' };

  return (
    <div className="lv-history">
      <div className="lv-history-header">
        <span className="lv-form-title">Leave History</span>
        <span className="lv-history-count">{history.length} records</span>
      </div>
      <div className="lv-history-table-wrap">
        <table className="lv-table">
          <thead>
            <tr>
              <th>Applied</th>
              <th>Type</th>
              <th>From</th>
              <th>To</th>
              <th>Days</th>
              <th>Status</th>
              <th>Approver</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.map(row => (
              <tr key={row.id} className="lv-table-row">
                <td className="lv-td-muted">{fmtDate(row.applied)}</td>
                <td><span className="lv-type-pill">{row.type}</span></td>
                <td>{fmtDate(row.from)}</td>
                <td>{fmtDate(row.to)}</td>
                <td className="lv-td-days">{row.days}d</td>
                <td><span className={`lv-status-chip ${statusClass[row.status]}`}>{row.status}</span></td>
                <td className="lv-td-muted">{row.approver}</td>
                <td>
                  {row.status === 'Pending' && new Date(row.from) > new Date() && (
                    <button className="lv-cancel-row-btn" onClick={() => onCancelRequest(row)}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── EmpLeavePage (root) ──────────────────────────────────────────────────────
export default function Leave() {
  const [prefillType, setPrefillType] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const formRef = useRef(null);
  
  const { data: balData, mutate: mutateBal } = useSWR('/api/employee-portal/leave/my-balances', fetcher);
  const { data: reqData, mutate: mutateReq } = useSWR('/api/employee-portal/leave/my-requests', fetcher);

  const myDbBalance = balData || null;
  const myHistory = (reqData?.items || []).map(r => ({
      id: r.id,
      applied: r.from_date,
      type: r.leave_type,
      from: r.from_date,
      to: r.to_date,
      days: r.days,
      status: r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : r.status === 'cancelled' ? 'Cancelled' : r.status.charAt(0).toUpperCase() + r.status.slice(1),
      approver: r.status === 'approved' ? 'Management' : '—'
  }));

  const fetchData = () => {
      mutateBal();
      mutateReq();
  };

  const dbBal = myDbBalance || { CL: 12, SL: 8, EL: 15, Maternity: 26, Paternity: 0 };
  const balances = [
    { type: 'CL',      label: 'Casual Leave',       used: myDbBalance ? 12 - (dbBal.CL || 0) : 0,  total: myDbBalance ? 12 : 0, color: 'var(--cl-color)'      },
    { type: 'SL',      label: 'Sick Leave',          used: myDbBalance ? 8 - (dbBal.SL || 0) : 0,   total: myDbBalance ? 8 : 0,  color: 'var(--sl-color)'      },
    { type: 'EL',      label: 'Earned Leave',        used: myDbBalance ? 15 - (dbBal.EL || 0) : 0,  total: myDbBalance ? 15 : 0, color: 'var(--el-color)'      },
    { type: 'Maternity', label: 'Maternity Leave', used: myDbBalance ? 26 - (dbBal.Maternity || 0) : 0, total: myDbBalance ? 26 : 0, color: 'var(--compoff-color)' },
  ];

  function handleApply(type) {
    const match = balances.find(b => b.type === type);
    setPrefillType(match ? match.label : type);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function handleSuccess() {
    setPrefillType('');
  }

  async function handleCancelConfirm(id) {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/employee-portal/leave/request/${id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to cancel request');
      fetchData();
    } catch (error) {
      console.error(error);
      alert('Error cancelling leave request');
    }
    setCancelTarget(null);
  }

  return (
    <div className="lv-root">
      {/* Page Title */}
      <div className="lv-page-header">
        <div>
          <h1 className="lv-page-title">🏖️ Leave</h1>
          <span className="lv-page-breadcrumb">Employee (ESS) → Leave</span>
        </div>
      </div>

      {/* Balance Cards Row */}
      <section className="lv-balances-section">
        <div className="lv-section-label">Leave Balances</div>
        <div className="lv-balances-grid">
          {balances.map(b => (
            <LeaveBalanceCard key={b.type} {...b} onApply={handleApply} />
          ))}
        </div>
      </section>

      {/* Apply + History two-column */}
      <div className="lv-bottom-grid">
        {/* Apply Form */}
        <div ref={formRef}>
          <ApplyLeaveForm prefillType={prefillType} balances={balances} onSuccess={handleSuccess} onRefreshData={fetchData} />
        </div>

        {/* History Table */}
        <div className="lv-history-col">
          <LeaveHistoryTable history={myHistory} onCancelRequest={setCancelTarget} />
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          leave={cancelTarget}
          onConfirm={handleCancelConfirm}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}