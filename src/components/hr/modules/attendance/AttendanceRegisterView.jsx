// Crash fix applied
import { useState, useEffect } from 'react';
import { Clock, Calendar, List } from 'lucide-react';
import { notify } from '../../utils/notify';

export function AttendanceRegisterView() {
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [activeCorrections, setActiveCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState('list');
  const [showRoster, setShowRoster] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [denyingId, setDenyingId] = useState(null);
  const [denyComment, setDenyComment] = useState('');

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('nsg_jwt_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      const [empRes, logsRes, corrRes] = await Promise.all([
        fetch('/api/hr-portal/employees', { headers }),
        fetch('/api/attendance/all-logs', { headers }),
        fetch('/api/attendance/corrections', { headers })
      ]);
      
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }
      
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAttendanceLogs(logsData);
      }
      
      if (corrRes.ok) {
        const corrData = await corrRes.json();
        setActiveCorrections(corrData);
      }
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
      notify('Failed to fetch attendance records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveCorrection = async (id) => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/attendance/corrections/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to approve correction.');
      }
      notify('Missed punch correction approved successfully!');
      // Refresh data
      fetchData();
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  const handleDenyCorrection = async (id) => {
    if (!denyComment.trim()) {
      alert('Please specify a reason for denying the request.');
      return;
    }
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/attendance/corrections/${id}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: denyComment })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to deny correction.');
      }
      notify('Regularization request denied successfully.');
      setDenyingId(null);
      setDenyComment('');
      // Refresh data
      fetchData();
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  let mappedLogs = attendanceLogs || [];

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const logsByEmpAndDay = {};
  mappedLogs.forEach(log => {
    const dateObj = new Date(log.date);
    if (dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
      if (!logsByEmpAndDay[log.employee_id]) logsByEmpAndDay[log.employee_id] = {};
      logsByEmpAndDay[log.employee_id][dateObj.getDate()] = log;
    }
  });

  const renderCalendarCell = (empId, day) => {
    const date = new Date(currentYear, currentMonth, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    if (isWeekend) {
      return <div style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 4px', fontSize: '12px' }} title="Weekend">W</div>;
    }
    const log = logsByEmpAndDay[empId]?.[day];
    if (!log) {
      if (date > today) return <div style={{ textAlign: 'center', padding: '8px 4px', fontSize: '12px', color: 'var(--text-muted)' }}>-</div>;
      return <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', textAlign: 'center', padding: '8px 4px', fontSize: '12px', fontWeight: 'bold' }} title="Absent">A</div>;
    }
    
    if (log.exception_flag === 'absent' || !log.clock_in) {
      return <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', textAlign: 'center', padding: '8px 4px', fontSize: '12px', fontWeight: 'bold' }} title="Absent">A</div>;
    } else if (log.exception_flag === 'late') {
      return <div style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#eab308', textAlign: 'center', padding: '8px 4px', fontSize: '12px', fontWeight: 'bold' }} title="Late">L</div>;
    } else {
      return <div style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', textAlign: 'center', padding: '8px 4px', fontSize: '12px', fontWeight: 'bold' }} title="Present">P</div>;
    }
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Attendance Register</h1>
          <p>Review presence registers, oversee shifts schedule swap requests, and approve missed-punch overrides.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
            <button 
              onClick={() => setViewMode('list')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: viewMode === 'list' ? 'var(--bg-tertiary)' : 'transparent', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
            >
              <List size={16} /> List View
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: viewMode === 'calendar' ? 'var(--bg-tertiary)' : 'transparent', color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
            >
              <Calendar size={16} /> Calendar Grid
            </button>
          </div>
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
            {employees.map(emp => (
              <span key={emp.id} className="badge-pill bg-blue" style={{ padding: '6px 12px' }}>
                {emp.name}: Mon-Fri (Standard Shift)
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ width: '100%' }}>
        {/* Attendance Register */}
        {/* Attendance Views */}
        {viewMode === 'list' ? (
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
                {mappedLogs.map(log => {
                  const emp = employees.find(e => String(e.id) === String(log.employee_id)) || { name: 'Unknown' };
                  return (
                    <tr key={log.id}>
                      <td style={{ padding: '16px 40px' }}><strong>{emp.name}</strong></td>
                      <td style={{ padding: '16px 40px' }}>{log.date}</td>
                      <td style={{ padding: '16px 40px' }}>{log.clock_in ? new Date(log.clock_in).toLocaleTimeString() : <span style={{ color: '#ef4444' }}>Missed</span>}</td>
                      <td style={{ padding: '16px 40px' }}>{log.clock_out ? new Date(log.clock_out).toLocaleTimeString() : <span style={{ color: '#ef4444' }}>Missed</span>}</td>
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
        ) : (
          <div className="table-container" style={{ margin: 0, overflowX: 'auto', width: '100%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>{today.toLocaleString('default', { month: 'long', year: 'numeric' })} Overview</h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '2px' }}></div> Present</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '2px' }}></div> Absent</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', borderRadius: '2px' }}></div> Late</span>
              </div>
            </div>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', position: 'sticky', left: 0, backgroundColor: 'var(--bg-primary)', zIndex: 10, minWidth: '180px', borderRight: '1px solid var(--border-color)' }}>Employee Name</th>
                  {daysArray.map(day => (
                    <th key={day} style={{ padding: '12px 0', minWidth: '36px', textAlign: 'center', fontSize: '12px', borderBottom: '1px solid var(--border-color)' }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td style={{ padding: '12px 16px', position: 'sticky', left: 0, backgroundColor: 'var(--bg-primary)', zIndex: 10, borderRight: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} alt={emp.name} style={{ width: '28px', height: '28px', borderRadius: '50%' }}  />
                        <span style={{ fontWeight: '600', fontSize: '13px' }}>{emp.name}</span>
                      </div>
                    </td>
                    {daysArray.map(day => (
                      <td key={day} style={{ borderRight: '1px solid var(--bg-tertiary)', borderBottom: '1px solid var(--bg-tertiary)', padding: 0 }}>
                        {renderCalendarCell(emp.id, day)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                const emp = employees.find(e => e.id === c.employee_id) || { name: 'Unknown', designation: 'Employee' };
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
