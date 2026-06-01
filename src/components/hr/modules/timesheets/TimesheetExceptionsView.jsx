import React, { useState } from 'react';

export function TimesheetExceptionsView({ db, onUpdateDb }) {
  const handleApplyLOP = (id) => {
    const item = db.timesheetExceptions.find(x => x.id === id);
    if (!item) return;

    const updated = db.timesheetExceptions.map(x => {
      if (x.id === id) {
        return { ...x, status: 'lop_applied' };
      }
      return x;
    });

    const emp = db.employees.find(e => e.id === item.employee_id) || { name: 'Staff' };

    const newLogs = [...db.auditLogs, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      initiator_id: 'Sarah Jenkins',
      module: 'Timesheets',
      record_id: item.id,
      action_type: 'payroll_lock', // LOP locking payroll trigger
      change_diff: { LOP_deductions_applied: emp.name },
      ip_address: '192.168.1.104',
      client_agent: 'Chrome / Windows'
    }];

    onUpdateDb({
      ...db,
      timesheetExceptions: updated,
      auditLogs: newLogs
    });

    alert(`Loss-of-Pay (LOP) deduction rules locked for ${emp.name} timesheet exception.`);
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
        <table>
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Date of Exception</th>
              <th>Logged Hours</th>
              <th>Expected Shift Hours</th>
              <th>Exception Flag</th>
              <th>Action Panel</th>
            </tr>
          </thead>
          <tbody>
            {db.timesheetExceptions.map(item => {
              const emp = db.employees.find(e => e.id === item.employee_id) || { name: 'Unknown' };
              return (
                <tr key={item.id} style={item.status === 'lop_applied' ? { opacity: 0.5 } : {}}>
                  <td><strong>{emp.name}</strong></td>
                  <td>{item.date}</td>
                  <td><span style={{ color: 'red', fontWeight: 'bold' }}>{item.logged_hours}h</span></td>
                  <td>{item.target_hours}h</td>
                  <td>
                    <span className="badge-pill bg-pink">
                      {item.exception_type.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {item.status === 'open' ? (
                      <button style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }} onClick={() => handleApplyLOP(item.id)}>
                        Apply LOP Deduction
                      </button>
                    ) : (
                      <span className="badge-pill bg-blue">LOP Applied</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 9. LEAVE MANAGEMENT VIEW
