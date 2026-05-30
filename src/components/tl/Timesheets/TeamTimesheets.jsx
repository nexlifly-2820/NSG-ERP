import React, { useState } from 'react';
import { Users, CalendarCheck, GitCommit, X, Check, AlertTriangle } from 'lucide-react';
import styles from './teamTimesheets.module.css';

const employeesData = [
  { id: 1, name: 'Sarah Jenkins', weekOf: 'May 17 - May 23', totalHours: '40h', status: 'SUBMITTED' },
  { id: 2, name: 'Michael Chang', weekOf: 'May 17 - May 23', totalHours: '42h', status: 'APPROVED' },
  { id: 3, name: 'David Miller', weekOf: 'May 17 - May 23', totalHours: '35h', status: 'DRAFT' },
  { id: 4, name: 'Emily Chen', weekOf: 'May 10 - May 16', totalHours: '38h', status: 'REJECTED' },
];

const TeamTimesheets = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('table');
  const [selectedEmployee, setSelectedEmployee] = useState(employeesData[0]);

  const employees = employeesData;

  const handleReviewClick = (emp) => {
    setSelectedEmployee(emp);
    setActiveTab('reviewer');
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <button className={styles.btnBack} onClick={onBack}>
          <X size={16} /> Back to My Timesheet
        </button>
      </div>

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
          <div 
            className={`${styles.tab} ${activeTab === 'audit' ? styles.active : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            <GitCommit className={styles.tabIcon} /> Git-Commit Audit Panel
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
                  {selectedEmployee ? `${selectedEmployee.name} (${selectedEmployee.weekOf})` : 'No employee selected'}
                </div>
              </div>
              
              <div className={styles.actionGroup}>
                <button className={styles.btnReject}><X size={14} /> Reject with Comment</button>
                <button className={styles.btnApprove}><Check size={14} /> Approve Timesheet</button>
              </div>
            </div>

            {selectedEmployee ? (
              <>
                <div className={styles.dailyBlock}>
                  <div className={styles.dailyBlockHeader}>
                    <span className={styles.dailyBlockDate}>Monday, May 17</span>
                    <span className={styles.dailyBlockTotal}>8 hours total</span>
                  </div>
                  
                  <div className={styles.taskItem}>
                    <div className={styles.taskInfo}>
                      <div className={styles.taskId}>TASK-102</div>
                      <div className={styles.taskTitle}>Setup Authentication Flow</div>
                    </div>
                    <div className={styles.taskMeta}>
                      <div className={`${styles.gitStatus} ${styles.gitMatched}`}>
                        <GitCommit size={14} /> GIT MATCHED
                      </div>
                      <div className={styles.taskHours}>5h</div>
                    </div>
                  </div>
                  
                  <div className={styles.taskItem}>
                    <div className={styles.taskInfo}>
                      <div className={styles.taskId}>TASK-105</div>
                      <div className={styles.taskTitle}>Team Sync & Code Review</div>
                    </div>
                    <div className={styles.taskMeta}>
                      <div className={`${styles.gitStatus} ${styles.gitNoCommits}`}>
                        <AlertTriangle size={14} /> NO COMMITS
                      </div>
                      <div className={styles.taskHours}>3h</div>
                    </div>
                  </div>
                </div>

                <div className={styles.dailyBlock}>
                  <div className={styles.dailyBlockHeader}>
                    <span className={styles.dailyBlockDate}>Tuesday, May 18</span>
                    <span className={styles.dailyBlockTotal}>8 hours total</span>
                  </div>
                  
                  <div className={styles.taskItem}>
                    <div className={styles.taskInfo}>
                      <div className={styles.taskId}>TASK-102</div>
                      <div className={styles.taskTitle}>Setup Authentication Flow</div>
                    </div>
                    <div className={styles.taskMeta}>
                      <div className={`${styles.gitStatus} ${styles.gitMatched}`}>
                        <GitCommit size={14} /> GIT MATCHED
                      </div>
                      <div className={styles.taskHours}>6h</div>
                    </div>
                  </div>
                  
                  <div className={styles.taskItem}>
                    <div className={styles.taskInfo}>
                      <div className={styles.taskId}>TASK-110</div>
                      <div className={styles.taskTitle}>Database Schema Updates</div>
                    </div>
                    <div className={styles.taskMeta}>
                      <div className={`${styles.gitStatus} ${styles.gitMatched}`}>
                        <GitCommit size={14} /> GIT MATCHED
                      </div>
                      <div className={styles.taskHours}>2h</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                Please select an employee from the Team Timesheets Table.
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT: AUDIT */}
        {activeTab === 'audit' && (
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Git-Commit Audit Analysis</h2>
              <div className={styles.auditSubtext}>Comparing claimed hours vs repository activity</div>
            </div>

            <div className={styles.auditGrid}>
              <div className={styles.auditCol}>
                <div className={styles.auditColHeader}>Claimed Timesheet Hours</div>
                <div className={styles.auditColBody}>
                  <div className={styles.auditRow}>
                    <span>May 17</span>
                    <span className={styles.auditHours}>8h Claimed</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span>May 18</span>
                    <span className={styles.auditHours}>8h Claimed</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span>May 19</span>
                    <span className={styles.auditHours}>8h Claimed</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span>May 20</span>
                    <span className={styles.auditHours}>9h Claimed</span>
                  </div>
                </div>
              </div>

              <div className={styles.auditCol}>
                <div className={styles.auditColHeader}>Git Activity (Est. Hours)</div>
                <div className={styles.auditColBody}>
                  <div className={styles.auditRow}>
                    <span>3 Commits</span>
                    <span className={styles.auditHours}>~6h Estimated</span>
                  </div>
                  <div className={`${styles.auditRow} ${styles.matched}`}>
                    <span>5 Commits</span>
                    <span className={styles.auditHours}>~8h Estimated</span>
                  </div>
                  <div className={`${styles.auditRow} ${styles.matched}`}>
                    <span>4 Commits</span>
                    <span className={styles.auditHours}>~7h Estimated</span>
                  </div>
                  <div className={styles.auditRow}>
                    <span>1 Commits</span>
                    <span className={styles.auditHours}>~2h Estimated</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.alertBanner}>
              <AlertTriangle size={20} />
              <div>
                <strong>Investigation Required:</strong> There is a significant discrepancy on May 17 and May 20 between the hours claimed on the timesheet and the tracked Git commit activity.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamTimesheets;
