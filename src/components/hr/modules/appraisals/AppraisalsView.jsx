import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { notify } from '../../utils/notify';

export function AppraisalsView() {
  const [appraisalTab, setAppraisalTab] = useState('proposals'); // proposals | cycles | scorecards | promotions
  const [selectedEmpId, setSelectedEmpId] = useState(104);

  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

  const { data: employees = [], mutate: mutateEmployees } = useSWR('/api/hr-portal/employees', fetcher);
  const { data: appraisalCycles = [], mutate: mutateCycles } = useSWR('/api/hr-portal/appraisal-cycles', fetcher);
  const { data: incrementProposals = [], mutate: mutateProposals } = useSWR('/api/hr-portal/increment-proposals', fetcher);
  const { data: scorecards = [], mutate: mutateScorecards } = useSWR('/api/hr-portal/appraisal-scorecards', fetcher);
  const { data: promotionTracker = [], mutate: mutatePromotions } = useSWR('/api/hr-portal/promotions', fetcher);

  const emp = employees.find(e => e.id === selectedEmpId) || { name: 'Staff', grade: 1, designation: 'Developer', ctc: 300000 };
  
  // Base current CTC calculation simulation
  const currentAnnualCTC = emp.ctc || 300000;

  const [proposedCTC, setProposedCTC] = useState(() => Math.round(currentAnnualCTC * 1.10));
  const [incrementPct, setIncrementPct] = useState(10);

  // Sync values when the selected employee changes
  useEffect(() => {
    const annual = emp.ctc || 300000;
    setIncrementPct(10);
    setProposedCTC(Math.round(annual * 1.10));
  }, [selectedEmpId, emp.ctc]);



  // Review Cycle States
  const [cycleName, setCycleName] = useState('');
  const [reviewPeriod, setReviewPeriod] = useState('annual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selfDeadline, setSelfDeadline] = useState('');
  const [tlDeadline, setTlDeadline] = useState('');
  const [cycleStatus, setCycleStatus] = useState('active');
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState(false);

  // Promotion modal states
  const [isProposePromoOpen, setIsProposePromoOpen] = useState(false);
  const [promoEmpName, setPromoEmpName] = useState('');
  const [promoCurrentTitle, setPromoCurrentTitle] = useState('');
  const [promoProposedTitle, setPromoProposedTitle] = useState('');

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

  const handleProposeIncrement = async (e) => {
    e.preventDefault();

    const newProposal = {
      employee_id: selectedEmpId,
      current_ctc: currentAnnualCTC,
      proposed_ctc: proposedCTC,
      increment_pct: incrementPct,
      performance_band: 'A',
      effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pending_ceo'
    };

    const token = localStorage.getItem('nsg_jwt_token');
    if (token) {
      try {
        const response = await fetch('/api/hr-portal/increment-proposals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newProposal)
        });
        if (response.ok) {
          const saved = await response.json();
          mutateProposals();
        }
      } catch (err) {
        console.error("Failed to post increment proposal", err);
      }
    }

    notify(`Increment proposal of ${incrementPct}% submitted to CEO approvals queue.`);
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

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    if (!cycleName.trim()) return;

    const newCycle = {
      name: cycleName,
      period: reviewPeriod,
      start_date: startDate,
      end_date: endDate,
      self_deadline: selfDeadline,
      tl_review_deadline: tlDeadline,
      status: cycleStatus
    };

    const token = localStorage.getItem('nsg_jwt_token');
    if (token) {
      try {
        const response = await fetch('/api/hr-portal/appraisal-cycles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newCycle)
        });
        if (response.ok) {
          const saved = await response.json();
          mutateCycles();
        }
      } catch (err) {
        console.error("Failed to post appraisal cycle", err);
      }
    }

    setCycleName('');
    setStartDate('');
    setEndDate('');
    setSelfDeadline('');
    setTlDeadline('');
    setCycleStatus('active');
    setIsCreateCycleOpen(false);
    notify(`Performance review cycle "${cycleName}" launched globally.`);
  };

  const handleProposePromotion = async (e) => {
    e.preventDefault();
    if (!promoEmpName.trim() || !promoCurrentTitle.trim() || !promoProposedTitle.trim()) return;
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch('/api/hr-portal/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: promoEmpName, current: promoCurrentTitle, proposed: promoProposedTitle })
      });
      if (res.ok) {
        const saved = await res.json();
        mutatePromotions();
        setPromoEmpName('');
        setPromoCurrentTitle('');
        setPromoProposedTitle('');
        setIsProposePromoOpen(false);
        notify(`Promotion proposed for ${saved.name}. CEO notified for approval.`);
      } else {
        notify('Failed to submit promotion proposal.', 'error');
      }
    } catch (err) {
      console.error(err);
      notify('Network error submitting promotion.', 'error');
    }
  };

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


        {appraisalTab === 'promotions' && (
          <button
            onClick={() => setIsProposePromoOpen(true)}
            className="print-btn"
            style={{ backgroundColor: 'var(--accent-green, #22c55e)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-sm)' }}
          >
            🏅 Propose Promotion
          </button>
        )}
      </div>

      {appraisalTab === 'proposals' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <form onSubmit={handleProposeIncrement} className="card flex-2" style={{ borderLeft: '4px solid var(--accent-pink)', margin: 0 }}>
            <h3>CTC Projections Worksheet</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0' }}>
              <label style={{ fontSize: '11px', display: 'block', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.5px' }}>Target Employee</label>
              <select value={selectedEmpId} onChange={(e) => { setSelectedEmpId(Number(e.target.value)); }} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}>
                {employees.map(e => (
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

              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '18px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.5px' }}>Proposed Annual CTC (₹)</label>
                  <input
                    type="number"
                    value={proposedCTC}
                    onChange={(e) => handleCTCChange(Number(e.target.value))}
                    required
                    style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '11px', display: 'block', marginBottom: '8px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.5px' }}>Increment Percentage (%)</label>
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
                      onClick={async () => {
                        const token = localStorage.getItem('nsg_jwt_token');
                        try {
                          const res = await fetch(`/api/hr-portal/appraisal-scorecards/${sc.id}/acknowledge`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          if (res.ok) {
                            const data = await res.json();
                            notify(data.message);
                          } else {
                            notify('Failed to acknowledge scorecard.', 'error');
                          }
                        } catch (err) {
                          console.error(err);
                          notify('Network error acknowledging scorecard. Please try again.', 'error');
                        }
                      }}
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
              {promotionTracker.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '32px 40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No promotions proposed yet. Click "🏅 Propose Promotion" to begin.</td></tr>
              )}
              {promotionTracker.map((pr, idx) => {
                const isPending = pr.status === 'pending_ceo';
                const isApproved = pr.status === 'approved_by_ceo';
                const badgeStyle = isPending
                  ? { backgroundColor: 'rgba(234,179,8,0.2)', color: '#ca8a04', border: '1px solid #ca8a04' }
                  : isApproved
                  ? { backgroundColor: 'rgba(34,197,94,0.2)', color: '#16a34a', border: '1px solid #16a34a' }
                  : { backgroundColor: 'rgba(239,68,68,0.2)', color: '#dc2626', border: '1px solid #dc2626' };
                const badgeLabel = isPending ? '⏳ Pending CEO Review' : isApproved ? '✅ Approved by CEO' : '❌ Rejected';
                return (
                  <tr key={idx}>
                    <td style={{ padding: '16px 40px' }}><strong>{pr.name}</strong></td>
                    <td style={{ padding: '16px 40px' }}>{pr.current}</td>
                    <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>{pr.proposed}</span></td>
                    <td style={{ padding: '16px 40px' }}>
                      <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', ...badgeStyle }}>
                        {badgeLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 🏅 PROPOSE PROMOTION MODAL */}
      {isProposePromoOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <form
            onSubmit={handleProposePromotion}
            className="card"
            style={{ width: '440px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-green, #22c55e)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-green, #22c55e)', display: 'flex', alignItems: 'center', gap: '8px' }}>🏅 Propose Promotion</h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setIsProposePromoOpen(false)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Employee Full Name</label>
                <input type="text" value={promoEmpName} onChange={e => setPromoEmpName(e.target.value)} required placeholder="e.g. Rahul Sharma" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Current Title / Designation</label>
                <input type="text" value={promoCurrentTitle} onChange={e => setPromoCurrentTitle(e.target.value)} required placeholder="e.g. Junior Developer" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Proposed New Designation</label>
                <input type="text" value={promoProposedTitle} onChange={e => setPromoProposedTitle(e.target.value)} required placeholder="e.g. Senior Developer" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
              <button type="button" onClick={() => setIsProposePromoOpen(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 20px', background: 'var(--accent-green, #22c55e)', border: 'none', color: '#fff', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>Submit to CEO →</button>
            </div>
          </form>
        </div>
      )}


    </div>
  );
}
