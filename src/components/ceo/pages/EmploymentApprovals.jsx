import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import styles from '../../tl/Approvals/approvals.module.css';
import { Calendar, FileText, HelpCircle, Home, Package, AlertTriangle, MapPin, Check, X, Clock } from 'lucide-react';

const EmploymentApprovals = () => {
  const [activeTab, setActiveTab] = useState('leave');
  const [toast, setToast] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedId(null);
  };

  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

  const { data: approvalsData = {}, mutate } = useSWR('/api/ceo-portal/approvals/pending', fetcher);
  const allLeaveRequests = Array.isArray(approvalsData.leaveRequests) ? approvalsData.leaveRequests : [];

  const handleAction = async (id, actionType) => {
    try {
      const actionTxt = actionType === 'approve' ? 'Approved' : 'Rejected';
      
      if (activeTab === 'leave' || activeTab === 'wfh') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        await fetch(`/api/ceo-portal/leaves/${id}/${action}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        mutate();
      } else if (activeTab === 'help' || activeTab === 'assets') {
        const action = actionType === 'approve' ? 'approve' : 'reject';
        await fetch(`/api/ceo-portal/tickets/${id}/${action}`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        mutate();
      }
      
      setToast({ message: `Request ${actionTxt} Successfully!`, type: actionType === 'approve' ? 'success' : 'error' });
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      console.error(err);
      setToast({ message: `Action failed`, type: 'error' });
    }
  };

  // Mock Data
  const leaves = allLeaveRequests.filter(l => l.leave_type !== 'WFH').map(l => ({
    id: l.id,
    employee: l.employee_name,
    type: l.leave_type === 'CL' ? 'Casual Leave' : l.leave_type === 'SL' ? 'Sick Leave' : l.leave_type === 'EL' ? 'Earned Leave' : l.leave_type === 'CompOff' ? 'Comp Off' : l.leave_type,
    days: l.days,
    dates: `${l.from_date} – ${l.to_date}`,
    reason: l.reason,
    status: l.status,
    overlapWarning: null
  }));

  const allHelpRequests = Array.isArray(approvalsData.helpRequests) ? approvalsData.helpRequests : [];
  const allAssetRequests = Array.isArray(approvalsData.assetRequests) ? approvalsData.assetRequests : [];

  const helpRequests = allHelpRequests.map(h => ({
    id: h.id,
    employee: h.employee_name,
    issueType: h.issue_type,
    description: h.description,
    date: h.created_at ? h.created_at.split('T')[0] : 'N/A'
  }));

  const wfhRequests = allLeaveRequests.filter(l => l.leave_type === 'WFH').map(l => ({
    id: l.id,
    employee: l.employee_name,
    fromDate: l.from_date,
    toDate: l.to_date,
    reason: l.reason,
    status: l.status
  }));

  const assetRequests = allAssetRequests.map(a => ({
    id: a.id,
    employee: a.employee_name,
    assetType: a.asset_type,
    reason: a.reason,
    cost: 'N/A'
  }));

  let currentList = [];
  let selectedItem = null;

  if (activeTab === 'leave') {
    currentList = leaves;
    selectedItem = leaves.find(l => l.id === selectedId);
  } else if (activeTab === 'help') {
    currentList = helpRequests;
    selectedItem = helpRequests.find(h => h.id === selectedId);
  } else if (activeTab === 'wfh') {
    currentList = wfhRequests;
    selectedItem = wfhRequests.find(r => r.id === selectedId);
  } else if (activeTab === 'assets') {
    currentList = assetRequests;
    selectedItem = assetRequests.find(a => a.id === selectedId);
  }

  // Details Renderers
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

  const renderHelpDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Help Request • {item.issueType}</span>
      </div>
      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Date Submitted</span>
        <div className={styles.detailValue}>{item.date}</div>
      </div>
      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Description</span>
        <div className={styles.detailValue}>{item.description}</div>
      </div>
    </>
  );

  const renderWfhDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#8b5cf6', fontSize: '14px', fontWeight: '600' }}>Work From Home Request</span>
      </div>
      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>From Date</span>
        <div className={styles.detailValue}>{item.fromDate}</div>
      </div>
      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>To Date</span>
        <div className={styles.detailValue}>{item.toDate}</div>
      </div>
      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Reason</span>
        <div className={styles.detailValue}>{item.reason}</div>
      </div>
    </>
  );

  const renderAssetDetails = (item) => (
    <>
      <div className={styles.detailHeader}>
        <h2 style={{ fontSize: '20px', margin: '0 0 8px 0', color: '#0f172a' }}>{item.employee}</h2>
        <span style={{ color: '#94a3b8', fontSize: '14px' }}>Asset Request • {item.assetType}</span>
      </div>
      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Estimated Cost</span>
        <div className={styles.detailValue} style={{ fontSize: '22px', fontWeight: '800', color: '#10b981' }}>{item.cost}</div>
      </div>
      <div className={styles.detailSection}>
        <span className={styles.detailLabel}>Reason / Justification</span>
        <div className={styles.detailValue}>{item.reason}</div>
      </div>
    </>
  );

  return (
    <div className={styles.approvalsContainer}>
      {/* TABS */}
      <div className={styles.topTabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'leave' ? styles.tabBtnActive : ''}`} onClick={() => handleTabChange('leave')}>
          <Calendar size={16} /> Leave {leaves.length > 0 && <span className={styles.badge}>{leaves.length}</span>}
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'help' ? styles.tabBtnActive : ''}`} onClick={() => handleTabChange('help')}>
          <HelpCircle size={16} /> Help {helpRequests.length > 0 && <span className={styles.badge}>{helpRequests.length}</span>}
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'wfh' ? styles.tabBtnActive : ''}`} onClick={() => handleTabChange('wfh')}>
          <Home size={16} /> Work From Home {wfhRequests.length > 0 && <span className={styles.badge}>{wfhRequests.length}</span>}
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'assets' ? styles.tabBtnActive : ''}`} onClick={() => handleTabChange('assets')}>
          <Package size={16} /> Asset Requests {assetRequests.length > 0 && <span className={styles.badge}>{assetRequests.length}</span>}
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
                  {activeTab === 'help' && `${item.issueType}`}
                  {activeTab === 'wfh' && `Dates: ${item.fromDate} - ${item.toDate}`}
                  {activeTab === 'assets' && `${item.assetType}`}
                </div>
                
                <div className={styles.itemActions}>
                  <button className={styles.btnApprove} onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'approve'); }}>Approve</button>
                  <button className={styles.btnReject} onClick={(e) => { e.stopPropagation(); handleAction(item.id, 'reject'); }}>Reject</button>
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
              {activeTab === 'help' && renderHelpDetails(selectedItem)}
              {activeTab === 'wfh' && renderWfhDetails(selectedItem)}
              {activeTab === 'assets' && renderAssetDetails(selectedItem)}
              
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

export default EmploymentApprovals;
