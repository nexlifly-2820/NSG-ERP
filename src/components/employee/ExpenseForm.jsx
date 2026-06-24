import React, { useState } from 'react';
import ReceiptUpload from './ReceiptUpload';
import { CreditCard, AlertCircle } from 'lucide-react';

export default function ExpenseForm({ onSubmitClaim }) {
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setTcDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploadKey, setUploadKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Validation errors state
  const [errors, setErrors] = useState({});



  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate Category
    if (!category) {
      newErrors.category = 'Category is required.';
    }

    // Validate Amount (min: 1)
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      newErrors.amount = 'Amount must be at least ₹1.';
    }

    // Validate Date (not in future)
    const today = new Date().toISOString().split('T')[0];
    if (!date) {
      newErrors.date = 'Expense date is required.';
    } else if (date > today) {
      newErrors.date = 'Expense date cannot be in the future.';
    }

    // Validate Description (max 200)
    if (!description.trim()) {
      newErrors.description = 'Description is required.';
    } else if (description.length > 200) {
      newErrors.description = 'Description must not exceed 200 characters.';
    }

    // Validate Receipt (required)
    if (!receiptFile) {
      newErrors.receipt = 'Please upload a receipt file.';
    }

    // If there are errors, block submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Reset error state
    setErrors({});
    setIsSubmitting(true);
    
    try {
      // Call onSubmitClaim callback
      await onSubmitClaim({
        category,
        amount: amountNum,
        date,
        description: description.trim(),
        receiptName: receiptFile.name,
        receiptSize: receiptFile.size,
      });

      // Reset Form
      setCategory('');
      setAmount('');
      setTcDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setReceiptFile(null);
      setUploadKey((prev) => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form 
      className="responsive-form-grid"
      onSubmit={handleSubmit}
      style={{
        gap: '16px',
        width: '100%',
        maxWidth: '800px', // Spacing & Layout Token
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <div style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
          Submit Expense Claim
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
          Fill out all details and upload your invoice to initiate reimbursement.
        </p>
      </div>


      {/* Category Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: errors.category ? '0px' : '0px' }}>
          Category <span style={{ color: '#ef4444' }}>*</span>
        </label>
        {errors.category && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}><AlertCircle size={14} /> {errors.category}</span>
        )}
        <input
          type="text"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            if (e.target.value.trim()) setErrors(p => ({...p, category: ''}));
            else setErrors(p => ({...p, category: 'Category is required.'}));
          }}
          onFocus={(e) => { if (!e.target.value.trim()) setErrors(p => ({...p, category: 'Category is required.'})); }}
          onClick={(e) => { if (!e.target.value.trim()) setErrors(p => ({...p, category: 'Category is required.'})); else setErrors(p => ({...p, category: ''})); }}
          required
          placeholder="Please Enter Your Claim Type"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: errors.category ? '1px solid #ef4444' : '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '13px',
            width: '100%',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Amount Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: errors.amount ? '0px' : '0px' }}>
          Amount (INR) <span style={{ color: '#ef4444' }}>*</span>
        </label>
        {errors.amount && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}><AlertCircle size={14} /> {errors.amount}</span>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              color: 'var(--text-muted)'
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>₹</span>
          </div>
          <input
            type="number"
            min="1"
            step="0.01"
            placeholder="1500" // placeholder spec
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              const val = parseFloat(e.target.value);
              if (!e.target.value || isNaN(val) || val < 1) setErrors(p => ({...p, amount: 'Amount must be at least ₹1.'}));
              else setErrors(p => ({...p, amount: ''}));
            }}
            onFocus={(e) => {
              const val = parseFloat(e.target.value);
              if (!e.target.value || isNaN(val) || val < 1) setErrors(p => ({...p, amount: 'Amount must be at least ₹1.'}));
            }}
            onClick={(e) => {
              const val = parseFloat(e.target.value);
              if (!e.target.value || isNaN(val) || val < 1) setErrors(p => ({...p, amount: 'Amount must be at least ₹1.'}));
              else setErrors(p => ({...p, amount: ''}));
            }}
            required
            style={{
              padding: '10px 12px 10px 28px',
              borderRadius: '8px',
              border: errors.amount ? '1px solid #ef4444' : '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              outline: 'none',
              fontSize: '13px',
              width: '100%',
              fontFamily: 'inherit'
            }}
          />
        </div>
      </div>

      {/* Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: errors.date ? '0px' : '0px' }}>
          Expense Date <span style={{ color: '#ef4444' }}>*</span>
        </label>
        {errors.date && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}><AlertCircle size={14} /> {errors.date}</span>
        )}
        <input
          type="date"
          value={date}
          max={new Date().toISOString().split('T')[0]} // restrict in HTML calendar
          onChange={(e) => {
            setTcDate(e.target.value);
            if (!e.target.value) {
              setErrors(p => ({...p, date: 'Expense date is required.'}));
            } else {
              const today = new Date().toISOString().split('T')[0];
              if (e.target.value > today) setErrors(p => ({...p, date: 'Expense date cannot be in the future.'}));
              else setErrors(p => ({...p, date: ''}));
            }
          }}
          onFocus={(e) => {
            if (!e.target.value) setErrors(p => ({...p, date: 'Expense date is required.'}));
            else {
              const today = new Date().toISOString().split('T')[0];
              if (e.target.value > today) setErrors(p => ({...p, date: 'Expense date cannot be in the future.'}));
            }
          }}
          onClick={(e) => {
            if (!e.target.value) setErrors(p => ({...p, date: 'Expense date is required.'}));
            else {
              const today = new Date().toISOString().split('T')[0];
              if (e.target.value > today) setErrors(p => ({...p, date: 'Expense date cannot be in the future.'}));
              else setErrors(p => ({...p, date: ''}));
            }
          }}
          required
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: errors.date ? '1px solid #ef4444' : '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '13px',
            width: '100%',
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: errors.description ? '0px' : '0px' }}>
            Description <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <span style={{ fontSize: '10px', color: description.length > 200 ? '#ef4444' : 'var(--text-muted)' }}>
            {description.length}/200
          </span>
        </div>
        {errors.description && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', fontWeight: '500', marginBottom: '2px' }}><AlertCircle size={14} /> {errors.description}</span>
        )}
        <textarea
          placeholder="Client lunch at XYZ restaurant" // placeholder spec
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (!e.target.value.trim()) setErrors(p => ({...p, description: 'Description is required.'}));
            else if (e.target.value.length > 200) setErrors(p => ({...p, description: 'Description must not exceed 200 characters.'}));
            else setErrors(p => ({...p, description: ''}));
          }}
          onFocus={(e) => {
            if (!e.target.value.trim()) setErrors(p => ({...p, description: 'Description is required.'}));
            else if (e.target.value.length > 200) setErrors(p => ({...p, description: 'Description must not exceed 200 characters.'}));
          }}
          onClick={(e) => {
            if (!e.target.value.trim()) setErrors(p => ({...p, description: 'Description is required.'}));
            else if (e.target.value.length > 200) setErrors(p => ({...p, description: 'Description must not exceed 200 characters.'}));
            else setErrors(p => ({...p, description: ''}));
          }}
          required
          rows="3"
          style={{
            padding: '10px 12px',
            borderRadius: '8px',
            border: errors.description ? '1px solid #ef4444' : '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            outline: 'none',
            fontSize: '13px',
            resize: 'vertical',
            fontFamily: 'inherit',
            lineHeight: '1.4'
          }}
        />
      </div>

      {/* Receipt Uploader */}
      <div style={{ gridColumn: '1 / -1' }}>
        <ReceiptUpload 
          key={uploadKey}
          externalError={errors.receipt}
        onFile={(file) => {
          setReceiptFile(file);
          if (file) {
            setErrors((prev) => ({ ...prev, receipt: null }));
          }
        }} 
        accept="image/*,application/pdf" 
      />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <button
          type="submit"
          disabled={isSubmitting}
          style={{
            width: '100%',
            border: 'none',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            backgroundColor: isSubmitting ? '#9ca3af' : 'var(--accent-green)',
            color: 'white',
            boxShadow: 'var(--shadow-sm)',
            marginTop: '8px',
            transition: 'opacity 0.2s ease'
          }}
          onMouseOver={(e) => { if (!isSubmitting) e.currentTarget.style.opacity = '0.9'; }}
          onMouseOut={(e) => { if (!isSubmitting) e.currentTarget.style.opacity = '1'; }}
        >
          <CreditCard size={16} />
          {isSubmitting ? 'Submitting...' : 'Submit Claim'}
        </button>
      </div>
    </form>
  );
}
