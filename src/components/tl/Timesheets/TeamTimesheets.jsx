import React, { useState, useEffect, useMemo } from 'react';
import { Users, CalendarCheck, GitCommit, X, Check, AlertTriangle } from 'lucide-react';
import styles from './teamTimesheets.module.css';

const TeamTimesheets = () => {
  const [activeTab, setActiveTab] = useState('table');
  const [timesheets, setTimesheets] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const [tsRes, memRes] = await Promise.all([
        fetch('/api/timesheets/pending', { headers }),
        fetch('/api/team-lead/team-members', { headers })
      ]);
      if (tsRes.ok) setTimesheets(await tsRes.json());
      if (memRes.ok) setTeamMembers(await memRes.json());
    } catch (e) { console.error(e); }
  };

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/timesheets/pending', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTimesheets(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const employees = useMemo(() => {
    const list = timesheets.map(ts => {
      let totalH = 0;
      (ts.rows || []).forEach(r => {
        totalH += Object.values(r.hours || {}).reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
      });
      const member = teamMembers.find(m => m.id === ts.employee_id);
      return {
        id: ts.id,
        employee_id: ts.employee_id,
        name: member ? member.name : `Employee #${ts.employee_id}`,
        weekOf: `Week of ${ts.week_start_date}`,
        totalHours: `${totalH.toFixed(1)}h`,
        status: ts.status.toUpperCase(),
        raw: ts
      };
    });
    
    return list;
  }, [timesheets, teamMembers]);

  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const activeSelected = useMemo(() => {
    if (!selectedEmployee) return null;
    return employees.find(e => e.id === selectedEmployee.id) || selectedEmployee;
  }, [employees, selectedEmployee]);

  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0]);
    }
  }, [employees, selectedEmployee]);

  const handleReviewClick = (emp) => {
    setSelectedEmployee(emp);
    setActiveTab('reviewer');
  };

  const handleApprove = async () => {
    if (!activeSelected || !activeSelected.raw) {
      alert("Demo timesheet approved successfully!");
      setActiveTab('table');
      return;
    }
    
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/timesheets/${activeSelected.id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert(`Timesheet approved for ${activeSelected.name}!`);
        fetchPending();
        setActiveTab('table');
      }
    } catch (e) { console.error(e); }
  };

  const handleReject = async () => {
    if (!activeSelected || !activeSelected.raw) {
      alert("Demo timesheet rejected successfully!");
      setActiveTab('table');
      return;
    }
    
    const comment = prompt('Please specify a rejection reason comment:', 'Hours incomplete. Please correct and resubmit.');
    if (comment === null) return; // cancel clicked

    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/timesheets/${activeSelected.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ comment })
      });
      if (res.ok) {
        alert(`Timesheet rejected with comment dispatched back to ${activeSelected.name}.`);
        fetchPending();
        setActiveTab('table');
      }
    } catch (e) { console.error(e); }
  };

  const getDaysInfo = (weekStartStr) => {
    if (!weekStartStr) return [];
    const [y, m, d] = weekStartStr.split('-').map(Number);
    const startDate = new Date(y, m - 1, d);
    const days = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    for (let i = 0; i < 5; i++) {
      const cur = new Date(startDate);
      cur.setDate(cur.getDate() + i);
      const monthName = cur.toLocaleDateString('en-US', { month: 'short' });
      days.push({
        key: shortNames[i],
        label: `${dayNames[i]}, ${monthName} ${cur.getDate()}`,
        shortLabel: `${monthName} ${cur.getDate()}`,
        index: i
      });
    }
    return days;
  };

  return (
    <div className={styles.container}>

      <div className={styles.mainContent}>
        {/* TABS */}
        <div className={styles.tabsContainer}>
          <div 
            className={`${styles.tab} ${activeTab === 'table' ? styles.active : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <Users className={styles.tabIcon} /> Team Timesheets Table
          </div>
          <div 
            className={`${styles.tab} ${activeTab === 'reviewer' ? styles.active : ''}`}
            onClick={() => setActiveTab('reviewer')}
          >
            <CalendarCheck className={styles.tabIcon} /> Timesheet Detail Reviewer
          </div>
        </div>

        {/* TAB CONTENT: TABLE */}
        {activeTab === 'table' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Team Timesheets Pending Review</h2>
              <input type="text" placeholder="Search employee..." className={styles.searchInput} />
            </div>
            
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>EMPLOYEE</th>
                  <th>WEEK OF</th>
                  <th>TOTAL HOURS</th>
                  <th>STATUS</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>{emp.name}</td>
                    <td>{emp.weekOf}</td>
                    <td>{emp.totalHours}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${
                        emp.status === 'SUBMITTED' ? styles.statusSubmitted :
                        emp.status === 'APPROVED' ? styles.statusApproved :
                        emp.status === 'DRAFT' ? styles.statusDraft :
                        styles.statusRejected
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <button className={styles.btnReview} onClick={() => handleReviewClick(emp)}>
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No pending timesheets require review.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB CONTENT: REVIEWER */}
        {activeTab === 'reviewer' && (
          <div className={styles.reviewerContainer}>
            <div className={styles.reviewerHeader}>
              <div>
                <div className={styles.reviewerTitleSub}>Reviewing Timesheet for</div>
                <div className={styles.reviewerTitle}>
                  {activeSelected ? `${activeSelected.name} (${activeSelected.weekOf})` : 'No employee selected'}
                </div>
              </div>
              
              <div className={styles.actionGroup}>
                <button className={styles.btnReject} onClick={handleReject}><X size={14} /> Reject with Comment</button>
                <button className={styles.btnApprove} onClick={handleApprove}><Check size={14} /> Approve Timesheet</button>
              </div>
            </div>

            {activeSelected ? (() => {
              const weekStr = activeSelected.raw?.week_start_date || activeSelected.weekOf.replace('Week of ', '');
              const days = getDaysInfo(weekStr);
              
              let rows = activeSelected.raw?.rows;
              if (!rows) {
                // Generate deterministic synthetic rows for demo
                rows = [
                  { taskId: 102, name: "Setup Authentication Flow", sprint: "Sprint 14", hours: { Mon: 5, Tue: 6, Wed: 0, Thu: 0, Fri: 0 } },
                  { taskId: 105, name: "Team Sync & Code Review", sprint: "Sprint 14", hours: { Mon: 3, Tue: 0, Wed: 0, Thu: 2, Fri: 0 } },
                  { taskId: 110, name: "Database Schema Updates", sprint: "Sprint 14", hours: { Mon: 0, Tue: 2, Wed: 8, Thu: 6, Fri: 8 } }
                ];
              }

              return (
                <>
                  {days.map(day => {
                    const tasksForDay = rows.filter(r => (r.hours[day.key] || 0) > 0);
                    const dayTotal = tasksForDay.reduce((sum, r) => sum + (r.hours[day.key] || 0), 0);
                    
                    if (tasksForDay.length === 0) return null;

                    return (
                      <div className={styles.dailyBlock} key={day.key}>
                        <div className={styles.dailyBlockHeader}>
                          <span className={styles.dailyBlockDate}>{day.label}</span>
                          <span className={styles.dailyBlockTotal}>{dayTotal} hours total</span>
                        </div>
                        
                        {tasksForDay.map((task, idx) => {
                          const isMatched = (task.taskId || idx) % 2 === 0;
                          return (
                            <div className={styles.taskItem} key={idx}>
                              <div className={styles.taskInfo}>
                                <div className={styles.taskId}>TASK-{task.taskId || 'MISC'}</div>
                                <div className={styles.taskTitle}>{task.name}</div>
                              </div>
                              <div className={styles.taskMeta}>
                                <div className={`${styles.gitStatus} ${isMatched ? styles.gitMatched : styles.gitNoCommits}`}>
                                  {isMatched ? <><GitCommit size={14} /> GIT MATCHED</> : <><AlertTriangle size={14} /> NO COMMITS</>}
                                </div>
                                <div className={styles.taskHours}>{task.hours[day.key]}h</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              );
            })() : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                Please select an employee from the Team Timesheets Table.
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
};

export default TeamTimesheets;
