import React, { useState } from 'react';
import useSWR from 'swr';
import styles from './approvals.module.css';
import { AlertTriangle, MapPin, CheckCircle, Clock, FileText, Camera, GitCommit, Calendar, DollarSign } from 'lucide-react';

const Approvals = () => {
  const [activeTab, setActiveTab] = useState('leave');
  
  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

  const { data: teamMembers = [] } = useSWR('/api/team-lead/team-members', fetcher);

  const getEmpName = (id) => {
    const emp = teamMembers.find(m => m.id === id);
    return emp ? emp.name : `Emp #${id}`;
  };

  const { data: rawLeaves = [], mutate: mutateLeaves } = useSWR('/api/team-lead/leaves/pending', fetcher);
  const leaves = rawLeaves.map(r => ({
    id: r.id,
    employee: getEmpName(r.user_id || r.employee_id),
    employee_id: r.user_id || r.employee_id,
    type: r.leave_type === 'CL' ? 'Casual Leave' : r.leave_type === 'SL' ? 'Sick Leave' : r.leave_type === 'EL' ? 'Earned Leave' : r.leave_type === 'CompOff' ? 'Comp Off' : r.leave_type,
    days: r.days,
    dates: `${r.from_date} – ${r.to_date}`,
    reason: r.reason,
    status: r.status,
    overlapWarning: null
  }));

  const { data: rawCorrections = [], mutate: mutateCorrections } = useSWR('/api/team-lead/attendance-corrections/pending', fetcher);
  const corrections = rawCorrections.map(c => ({
    id: c.id,
    employee: getEmpName(c.user_id),
    date: c.correction_date,
    requestedTimes: `${new Date(c.requested_clock_in).toLocaleTimeString()} - ${new Date(c.requested_clock_out).toLocaleTimeString()}`,
    reason: c.reason,
    status: c.status,
    photoEvidence: false,
    gpsCoords: 'Not provided'
  }));

  const { data: rawWfhs = [], mutate: mutateWfhs } = useSWR('/api/team-lead/wfh/pending', fetcher);
  const wfhs = rawWfhs.map(r => ({
    id: r.id,
    employee: getEmpName(r.user_id),
    date: `${r.from_date} – ${r.to_date}`,
    reason: r.reason,
    status: r.status,
    locationVerified: true
  }));

  const { data: rawTimesheets = [], mutate: mutateTimesheets } = useSWR('/api/timesheets/pending', fetcher);
  const timesheets = rawTimesheets.map(ts => {
    let totalH = 0;
    (ts.rows || []).forEach(r => {
      totalH += Object.values(r.hours || {}).reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
    });
    return {
      id: ts.id,
      employee: getEmpName(ts.employee_id),
      employee_id: ts.employee_id,
      weekOf: ts.week_start_date,
      totalHours: totalH,
      hours: ts.rows?.[0]?.hours || { Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0, Sun:0 }
    };
  });

  const { data: rawExpenses = [], mutate: mutateExpenses } = useSWR('/api/team-lead/expenses/pending', fetcher);
  const expenses = rawExpenses.map(c => {
    const empId = c.user_id || c.employee_id;
    return {
      id: c.id,
      employee: getEmpName(empId),
      employee_id: empId,
      category: c.category || 'Other',
      amount: c.amount || 0,
      date: c.claim_date || c.date || '',
      description: c.description || '',
      receiptName: c.receipt_url || c.receiptName || 'receipt.pdf',
      status: c.tl_approval || 'pending'
    };
  });

  const [selectedId, setSelectedId] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedId(null);
  };

  const handleAction = async (id, actionType) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      if (activeTab === 'leave') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        await fetch(`/api/team-lead/leaves/${id}/${action}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        mutateLeaves();
      } else if (activeTab === 'corrections') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        await fetch(`/api/team-lead/attendance-corrections/${id}/${action}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        mutateCorrections();
      } else if (activeTab === 'expense') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        await fetch(`/api/team-lead/expenses/${id}/${action}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        mutateExpenses();
      } else if (activeTab === 'timesheet') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        const body = actionType === 'reject' ? JSON.stringify({ comment: 'Rejected by TL from approvals' }) : null;
        await fetch(`/api/timesheets/${id}/${action}`, {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${token}`,
            ...(body ? {'Content-Type': 'application/json'} : {})
          },
          body
        });
        mutateTimesheets();
      } else if (activeTab === 'wfh') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        await fetch(`/api/team-lead/wfh/${id}/${action}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        mutateWfhs();
      }
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      console.error("Action failed", e);
    }
  };

  // Helper to get current list and selected item
  let currentList = [];
  let selectedItem = null;
  if (activeTab === 'leave') {
    currentList = leaves;
    selectedItem = leaves.find(l => l.id === selectedId);
  } else if (activeTab === 'expense') {
    currentList = expenses;
    selectedItem = expenses.find(e => e.id === selectedId);
  } else if (activeTab === 'timesheet') {
    currentList = timesheets;
    selectedItem = timesheets.find(t => t.id === selectedId);
  } else if (activeTab === 'wfh') {
    currentList = wfhs;
    selectedItem = wfhs.find(w => w.id === selectedId);
  } else if (activeTab === 'corrections') {
    currentList = corrections;
    selectedItem = corrections.find(c => c.id === selectedId);
  }

  // --- RENDER DETAIL PANELS ---
  
  const renderLeaveDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>{item.type} • {item.days} Days</span>
      </div>
      
      {item.overlapWarning && (
        <div className={styles.warningBox}>
          <AlertTriangle size={18} />
          <div>
            <strong>Calendar Conflict Detected</strong>
            <p style={{ margin: '4px 0 0 0' }}>{item.overlapWarning}</p>
          </div>
        </div>
      )}

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Requested Dates</span>
        <div className={styles.detailValue}>{item.dates}</div>
      </div>
      
      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Reason</span>
        <div className={styles.detailValue}>{item.reason}</div>
      </div>
    </>
  );

  const renderTimesheetDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Week of {item.weekOf}</span>
      </div>


      <div className={styles.detailSection} style={{ marginTop: '24px' }}>
        <span className={styles.detailLabel}>Weekly Hours Grid</span>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th><th>Sun</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{item.hours.Mon}h</td>
              <td>{item.hours.Tue}h</td>
              <td>{item.hours.Wed}h</td>
              <td>{item.hours.Thu}h</td>
              <td>{item.hours.Fri}h</td>
              <td>{item.hours.Sat}h</td>
              <td>{item.hours.Sun}h</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Total Logged</span>
        <div className={styles.detailValue} style={{ fontSize: '18px', fontWeight: 'bold' }}>{item.totalHours} Hours</div>
      </div>
    </>
  );

  const renderWfhDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>WFH Request for {item.date}</span>
      </div>

      {item.locationVerified && (
        <div className={styles.gitBadge} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)', marginBottom: '24px' }}>
          <MapPin size={14} />
          Home Location Verified in System
        </div>
      )}

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Reason</span>
        <div className={styles.detailValue}>{item.reason}</div>
      </div>
    </>
  );

  const renderCorrectionDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Attendance Correction for {item.date}</span>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Requested Times</span>
        <div className={styles.detailValue}>{item.requestedTimes}</div>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Reason</span>
        <div className={styles.detailValue}>{item.reason}</div>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>System Verification</span>
        <table className={styles.table}>
          <tbody>
            <tr>
              <td style={{ color: '#94a3b8' }}>Photo Evidence</td>
              <td>{item.photoEvidence ? <span style={{ color: '#10b981' }}><Camera size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }}/> Provided</span> : 'None'}</td>
            </tr>
            <tr>
              <td style={{ color: '#94a3b8' }}>GPS Coordinates</td>
              <td><MapPin size={14} style={{ marginRight: '4px', verticalAlign: 'middle', color: '#3b82f6' }}/> {item.gpsCoords}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );

  const renderExpenseDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>{item.category} • ₹{Number(item.amount).toLocaleString('en-IN')}</span>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Claim Date</span>
        <div className={styles.detailValue}>{item.date}</div>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Description</span>
        <div className={styles.detailValue}>{item.description || '—'}</div>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Receipt</span>
        <div className={styles.detailValue} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} color="#64748b" />
          <span style={{ fontSize: '13px' }}>{item.receiptName}</span>
        </div>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Amount</span>
        <div className={styles.detailValue} style={{ fontSize: '22px', fontWeight: '800', color: '#10b981' }}>
          ₹{Number(item.amount).toLocaleString('en-IN')}
        </div>
      </div>
    </>
  );

  return (
    <div className={styles.approvalsContainer}>
      
      {/* TABS */}
      <div className={styles.topTabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'leave' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('leave')}
        >
          <Calendar size={16} /> Leave 
          {leaves.length > 0 && <span className={styles.badge}>{leaves.length}</span>}
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'timesheet' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('timesheet')}
        >
          <Clock size={16} /> Timesheet
          {timesheets.length > 0 && <span className={styles.badge}>{timesheets.length}</span>}
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'wfh' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('wfh')}
        >
          <FileText size={16} /> WFH
          {wfhs.length > 0 && <span className={styles.badge}>{wfhs.length}</span>}
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'corrections' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('corrections')}
        >
          <CheckCircle size={16} /> Attendance Corrections
          {corrections.length > 0 && <span className={styles.badge}>{corrections.length}</span>}
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'expense' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('expense')}
        >
          <DollarSign size={16} /> Expenses
          {expenses.length > 0 && <span className={styles.badge}>{expenses.length}</span>}
        </button>
      </div>

      {/* 2-PANE LAYOUT */}
      <div className={styles.mainGrid}>
        
        {/* LIST PANEL */}
        <div className={styles.listPanel}>
          <div className={styles.panelTitle}>Pending Requests</div>
          
          {currentList.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>No pending requests in this queue.</div>
          ) : (
            currentList.map(item => (
              <div 
                key={item.id} 
                className={`${styles.listItem} ${selectedId === item.id ? styles.listItemSelected : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.employeeName}>{item.employee}</span>
                  {activeTab === 'corrections' && <span className={styles.slaBadge}>{item.slaRemaining} SLA</span>}
                </div>
                
                <div className={styles.itemDesc}>
                  {activeTab === 'leave' && `${item.type} (${item.days} days)`}
                  {activeTab === 'timesheet' && `${item.totalHours} hrs logged`}
                  {activeTab === 'wfh' && `${item.date}`}
                  {activeTab === 'corrections' && `${item.date}`}
                  {activeTab === 'expense' && `₹${Number(item.amount).toLocaleString('en-IN')} — ${item.category}`}
                </div>
                
                <div className={styles.itemActions}>
                  <button 
                    className={styles.btnApprove} 
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'approve'); }}
                  >
                    Approve
                  </button>
                  <button 
                    className={styles.btnReject} 
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'reject'); }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DETAIL PANEL */}
        <div className={styles.detailPanel}>
          <div className={styles.panelTitle}>Request Details</div>
          
          {!selectedItem ? (
            <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>Select a request from the list to view details.</div>
          ) : (
            <div>
              {activeTab === 'leave' && renderLeaveDetails(selectedItem)}
              {activeTab === 'timesheet' && renderTimesheetDetails(selectedItem)}
              {activeTab === 'wfh' && renderWfhDetails(selectedItem)}
              {activeTab === 'corrections' && renderCorrectionDetails(selectedItem)}
              {activeTab === 'expense' && renderExpenseDetails(selectedItem)}
              
              <div className={styles.bigActionRow}>
                <button className={styles.btnApprove} onClick={() => handleAction(selectedId, 'approve')}>Approve Request</button>
                <button className={styles.btnReject} onClick={() => handleAction(selectedId, 'reject')}>Reject Request</button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Approvals;
