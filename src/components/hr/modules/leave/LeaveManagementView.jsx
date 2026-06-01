import { useState } from 'react';
import { Calendar } from 'lucide-react';

export function LeaveManagementView({ db, onUpdateDb }) {
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [denyingId, setDenyingId] = useState(null);
  const [denyComment, setDenyComment] = useState('');

  const handleApproveLeave = (id) => {
    const req = db.leaveRequests.find(r => r.id === id);
    if (!req) return;

    const emp = db.employees.find(e => e.id === req.employee_id) || { name: 'Employee' };

    const updatedRequests = db.leaveRequests.map(r => {
      if (r.id === id) {
        return { ...r, status: 'hr_approved', hr_approved_at: new Date().toISOString() };
      }
      return r;
    });

    const updatedBalances = db.leaveBalances.map(b => {
      if (b.employee_id === req.employee_id) {
        const type = req.leave_type;
        return {
          ...b,
          [type]: Math.max(0, b[type] - req.days)
        };
      }
      return b;
    });

    // Create approval notification for the sender
    const newNotification = {
      id: +new Date(),
      employee_id: req.employee_id,
      message: `Your ${req.leave_type} leave request for ${req.days} days (${req.from_date} to ${req.to_date}) has been approved by HR.`,
      timestamp: new Date().toISOString(),
      type: 'success',
      read: false
    };

    const updatedNotifications = db.notifications ? [...db.notifications, newNotification] : [newNotification];

    onUpdateDb({
      ...db,
      leaveRequests: updatedRequests,
      leaveBalances: updatedBalances,
      notifications: updatedNotifications
    });

    alert(`Leave request approved!\n\nMessage sent to ${emp.name}: "Your ${req.leave_type} leave request has been approved by HR."`);
  };

  const handleDenyLeave = (id) => {
    if (!denyComment.trim()) {
      alert('Please specify a reason for denying this leave request.');
      return;
    }
    const req = db.leaveRequests.find(r => r.id === id);
    if (!req) return;

    const emp = db.employees.find(e => e.id === req.employee_id) || { name: 'Employee' };

    // Update leave request status to denied
    const updatedRequests = db.leaveRequests.map(r => {
      if (r.id === id) {
        return { ...r, status: 'denied', hr_denied_at: new Date().toISOString(), denial_reason: denyComment };
      }
      return r;
    });

    // Create a deny notification for the sender
    const newNotification = {
      id: +new Date(),
      employee_id: req.employee_id,
      message: `Your ${req.leave_type} leave request (${req.from_date} to ${req.to_date}) was denied by HR. Reason: ${denyComment}`,
      timestamp: new Date().toISOString(),
      type: 'danger',
      read: false
    };

    const updatedNotifications = db.notifications ? [...db.notifications, newNotification] : [newNotification];

    onUpdateDb({
      ...db,
      leaveRequests: updatedRequests,
      notifications: updatedNotifications
    });

    alert(`Leave request denied.\n\nDenial comment dispatched to ${emp.name}: "Your leave request was denied. Reason: ${denyComment}"`);
    
    setDenyingId(null);
    setDenyComment('');
  };

  const pendingRequests = db.leaveRequests.filter(r => r.status === 'tl_approved' || r.status === 'pending');

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Leave Management</h1>
          <p>Oversee company leave accruals policies, check team calendar overlapping alerts, and approve leaves.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          {pendingRequests.length > 0 && (
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
                borderRadius: '12px'
              }}
            >
              <span>🔔 Leave Requests</span>
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
            </button>
          )}
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
              </tr>
            </thead>
            <tbody>
              {db.leaveBalances.map(b => {
                const emp = db.employees.find(e => e.id === b.employee_id) || { name: 'Unknown' };
                return (
                  <tr key={b.id}>
                    <td style={{ padding: '16px 40px' }}><strong>{emp.name}</strong></td>
                    <td style={{ padding: '16px 40px' }}>{b.CL}</td>
                    <td style={{ padding: '16px 40px' }}>{b.SL}</td>
                    <td style={{ padding: '16px 40px' }}>{b.EL}</td>
                    <td style={{ padding: '16px 40px' }}>{b.Maternity}</td>
                    <td style={{ padding: '16px 40px' }}>{b.Paternity}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔔 LEAVE REQUESTS DETAILS POPUP MODAL */}
      {isRequestOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: '520px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} /> Leave Approval Requests
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => { setIsRequestOpen(false); setDenyingId(null); setDenyComment(''); }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pendingRequests.map(r => {
                const emp = db.employees.find(e => e.id === r.employee_id) || { name: 'Unknown', designation: 'Employee' };
                return (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{emp.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.designation}</div>
                      </div>
                      <span className="badge-pill bg-pink" style={{ fontSize: '10px' }}>Type: {r.leave_type}</span>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '6px' }}>
                      <div><strong>Duration:</strong> {r.days} days ({r.from_date} to {r.to_date})</div>
                      <div style={{ marginTop: '4px' }}><strong>Reason:</strong> <span style={{ fontStyle: 'italic', color: 'var(--accent-gold)' }}>"{r.reason}"</span></div>
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
                        <>
                          <button 
                            className="print-btn"
                            style={{ padding: '6px 12px', fontSize: '11.5px', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                            onClick={() => { setDenyingId(r.id); setDenyComment(''); }}
                          >
                            Deny with Comment
                          </button>
                          <button 
                            className="print-btn"
                            style={{ padding: '6px 12px', fontSize: '11.5px', backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none' }}
                            onClick={() => {
                              handleApproveLeave(r.id);
                              if (pendingRequests.length <= 1) {
                                setIsRequestOpen(false);
                              }
                            }}
                          >
                            Approve Leave
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
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
