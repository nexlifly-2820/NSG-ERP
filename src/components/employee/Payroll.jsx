import React, { useState } from 'react';
import useSWR from 'swr';

const fetcher = url => fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('nsg_jwt_token')}` } }).then(res => res.json());
import { Download, AlertTriangle, FileText, Loader } from 'lucide-react';
import { generatePayslipPDF } from '../../utils/pdfGenerator';
import './Payroll.css';

const INR = n => `₹${Number(n).toLocaleString('en-IN')}`;

// ─── Payslips Tab ─────────────────────────────────────────────────────────────

function PayslipsTab({ employeeId }) {
  const [downloading, setDownloading] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('last_month');
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState('');
  
  const { data: payslipsData } = useSWR('/api/employee-portal/payroll/my-payslips', fetcher);
  const payslipsList = payslipsData?.items || [];
  const empDetails = payslipsData?.employee_details || {};

  const sortedPayslips = [...payslipsList].sort((a, b) => {
    const yearA = a.year || 2026;
    const yearB = b.year || 2026;
    if (yearA !== yearB) return yearB - yearA;
    return b.month - a.month;
  });

  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  const targetYear = now.getFullYear();
  const targetMonth = now.getMonth() + 1;
  const maxMonthStr = targetMonth.toString().padStart(2, '0');
  const maxInputMonth = `${targetYear}-${maxMonthStr}`;

  const lastMonthPayslips = sortedPayslips.filter(p => (p.year || 2026) === targetYear && p.month === targetMonth);
  
  let displayedPayslips = [];
  if (activeSubTab === 'last_month') {
    displayedPayslips = lastMonthPayslips;
  } else if (activeSubTab === 'history' && selectedHistoryMonth) {
    const [selYear, selMonth] = selectedHistoryMonth.split('-');
    displayedPayslips = sortedPayslips.filter(p => 
      (p.year || 2026) === parseInt(selYear, 10) && 
      p.month === parseInt(selMonth, 10)
    );
  }

  async function handleDownload(p) {
    setDownloading(p.id);

    try {
      const recordToPass = {
        ...p,
        ...empDetails,
        employee_name: empDetails.name || 'Unknown',
      };
      
      await generatePayslipPDF(recordToPass);
    } catch(err) {
      console.error("PDF Generator Error:", err);
      if (window.showToast) {
        window.showToast("Failed to generate PDF: " + err.message, 'error');
      }
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 6, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setActiveSubTab('last_month')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeSubTab === 'last_month' ? 'var(--pay-violet)' : 'var(--pay-bg-hover)',
              color: activeSubTab === 'last_month' ? '#fff' : 'var(--pay-text-muted)',
              fontWeight: 600, fontSize: 13, transition: 'all 0.2s'
            }}
          >
            Last Month
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: activeSubTab === 'history' ? 'var(--pay-violet)' : 'var(--pay-bg-hover)',
              color: activeSubTab === 'history' ? '#fff' : 'var(--pay-text-muted)',
              fontWeight: 600, fontSize: 13, transition: 'all 0.2s'
            }}
          >
            History
          </button>
        </div>

        {activeSubTab === 'history' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--pay-text-muted)', fontWeight: 600 }}>Filter:</span>
            <input 
              type="month"
              value={selectedHistoryMonth}
              max={maxInputMonth}
              onChange={(e) => setSelectedHistoryMonth(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: '1px solid var(--pay-border)',
                background: 'var(--pay-bg)',
                color: 'var(--pay-text)',
                fontSize: 13,
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            {selectedHistoryMonth && (
              <button 
                onClick={() => setSelectedHistoryMonth('')}
                style={{ background: 'none', border: 'none', color: 'var(--pay-text-muted)', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {activeSubTab === 'history' && !selectedHistoryMonth ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 12, border: '1px solid var(--pay-border)', color: 'var(--pay-text-muted)', fontSize: 14 }}>
          Please select month and year
        </div>
      ) : displayedPayslips.length > 0 ? (
        displayedPayslips.map(p => {
          const merged = { ...p, ...empDetails, employee_name: empDetails.name || 'Unknown' };
          const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
          const monthLabel = `${monthNames[(p.month || 1) - 1]} ${p.year || 2026}`;

          const tdStyle = { border: '1px solid #000', padding: '6px 12px', fontSize: '13px', color: '#000' };
          const thStyle = { border: '1px solid #000', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold', textAlign: 'left', color: '#000' };
          
          return (
            <div
              key={p.id}
              className="pay-slip-card"
              style={{ background: '#fff', border: '1px solid var(--pay-border)', borderRadius: 12, padding: 24, marginBottom: 20, overflowX: 'auto' }}
            >
               <div style={{ textAlign: 'center', marginBottom: 20 }}>
                 <h2 style={{ margin: 0, color: '#004A8B', fontSize: 24, fontWeight: 'bold' }}>HMNS Software Solution Pvt Ltd</h2>
               </div>
               
               <div style={{ border: '1px solid #000', minWidth: 700, fontFamily: 'serif' }}>
                 <h3 style={{ textAlign: 'center', margin: '15px 0', fontSize: 16, color: '#000', fontWeight: 'normal' }}>Pay slip for the month of {monthLabel}</h3>
                 
                 <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <tbody>
                      <tr>
                        <td style={{...tdStyle, width: '25%'}}>Employee Code:</td>
                        <td style={{...tdStyle, width: '25%'}}>{merged.id || 'N/A'}</td>
                        <td style={{...tdStyle, width: '25%'}}>PF Number:</td>
                        <td style={{...tdStyle, width: '25%'}}>{merged.pf_number || ''}</td>
                      </tr>
                      <tr>
                        <td style={tdStyle}>Employee Name:</td>
                        <td style={tdStyle}>{merged.name || merged.employee_name || 'N/A'}</td>
                        <td style={tdStyle}>UAN:</td>
                        <td style={tdStyle}>{merged.uan || ''}</td>
                      </tr>
                      <tr>
                        <td style={tdStyle}>Designation:</td>
                        <td style={tdStyle}>{merged.designation || 'N/A'}</td>
                        <td style={tdStyle}>ESI Number:</td>
                        <td style={tdStyle}>{merged.esi_number || ''}</td>
                      </tr>
                      <tr>
                        <td style={tdStyle}>Location:</td>
                        <td style={tdStyle}>{merged.location || 'N/A'}</td>
                        <td style={tdStyle}>PAN:</td>
                        <td style={tdStyle}>{merged.pan_number || merged.pan || ''}</td>
                      </tr>
                    </tbody>
                 </table>

                 <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
                    <tbody>
                      <tr>
                        <td style={{...tdStyle, width: '25%'}}>DOJ:</td>
                        <td style={{...tdStyle, width: '25%'}}>{merged.doj || 'N/A'}</td>
                        <td style={{...tdStyle, width: '25%'}}>Arrear Days:</td>
                        <td style={{...tdStyle, width: '25%'}}>{Number(merged.arrear_days || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={tdStyle}>Days In Month:</td>
                        <td style={tdStyle}>22</td>
                        <td style={tdStyle}>LOP Days:</td>
                        <td style={tdStyle}>{Number(merged.lop_days || merged.lop || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={tdStyle}>Worked Days:</td>
                        <td style={tdStyle}>{merged.worked_days != null ? merged.worked_days : '22'}</td>
                        <td style={tdStyle}>LOP Days Reversed:</td>
                        <td style={tdStyle}>{Number(merged.lop_days_reversed || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                 </table>

                 <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: 'none' }}>
                    <thead>
                      <tr>
                        <th style={{...thStyle, width: '30%'}}>Earnings</th>
                        <th style={{...thStyle, width: '15%'}}>Actual</th>
                        <th style={{...thStyle, width: '15%'}}>Earned</th>
                        <th colSpan="2" style={{...thStyle, width: '40%'}}>Deductions</th>
                      </tr>
                    </thead>
                    <tbody>
                       <tr>
                         <td style={tdStyle}>Basic Salary</td>
                         <td style={tdStyle}>{Number(merged.basic || 0).toFixed(2)}</td>
                         <td style={tdStyle}>{Number(merged.basic || 0).toFixed(2)}</td>
                         <td style={{...tdStyle, borderRight: 'none', width: '20%'}}>EPF</td>
                         <td style={{...tdStyle, borderLeft: 'none', width: '20%', textAlign: 'right'}}>{Number(merged.epf || 0).toFixed(2)}</td>
                       </tr>
                       <tr>
                         <td style={tdStyle}>HRA</td>
                         <td style={tdStyle}>{Number(merged.hra || 0).toFixed(2)}</td>
                         <td style={tdStyle}>{Number(merged.hra || 0).toFixed(2)}</td>
                         <td style={{...tdStyle, borderRight: 'none'}}>TDS</td>
                         <td style={{...tdStyle, borderLeft: 'none', textAlign: 'right'}}>{Number(merged.tds || 0).toFixed(2)}</td>
                       </tr>
                       <tr>
                         <td style={tdStyle}>Allowances</td>
                         <td style={tdStyle}>{Number(merged.allowances || 0).toFixed(2)}</td>
                         <td style={tdStyle}>{Number(merged.allowances || 0).toFixed(2)}</td>
                         <td style={{...tdStyle, borderRight: 'none'}}>LOP</td>
                         <td style={{...tdStyle, borderLeft: 'none', textAlign: 'right'}}>{Number(merged.lop || 0).toFixed(2)}</td>
                       </tr>
                       <tr>
                         <td style={thStyle}>Totals:</td>
                         <td style={thStyle}>{Number((merged.basic||0) + (merged.hra||0) + (merged.allowances||0)).toFixed(2)}</td>
                         <td style={thStyle}>{Number((merged.basic||0) + (merged.hra||0) + (merged.allowances||0)).toFixed(2)}</td>
                         <td style={{...thStyle, borderRight: 'none'}}></td>
                         <td style={{...thStyle, borderLeft: 'none', textAlign: 'right'}}>{Number((merged.epf||0) + (merged.tds||0) + (merged.lop||0)).toFixed(2)}</td>
                       </tr>
                    </tbody>
                 </table>

                 <div style={{ padding: '12px 16px', fontWeight: 'bold', fontSize: 14, color: '#000' }}>
                   Net Pay: {Number(merged.net || 0).toFixed(2)}
                 </div>
               </div>

               <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
                 <button
                    className="pay-download-btn"
                    onClick={() => handleDownload(p)}
                    disabled={downloading === p.id}
                    style={{ minWidth: 200, justifyContent: 'center', background: '#fff', border: '1px solid var(--pay-border)', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, color: 'var(--pay-text)' }}
                  >
                    {downloading === p.id
                      ? <><Loader size={16} className="pay-spin" /> Downloading PDF…</>
                      : <><Download size={16} /> Download PDF</>
                    }
                  </button>
               </div>
            </div>
          );
        })
      ) : (
        <div className="pay-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12 }}>
          <AlertTriangle size={32} color="var(--pay-text-muted)" />
          <p style={{ color: 'var(--pay-text-muted)', fontSize: 13, margin: 0 }}>
            {activeSubTab === 'last_month' ? 'No recent payslip available.' : 'No historical payslips found.'}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Root Payroll ─────────────────────────────────────────────────────────────

export default function Payroll({ currentUser }) {
  const employeeId = currentUser?.id;

  return (
    <div className="component-container pay-root">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="component-header">
        <div>
          <h1>Payroll</h1>
          <p>View and download your monthly payslips.</p>
        </div>
      </div>

      <PayslipsTab employeeId={employeeId} />
    </div>
  );
}