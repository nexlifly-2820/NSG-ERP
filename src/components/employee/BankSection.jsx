import { useState } from 'react';
import { ShieldAlert, CheckCircle, Clock, KeyRound, X } from 'lucide-react';

export default function BankSection({ bankData, onUpdateBank, onSimulateVerify }) {
  const [showForm, setShowForm] = useState(false);
  const [bankName, setBankName] = useState(bankData.bankName || '');
  const [holderName, setHolderName] = useState(bankData.holderName || '');
  const [accountNumber, setAccountNumber] = useState(bankData.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(bankData.ifscCode || '');
  const [bankBranch, setBankBranch] = useState(bankData.bankBranch || '');

  // Validation Errors state
  const [errors, setErrors] = useState({});

  // Workflow Dialog states
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Masked Account computation (masked-account token HSL(240,15%,45%))
  const getMaskedAccount = () => {
    if (!bankData.accountNumber) return '•••• •••• •••• ••••';
    const num = bankData.accountNumber.toString();
    const lastFour = num.slice(-4);
    return `•••• •••• •••• ${lastFour}`;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate Bank Name
    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required.';
    }

    // Validate Holder Name
    if (!holderName.trim()) {
      newErrors.holderName = 'Account holder name is required.';
    }

    // Validate Account Number: min: 9 | max: 18 | numeric
    const cleanAccount = accountNumber.trim();
    if (!cleanAccount) {
      newErrors.accountNumber = 'Account number is required.';
    } else if (cleanAccount.length < 9 || cleanAccount.length > 18) {
      newErrors.accountNumber = 'Account number must be between 9 and 18 digits.';
    } else if (!/^\d+$/.test(cleanAccount)) {
      newErrors.accountNumber = 'Account number must contain digits only.';
    }

    // Validate IFSC: required | ifsc_regex (^[A-Z]{4}0[A-Z0-9]{6}$)
    const cleanIfsc = ifscCode.trim().toUpperCase();
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!cleanIfsc) {
      newErrors.ifscCode = 'IFSC code is required.';
    } else if (!ifscRegex.test(cleanIfsc)) {
      newErrors.ifscCode = 'Invalid IFSC code format (e.g. SBIN0001234).';
    }

    if (!bankBranch.trim()) {
      newErrors.bankBranch = 'Bank branch name is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    // Open warning confirmation modal
    setShowWarningModal(true);
  };

  const handleConfirmWarning = () => {
    setShowWarningModal(false);
    // Transition to OTP Authentication modal
    setShowOtpModal(true);
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpCode.length !== 4) {
      alert('Please enter a valid 4-digit code.');
      return;
    }

    // Success OTP verify, update bank details
    onUpdateBank({
      bankName: bankName.trim(),
      holderName: holderName.trim(),
      accountNumber: accountNumber.trim(),
      ifscCode: ifscCode.trim().toUpperCase(),
      bankBranch: bankBranch.trim(),
      status: 'pending' // status switches to UPDATE-PENDING
    });

    setOtpCode('');
    setShowOtpModal(false);
    setShowForm(false);
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative'
      }}
    >
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .slide-up-modal {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      ` }} />

      {/* Warning confirmation modal */}
      {showWarningModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            className="slide-up-modal"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '95%',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
              <ShieldAlert size={24} />
              <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Direct Deposit Security Warning</h4>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              Are you sure you want to update your bank credentials? This will temporarily suspend active payroll direct deposits until HR completes physical verification of the bank credentials.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                onClick={() => setShowWarningModal(false)}
                style={{
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmWarning}
                style={{
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '6px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Continue to Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OTP Security Verification Modal */}
      {showOtpModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div
            className="slide-up-modal"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '95%',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)' }}>
                <KeyRound size={20} />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>OTP Verification Required</h4>
              </div>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Warning Spec requirement: Your salary disbursal will be paused... */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontSize: '11px',
                fontWeight: '600',
                lineHeight: '1.4'
              }}
            >
              Your salary disbursal will be paused until HR verifies the new account.
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              A security verification code has been sent to your registered mobile number. Please enter the 4-digit OTP below to authorize this change.
            </p>

            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                maxLength="4"
                pattern="\d{4}"
                placeholder="0 0 0 0"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                required
                style={{
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '20px',
                  fontWeight: '700',
                  textAlign: 'center',
                  letterSpacing: '8px',
                  outline: 'none',
                  width: '140px',
                  alignSelf: 'center'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <span style={{ color: 'var(--text-muted)' }}>Didn't receive code?</span>
                <button
                  type="button"
                  onClick={() => alert('OTP code resent!')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-green)', fontWeight: '600', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Resend OTP
                </button>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: 'var(--accent-green)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
              >
                Verify and Update Account
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          Bank Account Section
        </h3>

        {bankData.status === 'pending' && onSimulateVerify && (
          <button
            onClick={() => onSimulateVerify('verified')}
            style={{
              background: 'none',
              border: '1px dashed var(--accent-green)',
              color: 'var(--accent-green)',
              borderRadius: '4px',
              padding: '2px 8px',
              fontSize: '10px',
              cursor: 'pointer'
            }}
          >
            Simulate HR Verification
          </button>
        )}
      </div>

      {/* Masked display - ALWAYS show last 4 digits */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-primary)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>
              Active Account
            </span>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '600',
                fontFamily: 'monospace',
                letterSpacing: '0.3em', // Token spacing requirement
                color: 'hsl(240, 15%, 45%)', // --masked-account token HSL
                width: '200px' // Spacing & Layout Token
              }}
            >
              {getMaskedAccount()}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            style={{
              backgroundColor: showForm ? 'var(--bg-tertiary)' : 'var(--text-primary)',
              color: showForm ? 'var(--text-primary)' : 'var(--bg-secondary)',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '11px',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            {showForm ? 'Cancel Update' : 'Update Bank'}
          </button>
        </div>

        {/* Status Indicators / Amber Badge - UPDATE-PENDING */}
        {bankData.status === 'pending' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'hsl(35, 90%, 60%)', // doc-pending amber
              fontSize: '11px',
              fontWeight: '700',
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              marginTop: '4px'
            }}
          >
            <Clock size={12} />
            <span>Awaiting HR verification — account not yet active for payroll</span>
          </div>
        )}
        {bankData.status === 'verified' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent-green)',
              fontSize: '11px',
              fontWeight: '700',
              backgroundColor: 'rgba(16, 185, 129, 0.05)',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              marginTop: '4px'
            }}
          >
            <CheckCircle size={12} />
            <span>Verified and active for payroll direct deposit</span>
          </div>
        )}
      </div>

      {/* Slide-Down Form (slideDown 250ms transition effect) */}
      <div
        style={{
          maxHeight: showForm ? '550px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1)', // slideDown 250ms transition
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        {/* Security Warning Banner inside edit form (color: --bank-update-warning HSL(0,70%,25%) dark red) */}
        <div
          style={{
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'hsl(0, 70%, 12%)', // deep red
            border: '1px solid hsl(0, 70%, 25%)', // --bank-update-warning HSL(0,70%,25%)
            color: '#fca5a5',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start',
            marginTop: '8px'
          }}
        >
          <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span style={{ fontSize: '11px', lineHeight: '1.4' }}>
            <strong>Security Warning:</strong> Direct deposit credentials updates will place a hold on payroll disbursements until HR verification is complete.
          </span>
        </div>

        <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Bank Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Bank Name</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
              placeholder="State Bank of India" // placeholder spec
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.bankName ? '1px solid #ef4444' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            {errors.bankName && (
              <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{errors.bankName}</span>
            )}
          </div>

          {/* Holder Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Account Holder Name</label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              required
              placeholder="Full name as in bank records"
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.holderName ? '1px solid #ef4444' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            {errors.holderName && (
              <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{errors.holderName}</span>
            )}
          </div>

          {/* Account Number */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Account Number</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              placeholder="Enter account number" // placeholder spec
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.accountNumber ? '1px solid #ef4444' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            {errors.accountNumber && (
              <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{errors.accountNumber}</span>
            )}
          </div>

          {/* IFSC Code */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>IFSC Code</label>
            <input
              type="text"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
              required
              placeholder="SBIN0001234" // placeholder spec
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.ifscCode ? '1px solid #ef4444' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            {errors.ifscCode && (
              <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{errors.ifscCode}</span>
            )}
          </div>

          {/* Bank Branch Name */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Bank Branch Name</label>
            <input
              type="text"
              value={bankBranch}
              onChange={(e) => setBankBranch(e.target.value)}
              required
              placeholder="Main Branch"
              style={{
                padding: '8px 10px',
                borderRadius: '6px',
                border: errors.bankBranch ? '1px solid #ef4444' : '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '12px',
                outline: 'none'
              }}
            />
            {errors.bankBranch && (
              <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: '500' }}>{errors.bankBranch}</span>
            )}
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: 'var(--accent-green)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '10px',
              fontSize: '12px',
              fontWeight: '700',
              cursor: 'pointer',
              marginTop: '4px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            Submit for HR Audit
          </button>
        </form>
      </div>
    </div>
  );
}
