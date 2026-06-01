import { useState } from 'react';
import { Clock } from 'lucide-react';

export function AttendanceRegisterView({ db, onUpdateDb }) {
  const [showRoster, setShowRoster] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [denyingId, setDenyingId] = useState(null);
  const [denyComment, setDenyComment] = useState('');

  const handleApproveCorrection = (id) => {
    const correction = db.attendanceCorrections?.find(c => c.id === id);
    if (!correction) return;

    const emp = db.employees.find(e => e.id === correction.employee_id) || { name: 'Employee' };

    // Remove correction and update log
    const updatedCorrections = db.attendanceCorrections.filter(c => c.id !== id);
    
    // Add check in log
    const newLog = {
      id: +new Date(),
      employee_id: correction.employee_id,
      date: correction.correction_date,
      clock_in: correction.requested_clock_in,
      clock_out: correction.requested_clock_out,
      work_mode: 'office',
      is_late: false,
      exception_flag: 'none'
    };

    // Notify employee of approval
    const newNotification = {
      id: +new Date() + 1,
      employee_id: correction.employee_id,
      message: `Your regularization request for ${correction.correction_date} has been approved.`,
      timestamp: new Date().toISOString(),
      type: 'success',
      read: false
    };

    const updatedNotifications = db.notifications ? [...db.notifications, newNotification] : [newNotification];

    onUpdateDb({
      ...db,
      attendanceCorrections: updatedCorrections,
      attendanceLogs: [...db.attendanceLogs, newLog],
      notifications: updatedNotifications
    });

    alert(`Missed punch correction approved!\n\nMessage sent to ${emp.name}: "Your regularization request for ${correction.correction_date} has been approved."`);
  };

  const handleDenyCorrection = (id) => {
    if (!denyComment.trim()) {
      alert('Please specify a reason for denying the request.');
      return;
    }
    const correction = db.attendanceCorrections?.find(c => c.id === id);
    if (!correction) return;

    const emp = db.employees.find(e => e.id === correction.employee_id) || { name: 'Employee' };

    // Remove from active corrections
    const updatedCorrections = db.attendanceCorrections.filter(c => c.id !== id);

    // Create a deny notification for the sender
    const newNotification = {
      id: +new Date(),
      employee_id: correction.employee_id,
      message: `Your regularization request for ${correction.correction_date} has been denied. Reason: ${denyComment}`,
      timestamp: new Date().toISOString(),
      type: 'danger',
      read: false
    };

    const updatedNotifications = db.notifications ? [...db.notifications, newNotification] : [newNotification];

    onUpdateDb({
      ...db,
      attendanceCorrections: updatedCorrections,
      notifications: updatedNotifications
    });

    alert(`Regularization request denied.\n\nDenial comment dispatched to ${emp.name}: "Your regularization request for ${correction.correction_date} was denied. Reason: ${denyComment}"`);
    
    setDenyingId(null);
    setDenyComment('');
  };

  const activeCorrections = db.attendanceCorrections || [];

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Attendance Register</h1>
          <p>Review presence registers, oversee shifts schedule swap requests, and approve missed-punch overrides.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <button className="print-btn" onClick={() => setShowRoster(!showRoster)}>
            {showRoster ? 'Hide Shift Roster' : 'View Shift Roster Planner'}
          </button>
          {activeCorrections.length > 0 && (
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
                fontWeight: '600'
              }}
            >
              <span>🔔 Regularization Requests</span>
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
                {activeCorrections.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {showRoster && (
        <div className="pipeline" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <div className="pipeline-title">Shift Roster Planner (General Shifts: 09:00 - 18:00)</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {db.employees.map(emp => (
              <span key={emp.id} className="badge-pill bg-blue" style={{ padding: '6px 12px' }}>
                {emp.name}: Mon-Fri (Standard Shift)
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ width: '100%' }}>
        {/* Attendance Register */}
        <div className="table-container" style={{ margin: 0, overflowX: 'auto', width: '100%' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Employee Name</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Punch Date</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Clock In Time</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Clock Out Time</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Work Mode</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Punch Flags</th>
              </tr>
            </thead>
            <tbody>
              {db.attendanceLogs.map(log => {
                const emp = db.employees.find(e => e.id === log.employee_id) || { name: 'Unknown' };
                return (
                  <tr key={log.id}>
                    <td style={{ padding: '16px 40px' }}><strong>{emp.name}</strong></td>
                    <td style={{ padding: '16px 40px' }}>{log.date}</td>
                    <td style={{ padding: '16px 40px' }}>{log.clock_in ? new Date(log.clock_in).toLocaleTimeString() : <span style={{ color: 'red' }}>Missed</span>}</td>
                    <td style={{ padding: '16px 40px' }}>{log.clock_out ? new Date(log.clock_out).toLocaleTimeString() : <span style={{ color: 'red' }}>Missed</span>}</td>
                    <td style={{ padding: '16px 40px' }}><span className="badge-pill bg-pink">{log.work_mode.toUpperCase()}</span></td>
                    <td style={{ padding: '16px 40px' }}>
                      <span className={`badge-pill ${log.exception_flag === 'none' ? 'badge-green' : 'badge-gold'}`}>
                        {log.exception_flag}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔔 REGULARIZATION REQUESTS DETAILS POPUP MODAL */}
      {isRequestOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: '520px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} /> Regularization Override Requests
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => { setIsRequestOpen(false); setDenyingId(null); setDenyComment(''); }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeCorrections.map(c => {
                const emp = db.employees.find(e => e.id === c.employee_id) || { name: 'Unknown', designation: 'Employee' };
                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{emp.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.designation}</div>
                      </div>
                      <span className="badge-pill bg-pink" style={{ fontSize: '10px' }}>Date: {c.correction_date}</span>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '6px' }}>
                      <div><strong>Requested Clock In:</strong> {new Date(c.requested_clock_in).toLocaleTimeString()}</div>
                      <div><strong>Requested Clock Out:</strong> {new Date(c.requested_clock_out).toLocaleTimeString()}</div>
                      <div style={{ marginTop: '4px' }}><strong>Reason:</strong> <span style={{ fontStyle: 'italic', color: 'var(--accent-gold)' }}>"{c.reason}"</span></div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      {denyingId === c.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Denial Reason Comment</label>
                          <textarea 
                            value={denyComment} 
                            onChange={(e) => setDenyComment(e.target.value)} 
                            placeholder="Please provide the reason for denying this request..." 
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
                              onClick={() => handleDenyCorrection(c.id)} 
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
                            onClick={() => { setDenyingId(c.id); setDenyComment(''); }}
                          >
                            Deny with Comment
                          </button>
                          <button 
                            className="print-btn"
                            style={{ padding: '6px 12px', fontSize: '11.5px', backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none' }}
                            onClick={() => {
                              handleApproveCorrection(c.id);
                              if (activeCorrections.length <= 1) {
                                setIsRequestOpen(false);
                              }
                            }}
                          >
                            Approve Swipe
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
