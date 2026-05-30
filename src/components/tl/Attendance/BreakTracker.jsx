import React from 'react';
import styles from './attendance.module.css';

const BreakTracker = ({ lunchSeconds = 0, personalSeconds = 0, isBreakActive }) => {
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}m ${remainingSecs.toString().padStart(2, '0')}s`;
  };

  const totalSeconds = lunchSeconds + personalSeconds;

  return (
    <div className={styles.breakTrackerCard}>
      <h3 className={styles.breakTrackerTitle}>Today's Break Activity</h3>
      
      <div className={styles.breakMiniCardsRow}>
        {/* Lunch Break Card */}
        <div className={styles.breakMiniCard} style={{ borderLeft: isBreakActive ? '3px solid var(--att-warning)' : '1px solid var(--att-border)' }}>
          <span className={styles.breakMiniLabel}>Lunch Break</span>
          <span className={styles.breakMiniValue}>{formatTime(lunchSeconds)}</span>
          <span style={{ fontSize: '9.5px', color: 'var(--att-text-secondary)' }}>Limit: 45 Mins</span>
        </div>

        {/* Personal Break Card */}
        <div className={styles.breakMiniCard}>
          <span className={styles.breakMiniLabel}>Personal Break</span>
          <span className={styles.breakMiniValue}>{formatTime(personalSeconds)}</span>
          <span style={{ fontSize: '9.5px', color: 'var(--att-text-secondary)' }}>Limit: 15 Mins</span>
        </div>

        {/* Total Accumulated Card */}
        <div className={styles.breakMiniCard} style={{ background: 'var(--att-primary-light)' }}>
          <span className={styles.breakMiniLabel} style={{ color: 'var(--att-primary)' }}>Total Breaks</span>
          <span className={styles.breakMiniValue} style={{ color: 'var(--att-primary)' }}>
            {formatTime(totalSeconds)}
          </span>
          <span style={{ fontSize: '9.5px', color: 'var(--att-primary)' }}>Limit: 60 Mins</span>
        </div>
      </div>
    </div>
  );
};

export default BreakTracker;
