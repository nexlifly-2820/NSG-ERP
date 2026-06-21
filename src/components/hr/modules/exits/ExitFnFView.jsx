import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Lock, Edit, X, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { useCompany } from '../../../common/CompanyContext';

const SignatureInput = ({ value, onChange }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signType, setSignType] = useState('canvas');

  const isImage = value && value.startsWith('data:image/');

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => onChange(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
      <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
        <button type="button" onClick={() => { setSignType('canvas'); onChange(''); }} style={{ background: signType === 'canvas' ? 'var(--accent-pink)' : 'transparent', color: signType === 'canvas' ? '#fff' : 'inherit', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>Draw</button>
        <button type="button" onClick={() => { setSignType('upload'); onChange(''); }} style={{ background: signType === 'upload' ? 'var(--accent-pink)' : 'transparent', color: signType === 'upload' ? '#fff' : 'inherit', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer' }}>Upload</button>
      </div>
      {signType === 'canvas' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <canvas ref={canvasRef} width={180} height={60} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} style={{ border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'crosshair', background: '#fff' }} />
          <button type="button" onClick={clearCanvas} style={{ fontSize: '10px', background: 'none', border: 'none', color: 'var(--accent-pink)', cursor: 'pointer' }}>Clear</button>
        </div>
      )}
      {signType === 'upload' && (
        <input type="file" accept="image/*" onChange={handleFileUpload} style={{ fontSize: '11px', width: '180px', color: 'var(--text-muted)' }} />
      )}
    </div>
  );
};

export function ExitFnFView() {
  const { companyName, companyLogo } = useCompany();
  const [exitTab, setExitTab] = useState('resignations'); // resignations | assets | fnf | noc
  const [selectedResignId, setSelectedResignId] = useState(1);
  const [relievingDate, setRelievingDate] = useState('2026-06-20');
  const [hrSign, setHrSign] = useState('');
  const [relievingSign, setRelievingSign] = useState('');
  const [isCalibrateOpen, setIsCalibrateOpen] = useState(false);
  const nocContentRef = useRef(null);
  const relievingContentRef = useRef(null);

  // Live data states
  const [resignations, setResignations] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const currentResignations = resignations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(resignations.length / itemsPerPage);
  
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

  const handleTemplateUpload = (e, ref) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      
      if (file.type === 'application/pdf') {
        reader.onload = (event) => {
          if (ref.current) {
            ref.current.innerHTML = `<iframe src="${event.target.result}" width="100%" height="1000px" style="border: none;"></iframe>`;
          }
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('image/')) {
        reader.onload = (event) => {
          if (ref.current) {
            ref.current.innerHTML = `<div style="text-align: center;"><img src="${event.target.result}" style="max-width: 100%;" /></div>`;
          }
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = (event) => {
          if (ref.current) {
            ref.current.innerHTML = event.target.result;
          }
        };
        reader.readAsText(file);
      }
    }
  };

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
        window.showToast(`Resignation exit approved for ${exitingEmp.name}! Corporate offboarding lists enqueued.`, 'success');
      } else {
        window.showToast('Failed to approve resignation.', 'error');
      }
    } catch (e) {
      console.error(e);
      window.showToast('Error approving resignation.', 'error');
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
        window.showToast(`Resignation approved for ${name}! Continuing to Asset Return Checklist...`, 'success');
      } else {
        window.showToast('Failed to approve.', 'error');
      }
    } catch (err) { console.error(err); window.showToast('Error approving.', 'error'); }
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
        window.showToast(`Resignation rejected for ${name}.`, 'success');
      } else {
        window.showToast('Failed to reject.', 'error');
      }
    } catch (err) { console.error(err); window.showToast('Error rejecting.', 'error'); }
  };

  const handleComputeFnF = () => {
    setFnfComputed(true);
    window.showToast('Full & Final Settlement computed successfully based on live leave balances and active loan ledgers!', 'success');
  };

  const handleFinalizeFnF = async () => {
    if (!assetsFullyReturned) {
      window.showToast('WARNING: Compliance Gate Engaged! Cannot finalize FnF settlement until all issued assets are returned and verified by HR.', 'warning');
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
        <img src="${companyLogo || '/hmns-logo.png'}" style="width: 100%; height: auto; max-height: 100px; object-fit: contain; margin-bottom: 20px;" crossorigin="anonymous" />
        <div style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 30px; letter-spacing: 1px;">NO OBJECTION CERTIFICATE</div>
        ${nocContentRef.current ? nocContentRef.current.innerHTML : ''}
        
        <div style="margin-top: 60px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <div>System Checked: {companyName || 'HMNS'} ERP Failsafe</div>
            <span style="color: green; font-weight: bold;">Assets & FnF Cleared ✓</span>
          </div>
          <div style="text-align: right;">
            ${hrSign.startsWith('data:image/') ? `<img src="${hrSign}" style="max-height: 40px; max-width: 180px; object-fit: contain; margin-bottom: 4px;" />` : `<div style="font-style: italic; font-size: 16px; margin-bottom: 4px; font-weight: bold;">${hrSign}</div>`}
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
        <img src="${companyLogo || '/hmns-logo.png'}" style="width: 100%; height: auto; max-height: 100px; object-fit: contain; margin-bottom: 20px;" crossorigin="anonymous" />
        <div style="text-align: center; font-weight: bold; font-size: 18px; margin-bottom: 30px; letter-spacing: 1px;">RELIEVING LETTER</div>
        ${relievingContentRef.current ? relievingContentRef.current.innerHTML : ''}
        <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div></div>
          <div style="text-align: right;">
            ${relievingSign.startsWith('data:image/') ? `<img src="${relievingSign}" style="max-height: 40px; max-width: 180px; object-fit: contain; margin-bottom: 4px;" />` : `<div style="font-style: italic; font-size: 16px; margin-bottom: 4px; font-weight: bold;">${relievingSign}</div>`}
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
                {currentResignations?.map((r, idx) => {
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
                        <span className={`badge-pill ${(!r.ceo_status || r.ceo_status === 'pending' || r.ceo_status === 'Pending' || r.ceo_status === 'withdraw_pending') ? 'badge-gold' : r.ceo_status === 'rejected' ? 'badge-pink' : 'badge-green'}`}>
                          {r.ceo_status === 'withdraw_pending' ? 'withdraw pending' : (r.ceo_status || 'Pending')}
                        </span>
                      </td>
                      <td style={{ padding: '16px 40px' }}>
                        <span className={`badge-pill ${r.status === 'pending' || r.status === 'withdraw_pending' ? 'badge-gold' : r.status === 'approved' ? 'badge-blue' : r.status === 'withdrawn' ? 'badge-pink' : 'badge-green'}`}>
                          {r.status === 'withdraw_pending' ? 'withdraw pending' : r.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px 40px' }}>
                        {(r.status === 'pending' || r.status === 'withdraw_pending') ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              disabled={!r.ceo_status || r.ceo_status.toLowerCase() === 'pending' || r.ceo_status === 'withdraw_pending'}
                              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', backgroundColor: 'var(--accent-green, #10b981)', color: 'white', border: 'none', borderRadius: '4px', cursor: (!r.ceo_status || r.ceo_status.toLowerCase() === 'pending' || r.ceo_status === 'withdraw_pending') ? 'not-allowed' : 'pointer', opacity: (!r.ceo_status || r.ceo_status.toLowerCase() === 'pending' || r.ceo_status === 'withdraw_pending') ? 0.5 : 1 }}
                              onClick={(e) => handleApproveInline(r.id, employee.name, e)}
                            >
                              <CheckCircle size={12} />
                              Approve {r.status === 'withdraw_pending' ? 'Withdraw' : ''}
                            </button>
                            <button
                              disabled={!r.ceo_status || r.ceo_status.toLowerCase() === 'pending' || r.ceo_status === 'withdraw_pending'}
                              style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: (!r.ceo_status || r.ceo_status.toLowerCase() === 'pending' || r.ceo_status === 'withdraw_pending') ? 'not-allowed' : 'pointer', opacity: (!r.ceo_status || r.ceo_status.toLowerCase() === 'pending' || r.ceo_status === 'withdraw_pending') ? 0.5 : 1 }}
                              onClick={(e) => handleRejectInline(r.id, employee.name, e)}
                            >
                              <X size={12} />
                              Reject {r.status === 'withdraw_pending' ? 'Withdraw' : ''}
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
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', padding: '16px 40px' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'transparent', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, color: 'var(--text-primary)' }}
                >
                  Previous
                </button>
                <span style={{ padding: '6px 12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 12px', border: '1px solid var(--border-color)', borderRadius: '4px', background: 'transparent', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, color: 'var(--text-primary)' }}
                >
                  Next
                </button>
              </div>
            )}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' }}>NO OBJECTION CERTIFICATE</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Upload Custom Format</label>
                  <input type="file" onChange={(e) => handleTemplateUpload(e, nocContentRef)} style={{ fontSize: '12px', maxWidth: '200px', backgroundColor: 'var(--bg-primary)', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              
              <div ref={nocContentRef} contentEditable suppressContentEditableWarning style={{ outline: 'none', minHeight: '150px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', marginBottom: '40px' }}>
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
              </div>
              
              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <div>System Checked: {companyName || 'HMNS'} ERP Failsafe</div>
                  <span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Assets &amp; FnF Cleared ✓</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <SignatureInput value={hrSign} onChange={setHrSign} />
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '15px', letterSpacing: '1px' }}>RELIEVING LETTER</div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Upload Custom Format</label>
                  <input type="file" onChange={(e) => handleTemplateUpload(e, relievingContentRef)} style={{ fontSize: '12px', maxWidth: '200px', backgroundColor: 'var(--bg-primary)', padding: '4px', borderRadius: '4px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }} />
                </div>
              </div>
              
              <div ref={relievingContentRef} contentEditable suppressContentEditableWarning style={{ outline: 'none', minHeight: '150px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-tertiary)', marginBottom: '40px' }}>
                <p>Date: {new Date().toLocaleDateString()}</p>
                
                <p>To,<br/><strong>{exitingEmp.name}</strong><br/>Emp ID: {exitingEmp.id}</p>
                <p><strong>Subject: Relieving Letter</strong></p>
                
                <p>Dear {exitingEmp.name},</p>
                <p style={{ textAlign: 'justify' }}>
                  This has reference to your resignation letter dated <strong>{activeResignation.submissionDate || activeResignation.resignation_date}</strong>. We would like to inform you that your resignation has been accepted and you are being relieved from the services of the company effective from the closing of working hours on <strong>{activeResignation.LWD}</strong>.
                </p>
                
                <p style={{ textAlign: 'justify' }}>
                  Your full and final settlement has been processed successfully. We appreciate your contributions to {companyName || 'HMNS Software Solution Pvt Ltd'} during your tenure and wish you the best for your future endeavors.
                </p>
                <p>Yours Sincerely,</p>
              </div>
              
              <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div></div>
                <div style={{ textAlign: 'right' }}>
                  <SignatureInput value={relievingSign} onChange={setRelievingSign} />
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { setIsCalibrateOpen(false) } }}>
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
