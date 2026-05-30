import React from 'react';
import styles from './attendance.module.css';
import { CalendarRange, Info } from 'lucide-react';

const ShiftInfoCard = ({ shift }) => {
  return (
    <div className={styles.insightsCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <CalendarRange size={16} style={{ color: 'var(--att-primary)' }} />
        <h3 className={styles.insightHeadingText}>My Shift Information</h3>
      </div>
      
      <div className={styles.detailsList} style={{ gap: '8px', marginTop: '4px' }}>
        <div className={styles.detailsRow} style={{ paddingBottom: '4px' }}>
          <span className={styles.detailsLabel} style={{ fontSize: '12px' }}>Shift Pattern</span>
          <span className={styles.detailsValText} style={{ fontSize: '12px', fontWeight: '600' }}>{shift.name}</span>
        </div>

        <div className={styles.detailsRow} style={{ paddingBottom: '4px' }}>
          <span className={styles.detailsLabel} style={{ fontSize: '12px' }}>Shift Window</span>
          <span className={styles.detailsValText} style={{ fontSize: '12px', fontWeight: '600' }}>{shift.timing}</span>
        </div>

        <div className={styles.detailsRow} style={{ paddingBottom: '4px' }}>
          <span className={styles.detailsLabel} style={{ fontSize: '12px' }}>Grace Threshold</span>
          <span className={styles.detailsValText} style={{ fontSize: '12px', fontWeight: '600', color: 'var(--att-warning)' }}>{shift.graceTime}</span>
        </div>

        <div className={styles.detailsRow} style={{ paddingBottom: '4px', borderBottom: 'none' }}>
          <span className={styles.detailsLabel} style={{ fontSize: '12px' }}>Weekly Rest Days</span>
          <span className={styles.detailsValText} style={{ fontSize: '12px', fontWeight: '600' }}>{shift.weeklyOffs}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px', fontSize: '11px', color: 'var(--att-text-secondary)', background: 'var(--att-bg)', padding: '6px 10px', borderRadius: '8px', marginTop: '2px', alignItems: 'center' }}>
        <Info size={12} />
        <span>Late check-in logs after grace time trigger warning status flags.</span>
      </div>
    </div>
  );
};

export default ShiftInfoCard;
