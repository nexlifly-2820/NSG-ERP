import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, FileSpreadsheet, ChevronDown, ChevronRight as ChevronRightIcon, Info, X } from 'lucide-react';
import styles from './timesheets.module.css';
import TeamTimesheets from './TeamTimesheets';

const Timesheets = () => {
  const [showTeamView, setShowTeamView] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // May 2026
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthStr = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  
  // State for the daily details panel and modals
  const todayObj = new Date();
  const todayString = todayObj.getDate().toString().padStart(2, '0');
  const [selectedDate, setSelectedDate] = useState(todayString);
  
  const isTodaySelected = 
    parseInt(selectedDate, 10) === todayObj.getDate() &&
    currentDate.getMonth() === todayObj.getMonth() &&
    currentDate.getFullYear() === todayObj.getFullYear();

  const [isAssignedOpen, setIsAssignedOpen] = useState(true);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showClaimSuccessModal, setShowClaimSuccessModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  const [dayDescription, setDayDescription] = useState('');

  // Track hours inputted per task, and total hours logged per date string
  const [taskHours, setTaskHours] = useState({});
  const [loggedHours, setLoggedHours] = useState({});
  const [loggedTaskDetails, setLoggedTaskDetails] = useState({});
  const [submittedDays, setSubmittedDays] = useState({});

  const [projects] = useState([
    { id: 1, name: 'NSG ERP Platform', dueDate: '15 Jun 2026' },
    { id: 2, name: 'Video Huddles v2', dueDate: '01 Jul 2026' }
  ]);

  const [tasks] = useState([
    { id: 1, title: 'Implement Payroll Dashboard API Integration', project: 'NSG ERP Platform' },
    { id: 3, title: 'Draft Annual Leave Approval Policy Document', project: 'NSG ERP Platform' },
    { id: 4, title: 'Setup WebSocket Client Connections', project: 'Video Huddles v2' },
    { id: 6, title: 'Refactor Leaves Request Validation Boundaries', project: 'NSG ERP Platform' }
  ]);

  const generateCalendarData = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon=0, Sun=6

    // Standard IT Company Government Holidays (Month-Day)
    const govtHolidays = [
      "01-01", // New Year's Day
      "01-26", // Republic Day
      "05-01", // Labour Day
      "08-15", // Independence Day
      "10-02", // Gandhi Jayanti
      "12-25", // Christmas Day
      "03-04", // Holi (approximate for 2026)
      "11-08", // Diwali (approximate for 2026)
    ];

    const calendar = [];
    let currentWeek = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push({
        date: String(prevMonthLastDay - startingDayOfWeek + i + 1).padStart(2, '0'),
        hours: '9', type: 'filled', prevMonth: true
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(year, month, i);
      const dayOfWeek = dateObj.getDay();
      const monthDayStr = `${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isGovtHoliday = govtHolidays.includes(monthDayStr);
      const isHoliday = isWeekend || isGovtHoliday;
      
      const today = new Date();
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const claimed = loggedHours[dateKey];
      
      let type = 'filled';
      let hours = '9';
      
      if (claimed !== undefined) {
        const numClaimed = Number(claimed);
        hours = Math.min(numClaimed, 9).toString();
        if (isWeekend) {
          type = 'weekend';
        } else if (isGovtHoliday) {
          type = 'holiday';
        } else {
          type = numClaimed >= 9 ? 'filled' : (numClaimed > 0 ? 'partial' : 'not-filled');
        }
      } else if (isWeekend) {
        type = 'weekend';
        hours = '0';
      } else if (isGovtHoliday) {
        type = 'holiday';
        hours = '0';
      } else if (dateObj > today) {
        type = 'empty';
        hours = '0';
      } else if (dateObj.toDateString() === today.toDateString()) {
        type = 'active';
        hours = '0'; // Current day might be active but empty hours
      } else {
        // Special case to match original screenshot for May 1st
        if (month === 4 && year === 2026 && i === 1) {
          type = 'not-filled';
          hours = '0';
        }
      }

      currentWeek.push({
        date: String(i).padStart(2, '0'),
        hours, type
      });

      if (currentWeek.length === 7) {
        currentWeek.push({ weekly: currentWeek.reduce((sum, d) => sum + Number(d.hours), 0).toString() });
        calendar.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      let nextMonthDay = 1;
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: String(nextMonthDay++).padStart(2, '0'),
          hours: '0', type: 'empty', nextMonth: true
        });
      }
      currentWeek.push({ weekly: currentWeek.reduce((sum, d) => sum + Number(d.hours), 0).toString() });
      calendar.push(currentWeek);
    }

    return calendar;
  };

  const calendarData = generateCalendarData(currentDate.getFullYear(), currentDate.getMonth());

  const getOrdinal = (d) => {
    const n = parseInt(d, 10);
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
  };

  const selectedWeek = calendarData.find(week => week.some(day => day.date === selectedDate && day.type !== 'empty' && !day.prevMonth && !day.nextMonth)) || calendarData[Math.max(0, calendarData.length - 2)];
  const weekStart = selectedWeek[0].date;
  const weekStartMonth = selectedWeek[0].prevMonth ? monthNames[(currentDate.getMonth() - 1 + 12) % 12] : monthNames[currentDate.getMonth()];
  const weekEnd = selectedWeek[6].date;
  const weekEndMonth = selectedWeek[6].nextMonth ? monthNames[(currentDate.getMonth() + 1) % 12] : monthNames[currentDate.getMonth()];
  const currentYearStr = currentDate.getFullYear();
  
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const handleTaskHourChange = (taskId, val) => {
    setTaskHours(prev => ({
      ...prev,
      [taskId]: val
    }));
  };

  const handleClaimTask = () => {
    const currentSaved = loggedTaskDetails[selectedDateKey] || {};
    const finalTaskHours = { ...currentSaved, ...taskHours };
    
    const totalHours = Object.values(finalTaskHours).reduce((sum, h) => sum + (Number(h) || 0), 0);
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.padStart(2, '0')}`;
    
    setLoggedHours(prev => ({
      ...prev,
      [dateKey]: totalHours
    }));
    
    setLoggedTaskDetails(prev => ({
      ...prev,
      [dateKey]: finalTaskHours
    }));
    
    // Clear the inputs
    setTaskHours({});
    
    // Show success modal
    setShowClaimSuccessModal(true);
  };

  const selectedDateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.padStart(2, '0')}`;
  const isLocked = !isTodaySelected || submittedDays[selectedDateKey];

  const getDisplayHours = (task) => {
    if (taskHours[task.id] !== undefined) return taskHours[task.id];
    if (loggedTaskDetails[selectedDateKey]?.[task.id] !== undefined) return loggedTaskDetails[selectedDateKey][task.id];
    
    if (!isTodaySelected) {
      const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(selectedDate, 10));
      const today = new Date();
      const monthDayStr = `${String(currentDate.getMonth() + 1).padStart(2, '0')}-${selectedDate.padStart(2, '0')}`;
      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
      
      const govtHolidays = ["01-01", "01-26", "05-01", "08-15", "10-02", "12-25", "03-04", "11-08"];
      const isHoliday = isWeekend || govtHolidays.includes(monthDayStr);

      if (dateObj < today && !isHoliday && selectedDate !== '01') {
        if (task.id === 1) return 9;
      }
    }
    return '';
  };

  const totalDisplayedHours = tasks.reduce((sum, task) => sum + (Number(getDisplayHours(task)) || 0), 0);

  const handleDownloadTimesheet = (e) => {
    e.preventDefault();
    
    let csvContent = "Date,Hours Logged\\n";
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
      const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hours = loggedHours[dateKey] !== undefined ? loggedHours[dateKey] : (i < new Date().getDate() ? 9 : 0);
      csvContent += `${dateKey},${hours}\\n`;
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Timesheet_${currentMonthStr.replace(' ', '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showTeamView) {
    return <TeamTimesheets onBack={() => setShowTeamView(false)} />;
  }

  return (
    <div className={styles.container}>
      
      <div className={styles.pageHeader}>
        <button className={styles.btnOutline} onClick={() => setShowTeamView(true)}>
          View Team Timesheets details
        </button>
      </div>

      {/* 
        ========================================
        SPLIT LAYOUT CONTAINER
        ========================================
      */}
      <div className={styles.splitLayout}>
        
        {/* LEFT PANEL: MONTHLY CALENDAR */}
        <div className={styles.calendarPanel}>
          {/* Header */}
          <div className={styles.header}>
            <button className={styles.navBtn} onClick={handlePrevMonth}><ChevronLeft size={24} /></button>
            <h2 className={styles.monthTitle}>{currentMonthStr}</h2>
            <button className={styles.navBtn} onClick={handleNextMonth}><ChevronRight size={24} /></button>
          </div>

          {/* Calendar Grid */}
          <div className={styles.gridContainer}>
            <div className={styles.gridHeader}>
              <div className={styles.headerCell}>Mo</div>
              <div className={styles.headerCell}>Tu</div>
              <div className={styles.headerCell}>We</div>
              <div className={styles.headerCell}>Th</div>
              <div className={styles.headerCell}>Fr</div>
              <div className={styles.headerCell}>Sa</div>
              <div className={styles.headerCell}>Su</div>
              <div className={styles.headerCell}>Weekly</div>
            </div>

            <div className={styles.gridBody}>
              {calendarData.map((week, wIdx) => (
                <div className={styles.weekRow} key={wIdx}>
                  {week.map((cell, cIdx) => {
                    if (cIdx === 7) {
                      return (
                        <div className={styles.weeklyCell} key={`w-${cIdx}`}>
                          {cell.weekly}
                        </div>
                      );
                    }
                    
                    const isSelected = cell.date === selectedDate && !cell.prevMonth && !cell.nextMonth;
                    return (
                      <div 
                        key={`d-${cIdx}`} 
                        onClick={() => {
                          if(!cell.prevMonth && !cell.nextMonth && cell.type !== 'empty') {
                            setSelectedDate(cell.date);
                            setTaskHours({});
                          }
                        }}
                        className={`${styles.dayCell} ${styles[cell.type]} ${cell.prevMonth || cell.nextMonth ? styles.prevMonth : ''} ${isSelected ? styles.selectedDay : ''}`}
                      >
                        <span className={styles.dateNum}>{cell.date}</span>
                        <span className={styles.hoursNum}>{cell.hours}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className={styles.legendContainer}>
            <div className={`${styles.legendItem} ${styles.legendFilled}`}>Filled Hours</div>
            <div className={`${styles.legendItem} ${styles.legendNotFilled}`}>Not Filled Hours</div>
            <div className={`${styles.legendItem} ${styles.legendPartial}`}>Partially Filled Hours</div>
            <div className={`${styles.legendItem} ${styles.legendLeave}`}>Approved Leave</div>
            <div className={`${styles.legendItem} ${styles.legendHoliday}`}>Holiday</div>
            <div className={`${styles.legendItem} ${styles.legendWeekend}`}>Weekend</div>
          </div>

          {/* Export Link */}
          <div className={styles.exportSection}>
            <a href="#" className={styles.exportLink} onClick={handleDownloadTimesheet}>
              <FileSpreadsheet size={16} className={styles.exportIcon} />
              Download this month's Timesheet
            </a>
          </div>
        </div>


        {/* RIGHT PANEL: DAILY DETAILS */}
        <div className={styles.detailsPanel}>
          <div className={styles.detailsHeader}>
            <h3>{parseInt(selectedDate)}<sup>{getOrdinal(selectedDate)}</sup> {currentMonthStr}</h3>
            <button className={styles.linkButton} onClick={() => setShowAllocationModal(true)}>
              Current Allocation
            </button>
          </div>

          <div className={styles.detailsBody}>
            {/* Assigned Task Accordion */}
            <div className={styles.accordionContainer}>
              <div className={styles.accordionHeader} onClick={() => setIsAssignedOpen(!isAssignedOpen)}>
                <div className={styles.accordionTitleLeft}>
                  {isAssignedOpen ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
                  <span>Assigned Task</span>
                  <Info size={14} className={styles.infoIcon} />
                </div>
                <div className={styles.accordionTitleRight}>{totalDisplayedHours} hour</div>
              </div>
              
              {isAssignedOpen && (
                <div className={styles.accordionContent}>
                  {tasks.map(task => (
                    <div key={task.id} className={styles.taskCard} style={{ marginBottom: '12px' }}>
                      <div className={styles.taskCardLeft}>
                        <div className={styles.taskName}>{task.title}</div>
                        <div className={styles.taskId}>({task.project})</div>
                      </div>
                      <div className={styles.taskCardRight}>
                        <label>Hours</label>
                        <input 
                          type="number" 
                          min="0"
                          max="24"
                          className={styles.taskInput} 
                          value={getDisplayHours(task)} 
                          onChange={(e) => handleTaskHourChange(task.id, e.target.value)}
                          placeholder="0" 
                          disabled={isLocked}
                        />
                      </div>
                    </div>
                  ))}
                  <button 
                    className={styles.linkButton} 
                    style={{ marginTop: '12px', opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                    onClick={isLocked ? undefined : handleClaimTask}
                    disabled={isLocked}
                    title={!isTodaySelected ? "Tasks can only be claimed for the current day" : (submittedDays[selectedDateKey] ? "Timesheet already submitted for today" : "")}
                  >
                    Claim Task
                  </button>
                </div>
              )}
            </div>
            


            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingRight: '16px' }}>
              {/* Action Buttons */}
              <div className={styles.actionButtons}>
                <button className={styles.btnSubmit} disabled={isLocked} style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }} onClick={() => setShowSubmitModal(true)}>Submit</button>
                <button className={styles.btnReset} disabled={isLocked} style={{ opacity: isLocked ? 0.5 : 1, cursor: isLocked ? 'not-allowed' : 'pointer' }} onClick={() => { setTaskHours({}); setDayDescription(''); }}>Reset</button>
              </div>

              <div className={styles.totalRow} style={{ margin: 0, paddingRight: 0 }}>
                Total : <span className={styles.totalNum}>{totalDisplayedHours}</span> hour
              </div>
            </div>

          </div>
        </div>

      </div>


      {/* 
        ========================================
        MODALS
        ========================================
      */}

      {/* 1. Current Allocation Modal */}
      {showAllocationModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '900px' }}>
            <div className={styles.modalHeader}>
              <h3>Current Allocation</h3>
              <button className={styles.closeBtn} onClick={() => setShowAllocationModal(false)}><X size={20} /></button>
            </div>
            <div className={styles.modalBody}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>WON/SWON</th>
                    <th>Project Name</th>
                    <th>Allocation Start Date</th>
                    <th>Allocation End Date</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map(proj => (
                    <tr key={proj.id}>
                      <td>PROJ-00{proj.id}</td>
                      <td>{proj.name}</td>
                      <td>01 Jan 2026</td>
                      <td>{proj.dueDate}</td>
                      <td>Team Member</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.btnGray} onClick={() => setShowAllocationModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Claim Task Success Modal */}
      {showClaimSuccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '400px', textAlign: 'center', padding: '32px' }}>
            <div style={{ color: '#10b981', marginBottom: '16px' }}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h3 style={{ fontSize: '20px', color: '#1e293b', marginBottom: '8px' }}>Success!</h3>
            <p style={{ color: '#64748b', marginBottom: '24px', fontSize: '15px' }}>
              Your task hours for this day have been claimed successfully.
            </p>
            <button 
              className={styles.btnSubmit} 
              style={{ width: '100%', padding: '12px' }}
              onClick={() => setShowClaimSuccessModal(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* 4. Submit Day Modal */}
      {showSubmitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalBox} style={{ maxWidth: '500px' }}>
            <div className={styles.modalHeader}>
              <h3>Submit Timesheet</h3>
              <button className={styles.closeBtn} onClick={() => setShowSubmitModal(false)}><X size={20} /></button>
            </div>
            
            <div className={styles.modalBody}>
              <div style={{ marginBottom: '8px', color: '#64748b', fontSize: '14px' }}>
                Submitting for: <strong>{parseInt(selectedDate)}<sup>{getOrdinal(selectedDate)}</sup> {currentMonthStr}</strong>
              </div>
              <div style={{ marginBottom: '16px', color: '#ef4444', fontSize: '13px', fontWeight: '500' }}>
                Note: "Once submitted, you cannot edit this day at all."
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel} style={{ display: 'block', marginBottom: '8px' }}>
                  Description of what you did<span className={styles.asterisk}>*</span> :
                </label>
                <textarea 
                  className={styles.formInput} 
                  style={{ minHeight: '120px', resize: 'vertical', width: '100%', padding: '12px' }}
                  placeholder="Enter a brief description of your activities..."
                  value={dayDescription}
                  onChange={(e) => setDayDescription(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button 
                className={styles.btnSubmit} 
                onClick={() => {
                  setShowSubmitModal(false);
                  setDayDescription('');
                  setSubmittedDays(prev => ({ ...prev, [selectedDateKey]: true }));
                  setShowClaimSuccessModal(true);
                }}
              >
                Confirm Submit
              </button>
              <button className={styles.btnOutline} onClick={() => setShowSubmitModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Timesheets;
