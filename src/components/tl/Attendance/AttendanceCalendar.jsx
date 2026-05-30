import React, { useState } from 'react';
import styles from './attendance.module.css';
import { ChevronLeft, ChevronRight, Gift } from 'lucide-react';

const corporateHolidays = [
  { name: "New Year's Day", date: '2026-01-01', type: 'Public' },
  { name: 'Martin Luther King Jr. Day', date: '2026-01-19', type: 'Public' },
  { name: 'Memorial Day', date: '2026-05-25', type: 'Company' },
  { name: 'Juneteenth Day', date: '2026-06-19', type: 'Public' },
  { name: 'Independence Day', date: '2026-07-04', type: 'Public' },
  { name: 'Labor Day', date: '2026-09-07', type: 'Public' },
  { name: 'Thanksgiving Day', date: '2026-11-26', type: 'Company' },
  { name: 'Christmas Day', date: '2026-12-25', type: 'Company' },
  { name: "Mother's Day", date: '2026-05-10', type: 'Optional' },
  { name: 'Victoria Day', date: '2026-05-18', type: 'Optional' }
];

const AttendanceCalendar = ({ logs }) => {
  // Local state managing currently navigated month/year date
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Default to May 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-based index

  // Calculate total days in current active month
  const totalDays = new Date(year, month + 1, 0).getDate();

  // Calculate day-of-week index offset (adjust so Monday = 0, Sunday = 6)
  const startDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sunday, 1=Monday...
  const startOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Generate complete grid day cell items
  const daysArray = Array.from({ length: startOffset }, () => null)
    .concat(Array.from({ length: totalDays }, (_, idx) => idx + 1));

  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const getDayLogStatus = (dayNum) => {
    if (!dayNum) return null;
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    const foundLog = logs.find(l => l.date === dateStr);
    return foundLog ? foundLog.status : null;
  };

  const getDayHoliday = (dayNum) => {
    if (!dayNum) return null;
    const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`;
    return corporateHolidays.find(h => h.date === dateStr);
  };

  const checkIsWeekend = (dayNum) => {
    if (!dayNum) return false;
    const dayOfWeek = new Date(year, month, dayNum).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
  };

  const getDotClass = (status) => {
    switch (status) {
      case 'Present':
        return styles.dotPresent;
      case 'Late':
        return styles.dotLate;
      case 'Absent':
        return styles.dotAbsent;
      case 'Leave':
        return styles.dotLeave;
      default:
        return '';
    }
  };

  const formattedMonthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className={styles.tableCard}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--att-border)', paddingBottom: '12px', marginBottom: '12px' }}>
        <h3 className={styles.calendarTitle} style={{ margin: 0 }}>Attendance Calendar View</h3>
        
        {/* Month switcher navigation controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className={styles.calendarNavBtn} 
            onClick={handlePrevMonth}
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--att-primary)', minWidth: '110px', textAlign: 'center' }}>
            {formattedMonthYear}
          </span>
          
          <button 
            className={styles.calendarNavBtn} 
            onClick={handleNextMonth}
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={styles.calendarGridWrapper}>
        {/* Days Header Row */}
        <div className={styles.calendarDaysHeader}>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span style={{ color: 'var(--att-danger)' }}>Sat</span>
          <span style={{ color: 'var(--att-danger)' }}>Sun</span>
        </div>

        {/* Days Grid Cells Container */}
        <div className={styles.calendarDaysGrid}>
          {daysArray.map((day, idx) => {
            if (day === null) {
              return <div key={idx} className={`${styles.calendarCell} ${styles.calendarCellEmpty}`} />;
            }

            const status = getDayLogStatus(day);
            const holiday = getDayHoliday(day);
            const isWeekend = checkIsWeekend(day);

            // Conditional grid cell background highlight
            const cellClass = `${styles.calendarCell} ${
              holiday ? styles.calendarCellHoliday : isWeekend ? styles.calendarCellWeekend : ''
            }`;

            return (
              <div key={idx} className={cellClass} title={`${formattedMonthYear} ${day}`}>
                <span className={styles.calendarDateNum}>{day}</span>
                
                {status && (
                  <span className={`${styles.cellDotLabel} ${getDotClass(status)}`}>
                    {status}
                  </span>
                )}

                {/* If it's a registered holiday, display a clear label with Gift vector icon */}
                {holiday && (
                  <span className={styles.holidayLabel} title={holiday.name}>
                    🎉 {holiday.name}
                  </span>
                )}

                {/* If it's a weekend and has no custom status/holiday, label it clearly */}
                {isWeekend && !status && !holiday && (
                  <span className={styles.weekendLabel}>
                    Weekend
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
