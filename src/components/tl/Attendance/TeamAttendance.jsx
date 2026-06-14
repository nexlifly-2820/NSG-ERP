import React, { useState, useMemo } from 'react';
import styles from './attendance.module.css';

const monthsList = [
  { value: 0, label: 'January' },
  { value: 1, label: 'February' },
  { value: 2, label: 'March' },
  { value: 3, label: 'April' },
  { value: 4, label: 'May' },
  { value: 5, label: 'June' },
  { value: 6, label: 'July' },
  { value: 7, label: 'August' },
  { value: 8, label: 'September' },
  { value: 9, label: 'October' },
  { value: 10, label: 'November' },
  { value: 11, label: 'December' }
];

const currentYearVal = new Date().getFullYear();
const yearsList = Array.from({ length: currentYearVal - 2024 + 1 }, (_, i) => 2024 + i);

const TeamAttendance = ({ onBack }) => {

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // current month
  const [selectedYear, setSelectedYear] = useState(2026);
  const [viewMode, setViewMode] = useState('monthly');
  const [showAllTeam, setShowAllTeam] = useState(false);
  const [showAllLate, setShowAllLate] = useState(false);
  const [showAllMissed, setShowAllMissed] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState(new Set());
  const [notifiedMessages, setNotifiedMessages] = useState({});
  const [notifyModal, setNotifyModal] = useState({
    isOpen: false,
    alertId: null,
    employeeId: null,
    employeeName: '',
    date: '',
    type: '',
    message: ''
  });

  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [attendanceCorrections, setAttendanceCorrections] = useState([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [empRes, attRes, corrRes] = await Promise.all([
          fetch('/api/team-lead/team-members', { headers }),
          fetch('/api/team-lead/attendance', { headers }),
          fetch('/api/team-lead/attendance-corrections/pending', { headers })
        ]);
        
        if (empRes.ok) setEmployees(await empRes.json());
        if (attRes.ok) setAttendanceLogs(await attRes.json());
        if (corrRes.ok) setAttendanceCorrections(await corrRes.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const availableMonths = useMemo(() => {
    const today = new Date();
    const curYear = today.getFullYear();
    const curMonth = today.getMonth();

    if (selectedYear === curYear) {
      return monthsList.filter(m => m.value <= curMonth);
    }
    return monthsList;
  }, [selectedYear]);

  const daysInMonth = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth, 1);
    const days = [];
    while (date.getMonth() === selectedMonth) {
      const dayNum = date.getDate();
      const dayStr = date.toLocaleString('en-us', { weekday: 'short' }).toLowerCase();
      const label = `${date.toLocaleString('en-us', { weekday: 'short' })}, ${date.toLocaleString('en-us', { month: 'short' })} ${dayNum}`;
      days.push({ dateNum: dayNum, dayStr, label });
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedMonth, selectedYear]);

  const teamGridData = useMemo(() => {
    const emps = employees || [];
    return emps.map(emp => {
      const rec = { id: emp.emp_id || `NSG-${emp.id}`, dbId: emp.id, name: emp.name };
      let presentCount = 0, absentCount = 0, leaveCount = 0, offCount = 0, lateCount = 0, wfhCount = 0;
      daysInMonth.forEach(day => {
        const isWeekend = day.dayStr === 'sat' || day.dayStr === 'sun';
        
        // Lookup standard date string like "2026-05-27"
        const year = selectedYear;
        const monthStr = String(selectedMonth + 1).padStart(2, '0');
        const dateStr = String(day.dateNum).padStart(2, '0');
        const lookupDate = `${year}-${monthStr}-${dateStr}`;
        
        // Find log
        const log = (attendanceLogs || []).find(l => l.employee_id === emp.id && l.date === lookupDate);
        
        let status = isWeekend ? 'Off' : 'Present';
        let timeIn = '09:00';
        let timeOut = '18:00';
        
        if (log) {
          if (log.work_mode === 'wfh') {
            status = 'WFH';
            timeIn = log.clock_in ? new Date(log.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:00';
            timeOut = log.clock_out ? new Date(log.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '18:00';
          } else if (log.exception_flag === 'absent') {
            status = 'Absent';
            timeIn = '-';
            timeOut = '-';
          } else {
            status = log.is_late ? 'Late' : 'Present';
            timeIn = log.clock_in ? new Date(log.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';
            timeOut = log.clock_out ? new Date(log.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '-';
          }
        } else {
          // If no log seeded, default to absent on weekdays and Off on weekends
          if (isWeekend) {
            status = 'Off';
            timeIn = '-';
            timeOut = '-';
          } else {
            const todayKey = new Date().toISOString().slice(0, 10);
            if (lookupDate > todayKey) {
              status = '-';
              timeIn = '-';
              timeOut = '-';
            } else {
              status = 'Absent';
              timeIn = '-';
              timeOut = '-';
            }
          }
        }

        if (status === 'Present') presentCount++;
        if (status === 'Late') { presentCount++; lateCount++; }
        if (status === 'Absent') absentCount++;
        if (status === 'Leave') leaveCount++;
        if (status === 'Off') offCount++;
        if (status === 'WFH') { presentCount++; wfhCount++; }

        rec[day.dateNum] = { status, in: timeIn, out: timeOut };
      });
      rec.totals = { present: presentCount, absent: absentCount, leave: leaveCount, off: offCount, late: lateCount, wfh: wfhCount };
      return rec;
    });
  }, [employees, attendanceLogs, daysInMonth, selectedMonth, selectedYear]);

  const lateArrivalsData = useMemo(() => {
    const lates = [];
    const logs = attendanceLogs || [];
    
    // Calculate monthly cumulative lates
    const monthLatesMap = {};
    logs.forEach(l => {
      if (l.is_late) {
        const d = new Date(l.date);
        const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
        if (!monthLatesMap[monthKey]) monthLatesMap[monthKey] = {};
        monthLatesMap[monthKey][l.employee_id] = (monthLatesMap[monthKey][l.employee_id] || 0) + 1;
      }
    });

    logs.forEach(l => {
      if (l.is_late) {
        const emp = (employees || []).find(e => e.id === l.employee_id);
        if (emp) {
          const logDate = new Date(l.date);
          const monthName = logDate.toLocaleDateString('en-US', { month: 'short' });
          const dayNum = logDate.getDate();
          
          const actualTime = l.clock_in ? new Date(l.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
          
          // Calculate late by minutes
          let lateMinutes = 0;
          if (l.clock_in) {
             const inDate = new Date(l.clock_in);
             const expectedIn = new Date(inDate);
             expectedIn.setHours(9, 0, 0, 0); // Assuming 09:00 AM is the standard clock-in
             if (inDate > expectedIn) {
                lateMinutes = Math.floor((inDate - expectedIn) / 60000);
             }
          }

          let lateText = lateMinutes > 0 ? `${lateMinutes} mins` : 'Late Arrival';
          if (lateMinutes >= 60) {
             const hrs = Math.floor(lateMinutes / 60);
             const mins = lateMinutes % 60;
             lateText = mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
          }

          const monthKey = `${logDate.getFullYear()}-${logDate.getMonth()}`;
          const totalLates = monthLatesMap[monthKey][l.employee_id] || 1;
          const cumulativeText = `${totalLates} time${totalLates > 1 ? 's' : ''} this month`;

          lates.push({
            id: l.id,
            name: emp.name,
            date: `${monthName} ${dayNum}`,
            scheduled: '09:00 AM',
            actual: actualTime,
            minutes: lateText,
            cumulative: cumulativeText,
            highlight: totalLates >= 3
          });
        }
      }
    });
    // Sort by date descending
    lates.sort((a, b) => new Date(b.date) - new Date(a.date));
    return lates;
  }, [employees, attendanceLogs]);

  const missedPunchesData = useMemo(() => {
    const alerts = [];
    
    // 1. Scan attendance logs for missed punches
    const logs = attendanceLogs || [];
    logs.forEach(l => {
      if (l.clock_in && !l.clock_out) {
        const emp = (employees || []).find(e => e.id === l.employee_id);
        if (emp) {
          const logDate = new Date(l.date);
          const monthName = logDate.toLocaleDateString('en-US', { month: 'short' });
          const dayNum = logDate.getDate();
          
          alerts.push({
            id: `log-${l.id}`,
            employee_id: emp.id,
            name: emp.name,
            date: `${monthName} ${dayNum}`,
            type: 'CLOCK OUT'
          });
        }
      }
    });
    
    // 2. Scan pending corrections
    const corrections = attendanceCorrections || [];
    corrections.forEach(c => {
      const emp = (employees || []).find(e => e.id === c.user_id || e.id === c.employee_id);
      if (emp) {
        const logDate = new Date(c.correction_date);
        const monthName = logDate.toLocaleDateString('en-US', { month: 'short' });
        const dayNum = logDate.getDate();
        
        alerts.push({
          id: `corr-${c.id}`,
          employee_id: emp.id,
          name: emp.name,
          date: `${monthName} ${dayNum}`,
          type: 'REGULARIZATION'
        });
      }
    });
    
    return alerts;
  }, [employees, attendanceLogs, attendanceCorrections]);

  const openNotifyModal = (alert) => {
    setNotifyModal({
      isOpen: true,
      alertId: alert.id,
      employeeId: alert.employee_id,
      employeeName: alert.name,
      date: alert.date,
      type: alert.type,
      message: `Hi ${alert.name}, we noticed a missing or late punch (${alert.type}) on ${alert.date}. Please update/regularize your attendance in the portal.`
    });
  };
  const [sendingNotification, setSendingNotification] = useState(false);

  const handleSendNotification = async () => {
    setSendingNotification(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const response = await fetch('/api/team-lead/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_id: notifyModal.employeeId,
          message: notifyModal.message,
          type: 'warning'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      const newSet = new Set(notifiedIds);
      newSet.add(notifyModal.alertId);
      setNotifiedIds(newSet);
      
      setNotifiedMessages(prev => ({
        ...prev,
        [notifyModal.alertId]: notifyModal.message
      }));
      setNotifyModal({ ...notifyModal, isOpen: false });
    } catch (err) {
      console.error(err);
      alert('Error sending notification.');
    } finally {
      setSendingNotification(false);
    }
  };

  const handleCancelNotification = () => {
    setNotifyModal({
      isOpen: false,
      alertId: null,
      employeeId: null,
      employeeName: '',
      date: '',
      type: '',
      message: ''
    });
  };

  const handleExportCSV = () => {
    const headers = ['Employee ID', 'Employee Name', ...daysInMonth.map(day => day.label.replace(/,/g, ''))];
    
    const rows = teamGridData.map(row => {
      const line = [
        row.id,
        `"${row.name.replace(/"/g, '""')}"`,
        ...daysInMonth.map(day => {
          const dayData = row[day.dateNum];
          if (!dayData) return '';
          if (dayData.status === 'Off') return 'Off';
          return `"${dayData.status} (In: ${dayData.in} - Out: ${dayData.out})"`;
        })
      ];
      return line.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const monthLabel = monthsList.find(m => m.value === selectedMonth)?.label || 'Month';
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Team_Attendance_${monthLabel}_${selectedYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div className={styles.teamDashboardGrid}>
        
        {/* Controls Toolbar */}
        <div className={styles.teamDashboardControls}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>

            <select 
              value={selectedYear}
              onChange={(e) => {
                const year = parseInt(e.target.value);
                setSelectedYear(year);
                const today = new Date();
                if (year === today.getFullYear() && selectedMonth > today.getMonth()) {
                  setSelectedMonth(today.getMonth());
                }
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#f8fafc',
                fontSize: '14px',
                fontWeight: '600',
                color: '#334155',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '2px', marginLeft: '8px' }}>
              <button 
                onClick={() => setViewMode('daily')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: viewMode === 'daily' ? '#fff' : 'transparent',
                  color: viewMode === 'daily' ? '#4f46e5' : '#64748b',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'daily' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}>Daily Grid</button>
              <button 
                onClick={() => setViewMode('monthly')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: viewMode === 'monthly' ? '#fff' : 'transparent',
                  color: viewMode === 'monthly' ? '#4f46e5' : '#64748b',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: viewMode === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                }}>Monthly Summary</button>
            </div>
          </div>
          
          <button 
            onClick={handleExportCSV}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              color: '#334155',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export CSV
          </button>
        </div>

        {/* Team Attendance Register Grid */}
        <div className={styles.teamDashboardGridArea}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>
              Team Attendance Register
            </h3>
            <button 
              onClick={() => setShowAllTeam(!showAllTeam)}
              style={{
              background: 'none',
              border: 'none',
              color: '#4f46e5',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              {showAllTeam ? 'Show less' : 'View all team'}
            </button>
          </div>
          <div style={{ overflowX: 'auto', transform: viewMode === 'daily' ? 'rotateX(180deg)' : 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: viewMode === 'daily' ? '600px' : 'auto', transform: viewMode === 'daily' ? 'rotateX(180deg)' : 'none' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0 0 16px 0', position: viewMode === 'daily' ? 'sticky' : 'static', left: 0, backgroundColor: '#fff', zIndex: 1, minWidth: '200px' }}>Employee</th>
                  {viewMode === 'daily' ? daysInMonth.map(day => (
                    <th key={day.dateNum} style={{ padding: '0 0 16px 0', minWidth: '120px' }}>{day.label}</th>
                  )) : (
                    <>
                      <th style={{ padding: '0 0 16px 0', minWidth: '80px' }}>Present</th>
                      <th style={{ padding: '0 0 16px 0', minWidth: '80px' }}>Absent</th>
                      <th style={{ padding: '0 0 16px 0', minWidth: '80px' }}>Late</th>
                      <th style={{ padding: '0 0 16px 0', minWidth: '80px' }}>Leave</th>
                      <th style={{ padding: '0 0 16px 0', minWidth: '80px' }}>WFH</th>
                      <th style={{ padding: '0 0 16px 0', minWidth: '80px' }}>Off Days</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {(showAllTeam ? teamGridData : teamGridData.slice(0, 5)).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === (showAllTeam ? teamGridData.length : 5) - 1 ? 'none' : '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px 0', position: viewMode === 'daily' ? 'sticky' : 'static', left: 0, backgroundColor: '#fff', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '700', fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>{row.id}</span>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{row.name}</span>
                      </div>
                    </td>
                    {viewMode === 'daily' ? daysInMonth.map((day) => (
                      <td key={day.dateNum} style={{ padding: '16px 0' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px', color: 
                          row[day.dateNum].status === 'Leave' ? '#9333ea' : 
                          row[day.dateNum].status === 'Absent' ? '#ef4444' : 
                          row[day.dateNum].status === 'Off' ? '#94a3b8' : '#0f172a'
                        }}>
                          {row[day.dateNum].status}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {row[day.dateNum].status !== '-' && row[day.dateNum].status !== 'Off' && row[day.dateNum].status !== 'Absent' ? (
                            <>In: {row[day.dateNum].in} <br/> Out: {row[day.dateNum].out}</>
                          ) : ''}
                        </div>
                      </td>
                    )) : (
                      <>
                        <td style={{ padding: '16px 0', fontWeight: '700', color: '#10b981', fontSize: '14px' }}>{row.totals?.present || 0}</td>
                        <td style={{ padding: '16px 0', fontWeight: '700', color: '#ef4444', fontSize: '14px' }}>{row.totals?.absent || 0}</td>
                        <td style={{ padding: '16px 0', fontWeight: '700', color: '#f59e0b', fontSize: '14px' }}>{row.totals?.late || 0}</td>
                        <td style={{ padding: '16px 0', fontWeight: '700', color: '#9333ea', fontSize: '14px' }}>{row.totals?.leave || 0}</td>
                        <td style={{ padding: '16px 0', fontWeight: '700', color: '#3b82f6', fontSize: '14px' }}>{row.totals?.wfh || 0}</td>
                        <td style={{ padding: '16px 0', fontWeight: '700', color: '#94a3b8', fontSize: '14px' }}>{row.totals?.off || 0}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts and Flags Area */}
        <div className={styles.teamDashboardFlagsArea}>
          
          {/* LATE ARRIVALS */}
          <div className={styles.teamDashboardCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }}></span>
                Late Arrival Reports
              </h3>
              <button 
                onClick={() => setShowAllLate(!showAllLate)}
                style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}>
                {showAllLate ? 'Show less' : 'View all'}
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f3f4f6', color: '#6b7280', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0 0 12px 0' }}>Employee</th>
                    <th style={{ padding: '0 0 12px 0' }}>Date</th>
                    <th style={{ padding: '0 0 12px 0' }}>Late By</th>
                    <th style={{ padding: '0 0 12px 0', textAlign: 'right' }}>Month Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lateArrivalsData.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                        No late arrivals to report.
                      </td>
                    </tr>
                  ) : (showAllLate ? lateArrivalsData : lateArrivalsData.slice(0, 3)).map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '12px 0', fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>
                        {row.name}
                      </td>
                      <td style={{ padding: '12px 0', color: '#475569', fontSize: '13px' }}>{row.date}</td>
                      <td style={{ padding: '12px 0', fontWeight: '700', color: row.highlight ? '#ef4444' : '#f59e0b', fontSize: '13px' }}>{row.minutes}</td>
                      <td style={{ padding: '12px 0', color: '#475569', fontSize: '13px', textAlign: 'right' }}>{row.cumulative}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* MISSED PUNCHES */}
          <div className={styles.teamDashboardCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span>
                Missed Punches Alerts
              </h3>
              <button 
                onClick={() => setShowAllMissed(!showAllMissed)}
                style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}>
                {showAllMissed ? 'Show less' : 'View all'}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {missedPunchesData.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', padding: '16px 0' }}>
                  No missed punches to report.
                </div>
              ) : (showAllMissed ? missedPunchesData : missedPunchesData.slice(0, 2)).map((alert) => (
                <div key={alert.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '8px', backgroundColor: '#fafafa' }}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px', marginBottom: '2px' }}>{alert.name}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{alert.date} • <span style={{ fontWeight: '600', color: '#ef4444' }}>Missing {alert.type}</span></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {notifiedIds.has(alert.id) && notifiedMessages[alert.id] && (
                      <span 
                        title={`Message sent: "${notifiedMessages[alert.id]}"`}
                        style={{
                          cursor: 'help',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#4f46e5',
                          backgroundColor: '#eef2ff',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: '11px',
                          fontWeight: 'bold',
                          border: '1px solid #c7d2fe'
                        }}
                      >
                        i
                      </span>
                    )}
                    <button 
                      onClick={() => openNotifyModal(alert)}
                      disabled={notifiedIds.has(alert.id)}
                      style={{
                      padding: '6px 12px',
                      backgroundColor: notifiedIds.has(alert.id) ? '#f8fafc' : '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      color: notifiedIds.has(alert.id) ? '#94a3b8' : '#334155',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: notifiedIds.has(alert.id) ? 'not-allowed' : 'pointer'
                    }}>
                      {notifiedIds.has(alert.id) ? 'Notified' : 'Notify'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Custom Notify Modal Overlay */}
      {notifyModal.isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '420px' }}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Notify Employee</h4>
              <button onClick={handleCancelNotification} className={styles.btnCloseModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', lineHeight: '1.4' }}>
                Send a regularization notice to <strong>{notifyModal.employeeName}</strong> for the missing <strong>{notifyModal.type}</strong> on <strong>{notifyModal.date}</strong>.
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Message Template</label>
                <textarea
                  className={styles.textareaField}
                  value={notifyModal.message}
                  onChange={(e) => setNotifyModal(prev => ({ ...prev, message: e.target.value }))}
                  style={{ minHeight: '100px', fontSize: '13px', lineHeight: '1.5' }}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                onClick={handleCancelNotification}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button 
                className={styles.sendAlertBtn} 
                onClick={handleSendNotification}
                disabled={sendingNotification}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: '#4f46e5',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: '#ffffff',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(79, 70, 229, 0.15)'
                }}
              >
                Send Notification
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TeamAttendance;
