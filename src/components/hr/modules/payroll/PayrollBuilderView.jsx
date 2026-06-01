import React, { useState } from 'react';
import { Lock } from 'lucide-react';

export function PayrollBuilderView({ db, onUpdateDb, userRole, queryParams, setQueryParams }) {
  const payrollStep = Number(queryParams?.get('payrollStep')) || 1;
  const setPayrollStep = (val) => setQueryParams({ payrollStep: String(val) });
  
  const [lockedAtt, setLockedAtt] = useState(false);
  const [appliedDeductions, setAppliedDeductions] = useState(false);
  const [runLedger, setRunLedger] = useState(false);
  
  const isMakerSigned = db.payrollRuns?.[db.payrollRuns.length - 1]?.status === 'maker_signed';
  const isReleased = db.payrollRuns?.[db.payrollRuns.length - 1]?.status === 'bank_transferred';

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

  const handleRunLedger = () => {
    setRunLedger(true);
    setPayrollStep(4);
    alert('Payroll ledger successfully computed. Draft payslips generated.');
  };

  const handleMakerSign = () => {
    const newRun = {
      id: Date.now(),
      month: 5,
      year: 2026,
      status: 'maker_signed',
      maker_id: 'Sarah Jenkins',
      maker_signed_at: new Date().toISOString(),
      checker_id: null,
      checker_signed_at: null,
      bank_transfer_at: null
    };

    const newLogs = [...db.auditLogs, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      initiator_id: 'Sarah Jenkins',
      module: 'Payroll',
      record_id: newRun.id,
      action_type: 'payroll_lock', // Maker signed transaction lock
      change_diff: { payroll_run: 'maker_signed' },
      ip_address: '192.168.1.104',
      client_agent: 'Chrome / Windows'
    }];

    onUpdateDb({
      ...db,
      payrollRuns: [...db.payrollRuns, newRun],
      auditLogs: newLogs
    });

    setPayrollStep(5);
    alert('Maker signature committed! Ledger locked and dispatched to CEO Approvals queue for Checker sign-off.');
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Monthly Payroll Builder</h1>
          <p>Locked attendance data, compute LWP tax TDS structures, and execute Twin-Signature Maker-Checker payout locks.</p>
        </div>
      </div>

      {/* Stepper Timeline UI */}
      <div className="pipeline" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '20px' }}>
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
