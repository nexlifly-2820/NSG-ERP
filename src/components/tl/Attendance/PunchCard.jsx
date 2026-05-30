import React, { useState, useEffect } from 'react';
import styles from './attendance.module.css';
import { LogIn, LogOut, Coffee, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';

const PunchCard = ({ status, onPunchAction }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState(null); // 'in', 'out', 'break_start', 'break_end'
  const [scanState, setScanState] = useState('idle'); // 'scanning', 'success'
  const [showBreakSelectionModal, setShowBreakSelectionModal] = useState(false);
  const [lunchBreakAvailable, setLunchBreakAvailable] = useState(true);

  const LUNCH_BREAK_KEY = 'last_lunch_break_timestamp';
  const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

  useEffect(() => {
    const checkLunchBreak = () => {
      const lastLunchStr = localStorage.getItem(LUNCH_BREAK_KEY);
      if (lastLunchStr) {
        const lastLunch = parseInt(lastLunchStr, 10);
        const now = Date.now();
        if (now - lastLunch < EIGHT_HOURS_MS) {
          setLunchBreakAvailable(false);
        } else {
          setLunchBreakAvailable(true);
        }
      }
    };
    if (showBreakSelectionModal) {
      checkLunchBreak();
    }
  }, [showBreakSelectionModal]);

  const handleSelectBreak = (type) => {
    if (type === 'lunch') {
      localStorage.setItem(LUNCH_BREAK_KEY, Date.now().toString());
      setLunchBreakAvailable(false);
    }
    setShowBreakSelectionModal(false);
    triggerAuth('break_start');
  };

  const triggerAuth = (action) => {
    setAuthAction(action);
    setShowAuthModal(true);
    setScanState('scanning');

    // Asynchronous Mock Apple Face ID scan completes after 1200ms
    setTimeout(() => {
      setScanState('success');
      
      // Auto resolve and apply state shift after 800ms
      setTimeout(() => {
        onPunchAction(action);
        setShowAuthModal(false);
        setScanState('idle');
      }, 800);
    }, 1200);
  };

  const getPunchIcon = () => {
    switch (status) {
      case 'Checked In':
        return <LogIn size={26} />;
      case 'On Break':
        return <Coffee size={26} />;
      case 'Checked Out':
      default:
        return <LogOut size={26} style={{ transform: 'rotate(180deg)' }} />;
    }
  };

  const getPunchStatusLabel = () => {
    switch (status) {
      case 'Checked In':
        return 'Work Session Active';
      case 'On Break':
        return 'On Break';
      case 'Checked Out':
      default:
        return 'Checked Out';
    }
  };

  const getStatusCircleClass = () => {
    if (status === 'Checked In') return styles.punchStatusActive;
    if (status === 'On Break') return styles.punchStatusBreak;
    return '';
  };

  return (
    <>
      <div className={styles.punchCardContainer}>
        <div className={`${styles.punchStatusCircle} ${getStatusCircleClass()}`}>
          {getPunchIcon()}
        </div>
        <div>
          <h2 className={styles.punchHeading}>{getPunchStatusLabel()}</h2>
          <p className={styles.punchSubheading}>
            {status === 'Checked In' ? 'Active session in progress.' :
             status === 'On Break' ? 'Breaks are clocked in real-time.' : 'Please punch in to start working.'}
          </p>
        </div>

        {/* Buttons Grid depending on shift status */}
        <div className={styles.punchBtnActionsRow}>
          {status === 'Checked Out' && (
            <button 
              type="button" 
              className={styles.punchBtnPrimary}
              onClick={() => triggerAuth('in')}
            >
              <LogIn size={15} /> Punch In
            </button>
          )}

          {status === 'Checked In' && (
            <>
              <button 
                type="button" 
                className={styles.punchBtnSecondary}
                onClick={() => setShowBreakSelectionModal(true)}
              >
                <Coffee size={15} /> Start Break
              </button>
              <button 
                type="button" 
                className={styles.punchBtnSecondary}
                style={{ borderColor: 'var(--att-danger)', color: 'var(--att-danger)' }}
                onClick={() => triggerAuth('out')}
              >
                <LogOut size={15} /> Punch Out
              </button>
            </>
          )}

          {status === 'On Break' && (
            <button 
              type="button" 
              className={styles.punchBtnSuccess}
              onClick={() => triggerAuth('break_end')}
            >
              <ShieldCheck size={15} /> Resume Work
            </button>
          )}
        </div>
      </div>

      {/* Break Selection Modal */}
      {showBreakSelectionModal && (
        <div className={styles.biometricModalOverlay}>
          <div className={styles.biometricCard} style={{ textAlign: 'center' }}>
            <h3 className={styles.authTitle}>Select Break Type</h3>
            <p className={styles.authSubtitle} style={{ marginBottom: '20px' }}>
              Choose the type of break you are taking.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                type="button" 
                className={styles.punchBtnPrimary}
                disabled={!lunchBreakAvailable}
                onClick={() => handleSelectBreak('lunch')}
                style={{ 
                  opacity: lunchBreakAvailable ? 1 : 0.5, 
                  cursor: lunchBreakAvailable ? 'pointer' : 'not-allowed',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Coffee size={15} /> Lunch Break
                </div>
                {!lunchBreakAvailable && <span style={{ fontSize: '11px', fontWeight: 'normal', marginTop: '4px', opacity: 0.8 }}>(Unavailable for 8 hours)</span>}
              </button>

              <button 
                type="button" 
                className={styles.punchBtnSecondary}
                onClick={() => handleSelectBreak('personal')}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Coffee size={15} /> Personal Break
              </button>
            </div>
            
            <button 
              type="button" 
              onClick={() => setShowBreakSelectionModal(false)}
              style={{ marginTop: '20px', background: 'none', border: 'none', color: 'var(--att-text-secondary)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* --- Mock Apple Biometric Face ID Verification Modal --- */}
      {showAuthModal && (
        <div className={styles.biometricModalOverlay}>
          <div className={styles.biometricCard}>
            
            {/* Apple scan ring visual indicator */}
            <div 
              className={`${styles.faceIdRing} ${scanState === 'scanning' ? styles.faceIdScanning : styles.faceIdSuccess}`}
            >
              {scanState === 'scanning' ? (
                <RefreshCw size={36} style={{ animation: 'spin 2s linear infinite' }} />
              ) : (
                <ShieldCheck size={48} />
              )}
            </div>

            <div>
              <h3 className={styles.authTitle}>
                {scanState === 'scanning' ? 'Verifying Biometrics...' : 'Verification Successful'}
              </h3>
              <p className={styles.authSubtitle}>
                {scanState === 'scanning' ? 'Align your face inside the dynamic frame camera overlay.' : 'Verified work session authenticated.'}
              </p>
            </div>

            {/* Subtext description */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--att-text-secondary)', background: '#f8fafc', padding: '6px 14px', borderRadius: '12px' }}>
              <Smartphone size={13} />
              <span>OrangeHRM Secure Sync Connected</span>
            </div>

          </div>
        </div>
      )}

      {/* Embedded Spin Keyframes styling for Verification Icon */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

export default PunchCard;
