import React from 'react';
import styles from './attendance.module.css';

const StatusBadge = ({ status }) => {
  const getBadgeClass = () => {
    switch (status) {
      case 'Present':
        return styles.badgePresent;
      case 'Late':
        return styles.badgeLate;
      case 'Absent':
        return styles.badgeAbsent;
      case 'Leave':
        return styles.badgeLeave;
      case 'Pending Correction':
      default:
        return styles.badgePending;
    }
  };

  return (
    <span className={`${styles.badge} ${getBadgeClass()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
