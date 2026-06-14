import React, { useState, useEffect, useMemo } from 'react';
import styles from './reports.module.css';
import { TrendingUp, Users, PieChart, CalendarDays, Download } from 'lucide-react';

const Reports = () => {
  const [activeView, setActiveView] = useState('productivity'); // 'productivity', 'completion', 'calendar'
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const res = await fetch('/api/team-lead/reports', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReportData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const velocityData = reportData?.velocityData || [];
  const productivityData = reportData?.productivityData || [];
  const donutData = reportData?.donutData || { completed: 0, inProgress: 0, blocked: 0, overdue: 0 };
  const leaveCalendar = reportData?.leaveCalendar || [];
  const leavesDetailData = reportData?.leavesDetailData || [];

  const handleExportLeavesCSV = () => {
    const headers = ['Employee Name', 'Approved Date', 'Leave Type', 'Duration', 'Status'];
    const rows = leavesDetailData.map(l => [
      `"${l.name}"`,
      `"${l.date}"`,
      `"${l.type}"`,
      `"${l.duration}"`,
      l.status
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Approved_Leaves_Report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Helpers for SVG Charts ---

  // Donut Chart Math (viewBox="0 0 200 200", radius = 70, circumference = 2 * PI * 70 = 439.82)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const renderDonutSegment = (value, color) => {
    if (!value) return null;
    const dashVal = (value / 100) * circumference;
    const dashGap = circumference - dashVal;
    const offset = currentOffset;
    currentOffset -= dashVal;
    
    return (
      <circle
        cx="100"
        cy="100"
        r={radius}
        className={styles.donutSegment}
        stroke={color}
        strokeDasharray={`${dashVal} ${dashGap}`}
        strokeDashoffset={offset}
      />
    );
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dynamic team reports...</div>;
  }

  return (
    <div className={styles.container}>
      {/* 1. Navigation Toolbar */}
      <div className={styles.topToolbar}>
        <button 
          className={`${styles.navTab} ${activeView === 'productivity' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('productivity')}
        >
          <Users size={16} /> Team Productivity Table
        </button>
        <button 
          className={`${styles.navTab} ${activeView === 'completion' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('completion')}
        >
          <PieChart size={16} /> Task Completion Rate
        </button>
        <button 
          className={`${styles.navTab} ${activeView === 'calendar' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('calendar')}
        >
          <CalendarDays size={16} /> Leave Calendar Export
        </button>
      </div>

      <div className={styles.reportsLayout}>
        
        {/* 2. CHART AREA (GRID-AREA: CHART) */}
        <div className={styles.chartCard}>
          


          {activeView === 'productivity' && (
            <div>
              <div className={styles.sectionTitle}>
                Team Tasks Comparison
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '500' }}>
                  <span style={{ color: '#cbd5e1' }}>■ Assigned</span>
                  <span style={{ color: 'var(--primary)' }}>■ Completed</span>
                </div>
              </div>
              <svg viewBox="0 0 500 200" className={styles.svgChart}>
                <line x1="40" y1="170" x2="480" y2="170" className={styles.chartAxis} />
                {productivityData.length === 0 && (
                  <text x="250" y="100" textAnchor="middle" fill="#94a3b8">No productivity data found</text>
                )}
                {productivityData.map((d, i) => {
                  const xBase = 70 + i * 140;
                  const yAssigned = 170 - d.assigned * 4.5;
                  const yCompleted = 170 - d.completed * 4.5;
                  return (
                    <g key={i}>
                      <rect x={xBase} y={yAssigned} width="28" height={d.assigned * 4.5} fill="#cbd5e1" rx="4" />
                      <text x={xBase + 14} y={yAssigned - 6} textAnchor="middle" fontSize="10px" fontWeight="700" fill="#64748b">{d.assigned}</text>
                      
                      <rect x={xBase + 34} y={yCompleted} width="28" height={d.completed * 4.5} fill="var(--primary)" rx="4" />
                      <text x={xBase + 48} y={yCompleted - 6} textAnchor="middle" fontSize="10px" fontWeight="700" fill="var(--primary)">{d.completed}</text>
                      
                      <text x={xBase + 31} y="190" textAnchor="middle" fontSize="12px" fontWeight="600" fill="#334155">{d.name.split(' ')[0]}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {activeView === 'completion' && (
            <div>
              <div className={styles.sectionTitle}>Task Completion Rate Overview</div>
              <div className={styles.donutGrid}>
                <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                  <svg viewBox="0 0 200 200" className={styles.donutSvg}>
                    {renderDonutSegment(donutData.completed, 'var(--success)')}
                    {renderDonutSegment(donutData.inProgress, 'var(--info)')}
                    {renderDonutSegment(donutData.blocked, 'var(--warning)')}
                    {renderDonutSegment(donutData.overdue, 'var(--danger)')}
                    {donutData.completed === 0 && donutData.inProgress === 0 && donutData.blocked === 0 && donutData.overdue === 0 && (
                      <circle cx="100" cy="100" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="15" />
                    )}
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)' }}>{donutData.completed}%</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Completed</div>
                  </div>
                </div>
                
                <div className={styles.donutSummary}>
                  <div className={styles.donutLegendItem}>
                    <div className={styles.legendLabel}>
                      <div className={styles.legendColor} style={{ background: 'var(--success)' }}></div> Completed
                    </div>
                    <div className={styles.legendValue}>{donutData.completed}%</div>
                  </div>
                  <div className={styles.donutLegendItem}>
                    <div className={styles.legendLabel}>
                      <div className={styles.legendColor} style={{ background: 'var(--info)' }}></div> In Progress
                    </div>
                    <div className={styles.legendValue}>{donutData.inProgress}%</div>
                  </div>
                  <div className={styles.donutLegendItem}>
                    <div className={styles.legendLabel}>
                      <div className={styles.legendColor} style={{ background: 'var(--warning)' }}></div> Blocked
                    </div>
                    <div className={styles.legendValue}>{donutData.blocked}%</div>
                  </div>
                  <div className={styles.donutLegendItem}>
                    <div className={styles.legendLabel}>
                      <div className={styles.legendColor} style={{ background: 'var(--danger)' }}></div> To Do
                    </div>
                    <div className={styles.legendValue}>{donutData.overdue}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'calendar' && (
            <div>
              <div className={styles.sectionTitle}>Approved Leaves Calendar</div>
              <div className={styles.calendarGrid}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className={styles.calHeader}>{d}</div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => {
                  const day = i + 1;
                  const leaves = leaveCalendar.filter(l => l.day === day);
                  const isOffset = i === 0 ? { gridColumnStart: 6 } : {};
                  
                  return (
                    <div key={day} className={styles.calCell} style={isOffset}>
                      <div className={styles.calDayNum}>{day}</div>
                      {leaves.map((leave, idx) => (
                        <div key={idx} className={styles.leaveBadge}>
                          {leave.name}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* 3. DATA TABLE (GRID-AREA: TABLE) */}
        <div className={styles.tableCard}>
          


          {activeView === 'productivity' && (
            <div>
              <div className={styles.sectionTitle}>Team Productivity Overview</div>
              <table className={styles.prodTable}>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Assigned Tasks</th>
                    <th>Completed Tasks</th>
                    <th>Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {productivityData.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No data available</td></tr>
                  ) : productivityData.map((user, i) => (
                    <tr key={i}>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.avatar}>{user.avatar}</div>
                          {user.name}
                        </div>
                      </td>
                      <td>{user.assigned}</td>
                      <td>{user.completed}</td>
                      <td><span style={{ color: 'var(--success)', fontWeight: 600 }}>{user.compRate}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'completion' && (
            <div>
              <div className={styles.sectionTitle}>Task Completion Category Details</div>
              <table className={styles.prodTable}>
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { category: 'Completed', pct: `${donutData.completed}%`, color: 'var(--success)' },
                    { category: 'In Progress', pct: `${donutData.inProgress}%`, color: 'var(--info)' },
                    { category: 'Blocked', pct: `${donutData.blocked}%`, color: 'var(--warning)' },
                    { category: 'To Do', pct: `${donutData.overdue}%`, color: 'var(--danger)' }
                  ].map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color }}></span>
                        {row.category}
                      </td>
                      <td style={{ fontWeight: '600' }}>{row.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeView === 'calendar' && (
            <div>
              <div className={styles.sectionTitle}>
                Approved Leaves Records
                {leavesDetailData.length > 0 && (
                  <button onClick={handleExportLeavesCSV} className={styles.exportBtn}>
                    <Download size={16} /> Export to CSV
                  </button>
                )}
              </div>
              <table className={styles.prodTable}>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Approved Leave Dates</th>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leavesDetailData.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No approved leaves found</td></tr>
                  ) : leavesDetailData.map((l, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '600' }}>{l.name}</td>
                      <td>{l.date}</td>
                      <td>{l.type}</td>
                      <td>{l.duration}</td>
                      <td>
                        <span style={{ 
                          fontSize: '11px', 
                          fontWeight: '700', 
                          padding: '4px 8px', 
                          borderRadius: '12px', 
                          backgroundColor: 'rgba(16, 185, 129, 0.1)', 
                          color: 'var(--success)'
                        }}>
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Reports;
