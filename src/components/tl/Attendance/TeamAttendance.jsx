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

const employeesBase = [
  { id: 'AC', name: 'Alice Chen', defaultIn: '09:00', defaultOut: '18:00' },
  { id: 'BS', name: 'Bob Smith', defaultIn: '09:15', defaultOut: '18:15' },
  { id: 'CD', name: 'Charlie Davis', defaultIn: '09:00', defaultOut: '18:00' },
  { id: 'DP', name: 'Diana Prince', defaultIn: '09:30', defaultOut: '18:30' },
  { id: 'EW', name: 'Evan Wright', defaultIn: '09:00', defaultOut: '18:00' },
  { id: 'FG', name: 'Fiona Gallagher', defaultIn: '09:00', defaultOut: '18:00' },
  { id: 'GH', name: 'George Hale', defaultIn: '08:45', defaultOut: '17:45' },
  { id: 'HL', name: 'Hannah Lee', defaultIn: '09:00', defaultOut: '18:00' },
  { id: 'IG', name: 'Ivy Green', defaultIn: '09:00', defaultOut: '18:00' },
  { id: 'JW', name: 'Jack White', defaultIn: '09:00', defaultOut: '18:00' },
  { id: 'KT', name: 'Kevin Taylor', defaultIn: '09:00', defaultOut: '18:00' },
  { id: 'MC', name: 'Michael Chang', defaultIn: '09:15', defaultOut: '18:30' }
];

const lateArrivalsData = [
  { id: 1, name: 'Michael Chang', date: 'May 1', scheduled: '09:00 AM', actual: '09:15 AM', minutes: '15 MINS', cumulative: '3 times', highlight: false },
  { id: 2, name: 'Bob Smith', date: 'May 2', scheduled: '09:00 AM', actual: '09:45 AM', minutes: '45 MINS', cumulative: '1 time', highlight: true },
  { id: 3, name: 'Fiona Gallagher', date: 'May 5', scheduled: '09:00 AM', actual: '09:35 AM', minutes: '35 MINS', cumulative: '5 times', highlight: true },
  { id: 4, name: 'George Hale', date: 'May 12', scheduled: '09:00 AM', actual: '09:20 AM', minutes: '20 MINS', cumulative: '2 times', highlight: false },
  { id: 5, name: 'Alice Chen', date: 'May 18', scheduled: '09:00 AM', actual: '09:10 AM', minutes: '10 MINS', cumulative: '1 time', highlight: false },
  { id: 6, name: 'Hannah Lee', date: 'May 22', scheduled: '09:00 AM', actual: '10:00 AM', minutes: '60 MINS', cumulative: '2 times', highlight: true }
];

const missedPunchesData = [
  { id: 1, name: 'Charlie Davis', date: 'May 4', type: 'CLOCK OUT' },
  { id: 2, name: 'Diana Prince', date: 'May 5', type: 'CLOCK IN' },
  { id: 3, name: 'Evan Wright', date: 'May 8', type: 'CLOCK OUT' },
  { id: 4, name: 'Ivy Green', date: 'May 10', type: 'CLOCK IN' },
  { id: 5, name: 'Jack White', date: 'May 15', type: 'CLOCK OUT' }
];

const TeamAttendance = ({ onBack }) => {

  const [selectedMonth, setSelectedMonth] = useState(4); // May (0-indexed)
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showAllTeam, setShowAllTeam] = useState(false);
  const [showAllLate, setShowAllLate] = useState(false);
  const [showAllMissed, setShowAllMissed] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState(new Set());
  const [notifiedMessages, setNotifiedMessages] = useState({});
  const [notifyModal, setNotifyModal] = useState({
    isOpen: false,
    alertId: null,
    employeeName: '',
    date: '',
    type: '',
    message: ''
  });

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
    return employeesBase.map(emp => {
      const rec = { id: emp.id, name: emp.name };
      daysInMonth.forEach(day => {
        const isWeekend = day.dayStr === 'sat' || day.dayStr === 'sun';
        let status = isWeekend ? 'Off' : 'Present';
        let timeIn = emp.defaultIn;
        let timeOut = emp.defaultOut;
        
        // Add some random absences/leaves for realism
        if (!isWeekend && emp.id === 'EW' && day.dateNum === 25) { status = 'Absent'; timeIn = '-'; timeOut = '-'; }
        if (!isWeekend && emp.id === 'DP' && day.dateNum === 27) { status = 'Leave'; timeIn = '-'; timeOut = '-'; }
        if (!isWeekend && emp.id === 'BS' && day.dateNum === 27) { status = 'WFH'; }
        if (!isWeekend && emp.id === 'GH' && day.dateNum === 28) { status = 'WFH'; }

        if (isWeekend) { timeIn = '-'; timeOut = '-'; }

        rec[day.dateNum] = { status, in: timeIn, out: timeOut };
      });
      return rec;
    });
  }, [daysInMonth]);

  const openNotifyModal = (alert) => {
    setNotifyModal({
      isOpen: true,
      alertId: alert.id,
      employeeName: alert.name,
      date: alert.date,
      type: alert.type,
      message: `Hi ${alert.name}, we noticed a missing ${alert.type} on ${alert.date}. Please update/regularize your attendance in the portal.`
    });
  };

  const handleSendNotification = () => {
    const newSet = new Set(notifiedIds);
    newSet.add(notifyModal.alertId);
    setNotifiedIds(newSet);

    setNotifiedMessages(prev => ({
      ...prev,
      [notifyModal.alertId]: notifyModal.message
    }));

    setNotifyModal({
      isOpen: false,
      alertId: null,
      employeeName: '',
      date: '',
      type: '',
      message: ''
    });
  };

  const handleCancelNotification = () => {
    setNotifyModal({
      isOpen: false,
      alertId: null,
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
      
      {/* Back Button Container */}
      <div>
        <button 
          onClick={onBack}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#6b7280', 
            fontWeight: '600', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px'
          }}
        >
          ← Back to Attendance Dashboard
        </button>
      </div>

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
          <div style={{ overflowX: 'auto', transform: 'rotateX(180deg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px', transform: 'rotateX(180deg)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6', color: '#6b7280', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0 0 16px 0', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1, minWidth: '200px' }}>Employee</th>
                  {daysInMonth.map(day => (
                    <th key={day.dateNum} style={{ padding: '0 0 16px 0', minWidth: '120px' }}>{day.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(showAllTeam ? teamGridData : teamGridData.slice(0, 5)).map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: idx === (showAllTeam ? teamGridData.length : 5) - 1 ? 'none' : '1px solid #f3f4f6' }}>
                    <td style={{ padding: '16px 0', position: 'sticky', left: 0, backgroundColor: '#fff', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '700', fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>{row.id}</span>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{row.name}</span>
                      </div>
                    </td>
                    {daysInMonth.map((day) => (
                      <td key={day.dateNum} style={{ padding: '16px 0' }}>
                        <div style={{ fontWeight: '600', fontSize: '13px', marginBottom: '4px', color: 
                          row[day.dateNum].status === 'Leave' ? '#9333ea' : 
                          row[day.dateNum].status === 'Absent' ? '#ef4444' : 
                          row[day.dateNum].status === 'Off' ? '#94a3b8' : '#0f172a'
                        }}>
                          {row[day.dateNum].status}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          In: {row[day.dateNum].in} <br/> Out: {row[day.dateNum].out}
                        </div>
                      </td>
                    ))}
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
                  {(showAllLate ? lateArrivalsData : lateArrivalsData.slice(0, 3)).map((row) => (
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
              {(showAllMissed ? missedPunchesData : missedPunchesData.slice(0, 2)).map((alert) => (
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
                onClick={handleSendNotification}
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
