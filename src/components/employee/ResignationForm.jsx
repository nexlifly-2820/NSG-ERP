import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ResignationForm({ onSubmit }) {
  const todayStr = new Date().toISOString().split('T')[0];
  
  const [resignationDate, setResignationDate] = useState(todayStr);
  const [reason, setReason] = useState('');
  
  // Validation errors
  const [error, setError] = useState('');

  // Confirmation Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmInputText, setConfirmInputText] = useState('');

  const handlePreSubmit = (e) => {
    e.preventDefault();
    
    const resDate = new Date(resignationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    resDate.setHours(0, 0, 0, 0);

    // Validate resignation date: today_or_past
    if (resDate > today) {
      setError('Resignation Date cannot be in the future.');
      return;
    }

    setError('');
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = (e) => {
    e.preventDefault();
    if (confirmInputText !== 'RESIGN') {
      alert('Please type RESIGN exactly to confirm.');
      return;
    }

    const resDate = new Date(resignationDate);
    resDate.setDate(resDate.getDate() + 15);
    const calculatedLwd = resDate.toISOString().split('T')[0];

    onSubmit({
      submissionDate: resignationDate,
      lwdDate: calculatedLwd,
      reason: reason.trim()
    });

    setShowConfirmModal(false);
    setConfirmInputText('');
  };

  return (
    <div 
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '28px', // Spacing & Layout Token
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          Submit Resignation Form
        </h3>
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)' }}>
          Initiate your offboarding process by submitting your official last working day.
        </p>
      </div>

      {/* Prominent caution warning banner: This is irreversible */}
      <div 
        style={{
          padding: '12px 16px',
          borderRadius: '8px',
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}
      >
        <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Irreversible Action
          </span>
          <span style={{ fontSize: '11px', lineHeight: '1.4' }}>
            Resignations cannot be retracted once submitted. Notice period calculations and offboarding exit tasks will initiate immediately.
          </span>
        </div>
      </div>

      <form onSubmit={handlePreSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Resignation Date */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
            Resignation Date
          </label>
          <input 
            type="date"
            value={resignationDate}
            onChange={(e) => setResignationDate(e.target.value)}
            required
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: error && error.includes('Resignation Date') ? '1px solid #ef4444' : '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>



        {/* Reason */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              Reason for Resignation (Optional)
            </label>
            <span style={{ fontSize: '10px', color: reason.length > 500 ? '#ef4444' : 'var(--text-muted)' }}>
              {reason.length}/500
            </span>
          </div>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows="3"
            maxLength={500}
            placeholder="Sharing reason is optional but appreciated for HR records"
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              outline: 'none',
              resize: 'none',
              fontFamily: 'inherit',
              lineHeight: '1.4'
            }}
          />
        </div>

        <button 
          type="submit"
          style={{
            backgroundColor: 'hsl(0, 60%, 30%)', // --resign-btn HSL
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '12px',
            fontSize: '12px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'hsl(0, 60%, 40%)'} // --resign-btn-hover HSL
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'hsl(0, 60%, 30%)'}
        >
          Submit Resignation
        </button>
      </form>

      {/* Double Confirm Modal */}
      {showConfirmModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px'
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
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <AlertTriangle size={20} />
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700' }}>Confirm Resignation</h4>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmInputText('');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div 
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.05)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: '600',
                lineHeight: '1.4'
              }}
            >
              This action is irreversible. Are you sure you want to resign?
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              To authorize this request, please type the word <strong style={{ color: 'var(--text-primary)' }}>RESIGN</strong> in the field below.
            </p>

            <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="text"
                placeholder="RESIGN"
                value={confirmInputText}
                onChange={(e) => setConfirmInputText(e.target.value)}
                required
                style={{
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px', // Typography Token: Confirm input 14px / 600 / monospace
                  fontWeight: '600',
                  fontFamily: 'monospace',
                  textAlign: 'center',
                  outline: 'none',
                  letterSpacing: '2px'
                }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowConfirmModal(false);
                    setConfirmInputText('');
                  }}
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
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={confirmInputText !== 'RESIGN'}
                  style={{
                    border: 'none',
                    backgroundColor: confirmInputText === 'RESIGN' ? 'hsl(0, 60%, 30%)' : 'var(--border-color)',
                    color: confirmInputText === 'RESIGN' ? 'white' : 'var(--text-muted)',
                    borderRadius: '6px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: confirmInputText === 'RESIGN' ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s ease'
                  }}
                >
                  Confirm Resignation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
