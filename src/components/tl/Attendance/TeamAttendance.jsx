import React, { useState, useMemo } from 'react';
import styles from './attendance.module.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCompany } from '../../common/CompanyContext';

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

const SplitView = ({ data, title, onBack, onDismiss, type }) => {
  const [selectedEmp, setSelectedEmp] = useState(null);
  
  const empsMap = {};
  data.forEach(item => {
    if (!empsMap[item.employee_id]) empsMap[item.employee_id] = { id: item.employee_id, name: item.name, count: 0, items: [] };
    empsMap[item.employee_id].count++;
    empsMap[item.employee_id].items.push(item);
  });
  const empsList = Object.values(empsMap).sort((a,b) => b.count - a.count);
  const selectedItems = selectedEmp ? empsMap[selectedEmp]?.items || [] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#475569' }}>
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#1e293b' }}>{title}</h2>
      </div>
      
      <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
        <div style={{ width: '300px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontWeight: '600', color: '#334155' }}>
            Employees ({empsList.length})
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {empsList.map(emp => (
              <div 
                key={emp.id} 
                onClick={() => setSelectedEmp(emp.id)}
                style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', backgroundColor: selectedEmp === emp.id ? '#e0e7ff' : '#fff', transition: 'all 0.2s' }}
              >
                <div style={{ fontWeight: '600', color: selectedEmp === emp.id ? '#4f46e5' : '#1e293b', fontSize: '14px' }}>{emp.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{emp.count} incident{emp.count > 1 ? 's' : ''}</div>
              </div>
            ))}
            {empsList.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>No alerts to display</div>}
          </div>
        </div>
        
        <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          {!selectedEmp ? (
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '15px' }}>
              Select an employee from the left panel to view their detailed history
            </div>
          ) : (
            <>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#0f172a' }}>{empsMap[selectedEmp]?.name}'s History</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Date</th>
                      {type === 'late' && <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Scheduled</th>}
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Actual Time</th>
                      {type === 'late' && <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Late By</th>}
                      {type === 'missed' && <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '13px' }}>Type</th>}
                      <th style={{ padding: '12px 16px', borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '600', fontSize: '13px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item) => (
                      <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 16px', color: '#334155', fontSize: '14px', fontWeight: '500' }}>{item.date}</td>
                        {type === 'late' && <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px' }}>{item.scheduled}</td>}
                        <td style={{ padding: '12px 16px', color: '#334155', fontSize: '14px' }}>{item.actual}</td>
                        {type === 'late' && <td style={{ padding: '12px 16px', color: item.highlight ? '#ef4444' : '#f59e0b', fontSize: '14px', fontWeight: '600' }}>{item.minutes}</td>}
                        {type === 'missed' && <td style={{ padding: '12px 16px', color: '#ef4444', fontSize: '14px', fontWeight: '600' }}>{item.type}</td>}
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button 
                            onClick={() => {
                              onDismiss(item.id);
                              if (selectedItems.length === 1) setSelectedEmp(null);
                            }}
                            style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#fee2e2', color: '#ef4444', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }}
                            onMouseOver={e => e.target.style.backgroundColor = '#fecaca'}
                            onMouseOut={e => e.target.style.backgroundColor = '#fee2e2'}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const TeamAttendance = ({ onBack }) => {
  const { companyLogo } = useCompany();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // current month
  const [selectedYear, setSelectedYear] = useState(2026);
  const [viewMode, setViewMode] = useState('monthly');
  
  // Advanced Filters & Pagination
  const [nameFilter, setNameFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
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

  const filteredGridData = useMemo(() => {
    return teamGridData.filter(row => {
      if (nameFilter && row.id !== nameFilter) {
        return false;
      }
      if (statusFilter && statusFilter !== 'all') {
        const filterKey = statusFilter.toLowerCase();
        if (!row.totals || row.totals[filterKey] === 0) {
             return false;
        }
      }
      return true;
    });
  }, [teamGridData, nameFilter, statusFilter]);

  const totalPages = Math.ceil(filteredGridData.length / itemsPerPage) || 1;
  const paginatedGridData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredGridData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredGridData, currentPage, itemsPerPage]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [nameFilter, statusFilter, selectedMonth, selectedYear]);

  const parseShiftStart = (shiftStr) => {
    if (!shiftStr) return { hour: 9, minute: 0 };
    const parts = shiftStr.split('-');
    if (parts.length > 0) {
      const timeParts = parts[0].trim().split(':');
      if (timeParts.length === 2) {
        return { hour: parseInt(timeParts[0], 10), minute: parseInt(timeParts[1], 10) };
      }
    }
    return { hour: 9, minute: 0 };
  };

  const parseShiftEnd = (shiftStr) => {
    if (!shiftStr) return { hour: 18, minute: 0 };
    const parts = shiftStr.split('-');
    if (parts.length > 1) {
      const timeParts = parts[1].trim().split(':');
      if (timeParts.length === 2) {
        return { hour: parseInt(timeParts[0], 10), minute: parseInt(timeParts[1], 10) };
      }
    }
    return { hour: 18, minute: 0 };
  };

  const lateArrivalsData = useMemo(() => {
    const lates = [];
    const logs = attendanceLogs || [];
    
    // Calculate monthly cumulative lates
    const monthLatesMap = {};
    logs.forEach(l => {
      if (l.clock_in) {
        const emp = (employees || []).find(e => e.id === l.employee_id);
        const shiftStart = parseShiftStart(emp?.shift_timing);
        const inDate = new Date(l.clock_in);
        const expectedIn = new Date(inDate);
        expectedIn.setHours(shiftStart.hour, shiftStart.minute, 0, 0);
        
        // 30 min grace period
        const lateThreshold = new Date(expectedIn.getTime() + 30 * 60000);
        
        if (inDate > lateThreshold) {
          const d = new Date(l.date);
          const monthKey = `${d.getFullYear()}-${d.getMonth()}`;
          if (!monthLatesMap[monthKey]) monthLatesMap[monthKey] = {};
          monthLatesMap[monthKey][l.employee_id] = (monthLatesMap[monthKey][l.employee_id] || 0) + 1;
        }
      }
    });

    logs.forEach(l => {
      if (l.clock_in && !l.late_alert_dismissed) {
        const emp = (employees || []).find(e => e.id === l.employee_id);
        if (emp) {
          const shiftStart = parseShiftStart(emp.shift_timing);
          const inDate = new Date(l.clock_in);
          const expectedIn = new Date(inDate);
          expectedIn.setHours(shiftStart.hour, shiftStart.minute, 0, 0);
          
          // 30 min grace period
          const lateThreshold = new Date(expectedIn.getTime() + 30 * 60000);
          
          if (inDate > lateThreshold) {
            const logDate = new Date(l.date);
            const monthName = logDate.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = logDate.getDate();
            
            const actualTime = new Date(l.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const scheduledTime = expectedIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            
            let lateMinutes = Math.floor((inDate - expectedIn) / 60000);
            let lateText = `${lateMinutes} mins`;
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
              employee_id: l.employee_id,
              name: emp.name,
              date: `${monthName} ${dayNum}`,
              scheduled: scheduledTime,
              actual: actualTime,
              minutes: lateText,
              cumulative: cumulativeText,
              totalLates: totalLates,
              highlight: totalLates >= 3
            });
          }
        }
      }
    });
    lates.sort((a, b) => new Date(b.date) - new Date(a.date));
    return lates;
  }, [employees, attendanceLogs]);

  const missedPunchesData = useMemo(() => {
    const alerts = [];
    const logs = attendanceLogs || [];
    
    // 1. Scan attendance logs for missed punches
    logs.forEach(l => {
      if (l.clock_in && !l.missed_punch_alert_dismissed) {
        const emp = (employees || []).find(e => e.id === l.employee_id);
        if (emp) {
          const shiftEnd = parseShiftEnd(emp.shift_timing);
          
          let isMissed = false;
          let actualTime = 'No Punch';
          
          if (!l.clock_out) {
            isMissed = true;
          } else {
            const outDate = new Date(l.clock_out);
            const expectedOut = new Date(outDate);
            expectedOut.setHours(shiftEnd.hour, shiftEnd.minute, 0, 0);
            
            // 30 min grace period after shift end
            const missedThreshold = new Date(expectedOut.getTime() + 30 * 60000);
            if (outDate > missedThreshold) {
              isMissed = true;
              actualTime = outDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
          }
          
          if (isMissed) {
            const logDate = new Date(l.date);
            const monthName = logDate.toLocaleDateString('en-US', { month: 'short' });
            const dayNum = logDate.getDate();
            
            alerts.push({
              id: l.id,
              employee_id: emp.id,
              name: emp.name,
              date: `${monthName} ${dayNum}`,
              type: 'CLOCK OUT',
              actual: actualTime
            });
          }
        }
      }
    });
    
    // 2. Pending corrections
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
          type: 'REGULARIZATION',
          actual: 'Pending'
        });
      }
    });
    
    alerts.sort((a, b) => new Date(b.date) - new Date(a.date));
    return alerts;
  }, [employees, attendanceLogs, attendanceCorrections]);

  const handleDismissLate = async (id) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/team-lead/attendance/${id}/dismiss-late`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAttendanceLogs(prev => prev.map(log => log.id === id ? { ...log, late_alert_dismissed: true } : log));
      }
    } catch (e) { console.error("Failed to dismiss late alert", e); }
  };

  const handleDismissMissedPunch = async (id) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/team-lead/attendance/${id}/dismiss-missed-punch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAttendanceLogs(prev => prev.map(log => log.id === id ? { ...log, missed_punch_alert_dismissed: true } : log));
      }
    } catch (e) { console.error("Failed to dismiss missed punch alert", e); }
  };

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

  const handleExportPDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const monthLabel = monthsList.find(m => m.value === selectedMonth)?.label || 'Month';
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = companyLogo || '/hmns-logo.png';
    
    img.onload = () => {
      // Premium White Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 100, 'F');
      
      const imgRatio = img.width / img.height;
      const logoHeight = 45;
      const logoWidth = logoHeight * imgRatio;
      doc.addImage(img, 'PNG', 40, 25, logoWidth, logoHeight);
      
      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(40, 90, doc.internal.pageSize.getWidth() - 40, 90);
      
      // Report Title
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.text('TEAM ATTENDANCE', doc.internal.pageSize.getWidth() - 40, 45, { align: 'right' });
      
      // Report Date & Generation Time
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${monthLabel} ${selectedYear}`, doc.internal.pageSize.getWidth() - 40, 65, { align: 'right' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, doc.internal.pageSize.getWidth() - 40, 80, { align: 'right' });

      // Define Table Columns
      let head = [];
      if (viewMode === 'daily') {
        head = [['Employee', ...daysInMonth.map(day => day.dateNum.toString())]];
      } else {
        head = [['Employee ID', 'Name', 'Present', 'Absent', 'Late', 'Leave', 'WFH', 'Off Days']];
      }
      
      // Define Table Rows
      const body = filteredGridData.map(row => {
        if (viewMode === 'daily') {
          const statuses = daysInMonth.map(day => {
            const s = row[day.dateNum]?.status;
            if (s === 'Present') return 'P';
            if (s === 'Absent') return 'A';
            if (s === 'Late') return 'L';
            if (s === 'Leave') return 'Lv';
            if (s === 'WFH') return 'WFH';
            if (s === 'Off') return 'W';
            return '-';
          });
          return [row.name, ...statuses];
        } else {
          return [
            row.id,
            row.name,
            row.totals?.present || 0,
            row.totals?.absent || 0,
            row.totals?.late || 0,
            row.totals?.leave || 0,
            row.totals?.wfh || 0,
            row.totals?.off || 0
          ];
        }
      });
      
      if (viewMode === 'daily') {
        autoTable(doc, {
          startY: 110,
          head: head,
          body: body,
          theme: 'plain',
          styles: { font: 'helvetica', cellPadding: { top: 8, bottom: 8, left: 4, right: 4 }, lineColor: [226, 232, 240], lineWidth: { bottom: 0.5 }, minCellHeight: 28 },
          headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: { top: 0.5, bottom: 0.5 }, lineColor: [203, 213, 225] },
          bodyStyles: { fontSize: 8, halign: 'center', valign: 'middle', textColor: [71, 85, 105] },
          columnStyles: { 0: { halign: 'left', cellWidth: 120, fontStyle: 'bold', textColor: [15, 23, 42], cellPadding: { left: 12, top: 8, bottom: 8 } } },
          didParseCell: function (data) {
            if (data.section === 'body' && data.column.index > 0) {
              const value = data.cell.raw;
              if (value === 'P') { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold'; }
              else if (value === 'A') { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
              else if (value === 'L') { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = 'bold'; }
              else if (value === 'W') { data.cell.styles.textColor = [148, 163, 184]; data.cell.styles.fillColor = [248, 250, 252]; }
              else if (value === 'WFH') { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold'; }
            }
          },
          margin: { top: 110, left: 30, right: 30 }
        });
      } else {
        autoTable(doc, {
          startY: 110,
          head: head,
          body: body,
          theme: 'plain',
          styles: { font: 'helvetica', cellPadding: { top: 8, bottom: 8, left: 6, right: 6 }, lineColor: [226, 232, 240], lineWidth: { bottom: 0.5 }, minCellHeight: 25 },
          headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold', halign: 'left', valign: 'middle', lineWidth: { top: 0.5, bottom: 0.5 }, lineColor: [203, 213, 225] },
          bodyStyles: { fontSize: 9, halign: 'left', valign: 'middle', textColor: [71, 85, 105] },
          columnStyles: { 0: { fontStyle: 'bold', textColor: [15, 23, 42] } },
          margin: { top: 110, left: 40, right: 40 }
        });
      }

      // Legend
      const finalY = doc.lastAutoTable?.finalY || 110;
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      if (viewMode === 'daily') {
        doc.text('Legend: P = Present  |  A = Absent  |  L = Late  |  Lv = Leave  |  WFH = Work from Home  |  W = Weekend/Off', 30, finalY + 30);
      }
      
      doc.save(`Team_Attendance_${monthLabel}_${selectedYear}.pdf`);
    };

    img.onerror = () => {
      alert("Failed to load logo, but PDF will still generate.");
      doc.save(`Team_Attendance_${monthLabel}_${selectedYear}.pdf`);
    };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {viewMode === 'late_arrivals' && (
        <SplitView 
          data={lateArrivalsData} 
          title="Late Arrival Reports" 
          onBack={() => setViewMode('monthly')} 
          onDismiss={handleDismissLate} 
          type="late" 
        />
      )}
      
      {viewMode === 'missed_punches' && (
        <SplitView 
          data={missedPunchesData} 
          title="Missed Punches Alerts" 
          onBack={() => setViewMode('monthly')} 
          onDismiss={handleDismissMissedPunch} 
          type="missed" 
        />
      )}

      {(viewMode === 'daily' || viewMode === 'monthly') && (
        <div className={styles.teamDashboardGrid}>
        
        {/* Controls Toolbar */}
        <div className={styles.teamDashboardControls} style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className={styles.segmentedControl}>
              <button 
                onClick={() => setViewMode('daily')}
                className={`${styles.segmentedBtn} ${viewMode === 'daily' ? styles.segmentedBtnActive : ''}`}
              >
                Daily Grid
              </button>
              <button 
                onClick={() => setViewMode('monthly')}
                className={`${styles.segmentedBtn} ${viewMode === 'monthly' ? styles.segmentedBtnActive : ''}`}
              >
                Monthly Summary
              </button>
            </div>
            
            <button 
              onClick={handleExportPDF}
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
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              Export PDF
            </button>
          </div>

          <div className={styles.filterRowGrid}>
            <select 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className={styles.selectField}
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
              className={styles.selectField}
            >
              {yearsList.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            
            <select
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className={styles.selectField}
            >
              <option value="">All Employees</option>
              {employees.map(emp => (
                <option key={emp.id} value={`NSG-${emp.id}`}>{emp.name}</option>
              ))}
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.selectField}
            >
              <option value="all">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="leave">Leave</option>
              <option value="wfh">WFH</option>
              <option value="off">Off Days</option>
            </select>
          </div>
        </div>

        {/* Team Attendance Register Grid */}
        <div className={styles.teamDashboardGridArea}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>
              Team Attendance Register
            </h3>
          </div>
          <div style={{ overflowX: 'auto', transform: viewMode === 'daily' ? 'rotateX(180deg)' : 'none' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: viewMode === 'daily' ? '600px' : 'auto', transform: viewMode === 'daily' ? 'rotateX(180deg)' : 'none' }}>
              <thead>
                <tr>
                  <th className={styles.premiumTableHead} style={{ position: viewMode === 'daily' ? 'sticky' : 'static', left: 0, backgroundColor: '#fff', zIndex: 1, minWidth: '200px' }}>Employee</th>
                  {viewMode === 'daily' ? daysInMonth.map(day => (
                    <th key={day.dateNum} className={styles.premiumTableHead} style={{ minWidth: '120px' }}>{day.label}</th>
                  )) : (
                    <>
                      <th className={styles.premiumTableHead} style={{ minWidth: '80px' }}>Present</th>
                      <th className={styles.premiumTableHead} style={{ minWidth: '80px' }}>Absent</th>
                      <th className={styles.premiumTableHead} style={{ minWidth: '80px' }}>Late</th>
                      <th className={styles.premiumTableHead} style={{ minWidth: '80px' }}>Leave</th>
                      <th className={styles.premiumTableHead} style={{ minWidth: '80px' }}>WFH</th>
                      <th className={styles.premiumTableHead} style={{ minWidth: '80px' }}>Off Days</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {paginatedGridData.length === 0 ? (
                  <tr>
                    <td colSpan={viewMode === 'daily' ? daysInMonth.length + 1 : 7} style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                      No attendance records found for the selected filters.
                    </td>
                  </tr>
                ) : paginatedGridData.map((row, idx) => (
                  <tr key={idx} className={styles.premiumTableRow}>
                    <td className={styles.premiumTableCell} style={{ position: viewMode === 'daily' ? 'sticky' : 'static', left: 0, backgroundColor: '#fff', zIndex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '700', fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>{row.id}</span>
                        <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '14px' }}>{row.name}</span>
                      </div>
                    </td>
                    {viewMode === 'daily' ? daysInMonth.map((day) => (
                      <td key={day.dateNum} className={styles.premiumTableCell}>
                        <div className={`${styles.glassTag} ${
                          row[day.dateNum].status === 'Present' ? styles.glassPresent :
                          row[day.dateNum].status === 'Absent' ? styles.glassAbsent :
                          row[day.dateNum].status === 'Late' ? styles.glassLate :
                          row[day.dateNum].status === 'Leave' ? styles.glassLeave :
                          row[day.dateNum].status === 'WFH' ? styles.glassWFH :
                          styles.glassOff
                        }`} style={{ marginBottom: '6px' }}>
                          {row[day.dateNum].status}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                          {row[day.dateNum].status !== '-' && row[day.dateNum].status !== 'Off' && row[day.dateNum].status !== 'Absent' ? (
                            <>In: {row[day.dateNum].in} <br/> Out: {row[day.dateNum].out}</>
                          ) : ''}
                        </div>
                      </td>
                    )) : (
                      <>
                        <td className={styles.premiumTableCell}><span className={`${styles.glassTag} ${styles.glassPresent}`}>{row.totals?.present || 0}</span></td>
                        <td className={styles.premiumTableCell}><span className={`${styles.glassTag} ${styles.glassAbsent}`}>{row.totals?.absent || 0}</span></td>
                        <td className={styles.premiumTableCell}><span className={`${styles.glassTag} ${styles.glassLate}`}>{row.totals?.late || 0}</span></td>
                        <td className={styles.premiumTableCell}><span className={`${styles.glassTag} ${styles.glassLeave}`}>{row.totals?.leave || 0}</span></td>
                        <td className={styles.premiumTableCell}><span className={`${styles.glassTag} ${styles.glassWFH}`}>{row.totals?.wfh || 0}</span></td>
                        <td className={styles.premiumTableCell}><span className={`${styles.glassTag} ${styles.glassOff}`}>{row.totals?.off || 0}</span></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          {totalPages > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#ffffff', borderRadius: '0 0 12px 12px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Showing {filteredGridData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredGridData.length)} of {filteredGridData.length} entries
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '8px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Page {currentPage} of {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '8px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: currentPage === totalPages || totalPages === 0 ? 'not-allowed' : 'pointer', color: currentPage === totalPages || totalPages === 0 ? '#94a3b8' : '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Alerts and Flags Area */}
        <div className={styles.teamDashboardFlagsArea}>
          
          {/* LATE ARRIVALS */}
          <div className={styles.teamDashboardCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className={styles.premiumCardTitle}>
                <span className={`${styles.premiumCardIcon} ${styles.iconLate}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                </span>
                Late Arrival Reports
              </h3>
              <button 
                onClick={() => setViewMode('late_arrivals')}
                style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}>
                View all
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {lateArrivalsData.length === 0 ? (
                <div style={{ padding: '16px 0', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                  No late arrivals to report.
                </div>
              ) : (showAllLate ? lateArrivalsData : lateArrivalsData.slice(0, 3)).map((row) => (
                <div key={row.id} className={styles.premiumAlertItem}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px', marginBottom: '2px' }}>{row.name}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{row.date}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', color: row.highlight ? '#ef4444' : '#f59e0b', fontSize: '13px', marginBottom: '2px' }}>{row.minutes}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{row.cumulative}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MISSED PUNCHES */}
          <div className={styles.teamDashboardCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className={styles.premiumCardTitle}>
                <span className={`${styles.premiumCardIcon} ${styles.iconMissed}`}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </span>
                Missed Punches Alerts
              </h3>
              <button 
                onClick={() => setViewMode('missed_punches')}
                style={{
                background: 'none',
                border: 'none',
                color: '#4f46e5',
                fontWeight: '600',
                fontSize: '13px',
                cursor: 'pointer',
              }}>
                View all
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {missedPunchesData.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: '13px', padding: '16px 0' }}>
                  No missed punches to report.
                </div>
              ) : (showAllMissed ? missedPunchesData : missedPunchesData.slice(0, 2)).map((alert) => (
                <div key={alert.id} className={styles.premiumAlertItem}>
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px', marginBottom: '2px' }}>{alert.name}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{alert.date} • <span style={{ fontWeight: '600', color: '#ef4444' }}>Missing {alert.type}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
        </div>
      )}

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
