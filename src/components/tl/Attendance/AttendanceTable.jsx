import React, { useState } from 'react';
import styles from './attendance.module.css';
import StatusBadge from './StatusBadge';
import { Eye, HelpCircle } from 'lucide-react';

const AttendanceTable = ({ logs, onViewDetails, onCorrection }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(logs.length / itemsPerPage);
  const paginatedLogs = logs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className={styles.tableResponsive}>
        <table className={styles.historyTable}>
          <thead>
            <tr>
              <th>Log Date</th>
              <th>Shift Details</th>
              <th>Check In</th>
              <th>Check Out</th>
              <th>Breaks</th>
              <th>Hours</th>
              <th>Overtime</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlignment: 'center', padding: '24px' }}>
                  <span style={{ color: 'var(--att-text-secondary)', fontSize: '13px' }}>
                    No matching attendance logs found.
                  </span>
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log) => (
                <tr key={log.id}>
                  <td><strong>{log.date}</strong></td>
                  <td>{log.shift}</td>
                  <td style={{ color: log.checkIn === '—' ? 'var(--att-text-secondary)' : 'var(--att-text-primary)' }}>
                    {log.checkIn}
                  </td>
                  <td style={{ color: log.checkOut === '—' ? 'var(--att-text-secondary)' : 'var(--att-text-primary)' }}>
                    {log.checkOut}
                  </td>
                  <td>{log.breakDuration}</td>
                  <td><strong>{log.workingHours}</strong></td>
                  <td style={{ color: log.overtime !== '0.0 Hrs' ? 'var(--att-primary)' : 'var(--att-text-secondary)', fontWeight: log.overtime !== '0.0 Hrs' ? '700' : '500' }}>
                    {log.overtime}
                  </td>
                  <td>
                    <StatusBadge status={log.status} />
                  </td>
                  <td>
                    <div className={styles.actionBtns}>
                      <button
                        type="button"
                        className={`${styles.btnActionText} ${styles.btnView}`}
                        onClick={() => onViewDetails(log)}
                        title="View hours details"
                      >
                        <Eye size={12} style={{ display: 'inline', marginRight: '4px' }} /> View
                      </button>


                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Pagination row */}
      {totalPages > 1 && (
        <div className={styles.paginationRow}>
          <span className={styles.paginationText}>
            Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({logs.length} items total)
          </span>
          <div className={styles.paginationBtns}>
            <button
              className={styles.btnPage}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Previous
            </button>
            <button
              className={styles.btnPage}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTable;
