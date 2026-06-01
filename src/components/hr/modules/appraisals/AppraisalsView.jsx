import { useState } from 'react';

export function AppraisalsView({ db, onUpdateDb }) {
  const [appraisalTab, setAppraisalTab] = useState('proposals'); // proposals | cycles | scorecards | promotions
  const [selectedEmpId, setSelectedEmpId] = useState(104);
  const [proposedCTC, setProposedCTC] = useState(65000);
  const [incrementPct, setIncrementPct] = useState(10);

  // Review Cycle States
  const [cycleName, setCycleName] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selfDeadline, setSelfDeadline] = useState('');
  const [tlDeadline, setTlDeadline] = useState('');
  const [cycleStatus, setCycleStatus] = useState('active');
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false);

  const emp = db.employees.find(e => e.id === selectedEmpId) || { name: 'Staff', grade: 1, designation: 'Developer' };
  
  // Base current CTC calculation simulation
  const currentMonthlyCTC = emp.grade * 15000 + 10000;
  const currentAnnualCTC = currentMonthlyCTC * 12;

  // Reactively calculate values
  const handleCTCChange = (val) => {
    setProposedCTC(val);
    const pct = ((val - currentAnnualCTC) / currentAnnualCTC) * 100;
    setIncrementPct(Math.round(pct * 100) / 100);
  };

  const handlePctChange = (val) => {
    setIncrementPct(val);
    const annual = currentAnnualCTC * (1 + val / 100);
    setProposedCTC(Math.round(annual));
  };

  const handleProposeIncrement = (e) => {
    e.preventDefault();

    const newProposal = {
      id: +new Date(),
      employee_id: selectedEmpId,
      current_ctc: currentAnnualCTC,
      proposed_ctc: proposedCTC,
      increment_pct: incrementPct,
      performance_band: 'A',
      effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending_ceo',
      approved_by: null
    };

    const newLogs = [...db.auditLogs, {
      id: +new Date() + 1,
      timestamp: new Date().toISOString(),
      initiator_id: 'Sarah Jenkins',
      module: 'Appraisals',
      record_id: selectedEmpId,
      action_type: 'verify_doc',
      change_diff: { increment_proposed: `${incrementPct}%`, new_ctc: proposedCTC },
      ip_address: '192.168.1.104',
      client_agent: 'Chrome / Windows'
    }];

    onUpdateDb({
      ...db,
      incrementProposals: [...(db.incrementProposals || []), newProposal],
      auditLogs: newLogs
    });

    alert(`Increment proposal of ${incrementPct}% successfully submitted to CEO reviews approvals queue!`);
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (val) {
      const startMs = new Date(val).getTime();
      setSelfDeadline(new Date(startMs + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setTlDeadline(new Date(startMs + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setEndDate(new Date(startMs + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    }
  };

  const handleCreateCycle = (e) => {
    e.preventDefault();
    if (!cycleName.trim()) return;

    const newCycle = {
      id: +new Date(),
      name: cycleName,
      period: reviewPeriod,
      start_date: startDate,
      end_date: endDate,
      self_deadline: selfDeadline,
      tl_review_deadline: tlDeadline,
      status: cycleStatus
    };

    onUpdateDb({
      ...db,
      appraisalCycles: [...(db.appraisalCycles || []), newCycle]
    });

    setCycleName('');
    setStartDate('');
    setEndDate('');
    setSelfDeadline('');
    setTlDeadline('');
    setCycleStatus('active');
    setIsCreateCycleOpen(false);
    alert(`Performance Review Cycle ${cycleName} successfully launched globally!`);
  };

  const scorecards = db.appraisalScorecards || [
    { id: 1, employee_name: 'John Doe', tl_name: 'Sarah Jenkins', rating: 'A — Excellent', comments: 'Outstanding system design velocity. Handled HDFC payment integration flawlessly.' },
    { id: 2, employee_name: 'Jane Smith', tl_name: 'Sarah Jenkins', rating: 'B — Competent', comments: 'Consistent uptime and server provisioning logs. Excellent IT compliance.' },
    { id: 3, employee_name: 'Rahul Roy', tl_name: 'Vikram Sen', rating: 'C — Developing', comments: 'Good work on content SEO audits, but needs more punctuality on clock-ins.' }
  ];

  const promotionTracker = db.promotions || [
    { id: 1, name: 'Priya Patel', current: 'Junior Architect', proposed: 'Systems Architect', status: 'approved_by_ceo' }
  ];

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Appraisals &amp; CTC Increment Calibration</h1>
          <p>Evaluate TL scorecard ratings and calibrate proposed CTC percentage increases.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', marginBottom: '20px', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { id: 'proposals', label: 'Proposals Calibration' },
            { id: 'cycles', label: 'Review Cycle Manager' },
            { id: 'scorecards', label: 'TL Scorecards Inbox' },
            { id: 'promotions', label: 'Promotion Flow Tracker' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setAppraisalTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: appraisalTab === tab.id ? 'var(--accent-pink)' : 'var(--text-muted)',
                borderBottom: appraisalTab === tab.id ? '2.5px solid var(--accent-pink)' : 'none',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {appraisalTab === 'cycles' && (
          <button
            onClick={() => setIsCreateCycleOpen(true)}
            className="print-btn"
            style={{
              backgroundColor: 'var(--accent-pink)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            🚀 Launch Review Cycle
          </button>
        )}
      </div>

      {appraisalTab === 'proposals' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <form onSubmit={handleProposeIncrement} className="card flex-2" style={{ borderLeft: '4px solid var(--accent-pink)', margin: 0 }}>
            <h3>CTC Projections Worksheet</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
              <label style={{ fontSize: '12px' }}>Target Employee</label>
              <select value={selectedEmpId} onChange={(e) => { setSelectedEmpId(Number(e.target.value)); }} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}>
                {db.employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>
                ))}
              </select>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Current Annual CTC</span>
                  <strong style={{ fontSize: '15px' }}>₹{currentAnnualCTC.toLocaleString()}</strong>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Performance Rating Band</span>
                  <strong style={{ fontSize: '15px', color: 'var(--accent-pink)' }}>A (TL Endorsed)</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Proposed Annual CTC (₹)</label>
                  <input
                    type="number"
                    value={proposedCTC}
                    onChange={(e) => handleCTCChange(Number(e.target.value))}
                    required
                    style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Increment Percentage (%)</label>
                  <input
                    type="number"
                    value={incrementPct}
                    onChange={(e) => handlePctChange(Number(e.target.value))}
                    required
                    step="0.1"
                    style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Annual Budget Deficit Impact:</span>
                  <strong style={{ color: 'red' }}>+ ₹{(proposedCTC - currentAnnualCTC).toLocaleString()} / year</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
                  <span>Grade Level Increment Impact:</span>
                  <strong>Grade {emp.grade} → Grade {emp.grade}</strong>
                </div>
              </div>
            </div>

            <button type="submit" className="strategic-list-item" style={{ width: '100%', justifyContent: 'center', backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Propose CTC Increment &amp; Submit
            </button>
          </form>

          {/* Calibrator details info */}
          <div className="card flex-1" style={{ margin: 0, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3>ℹ️ Increment Policy Guidelines</h3>
            <ul style={{ fontSize: '12.5px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '16px' }}>
              <li><strong>Maker-Checker Flow:</strong> Calibrations submitted by HR (Maker) must be Checker authorized by CEO.</li>
              <li><strong>Performance Band A:</strong> Recommends 10% - 25% increments basis scorecards.</li>
              <li><strong>Statutory PF:</strong> Increments will trigger dynamic PF recalculated contributions (12% of basic).</li>
              <li><strong>Retroactive:</strong> Backdated effective dates will generate dynamic salary arrears processed on future cycles automatically.</li>
            </ul>
          </div>
        </div>
      )}

      {appraisalTab === 'cycles' && (
        <div style={{ width: '100%' }}>
          {/* Active cycles tree */}
          <div className="table-container" style={{ margin: 0, overflowX: 'auto', width: '100%' }}>
            <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>System Appraisal Calibration Cycles</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Cycle Name</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Review Period</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Start Date</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Self-Assessment Deadline</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>TL Approval Deadline</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>End Date</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {db.appraisalCycles?.map((cy, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '16px 40px' }}><strong>{cy.name}</strong></td>
                    <td style={{ padding: '16px 40px' }}><span className="badge-pill bg-blue">{cy.period.toUpperCase()}</span></td>
                    <td style={{ padding: '16px 40px' }}>{cy.start_date}</td>
                    <td style={{ padding: '16px 40px' }}>{cy.self_deadline}</td>
                    <td style={{ padding: '16px 40px' }}>{cy.tl_review_deadline}</td>
                    <td style={{ padding: '16px 40px' }}>{cy.end_date}</td>
                    <td style={{ padding: '16px 40px' }}><span className="badge-pill bg-green">{cy.status}</span></td>
                  </tr>
                )) || (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '16px 40px', color: 'var(--text-muted)' }}>No cycles configured. Click "Launch Review Cycle" above to create one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {appraisalTab === 'scorecards' && (
        <div className="table-container" style={{ margin: 0, overflowX: 'auto', width: '100%' }}>
          <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>Performance Scorecard Inbox (TL-Submitted)</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Employee Name</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Assigned Evaluator (TL)</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Performance Band Rating</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>TL Feedback Comments</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Reminder Alert</th>
              </tr>
            </thead>
            <tbody>
              {scorecards.map((sc, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '16px 40px' }}><strong>{sc.employee_name}</strong></td>
                  <td style={{ padding: '16px 40px' }}>{sc.tl_name}</td>
                  <td style={{ padding: '16px 40px' }}><span className="badge-pill bg-pink">{sc.rating}</span></td>
                  <td style={{ padding: '16px 40px', fontSize: '12px', fontStyle: 'italic', maxWidth: '300px' }}>"{sc.comments}"</td>
                  <td style={{ padding: '16px 40px' }}>
                    <button
                      className="print-btn"
                      style={{ padding: '4px 8px', fontSize: '10px' }}
                      onClick={() => alert(`TL [${sc.tl_name}] notified! Calibrations scorecard audit requested.`)}
                    >
                      Acknowledge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {appraisalTab === 'promotions' && (
        <div className="table-container" style={{ margin: 0, overflowX: 'auto', width: '100%' }}>
          <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>Corporate Promotions &amp; Designations Transfer Pipeline</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Employee Profile</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Current Title Designation</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Proposed Designation Title</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Promotion Approval Flow</th>
              </tr>
            </thead>
            <tbody>
              {promotionTracker.map((pr, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '16px 40px' }}><strong>{pr.name}</strong></td>
                  <td style={{ padding: '16px 40px' }}>{pr.current}</td>
                  <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{pr.proposed}</span></td>
                  <td style={{ padding: '16px 40px' }}>
                    <span className="badge-pill bg-green" style={{ textTransform: 'uppercase' }}>
                      {pr.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 🚀 LAUNCH REVIEW CYCLE MODAL OVERLAY */}
      {isCreateCycleOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <form 
            onSubmit={handleCreateCycle} 
            className="card" 
            style={{ width: '460px', maxHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🚀 Launch Performance Review Cycle
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setIsCreateCycleOpen(false)}>✕</button>
            </div>

            <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Cycle Name</label>
                <input type="text" value={cycleName} onChange={(e) => setCycleName(e.target.value)} required placeholder="Q1 2026 Appraisal Calibration" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Review Period</label>
                <select value={reviewPeriod} onChange={(e) => setReviewPeriod(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}>
                  <option value="annual">Annual Calibration</option>
                  <option value="bi_annual">Bi-Annual Calibration</option>
                  <option value="quarterly">Quarterly Review</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Start Date</label>
                <input type="date" value={startDate} onChange={(e) => handleStartDateChange(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Self-Assessment Deadline</label>
                <input type="date" value={selfDeadline} onChange={(e) => setSelfDeadline(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>TL Approval Deadline</label>
                <input type="date" value={tlDeadline} onChange={(e) => setTlDeadline(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Status</label>
                <select value={cycleStatus} onChange={(e) => setCycleStatus(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}>
                  <option value="active">active</option>
                  <option value="paused">paused</option>
                  <option value="completed">completed</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px', flexShrink: 0 }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setIsCreateCycleOpen(false)}>Cancel</button>
              <button 
                type="submit"
                style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Launch Cycle Globally
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
