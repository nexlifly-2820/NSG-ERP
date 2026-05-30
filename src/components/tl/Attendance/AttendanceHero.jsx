import React from 'react';
import styles from './attendance.module.css';
import StatusBadge from './StatusBadge';
import { Sparkles, Calendar } from 'lucide-react';

const AttendanceHero = ({ status, workSeconds, currentTime }) => {
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className={styles.heroCard}>
      <div className={styles.heroMain}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--att-primary)' }}>
          <Sparkles size={16} />
          <span style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            OrangeHRM Workstation
          </span>
        </div>
        <h2 className={styles.heroGreet}>Good Morning, Michael 👋</h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
          <Calendar size={13} style={{ color: 'var(--att-text-secondary)' }} />
          <span className={styles.heroDateText}>{formatDate(currentTime)}</span>
        </div>

        <div className={styles.heroStatusBadgeRow}>
          <StatusBadge status={status} />
          {status === 'Checked In' && (
            <span className={styles.heroTimerText}>
              Clocked: <strong>{formatDuration(workSeconds)}</strong>
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
        <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--att-text-secondary)', textTransform: 'uppercase' }}>
          Current Workstation Time
        </span>
        <div className={styles.heroLiveClock}>
          {formatTime(currentTime)}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHero;
