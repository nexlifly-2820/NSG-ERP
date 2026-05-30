import React from 'react';
import styles from './attendance.module.css';
import { CalendarCheck, AlertTriangle, Timer, Coffee } from 'lucide-react';

const AttendanceStats = ({ stats, totalExpected = 20 }) => {
  return (
    <div className={styles.statsGrid}>
      
      {/* 1. Present Days Card */}
      <div className={styles.statCard}>
        <div 
          className={styles.statIconBox} 
          style={{ backgroundColor: 'rgba(16, 185, 129, 0.08)', color: 'var(--att-success)' }}
        >
          <CalendarCheck size={20} />
        </div>
        <div className={styles.statMeta}>
          <span className={styles.statLabel}>Present Days</span>
          <span className={styles.statValue}>18 <span style={{ fontSize: '12px', color: 'var(--att-text-secondary)' }}>/ {totalExpected} Days</span></span>
        </div>
      </div>

      {/* 2. Late Arrivals Card */}
      <div className={styles.statCard}>
        <div 
          className={styles.statIconBox} 
          style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', color: 'var(--att-warning)' }}
        >
          <AlertTriangle size={20} />
        </div>
        <div className={styles.statMeta}>
          <span className={styles.statLabel}>Late Arrivals</span>
          <span className={styles.statValue}>{stats.lateArrivals || 2} <span style={{ fontSize: '12px', color: 'var(--att-text-secondary)' }}>Days</span></span>
        </div>
      </div>

      {/* 3. Overtime Hours Card */}
      <div className={styles.statCard}>
        <div 
          className={styles.statIconBox} 
          style={{ backgroundColor: 'rgba(79, 70, 229, 0.08)', color: 'var(--att-primary)' }}
        >
          <Timer size={20} />
        </div>
        <div className={styles.statMeta}>
          <span className={styles.statLabel}>Overtime Clocked</span>
          <span className={styles.statValue}>{stats.overtimeTotal || '12.5'} <span style={{ fontSize: '12px', color: 'var(--att-text-secondary)' }}>Hours</span></span>
        </div>
      </div>

      {/* 4. Break Time Card */}
      <div className={styles.statCard}>
        <div 
          className={styles.statIconBox} 
          style={{ backgroundColor: 'rgba(79, 70, 229, 0.08)', color: 'var(--att-primary)' }}
        >
          <Coffee size={20} />
        </div>
        <div className={styles.statMeta}>
          <span className={styles.statLabel}>Avg Break Time</span>
          <span className={styles.statValue}>{stats.averageBreakTime || '48'} <span style={{ fontSize: '12px', color: 'var(--att-text-secondary)' }}>Mins</span></span>
        </div>
      </div>

    </div>
  );
};

export default AttendanceStats;
