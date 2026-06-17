import React, { useState, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = url => fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('nsg_jwt_token')}` } }).then(res => res.json());
import ExpenseForm from './ExpenseForm';
import { Check, X, FileText, ClipboardList, PlusCircle } from 'lucide-react';

export default function Expenses({ currentUser }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [toast, setToast] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState('form');
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [viewDescription, setViewDescription] = useState(null);

  const { data: claimsData, mutate: mutateClaims } = useSWR('/api/employee-portal/expenses/my-claims', fetcher);
  
  const claims = (claimsData?.items || []).map(c => ({
      ...c,
      id: `EXP-${c.id}`,
      originalId: c.id,
      date: c.claim_date,
      receiptName: c.receipt_url || 'receipt.pdf',
      tlStatus: c.tl_approval,
      hrStatus: c.hr_approval,
      payrollStatus: c.status
  }));

  const fetchClaims = () => mutateClaims();

  useEffect(() => {
    if (claims.length > 0 && !selectedClaim) setSelectedClaim(claims[0]);
  }, [claims, selectedClaim]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmitClaim = async (newClaimData) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/expenses/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          amount: newClaimData.amount,
          category: newClaimData.category,
          description: newClaimData.description,
          claim_date: newClaimData.date,
          receipt_url: newClaimData.receiptName || 'receipt.pdf'
        })
      });
      if (res.ok) {
        showToast(`Claim submitted for ₹${newClaimData.amount.toLocaleString('en-IN')}`);
        fetchClaims();
        if (isMobile) setMobileTab('history');
      } else {
        alert('Failed to submit claim.');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting claim.');
    }
  };

  const handleCancelClaimRequest = (id) => {
    const claim = claims.find(c => c.id === id);
    if (!claim) return;
    if (claim.tlStatus !== 'pending') {
      alert('Only pending claims can be canceled.');
      return;
    }
    setConfirmCancelId(id);
  };

  const handleConfirmCancel = async () => {
    if (!confirmCancelId) return;
    try {
      const claim = claims.find(c => c.id === confirmCancelId);
      const originalId = claim?.originalId;
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/employee-portal/expenses/claim/${originalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const updated = claims.filter(c => c.id !== confirmCancelId);
        mutateClaims();
        setSelectedClaim(updated.length > 0 ? updated[0] : null);
        showToast('Claim cancelled successfully.');
      } else {
        const err = await res.json();
        alert(err.detail || 'Failed to cancel claim');
      }
    } catch (e) {
      alert('Network error cancelling claim');
    }
    setConfirmCancelId(null);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getCategoryLabel = (cat) => {
    const labels = { travel: 'Travel', meal: 'Meals & Entertainment', accommodation: 'Accommodation', client: 'Client Entertainment', office: 'Office Supplies', other: 'Other' };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat) => {
    const colors = { travel: 'hsl(210, 70%, 50%)', meal: 'hsl(35, 90%, 60%)', accommodation: 'hsl(265, 70%, 60%)', client: 'hsl(150, 70%, 50%)', office: 'hsl(180, 70%, 45%)', other: 'hsl(0, 0%, 50%)' };
    return colors[cat] || 'var(--text-secondary)';
  };

  return (
    <div className="component-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .expenses-layout { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
        @media (min-width: 992px) { .expenses-layout { grid-template-columns: 420px 1fr; } }
        .expenses-table-card { min-height: 480px; display: flex; flex-direction: column; }
        .expense-row-selected { background-color: rgba(16, 185, 129, 0.03); border-left: 3px solid var(--accent-green) !important; }
        .expense-tr-row { height: 52px; cursor: pointer; transition: background-color 0.2s ease; }
        .expense-tr-row:hover { background-color: var(--bg-primary); }
        .badge-cat { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px; display: inline-block; }
        .claim-amt { font-size: 16px; font-weight: 800; font-variant-numeric: tabular-nums; }
        .toast-notify { position: fixed; bottom: 24px; right: 24px; background-color: var(--text-primary); color: var(--bg-secondary); padding: 12px 24px; border-radius: 8px; box-shadow: var(--shadow-lg); z-index: 1000; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px; border: 1px solid var(--border-color); animation: slideUpExp 0.3s ease-out; }
        .confirm-dialog-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 1100; }
        .confirm-dialog-box { background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 24px; width: 90%; max-width: 400px; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; gap: 16px; }
        .mobile-tabs-container { display: flex; background-color: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 8px; padding: 4px; margin-bottom: 8px; gap: 4px; }
        .mobile-tab-btn { flex: 1; border: none; background: none; padding: 10px; font-size: 12px; font-weight: 600; color: var(--text-secondary); border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: all 0.2s; }
        .mobile-tab-btn.active { background-color: var(--accent-green); color: white; }
        @keyframes slideUpExp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      ` }} />

      {toast && (
        <div className="toast-notify">
          <Check size={16} style={{ color: 'var(--accent-green)' }} />
          <span>{toast}</span>
        </div>
      )}

      {confirmCancelId && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog-box">
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Confirm Claim Cancellation</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Cancel this claim? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button onClick={() => setConfirmCancelId(null)} style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Go Back</button>
              <button onClick={handleConfirmCancel} style={{ border: 'none', backgroundColor: '#ef4444', color: 'white', borderRadius: '6px', padding: '8px 14px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>Yes, Cancel Claim</button>
            </div>
          </div>
        </div>
      )}

      {viewDescription && (
        <div className="confirm-dialog-overlay" onClick={() => setViewDescription(null)}>
          <div className="confirm-dialog-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>Description</h4>
              <button onClick={() => setViewDescription(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0' }}><X size={16} /></button>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' }}>
              {viewDescription}
            </p>
          </div>
        </div>
      )}

      <div className="component-header">
        <div>
          <h1>Employee Expenses</h1>
          <p>Submit and claim company related business expenditures, check verification logs, and track payouts.</p>
        </div>
      </div>

      {isMobile && (
        <div className="mobile-tabs-container">
          <button className={`mobile-tab-btn ${mobileTab === 'form' ? 'active' : ''}`} onClick={() => setMobileTab('form')}><PlusCircle size={14} /> Submit Claim</button>
          <button className={`mobile-tab-btn ${mobileTab === 'history' ? 'active' : ''}`} onClick={() => setMobileTab('history')}><ClipboardList size={14} /> Claims History</button>
        </div>
      )}

      <div className="expenses-layout">
        {(!isMobile || mobileTab === 'form') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ExpenseForm onSubmitClaim={handleSubmitClaim} />
          </div>
        )}

        {(!isMobile || mobileTab === 'history') && (
          <div className="content-card expenses-table-card" style={{ width: '100%' }}>
            <div className="card-header">
              <div>
                <h3 style={{ margin: 0 }}>My Claims History</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Select a row to track statuses or cancel pending submissions.</p>
              </div>
              <span className="badge-pill bg-blue" style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>{claims.length} Claims</span>
            </div>

            <div className="card-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ fontSize: '11px' }}>Date</th>
                    <th style={{ fontSize: '11px' }}>Category</th>
                    <th style={{ fontSize: '11px' }}>Amount</th>
                    <th style={{ fontSize: '11px' }}>Description</th>
                    <th style={{ fontSize: '11px' }}>Receipt</th>
                    <th style={{ fontSize: '11px' }}>CEO Approval</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => {
                    const isSelected = selectedClaim?.id === claim.id;
                    const catColor = getCategoryColor(claim.category);
                    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(claim.amount);
                    return (
                      <tr key={claim.id} onClick={() => setSelectedClaim(claim)} className={`expense-tr-row ${isSelected ? 'expense-row-selected' : ''}`}>
                        <td style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>{claim.date}</td>
                        <td>
                          <span className="badge-cat" style={{ color: catColor, backgroundColor: `${catColor}15` }}>{getCategoryLabel(claim.category)}</span>
                        </td>
                        <td className="claim-amt" style={{ color: catColor }}>{formattedAmount}</td>
                        <td 
                          onClick={(e) => { e.stopPropagation(); setViewDescription(claim.description); }}
                          style={{ fontSize: '11px', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }} 
                          title="Click to view full description"
                        >
                          <span style={{ textDecoration: 'underline' }}>{claim.description}</span>
                        </td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <a 
                            href={claim.receiptName} 
                            download 
                            style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', cursor: 'pointer' }}
                            onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent-green)'; e.currentTarget.style.textDecoration = 'underline'; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.textDecoration = 'none'; }}
                          >
                            <FileText size={12} /> {claim.receiptName}
                          </a>
                        </td>
                        <td><span className={`status-pill ${claim.payrollStatus === 'reimbursed' ? 'approved' : claim.payrollStatus}`}>{claim.payrollStatus === 'reimbursed' ? 'Approved' : claim.payrollStatus}</span></td>
                      </tr>
                    );
                  })}
                  {claims.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No expense claims submitted yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
