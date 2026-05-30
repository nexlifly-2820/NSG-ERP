import React from 'react';
import styles from './attendance.module.css';
import { Search } from 'lucide-react';

const AttendanceFilters = ({
  search,
  setSearch,
  status,
  setStatus,
  date,
  setDate,
  onReset
}) => {
  return (
    <div className={styles.filterRowGrid}>
      {/* Search Input bar */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <Search 
          size={14} 
          style={{ position: 'absolute', left: '10px', color: 'var(--att-text-secondary)' }} 
        />
        <input
          type="text"
          placeholder="Search by notes or shift..."
          className={styles.inputField}
          style={{ paddingLeft: '32px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Status selection */}
      <div>
        <select
          className={styles.selectField}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Present">Present</option>
          <option value="Late">Late</option>
          <option value="Absent">Absent</option>
          <option value="Leave">Leave</option>
          <option value="Pending Correction">Pending Correction</option>
        </select>
      </div>

      {/* Date Filter picker */}
      <div>
        <input
          type="date"
          className={styles.inputField}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          placeholder="Select specific day"
          title="Filter from Date"
        />
      </div>

      {/* Action controls */}
      <div>
        <button
          type="button"
          className={styles.punchBtnSecondary}
          onClick={onReset}
          style={{ width: '100%', height: '40px' }}
        >
          Clear Filters
        </button>
      </div>

    </div>
  );
};

export default AttendanceFilters;
