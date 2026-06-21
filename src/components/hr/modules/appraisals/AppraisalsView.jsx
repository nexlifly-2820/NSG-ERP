import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { notify } from '../../utils/notify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Search, Filter } from 'lucide-react';

export function AppraisalsView() {
  const [appraisalTab, setAppraisalTab] = useState('proposals'); // proposals | cycles | scorecards | promotions
  const [selectedEmpId, setSelectedEmpId] = useState(104);

  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = async (url) => {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json();
    if (!res.ok) throw new Error(json.detail || 'API request failed');
    return json;
  };

  const { data: employees = [], mutate: mutateEmployees } = useSWR('/api/hr-portal/employees', fetcher);
  const { data: appraisalCycles = [], mutate: mutateCycles } = useSWR('/api/hr-portal/appraisal-cycles', fetcher);
  const { data: incrementProposals = [], mutate: mutateProposals } = useSWR('/api/hr-portal/increment-proposals', fetcher);
  const { data: scorecards = [], mutate: mutateScorecards } = useSWR('/api/hr-portal/appraisal-scorecards', fetcher);
  const { data: promotionTracker = [], mutate: mutatePromotions } = useSWR('/api/hr-portal/promotions', fetcher);

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeCycles = Array.isArray(appraisalCycles) ? appraisalCycles : [];
  const safeProposals = Array.isArray(incrementProposals) ? incrementProposals : [];
  const safeScorecards = Array.isArray(scorecards) ? scorecards : [];
  const safePromotions = Array.isArray(promotionTracker) ? promotionTracker : [];

  const emp = safeEmployees.find(e => e.id === selectedEmpId) || { name: 'Staff', grade: 1, designation: 'Developer' };
  
  // Base current CTC calculation simulation
  const parseDocs = (docsStr) => {
    try { return docsStr ? JSON.parse(docsStr) : {}; } catch { return {}; }
  };
  const currentAnnualCTC = parseDocs(emp.documents).ctc || 300000;

  const [proposedCTC, setProposedCTC] = useState(() => Math.round(currentAnnualCTC * 1.10));
  const [incrementPct, setIncrementPct] = useState(10);

  // Pagination & Filtering for Scorecards
  const [scCurrentPage, setScCurrentPage] = useState(1);
  const [scItemsPerPage] = useState(10);
  const [scFilterEmp, setScFilterEmp] = useState('');
  const [scFilterTL, setScFilterTL] = useState('');
  const [scFilterRating, setScFilterRating] = useState('All');

  // Sync values when the selected employee changes
  useEffect(() => {
    setIncrementPct(10);
    setProposedCTC(Math.round(currentAnnualCTC * 1.10));
  }, [selectedEmpId, currentAnnualCTC]);



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
  const [promoEmpId, setPromoEmpId] = useState('');
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
          mutateEmployees();
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
    if (!promoEmpId || !promoEmpName.trim() || !promoCurrentTitle.trim() || !promoProposedTitle.trim()) return;
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch('/api/hr-portal/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ employee_id: Number(promoEmpId), name: promoEmpName, current: promoCurrentTitle, proposed: promoProposedTitle })
      });
      if (res.ok) {
        const saved = await res.json();
        mutatePromotions();
        setPromoEmpId('');
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
                {safeEmployees.map(e => (
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



      {appraisalTab === 'scorecards' && (() => {
        // Filter logic
        const filteredScorecards = scorecards.filter(sc => {
          const matchEmp = sc.employee_name.toLowerCase().includes(scFilterEmp.toLowerCase());
          const matchTL = sc.tl_name.toLowerCase().includes(scFilterTL.toLowerCase());
          const matchRating = scFilterRating === 'All' || sc.rating.startsWith(scFilterRating.charAt(0));
          return matchEmp && matchTL && matchRating;
        });

        // Pagination logic
        const totalPages = Math.ceil(filteredScorecards.length / scItemsPerPage) || 1;
        const indexOfLastItem = scCurrentPage * scItemsPerPage;
        const indexOfFirstItem = indexOfLastItem - scItemsPerPage;
        const currentScorecards = filteredScorecards.slice(indexOfFirstItem, indexOfLastItem);

        const exportPDF = () => {
          const doc = new jsPDF('landscape', 'pt', 'a4');
          
          const img = new Image();
          img.src = '/hmns-logo.png';
          
          const renderPDF = () => {
            // Premium White Header
            doc.setFillColor(255, 255, 255);
            doc.rect(0, 0, doc.internal.pageSize.getWidth(), 110, 'F');
            
            try {
              const imgRatio = img.width / img.height;
              const logoHeight = 45;
              const logoWidth = logoHeight * imgRatio;
              doc.addImage(img, 'PNG', 40, 25, logoWidth, logoHeight);
            } catch (e) {
              doc.setFontSize(20);
              doc.setTextColor(15, 23, 42);
              doc.text('HMNS Software Solution', 40, 50);
            }
            
            // Divider Line
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.setLineWidth(1);
            doc.line(40, 100, doc.internal.pageSize.getWidth() - 40, 100);
            
            // Report Title
            doc.setFontSize(20);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFont('helvetica', 'bold');
            doc.text('GLOBAL PERFORMANCE SCORECARDS REPORT', doc.internal.pageSize.getWidth() - 40, 45, { align: 'right' });
            
            // Timestamp
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // slate-500
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, 65, { align: 'right' });

            // Filter info
            let filterText = `Filters: `;
            if (scFilterEmp) filterText += `Employee: ${scFilterEmp} | `;
            if (scFilterTL) filterText += `TL Name: ${scFilterTL} | `;
            filterText += `Rating: ${scFilterRating}`;
            
            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105);
            doc.text(filterText, 40, 85);

            // Table Data
            const tableColumn = ['Employee', 'Evaluator (TL)', 'Rating', 'Feedback Comments', 'Emp Ack', 'HR Appr'];
            const tableRows = [];

            filteredScorecards.forEach(sc => {
              tableRows.push([
                sc.employee_name, 
                sc.tl_name,
                sc.rating, 
                sc.comments, 
                sc.emp_acknowledged ? 'Yes' : 'Pending', 
                sc.hr_acknowledged ? 'Yes' : 'Pending'
              ]);
            });

            autoTable(doc, {
              startY: 120,
              head: [tableColumn],
              body: tableRows,
              theme: 'grid',
              headStyles: { 
                fillColor: [219, 39, 119], // pink-600
                textColor: [255, 255, 255], 
                fontStyle: 'bold',
                halign: 'left',
                valign: 'middle'
              },
              styles: { 
                fontSize: 10, 
                cellPadding: 8,
                textColor: [51, 65, 85],
                lineColor: [226, 232, 240],
                lineWidth: 0.5
              },
              alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
              columnStyles: {
                4: { halign: 'center', fontStyle: 'bold' },
                5: { halign: 'center', fontStyle: 'bold' }
              },
              margin: { top: 120, left: 40, right: 40, bottom: 40 },
              didDrawPage: function (data) {
                doc.setFontSize(9);
                doc.setTextColor(148, 163, 184); // slate-400
                doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
              }
            });

            doc.save(`Global_Scorecards_Report_${new Date().toISOString().split('T')[0]}.pdf`);
          };

          img.onload = renderPDF;
          img.onerror = renderPDF;
        };

        return (
          <div className="card" style={{ margin: 0, overflowX: 'auto', width: '100%', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
              <div className="pipeline-title" style={{ padding: 0, margin: 0 }}>Performance Scorecard Inbox (TL-Submitted)</div>
              <button 
                onClick={exportPDF}
                style={{ backgroundColor: '#fdf2f8', color: '#db2777', border: '1px solid #fbcfe8', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              >
                <Download size={16} /> Export PDF
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 12px' }}>
                <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input 
                  type="text" 
                  placeholder="Filter by Employee..." 
                  value={scFilterEmp}
                  onChange={(e) => { setScFilterEmp(e.target.value); setScCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px 8px 8px 12px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 12px' }}>
                <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <input 
                  type="text" 
                  placeholder="Filter by TL Name..." 
                  value={scFilterTL}
                  onChange={(e) => { setScFilterTL(e.target.value); setScCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px 8px 8px 12px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', outline: 'none' }}
                />
              </div>
              <div style={{ width: '180px', display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0 12px' }}>
                <Filter size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <select 
                  value={scFilterRating}
                  onChange={(e) => { setScFilterRating(e.target.value); setScCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px 8px 8px 12px', border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', appearance: 'none' }}
                >
                  <option value="All">All Ratings</option>
                  <option value="A">A Band</option>
                  <option value="B">B Band</option>
                  <option value="C">C Band</option>
                  <option value="D">D Band</option>
                </select>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#64748b' }}>Employee Name</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#64748b' }}>Assigned Evaluator (TL)</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#64748b' }}>Performance Band</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#64748b' }}>Feedback Comments</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#64748b' }}>Global Status</th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', color: '#64748b' }}>HR Action</th>
                </tr>
              </thead>
              <tbody>
                {currentScorecards.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic' }}>
                      No scorecards match the current filters.
                    </td>
                  </tr>
                ) : (
                  currentScorecards.map((sc, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '16px 20px', fontWeight: '600' }}>{sc.employee_name}</td>
                      <td style={{ padding: '16px 20px', color: '#475569' }}>{sc.tl_name}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span className="badge-pill bg-pink">{sc.rating}</span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '13px', fontStyle: 'italic', maxWidth: '250px', color: '#475569', lineHeight: '1.5' }}>"{sc.comments}"</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {sc.emp_acknowledged && (
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                              ✅ Emp Ack
                            </span>
                          )}
                          {sc.hr_acknowledged && (
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#16a34a', backgroundColor: 'rgba(34,197,94,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                              ✅ HR Appr
                            </span>
                          )}
                          {!sc.emp_acknowledged && !sc.hr_acknowledged && (
                            <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                              ⏳ Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {sc.hr_acknowledged ? (
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            ✅ Approved
                          </span>
                        ) : (
                          <button
                            className="print-btn"
                            style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', fontWeight: 'bold' }}
                            onClick={async () => {
                              const token = localStorage.getItem('nsg_jwt_token');
                              try {
                                const res = await fetch(`/api/hr-portal/appraisal-scorecards/${sc.id}/acknowledge`, {
                                  method: 'POST',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (res.ok) {
                                  const data = await res.json();
                                  mutateScorecards();
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
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredScorecards.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '13px' }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredScorecards.length)} of {filteredScorecards.length} entries
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button 
                    onClick={() => setScCurrentPage(p => Math.max(1, p - 1))}
                    disabled={scCurrentPage === 1}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: scCurrentPage === 1 ? 'transparent' : 'var(--bg-secondary)', color: scCurrentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: scCurrentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '4px 12px', fontWeight: 'bold', color: '#0f172a' }}>Page {scCurrentPage} of {totalPages}</span>
                  <button 
                    onClick={() => setScCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={scCurrentPage === totalPages}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: scCurrentPage === totalPages ? 'transparent' : 'var(--bg-secondary)', color: scCurrentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: scCurrentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '500' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}

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
              {safePromotions.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '32px 40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No promotions proposed yet. Click "🏅 Propose Promotion" to begin.</td></tr>
              )}
              {safePromotions.map((pr, idx) => {
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
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Select Employee</label>
                <select 
                  value={promoEmpId} 
                  onChange={e => {
                    const id = e.target.value;
                    setPromoEmpId(id);
                    const selEmp = employees.find(emp => emp.id == id);
                    if (selEmp) {
                      setPromoEmpName(selEmp.name);
                      setPromoCurrentTitle(selEmp.designation);
                    } else {
                      setPromoEmpName('');
                      setPromoCurrentTitle('');
                    }
                  }} 
                  required 
                  style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="" disabled>Select Employee...</option>
                  {safeEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Current Title / Designation</label>
                <input type="text" value={promoCurrentTitle} readOnly placeholder="e.g. Junior Developer" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '10px 12px', borderRadius: '8px', outline: 'none', cursor: 'not-allowed' }} />
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
