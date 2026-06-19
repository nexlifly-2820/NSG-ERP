import React, { useState, useEffect } from 'react';
import { Users, CalendarCheck, X, Check, FileText, Clock, CalendarDays, Filter } from 'lucide-react';
import styles from '../../../tl/Timesheets/teamTimesheets.module.css';
import '../../../employee/pagination.css'; 

const ManageApprovals = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('table');
  const [timesheets, setTimesheets] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  
  // Team members for dynamic dropdown
  const [teamMembers, setTeamMembers] = useState([]);

  // Date defaults
  const today = new Date();
  const initialYear = today.getFullYear();
  const initialMonth = today.getMonth() + 1;
  const initialWeek = 0; // Default to 'All Weeks'

  // Filter states
  const [filterEmployeeId, setFilterEmployeeId] = useState(''); // Empty means all
  const [filterYear, setFilterYear] = useState(initialYear);
  const [filterMonth, setFilterMonth] = useState(initialMonth);
  const [filterWeek, setFilterWeek] = useState(initialWeek);
  const [filterDate, setFilterDate] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTeamMembers(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  const fetchPending = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      let url = `/api/timesheets/pending?year=${filterYear}&month=${filterMonth}`;
      if (filterWeek > 0) url += `&week=${filterWeek}`;
      if (filterEmployeeId) url += `&employee_id=${filterEmployeeId}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTimesheets(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    fetchPending();
  }, [filterYear, filterMonth, filterWeek, filterEmployeeId]);

  // Client-side filtering for specific date
  const filteredTimesheets = timesheets.filter(ts => {
    if (filterDate && ts.date !== filterDate) return false;
    return true;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterYear, filterMonth, filterWeek, filterEmployeeId, filterDate]);

  const totalPages = Math.ceil(filteredTimesheets.length / ITEMS_PER_PAGE);
  const paginatedTimesheets = filteredTimesheets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleReviewClick = (log) => {
    setSelectedLog(log);
    setActiveTab('reviewer');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApprove = async () => {
    if (!selectedLog) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/timesheets/${selectedLog.id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedLog(null);
        fetchPending();
        setActiveTab('table');
      } else {
        alert("Failed to approve timesheet.");
      }
    } catch (e) { console.error(e); }
  };

  const handleReject = async () => {
    if (!selectedLog) return;
    const comment = prompt('Please specify a rejection reason comment:');
    if (!comment) return;

    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/timesheets/${selectedLog.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ comment })
      });
      if (res.ok) {
        setSelectedLog(null);
        fetchPending();
        setActiveTab('table');
      } else {
        alert("Failed to reject timesheet.");
      }
    } catch (e) { console.error(e); }
  };

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
      <div className={styles.mainContent}>
        {/* TOP BAR WITH TABS AND CLOSE BUTTON */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div className={styles.tabsContainer} style={{ marginBottom: 0 }}>
            <div 
              className={`${styles.tab} ${activeTab === 'table' ? styles.active : ''}`}
              onClick={() => setActiveTab('table')}
            >
              <Users className={styles.tabIcon} /> Pending Timesheets
              {timesheets.length > 0 && (
                <span style={{background: activeTab === 'table' ? '#ec4899' : '#cbd5e1', color: 'white', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', marginLeft: '6px', fontWeight: 'bold'}}>
                  {timesheets.length}
                </span>
              )}
            </div>
            <div 
              className={`${styles.tab} ${activeTab === 'reviewer' ? styles.active : ''}`}
              onClick={() => setActiveTab('reviewer')}
            >
              <CalendarCheck className={styles.tabIcon} /> Log Review
            </div>
          </div>

          <button 
            onClick={onBack}
            style={{padding: '10px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'}}
            onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}
          >
            <X size={18} /> Close & Return
          </button>
        </div>
          <div 
            className={`${styles.tab} ${activeTab === 'reviewer' ? styles.active : ''}`}
            onClick={() => setActiveTab('reviewer')}
          >
            <CalendarCheck className={styles.tabIcon} /> Log Review
          </div>
        </div>

        {/* TAB CONTENT: TABLE */}
        {activeTab === 'table' && (
          <div className={styles.card}>
            <div className={styles.cardHeader} style={{flexDirection: 'column', alignItems: 'flex-start', gap: '20px'}}>
              <h2 className={styles.cardTitle} style={{fontSize: '22px', color: '#0f172a'}}>Daily Logs Pending Approval</h2>
              
              <div style={{display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', width: '100%', background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginRight: '12px'}}>
                  <Filter size={18} color="#64748b" />
                  <span style={{fontSize: '13px', fontWeight: 700, color: '#64748b', letterSpacing: '0.05em', textTransform: 'uppercase'}}>Filters</span>
                </div>
                
                <select 
                  style={{flex: 1, minWidth: '180px', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 500, outline: 'none', background: 'white'}}
                  value={filterEmployeeId} 
                  onChange={e => setFilterEmployeeId(e.target.value)}
                >
                  <option value="">All Employees & TLs</option>
                  {teamMembers.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>

                <input 
                  type="date"
                  style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 500, outline: 'none', background: 'white'}}
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  title="Filter by specific date"
                />

                <select 
                  style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 500, outline: 'none', background: 'white', opacity: filterDate ? 0.5 : 1}}
                  value={filterWeek} 
                  onChange={e => setFilterWeek(parseInt(e.target.value))}
                  disabled={!!filterDate}
                >
                  <option value={0}>All Weeks</option>
                  <option value={1}>Week 1</option>
                  <option value={2}>Week 2</option>
                  <option value={3}>Week 3</option>
                  <option value={4}>Week 4</option>
                  <option value={5}>Week 5</option>
                </select>

                <select 
                  style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 500, outline: 'none', background: 'white', opacity: filterDate ? 0.5 : 1}}
                  value={filterMonth} 
                  onChange={e => setFilterMonth(parseInt(e.target.value))}
                  disabled={!!filterDate}
                >
                  <option value={1}>January</option><option value={2}>February</option>
                  <option value={3}>March</option><option value={4}>April</option>
                  <option value={5}>May</option><option value={6}>June</option>
                  <option value={7}>July</option><option value={8}>August</option>
                  <option value={9}>September</option><option value={10}>October</option>
                  <option value={11}>November</option><option value={12}>December</option>
                </select>

                <select 
                  style={{padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', color: '#334155', fontWeight: 500, outline: 'none', background: 'white', opacity: filterDate ? 0.5 : 1}}
                  value={filterYear} 
                  onChange={e => setFilterYear(parseInt(e.target.value))}
                  disabled={!!filterDate}
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
            
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th style={{width: '25%'}}>Employee</th>
                    <th style={{width: '15%'}}>Date</th>
                    <th style={{width: '20%'}}>Project</th>
                    <th style={{width: '20%'}}>Task</th>
                    <th style={{width: '10%', textAlign: 'center'}}>Hours</th>
                    <th style={{width: '10%', textAlign: 'center'}}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTimesheets.map(log => (
                    <tr key={log.id}>
                      <td>
                        <div className={styles.employeeName}>
                          <div className={styles.avatar}>
                            {log.employee_name.charAt(0).toUpperCase()}
                          </div>
                          {log.employee_name}
                        </div>
                      </td>
                      <td>
                        <span className={styles.logDate}><CalendarDays size={14} color="#94a3b8" /> {log.date}</span>
                      </td>
                      <td>
                        <div className={styles.logProject}>{log.project}</div>
                      </td>
                      <td>
                        <div className={styles.logTask} title={log.task}>{log.task}</div>
                      </td>
                      <td style={{textAlign: 'center'}}>
                        <span className={styles.statusBadge}>{log.hours}h</span>
                      </td>
                      <td style={{textAlign: 'center'}}>
                        <button 
                          onClick={() => handleReviewClick(log)}
                          style={{
                            background: 'white', color: '#ec4899', border: '1px solid #fbcfe8', padding: '8px 16px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s', width: '100%'
                          }}
                          onMouseOver={(e) => { e.currentTarget.style.background = '#fdf2f8'; e.currentTarget.style.borderColor = '#f9a8d4'; }}
                          onMouseOut={(e) => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#fbcfe8'; }}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                  {timesheets.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                        <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', marginBottom: '16px'}}>
                          <Check size={32} color="#10b981" />
                        </div>
                        <div style={{color: '#0f172a', fontSize: '18px', fontWeight: 700}}>All Caught Up!</div>
                        <div style={{marginTop: '8px'}}>No pending daily timesheets require review for this selection.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {timesheets.length > 0 && (
              <div className="pagination-container" style={{ borderTop: 'none', padding: '0 32px 24px 32px' }}>
                <div className="pagination-info">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, timesheets.length)} of {timesheets.length} entries
                </div>
                <div className="pagination-controls">
                  <button 
                    className="page-btn" 
                    disabled={currentPage === 1} 
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, i) => (
                    <button 
                      key={i} 
                      className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    className="page-btn" 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: REVIEWER */}
        {activeTab === 'reviewer' && (
          <div className={styles.reviewerContainer}>
            {selectedLog ? (
              <>
                <div className={styles.reviewerHeader}>
                  <div>
                    <div className={styles.reviewerTitleSub}>Reviewing Daily Log</div>
                    <div className={styles.reviewerTitle}>
                      <div className={styles.avatar} style={{width: '40px', height: '40px', fontSize: '16px'}}>
                        {selectedLog.employee_name.charAt(0).toUpperCase()}
                      </div>
                      {selectedLog.employee_name}
                    </div>
                  </div>
                  
                  <div className={styles.actionGroup}>
                    <button className={styles.btnReject} onClick={handleReject}><X size={16} /> Reject</button>
                    <button className={styles.btnApprove} onClick={handleApprove}><Check size={16} /> Approve Log</button>
                  </div>
                </div>

                <div className={styles.dailyBlock}>
                  <div className={styles.dailyBlockHeader}>
                    <div>
                      <div className={styles.metaLabel}>Date</div>
                      <div className={styles.metaValue} style={{display: 'flex', alignItems: 'center', gap: '6px'}}><CalendarDays size={16} color="#64748b"/> {selectedLog.date}</div>
                    </div>
                    <div>
                      <div className={styles.metaLabel}>Project</div>
                      <div className={styles.metaValue}>{selectedLog.project}</div>
                    </div>
                    <div>
                      <div className={styles.metaLabel}>Hours Logged</div>
                      <div className={styles.metaValue} style={{color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '6px'}}><Clock size={16}/> {selectedLog.hours} Hours</div>
                    </div>
                  </div>
                  
                  <div className={styles.reviewContent}>
                    <div className={styles.taskHeader}>
                      <FileText size={20} color="#4f46e5"/> {selectedLog.task}
                    </div>
                    <div className={styles.taskDesc}>
                      {selectedLog.description}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: '80px', textAlign: 'center', color: '#64748b' }}>
                <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', background: '#f8fafc', marginBottom: '20px'}}>
                  <FileText size={40} color="#cbd5e1" />
                </div>
                <div style={{fontSize: '20px', fontWeight: 700, color: '#0f172a'}}>No Log Selected</div>
                <div style={{marginTop: '12px'}}>Please select a pending timesheet from the Pending Timesheets tab to review.</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageApprovals;
