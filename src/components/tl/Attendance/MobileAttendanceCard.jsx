import React from 'react';
import styles from './attendance.module.css';
import StatusBadge from './StatusBadge';
import { Eye, HelpCircle } from 'lucide-react';

const MobileAttendanceCard = ({ logs, onViewDetails, onCorrection }) => {
  return (
    <div className={styles.mobileCardContainer}>
      {logs.map((log) => (
        <div key={log.id} className={styles.mobileCard}>
          {/* Header */}
          <div className={styles.mobileCardHeader}>
            <span style={{ fontSize: '13px', fontWeight: '700' }}>{log.date}</span>
            <StatusBadge status={log.status} />
          </div>

          {/* Body */}
          <div className={styles.mobileCardBody}>
            <div>
              <span style={{ color: 'var(--att-text-secondary)' }}>Shift:</span>
              <span style={{ display: 'block', fontWeight: '600' }}>{log.shift}</span>
            </div>
            <div>
              <span style={{ color: 'var(--att-text-secondary)' }}>Duration:</span>
              <span style={{ display: 'block', fontWeight: '600' }}>{log.workingHours}</span>
            </div>
            <div>
              <span style={{ color: 'var(--att-text-secondary)' }}>Check In:</span>
              <span style={{ display: 'block' }}>{log.checkIn}</span>
            </div>
            <div>
              <span style={{ color: 'var(--att-text-secondary)' }}>Check Out:</span>
              <span style={{ display: 'block' }}>{log.checkOut}</span>
            </div>
          </div>

          {/* Actions */}
          <div className={styles.mobileCardFooter}>
            <button
              type="button"
              className={`${styles.btnActionText} ${styles.btnView}`}
              onClick={() => onViewDetails(log)}
            >
              <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} /> View
            </button>

            {log.status !== 'Leave' && log.status !== 'Pending Correction' && (
              <button
                type="button"
                className={`${styles.btnActionText} ${styles.btnCorrect}`}
                onClick={() => onCorrection(log.date)}
              >
                <HelpCircle size={12} style={{ display: 'inline', marginRight: '4px' }} /> Correct
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileAttendanceCard;
