import React, { useState, useEffect, useRef } from 'react';
import { Loader, CheckCircle, Search, AlertCircle, FileText, IndianRupee, History, DollarSign, X, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';
import { generatePayslipPDF } from '../../../../utils/pdfGenerator';
import PayrollEntryRow from './PayrollEntryRow';
import './CeoPayroll.css';

export default function CeoPayroll() {
  const payslipContentRef = useRef(null);

  // Helper for Number to Words
  const numberToWords = (num) => {
    if (num === 0) return 'Zero';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const inWords = (n) => {
        let str = '';
        if (n > 99) { str += a[Math.floor(n / 100)] + ' Hundred '; n %= 100; }
        if (n > 19) { str += b[Math.floor(n / 10)] + ' '; n %= 10; }
        if (n > 0) str += a[n] + ' ';
        return str;
    };
    let words = '';
    if (num >= 10000000) { words += inWords(Math.floor(num / 10000000)) + 'Crore '; num %= 10000000; }
    if (num >= 100000) { words += inWords(Math.floor(num / 100000)) + 'Lakh '; num %= 100000; }
    if (num >= 1000) { words += inWords(Math.floor(num / 1000)) + 'Thousand '; num %= 1000; }
    if (num > 0) words += inWords(num);
    let finalStr = words.trim() + ' Rupees only';
    return finalStr.charAt(0).toUpperCase() + finalStr.slice(1).toLowerCase();
  };

  const [activeTab, setActiveTab] = useState('pending'); // pending or history
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-indexed month
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [loading, setLoading] = useState(false);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  
  // Payment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  
  // PDF Fields State
  const [workedDays, setWorkedDays] = useState('');
  const [arrearDays, setArrearDays] = useState('');
  const [lopDays, setLopDays] = useState('');
  const [lopDaysReversed, setLopDaysReversed] = useState('');
  const [letterheadUrl, setLetterheadUrl] = useState('/hmns-logo.png');
  const [hasCustomTemplate, setHasCustomTemplate] = useState(false);
  const [templateKey, setTemplateKey] = useState(0); // Used to force re-render of the editor
  const [globalTemplateHtml, setGlobalTemplateHtml] = useState(null);
  
  // Notification State
  const [notification, setNotification] = useState(null);

  const fetchGlobalTemplate = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/ceo-portal/payroll/global-template/payslip', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalTemplateHtml(data.html_content);
      }
    } catch (e) {
      console.error("Failed to fetch global template", e);
    }
  };

  useEffect(() => {
    setSelectedDate(null);
    if (activeTab === 'pending') fetchPending();
    else fetchHistory();
    fetchGlobalTemplate();
  }, [activeTab, month, year]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  async function fetchPending() {
    setLoading(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/ceo-portal/payroll/pending?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPendingRecords(data);
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to fetch pending payroll', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory() {
    setLoading(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/ceo-portal/payroll/history?month=${month}&year=${year}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data);
      }
    } catch (e) {
      console.error(e);
      showNotification('Failed to fetch payroll history', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Handle inline edit
  const handleEdit = (userId, field, value) => {
    const val = parseFloat(value) || 0;
    setPendingRecords(prev => prev.map(r => {
      if (r.employee_id === userId) {
        const newRecord = { ...r, [field]: val };
        // Recalculate net
        const gross = newRecord.basic + newRecord.hra + newRecord.allowances + newRecord.bonus;
        const deductions = newRecord.epf + newRecord.tds + newRecord.lop;
        newRecord.net = gross - deductions;
        return newRecord;
      }
      return r;
    }));
  };

  const openPaymentModal = (user) => {
    if (!user.basic || user.basic <= 0) {
      showNotification('Basic salary is mandatory to process payment.', 'error');
      return;
    }
    setSelectedUser(user);
    setTransactionRef('');
    setPaymentMethod('Bank Transfer');
    setWorkedDays('');
    setArrearDays('');
    setLopDays('');
    setLopDaysReversed('');
    setLetterheadUrl('/hmns-logo.png');
    setHasCustomTemplate(false);
    setTemplateKey(prev => prev + 1);
    setShowModal(true);

    setTimeout(() => {
        if (globalTemplateHtml && payslipContentRef.current) {
            payslipContentRef.current.innerHTML = globalTemplateHtml;
            setHasCustomTemplate(true);
        }
    }, 100);
  };

  const handleLetterheadUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setLetterheadUrl(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateUpload = async (e, isGlobal = false) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      let pagesHtml = '';
      try {
        if (file.type === 'application/pdf') {
          const pdfjsLib = await import('pdfjs-dist');
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.mjs`;
          
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
          
          for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 2.0 });
              
              const canvas = document.createElement('canvas');
              const context = canvas.getContext('2d');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              
              await page.render({ canvasContext: context, viewport }).promise;
              const imgData = canvas.toDataURL('image/jpeg', 0.8);
              const cssHeight = (viewport.height / viewport.width) * 100;
              
              pagesHtml += `
                <div style="position: relative; width: 100%; padding-bottom: ${cssHeight}%; background-image: url('${imgData}'); background-size: cover; background-repeat: no-repeat; background-position: top center; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
                  <div contentEditable="true" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; padding: 40px; outline: none; z-index: 10; font-family: sans-serif; min-height: 100%;">
                    <div><br/></div>
                  </div>
                </div>
              `;
          }
        } else if (file.name.endsWith('.docx')) {
          const token = localStorage.getItem('nsg_jwt_token');
          const formData = new FormData();
          formData.append('file', file);
          const res = await fetch('/api/ceo-portal/payroll/convert-document', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
          });
          const data = await res.json();
          pagesHtml = data.html || "<div>Failed to convert document</div>";
        } else if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          pagesHtml = await new Promise((resolve) => {
              reader.onload = (event) => resolve(`<div style="text-align: center;"><img src="${event.target.result}" style="max-width: 100%;" /></div>`);
              reader.readAsDataURL(file);
          });
        } else {
          pagesHtml = await file.text();
        }

        if (isGlobal) {
            const token = localStorage.getItem('nsg_jwt_token');
            await fetch('/api/ceo-portal/payroll/global-template', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ template_type: 'payslip', html_content: pagesHtml })
            });
            setGlobalTemplateHtml(pagesHtml);
            showNotification('Global Default Template Updated Successfully!', 'success');
            e.target.value = null;
        } else {
            if (payslipContentRef.current) {
                payslipContentRef.current.innerHTML = pagesHtml;
                setHasCustomTemplate(true);
            }
        }
      } catch (err) {
        console.error(err);
        showNotification('Error parsing document', 'error');
      } finally {
        setLoading(false);
      }
    }
  };

  const clearCustomTemplate = () => {
    setHasCustomTemplate(false);
    setTemplateKey(prev => prev + 1);
  };

  const downloadPreview = async () => {
    if (!payslipContentRef.current) return;
    showNotification('Generating preview PDF...', 'info');
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = payslipContentRef.current.innerHTML;
      tempDiv.style.padding = hasCustomTemplate ? '0' : '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(tempDiv);
      
      const opt = {
        margin: hasCustomTemplate ? 0 : 10,
        filename: `Preview_Payslip_${selectedUser?.employee_name || 'Template'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(tempDiv).save();
      document.body.removeChild(tempDiv);
    } catch(err) {
      console.error("PDF ERROR:", err);
      showNotification(`Failed to generate preview: ${err.message}`, 'error');
    }
  };

  const processPayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/ceo-portal/payroll/process/${selectedUser.employee_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          month,
          year,
          basic: selectedUser.basic,
          hra: selectedUser.hra,
          allowances: selectedUser.allowances,
          bonus: selectedUser.bonus,
          epf: selectedUser.epf,
          tds: selectedUser.tds,
          lop: selectedUser.lop,
          payment_method: paymentMethod,
          transaction_ref: transactionRef,
          payment_date: paymentDate,
          worked_days: parseFloat(workedDays) || null,
          arrear_days: parseFloat(arrearDays) || 0,
          lop_days: parseFloat(lopDays) || 0,
          lop_days_reversed: parseFloat(lopDaysReversed) || 0,
          custom_payslip_html: payslipContentRef.current ? payslipContentRef.current.innerHTML : null
        })
      });

      if (res.ok) {
        showNotification('Payroll processed successfully!');
        setShowModal(false);
        fetchPending();
      } else {
        showNotification('Failed to process payroll', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('An error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };
  const processAllPending = async () => {
    if (pendingRecords.length === 0) return;

    const missingBasic = pendingRecords.filter(r => !r.basic || r.basic <= 0);
    if (missingBasic.length > 0) {
      showNotification(`Basic salary is mandatory. Missing for: ${missingBasic.map(m => m.employee_name).join(', ')}`, 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to process payroll for all ${pendingRecords.length} pending employees?`)) return;

    setLoading(true);
    let successCount = 0;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      for (const user of pendingRecords) {
        const res = await fetch(`/api/ceo-portal/payroll/process/${user.employee_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            month,
            year,
            basic: user.basic,
            hra: user.hra,
            allowances: user.allowances,
            bonus: user.bonus,
            epf: user.epf,
            tds: user.tds,
            lop: user.lop,
            payment_method: 'Bank Transfer',
            transaction_ref: 'BULK-PROCESS-' + new Date().getTime(),
            worked_days: null,
            arrear_days: 0,
            lop_days: 0,
            lop_days_reversed: 0
          })
        });
        if (res.ok) successCount++;
      }
      showNotification(`Successfully processed ${successCount} payrolls.`);
      fetchPending();
    } catch (e) {
      console.error(e);
      showNotification('An error occurred during bulk processing', 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async (record) => {
    try {
      if (record.custom_payslip_html) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = record.custom_payslip_html;
        tempDiv.style.padding = '20px';
        tempDiv.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(tempDiv);
        
        const opt = {
          margin: 10,
          filename: `Payslip_${record.employee_name}_${record.month}_${record.year}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        await html2pdf().set(opt).from(tempDiv).save();
        document.body.removeChild(tempDiv);
        showNotification(`Downloaded custom PDF for ${record.employee_name}`, 'success');
      } else {
        await generatePayslipPDF(record);
        showNotification(`Downloaded PDF for ${record.employee_name}`, 'success');
      }
    } catch(err) {
      console.error("PDF ERROR:", err);
      showNotification(`Failed to generate PDF: ${err.message}`, 'error');
    }
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDay = new Date(year, month - 1, 1).getDay(); // 0 (Sun) to 6 (Sat)
    
    const recordsByDate = {};
    historyRecords.forEach(r => {
      if (r.payment_date) {
        const d = r.payment_date.split('T')[0];
        if (!recordsByDate[d]) recordsByDate[d] = 0;
        recordsByDate[d]++;
      }
    });

    const days = [];
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    weekDays.forEach(wd => days.push(<div key={`header-${wd}`} className="calendar-day-header">{wd}</div>));
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const mStr = month.toString().padStart(2, '0');
      const dStr = i.toString().padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      
      const count = recordsByDate[dateStr] || 0;
      const isSelected = selectedDate === dateStr;
      
      days.push(
        <div 
          key={`day-${i}`} 
          className={`calendar-day ${count > 0 ? 'has-payment' : ''} ${isSelected ? 'selected' : ''}`}
          onClick={() => {
            if (selectedDate === dateStr) setSelectedDate(null);
            else setSelectedDate(dateStr);
          }}
        >
          <span className="day-number">{i}</span>
          {count > 0 && <span className="payment-badge">{count} Paid</span>}
        </div>
      );
    }
    
    return (
      <div className="ceo-payroll-calendar">
        {days}
      </div>
    );
  };

  const displayedHistory = selectedDate 
    ? historyRecords.filter(r => r.payment_date && r.payment_date.startsWith(selectedDate))
    : historyRecords;

  return (
    <div className="ceo-payroll-container">
      <div className="ceo-payroll-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <h1 style={{ fontSize: '28px', color: '#1f2937', fontWeight: 'bold', margin: '0' }}>Payroll Processing</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', backgroundColor: '#f3f4f6', padding: '8px 16px', borderRadius: '8px' }}>
            <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '4px' }}>Global Default PDF Format</span>
            <input 
              type="file" 
              onChange={(e) => handleTemplateUpload(e, true)} 
              title="Upload PDF or DOCX format that will apply to all new payslips automatically"
              style={{ fontSize: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <select className="select-input" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
              {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <input type="number" className="select-input" value={year} onChange={(e) => setYear(parseInt(e.target.value))} style={{ width: '80px' }} />
          </div>
        </div>
      </div>

      {notification && (
        <div className={`ceo-payroll-notify ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {notification.msg}
        </div>
      )}

      <div className="ceo-payroll-tabs" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>
            <DollarSign size={16} /> Pending Payroll
          </button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>
            <History size={16} /> History & Payslips
          </button>
        </div>
        {activeTab === 'pending' && pendingRecords.length > 0 && (
          <button className="ceo-btn ceo-btn-primary" onClick={processAllPending}>
            Process All ({pendingRecords.length})
          </button>
        )}
      </div>

      {loading && <div className="ceo-payroll-loader"><Loader className="spin" size={24}/> Processing...</div>}

      {!loading && activeTab === 'pending' && (
        <div className="ceo-payroll-card">
          <div className="table-responsive">
            <table className="ceo-payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Basic (Edit)</th>
                  <th>HRA (Edit)</th>
                  <th>Bonus (Edit)</th>
                  <th>LOP (Edit)</th>
                  <th>EPF (Edit)</th>
                  <th>TDS (Edit)</th>
                  <th>Deductions</th>
                  <th>Net Payable</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRecords.length === 0 ? (
                  <tr><td colSpan="10" className="empty-state">No pending payrolls for this month.</td></tr>
                ) : (
                  pendingRecords.map(r => (
                    <PayrollEntryRow 
                      key={r.employee_id} 
                      record={r} 
                      onEdit={handleEdit} 
                      onProcess={openPaymentModal} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'history' && (
        <>
          <div className="ceo-payroll-card" style={{ marginBottom: '24px', padding: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '16px', color: '#1e293b' }}>Payment Calendar</h3>
            {renderCalendar()}
            {selectedDate && (
              <div style={{ marginTop: '12px', fontSize: '14px', color: '#2563eb', display: 'flex', justifyContent: 'space-between' }}>
                <span>Showing payments for: <strong>{selectedDate}</strong></span>
                <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>Clear Filter</button>
              </div>
            )}
          </div>
          <div className="ceo-payroll-card">
            <div className="table-responsive">
              <table className="ceo-payroll-table">
                <thead>
                  <tr>
                  <th>Employee</th>
                  <th>Month/Year</th>
                  <th>Payment Date</th>
                  <th>Payment Method</th>
                  <th>Transaction Ref</th>
                  <th>Net Paid</th>
                  <th>Action</th>
                </tr>
              </thead>
                <tbody>
                  {displayedHistory.length === 0 ? (
                    <tr><td colSpan="6" className="empty-state">No payroll history found for this period.</td></tr>
                  ) : (
                    displayedHistory.map(r => (
                      <tr key={r.id}>
                        <td>{r.employee_name}</td>
                        <td>{r.month} / {r.year}</td>
                        <td><span className="badge method">{r.payment_method}</span></td>
                        <td className="mono">{r.transaction_ref}</td>
                        <td className="amount-col net-pay">₹{Math.round(r.net).toLocaleString()}</td>
                        <td>
                          <button className="btn-download" onClick={() => downloadPDF(r)}>
                            <FileText size={14} /> Download PDF
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showModal && selectedUser && (
        <div className="ceo-modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '40px', overflowY: 'auto' }}>
          <div className="ceo-modal" style={{ width: '1100px', maxWidth: '95vw', display: 'flex', flexDirection: 'column' }}>
            <div className="ceo-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3>Confirm Payment & Payslip Review</h3>
                <p>For {selectedUser.employee_name} ({selectedUser.role.toUpperCase()})</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0, marginTop: '2px' }}>
                <X size={20} />
              </button>
            </div>
            
            <div className="ceo-modal-body" style={{ display: 'flex', gap: '24px', padding: '24px' }}>
              
              {/* Left Column: Configuration */}
              <div style={{ flex: '0 0 320px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="payment-summary">
                  <span>Net Payable:</span>
                  <span className="net-pay-large">₹{Math.round(selectedUser.net).toLocaleString()}</span>
                </div>
                
                <div className="form-group">
                  <label>Payment Method</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
                    <option>Bank Transfer</option>
                    <option>Cheque</option>
                    <option>Cash</option>
                    <option>UPI</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Transaction Reference ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. UTR123456789" 
                    value={transactionRef}
                    onChange={e => setTransactionRef(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="form-group">
                  <label>Payment Date</label>
                  <input 
                    type="date" 
                    value={paymentDate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setPaymentDate(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>

                <hr style={{ margin: '8px 0', border: '1px solid #e2e8f0' }} />
                <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#334155' }}>Payslip Overrides</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Worked Days</label>
                    <input type="number" placeholder="e.g. 22" value={workedDays} onChange={e => setWorkedDays(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>Arrear Days</label>
                    <input type="number" value={arrearDays} onChange={e => setArrearDays(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>LOP Days</label>
                    <input type="number" value={lopDays} onChange={e => setLopDays(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label>LOP Reversed</label>
                    <input type="number" value={lopDaysReversed} onChange={e => setLopDaysReversed(e.target.value)} />
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Upload Letterhead (Logo)</label>
                  <input type="file" accept="image/*" onChange={handleLetterheadUpload} style={{ width: '100%', fontSize: '13px' }} />
                </div>

                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>Upload Custom Payslip Format (Any File)</label>
                  <input type="file" onChange={(e) => handleTemplateUpload(e, false)} style={{ width: '100%', fontSize: '13px', marginBottom: hasCustomTemplate ? '8px' : '0' }} id="custom-template-upload" />
                  {hasCustomTemplate && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        onClick={clearCustomTemplate}
                        style={{ padding: '6px 12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}
                      >
                        <X size={14} /> Remove Template
                      </button>
                      <button 
                        onClick={downloadPreview}
                        style={{ padding: '6px 12px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', flex: 1, justifyContent: 'center' }}
                      >
                        <Download size={14} /> Download Preview
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 'auto', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn-confirm" onClick={processPayment} disabled={loading} style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    {loading ? 'Processing...' : 'Process to Pay'}
                  </button>
                  <button className="btn-cancel" onClick={() => setShowModal(false)} style={{ width: '100%', padding: '12px' }}>Cancel</button>
                </div>
              </div>

              {/* Right Column: Live PDF WYSIWYG Editor */}
              <div style={{ flex: '1', backgroundColor: '#e2e8f0', padding: '24px', borderRadius: '8px', overflowY: 'auto', maxHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', maxWidth: '210mm', display: 'flex', justifyContent: 'flex-end', marginBottom: '12px', flexShrink: 0, paddingRight: '4px' }}>
                   <button 
                     onClick={downloadPreview}
                     style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                   >
                     <Download size={16} /> Download PDF Preview
                   </button>
                </div>
                <div
                  key={templateKey}
                  ref={payslipContentRef}
                  contentEditable
                  suppressContentEditableWarning
                  style={{ width: '210mm', minHeight: '297mm', backgroundColor: '#fff', padding: '20mm', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontFamily: 'Times New Roman, Times, serif', fontSize: '13px', color: '#000', outline: 'none' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '2px solid #4CAF50', paddingBottom: '16px', marginBottom: '24px' }}>
                    <img src={letterheadUrl} alt="Logo" style={{ maxHeight: '60px', objectFit: 'contain', marginBottom: '12px' }} crossorigin="anonymous" />
                  </div>
                  
                  <div style={{ textAlign: 'center', fontSize: '16px', fontWeight: 'bold', textDecoration: 'underline', marginBottom: '24px' }}>
                    Pay slip for the month of {new Date(year, month - 1).toLocaleString('default', { month: 'long' })} {year}
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid #000' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}><strong>Employee Code:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}>{selectedUser.employee_id || 'N/A'}</td>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}><strong>PF Number:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}>{selectedUser.pf_number || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>Employee Name:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{selectedUser.employee_name}</td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>UAN:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{selectedUser.uan || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>Designation:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{selectedUser.role.toUpperCase()}</td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>ESI Number:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{selectedUser.esi_number || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>Location:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{selectedUser.location || 'N/A'}</td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>PAN:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{selectedUser.pan_number || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid #000' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}><strong>DOJ:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}>{selectedUser.doj || 'N/A'}</td>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}><strong>Arrear Days:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}>{parseFloat(arrearDays || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>Days In Month:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>22</td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>LOP Days:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{parseFloat(lopDays || 0).toFixed(2)}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>Worked Days:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{workedDays || 22}</td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>LOP Days Reversed:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{parseFloat(lopDaysReversed || 0).toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px', border: '1px solid #000', textAlign: 'right' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '8px', border: '1px solid #000', textAlign: 'left', width: '30%' }}>Earnings</th>
                        <th style={{ padding: '8px', border: '1px solid #000', width: '20%' }}>Actual</th>
                        <th style={{ padding: '8px', border: '1px solid #000', width: '20%' }}>Earned</th>
                        <th style={{ padding: '8px', border: '1px solid #000', width: '30%' }}>Deductions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'left', verticalAlign: 'top' }}>
                          {selectedUser.basic > 0 && <div style={{ marginBottom: '4px' }}>Basic Salary</div>}
                          {selectedUser.hra > 0 && <div style={{ marginBottom: '4px' }}>HRA</div>}
                          {selectedUser.allowances > 0 && <div style={{ marginBottom: '4px' }}>Allowances</div>}
                          {selectedUser.basic === 0 && selectedUser.hra === 0 && <div style={{ marginBottom: '4px' }}>Stipend / Basic</div>}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #000', verticalAlign: 'top' }}>
                          {selectedUser.basic > 0 && <div style={{ marginBottom: '4px' }}>{selectedUser.basic.toFixed(2)}</div>}
                          {selectedUser.hra > 0 && <div style={{ marginBottom: '4px' }}>{selectedUser.hra.toFixed(2)}</div>}
                          {selectedUser.allowances > 0 && <div style={{ marginBottom: '4px' }}>{selectedUser.allowances.toFixed(2)}</div>}
                          {selectedUser.basic === 0 && selectedUser.hra === 0 && <div style={{ marginBottom: '4px' }}>{selectedUser.net.toFixed(2)}</div>}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #000', verticalAlign: 'top' }}>
                          {selectedUser.basic > 0 && <div style={{ marginBottom: '4px' }}>{selectedUser.basic.toFixed(2)}</div>}
                          {selectedUser.hra > 0 && <div style={{ marginBottom: '4px' }}>{selectedUser.hra.toFixed(2)}</div>}
                          {selectedUser.allowances > 0 && <div style={{ marginBottom: '4px' }}>{selectedUser.allowances.toFixed(2)}</div>}
                          {selectedUser.basic === 0 && selectedUser.hra === 0 && <div style={{ marginBottom: '4px' }}>{selectedUser.net.toFixed(2)}</div>}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #000', verticalAlign: 'top' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ textAlign: 'left' }}>EPF</span>
                            <span>{selectedUser.epf.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ textAlign: 'left' }}>TDS</span>
                            <span>{selectedUser.tds.toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ textAlign: 'left' }}>LOP</span>
                            <span>{selectedUser.lop.toFixed(2)}</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px', border: '1px solid #000', textAlign: 'left' }}><strong>Totals:</strong></td>
                        <td style={{ padding: '8px', border: '1px solid #000' }}><strong>{(selectedUser.basic + selectedUser.hra + selectedUser.allowances || selectedUser.net).toFixed(2)}</strong></td>
                        <td style={{ padding: '8px', border: '1px solid #000' }}><strong>{(selectedUser.basic + selectedUser.hra + selectedUser.allowances || selectedUser.net).toFixed(2)}</strong></td>
                        <td style={{ padding: '8px', border: '1px solid #000' }}><strong>{(selectedUser.epf + selectedUser.tds + selectedUser.lop).toFixed(2)}</strong></td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ border: '1px solid #000', padding: '12px', marginBottom: '24px' }}>
                    <div style={{ fontSize: '14px', marginBottom: '8px' }}><strong>Net Pay: ₹{Math.round(selectedUser.net).toLocaleString()}</strong></div>
                    <div><strong>NET PAY IN Words: </strong> {numberToWords(Math.round(selectedUser.net))}</div>
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', border: '1px solid #000' }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}><strong>Payment Mode:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}>{paymentMethod || 'Bank Transfer'}</td>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}><strong>Payment Date:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000', width: '25%' }}>{new Date(paymentDate).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>Bank Name:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{selectedUser.bank_name || 'N/A'}</td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>Account Number:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{selectedUser.account_number || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px', border: '1px solid #000' }}><strong>IFSC:</strong></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}>{'N/A'}</td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}></td>
                        <td style={{ padding: '6px', border: '1px solid #000' }}></td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '80px' }}>
                    <div style={{ border: '2px solid #4CAF50', padding: '12px 24px', fontSize: '16px', fontWeight: 'bold' }}>
                      UTR: <span style={{ fontWeight: 'normal', marginLeft: '12px' }}>{transactionRef || '                         '}</span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', fontSize: '11px', color: '#666', borderTop: '1px solid #ccc', paddingTop: '12px' }}>
                    <div>workzone, 5th Floor, Cabin#1&4, PlotNo.63, Phase-1, Kavurihills, Madhapur-500033</div>
                    <div style={{ color: 'blue', marginTop: '4px' }}>www.hmnssoftware.com &nbsp;&nbsp;&nbsp;&nbsp; hr@hmnssoftware.in</div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
