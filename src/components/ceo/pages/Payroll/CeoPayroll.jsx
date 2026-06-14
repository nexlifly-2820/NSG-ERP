import React, { useState, useEffect } from 'react';
import { Loader, CheckCircle, Search, AlertCircle, FileText, IndianRupee, History, DollarSign } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './CeoPayroll.css';

export default function CeoPayroll() {
  const [activeTab, setActiveTab] = useState('pending'); // pending or history
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-indexed month
  const [year, setYear] = useState(new Date().getFullYear());
  
  const [loading, setLoading] = useState(false);
  const [pendingRecords, setPendingRecords] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  
  // Payment Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  
  // Notification State
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (activeTab === 'pending') fetchPending();
    else fetchHistory();
  }, [activeTab, month, year]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchPending = async () => {
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
  };

  const fetchHistory = async () => {
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
  };

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
    setSelectedUser(user);
    setTransactionRef('');
    setPaymentMethod('Bank Transfer');
    setShowModal(true);
  };

  const processPayment = async () => {
    if (!transactionRef.trim()) {
      showNotification('Transaction Reference is required', 'error');
      return;
    }
    
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
          transaction_ref: transactionRef
        })
      });

      if (res.ok) {
        showNotification('Payroll processed successfully!');
        setShowModal(false);
        fetchPending(); // refresh list
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
            transaction_ref: 'BULK-PROCESS-' + new Date().getTime()
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

  const downloadPDF = (record) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('NSG ERP Systems', 105, 20, null, null, 'center');
    doc.setFontSize(12);
    doc.text('Payslip', 105, 28, null, null, 'center');
    
    // Employee Details
    doc.setFontSize(10);
    doc.text(`Employee Name: ${record.employee_name}`, 14, 40);
    doc.text(`Month/Year: ${record.month}/${record.year}`, 14, 46);
    doc.text(`Transaction Ref: ${record.transaction_ref || 'N/A'}`, 14, 52);
    doc.text(`Payment Method: ${record.payment_method}`, 14, 58);
    
    // Earnings & Deductions
    doc.autoTable({
      startY: 65,
      head: [['Description', 'Amount (INR)']],
      body: [
        ['Net Salary Paid', `Rs. ${Math.round(record.net).toLocaleString()}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Footer
    doc.setFontSize(10);
    doc.text('This is a computer generated payslip and does not require a signature.', 105, 100, null, null, 'center');
    
    doc.save(`Payslip_${record.employee_name}_${record.month}_${record.year}.pdf`);
    showNotification(`Downloaded PDF for ${record.employee_name}`, 'success');
  };

  return (
    <div className="ceo-payroll-container">
      <div className="ceo-payroll-header">
        <div>
          <h1>Payroll Management</h1>
          <p>Process salaries, add bonuses or LOP, and generate payslips manually.</p>
        </div>
        <div className="ceo-payroll-filters">
          <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
            {Array.from({ length: 21 }, (_, i) => new Date().getFullYear() - 10 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
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
                  <th>Basic + HRA</th>
                  <th>Bonus (Edit)</th>
                  <th>LOP (Edit)</th>
                  <th>Deductions</th>
                  <th>Net Payable</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingRecords.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">No pending payrolls for this month.</td></tr>
                ) : (
                  pendingRecords.map(r => (
                    <tr key={r.employee_id}>
                      <td>
                        <div className="emp-name">{r.employee_name}</div>
                        <div className="emp-role">{r.role.toUpperCase()}</div>
                      </td>
                      <td className="amount-col">₹{Math.round(r.basic + r.hra).toLocaleString()}</td>
                      <td>
                        <input 
                          type="number" 
                          className="edit-input bonus" 
                          value={r.bonus}
                          onChange={(e) => handleEdit(r.employee_id, 'bonus', e.target.value)}
                        />
                      </td>
                      <td>
                        <input 
                          type="number" 
                          className="edit-input lop" 
                          value={r.lop}
                          onChange={(e) => handleEdit(r.employee_id, 'lop', e.target.value)}
                        />
                      </td>
                      <td className="amount-col text-red">-₹{Math.round(r.epf + r.tds).toLocaleString()}</td>
                      <td className="amount-col net-pay">₹{Math.round(r.net).toLocaleString()}</td>
                      <td>
                        <button className="btn-process" onClick={() => openPaymentModal(r)}>
                          Process & Pay
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'history' && (
        <div className="ceo-payroll-card">
          <div className="table-responsive">
            <table className="ceo-payroll-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Month/Year</th>
                  <th>Payment Method</th>
                  <th>Transaction Ref</th>
                  <th>Net Paid</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyRecords.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">No payroll history found for this period.</td></tr>
                ) : (
                  historyRecords.map(r => (
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
      )}

      {/* Payment Modal */}
      {showModal && selectedUser && (
        <div className="ceo-modal-overlay">
          <div className="ceo-modal">
            <div className="ceo-modal-header">
              <h3>Confirm Payment</h3>
              <p>For {selectedUser.employee_name}</p>
            </div>
            <div className="ceo-modal-body">
              <div className="payment-summary">
                <span>Net Payable:</span>
                <span className="net-pay-large">₹{Math.round(selectedUser.net).toLocaleString()}</span>
              </div>
              
              <div className="form-group">
                <label>Payment Method</label>
                <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
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
                />
              </div>
            </div>
            <div className="ceo-modal-footer">
              <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn-confirm" onClick={processPayment}>
                {loading ? 'Processing...' : 'Confirm Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
