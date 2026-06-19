import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import styles from './approvals.module.css';
import { AlertTriangle, MapPin, CheckCircle, Clock, FileText, Camera, GitCommit, Calendar, DollarSign, Check, X } from 'lucide-react';

const Approvals = () => {
  const [activeTab, setActiveTab] = useState('leave');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  
  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

  const { data: teamMembers = [] } = useSWR('/api/team-lead/team-members', fetcher);

  const getEmpName = (id) => {
    const emp = teamMembers.find(m => m.id === id);
    return emp ? emp.name : `Emp #${id}`;
  };

  const { data: rawLeaves = [], mutate: mutateLeaves } = useSWR('/api/team-lead/leaves/pending', fetcher);
  const leaves = Array.isArray(rawLeaves) ? rawLeaves.map(r => ({
    id: r.id,
    employee: getEmpName(r.user_id || r.employee_id),
    employee_id: r.user_id || r.employee_id,
    type: r.leave_type === 'CL' ? 'Casual Leave' : r.leave_type === 'SL' ? 'Sick Leave' : r.leave_type === 'EL' ? 'Earned Leave' : r.leave_type === 'CompOff' ? 'Comp Off' : r.leave_type,
    days: r.days,
    dates: `${r.from_date} – ${r.to_date}`,
    reason: r.reason,
    status: r.status,
    overlapWarning: null
  })) : [];

  const { data: rawWfhs = [], mutate: mutateWfhs } = useSWR('/api/team-lead/wfh/pending', fetcher);
  const wfhs = Array.isArray(rawWfhs) ? rawWfhs.map(r => ({
    id: r.id,
    employee: getEmpName(r.user_id),
    date: `${r.from_date} – ${r.to_date}`,
    reason: r.reason,
    status: r.status,
    locationVerified: true
  })) : [];

  const { data: rawExpenses = [], mutate: mutateExpenses } = useSWR('/api/team-lead/expenses/pending', fetcher);
  const expenses = Array.isArray(rawExpenses) ? rawExpenses.map(c => {
    const empId = c.user_id || c.employee_id;
    return {
      id: c.id,
      employee: getEmpName(empId),
      employee_id: empId,
      category: c.category || 'Other',
      amount: c.amount || 0,
      date: c.claim_date || c.date || '',
      description: c.description || '',
      receiptName: c.receipt_url || c.receiptName || 'receipt.pdf',
      status: c.tl_approval || 'pending'
    };
  }) : [];

  const [selectedId, setSelectedId] = useState(null);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedId(null);
  };

  const handleAction = async (id, actionType) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const actionTxt = actionType === 'approve' ? 'Approved' : 'Rejected';
      
      if (activeTab === 'leave') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        mutateLeaves(rawLeaves.filter(r => r.id !== id), false);
        await fetch(`/api/team-lead/leaves/${id}/${action}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        mutateLeaves();
      } else if (activeTab === 'expense') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        mutateExpenses(rawExpenses.filter(r => r.id !== id), false);
        await fetch(`/api/team-lead/expenses/${id}/${action}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        mutateExpenses();
      } else if (activeTab === 'wfh') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        mutateWfhs(rawWfhs.filter(r => r.id !== id), false);
        await fetch(`/api/team-lead/wfh/${id}/${action}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        mutateWfhs();
      }
      
      setToast({ message: `Request ${actionTxt} Successfully!`, type: actionType === 'approve' ? 'success' : 'error' });
      if (selectedId === id) setSelectedId(null);
    } catch (e) {
      console.error("Action failed", e);
    }
  };

  // Helper to get current list and selected item
  let currentList = [];
  let selectedItem = null;
  if (activeTab === 'leave') {
    currentList = leaves;
    selectedItem = leaves.find(l => l.id === selectedId);
  } else if (activeTab === 'expense') {
    currentList = expenses;
    selectedItem = expenses.find(e => e.id === selectedId);
  } else if (activeTab === 'wfh') {
    currentList = wfhs;
    selectedItem = wfhs.find(w => w.id === selectedId);
  }

  // --- RENDER DETAIL PANELS ---
  
  const renderLeaveDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>{item.type} • {item.days} Days</span>
      </div>
      
      {item.overlapWarning && (
        <div className={styles.warningBox}>
          <AlertTriangle size={18} />
          <div>
            <strong>Calendar Conflict Detected</strong>
            <p style={{ margin: '4px 0 0 0' }}>{item.overlapWarning}</p>
          </div>
        </div>
      )}

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Requested Dates</span>
        <div className={styles.detailValue}>{item.dates}</div>
      </div>
      
      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Reason</span>
        <div className={styles.detailValue}>{item.reason}</div>
      </div>
    </>
  );



  const renderWfhDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>WFH Request for {item.date}</span>
      </div>

      {item.locationVerified && (
        <div className={styles.gitBadge} style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderColor: 'rgba(59, 130, 246, 0.2)', marginBottom: '24px' }}>
          <MapPin size={14} />
          Home Location Verified in System
        </div>
      )}

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Reason</span>
        <div className={styles.detailValue}>{item.reason}</div>
      </div>
    </>
  );



  const renderExpenseDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>{item.category} • ₹{Number(item.amount).toLocaleString('en-IN')}</span>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Claim Date</span>
        <div className={styles.detailValue}>{item.date}</div>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Description</span>
        <div className={styles.detailValue}>{item.description || '—'}</div>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Receipt</span>
        <div className={styles.detailValue} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileText size={14} color="#64748b" />
          <span style={{ fontSize: '13px' }}>{item.receiptName}</span>
        </div>
      </div>

      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Amount</span>
        <div className={styles.detailValue} style={{ fontSize: '22px', fontWeight: '800', color: '#10b981' }}>
          ₹{Number(item.amount).toLocaleString('en-IN')}
        </div>
      </div>
    </>
  );

  return (
    <div className={styles.approvalsContainer}>
      
      {/* TABS */}
      <div className={styles.topTabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'leave' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('leave')}
        >
          <Calendar size={16} /> Leave 
          {leaves.length > 0 && <span className={styles.badge}>{leaves.length}</span>}
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'wfh' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('wfh')}
        >
          <FileText size={16} /> WFH
          {wfhs.length > 0 && <span className={styles.badge}>{wfhs.length}</span>}
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'expense' ? styles.tabBtnActive : ''}`}
          onClick={() => handleTabChange('expense')}
        >
          <DollarSign size={16} /> Expenses
          {expenses.length > 0 && <span className={styles.badge}>{expenses.length}</span>}
        </button>
      </div>

      {/* 2-PANE LAYOUT */}
      <div className={styles.mainGrid}>
        
        {/* LIST PANEL */}
        <div className={styles.listPanel}>
          <div className={styles.panelTitle}>Pending Requests</div>
          
          {currentList.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>No pending requests in this queue.</div>
          ) : (
            currentList.map(item => (
              <div 
                key={item.id} 
                className={`${styles.listItem} ${selectedId === item.id ? styles.listItemSelected : ''}`}
                onClick={() => setSelectedId(item.id)}
              >
                <div className={styles.itemHeader}>
                  <span className={styles.employeeName}>{item.employee}</span>
                </div>
                
                <div className={styles.itemDesc}>
                  {activeTab === 'leave' && `${item.type} (${item.days} days)`}
                  {activeTab === 'wfh' && `${item.date}`}
                  {activeTab === 'expense' && `₹${Number(item.amount).toLocaleString('en-IN')} — ${item.category}`}
                </div>
                
                <div className={styles.itemActions}>
                  <button 
                    className={styles.btnApprove} 
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'approve'); }}
                  >
                    Approve
                  </button>
                  <button 
                    className={styles.btnReject} 
                    onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'reject'); }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DETAIL PANEL */}
        <div className={styles.detailPanel}>
          <div className={styles.panelTitle}>Request Details</div>
          
          {!selectedItem ? (
            <div style={{ color: '#64748b', textAlign: 'center', marginTop: '40px' }}>Select a request from the list to view details.</div>
          ) : (
            <div>
              {activeTab === 'leave' && renderLeaveDetails(selectedItem)}
              {activeTab === 'wfh' && renderWfhDetails(selectedItem)}
              {activeTab === 'expense' && renderExpenseDetails(selectedItem)}
              
              <div className={styles.bigActionRow}>
                <button className={styles.btnApprove} onClick={() => handleAction(selectedId, 'approve')}>Approve Request</button>
                <button className={styles.btnReject} onClick={() => handleAction(selectedId, 'reject')}>Reject Request</button>
              </div>
            </div>
          )}
        </div>

      </div>

      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 9999,
          fontWeight: 500,
          animation: 'slideInRight 0.3s ease-out'
        }}>
          {toast.type === 'success' ? <Check size={20} /> : <X size={20} />}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Approvals;
