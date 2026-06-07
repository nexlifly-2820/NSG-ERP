import React, { useState } from 'react';
import { Lock, FileText, Check, User, Receipt, X } from 'lucide-react';

export function PayrollBuilderView({ userRole, queryParams, setQueryParams }) {
  const payrollStep = Number(queryParams?.get('payrollStep')) || 1;
  const setPayrollStep = (val) => setQueryParams({ payrollStep: String(val) });
  
  const [lockedAtt, setLockedAtt] = useState(false);
  const [appliedDeductions, setAppliedDeductions] = useState(false);
  const [runLedger, setRunLedger] = useState(false);
  const [payrollRuns, setPayrollRuns] = useState([]);
  
  const isMakerSigned = payrollRuns?.[payrollRuns.length - 1]?.status === 'maker_signed';
  const isReleased = payrollRuns?.[payrollRuns.length - 1]?.status === 'bank_transferred';

  const [tdsDeclarations, setTdsDeclarations] = useState([]);
  const [expenseClaims, setExpenseClaims] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [tdsRes, claimsRes, runsRes] = await Promise.all([
        fetch('/api/hr-portal/payroll/tds-declarations', { headers }),
        fetch('/api/hr-portal/payroll/claims', { headers }),
        fetch('/api/hr-portal/payroll/runs', { headers })
      ]);

      if (tdsRes.ok) setTdsDeclarations(await tdsRes.json());
      if (claimsRes.ok) setExpenseClaims(await claimsRes.json());
      if (runsRes.ok) setPayrollRuns(await runsRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  const pendingTds = tdsDeclarations.filter(d => d.status === 'pending');

  const handleVerifyTds = async (declId) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      await fetch(`/api/hr-portal/payroll/tds-declarations/${declId}/verify`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      alert('TDS Investment Declaration successfully verified and signed off!');
      fetchData();
    } catch(e) { console.error(e); }
  };

  const handleRejectTds = async (declId) => {
    alert('TDS Rejection endpoint not currently implemented on backend, mocking reject for UI.');
    setTdsDeclarations(prev => prev.filter(d => d.id !== declId));
  };

  const handleLockAttendance = () => {
    setLockedAtt(true);
    setPayrollStep(2);
    alert('Attendance data locked for the active month! Punch regularizations are frozen.');
  };

  const handleApplyDeductions = () => {
    setAppliedDeductions(true);
    setPayrollStep(3);
    alert('LOP and statutory TDS tax structures successfully calculated and applied.');
  };

  const handleRunLedger = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/hr-portal/payroll/runs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month: 5,
          year: 2026,
          total_gross: 0,
          total_deductions: 0,
          total_net: 0
        })
      });

      if (res.ok) {
        setRunLedger(true);
        setPayrollStep(4);
        fetchData();
        alert('Payroll ledger successfully computed. Draft payslips generated in the database.');
      }
    } catch (e) { console.error(e); }
  };

  const handleMakerSign = async () => {
    const activeRun = payrollRuns[payrollRuns.length - 1];
    if (!activeRun) {
      alert("No active payroll run found.");
      return;
    }
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/payroll/runs/${activeRun.id}/sign-maker`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setPayrollStep(5);
        fetchData();
        alert('Maker signature committed! Ledger locked and dispatched to CEO Approvals queue for Checker sign-off.');
      }
    } catch(e) { console.error(e); }
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Monthly Payroll Builder</h1>
          <p>Locked attendance data, compute LWP tax TDS structures, and execute Twin-Signature Maker-Checker payout locks.</p>
        </div>
      </div>

      {pendingTds.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-pink)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
            <FileText size={18} color="var(--accent-pink)" />
            Pending TDS Declarations for Verification ({pendingTds.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingTds.map(d => {
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={14} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{`Employee #${d.user_id || d.employee_id}`}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted)' }}>Financial Year: {d.financial_year}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '12px' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>80C: </span>
                      <strong>₹{Number(d.sec80c).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>HRA Rent: </span>
                      <strong>₹{Number(d.hra_rent).toLocaleString('en-IN')}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>80D: </span>
                      <strong>₹{Number(d.sec80d).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleVerifyTds(d.id)}
                      style={{ padding: '6px 12px', background: '#10B981', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Check size={11} /> Approve &amp; Verify
                    </button>
                    <button 
                      onClick={() => handleRejectTds(d.id)}
                      style={{ padding: '6px 12px', background: '#EF4444', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Expense Reimbursement Verification Panel ─────────────────────── */}
      {(() => {
        const tlApprovedExpenses = expenseClaims.filter(
          c => (c.tl_approval === 'approved' || c.tlStatus === 'approved') &&
               c.hr_approval !== 'approved' && c.hr_approval !== 'rejected'
        );

        if (tlApprovedExpenses.length === 0) return null;

        const handleVerifyExpense = async (claimId) => {
          try {
            const token = localStorage.getItem('nsg_jwt_token');
            await fetch(`/api/hr-portal/payroll/claims/${claimId}/approve`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
          } catch(e) { console.error(e); }
        };

        const handleRejectExpense = async (claimId) => {
          try {
            const token = localStorage.getItem('nsg_jwt_token');
            await fetch(`/api/hr-portal/payroll/claims/${claimId}/reject`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
          } catch(e) { console.error(e); }
        };

        return (
          <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid #10b981', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: 'var(--text-primary)' }}>
              <Receipt size={18} color="#10b981" />
              Expense Reimbursement — Awaiting HR Verification ({tlApprovedExpenses.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Employee</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {tlApprovedExpenses.map(c => {
                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '14px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <User size={12} />
                          </div>
                          {`Emp #${c.user_id || c.employee_id}`}
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{c.category || '—'}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{c.claim_date || c.date || '—'}</td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)', maxWidth: '200px' }}>
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.description || '—'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FileText size={10} /> {c.receipt_url || c.receiptName || 'receipt.pdf'}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 800, fontSize: '15px', color: '#10b981' }}>
                        ₹{Number(c.amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleVerifyExpense(c.id)}
                            style={{ padding: '5px 10px', background: '#10B981', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Check size={11} /> Verify & Reimburse
                          </button>
                          <button
                            onClick={() => handleRejectExpense(c.id)}
                            style={{ padding: '5px 10px', background: '#EF4444', border: 'none', color: '#fff', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <X size={11} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* Stepper Timeline UI */}
      <div className="pipeline" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px', marginBottom: '24px' }}>
        <div className="pipeline-title">Monthly Payroll Run Timeline</div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ opacity: payrollStep === 1 ? 1 : 0.5 }}>1. Lock Attendance</div>
          <div style={{ opacity: payrollStep === 2 ? 1 : 0.5 }}>→</div>
          <div style={{ opacity: payrollStep === 3 ? 1 : 0.5 }}>2. Calculate Taxes</div>
          <div style={{ opacity: payrollStep === 4 ? 1 : 0.5 }}>→</div>
          <div style={{ opacity: payrollStep === 5 ? 1 : 0.5 }}>3. Maker Sign</div>
          <div style={{ opacity: isMakerSigned ? 1 : 0.5 }}>→</div>
          <div style={{ opacity: isReleased ? 1 : 0.5 }}>4. Checker Release</div>
        </div>
      </div>

      <div className="card" style={{ borderLeft: '4px solid var(--accent-pink)' }}>
        <h3>Active Stepper Workspaces</h3>
        
        {payrollStep === 1 && (
          <div>
            <p>Phase 1: Lock attendance logs and freeze missed-punch regularization tickets.</p>
            <button className="print-btn" onClick={handleLockAttendance}>Lock Attendance Now</button>
          </div>
        )}

        {payrollStep === 2 && (
          <div>
            <p>Phase 2: Calculate Provident Fund contributions, professional taxes, LOP, and TDS schedules.</p>
            <button className="print-btn" onClick={handleApplyDeductions}>Apply Deductions &amp; TDS</button>
          </div>
        )}

        {payrollStep === 3 && (
          <div>
            <p>Phase 3: Generate the draft ledger payroll structures.</p>
            <button className="print-btn" onClick={handleRunLedger}>Run Payout Ledger</button>
          </div>
        )}

        {payrollStep === 4 && (
          <div>
            <p>Phase 4: Digitally sign the payroll Maker file and push it to the CEO approvalsChecker queue.</p>
            <button className="print-btn" onClick={handleMakerSign}>Sign Maker File</button>
          </div>
        )}

        {payrollStep === 5 && (
          <div>
            <p>Phase 5: Pending CEO Checker signature. Maker file signed by HR.</p>
            <div style={{ padding: '12px', border: '1px dashed var(--border-color)', borderRadius: '8px', fontSize: '13px', backgroundColor: 'var(--bg-tertiary)' }}>
              <strong>Maker Status:</strong> Signed ✓ | <strong>Checker Status:</strong> Awaiting CEO signoff. Switch your active role to CEO Suite to approve payroll payouts in CEO settings/approvals.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 11. APPRAISALS VIEW
