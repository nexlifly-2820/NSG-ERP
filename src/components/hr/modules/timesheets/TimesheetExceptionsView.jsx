import React, { useState, useEffect } from 'react';
import { notify } from '../../utils/notify';
export function TimesheetExceptionsView() {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExceptions = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/timesheets/exceptions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setExceptions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleApplyLOP = async (id, empName) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/timesheets/exceptions/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        notify(`Loss-of-Pay (LOP) deduction rules locked / resolved for ${empName} timesheet exception.`, 'success');
        fetchExceptions();
      } else {
        notify('Failed to apply LOP / Resolve', 'error');
      }
    } catch (e) {
      console.error(e);
      notify('An error occurred while resolving.', 'error');
    }
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Timesheet Exceptions Inspector</h1>
          <p>Review missing, unsubmitted or TL-rejected timesheets. Unresolved exceptions block the monthly Stepper Payroll process.</p>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <p style={{ padding: '20px' }}>Loading exceptions...</p>
        ) : exceptions.length === 0 ? (
          <p style={{ padding: '20px' }}>No timesheet exceptions found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Date of Exception</th>
                <th>Logged Hours</th>
                <th>Expected Shift Hours</th>
                <th>Exception Flag</th>
                <th>Action Panel</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.map(item => {
                const isResolved = item.status === 'resolved' || item.status === 'lop_applied';
                return (
                  <tr key={item.id} style={isResolved ? { opacity: 0.5 } : {}}>
                    <td><strong>Employee #{item.employee_id}</strong></td>
                    <td>{item.date}</td>
                    <td><span style={{ color: 'red', fontWeight: 'bold' }}>{item.logged_hours}h</span></td>
                    <td>{item.target_hours}h</td>
                    <td>
                      <span className="badge-pill bg-pink">
                        {item.exception_type.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {!isResolved ? (
                        <button style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }} onClick={() => handleApplyLOP(item.id, `Employee #${item.employee_id}`)}>
                          Apply LOP / Resolve
                        </button>
                      ) : (
                        <span className="badge-pill bg-blue">Resolved</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 9. LEAVE MANAGEMENT VIEW
