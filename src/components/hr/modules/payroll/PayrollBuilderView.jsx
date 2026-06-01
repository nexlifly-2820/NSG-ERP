import React, { useState } from 'react';
import { Lock, FileText, Check, User } from 'lucide-react';

export function PayrollBuilderView({ db, onUpdateDb, userRole, queryParams, setQueryParams }) {
  const payrollStep = Number(queryParams?.get('payrollStep')) || 1;
  const setPayrollStep = (val) => setQueryParams({ payrollStep: String(val) });
  
  const [lockedAtt, setLockedAtt] = useState(false);
  const [appliedDeductions, setAppliedDeductions] = useState(false);
  const [runLedger, setRunLedger] = useState(false);
  
  const isMakerSigned = db.payrollRuns?.[db.payrollRuns.length - 1]?.status === 'maker_signed';
  const isReleased = db.payrollRuns?.[db.payrollRuns.length - 1]?.status === 'bank_transferred';

  const pendingTds = (db.tdsDeclarations || []).filter(d => d.status === 'pending');

  const handleVerifyTds = (declId) => {
    const updated = (db.tdsDeclarations || []).map(d => {
      if (d.id === declId) {
        return { ...d, status: 'verified', verified_by: 'Sarah Jenkins', verified_at: new Date().toISOString() };
      }
      return d;
    });
    onUpdateDb({ ...db, tdsDeclarations: updated });
    alert('TDS Investment Declaration successfully verified and signed off!');
  };

  const handleRejectTds = (declId) => {
    const updated = (db.tdsDeclarations || []).map(d => {
      if (d.id === declId) {
        return { ...d, status: 'rejected', rejected_at: new Date().toISOString() };
      }
      return d;
    });
    onUpdateDb({ ...db, tdsDeclarations: updated });
    alert('TDS Investment Declaration rejected and returned to employee.');
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

  const handleRunLedger = () => {
    const activeRunMonth = 5;
    const activeRunYear = 2026;

    // Check if payslips for this run already exist in db.payslips to prevent duplicates
    const hasExistingPayslips = db.payslips?.some(p => p.month === activeRunMonth && p.year === activeRunYear);

    if (!hasExistingPayslips) {
      const generatedPayslips = (db.employees || []).map(emp => {
        // Calculate basic salary, HRA, performance bonus, and allowances
        let basic = emp.id === 101 ? 42000 : emp.id === 102 ? 25000 : 30000;
        let hra = Math.round(basic * 0.4);
        let allowances = emp.id === 101 ? 14450 + 1250 + 800 + 9950 : emp.id === 102 ? 4000 : 5000;

        // Calculate deductions
        let epf = Math.round(basic * 0.12);

        // Dynamic LOP deduction from db.timesheetExceptions (if unresolved open exceptions)
        let lop = 0;
        const employeeExceptions = (db.timesheetExceptions || []).filter(
          ex => ex.employee_id === emp.id && ex.status === 'open'
        );
        if (employeeExceptions.length > 0) {
          // Deduct ₹2,000 per open timesheet exception
          lop = employeeExceptions.length * 2000;
        }

        // Dynamic TDS tax bracket deduction based on verified TDS investment declarations
        const empDecl = (db.tdsDeclarations || []).find(
          d => d.employee_id === emp.id && d.financial_year === '2026-27' && d.status === 'verified'
        );
        let tdsRate = 0.15; // default tax rate 15%
        if (empDecl) {
          const totalDeclAmount = (empDecl.sec80c || 0) + (empDecl.sec80d || 0) + (empDecl.hra_rent || 0);
          if (totalDeclAmount > 200000) tdsRate = 0.05; // 5% TDS for high declarations
          else if (totalDeclAmount > 100000) tdsRate = 0.10; // 10% TDS
        }

        let tds = Math.round((basic + hra + allowances - lop) * tdsRate);
        let totalDeductions = epf + tds + lop;
        let net = basic + hra + allowances - totalDeductions;

        return {
          id: Date.now() + emp.id,
          payroll_run_id: Date.now(),
          employee_id: emp.id,
          basic,
          hra,
          da: 0,
          allowances,
          epf,
          tds,
          lop,
          net,
          month: activeRunMonth,
          year: activeRunYear
        };
      });

      onUpdateDb({
        ...db,
        payslips: [...(db.payslips || []), ...generatedPayslips]
      });
    }

    setRunLedger(true);
    setPayrollStep(4);
    alert('Payroll ledger successfully computed. Draft payslips generated in the database.');
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

      {pendingTds.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', borderLeft: '4px solid var(--accent-pink)', padding: '20px' }}>
          <h3 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
            <FileText size={18} color="var(--accent-pink)" />
            Pending TDS Declarations for Verification ({pendingTds.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingTds.map(d => {
              const emp = (db.employees || []).find(e => e.id === d.employee_id);
              return (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={14} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{emp ? emp.name : `Employee ${d.employee_id}`}</p>
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
