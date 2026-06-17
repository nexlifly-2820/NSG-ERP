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
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '420px', // Spacing & Layout Token
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
        Submit Expense Claim
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
        Fill out all details and upload your invoice to initiate reimbursement.
      </p>


      {/* Category Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          Category <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
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
        {errors.category && (
          <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{errors.category}</span>
        )}
      </div>

      {/* Amount Input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          Amount (INR) <span style={{ color: '#ef4444' }}>*</span>
        </label>
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
            onChange={(e) => setAmount(e.target.value)}
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
        {errors.amount && (
          <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{errors.amount}</span>
        )}
      </div>

      {/* Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
          Expense Date <span style={{ color: '#ef4444' }}>*</span>
        </label>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().split('T')[0]} // restrict in HTML calendar
          onChange={(e) => setTcDate(e.target.value)}
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
        {errors.date && (
          <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{errors.date}</span>
        )}
      </div>

      {/* Description */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Description <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <span style={{ fontSize: '10px', color: description.length > 200 ? '#ef4444' : 'var(--text-muted)' }}>
            {description.length}/200
          </span>
        </div>
        <textarea
          placeholder="Client lunch at XYZ restaurant" // placeholder spec
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
        {errors.description && (
          <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{errors.description}</span>
        )}
      </div>

      {/* Receipt Uploader */}
      <ReceiptUpload 
        key={uploadKey}
        onFile={(file) => {
          setReceiptFile(file);
          if (file) {
            setErrors((prev) => ({ ...prev, receipt: null }));
          }
        }} 
        accept="image/*,application/pdf" 
      />
      {errors.receipt && (
        <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500', marginTop: '-4px' }}>{errors.receipt}</span>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        style={{
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
    </form>
  );
}
