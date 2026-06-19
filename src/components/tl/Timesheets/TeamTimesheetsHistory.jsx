import React, { useState, useEffect } from 'react';
import { CalendarDays, Filter, Download, CalendarCheck } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './teamHistory.module.css'; 
import '../../employee/pagination.css'; 

const TeamTimesheetsHistory = () => {
  const [timesheets, setTimesheets] = useState([]);
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
      const res = await fetch('/api/team-lead/team-members', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTeamMembers(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      let url = `/api/timesheets/tl-history?year=${filterYear}&month=${filterMonth}`;
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
    fetchHistory();
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

  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    
    const img = new Image();
    img.src = '/hmns-logo.png';
    
    const renderPDF = () => {
      // Premium White Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 110, 'F');
      
      try {
        const imgRatio = img.width / img.height;
        const logoHeight = 45;
        const logoWidth = logoHeight * imgRatio;
        doc.addImage(img, 'PNG', 40, 25, logoWidth, logoHeight);
      } catch (e) {
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text('HMNS Software Solution', 40, 50);
      }
      
      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(40, 100, doc.internal.pageSize.getWidth() - 40, 100);
      
      // Report Title
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.text('APPROVED TIMESHEETS MASTER LOG', doc.internal.pageSize.getWidth() - 40, 45, { align: 'right' });
      
      // Timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, 65, { align: 'right' });

      // Filter info
      let filterText = `Filters: `;
      if (filterDate) filterText += `Date: ${filterDate} | `;
      if (!filterDate) filterText += `Year: ${filterYear || 'All'}, Month: ${filterMonth || 'All'}, Week: ${filterWeek || 'All'} | `;
      
      const empName = teamMembers.find(e => e.id.toString() === filterEmployeeId)?.name || 'All';
      filterText += `Employee: ${empName}`;
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(filterText.replace(/ \| $/, ''), 40, 85);

      // Table Data
      const tableColumn = ["Employee", "Date", "Project", "Task", "Hours", "Status"];
      const tableRows = [];

      filteredTimesheets.forEach(log => {
        const rowData = [
          log.employee_name,
          log.date,
          log.project,
          log.task,
          `${log.hours}h`,
          'Approved'
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        startY: 120,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { 
          fillColor: [51, 65, 85], // slate-700
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          halign: 'left',
          valign: 'middle'
        },
        styles: { 
          fontSize: 10, 
          cellPadding: 8,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.5
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
        columnStyles: {
          4: { halign: 'center', textColor: [5, 150, 105], fontStyle: 'bold' } // Hours column green
        },
        margin: { top: 120, left: 40, right: 40, bottom: 40 },
        didDrawPage: function (data) {
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
        }
      });

      doc.save(`Team_Timesheets_History_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    img.onload = renderPDF;
    img.onerror = renderPDF; // Render anyway if image fails
  };

  return (
    <div className={styles.historyCard}>
      <div className={styles.historyHeader}>
        <div className={styles.titleRow}>
          <h2 className={styles.historyTitle}>Approved Timesheets History</h2>
          <button className={styles.downloadBtnPremium} onClick={exportToPDF}>
            <Download size={18} strokeWidth={2.5} /> Download PDF
          </button>
        </div>
        
        <div className={styles.filterPremiumBar}>
          <div className={styles.filterGroupLabel}>
            <Filter size={18} color="#94a3b8" /> Filters
          </div>
          
          <select 
            className={styles.premiumSelect}
            value={filterEmployeeId} 
            onChange={e => setFilterEmployeeId(e.target.value)}
          >
            <option value="">All Team Members</option>
            {teamMembers.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>

          <input 
            type="date"
            className={styles.premiumSelect}
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            title="Filter by specific date"
          />

          <select 
            className={styles.premiumSelect}
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
            className={styles.premiumSelect}
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
            className={styles.premiumSelect}
            value={filterYear} 
            onChange={e => setFilterYear(parseInt(e.target.value))}
            disabled={!!filterDate}
          >
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.premiumTable}>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Date</th>
              <th>Project</th>
              <th>Task</th>
              <th style={{textAlign: 'center'}}>Hours</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTimesheets.length > 0 ? paginatedTimesheets.map(log => (
              <tr key={log.id}>
                <td>
                  <div className={styles.empCell}>
                    <div className={styles.empAvatar}>
                      {log.employee_name ? log.employee_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className={styles.empName}>{log.employee_name}</div>
                  </div>
                </td>
                <td>
                  <span className={styles.datePill}><CalendarDays size={14} color="#64748b" /> {log.date}</span>
                </td>
                <td>
                  <div className={styles.projectText}>{log.project}</div>
                </td>
                <td>
                  <div className={styles.taskText} title={log.task}>{log.task}</div>
                </td>
                <td style={{textAlign: 'center'}}>
                  <span className={styles.hoursPill}>{log.hours}h</span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5">
                  <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>
                      <CalendarCheck size={36} />
                    </div>
                    <div className={styles.emptyText}>No approved timesheets found matching your filters.</div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {filteredTimesheets.length > 0 && (
        <div className="pagination-container" style={{ padding: '0 32px 32px' }}>
          <div className="pagination-info" style={{ color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredTimesheets.length)} of {filteredTimesheets.length} entries
          </div>
          <div className="pagination-controls">
            <button 
              className="page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
            >
              Previous
            </button>
            <div className="pagination-numbers">
              {Array.from({length: totalPages}, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  className={`page-btn ${currentPage === num ? 'active' : ''}`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              ))}
            </div>
            <button 
              className="page-btn"
              disabled={currentPage === Math.max(1, totalPages)}
              onClick={() => setCurrentPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamTimesheetsHistory;
