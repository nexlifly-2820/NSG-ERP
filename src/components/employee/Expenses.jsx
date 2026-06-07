import React, { useState, useEffect } from 'react';
import ExpenseForm from './ExpenseForm';
import ReimbursementTracker from './ReimbursementTracker';
import {
  Check, X, FileText, AlertCircle, Trash2,
  Menu, ClipboardList, PlusCircle
} from 'lucide-react';

const defaultClaims = [
  { id: 'EXP-101', date: '2026-05-28', category: 'travel', amount: 1540, description: 'Client visit cab fare', tlStatus: 'approved', hrStatus: 'approved', payrollStatus: 'reimbursed', receiptName: 'uber_receipt_20260528.pdf' },
  { id: 'EXP-102', date: '2026-05-29', category: 'meal', amount: 480, description: 'Lunch with sales lead', tlStatus: 'approved', hrStatus: 'pending', payrollStatus: 'pending', receiptName: 'lunch_bill.png' },
  { id: 'EXP-103', date: '2026-05-30', category: 'accommodation', amount: 4500, description: 'Hotel stay during regional seminar', tlStatus: 'pending', hrStatus: 'pending', payrollStatus: 'pending', receiptName: 'hilton_invoice.jpg' },
  { id: 'EXP-104', date: '2026-05-25', category: 'client', amount: 1200, description: 'Dinner with international stakeholder', tlStatus: 'denied', hrStatus: 'pending', payrollStatus: 'pending', receiptName: 'restaurant_bill.png' }
];

export default function Expenses({ db, onUpdateDb, currentUser }) {
  const employeeId = currentUser?.id || 102;

  const [claims, setClaims] = useState([]);

  const fetchClaims = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/expenses/my-claims', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.map(c => ({
          ...c,
          id: `EXP-${c.id}`,
          originalId: c.id,
          date: c.claim_date,
          receiptName: c.receipt_url || 'receipt.pdf',
          tlStatus: c.tl_approval,
          hrStatus: c.hr_approval,
          payrollStatus: c.status
        }));
        setClaims(formatted);
      }
    } catch (e) { console.error('Failed to fetch claims', e); }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const [selectedClaim, setSelectedClaim] = useState(null);
  const [toast, setToast] = useState(null);

  // Mobile navigation and view state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileTab, setMobileTab] = useState('form'); // 'form' or 'history'

  // Claim cancellation states
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  // Set the first item as default selected claim
  useEffect(() => {
    if (claims.length > 0 && !selectedClaim) {
      setSelectedClaim(claims[0]);
    }
  }, [claims, selectedClaim]);

  // Handle screen resize to toggle responsive tab layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmitClaim = async (newClaimData) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/expenses/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: newClaimData.amount,
          category: newClaimData.category,
          receipt_url: newClaimData.receiptName || 'receipt.pdf'
        })
      });

      if (res.ok) {
        const newClaim = await res.json();
        setToast(`Claim submitted for ₹${newClaimData.amount.toLocaleString('en-IN')}`);
        setTimeout(() => setToast(null), 3000);
        fetchClaims();

        // Switch view on mobile to show the new claim in history list
        if (isMobile) {
          setMobileTab('history');
        }
      } else {
        alert('Failed to submit claim.');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting claim.');
    }
  };

  // Initiation of claim cancellation
  const handleCancelClaimRequest = (id) => {
    const claim = claims.find(c => c.id === id);
    if (!claim) return;

    if (claim.tlStatus !== 'pending') {
      alert('Only claims in "pending" status at the TL review stage can be canceled.');
      return;
    }

    setConfirmCancelId(id);
  };

  // Confirmation of claim cancellation
  const handleConfirmCancel = () => {
    if (!confirmCancelId) return;

    // Ideally call API to cancel here, mocking removal for now since no backend endpoint exists
    setClaims(prev => prev.filter(c => c.id !== confirmCancelId));

    // Clear selection or update selection
    const updatedClaims = claims.filter(c => c.id !== confirmCancelId);
    setSelectedClaim(updatedClaims.length > 0 ? updatedClaims[0] : null);

    setConfirmCancelId(null);
    setToast('Claim canceled successfully.');
    setTimeout(() => setToast(null), 3000);
  };

  const updateClaimWorkflow = (id, field, status) => {
    // Left empty since workflow transitions are now fully live across portals!
  };

  const getCategoryLabel = (cat) => {
    const labels = {
      travel: 'Travel',
      meal: 'Meals & Entertainment',
      accommodation: 'Accommodation',
      client: 'Client Entertainment',
      office: 'Office Supplies',
      other: 'Other'
    };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat) => {
    const colors = {
      travel: 'hsl(210, 70%, 50%)',
      meal: 'hsl(35, 90%, 60%)',
      accommodation: 'hsl(265, 70%, 60%)',
      client: 'hsl(150, 70%, 50%)',
      office: 'hsl(180, 70%, 45%)',
      other: 'hsl(0, 0%, 50%)',
    };
    return colors[cat] || 'var(--text-secondary)';
  };

  return (
    <div className="component-container">
      {/* Dynamic Style Injection */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .expenses-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          align-items: start;
        }
        
        @media (min-width: 992px) {
          .expenses-layout {
            grid-template-columns: 420px 1fr;
          }
        }

        .expenses-table-card {
          min-height: 480px;
          display: flex;
          flex-direction: column;
        }

        .expense-row-selected {
          background-color: rgba(16, 185, 129, 0.03);
          border-left: 3px solid var(--accent-green) !important;
        }

        .expense-tr-row {
          height: 52px; /* History row height token */
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .expense-tr-row:hover {
          background-color: var(--bg-primary);
        }

        .badge-cat {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 4px;
          letter-spacing: 0.5px;
          display: inline-block;
        }

        .claim-amt {
          font-size: 16px;
          font-weight: 800;
          font-family: var(--font-sans);
          font-variant-numeric: tabular-nums;
        }

        .toast-notify {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          padding: 12px 24px;
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          z-index: 1000;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid var(--border-color);
          animation: slideUp 0.3s ease-out;
        }

        .confirm-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
        }

        .confirm-dialog-box {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 400px;
          box-shadow: var(--shadow-lg);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .mobile-tabs-container {
          display: flex;
          background-color: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 4px;
          margin-bottom: 8px;
          gap: 4px;
        }

        .mobile-tab-btn {
          flex: 1;
          border: none;
          background: none;
          padding: 10px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .mobile-tab-btn.active {
          background-color: var(--accent-green);
          color: white;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      ` }} />

      {/* Success Notification Toast */}
      {toast && (
        <div className="toast-notify">
          <Check size={16} style={{ color: 'var(--accent-green)' }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Cancel claim confirmation overlay */}
      {confirmCancelId && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog-box">
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Confirm Claim Cancellation
            </h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              Cancel this claim? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                onClick={() => setConfirmCancelId(null)}
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
              <button
                onClick={handleConfirmCancel}
                style={{
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Yes, Cancel Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="component-header">
        <div>
          <h1>Employee Expenses</h1>
          <p>Submit and claim company related business expenditures, check verification logs, and track payouts.</p>
        </div>
      </div>

      {/* Responsive mobile tabs - only visible if screen size is < 768px */}
      {isMobile && (
        <div className="mobile-tabs-container">
          <button
            className={`mobile-tab-btn ${mobileTab === 'form' ? 'active' : ''}`}
            onClick={() => setMobileTab('form')}
          >
            <PlusCircle size={14} /> Submit Claim
          </button>
          <button
            className={`mobile-tab-btn ${mobileTab === 'history' ? 'active' : ''}`}
            onClick={() => setMobileTab('history')}
          >
            <ClipboardList size={14} /> Claims History
          </button>
        </div>
      )}

      {/* Inner grid layout */}
      <div className="expenses-layout">

        {/* Left Side: Submit Expense Form & Reimbursement Tracker */}
        {(!isMobile || mobileTab === 'form') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ExpenseForm onSubmitClaim={handleSubmitClaim} />
            <ReimbursementTracker
              claim={selectedClaim}
              onCancelClaim={handleCancelClaimRequest}
            />
          </div>
        )}

        {/* Right Side: Claims History Table */}
        {(!isMobile || mobileTab === 'history') && (
          <div className="content-card expenses-table-card" style={{ width: '100%' }}>
            <div className="card-header">
              <div>
                <h3 style={{ margin: 0 }}>My Claims History</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Select a row to track statuses or cancel pending submissions.
                </p>
              </div>
              <span className="badge-pill bg-blue" style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>
                {claims.length} Claims
              </span>
            </div>

            <div className="card-table-wrapper" style={{ flex: 1, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ fontSize: '11px' }}>Date</th>
                    <th style={{ fontSize: '11px' }}>Category</th>
                    <th style={{ fontSize: '11px' }}>Amount</th>
                    <th style={{ fontSize: '11px' }}>Description & Receipt</th>
                    <th style={{ fontSize: '11px' }}>TL Review</th>
                    <th style={{ fontSize: '11px' }}>HR Audit</th>
                    <th style={{ fontSize: '11px' }}>Payout</th>
                    <th style={{ fontSize: '11px' }}>Integration</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => {
                    const isSelected = selectedClaim?.id === claim.id;
                    const catColor = getCategoryColor(claim.category);

                    // Format amount as Indian number system
                    const formattedAmount = new Intl.NumberFormat('en-IN', {
                      style: 'currency',
                      currency: 'INR',
                      maximumFractionDigits: 2
                    }).format(claim.amount);

                    return (
                      <tr
                        key={claim.id}
                        onClick={() => setSelectedClaim(claim)}
                        className={`expense-tr-row ${isSelected ? 'expense-row-selected' : ''}`}
                      >
                        {/* Date */}
                        <td style={{ fontSize: '11px', fontWeight: '400', whiteSpace: 'nowrap' }}>
                          {claim.date}
                        </td>

                        {/* Category */}
                        <td>
                          <span
                            className="badge-cat"
                            style={{
                              color: catColor,
                              backgroundColor: `${catColor}15`
                            }}
                          >
                            {getCategoryLabel(claim.category)}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="claim-amt" style={{ color: catColor }}>
                          {formattedAmount}
                        </td>

                        {/* Description & Receipt */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>
                              {claim.description}
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FileText size={12} /> {claim.receiptName}
                            </span>
                          </div>
                        </td>

                        {/* TL Review Status */}
                        <td>
                          <span className={`status-pill ${claim.tlStatus}`}>
                            {claim.tlStatus}
                          </span>
                        </td>

                        {/* HR Audit Status */}
                        <td>
                          <span className={`status-pill ${claim.hrStatus}`}>
                            {claim.hrStatus}
                          </span>
                        </td>

                        {/* Payroll/Payout Status */}
                        <td>
                          <span className={`status-pill ${claim.payrollStatus === 'reimbursed' ? 'approved' : claim.payrollStatus}`}>
                            {claim.payrollStatus === 'reimbursed' ? 'Paid' : claim.payrollStatus}
                          </span>
                        </td>
                        {/* Actions to simulate reviews */}
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 600,
                              color: 'var(--text-muted)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-color)',
                              backgroundColor: 'var(--bg-tertiary)'
                            }}>
                              Live Connected
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {claims.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No expense claims submitted yet.
                      </td>
                    </tr>
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
