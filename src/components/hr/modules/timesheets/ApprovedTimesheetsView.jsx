import React, { useState, useEffect } from 'react';
import { FileCheck2, CalendarDays, Check, Filter, FileText, X, Eye, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './approvedTimesheets.module.css';
import '../../../employee/pagination.css'; 
import ManageApprovals from './ManageApprovals';

export function ApprovedTimesheetsView() {
  const [timesheets, setTimesheets] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isManagingApprovals, setIsManagingApprovals] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Date defaults
  const today = new Date();
  const initialYear = today.getFullYear();
  const initialMonth = today.getMonth() + 1;
  const initialWeek = 0; // Start with 'All Weeks'

  // Filter states
  const [filterYear, setFilterYear] = useState(initialYear);
  const [filterMonth, setFilterMonth] = useState(initialMonth);
  const [filterWeek, setFilterWeek] = useState(initialWeek);
  const [filterDate, setFilterDate] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('All');
  const [filterTL, setFilterTL] = useState('All');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchApprovedTimesheets = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      // Adding filters to the HR endpoint is ideal, but for now we can filter client-side 
      // or implement the same query params on the backend if needed. 
      // Since we didn't add year/month/week to the HR endpoint in the backend implementation,
      // we'll fetch all and filter client side for now, or fetch all.
      // Actually, wait, let me just fetch all and filter in JS to avoid backend changes again.
      // In a real app we'd add params.
      const res = await fetch('/api/hr-portal/timesheets/approved', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setTimesheets(await res.json());
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchApprovedTimesheets();
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role || null);
      }
    } catch (e) { console.error(e); }
  }, []);

  const isCEO = window.location.hash.toLowerCase().includes('/ceo/');

  // Extract dynamic unique names
  const uniqueEmployees = [...new Set(timesheets.map(ts => ts.employee_name))].sort();
  const uniqueTLs = [...new Set(timesheets.map(ts => ts.approved_by_name))].sort();

  // Client-side date filtering based on selected Year/Month/Week
  const filteredTimesheets = timesheets.filter(ts => {
    const tsDate = new Date(ts.date);
    const tsYear = tsDate.getFullYear();
    const tsMonth = tsDate.getMonth() + 1;
    const tsWeek = Math.ceil(tsDate.getDate() / 7);

    // If specific date is selected, override week/month/year
    if (filterDate && ts.date !== filterDate) return false;
    
    // Fallback to standard filters if no specific date is selected
    if (!filterDate) {
      if (filterYear && tsYear !== filterYear) return false;
      if (filterMonth && tsMonth !== filterMonth) return false;
      if (filterWeek && filterWeek > 0 && tsWeek !== filterWeek) return false;
    }

    if (filterEmployee !== 'All' && ts.employee_name !== filterEmployee) return false;
    if (filterTL !== 'All' && ts.approved_by_name !== filterTL) return false;

    return true;
  });

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [filterYear, filterMonth, filterWeek, filterDate, filterEmployee, filterTL]);

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
        // Calculate Logo Aspect Ratio to prevent stretching
        const imgRatio = img.width / img.height;
        const logoHeight = 45;
        const logoWidth = logoHeight * imgRatio;
        doc.addImage(img, 'PNG', 40, 25, logoWidth, logoHeight);
      } catch (e) {
        // Fallback if image fails to load
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
      if (filterEmployee !== 'All') filterText += `Employee: ${filterEmployee} | `;
      if (filterTL !== 'All') filterText += `TL: ${filterTL}`;
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(filterText.replace(/ \| $/, ''), 40, 85);

      // Table Data
      const tableColumn = ["Employee", "Date", "Project", "Task", "Hours", "Approved By"];
      const tableRows = [];

      filteredTimesheets.forEach(log => {
        const rowData = [
          log.employee_name,
          log.date,
          log.project,
          log.task,
          `${log.hours}h`,
          `${log.approved_by_name}\n(${log.approved_by_role === 'tl' ? 'Team Lead' : log.approved_by_role === 'hr' ? 'HR' : log.approved_by_role === 'ceo' ? 'CEO' : 'Role Unknown'})`
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
          // Footer
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
        }
      });

      doc.save(`Approved_Timesheets_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    img.onload = renderPDF;
    img.onerror = renderPDF; // Render anyway if image fails
  };

  if (isManagingApprovals) {
    return <ManageApprovals onBack={() => {
      setIsManagingApprovals(false);
      fetchApprovedTimesheets(); // Refresh main list after returning
    }} />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainContent}>
        <div className={styles.card}>
          <div className={styles.cardHeader} style={{flexDirection: 'column', alignItems: 'stretch', gap: '24px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h2 className={styles.cardTitle}>Approved Timesheets Master Log</h2>
              <div style={{display: 'flex', gap: '12px'}}>
                {!isCEO && (
                  <button 
                    className={styles.downloadButton} 
                    style={{background: 'white', color: '#ec4899', border: '1px solid #ec4899'}}
                    onClick={() => setIsManagingApprovals(true)}
                  >
                    <Check size={16} /> Manage Approvals
                  </button>
                )}
                <button className={styles.downloadButton} onClick={exportToPDF}>
                  <Download size={16} /> Download PDF
                </button>
              </div>
            </div>
            
            <div className={styles.filterBar}>
              <div className={styles.filterGroup}>
                <Filter size={18} color="#94a3b8" />
                <span style={{fontSize: '13px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em'}}>Filters</span>
              </div>
              
              <div style={{display: 'flex', gap: '8px', flexWrap: 'nowrap', flex: 1}}>
                <input 
                  type="date"
                  className={styles.filterSelect}
                  style={{flexShrink: 0}}
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  title="Filter by specific date"
                />

                <select 
                  className={styles.filterSelect}
                  style={{flexShrink: 0}}
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
                  className={styles.filterSelect}
                  style={{flexShrink: 0}}
                  value={filterMonth} 
                  onChange={e => setFilterMonth(parseInt(e.target.value))}
                  disabled={!!filterDate}
                >
                  <option value={0}>All Months</option>
                  <option value={1}>January</option><option value={2}>February</option>
                  <option value={3}>March</option><option value={4}>April</option>
                  <option value={5}>May</option><option value={6}>June</option>
                  <option value={7}>July</option><option value={8}>August</option>
                  <option value={9}>September</option><option value={10}>October</option>
                  <option value={11}>November</option><option value={12}>December</option>
                </select>

                <select 
                  className={styles.filterSelect}
                  style={{flexShrink: 0}}
                  value={filterYear} 
                  onChange={e => setFilterYear(parseInt(e.target.value))}
                  disabled={!!filterDate}
                >
                  <option value={0}>All Years</option>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select 
                  className={styles.filterSelect}
                  style={{flexShrink: 0}}
                  value={filterEmployee}
                  onChange={e => setFilterEmployee(e.target.value)}
                >
                  <option value="All">All Employees</option>
                  {uniqueEmployees.map(emp => <option key={emp} value={emp}>{emp}</option>)}
                </select>

                <select 
                  className={styles.filterSelect}
                  style={{flexShrink: 0}}
                  value={filterTL}
                  onChange={e => setFilterTL(e.target.value)}
                >
                  <option value="All">All Approvers</option>
                  {uniqueTLs.map(tl => <option key={tl} value={tl}>{tl}</option>)}
                </select>
              </div>
            </div>
          </div>
          
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{width: '20%'}}>Employee</th>
                  <th style={{width: '15%'}}>Date</th>
                  <th style={{width: '15%'}}>Project</th>
                  <th style={{width: '20%'}}>Task</th>
                  <th style={{width: '10%', textAlign: 'center'}}>Hours</th>
                  <th style={{width: '10%', textAlign: 'center'}}>Approved By</th>
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
                      <span className={styles.hoursBadge}>{log.hours}h</span>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <span className={styles.tlBadge} style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px'}} title="Approver">
                        <div style={{display: 'flex', alignItems: 'center', gap: '4px'}}>
                          <Check size={14} color="#10b981" />
                          <span>{log.approved_by_name}</span>
                        </div>
                        {log.approved_by_role === 'tl' && <div style={{fontSize: '10.5px', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em'}}>(Team Lead)</div>}
                        {log.approved_by_role === 'hr' && <div style={{fontSize: '10.5px', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em'}}>(HR)</div>}
                        {log.approved_by_role === 'ceo' && <div style={{fontSize: '10.5px', color: '#64748b', fontWeight: 600, letterSpacing: '0.02em'}}>(CEO)</div>}
                      </span>
                    </td>
                    <td style={{textAlign: 'center'}}>
                      <button className={styles.viewButton} onClick={() => setSelectedLog(log)}>
                        <Eye size={16} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTimesheets.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
                      <div style={{display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', marginBottom: '16px'}}>
                        <FileCheck2 size={32} color="#94a3b8" />
                      </div>
                      <div style={{color: '#0f172a', fontSize: '18px', fontWeight: 700}}>No Approved Timesheets</div>
                      <div style={{marginTop: '8px'}}>There are no approved timesheets matching your filter criteria.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredTimesheets.length > 0 && (
            <div className="pagination-container" style={{ borderTop: 'none', padding: '0 32px 24px 32px' }}>
              <div className="pagination-info">
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
      </div>

      {/* View Timesheet Modal */}
      {selectedLog && (
        <div className={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Timesheet Details</h3>
              <button className={styles.closeButton} onClick={() => setSelectedLog(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Employee</span>
                  <span className={styles.infoValue} style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                    <div className={styles.avatar} style={{width: '24px', height: '24px', fontSize: '10px'}}>
                      {selectedLog.employee_name.charAt(0).toUpperCase()}
                    </div>
                    {selectedLog.employee_name}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Date</span>
                  <span className={styles.infoValue}>{selectedLog.date}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Project</span>
                  <span className={styles.infoValue}>{selectedLog.project}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Hours Logged</span>
                  <span className={styles.infoValue} style={{color: '#059669'}}>{selectedLog.hours}h</span>
                </div>
                <div className={styles.infoItem} style={{gridColumn: '1 / -1'}}>
                  <span className={styles.infoLabel}>Task Name</span>
                  <span className={styles.infoValue}>{selectedLog.task}</span>
                </div>
              </div>

              <div className={styles.descBlock}>
                <div className={styles.descTitle}>
                  <FileText size={18} color="#3b82f6"/> Full Description
                </div>
                <p className={styles.descText}>
                  {selectedLog.description}
                </p>
              </div>
              
              <div style={{marginTop: '8px', paddingTop: '24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <span className={styles.infoLabel}>Approved By</span>
                <span className={styles.tlBadge} style={{margin: 0}}>
                  <Check size={14} color="#10b981" style={{marginRight: '4px', verticalAlign: 'middle'}}/>
                  {selectedLog.approved_by_name}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
