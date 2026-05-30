import React from 'react';
import styles from './attendance.module.css';
import { Sparkles, CheckCircle, Flame, Milestone } from 'lucide-react';

const AttendanceInsights = ({ insights }) => {
  return (
    <div className={styles.insightsCard}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <Sparkles size={16} style={{ color: 'var(--att-primary)' }} />
        <h3 className={styles.insightHeadingText}>Attendance AI Insights</h3>
      </div>
      
      <div className={styles.insightList}>
        {/* Insight item 1 */}
        <div className={styles.insightItem}>
          <CheckCircle size={15} style={{ color: 'var(--att-success)', marginTop: '2px' }} />
          <span>
            You were punctual for <strong>{insights.punctualityRate || '94%'}</strong> of shifts this month.
          </span>
        </div>

        {/* Insight item 2 */}
        <div className={styles.insightItem}>
          <Milestone size={15} style={{ color: 'var(--att-primary)', marginTop: '2px' }} />
          <span>
            Average working duration: <strong>{insights.averageWorkHours || '8h 42m'}</strong> (Grace times respected).
          </span>
        </div>

        {/* Insight item 3 */}
        <div className={styles.insightItem}>
          <Flame size={15} style={{ color: 'var(--att-warning)', marginTop: '2px' }} />
          <span>
            Current check-in streak: <strong>{insights.attendanceStreak || '15 Days'}</strong> consecutive shifts.
          </span>
        </div>

        {/* Dynamic Consistency card */}
        <div 
          style={{ 
            marginTop: '8px', 
            background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)', 
            border: '1px solid var(--att-border)', 
            borderRadius: '12px', 
            padding: '10px 14px',
            fontSize: '12px',
            color: 'var(--att-text-primary)'
          }}
        >
          Your attendance consistency score is graded as <strong style={{ color: 'var(--att-primary)' }}>{insights.consistencyLevel || 'Excellent'}</strong>. No unexcused leaves logged.
        </div>
      </div>
    </div>
  );
};

export default AttendanceInsights;
