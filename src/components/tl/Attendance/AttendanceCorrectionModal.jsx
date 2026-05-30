import React, { useState } from 'react';
import styles from './attendance.module.css';
import { X, ShieldAlert } from 'lucide-react';

const AttendanceCorrectionModal = ({ date, onSubmit, onClose }) => {
  const [issueType, setIssueType] = useState('Missed Check In');
  const [correctTime, setCorrectTime] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!correctTime || !reason.trim()) {
      alert('Please specify both the correct timestamp and your correction reason.');
      return;
    }

    const requestDetails = {
      date,
      issueType,
      correctTime,
      reason
    };

    onSubmit(requestDetails);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} style={{ color: 'var(--att-warning)' }} />
            Request Attendance Correction
          </h3>
          <button type="button" className={styles.btnCloseModal} onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.correctionForm}>
              {/* Date (Disabled) */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Date</label>
                <input
                  type="text"
                  className={styles.inputField}
                  value={date}
                  disabled
                  style={{ background: 'var(--att-bg)', color: 'var(--att-text-secondary)', fontWeight: '600' }}
                />
              </div>

              {/* Correction Category selection */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Correction Type *</label>
                <select
                  className={styles.selectField}
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                >
                  <option value="Missed Check In">Missed Check In</option>
                  <option value="Missed Check Out">Missed Check Out</option>
                  <option value="Incorrect Clock Hours">Incorrect Clock Hours</option>
                </select>
              </div>

              {/* Correct Time */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Correct Time *</label>
                <input
                  type="text"
                  placeholder="e.g. 09:00 AM or 06:12 PM"
                  className={styles.inputField}
                  value={correctTime}
                  onChange={(e) => setCorrectTime(e.target.value)}
                  required
                />
              </div>

              {/* Reason */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Reason for Correction *</label>
                <textarea
                  className={styles.textareaField}
                  placeholder="Please describe why this adjustment is needed (e.g. forgotten swipe, network outage)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className={styles.modalFooter}>
            <button 
              type="button" 
              className={styles.punchBtnSecondary} 
              onClick={onClose}
              style={{ height: '36px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={styles.punchBtnPrimary}
              style={{ height: '36px' }}
            >
              Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AttendanceCorrectionModal;
