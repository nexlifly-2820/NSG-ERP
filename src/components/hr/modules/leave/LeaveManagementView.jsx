import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

export function LeaveManagementView() {
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const empRes = await fetch('/api/hr-portal/employees', { headers });
      if(empRes.ok) setEmployees(await empRes.json());
      const reqRes = await fetch('/api/hr-portal/leaves/requests', { headers });
      if(reqRes.ok) setLeaveRequests(await reqRes.json());
      const balRes = await fetch('/api/hr-portal/leaves/balances', { headers });
      if(balRes.ok) setLeaveBalances(await balRes.json());
    } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [denyingId, setDenyingId] = useState(null);
  const [denyComment, setDenyComment] = useState('');

  // CRUD States
  const [isApplyOnBehalfOpen, setIsApplyOnBehalfOpen] = useState(false);
  const [behalfEmpId, setBehalfEmpId] = useState('');
  const [behalfType, setBehalfType] = useState('CL');
  const [behalfFrom, setBehalfFrom] = useState('');
  const [behalfTo, setBehalfTo] = useState('');
  const [behalfDays, setBehalfDays] = useState('');
  const [behalfReason, setBehalfReason] = useState('');

  const [editingBalance, setEditingBalance] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [requestFilter, setRequestFilter] = useState('pending'); // pending | approved | denied | all

  const handleApplyOnBehalf = async (e) => {
    e.preventDefault();
    if (!behalfEmpId) return alert('Please select an employee.');
    const empId = Number(behalfEmpId);
    const daysCount = parseFloat(behalfDays) || 0;
    if (daysCount <= 0) return alert('Please specify a positive number of days.');
    
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/leaves/on-behalf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          employee_id: empId,
          leave_type: behalfType,
          from_date: behalfFrom,
          to_date: behalfTo,
          days: daysCount,
          reason: behalfReason
        })
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      setIsApplyOnBehalfOpen(false);
      setBehalfEmpId(''); setBehalfType('CL'); setBehalfFrom(''); setBehalfTo(''); setBehalfDays(''); setBehalfReason('');
      alert('Successfully applied and approved leave.');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleSaveBalanceAdjustment = async (e) => {
    e.preventDefault();
    if (!editingBalance) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/balances/${editingBalance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          CL: parseFloat(editingBalance.CL) || 0,
          SL: parseFloat(editingBalance.SL) || 0,
          EL: parseFloat(editingBalance.EL) || 0,
          Maternity: parseFloat(editingBalance.Maternity) || 0,
          Paternity: parseFloat(editingBalance.Paternity) || 0
        })
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      setEditingBalance(null);
      alert('Leave balances successfully adjusted.');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleSaveRequestEdit = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/requests/${editingRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          leave_type: editingRequest.leave_type,
          from_date: editingRequest.from_date,
          to_date: editingRequest.to_date,
          days: parseFloat(editingRequest.days) || 0,
          reason: editingRequest.reason
        })
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      setEditingRequest(null);
      alert('Leave request successfully updated.');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleDeleteLeaveRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      alert('Leave request deleted successfully.');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleApproveLeave = async (id) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      alert('Leave request approved!');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleDenyLeave = async (id) => {
    if (!denyComment.trim()) return alert('Please specify a reason for denying this leave request.');
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/requests/${id}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: denyComment })
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      alert('Leave request denied.');
      setDenyingId(null);
      setDenyComment('');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const displayedRequests = leaveRequests.filter(r => {
    if (requestFilter === 'pending') return r.status === 'pending';
    if (requestFilter === 'approved') return r.status === 'approved';
    if (requestFilter === 'denied') return r.status === 'rejected';
    return true; // 'all'
  });

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Leave Management</h1>
          <p>Oversee company leave accruals policies, check team calendar overlapping alerts, and approve leaves.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            className="print-btn" 
            onClick={() => setIsApplyOnBehalfOpen(true)}
            style={{ 
              backgroundColor: 'transparent',
              color: 'var(--accent-pink)',
              border: '1px dashed var(--accent-pink)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            ➕ Apply Leave (On Behalf)
          </button>

          <button 
            className="print-btn" 
            onClick={() => setIsRequestOpen(true)}
            style={{ 
              position: 'relative',
              backgroundColor: 'var(--accent-pink)',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-sm)',
              fontWeight: '600',
              padding: '12px 24px',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            <span>🔔 Manage Leave Requests</span>
            {pendingRequests.length > 0 && (
              <span style={{ 
                backgroundColor: '#fff', 
                color: 'var(--accent-pink)', 
                borderRadius: '50%', 
                width: '18px', 
                height: '18px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '11px', 
                fontWeight: 'bold' 
              }}>
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        {/* Balances grid */}
        <div className="table-container" style={{ margin: 0, overflowX: 'auto', width: '100%' }}>
          <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>Staff Active Leave Balances</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Employee Name</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>CL Balance</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>SL Balance</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>EL Balance</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Maternity</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Paternity</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {leaveBalances.map(b => {
                const emp = employees.find(e => e.id === b.user_id) || { name: 'Unknown' };
                return (
                  <tr key={b.id}>
                    <td style={{ padding: '16px 40px' }}><strong>{emp.name}</strong></td>
                    <td style={{ padding: '16px 40px' }}>{b.CL}</td>
                    <td style={{ padding: '16px 40px' }}>{b.SL}</td>
                    <td style={{ padding: '16px 40px' }}>{b.EL}</td>
                    <td style={{ padding: '16px 40px' }}>{b.Maternity}</td>
                    <td style={{ padding: '16px 40px' }}>{b.Paternity}</td>
                    <td style={{ padding: '16px 40px' }}>
                      <button
                        onClick={() => setEditingBalance({ ...b })}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-pink)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}
                      >
                        ✏️ Edit Balances
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ➕ APPLY LEAVE ON BEHALF MODAL */}
      {isApplyOnBehalfOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <form 
            onSubmit={handleApplyOnBehalf} 
            className="card" 
            style={{ width: '480px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ➕ Apply Leave (On Behalf)
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setIsApplyOnBehalfOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Select Employee</label>
                <select 
                  value={behalfEmpId} 
                  onChange={(e) => setBehalfEmpId(e.target.value)} 
                  required 
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="">-- Choose Staff member --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.emp_id} - {emp.department})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Leave Type</label>
                  <select 
                    value={behalfType} 
                    onChange={(e) => setBehalfType(e.target.value)} 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                  >
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="SL">Sick Leave (SL)</option>
                    <option value="EL">Earned Leave (EL)</option>
                    <option value="Maternity">Maternity Leave</option>
                    <option value="Paternity">Paternity Leave</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Leave Duration (Days)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    max="30" 
                    value={behalfDays} 
                    onChange={(e) => setBehalfDays(e.target.value)} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>From Date</label>
                  <input 
                    type="date" 
                    value={behalfFrom} 
                    onChange={(e) => setBehalfFrom(e.target.value)} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>To Date</label>
                  <input 
                    type="date" 
                    value={behalfTo} 
                    onChange={(e) => setBehalfTo(e.target.value)} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Reason / Description</label>
                <textarea 
                  value={behalfReason} 
                  onChange={(e) => setBehalfReason(e.target.value)} 
                  required 
                  placeholder="Reason for leave submission..." 
                  style={{ width: '100%', minHeight: '60px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none', resize: 'vertical' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setIsApplyOnBehalfOpen(false)}>Cancel</button>
              <button 
                type="submit"
                style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Submit &amp; Auto-Approve
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ✏️ EDIT LEAVE BALANCES MODAL */}
      {editingBalance && (() => {
        const emp = employees.find(e => e.id === editingBalance.user_id) || { name: 'Employee' };
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <form 
              onSubmit={handleSaveBalanceAdjustment} 
              className="card" 
              style={{ width: '420px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)' }}>
                  ✏️ Adjust Leave Balances
                </h3>
                <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setEditingBalance(null)}>✕</button>
              </div>

              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Adjusting balances for: <strong>{emp.name}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Casual Leave (CL)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0"
                    value={editingBalance.CL} 
                    onChange={(e) => setEditingBalance({ ...editingBalance, CL: e.target.value })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Sick Leave (SL)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0"
                    value={editingBalance.SL} 
                    onChange={(e) => setEditingBalance({ ...editingBalance, SL: e.target.value })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Earned Leave (EL)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0"
                    value={editingBalance.EL} 
                    onChange={(e) => setEditingBalance({ ...editingBalance, EL: e.target.value })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Maternity</label>
                  <input 
                    type="number" 
                    step="1" 
                    min="0"
                    value={editingBalance.Maternity} 
                    onChange={(e) => setEditingBalance({ ...editingBalance, Maternity: e.target.value })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Paternity</label>
                  <input 
                    type="number" 
                    step="1" 
                    min="0"
                    value={editingBalance.Paternity} 
                    onChange={(e) => setEditingBalance({ ...editingBalance, Paternity: e.target.value })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
                <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setEditingBalance(null)}>Cancel</button>
                <button 
                  type="submit"
                  style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ✏️ EDIT LEAVE REQUEST MODAL */}
      {editingRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }}>
          <form 
            onSubmit={handleSaveRequestEdit} 
            className="card" 
            style={{ width: '440px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)' }}>
                ✏️ Edit Leave Request
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setEditingRequest(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Leave Type</label>
                  <select 
                    value={editingRequest.leave_type} 
                    onChange={(e) => setEditingRequest({ ...editingRequest, leave_type: e.target.value })} 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }}
                  >
                    <option value="CL">CL</option>
                    <option value="SL">SL</option>
                    <option value="EL">EL</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Paternity">Paternity</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Duration (Days)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    value={editingRequest.days} 
                    onChange={(e) => setEditingRequest({ ...editingRequest, days: parseFloat(e.target.value) || 0 })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>From Date</label>
                  <input 
                    type="date" 
                    value={editingRequest.from_date} 
                    onChange={(e) => setEditingRequest({ ...editingRequest, from_date: e.target.value })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>To Date</label>
                  <input 
                    type="date" 
                    value={editingRequest.to_date} 
                    onChange={(e) => setEditingRequest({ ...editingRequest, to_date: e.target.value })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Reason</label>
                <textarea 
                  value={editingRequest.reason} 
                  onChange={(e) => setEditingRequest({ ...editingRequest, reason: e.target.value })} 
                  required 
                  style={{ width: '100%', minHeight: '60px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none', resize: 'vertical' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setEditingRequest(null)}>Cancel</button>
              <button 
                type="submit"
                style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🔔 LEAVE REQUESTS DETAILS POPUP MODAL */}
      {isRequestOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: '540px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} /> Leave Approval Requests
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => { setIsRequestOpen(false); setDenyingId(null); setDenyComment(''); }}>✕</button>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              {[
                { id: 'pending', label: '⏳ Pending' },
                { id: 'approved', label: '✅ Approved' },
                { id: 'denied', label: '❌ Denied' },
                { id: 'all', label: '📂 All Logs' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { setRequestFilter(f.id); setDenyingId(null); }}
                  style={{
                    backgroundColor: requestFilter === f.id ? 'var(--accent-pink)' : 'var(--bg-primary)',
                    color: '#fff',
                    border: '1px solid var(--border-color)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {displayedRequests.map(r => {
                const emp = employees.find(e => e.id === r.user_id) || { name: 'Unknown', designation: 'Employee' };
                return (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{emp.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.designation}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge-pill" style={{ fontSize: '10.5px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', backgroundColor: 'rgba(236,72,153,0.1)', color: 'var(--accent-pink)' }}>Type: {r.leave_type}</span>
                        <span className="badge-pill" style={{ 
                          fontSize: '10.5px', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontWeight: 'bold', 
                          backgroundColor: 
                            r.status === 'approved' ? 'rgba(16,185,129,0.1)' : 
                            r.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 
                            'rgba(245,158,11,0.1)', 
                          color: 
                            r.status === 'approved' ? 'var(--accent-green)' : 
                            r.status === 'rejected' ? '#ef4444' : 
                            'var(--accent-gold)' 
                        }}>
                          {r.status === 'approved' ? '✅ Approved' : 
                           r.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '6px' }}>
                      <div><strong>Duration:</strong> {r.days} days ({r.from_date} to {r.to_date})</div>
                      <div style={{ marginTop: '4px' }}><strong>Reason:</strong> <span style={{ fontStyle: 'italic', color: 'var(--accent-gold)' }}>"{r.reason}"</span></div>
                      {r.status === 'denied' && r.denial_reason && (
                        <div style={{ marginTop: '4px', color: '#ef4444' }}><strong>Denial Reason:</strong> {r.denial_reason}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      {denyingId === r.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Denial Reason Comment</label>
                          <textarea 
                            value={denyComment} 
                            onChange={(e) => setDenyComment(e.target.value)} 
                            placeholder="Please provide the reason for denying this leave request..." 
                            required
                            style={{ width: '100%', minHeight: '60px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', outline: 'none', resize: 'vertical' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              onClick={() => setDenyingId(null)} 
                              className="print-btn"
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                            >
                              Cancel
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDenyLeave(r.id)} 
                              className="print-btn"
                              style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}
                            >
                              Send Denial &amp; Comment
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                          {/* Left-side action: Edit & Delete */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setEditingRequest({ ...r })}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Edit Details"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLeaveRequest(r.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Void/Delete Request"
                            >
                              🗑️ {r.status === 'approved' ? 'Void' : 'Delete'}
                            </button>
                          </div>

                          {/* Right-side action: Approve/Deny (only for pending) */}
                          {(r.status === 'pending') && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="print-btn"
                                style={{ padding: '6px 12px', fontSize: '11.5px', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                                onClick={() => { setDenyingId(r.id); setDenyComment(''); }}
                              >
                                Deny
                              </button>
                              <button 
                                className="print-btn"
                                style={{ padding: '6px 12px', fontSize: '11.5px', backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none' }}
                                onClick={() => {
                                  handleApproveLeave(r.id);
                                }}
                              >
                                Approve
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {displayedRequests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No leave requests found for this filter.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
              <button className="print-btn" onClick={() => { setIsRequestOpen(false); setDenyingId(null); setDenyComment(''); }}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
