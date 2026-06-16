// Crash fix applied
import { useState, useEffect } from 'react';
import { Clock, Calendar, List, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { notify } from '../../utils/notify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

export function AttendanceRegisterView() {
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [activeCorrections, setActiveCorrections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [viewMode, setViewMode] = useState('list');
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [denyingId, setDenyingId] = useState(null);
  const [denyComment, setDenyComment] = useState('');
  
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('nsg_jwt_token');
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      const [empRes, logsRes, corrRes] = await Promise.all([
        fetch('/api/hr-portal/employees', { headers }),
        fetch('/api/attendance/all-logs', { headers }),
        fetch('/api/attendance/corrections', { headers })
      ]);
      
      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployees(empData);
      }
      
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setAttendanceLogs(logsData);
      }
      
      if (corrRes.ok) {
        const corrData = await corrRes.json();
        setActiveCorrections(corrData);
      }
    } catch (err) {
      console.error('Failed to fetch attendance data:', err);
      notify('Failed to fetch attendance records.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveCorrection = async (id) => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/attendance/corrections/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to approve correction.');
      }
      notify('Missed punch correction approved successfully!');
      // Refresh data
      fetchData();
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  const handleDenyCorrection = async (id) => {
    if (!denyComment.trim()) {
      alert('Please specify a reason for denying the request.');
      return;
    }
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch(`/api/attendance/corrections/${id}/deny`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: denyComment })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to deny correction.');
      }
      notify('Regularization request denied successfully.');
      setDenyingId(null);
      setDenyComment('');
      // Refresh data
      fetchData();
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  let mappedLogs = attendanceLogs || [];

  mappedLogs = mappedLogs.filter(log => {
    const d = new Date(log.date);
    return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
  });

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const currentMonth = selectedMonth;
  const currentYear = selectedYear;
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Pagination Logic for Employees (Calendar Grid)
  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);

  // Pagination Logic for Logs (List View)
  const totalLogPages = Math.ceil(mappedLogs.length / itemsPerPage);
  const currentLogs = mappedLogs.slice(indexOfFirstItem, indexOfLastItem);

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);

  const logsByEmpAndDay = {};
  mappedLogs.forEach(log => {
    const dateObj = new Date(log.date);
    if (dateObj.getMonth() === currentMonth && dateObj.getFullYear() === currentYear) {
      if (!logsByEmpAndDay[log.user_id]) logsByEmpAndDay[log.user_id] = {};
      logsByEmpAndDay[log.user_id][dateObj.getDate()] = log;
    }
  });

  const renderCalendarCell = (empId, day) => {
    const date = new Date(currentYear, currentMonth, day);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    const baseStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      fontSize: '11px',
      fontWeight: '700',
      margin: '0 auto',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    };

    if (isWeekend) {
      return (
        <div style={{ ...baseStyle, backgroundColor: '#f1f5f9', color: '#94a3b8', border: '1px solid #e2e8f0' }} title="Weekend">
          W
        </div>
      );
    }
    const log = logsByEmpAndDay[empId]?.[day];
    if (!log) {
      if (date > today) return <div style={{ ...baseStyle, backgroundColor: 'transparent', color: '#cbd5e1' }}>-</div>;
      return (
        <div style={{ ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)' }} title="Absent" className="hover-scale">
          A
        </div>
      );
    }
    
    if (log.exception_flag === 'absent' || !log.clock_in) {
      return (
        <div style={{ ...baseStyle, backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', boxShadow: '0 2px 4px rgba(220, 38, 38, 0.1)' }} title="Absent" className="hover-scale">
          A
        </div>
      );
    } else if (log.exception_flag === 'late') {
      return (
        <div style={{ ...baseStyle, backgroundColor: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', boxShadow: '0 2px 4px rgba(217, 119, 6, 0.1)' }} title="Late" className="hover-scale">
          L
        </div>
      );
    } else {
      return (
        <div style={{ ...baseStyle, backgroundColor: '#dcfce7', color: '#16a34a', border: '1px solid #bbf7d0', boxShadow: '0 2px 4px rgba(22, 163, 74, 0.1)' }} title="Present" className="hover-scale">
          P
        </div>
      );
    }
  };

  const handleDownloadPDF = () => {
    notify('Generating premium PDF report...', 'success');
    
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });
    
    const img = new Image();
    img.src = '/hmns-logo.png';
    
    img.onload = () => {
      // Premium White Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 100, 'F');
      
      // Calculate Logo Aspect Ratio to prevent stretching
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
      doc.text('ATTENDANCE REGISTER', doc.internal.pageSize.getWidth() - 40, 45, { align: 'right' });
      
      // Report Date & Generation Time
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${monthName} ${selectedYear}`, doc.internal.pageSize.getWidth() - 40, 65, { align: 'right' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, doc.internal.pageSize.getWidth() - 40, 80, { align: 'right' });

      if (viewMode === 'list') {
        // PDF Logic for List View
        const tableHeaders = ['Employee Name', 'Punch Date', 'Clock In', 'Clock Out', 'Work Mode'];
        const tableBody = mappedLogs.map(log => {
          const emp = employees.find(e => String(e.id) === String(log.user_id)) || { name: 'Unknown' };
          const punchDate = new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
          const clockIn = log.clock_in ? new Date(log.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Missed';
          const clockOut = log.clock_out ? new Date(log.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Missed';
          const workMode = log.work_mode === 'wfh' ? 'WFH' : 'Office';
          return [emp.name, punchDate, clockIn, clockOut, workMode];
        });

        autoTable(doc, {
          startY: 110,
          head: [tableHeaders],
          body: tableBody,
          theme: 'plain',
          styles: { font: 'helvetica', cellPadding: { top: 8, bottom: 8, left: 6, right: 6 }, lineColor: [226, 232, 240], lineWidth: { bottom: 0.5 }, minCellHeight: 25 },
          headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontSize: 9, fontStyle: 'bold', halign: 'left', valign: 'middle', lineWidth: { top: 0.5, bottom: 0.5 }, lineColor: [203, 213, 225] },
          bodyStyles: { fontSize: 9, halign: 'left', valign: 'middle', textColor: [71, 85, 105] },
          columnStyles: { 0: { fontStyle: 'bold', textColor: [15, 23, 42] } },
          didParseCell: function (data) {
            if (data.section === 'body') {
              const val = data.cell.raw;
              if (val === 'Missed' || val === 'Absent') { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
              else if (val === 'Late') { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = 'bold'; }
              else if (val === 'WFH') { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold'; }
            }
          },
          margin: { top: 110, left: 40, right: 40 }
        });

      } else {
        // PDF Logic for Calendar Grid View
        const tableHeaders = ['Employee Name', ...daysArray.map(String)];
        
        const tableBody = employees.map(emp => {
        const row = [emp.name];
        daysArray.forEach(day => {
          const date = new Date(selectedYear, selectedMonth, day);
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          
          if (isWeekend) {
            row.push('W');
            return;
          }
          
          const log = logsByEmpAndDay[emp.id]?.[day];
          if (!log) {
            row.push(date > today ? '-' : 'A');
          } else if (log.exception_flag === 'absent' || !log.clock_in) {
            row.push('A');
          } else if (log.exception_flag === 'late') {
            row.push('L');
          } else {
            row.push('P');
          }
        });
        return row;
      });

        // Calendar Grid specific table configuration
        autoTable(doc, {
          startY: 110,
          head: [tableHeaders],
          body: tableBody,
          theme: 'plain',
          styles: { font: 'helvetica', cellPadding: { top: 8, bottom: 8, left: 4, right: 4 }, lineColor: [226, 232, 240], lineWidth: { bottom: 0.5 }, minCellHeight: 28 },
          headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontSize: 8, fontStyle: 'bold', halign: 'center', valign: 'middle', lineWidth: { top: 0.5, bottom: 0.5 }, lineColor: [203, 213, 225] },
          bodyStyles: { fontSize: 8, halign: 'center', valign: 'middle', textColor: [71, 85, 105] },
          columnStyles: { 0: { halign: 'left', cellWidth: 140, fontStyle: 'bold', textColor: [15, 23, 42], cellPadding: { left: 12, top: 8, bottom: 8 } } },
          didParseCell: function (data) {
            if (data.section === 'body' && data.column.index > 0) {
              const value = data.cell.raw;
              if (value === 'P') { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold'; }
              else if (value === 'A') { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
              else if (value === 'L') { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = 'bold'; }
              else if (value === 'W') { data.cell.styles.textColor = [148, 163, 184]; data.cell.styles.fillColor = [248, 250, 252]; }
            }
          },
          margin: { top: 110, left: 30, right: 30 }
        });
      } // End of Calendar Grid Branch

      // Add Legend & Footer at the bottom of the last page
      const finalY = doc.lastAutoTable?.finalY || 110;
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      if (viewMode === 'calendar') {
        doc.text('Legend: P = Present  |  A = Absent  |  L = Late  |  W = Weekend  |  - = Future/No Data', 30, finalY + 30);
      }
      
      // Page numbering footer
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
      }

      doc.save(`Attendance_Report_${monthName}_${selectedYear}.pdf`);
    };
    
    // Fallback if image fails to load
    img.onerror = () => {
      notify('Failed to load logo, proceeding with standard PDF.', 'warning');
      doc.save(`Attendance_Report_${monthName}_${selectedYear}.pdf`);
    };
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Attendance Register</h1>
          <p>Review presence registers, oversee shifts schedule swap requests, and approve missed-punch overrides.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', alignItems: 'center' }}>
              <select value={selectedMonth} onChange={(e) => { setSelectedMonth(Number(e.target.value)); setCurrentPage(1); }} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '4px' }}>
                {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
              </select>
              <select value={selectedYear} onChange={(e) => { setSelectedYear(Number(e.target.value)); setCurrentPage(1); }} style={{ backgroundColor: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', fontSize: '13px', fontWeight: '600', cursor: 'pointer', padding: '4px' }}>
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            
            <button 
              className="print-btn" 
              onClick={handleDownloadPDF}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: '600', fontSize: '13px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}
            >
              <Download size={16} /> Download PDF
            </button>

            <div style={{ display: 'flex', gap: '4px', border: '1px solid var(--border-color)', padding: '4px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)' }}>
              <button 
                onClick={() => { setViewMode('list'); setCurrentPage(1); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: viewMode === 'list' ? 'var(--bg-tertiary)' : 'transparent', color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
              >
                <List size={16} /> List View
              </button>
              <button 
                onClick={() => { setViewMode('calendar'); setCurrentPage(1); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: viewMode === 'calendar' ? 'var(--bg-tertiary)' : 'transparent', color: viewMode === 'calendar' ? 'var(--text-primary)' : 'var(--text-muted)', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}
              >
                <Calendar size={16} /> Calendar Grid
              </button>
            </div>
          </div>
          {activeCorrections.length > 0 && (
            <button 
              className="print-btn" 
              onClick={() => setIsRequestOpen(true)}
              style={{ 
                position: 'relative',
                backgroundColor: 'var(--accent-pink)',
                color: '#fff',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-sm)',
                fontWeight: '600'
              }}
            >
              <span>🔔 Regularization Requests</span>
              <span style={{ 
                backgroundColor: '#fff', 
                color: 'var(--accent-pink)', 
                borderRadius: '50%', 
                width: '18px', 
                height: '18px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '11px', 
                fontWeight: 'bold' 
              }}>
                {activeCorrections.length}
              </span>
            </button>
          )}
        </div>
      </div>

      <div style={{ width: '100%' }}>
        {/* Attendance Register */}
        {/* Attendance Views */}
        {viewMode === 'list' ? (
          <div className="table-container" style={{ margin: 0, overflowX: 'auto', width: '100%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Employee Name</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Punch Date</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Clock In Time</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Clock Out Time</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Work Mode</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log, idx) => {
                  const emp = employees.find(e => String(e.id) === String(log.user_id)) || { name: 'Unknown' };
                  return (
                    <tr key={log.id} style={{ transition: 'background-color 0.2s', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', objectFit: 'cover' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{emp.name}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{emp.emp_id || 'NSG-EMP'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '14px' }}>{new Date(log.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '14px', fontWeight: '500' }}>{log.clock_in ? new Date(log.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Missed</span>}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '14px', fontWeight: '500' }}>{log.clock_out ? new Date(log.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : <span style={{ color: '#ef4444', backgroundColor: '#fef2f2', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>Missed</span>}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600', backgroundColor: log.work_mode === 'wfh' ? '#f0fdf4' : '#eff6ff', color: log.work_mode === 'wfh' ? '#166534' : '#1d4ed8', border: `1px solid ${log.work_mode === 'wfh' ? '#bbf7d0' : '#bfdbfe'}` }}>
                          {log.work_mode === 'wfh' ? 'WFH' : 'Office'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {/* List Pagination */}
            {totalLogPages > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>Page {currentPage} of {totalLogPages}</span>
                <button disabled={currentPage === totalLogPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ padding: '8px', borderRadius: '50%', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', cursor: currentPage === totalLogPages ? 'not-allowed' : 'pointer', color: currentPage === totalLogPages ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div id="calendar-grid-container" className="table-container" style={{ margin: 0, width: '100%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', position: 'relative' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '15px' }}>{new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} Overview</h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22c55e', borderRadius: '2px' }}></div> Present</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '2px' }}></div> Absent</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid #eab308', borderRadius: '2px' }}></div> Late</span>
              </div>
            </div>
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', position: 'sticky', top: 0, left: 0, backgroundColor: 'var(--bg-primary)', zIndex: 30, minWidth: '250px', maxWidth: '250px', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', boxShadow: '2px 2px 4px rgba(0,0,0,0.02)' }}>Employee Name</th>
                  {daysArray.map(day => (
                    <th key={day} style={{ padding: '12px 0', minWidth: '36px', position: 'sticky', top: 0, backgroundColor: 'var(--bg-primary)', zIndex: 20, textAlign: 'center', fontSize: '12px', borderBottom: '1px solid var(--border-color)' }}>
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentEmployees.map((emp, idx) => (
                  <tr key={emp.id} style={{ transition: 'background-color 0.2s', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafafa' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#fafafa'}>
                    <td style={{ padding: '12px 16px', position: 'sticky', left: 0, backgroundColor: 'inherit', zIndex: 10, borderRight: '1px solid var(--border-color)', borderBottom: '1px solid #f1f5f9', minWidth: '250px', maxWidth: '250px', boxShadow: '2px 0 4px rgba(0,0,0,0.02)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                        <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} alt={emp.name} style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', objectFit: 'cover' }}  />
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                          <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.name}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.emp_id || 'NSG-EMP'}</span>
                        </div>
                      </div>
                    </td>
                    {daysArray.map(day => (
                      <td key={day} style={{ borderBottom: '1px solid #f1f5f9', padding: '8px 4px', verticalAlign: 'middle' }}>
                        {renderCalendarCell(emp.id, day)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            {/* Grid Pagination */}
            {totalPages > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px', borderTop: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#94a3b8' : '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
            <style>{`
              .hover-scale:hover { transform: scale(1.1); box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important; z-index: 20; position: relative; }
            `}</style>
          </div>
        )}
      </div>

      {/* 🔔 REGULARIZATION REQUESTS DETAILS POPUP MODAL */}
      {isRequestOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div className="card" style={{ width: '520px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} /> Regularization Override Requests
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => { setIsRequestOpen(false); setDenyingId(null); setDenyComment(''); }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeCorrections.map(c => {
                const emp = employees.find(e => e.id === c.user_id) || { name: 'Unknown', designation: 'Employee' };
                return (
                  <div key={c.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{emp.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.designation}</div>
                      </div>
                      <span className="badge-pill bg-pink" style={{ fontSize: '10px' }}>Date: {c.correction_date}</span>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '6px' }}>
                      <div><strong>Requested Clock In:</strong> {new Date(c.requested_clock_in).toLocaleTimeString()}</div>
                      <div><strong>Requested Clock Out:</strong> {new Date(c.requested_clock_out).toLocaleTimeString()}</div>
                      <div style={{ marginTop: '4px' }}><strong>Reason:</strong> <span style={{ fontStyle: 'italic', color: 'var(--accent-gold)' }}>"{c.reason}"</span></div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      {denyingId === c.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Denial Reason Comment</label>
                          <textarea 
                            value={denyComment} 
                            onChange={(e) => setDenyComment(e.target.value)} 
                            placeholder="Please provide the reason for denying this request..." 
                            required
                            style={{ width: '100%', minHeight: '60px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px', outline: 'none', resize: 'vertical' }}
                          />
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button" 
                              onClick={() => setDenyingId(null)} 
                              className="print-btn"
                              style={{ padding: '6px 12px', fontSize: '11px' }}
                            >
                              Cancel
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleDenyCorrection(c.id)} 
                              className="print-btn"
                              style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}
                            >
                              Send Denial &amp; Comment
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button 
                            className="print-btn"
                            style={{ padding: '6px 12px', fontSize: '11.5px', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                            onClick={() => { setDenyingId(c.id); setDenyComment(''); }}
                          >
                            Deny with Comment
                          </button>
                          <button 
                            className="print-btn"
                            style={{ padding: '6px 12px', fontSize: '11.5px', backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none' }}
                            onClick={() => {
                              handleApproveCorrection(c.id);
                              if (activeCorrections.length <= 1) {
                                setIsRequestOpen(false);
                              }
                            }}
                          >
                            Approve Swipe
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
              <button className="print-btn" onClick={() => { setIsRequestOpen(false); setDenyingId(null); setDenyComment(''); }}>Close View</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
