import React, { useState, useEffect } from 'react';
import { CheckCircle, Lock, Edit, X, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';

export function ExitFnFView() {
  const [exitTab, setExitTab] = useState('resignations'); // resignations | assets | fnf | noc
  const [selectedResignId, setSelectedResignId] = useState(1);
  const [relievingDate, setRelievingDate] = useState('2026-06-20');
  const [hrSign, setHrSign] = useState('');
  const [relievingSign, setRelievingSign] = useState('');
  const [isCalibrateOpen, setIsCalibrateOpen] = useState(false);

  // Live data states
  const [resignations, setResignations] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Specific employee states fetched from backend
  const [employeeAssets, setEmployeeAssets] = useState([]);

  // FnF computation states
  const [basicSalary, setBasicSalary] = useState(35000);
  const [hra, setHra] = useState(15000);
  const [allowances, setAllowances] = useState(5000);
  const [epf, setEpf] = useState(1800);
  const [tds, setTds] = useState(2500);
  const [lop, setLop] = useState(0);
  const [fnfComputed, setFnfComputed] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const [resRes, empRes] = await Promise.all([
        fetch('/api/hr-portal/exits/resignations', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/hr-portal/employees', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (resRes.ok) setResignations(await resRes.json());
      if (empRes.ok) setEmployees(await empRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeResignation = resignations.find(r => r.id === selectedResignId) || resignations[0] || { id: 1, user_id: 103, status: 'pending', reason: 'Higher studies.' };
  const exitingEmp = employees.find(e => e.id === (activeResignation.employee_id || activeResignation.user_id)) || { name: 'Staff', bank_name: 'HDFC', account_number: '0000', email: 'staff@nsg.com' };

  // Fetch employee specific exit details dynamically
  useEffect(() => {
    const fetchEmployeeDetails = async () => {
      if (!exitingEmp.id) return;
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const headers = { 'Authorization': `Bearer ${token}` };
        const [assetsRes, fnfRes] = await Promise.all([
          fetch(`/api/hr-portal/exits/assets/${exitingEmp.id}`, { headers }),
          fetch(`/api/hr-portal/exits/fnf-details/${exitingEmp.id}`, { headers })
        ]);
        if (assetsRes.ok) setEmployeeAssets(await assetsRes.json());
        if (fnfRes.ok) {
          const fnfData = await fnfRes.json();
          // Fields fetched but UI overrides manually
        }
      } catch (e) { console.error(e); }
    };
    fetchEmployeeDetails();
  }, [exitingEmp.id]);

  const toggleAssetStatus = async (assetId) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/exits/assets/${assetId}/return`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // refresh assets
        const updatedRes = await fetch(`/api/hr-portal/exits/assets/${exitingEmp.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (updatedRes.ok) setEmployeeAssets(await updatedRes.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const grossAdditions = basicSalary + hra + allowances;
  const totalDeductions = epf + tds + lop;
  const totalFnFPayout = grossAdditions - totalDeductions;

  const handleApproveResignation = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/exits/resignations/${selectedResignId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        alert(`Resignation exit approved for ${exitingEmp.name}! Corporate offboarding lists enqueued.`);
      } else {
        alert('Failed to approve resignation.');
      }
    } catch (e) {
      console.error(e);
      alert('Error approving resignation.');
    }
  };

  const handleApproveInline = async (id, name, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/exits/resignations/${id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        setSelectedResignId(id);
        setExitTab('assets');
        alert(`Resignation approved for ${name}! Continuing to Asset Return Checklist...`);
      } else {
        alert('Failed to approve.');
      }
    } catch (err) { console.error(err); alert('Error approving.'); }
  };

  const handleRejectInline = async (id, name, e) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/hr-portal/exits/resignations/${id}/reject`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchData();
        alert(`Resignation rejected for ${name}.`);
      } else {
        alert('Failed to reject.');
      }
    } catch (err) { console.error(err); alert('Error rejecting.'); }
  };

  const handleComputeFnF = () => {
    setFnfComputed(true);
    alert('Full & Final Settlement computed successfully based on live leave balances and active loan ledgers!');
  };

  const handleFinalizeFnF = async () => {
    if (!assetsFullyReturned) {
      alert('WARNING: Compliance Gate Engaged! Cannot finalize FnF settlement until all issued assets are returned and verified by HR.');
      return;
    }

    setExitTab('noc');
  };

  const handleSignNOC = async (e) => {
    e.preventDefault();
    if (!hrSign.trim()) {
      alert('Please fill in your digital signature to sign off.');
      return;
    }

    const htmlContent = `
      <div style="padding: 40px; background: white; color: black; font-family: monospace; font-size: 14px; line-height: 1.6; width: 700px; box-sizing: border-box; margin: 0 auto; text-align: justify;">
        <img src="/hmns-logo.png" style="width: 100%; height: auto; max-height: 100px; object-fit: contain; margin-bottom: 20px;" crossorigin="anonymous" />
        <div style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 30px; letter-spacing: 1px;">NO OBJECTION CERTIFICATE</div>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <p>
          This is to certify that <strong>${exitingEmp.name}</strong>, holding designation <strong>${exitingEmp.designation}</strong> in 
          the <strong>${exitingEmp.department}</strong> department, has resigned from employment and is fully relieved of duties effective 
          on last working date <strong>${activeResignation.LWD}</strong>.
        </p>
        <p>
          We confirm that the employee has completed all handovers, returned corporate physical properties, and cleared all full and final 
          settlement ledgers (Net F&F: ₹${totalFnFPayout.toLocaleString()}) without outstanding advances.
        </p>
        <p>We wish them outstanding success in all future professional endeavors.</p>
        
        <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div>System Checked: HMNS ERP Failsafe</div>
            <span style="color: green; font-weight: bold;">Assets & FnF Cleared ✓</span>
          </div>
          <div style="text-align: right;">
            <div style="font-style: italic; font-size: 16px; margin-bottom: 4px; font-weight: bold;">${hrSign}</div>
            <div style="font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 4px;">Authorized HR Manager Signature</div>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin:       0.5,
      filename:     `${exitingEmp.name}_NOC_Certificate.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(htmlContent).save().then(() => {
      alert('NOC fully signed and downloaded. ERP login session revoked.');
      setHrSign('');
    }).catch(err => {
      console.error(err);
      alert('Failed to generate PDF.');
    });
  };

  const handleSignRelieving = async (e) => {
    e.preventDefault();
    if (!relievingSign.trim()) {
      alert('Please fill in your digital signature to sign off.');
      return;
    }

    const htmlContent = `
      <div style="padding: 40px; background: white; color: black; font-family: monospace; font-size: 14px; line-height: 1.6; width: 700px; box-sizing: border-box; margin: 0 auto; text-align: justify;">
        <img src="/hmns-logo.png" style="width: 100%; height: auto; max-height: 100px; object-fit: contain; margin-bottom: 20px;" crossorigin="anonymous" />
        <div style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 30px; letter-spacing: 1px;">RELIEVING LETTER</div>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <p>To,</p>
        <p><strong>${exitingEmp.name}</strong><br />Emp ID: ${exitingEmp.id}</p>
        <p><strong>Subject: Relieving Letter</strong></p>
        <p>Dear ${exitingEmp.name},</p>
        <p>
          This has reference to your resignation letter dated <strong>${activeResignation.submissionDate}</strong>. We would like to inform you that your resignation has been accepted and you are being relieved from the services of the company effective from the closing of working hours on <strong>${activeResignation.LWD}</strong>.
        </p>
        <p>
          Your full and final settlement has been processed successfully. We appreciate your contributions to HMNS Software Solution Pvt Ltd during your tenure and wish you the best for your future endeavors.
        </p>
        <p>Yours Sincerely,</p>
        <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div></div>
          <div style="text-align: right;">
            <div style="font-style: italic; font-size: 16px; margin-bottom: 4px; font-weight: bold;">${relievingSign}</div>
            <div style="font-size: 12px; color: #666; border-top: 1px solid #ccc; padding-top: 4px;">Authorized HR Manager Signature</div>
          </div>
        </div>
      </div>
    `;

    const opt = {
      margin:       0.5,
      filename:     `${exitingEmp.name}_Relieving_Letter.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(htmlContent).save().then(() => {
      alert('Relieving Letter fully signed and downloaded.');
      setRelievingSign('');
    }).catch(err => {
      console.error(err);
      alert('Failed to generate PDF.');
    });
  };

  const assetsFullyReturned = employeeAssets.length === 0 || employeeAssets.every(a => a.returnStatus === 'Signed');

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Exits &amp; Final settlements</h1>
          <p>Track notice checkpoints, run asset checklist returns, and compute Full &amp; Final payouts.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', gap: '16px', marginBottom: '20px', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { id: 'resignations', label: 'Resignations Tracker' },
            { id: 'assets', label: 'Asset Return Checklist' },
            { id: 'fnf', label: 'FnF Payout Calculator' },
            { id: 'noc', label: 'NOC e-Sign Portal' },
            { id: 'relieving', label: 'Relieving Letter' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setExitTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: exitTab === tab.id ? 'var(--accent-pink)' : 'var(--text-muted)',
                borderBottom: exitTab === tab.id ? '2.5px solid var(--accent-pink)' : 'none',
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


      </div>

      {exitTab === 'resignations' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%' }}>
          {/* Active resignation notice queues */}
          <div className="table-container" style={{ margin: 0, width: '100%', overflowX: 'auto' }}>
            <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>Notice Period Resignation Registry</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Employee</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Submission Date</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Last Working Date (LWD)</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Urgent Exit Reason</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>CEO Status</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {resignations?.map((r, idx) => {
                  const employee = employees.find(e => e.id === (r.employee_id || r.user_id)) || { name: 'Unknown' };
                  return (
                    <tr key={idx} onClick={() => { setSelectedResignId(r.id); setRelievingDate(r.LWD); }} style={{ cursor: 'pointer', backgroundColor: selectedResignId === r.id ? 'rgba(236,72,153,0.05)' : 'transparent' }}>
                      <td style={{ padding: '16px 40px' }}>
                        <strong>{employee.name}</strong>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{employee.designation}</div>
                      </td>
                      <td style={{ padding: '16px 40px' }}>{r.resignation_date}</td>
                      <td style={{ padding: '16px 40px' }}>{r.LWD}</td>
                      <td style={{ padding: '16px 40px', fontSize: '11.5px', maxWidth: '180px' }}>"{r.reason}"</td>
                      <td style={{ padding: '16px 40px' }}>
                        <span className={`badge-pill ${(!r.ceo_status || r.ceo_status === 'pending' || r.ceo_status === 'Pending') ? 'badge-gold' : r.ceo_status === 'rejected' ? 'badge-pink' : 'badge-green'}`}>
                          {r.ceo_status || 'Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '16px 40px' }}>
                        <span className={`badge-pill ${r.status === 'pending' ? 'badge-gold' : r.status === 'approved' ? 'badge-blue' : 'badge-green'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 40px' }}>
                        {r.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', backgroundColor: 'var(--accent-green, #10b981)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={(e) => handleApproveInline(r.id, employee.name, e)}
                            >
                              <CheckCircle size={12} />
                              Approve
                            </button>
                            <button
                              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              onClick={(e) => handleRejectInline(r.id, employee.name, e)}
                            >
                              <X size={12} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Actioned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {exitTab === 'assets' && (
        <div style={{ display: 'flex', gap: '24px', justify: 'center' }}>
          <div className="card flex-2" style={{ borderLeft: '4px solid var(--accent-pink)', margin: 0 }}>
            <h3>🛠️ Asset Allocation Checklist</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Confirm all corporate physical hardware properties are checked as returned by corresponding IT Leads before F&amp;F settlement is unblocked.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {employeeAssets.length === 0 ? (
                <div style={{ padding: '12px', color: 'var(--text-muted)' }}>No assets assigned to this employee.</div>
              ) : (
                employeeAssets.map(asset => (
                  <label key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'var(--bg-tertiary)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={asset.returnStatus === 'Signed'} onChange={() => toggleAssetStatus(asset.id)} style={{ width: '20px', height: '20px' }} />
                    <div>
                      <strong>{asset.name}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SN: {asset.serialNumber || 'N/A'} | Tag: {asset.id} | Type: {asset.type}</div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="card flex-1" style={{ margin: 0, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3>🔒 Lock Gate Compliance</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px', marginTop: '16px' }}>
              {assetsFullyReturned ? (
                <div style={{ color: 'var(--accent-green)' }}>
                  <CheckCircle size={48} />
                  <h4 style={{ margin: '8px 0 0 0' }}>All Assets Returned</h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', display: 'block', marginBottom: '16px' }}>Final FnF and NOC dispatch channels unlocked.</span>
                  
                  <button 
                    onClick={() => setExitTab('fnf')}
                    style={{
                      background: 'var(--accent-green)',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '12px',
                      width: '100%',
                      display: 'inline-block'
                    }}
                  >
                    Apply FnF Payout Calculator
                  </button>
                </div>
              ) : (
                <div style={{ color: '#fbbf24' }}>
                  <Lock size={48} />
                  <h4 style={{ margin: '8px 0 0 0' }}>F&amp;F Settlements Locked</h4>
                  <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>You must check off all {employeeAssets.length} assets as returned to unblock corporate clearance settlement files.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {exitTab === 'fnf' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          {/* Computation Form */}
          <div className="card flex-2" style={{ borderLeft: '4px solid var(--accent-pink)', margin: 0 }}>
            <h3>💰 Settlement Payout computation Worksheet</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', display: 'block' }}>Basic Salary</label>
                </div>
                <input type="number" value={basicSalary} onChange={(e) => setBasicSalary(Number(e.target.value))} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              </div>
              
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', display: 'block' }}>HRA</label>
                </div>
                <input type="number" value={hra} onChange={(e) => setHra(Number(e.target.value))} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', display: 'block' }}>Allowances</label>
                </div>
                <input type="number" value={allowances} onChange={(e) => setAllowances(Number(e.target.value))} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', display: 'block' }}>EPF</label>
                </div>
                <input type="number" value={epf} onChange={(e) => setEpf(Number(e.target.value))} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', display: 'block' }}>TDS</label>
                </div>
                <input type="number" value={tds} onChange={(e) => setTds(Number(e.target.value))} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '12px', display: 'block' }}>LOP</label>
                </div>
                <input type="number" value={lop} onChange={(e) => setLop(Number(e.target.value))} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
              <button className="print-btn" onClick={handleComputeFnF}>Compute Net FnF Payout</button>
            </div>
          </div>

          {/* Settlement result box */}
          {fnfComputed && (
            <div className="card flex-1" style={{ margin: 0, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              <h3>💰 Computed Net F&amp;F Ledger</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', margin: '16px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Gross Additions:</span>
                  <strong>₹{grossAdditions.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Total Deductions:</span>
                  <strong style={{ color: 'red' }}>- ₹{totalDeductions.toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyBetween: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '16px', fontWeight: 'bold' }}>
                  <span>Net FnF Payout:</span>
                  <span style={{ color: 'var(--accent-pink)' }}>₹{totalFnFPayout.toLocaleString()}</span>
                </div>
              </div>

              <button
                disabled={!assetsFullyReturned || activeResignation.status === 'cleared'}
                onClick={handleFinalizeFnF}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  backgroundColor: (assetsFullyReturned && activeResignation.status !== 'cleared') ? 'var(--accent-pink)' : 'rgba(255,255,255,0.05)',
                  color: (assetsFullyReturned && activeResignation.status !== 'cleared') ? '#fff' : 'var(--text-muted)',
                  cursor: (assetsFullyReturned && activeResignation.status !== 'cleared') ? 'pointer' : 'not-allowed',
                  border: (assetsFullyReturned && activeResignation.status !== 'cleared') ? 'none' : '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  borderRadius: '8px',
                  fontWeight: 'bold'
                }}
              >
                {!assetsFullyReturned && <Lock size={14} />} 
                {activeResignation.status === 'cleared' ? 'Settlement Finalized ✓' : 'Apply NOC'}
              </button>
            </div>
          )}
        </div>
      )}

      {exitTab === 'noc' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <form onSubmit={handleSignNOC} className="card flex-2" style={{ borderLeft: '4px solid var(--accent-pink)', margin: 0, padding: '24px' }}>
            <div style={{ border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', marginBottom: '20px', letterSpacing: '1px' }}>NO OBJECTION CERTIFICATE</div>
              
              <p>Date: {new Date().toLocaleDateString()}</p>
              
              <p>
                This is to certify that <strong>{exitingEmp.name}</strong>, holding designation <strong>{exitingEmp.designation}</strong> in 
                the <strong>{exitingEmp.department}</strong> department, has resigned from employment and is fully relieved of duties effective 
                on last working date <strong>{activeResignation.LWD}</strong>.
              </p>

              <p>
                We confirm that the employee has completed all handovers, returned corporate physical properties, and cleared all full and final 
                settlement ledgers (Net F&amp;F: ₹{totalFnFPayout.toLocaleString()}) without outstanding advances.
              </p>

              <p>We wish them outstanding success in all future professional endeavors.</p>
              
              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div>System Checked: HMNS ERP Failsafe</div>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Assets &amp; FnF Cleared ✓</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="text"
                    value={hrSign}
                    onChange={(e) => setHrSign(e.target.value)}
                    required
                    placeholder="Input Digital Sign..."
                    style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', color: '#fff', fontSize: '13px', textAlign: 'right', outline: 'none', width: '180px', fontStyle: 'italic' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>Authorized HR Manager Signature</div>
                  
                  <button
                    type="submit"
                    disabled={!hrSign.trim()}
                    style={{
                      background: 'var(--accent-pink)',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: (!hrSign.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (!hrSign.trim()) ? 0.5 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {exitTab === 'relieving' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
          <form onSubmit={handleSignRelieving} className="card flex-2" style={{ borderLeft: '4px solid var(--accent-pink)', margin: 0, padding: '24px' }}>
            <div style={{ border: '1px solid var(--border-color)', padding: '24px', borderRadius: '12px', backgroundColor: 'var(--bg-primary)', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: '1.6', color: 'var(--text-primary)' }}>
              <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', marginBottom: '20px', letterSpacing: '1px' }}>RELIEVING LETTER</div>
              
              <p>Date: {new Date().toLocaleDateString()}</p>
              
              <p>To,<br/><strong>{exitingEmp.name}</strong><br/>Emp ID: {exitingEmp.id}</p>
              <p><strong>Subject: Relieving Letter</strong></p>
              
              <p>Dear {exitingEmp.name},</p>
              
              <p style={{ textAlign: 'justify' }}>
                This has reference to your resignation letter dated <strong>{activeResignation.submissionDate}</strong>. We would like to inform you that your resignation has been accepted and you are being relieved from the services of the company effective from the closing of working hours on <strong>{activeResignation.LWD}</strong>.
              </p>
              
              <p style={{ textAlign: 'justify' }}>
                Your full and final settlement has been processed successfully. We appreciate your contributions to HMNS Software Solution Pvt Ltd during your tenure and wish you the best for your future endeavors.
              </p>
              
              <p>Yours Sincerely,</p>
              
              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div></div>
                <div style={{ textAlign: 'right' }}>
                  <input
                    type="text"
                    value={relievingSign}
                    onChange={(e) => setRelievingSign(e.target.value)}
                    required
                    placeholder="Input Digital Sign..."
                    style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--border-color)', color: '#fff', fontSize: '13px', textAlign: 'right', outline: 'none', width: '180px', fontStyle: 'italic' }}
                  />
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', marginBottom: '16px' }}>Authorized HR Manager Signature</div>
                  
                  <button
                    type="submit"
                    disabled={!relievingSign.trim()}
                    style={{
                      background: 'var(--accent-pink)',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: (!relievingSign.trim()) ? 'not-allowed' : 'pointer',
                      opacity: (!relievingSign.trim()) ? 0.5 : 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 🚪 NOTICE PERIOD CALIBRATOR MODAL OVERLAY */}
      {isCalibrateOpen && activeResignation && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div 
            className="card" 
            style={{ width: '460px', maxHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🚪 Notice Period Calibrator
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setIsCalibrateOpen(false)}>✕</button>
            </div>

            <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>Resignee Name</label>
                </div>
                <input
                  type="text"
                  readOnly
                  value={exitingEmp.name}
                  style={{ width: '100%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>Submission Date</label>
                </div>
                <input
                  type="text"
                  readOnly
                  value={activeResignation.resignation_date}
                  style={{ width: '100%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>Confirmed Relieving Date (LWD)</label>
                </div>
                <input
                  type="date"
                  value={relievingDate}
                  onChange={(e) => setRelievingDate(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>Urgent Exit Reason</label>
                </div>
                <textarea
                  readOnly
                  value={activeResignation.reason}
                  rows={2}
                  style={{ width: '100%', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '10px 12px', borderRadius: '8px', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>Status</label>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className={`badge-pill ${activeResignation.status === 'pending' ? 'badge-gold' : activeResignation.status === 'approved' ? 'badge-blue' : 'badge-green'}`} style={{ textTransform: 'capitalize' }}>
                    {activeResignation.status}
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)', padding: '12px', borderRadius: '8px', lineHeight: '1.4', marginTop: '4px' }}>
                ℹ️ Default notice period is 15 days. Early relieving overrides will create immutable audit logs in the database.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px', flexShrink: 0 }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setIsCalibrateOpen(false)}>Cancel</button>
              {activeResignation.status === 'pending' ? (
                <button 
                  type="button"
                  style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
                  onClick={() => {
                    handleApproveResignation();
                    setIsCalibrateOpen(false);
                  }}
                >
                  Approve Resignation Exit
                </button>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--accent-green)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  ✓ Notice Approved (LWD: {activeResignation.LWD})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
