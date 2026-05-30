import React from 'react';
import styles from './attendance.module.css';
import { ShieldAlert } from 'lucide-react';

const EmptyState = ({ title = 'No Records Found', desc = "We couldn't find any attendance logs matching your selected filter guidelines." }) => {
  return (
    <div className={styles.emptyStateContainer}>
      <div style={{ color: 'var(--att-text-secondary)', marginBottom: '4px' }}>
        <ShieldAlert size={28} />
      </div>
      <h3 className={styles.emptyStateTitle}>{title}</h3>
      <p className={styles.emptyStateDesc}>{desc}</p>
    </div>
  );
};

export default EmptyState;
