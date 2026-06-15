import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

const fetcher = url => fetch(url, { headers: { Authorization: `Bearer ${localStorage.getItem('nsg_jwt_token')}` } }).then(res => res.json());
import { Download, CheckCircle, AlertTriangle, Upload, X, FileText, Calculator, CreditCard, Loader } from 'lucide-react';
import { generatePayslipPDF } from '../../../utils/pdfGenerator';
import './Payroll.css';

const TAX_SLABS = [
  { from: 0,       to: 300000,   rate: 0  },
  { from: 300001,  to: 700000,   rate: 5  },
  { from: 700001,  to: 1000000,  rate: 10 },
  { from: 1000001, to: 1200000,  rate: 15 },
  { from: 1200001, to: 1500000,  rate: 20 },
  { from: 1500001, to: Infinity, rate: 30 },
];

const INR = n => `₹${Number(n).toLocaleString('en-IN')}`;

function calcTax(income) {
  let tax = 0;
  for (const s of TAX_SLABS) {
    if (income <= s.from) break;
    const taxable = Math.min(income, s.to) - s.from;
    tax += taxable * s.rate / 100;
  }
  return Math.round(tax);
}

// ─── Sub-tabs ─────────────────────────────────────────────────────────────────

const SUB_TABS = [
  { id: 'payslips', label: 'Payslips',       icon: <FileText size={14} /> },
  { id: 'ctc',      label: 'CTC Breakdown',  icon: <CreditCard size={14} /> },
  { id: 'tds',      label: 'TDS Declaration',icon: <CheckCircle size={14} /> },
  { id: 'tax',      label: 'Tax Calculator', icon: <Calculator size={14} /> },
];

function SubTabs({ active, setActive }) {
  return (
    <div className="pay-tabs" style={{ marginBottom: 20 }}>
      {SUB_TABS.map(t => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          className={`pay-tab ${active === t.id ? 'pay-tab--active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Payslips Tab ─────────────────────────────────────────────────────────────

function PayslipsTab({ employeeId }) {
  const [downloading, setDownloading] = useState(null);
  
  const { data: payslipsData } = useSWR('/api/employee-portal/payroll/my-payslips', fetcher);
  const payslipsList = payslipsData?.items || [];
  const empDetails = payslipsData?.employee_details || {};

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
      {payslipsList.length > 0 ? (
        payslipsList.map(p => (
          <div
            key={p.id}
            className="pay-slip-card"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '16px 20px', borderRadius: 12 }}
          >
            {/* Month + badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--pay-emerald-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={18} color="var(--pay-emerald)" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--pay-text)' }}>
                  {p.month === 4 ? 'April 2026' : p.month === 5 ? 'May 2026' : p.month === 6 ? 'June 2026' : `Month ${p.month} ${p.year || 2026}`}
                </p>
                <span className="pay-slip-badge">Paid</span>
              </div>
            </div>

            {/* Amounts */}
            <div style={{ display: 'flex', gap: 32 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--pay-text-muted)' }}>Gross</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--pay-text)', fontVariantNumeric: 'tabular-nums' }}>
                  {INR((p.basic || 0) + (p.hra || 0) + (p.allowances || 0))}
                </p>
              </div>
              {p.lop > 0 && (
                <div style={{ textAlign: 'center' }}>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--pay-text-muted)' }}>LOP Penalty</p>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--pay-red)', fontVariantNumeric: 'tabular-nums' }}>
                    -{INR(p.lop)}
                  </p>
                </div>
              )}
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--pay-text-muted)' }}>Deductions</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--pay-red)', fontVariantNumeric: 'tabular-nums' }}>
                  -{INR((p.epf || 0) + (p.tds || 0))}
                </p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--pay-text-muted)' }}>Net Pay</p>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--pay-violet)', fontVariantNumeric: 'tabular-nums' }}>
                  {INR(p.net)}
                </p>
              </div>
            </div>

            {/* Download */}
            <button
              className="pay-download-btn"
              onClick={() => handleDownload(p)}
              disabled={downloading === p.id}
              style={{ minWidth: 130, justifyContent: 'center' }}
            >
              {downloading === p.id
                ? <><Loader size={13} className="pay-spin" /> Downloading…</>
                : <><Download size={13} /> Download PDF</>
              }
            </button>
          </div>
        ))
      ) : (
        <div className="pay-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 12 }}>
          <AlertTriangle size={32} color="var(--pay-text-muted)" />
          <p style={{ color: 'var(--pay-text-muted)', fontSize: 13, margin: 0 }}>No monthly payslip ledgers processed or released for your account yet.</p>
        </div>
      )}
    </div>
  );
}

// ─── CTC Breakdown Tab ────────────────────────────────────────────────────────

function CtcBreakdownTab() {
  const { data: ctcData, error } = useSWR('/api/employee-portal/payroll/ctc', fetcher);
  const loading = !ctcData && !error;

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!ctcData) return <div style={{ padding: 20 }}>Failed to load CTC data.</div>;

  return (
    <div className="pay-ctc-grid">
      {/* Earnings */}
      <div className="pay-ctc-table-wrap">
        <div className="pay-ctc-table-head pay-ctc-table-head--earn">💰 Earnings</div>
        {ctcData.earnings.map(r => (
          <div key={r.label} className="pay-ctc-row">
            <span className="pay-ctc-row__name">{r.label}</span>
            <span className="pay-ctc-row__value pay-ctc-row__value--earn">{INR(r.amount)}</span>
          </div>
        ))}
        <div className="pay-ctc-row" style={{ borderTop: '2px solid var(--pay-border)', background: 'var(--pay-bg-inner)' }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--pay-text)' }}>Total Earnings</span>
          <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--pay-emerald)', fontVariantNumeric: 'tabular-nums' }}>{INR(ctcData.total_earnings)}</span>
        </div>
      </div>

      {/* Deductions + Net */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="pay-ctc-table-wrap">
          <div className="pay-ctc-table-head pay-ctc-table-head--deduct">📉 Deductions</div>
          {ctcData.deductions.map(r => (
            <div key={r.label} className="pay-ctc-row">
              <span className="pay-ctc-row__name">{r.label}</span>
              <span className="pay-ctc-row__value pay-ctc-row__value--deduct">-{INR(r.amount)}</span>
            </div>
          ))}
          <div className="pay-ctc-row" style={{ borderTop: '2px solid var(--pay-border)', background: 'var(--pay-bg-inner)' }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--pay-text)' }}>Total Deductions</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: 'var(--pay-red)', fontVariantNumeric: 'tabular-nums' }}>-{INR(ctcData.total_deductions)}</span>
          </div>
        </div>

        <div className="pay-ctc-net">
          <div className="pay-ctc-net__label">Net Take-Home</div>
          <div className="pay-ctc-net__amount">{INR(ctcData.net_take_home)}</div>
          <div className="pay-ctc-net__sub">per month</div>
        </div>
      </div>
    </div>
  );
}

// ─── TDS Declaration Tab ──────────────────────────────────────────────────────

function TdsDeclarationTab({ employeeId }) {
  const { data: declData, mutate: mutateDecl } = useSWR('/api/employee-portal/payroll/tds-declarations', fetcher);
  
  const currentDeclaration = (declData && declData.length > 0) ? {
    status: declData[0].status,
    submitted_at: new Date().toISOString(),
    sec80c: declData.find(d => d.declaration_type === '80C')?.declared_amount || 0,
    hra_rent: declData.find(d => d.declaration_type === 'HRA')?.declared_amount || 0,
    sec80d: 0,
    verified_by: declData[0].verified_by
  } : null;

  const [form, setForm] = useState({ sec80c: '', hra_rent: '', hra_city: 'metro', sec80d: '' });

  const [proof, setProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [tdsImpact, setTdsImpact] = useState(null);
  const fileRef = useRef();
  const debounceRef = useRef();

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const sec80c = Math.min(parseFloat(form.sec80c) || 0, 150000);
      const hra    = parseFloat(form.hra_rent) || 0;
      const sec80d = Math.min(parseFloat(form.sec80d) || 0, 25000);
      const savings = Math.round((sec80c + hra + sec80d) * 0.3);
      setTdsImpact(savings);
    }, 500);
  }, [form]);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) { alert('Max 5MB allowed'); return; }
    if (!['application/pdf', 'image/jpeg'].includes(f.type)) { alert('PDF or JPEG only'); return; }
    setUploading(true);
    setTimeout(() => { setProof(f); setUploading(false); }, 1200);
  }

  async function handleSubmit() {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/payroll/tds-declarations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          sec80c: parseFloat(form.sec80c) || 0,
          hra_rent: parseFloat(form.hra_rent) || 0,
          hra_city: form.hra_city,
          sec80d: parseFloat(form.sec80d) || 0
        })
      });
      if (res.ok) {
        mutateDecl();
      } else {
        alert('Failed to submit TDS declaration.');
      }
    } catch(e) { console.error(e); }
  }

  if (currentDeclaration) {
    const isPending = currentDeclaration.status === 'pending';
    const isVerified = currentDeclaration.status === 'verified';
    const isRejected = currentDeclaration.status === 'rejected';

    return (
      <div className="pay-card">
        {isPending && (
          <div className="pay-banner pay-banner--success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={18} />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13 }}>Declaration Submitted</p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.7 }}>
                Submitted on {new Date(currentDeclaration.submitted_at || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} — under HR review
              </p>
            </div>
          </div>
        )}

        {isVerified && (
          <div className="pay-banner pay-banner--success" style={{ marginBottom: 20, backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle size={18} color="#10B981" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#10B981' }}>Declaration Verified ✓</p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.7, color: 'var(--pay-text)' }}>
                Verified and signed off by {currentDeclaration.verified_by || 'HR Admin'}. Benefits applied to your active tax bracket.
              </p>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="pay-banner pay-banner--error" style={{ marginBottom: 20, backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <X size={18} color="#EF4444" />
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: '#EF4444' }}>Declaration Rejected</p>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.7, color: 'var(--pay-text)' }}>
                Rejected by HR. Please double check details and re-declare.
              </p>
            </div>
            <button 
              onClick={() => {
                // Not ideal, but mutating data to empty locally forces form visibility
                mutateDecl([], false);
              }} 
              style={{ marginLeft: 'auto', background: 'var(--pay-red)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}
            >
              Re-submit
            </button>
          </div>
        )}

        <div style={{ opacity: 0.55, pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="pay-form-field">
            <label className="pay-form-label">Section 80C</label>
            <input className="pay-form-input" value={INR(currentDeclaration.sec80c || 0)} disabled />
          </div>
          <div className="pay-form-field">
            <label className="pay-form-label">HRA – Rent Paid</label>
            <input className="pay-form-input" value={INR(currentDeclaration.hra_rent || 0)} disabled />
          </div>
          <div className="pay-form-field">
            <label className="pay-form-label">Section 80D</label>
            <input className="pay-form-input" value={INR(currentDeclaration.sec80d || 0)} disabled />
          </div>
        </div>
      </div>
    );
  }

  const sec80cVal = parseFloat(form.sec80c) || 0;
  const capPct = Math.min((sec80cVal / 150000) * 100, 100);

  return (
    <div className="pay-card">
      <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--pay-text)' }}>
        Investment Declaration
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* 80C */}
        <div className="pay-form-field">
          <label className="pay-form-label">
            Section 80C — PPF + ELSS + LIC <span style={{ color: 'var(--pay-text-muted)', fontWeight: 400 }}>(max ₹1,50,000)</span>
          </label>
          <input
            type="number"
            className="pay-form-input"
            value={form.sec80c}
            placeholder="₹1,50,000"
            onChange={e => update('sec80c', e.target.value)}
          />
          <div className="pay-cap-bar">
            <div className="pay-cap-bar__track">
              <div
                className={`pay-cap-bar__fill ${capPct >= 100 ? 'pay-cap-bar__fill--over' : capPct > 80 ? 'pay-cap-bar__fill--warn' : ''}`}
                style={{ width: `${capPct}%` }}
              />
            </div>
            <span style={{ fontSize: 10, whiteSpace: 'nowrap' }}>{INR(Math.min(sec80cVal, 150000))} / ₹1,50,000</span>
          </div>
          {sec80cVal > 150000 && <p className="pay-cap-warn">⚠ Exceeds cap — will be capped at ₹1,50,000</p>}
        </div>

        {/* HRA */}
        <div className="pay-form-field">
          <label className="pay-form-label">
            HRA — Monthly Rent <span style={{ color: 'var(--pay-text-muted)', fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="number"
            className="pay-form-input"
            value={form.hra_rent}
            placeholder="₹25,000"
            onChange={e => update('hra_rent', e.target.value)}
          />
          {form.hra_rent && (
            <div className="pay-radio-group" style={{ marginTop: 8 }}>
              {['metro', 'non-metro'].map(c => (
                <label
                  key={c}
                  className={`pay-radio-option ${form.hra_city === c ? 'pay-radio-option--selected' : ''}`}
                  onClick={() => update('hra_city', c)}
                >
                  <input type="radio" name="hra_city" value={c} checked={form.hra_city === c} onChange={() => update('hra_city', c)} />
                  {c === 'metro' ? 'Metro City' : 'Non-Metro'}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 80D */}
        <div className="pay-form-field">
          <label className="pay-form-label">
            Section 80D — Health Insurance <span style={{ color: 'var(--pay-text-muted)', fontWeight: 400 }}>(max ₹25,000)</span>
          </label>
          <input
            type="number"
            className="pay-form-input"
            value={form.sec80d}
            placeholder="₹25,000"
            onChange={e => update('sec80d', e.target.value)}
          />
        </div>

        {/* Upload proof */}
        <div className="pay-form-field">
          <label className="pay-form-label">
            Upload Investment Proof <span style={{ color: 'var(--pay-text-muted)', fontWeight: 400 }}>(PDF or JPEG, max 5MB)</span>
          </label>
          <input type="file" ref={fileRef} accept=".pdf,image/jpeg" style={{ display: 'none' }} onChange={handleFileChange} />
          {proof ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--pay-emerald-dim)', border: '1px solid var(--pay-emerald-border)',
            }}>
              <FileText size={16} color="var(--pay-emerald)" />
              <span style={{ fontSize: 13, flex: 1, color: 'var(--pay-text)' }}>{proof.name}</span>
              <span style={{ fontSize: 11, color: 'var(--pay-text-muted)' }}>{(proof.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => setProof(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--pay-text-muted)' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div
              className="pay-file-upload"
              onClick={() => fileRef.current.click()}
            >
              {uploading ? <Loader size={15} className="pay-spin" /> : <Upload size={15} color="var(--pay-text-dim)" />}
              <span className="pay-file-upload__label">{uploading ? 'Uploading…' : 'Click to upload proof'}</span>
            </div>
          )}
        </div>

        {/* TDS impact */}
        {tdsImpact !== null && tdsImpact > 0 && (
          <div className="pay-tds-estimate">
            <div>
              <div className="pay-tds-estimate__label">Estimated Annual TDS Savings</div>
              <div className="pay-tds-estimate__sub">Based on ~30% tax bracket</div>
            </div>
            <div className="pay-tds-estimate__value">{INR(tdsImpact)}</div>
          </div>
        )}

        <button className="pay-submit-btn" onClick={handleSubmit}>
          Submit Declaration
        </button>
      </div>
    </div>
  );
}

// ─── Tax Calculator Tab ───────────────────────────────────────────────────────

function TaxCalculatorTab() {
  const [income, setIncome] = useState('');
  const [deductions, setDeductions] = useState('');
  const [regime, setRegime] = useState('new');
  const [result, setResult] = useState(null);
  const [visible, setVisible] = useState(false);

  function calculate() {
    const gross = parseFloat(income) || 0;
    const ded   = parseFloat(deductions) || 0;
    const taxable = Math.max(0, gross - ded);
    const tax = calcTax(taxable);
    const cess = Math.round(tax * 0.04);
    setResult({ gross, taxable, tax, cess, total: tax + cess, monthly: Math.round((tax + cess) / 12) });
    setVisible(false);
    setTimeout(() => setVisible(true), 50);
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>
      {/* Inputs */}
      <div className="pay-card">
        <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--pay-text)' }}>Tax Calculator</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="pay-form-field">
            <label className="pay-form-label">Annual Gross Income</label>
            <input type="number" className="pay-form-input" value={income} placeholder="e.g. 1023000" onChange={e => setIncome(e.target.value)} />
          </div>
          <div className="pay-form-field">
            <label className="pay-form-label">Total Deductions (80C + HRA + 80D…)</label>
            <input type="number" className="pay-form-input" value={deductions} placeholder="e.g. 150000" onChange={e => setDeductions(e.target.value)} />
          </div>
          <div className="pay-form-field">
            <label className="pay-form-label">Tax Regime</label>
            <div className="pay-regime-toggle">
              {['new', 'old'].map(r => (
                <button
                  key={r}
                  className={`pay-regime-btn ${regime === r ? 'pay-regime-btn--active' : ''}`}
                  onClick={() => setRegime(r)}
                >
                  {r === 'new' ? 'New Regime' : 'Old Regime'}
                </button>
              ))}
            </div>
          </div>
          <button className="pay-calc-btn" onClick={calculate}>Calculate Tax</button>
        </div>
      </div>

      {/* Results */}
      {result ? (
        <div
          className="pay-card pay-calc-results"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 300ms, transform 300ms' }}
        >
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--pay-text)' }}>Tax Breakdown</h3>
          {[
            { label: 'Gross Income',           val: INR(result.gross),                       color: 'var(--pay-text)' },
            { label: 'Total Deductions',        val: `-${INR(parseFloat(deductions)||0)}`,    color: 'var(--pay-red)' },
            { label: 'Taxable Income',          val: INR(result.taxable),                     color: 'var(--pay-amber)' },
            { label: 'Income Tax',              val: INR(result.tax),                         color: 'var(--pay-red)' },
            { label: 'Health & Ed. Cess (4%)',  val: INR(result.cess),                        color: 'var(--pay-red)' },
          ].map(r => (
            <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--pay-border-subtle)' }}>
              <span style={{ fontSize: 13, color: 'var(--pay-text-dim)' }}>{r.label}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: r.color, fontVariantNumeric: 'tabular-nums' }}>{r.val}</span>
            </div>
          ))}

          {/* Total box */}
          <div style={{
            marginTop: 12, padding: '16px', borderRadius: 12,
            background: 'linear-gradient(135deg, hsl(265,70%,18%), hsl(265,60%,14%))',
            border: '1px solid var(--pay-violet-border)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>Total Tax Liability</p>
              <p style={{ margin: '4px 0 0', fontSize: 24, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
                {INR(result.total)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Monthly TDS</p>
              <p style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: 'var(--pay-amber)', fontVariantNumeric: 'tabular-nums' }}>
                {INR(result.monthly)}
              </p>
            </div>
          </div>

          {/* Slab table */}
          <div style={{ marginTop: 16 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: 'var(--pay-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tax Slabs ({regime === 'new' ? 'New' : 'Old'} Regime)
            </p>
            {TAX_SLABS.filter(s => result.taxable > s.from).map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--pay-border-subtle)', fontSize: 12 }}>
                <span style={{ color: 'var(--pay-text-dim)' }}>
                  {INR(s.from + 1)} – {s.to === Infinity ? 'Above' : INR(s.to)}
                </span>
                <span style={{ fontWeight: 700, color: s.rate > 0 ? 'var(--pay-red)' : 'var(--pay-emerald)' }}>
                  {s.rate}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="pay-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
          <p style={{ color: 'var(--pay-text-muted)', fontSize: 13 }}>Enter your income details and click Calculate</p>
        </div>
      )}
    </div>
  );
}

// ─── Root Payroll ─────────────────────────────────────────────────────────────

export default function Payroll({ currentUser }) {
  const employeeId = currentUser?.id;
  const [activeTab, setActiveTab] = useState('payslips');

  return (
    <div className="component-container pay-root">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="component-header">
        <div>
          <h1>Payroll</h1>
          <p>View payslips, CTC breakdown, TDS declarations, and tax estimates.</p>
        </div>
      </div>

      <SubTabs active={activeTab} setActive={setActiveTab} />

      {activeTab === 'payslips' && <PayslipsTab employeeId={employeeId} />}
      {activeTab === 'ctc'      && <CtcBreakdownTab />}
      {activeTab === 'tds'      && <TdsDeclarationTab employeeId={employeeId} />}
      {activeTab === 'tax'      && <TaxCalculatorTab />}
    </div>
  );
}