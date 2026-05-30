import React from 'react';
import styles from './attendance.module.css';

const LoadingSkeleton = ({ type = 'table' }) => {
  if (type === 'cards') {
    return (
      <div className={styles.statsGrid}>
        {[1, 2, 3, 4].map(idx => (
          <div key={idx} className={styles.statCard} style={{ minHeight: '76px' }}>
            <div className={`${styles.skeletonPulse}`} style={{ width: '42px', height: '42px', borderRadius: '12px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div className={`${styles.skeletonPulse}`} style={{ width: '50%', height: '12px' }} />
              <div className={`${styles.skeletonPulse}`} style={{ width: '80%', height: '16px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {[1, 2, 3, 4].map(idx => (
        <div key={idx} style={{ display: 'flex', gap: '16px', padding: '12px 14px', borderBottom: '1px solid var(--att-border)' }}>
          <div className={`${styles.skeletonPulse}`} style={{ flex: 1, height: '14px' }} />
          <div className={`${styles.skeletonPulse}`} style={{ flex: 2, height: '14px' }} />
          <div className={`${styles.skeletonPulse}`} style={{ flex: 1.5, height: '14px' }} />
          <div className={`${styles.skeletonPulse}`} style={{ flex: 1, height: '14px' }} />
          <div className={`${styles.skeletonPulse}`} style={{ flex: 1, height: '14px' }} />
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
