import React from 'react';
import styles from './attendance.module.css';
import { X, Calendar } from 'lucide-react';
import StatusBadge from './StatusBadge';

const AttendanceDetailsModal = ({ log, onClose }) => {
  if (!log) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={16} style={{ color: 'var(--att-primary)' }} />
            Attendance Session Details
          </h3>
          <button type="button" className={styles.btnCloseModal} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          <div className={styles.detailsList}>
            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Log Date</span>
              <span className={styles.detailsValText}><strong>{log.date}</strong></span>
            </div>

            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Active Shift</span>
              <span className={styles.detailsValText}>{log.shift}</span>
            </div>

            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Punch In Time</span>
              <span className={styles.detailsValText} style={{ color: log.checkIn === '—' ? 'var(--att-text-secondary)' : 'var(--att-text-primary)' }}>
                {log.checkIn}
              </span>
            </div>

            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Punch Out Time</span>
              <span className={styles.detailsValText} style={{ color: log.checkOut === '—' ? 'var(--att-text-secondary)' : 'var(--att-text-primary)' }}>
                {log.checkOut}
              </span>
            </div>

            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Break Duration</span>
              <span className={styles.detailsValText}>{log.breakDuration}</span>
            </div>

            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Total Working Hours</span>
              <span className={styles.detailsValText}><strong>{log.workingHours}</strong></span>
            </div>

            <div className={styles.detailsRow}>
              <span className={styles.detailsLabel}>Overtime Hours</span>
              <span className={styles.detailsValText}>{log.overtime}</span>
            </div>

            <div className={styles.detailsRow} style={{ borderBottom: 'none' }}>
              <span className={styles.detailsLabel}>Shift Status</span>
              <div className={styles.detailsValText}>
                <StatusBadge status={log.status} />
              </div>
            </div>

            {/* Shift notes */}
            {log.notes && (
              <div 
                style={{ 
                  marginTop: '10px', 
                  background: 'var(--att-bg)', 
                  padding: '10px 14px', 
                  borderRadius: '10px', 
                  border: '1px solid var(--att-border)',
                  fontSize: '12px',
                  lineHeight: '1.4'
                }}
              >
                <span style={{ display: 'block', fontWeight: '700', color: 'var(--att-text-secondary)', marginBottom: '3px' }}>
                  Log Notes
                </span>
                <span style={{ color: 'var(--att-text-primary)' }}>{log.notes}</span>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button 
            type="button" 
            className={styles.punchBtnSecondary} 
            onClick={onClose}
            style={{ height: '36px', padding: '0 16px' }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default AttendanceDetailsModal;
