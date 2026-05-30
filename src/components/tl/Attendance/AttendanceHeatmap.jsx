import React, { useState } from 'react';
import styles from './attendance.module.css';
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';

const AttendanceHeatmap = ({ logs }) => {
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 4, 1)); // Default to May 2026

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth(); // 0-indexed
  
  const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(year, month);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const currentMonthName = monthNames[month];

  // Populate grid array for selected month
  const gridCells = Array.from({ length: daysInMonth }, (_, idx) => {
    const dayNum = idx + 1;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    
    // Find logs in the calendar statuses
    const dayLog = logs.find(l => l.date === dateStr);
    
    const dayOfWeek = new Date(year, month, dayNum).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let status = dayLog ? dayLog.status : 'Empty';
    if (status === 'Empty' && isWeekend) {
      status = 'Weekend';
    }

    return {
      dayNum,
      dateStr,
      status
    };
  });

  const handlePrevMonth = () => {
    setSelectedDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(year, month + 1, 1));
  };

  const getCellClass = (status) => {
    switch (status) {
      case 'Present': return styles.cellPresent;
      case 'Late': return styles.cellLate;
      case 'Absent': return styles.cellAbsent;
      case 'Leave': return styles.cellLeave;
      case 'Weekend': return styles.cellWeekendHeatmap;
      case 'Empty':
      default: return styles.cellEmpty;
    }
  };

  return (
    <div className={styles.analyticsCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
        <div>
          <h3 className={styles.insightHeadingText} style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0' }}>
            <CalendarRange size={16} style={{ color: 'var(--att-primary)' }} />
            Monthly Attendance Heatmap
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--att-text-secondary)', display: 'block', marginTop: '3px' }}>
            Visualizing {currentMonthName} {year} consistency profile
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={handlePrevMonth} 
            style={{ background: 'none', border: '1px solid var(--att-border)', borderRadius: '4px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: '13px', fontWeight: '600', minWidth: '80px', textAlign: 'center', color: 'var(--att-text-primary)' }}>
            {currentMonthName} {year}
          </span>
          <button 
            onClick={handleNextMonth} 
            style={{ background: 'none', border: '1px solid var(--att-border)', borderRadius: '4px', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.heatmapDaysGrid}>
        {gridCells.map((cell) => (
          <div 
            key={cell.dayNum} 
            className={`${styles.heatmapCell} ${getCellClass(cell.status)}`}
            title={`${currentMonthName} ${cell.dayNum}, ${year} - Status: ${cell.status}`}
          >
            {cell.dayNum}
          </div>
        ))}
      </div>

      {/* Grid Legend indicator guides */}
      <div style={{ display: 'flex', gap: '12px', fontSize: '10px', fontWeight: '700', borderTop: '1px solid var(--att-border)', paddingTop: '10px', marginTop: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3.5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--att-success)' }} />
          <span>Present</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3.5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--att-warning)' }} />
          <span>Late</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3.5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: 'var(--att-danger)' }} />
          <span>Absent</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3.5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#a855f7' }} />
          <span>Leave</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3.5px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', backgroundColor: '#eef2ff', border: '1px dashed rgba(79, 70, 229, 0.4)' }} />
          <span>Weekend</span>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeatmap;
