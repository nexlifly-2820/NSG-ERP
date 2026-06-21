import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCompany } from '../../../common/CompanyContext';

export function LeaveManagementView() {
  const { companyLogo } = useCompany();
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const empRes = await fetch('/api/hr-portal/employees', { headers });
      if(empRes.ok) setEmployees(await empRes.json());
      const reqRes = await fetch('/api/hr-portal/leaves/requests', { headers });
      if(reqRes.ok) setLeaveRequests(await reqRes.json());
      const balRes = await fetch('/api/hr-portal/leaves/balances', { headers });
      if(balRes.ok) setLeaveBalances(await balRes.json());
    } catch(e) { console.error(e); }
  };

  useEffect(() => { fetchData(); }, []);

  const isCEO = window.location.hash.toLowerCase().includes('/ceo/');

  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [denyingId, setDenyingId] = useState(null);
  const [denyComment, setDenyComment] = useState('');

  // History & Tabs State
  const [activeTab, setActiveTab] = useState('balances'); // 'balances' | 'history'
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  const [balancesPage, setBalancesPage] = useState(1);
  const balancesPerPage = 6;

  // CRUD States
  const [isApplyOnBehalfOpen, setIsApplyOnBehalfOpen] = useState(false);
  const [behalfEmpId, setBehalfEmpId] = useState('');
  const [behalfType, setBehalfType] = useState('CL');
  const [behalfFrom, setBehalfFrom] = useState('');
  const [behalfTo, setBehalfTo] = useState('');
  const [behalfDays, setBehalfDays] = useState('');
  const [behalfReason, setBehalfReason] = useState('');

  const [editingBalance, setEditingBalance] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [requestFilter, setRequestFilter] = useState('pending'); // pending | approved | denied | all

  const handleApplyOnBehalf = async (e) => {
    e.preventDefault();
    if (!behalfEmpId) return alert('Please select an employee.');
    const empId = Number(behalfEmpId);
    const daysCount = parseFloat(behalfDays) || 0;
    if (daysCount <= 0) return alert('Please specify a positive number of days.');
    
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/leaves/on-behalf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          employee_id: empId,
          leave_type: behalfType,
          from_date: behalfFrom,
          to_date: behalfTo,
          days: daysCount,
          reason: behalfReason
        })
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      setIsApplyOnBehalfOpen(false);
      setBehalfEmpId(''); setBehalfType('CL'); setBehalfFrom(''); setBehalfTo(''); setBehalfDays(''); setBehalfReason('');
      alert('Successfully applied and approved leave.');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleSaveBalanceAdjustment = async (e) => {
    e.preventDefault();
    if (!editingBalance) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/balances/${editingBalance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          CL: parseFloat(editingBalance.CL) || 0,
          SL: parseFloat(editingBalance.SL) || 0,
          EL: parseFloat(editingBalance.EL) || 0,
          Maternity: parseFloat(editingBalance.Maternity) || 0
        })
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      setEditingBalance(null);
      alert('Leave balances successfully adjusted.');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleSaveRequestEdit = async (e) => {
    e.preventDefault();
    if (!editingRequest) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/requests/${editingRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          leave_type: editingRequest.leave_type,
          from_date: editingRequest.from_date,
          to_date: editingRequest.to_date,
          days: parseFloat(editingRequest.days) || 0,
          reason: editingRequest.reason
        })
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      setEditingRequest(null);
      alert('Leave request successfully updated.');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleDeleteLeaveRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/requests/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      alert('Leave request deleted successfully.');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleApproveLeave = async (id) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/requests/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      alert('Leave request approved!');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const handleDenyLeave = async (id) => {
    if (!denyComment.trim()) return alert('Please specify a reason for denying this leave request.');
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/leaves/requests/${id}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ reason: denyComment })
      });
      if(!res.ok) throw new Error("Failed");
      await fetchData();
      alert('Leave request denied.');
      setDenyingId(null);
      setDenyComment('');
    } catch(e) { console.error(e); alert('Error'); }
  };

  const pendingRequests = leaveRequests.filter(r => r.status === 'pending');
  const displayedRequests = leaveRequests.filter(r => {
    if (requestFilter === 'pending') return r.status === 'pending';
    if (requestFilter === 'approved') return r.status === 'approved';
    if (requestFilter === 'denied') return r.status === 'rejected';
    return true; // 'all'
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const years = Array.from({ length: 5 }, (_, i) => today.getFullYear() - i);

  // History Filtering & Pagination
  const filteredHistory = leaveRequests.filter(r => {
    const from = new Date(r.from_date);
    const to = new Date(r.to_date);
    const filterStart = new Date(selectedYear, selectedMonth, 1);
    const filterEnd = new Date(selectedYear, selectedMonth + 1, 0);
    // Include if leave date range overlaps with the selected month
    return (from <= filterEnd && to >= filterStart);
  });

  const totalHistoryPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const currentHistoryLogs = filteredHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalBalancesPages = Math.ceil(leaveBalances.length / balancesPerPage);
  const currentBalances = leaveBalances.slice((balancesPage - 1) * balancesPerPage, balancesPage * balancesPerPage);

  const handleDownloadPDF = () => {
    alert('Generating Leave History PDF report...');
    
    const doc = new jsPDF('landscape', 'pt', 'a4');
    const monthName = new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long' });
    
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
      
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(40, 90, doc.internal.pageSize.getWidth() - 40, 90);
      
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.text('LEAVE HISTORY REPORT', doc.internal.pageSize.getWidth() - 40, 45, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.text(`Period: ${monthName} ${selectedYear}`, doc.internal.pageSize.getWidth() - 40, 65, { align: 'right' });
      doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, doc.internal.pageSize.getWidth() - 40, 80, { align: 'right' });

      const tableHeaders = ['Employee Name', 'Leave Type', 'Duration', 'Days', 'Reason', 'Status'];
      const tableBody = filteredHistory.map(log => {
        const emp = employees.find(e => String(e.id) === String(log.user_id)) || { name: 'Unknown' };
        const durationStr = `${new Date(log.from_date).toLocaleDateString('en-GB')} - ${new Date(log.to_date).toLocaleDateString('en-GB')}`;
        const statusStr = log.status === 'approved' ? 'Approved' : log.status === 'rejected' ? 'Rejected' : 'Pending';
        return [emp.name, log.leave_type, durationStr, log.days, log.reason, statusStr];
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
            if (val === 'Approved') { data.cell.styles.textColor = [22, 163, 74]; data.cell.styles.fontStyle = 'bold'; }
            else if (val === 'Rejected') { data.cell.styles.textColor = [220, 38, 38]; data.cell.styles.fontStyle = 'bold'; }
            else if (val === 'Pending') { data.cell.styles.textColor = [217, 119, 6]; data.cell.styles.fontStyle = 'bold'; }
          }
        },
        margin: { top: 110, left: 40, right: 40 }
      });

      const finalY = doc.lastAutoTable?.finalY || 110;
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.setFont('helvetica', 'normal');
      
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
      }

      doc.save(`Leave_History_${monthName}_${selectedYear}.pdf`);
    };
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Leave Management</h1>
          <p>Oversee company leave accruals policies, check team calendar overlapping alerts, and approve leaves.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {activeTab === 'history' && (
            <button 
              onClick={handleDownloadPDF}
              style={{
                backgroundColor: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px',
                fontWeight: '600', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '13px'
              }}
            >
              📥 Download PDF
            </button>
          )}

          {!isCEO && (
            <>
              <button 
                className="print-btn" 
                onClick={() => setIsApplyOnBehalfOpen(true)}
                style={{ 
                  backgroundColor: 'transparent',
                  color: 'var(--accent-pink)',
                  border: '1px dashed var(--accent-pink)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '600',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                ➕ Apply Leave (On Behalf)
              </button>

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
                  fontWeight: '600',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                <span>🔔 Manage Leave Requests</span>
                {pendingRequests.length > 0 && (
                  <span style={{ 
                    backgroundColor: '#fff', 
                    color: 'var(--accent-pink)', 
                    borderRadius: '50%', 
                    width: '20px', 
                    height: '20px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    flexShrink: 0
                  }}>
                    {pendingRequests.length}
                  </span>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', marginBottom: '24px', width: '100%' }}>
        <div style={{ display: 'inline-flex', backgroundColor: '#f1f5f9', borderRadius: '10px', padding: '4px', border: '1px solid #e2e8f0', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
          <button 
            onClick={() => setActiveTab('balances')}
            style={{
              backgroundColor: activeTab === 'balances' ? '#ffffff' : 'transparent',
              color: activeTab === 'balances' ? '#0f172a' : '#64748b',
              border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
              boxShadow: activeTab === 'balances' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            Balances
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setCurrentPage(1); }}
            style={{
              backgroundColor: activeTab === 'history' ? '#ffffff' : 'transparent',
              color: activeTab === 'history' ? '#0f172a' : '#64748b',
              border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px',
              boxShadow: activeTab === 'history' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s'
            }}
          >
            Leave History
          </button>
        </div>
      </div>

      <div style={{ width: '100%' }}>
        {/* Balances grid */}
        {activeTab === 'balances' ? (
          <div className="table-container" style={{ margin: 0, overflowX: 'auto', width: '100%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <div className="pipeline-title" style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)' }}>Staff Active Leave Balances</div>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Employee Name</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>CL Balance</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>SL Balance</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>EL Balance</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Maternity</th>
                  {!isCEO && (
                    <th style={{ padding: '16px 24px', textAlign: 'left', backgroundColor: 'var(--bg-primary)', color: '#64748b', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-color)' }}>Action</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {currentBalances.map((b, idx) => {
                  const emp = employees.find(e => e.id === b.user_id) || { name: 'Unknown' };
                  return (
                    <tr key={b.id} style={{ transition: 'background-color 0.2s', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = idx % 2 === 0 ? '#ffffff' : '#f8fafc'}>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', objectFit: 'cover' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600', fontSize: '14px', color: '#1e293b' }}>{emp.name}</span>
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>{emp.emp_id || 'NSG-EMP'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '14px', fontWeight: '500' }}>{b.CL}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '14px', fontWeight: '500' }}>{b.SL}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '14px', fontWeight: '500' }}>{b.EL}</td>
                      <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9', color: '#475569', fontSize: '14px', fontWeight: '500' }}>{b.Maternity}</td>
                      {!isCEO && (
                        <td style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
                          <button
                            onClick={() => { setEditingBalance({ ...b }); setIsApplyOnBehalfOpen(false); setIsRequestOpen(false); }}
                            style={{
                              background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--accent-pink)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-pink)'; e.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = 'var(--accent-pink)'; }}
                          >
                            ✏️ Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {/* Pagination Controls for Balances */}
            {totalBalancesPages > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px', borderTop: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                <button disabled={balancesPage === 1} onClick={() => setBalancesPage(balancesPage - 1)} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: balancesPage === 1 ? 'not-allowed' : 'pointer', color: balancesPage === 1 ? '#94a3b8' : '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Page {balancesPage} of {totalBalancesPages}</span>
                <button disabled={balancesPage === totalBalancesPages} onClick={() => setBalancesPage(balancesPage + 1)} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: balancesPage === totalBalancesPages ? 'not-allowed' : 'pointer', color: balancesPage === totalBalancesPages ? '#94a3b8' : '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="table-container" style={{ margin: 0, overflowX: 'auto', width: '100%', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', borderTopLeftRadius: '12px', borderTopRightRadius: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{new Date(selectedYear, selectedMonth).toLocaleString('default', { month: 'long', year: 'numeric' })} Leave History</h3>
              <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                <select value={selectedMonth} onChange={(e) => { setSelectedMonth(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}>
                  {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>
                <select value={selectedYear} onChange={(e) => { setSelectedYear(Number(e.target.value)); setCurrentPage(1); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee Name</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leave Type</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Days</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', color: '#64748b', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentHistoryLogs.length > 0 ? currentHistoryLogs.map((log, idx) => {
                  const emp = employees.find(e => String(e.id) === String(log.user_id)) || { name: 'Unknown' };
                  return (
                    <tr key={log.id} style={{ transition: 'all 0.2s', backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} alt={emp.name} style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', objectFit: 'cover' }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: '700', fontSize: '14px', color: '#0f172a' }}>{emp.name}</span>
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>{emp.emp_id || 'NSG-EMP'}</span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0', letterSpacing: '0.02em', display: 'inline-block' }}>
                          {log.leave_type}
                        </span>
                      </td>
                      <td style={{ padding: '20px 24px', color: '#334155', fontSize: '13px', fontWeight: '500', lineHeight: '1.5' }}>
                        <div><span style={{color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600'}}>From</span><br/>{new Date(log.from_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                        <div style={{marginTop: '4px'}}><span style={{color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600'}}>To</span><br/>{new Date(log.to_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                      </td>
                      <td style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: '13px', fontWeight: '700' }}>
                           {log.days}
                        </div>
                      </td>
                      <td style={{ padding: '20px 24px', color: '#475569', fontSize: '13px', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '500' }} title={log.reason}>{log.reason}</td>
                      <td style={{ padding: '20px 24px' }}>
                        <span style={{ padding: '6px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.03em', display: 'inline-flex', alignItems: 'center', gap: '6px',
                           backgroundColor: log.status === 'approved' ? '#ecfdf5' : log.status === 'rejected' ? '#fef2f2' : '#fffbeb', 
                           color: log.status === 'approved' ? '#059669' : log.status === 'rejected' ? '#dc2626' : '#d97706', 
                           border: `1px solid ${log.status === 'approved' ? '#a7f3d0' : log.status === 'rejected' ? '#fecaca' : '#fde68a'}` }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: log.status === 'approved' ? '#10b981' : log.status === 'rejected' ? '#ef4444' : '#f59e0b' }}></span>
                          {log.status === 'approved' ? 'Approved' : log.status === 'rejected' ? 'Rejected' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>No leave requests found for this month.</td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalHistoryPages > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px', borderTop: '1px solid var(--border-color)', backgroundColor: '#f8fafc' }}>
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#94a3b8' : '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Page {currentPage} of {totalHistoryPages}</span>
                <button disabled={currentPage === totalHistoryPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ padding: '8px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', cursor: currentPage === totalHistoryPages ? 'not-allowed' : 'pointer', color: currentPage === totalHistoryPages ? '#94a3b8' : '#0f172a', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ➕ APPLY LEAVE ON BEHALF MODAL */}
      {isApplyOnBehalfOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { setIsApplyOnBehalfOpen(false) } }}>
          <form 
            onSubmit={handleApplyOnBehalf} 
            className="card" 
            style={{ width: '480px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ➕ Apply Leave (On Behalf)
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setIsApplyOnBehalfOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Select Employee</label>
                <select 
                  value={behalfEmpId} 
                  onChange={(e) => setBehalfEmpId(e.target.value)} 
                  required 
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="">-- Choose Staff member --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.emp_id} - {emp.department})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Leave Type</label>
                  <select 
                    value={behalfType} 
                    onChange={(e) => setBehalfType(e.target.value)} 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                  >
                    <option value="CL">Casual Leave (CL)</option>
                    <option value="SL">Sick Leave (SL)</option>
                    <option value="EL">Earned Leave (EL)</option>
                    <option value="Maternity">Maternity Leave</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Leave Duration (Days)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    max="30" 
                    value={behalfDays} 
                    onChange={(e) => setBehalfDays(e.target.value)} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>From Date</label>
                  <input 
                    type="date" 
                    value={behalfFrom} 
                    onChange={(e) => setBehalfFrom(e.target.value)} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>To Date</label>
                  <input 
                    type="date" 
                    value={behalfTo} 
                    onChange={(e) => setBehalfTo(e.target.value)} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Reason / Description</label>
                <textarea 
                  value={behalfReason} 
                  onChange={(e) => setBehalfReason(e.target.value)} 
                  required 
                  placeholder="Reason for leave submission..." 
                  style={{ width: '100%', minHeight: '60px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none', resize: 'vertical' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setIsApplyOnBehalfOpen(false)}>Cancel</button>
              <button 
                type="submit"
                style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Submit &amp; Auto-Approve
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ✏️ EDIT LEAVE BALANCES MODAL */}
      {editingBalance && (() => {
        const emp = employees.find(e => e.id === editingBalance.user_id) || { name: 'Employee' };
        return (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
            <form 
              onSubmit={handleSaveBalanceAdjustment} 
              className="card" 
              style={{ width: '460px', backgroundColor: '#ffffff', border: 'none', padding: '0', borderRadius: '16px', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}
            >
              <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>✏️</span> Adjust Leave Balances
                </h3>
                <button type="button" style={{ background: '#e2e8f0', border: 'none', color: '#64748b', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', transition: 'background 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#cbd5e1'} onMouseLeave={(e) => e.target.style.background = '#e2e8f0'} onClick={() => setEditingBalance(null)}>✕</button>
              </div>

              <div style={{ padding: '24px' }}>
                <div style={{ fontSize: '14px', color: '#475569', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-pink)' }}></div>
                  Adjusting balances for: <strong style={{ color: '#0f172a' }}>{emp.name}</strong>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Casual Leave (CL)</label>
                    <input 
                      type="number" step="0.5" min="0" value={editingBalance.CL} 
                      onChange={(e) => setEditingBalance({ ...editingBalance, CL: e.target.value })} required 
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Sick Leave (SL)</label>
                    <input 
                      type="number" step="0.5" min="0" value={editingBalance.SL} 
                      onChange={(e) => setEditingBalance({ ...editingBalance, SL: e.target.value })} required 
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Earned Leave (EL)</label>
                    <input 
                      type="number" step="0.5" min="0" value={editingBalance.EL} 
                      onChange={(e) => setEditingBalance({ ...editingBalance, EL: e.target.value })} required 
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s' }} 
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>Maternity</label>
                    <input 
                      type="number" step="1" min="0" value={editingBalance.Maternity} 
                      onChange={(e) => setEditingBalance({ ...editingBalance, Maternity: e.target.value })} required 
                      style={{ width: '100%', boxSizing: 'border-box', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', padding: '10px 14px', borderRadius: '8px', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s' }} 
                    />
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" style={{ background: '#ffffff', border: '1px solid #cbd5e1', color: '#475569', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'} onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'} onClick={() => setEditingBalance(null)}>Cancel</button>
                <button 
                  type="submit"
                  style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(236, 72, 153, 0.2)', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => { e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 6px 8px -1px rgba(236, 72, 153, 0.3)'; }}
                  onMouseLeave={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 6px -1px rgba(236, 72, 153, 0.2)'; }}
                >
                  Save Corrections
                </button>
              </div>
            </form>
          </div>
        );
      })()}

      {/* ✏️ EDIT LEAVE REQUEST MODAL */}
      {editingRequest && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200 }} onClick={(e) => { if (e.target === e.currentTarget) { setEditingRequest(null) } }}>
          <form 
            onSubmit={handleSaveRequestEdit} 
            className="card" 
            style={{ width: '440px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)' }}>
                ✏️ Edit Leave Request
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setEditingRequest(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Leave Type</label>
                  <select 
                    value={editingRequest.leave_type} 
                    onChange={(e) => setEditingRequest({ ...editingRequest, leave_type: e.target.value })} 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }}
                  >
                    <option value="CL">CL</option>
                    <option value="SL">SL</option>
                    <option value="EL">EL</option>
                    <option value="Maternity">Maternity</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Duration (Days)</label>
                  <input 
                    type="number" 
                    step="0.5" 
                    min="0.5" 
                    value={editingRequest.days} 
                    onChange={(e) => setEditingRequest({ ...editingRequest, days: parseFloat(e.target.value) || 0 })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>From Date</label>
                  <input 
                    type="date" 
                    value={editingRequest.from_date} 
                    onChange={(e) => setEditingRequest({ ...editingRequest, from_date: e.target.value })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>To Date</label>
                  <input 
                    type="date" 
                    value={editingRequest.to_date} 
                    onChange={(e) => setEditingRequest({ ...editingRequest, to_date: e.target.value })} 
                    required 
                    style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none' }} 
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '10.5px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Reason</label>
                <textarea 
                  value={editingRequest.reason} 
                  onChange={(e) => setEditingRequest({ ...editingRequest, reason: e.target.value })} 
                  required 
                  style={{ width: '100%', minHeight: '60px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px 10px', borderRadius: '6px', outline: 'none', resize: 'vertical' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setEditingRequest(null)}>Cancel</button>
              <button 
                type="submit"
                style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 🔔 LEAVE REQUESTS DETAILS POPUP MODAL */}
      {isRequestOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { { setIsRequestOpen(false); setDenyingId(null); setDenyComment(''); } } } }>
          <div className="card" style={{ width: '540px', maxHeight: '80vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={18} /> Leave Approval Requests
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => { setIsRequestOpen(false); setDenyingId(null); setDenyComment(''); }}>✕</button>
            </div>

            {/* Filter buttons */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              {[
                { id: 'pending', label: '⏳ Pending' },
                { id: 'approved', label: '✅ Approved' },
                { id: 'denied', label: '❌ Denied' },
                { id: 'all', label: '📂 All Logs' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { setRequestFilter(f.id); setDenyingId(null); }}
                  style={{
                    backgroundColor: requestFilter === f.id ? 'var(--accent-pink)' : 'var(--bg-primary)',
                    color: '#fff',
                    border: '1px solid var(--border-color)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {displayedRequests.map(r => {
                const emp = employees.find(e => e.id === r.user_id) || { name: 'Unknown', designation: 'Employee' };
                return (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{emp.name}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.designation}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span className="badge-pill" style={{ fontSize: '10.5px', padding: '3px 8px', borderRadius: '12px', fontWeight: 'bold', backgroundColor: 'rgba(236,72,153,0.1)', color: 'var(--accent-pink)' }}>Type: {r.leave_type}</span>
                        <span className="badge-pill" style={{ 
                          fontSize: '10.5px', 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontWeight: 'bold', 
                          backgroundColor: 
                            r.status === 'approved' ? 'rgba(16,185,129,0.1)' : 
                            r.status === 'rejected' ? 'rgba(239,68,68,0.1)' : 
                            'rgba(245,158,11,0.1)', 
                          color: 
                            r.status === 'approved' ? 'var(--accent-green)' : 
                            r.status === 'rejected' ? '#ef4444' : 
                            'var(--accent-gold)' 
                        }}>
                          {r.status === 'approved' ? '✅ Approved' : 
                           r.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                        </span>
                      </div>
                    </div>

                    <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', backgroundColor: 'var(--bg-primary)', padding: '10px', borderRadius: '6px' }}>
                      <div><strong>Duration:</strong> {r.days} days ({r.from_date} to {r.to_date})</div>
                      <div style={{ marginTop: '4px' }}><strong>Reason:</strong> <span style={{ fontStyle: 'italic', color: 'var(--accent-gold)' }}>"{r.reason}"</span></div>
                      {r.status === 'denied' && r.denial_reason && (
                        <div style={{ marginTop: '4px', color: '#ef4444' }}><strong>Denial Reason:</strong> {r.denial_reason}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                      {denyingId === r.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                          <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Denial Reason Comment</label>
                          <textarea 
                            value={denyComment} 
                            onChange={(e) => setDenyComment(e.target.value)} 
                            placeholder="Please provide the reason for denying this leave request..." 
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
                              onClick={() => handleDenyLeave(r.id)} 
                              className="print-btn"
                              style={{ backgroundColor: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', fontSize: '11px', fontWeight: 'bold' }}
                            >
                              Send Denial &amp; Comment
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                          {/* Left-side action: Edit & Delete */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => setEditingRequest({ ...r })}
                              style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Edit Details"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => handleDeleteLeaveRequest(r.id)}
                              style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="Void/Delete Request"
                            >
                              🗑️ {r.status === 'approved' ? 'Void' : 'Delete'}
                            </button>
                          </div>

                          {/* Right-side action: Approve/Deny (only for pending) */}
                          {(r.status === 'pending') && (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="print-btn"
                                style={{ padding: '6px 12px', fontSize: '11.5px', backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}
                                onClick={() => { setDenyingId(r.id); setDenyComment(''); }}
                              >
                                Deny
                              </button>
                              <button 
                                className="print-btn"
                                style={{ padding: '6px 12px', fontSize: '11.5px', backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none' }}
                                onClick={() => {
                                  handleApproveLeave(r.id);
                                }}
                              >
                                Approve
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              {displayedRequests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                  No leave requests found for this filter.
                </div>
              )}
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
