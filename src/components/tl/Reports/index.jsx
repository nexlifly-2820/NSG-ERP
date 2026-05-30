import React, { useState, useMemo } from 'react';
import styles from './reports.module.css';
import { TrendingUp, Users, PieChart, CalendarDays, Download } from 'lucide-react';

const Reports = () => {
  const [activeView, setActiveView] = useState('velocity'); // 'velocity', 'productivity', 'completion', 'calendar'

  // --- Mock Data ---
  const velocityData = useMemo(() => [
    { sprint: 'S1', actual: 35, planned: 40 },
    { sprint: 'S2', actual: 42, planned: 40 },
    { sprint: 'S3', actual: 48, planned: 45 },
    { sprint: 'S4', actual: 55, planned: 50 },
    { sprint: 'S5', actual: 60, planned: 60 }
  ], []);

  const productivityData = useMemo(() => [
    { name: 'Sarah Jenkins', avatar: 'SJ', assigned: 24, completed: 22, compRate: '91%', avgHours: '3.2', onTimeRate: '88%' },
    { name: 'Michael Chang', avatar: 'MC', assigned: 30, completed: 29, compRate: '96%', avgHours: '2.8', onTimeRate: '94%' },
    { name: 'David Miller', avatar: 'DM', assigned: 18, completed: 15, compRate: '83%', avgHours: '4.5', onTimeRate: '75%' }
  ], []);

  const donutData = {
    completed: 65,
    inProgress: 20,
    blocked: 10,
    overdue: 5
  };

  const leaveCalendar = [
    { day: 3, name: 'David Miller' },
    { day: 12, name: 'Sarah Jenkins' },
    { day: 13, name: 'Sarah Jenkins' },
    { day: 24, name: 'Michael Chang' }
  ];

  const leavesDetailData = [
    { name: 'David Miller', date: 'May 3, 2026', type: 'Sick Leave', duration: '1 Day', status: 'Approved' },
    { name: 'Sarah Jenkins', date: 'May 12 - May 13, 2026', type: 'Annual Leave', duration: '2 Days', status: 'Approved' },
    { name: 'Michael Chang', date: 'May 24, 2026', type: 'Casual Leave', duration: '1 Day', status: 'Approved' }
  ];

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
    link.setAttribute('download', 'Approved_Leaves_May_2026.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Helpers for SVG Charts ---
  // Velocity Line Chart Math (assuming viewBox="0 0 500 200")
  const xOffset = 50;
  const yOffset = 180;
  const xStep = 400 / (velocityData.length - 1);
  const maxVelocity = Math.max(...velocityData.map(d => Math.max(d.actual, d.planned))) + 10;
  const yRatio = 150 / maxVelocity;

  const actualPath = velocityData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xOffset + i * xStep} ${yOffset - d.actual * yRatio}`).join(' ');
  const plannedPath = velocityData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xOffset + i * xStep} ${yOffset - d.planned * yRatio}`).join(' ');
  
  const avgActual = velocityData.reduce((acc, curr) => acc + curr.actual, 0) / velocityData.length;
  const avgLineY = yOffset - avgActual * yRatio;

  // Donut Chart Math (viewBox="0 0 200 200", radius = 70, circumference = 2 * PI * 70 = 439.82)
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const renderDonutSegment = (value, color) => {
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

  return (
    <div className={styles.container}>
      {/* 1. Navigation Toolbar */}
      <div className={styles.topToolbar}>
        <button 
          className={`${styles.navTab} ${activeView === 'velocity' ? styles.activeTab : ''}`}
          onClick={() => setActiveView('velocity')}
        >
          <TrendingUp size={16} /> Sprint Velocity Chart
        </button>
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
          
          {activeView === 'velocity' && (
            <div>
              <div className={styles.sectionTitle}>
                Sprint Velocity Trend
                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: '500' }}>
                  <span style={{ color: 'var(--primary)' }}>— Actual</span>
                  <span style={{ color: '#94a3b8' }}>- - Planned</span>
                  <span style={{ color: 'var(--success)' }}>- - Average</span>
                </div>
              </div>
              <svg viewBox="0 0 500 200" className={styles.svgChart}>
                <line x1="40" y1="180" x2="480" y2="180" className={styles.chartAxis} />
                <line x1="40" y1="20" x2="40" y2="180" className={styles.chartAxis} />
                <line x1="40" y1={avgLineY} x2="480" y2={avgLineY} className={styles.lineAverage} />
                <path d={plannedPath} className={styles.linePlanned} />
                <path d={actualPath} className={styles.lineActual} />
                {velocityData.map((d, i) => {
                  const x = xOffset + i * xStep;
                  const yActual = yOffset - d.actual * yRatio;
                  const yPlanned = yOffset - d.planned * yRatio;
                  return (
                    <g key={i}>
                      <circle cx={x} cy={yActual} r="5" className={styles.chartPoint} />
                      <circle cx={x} cy={yPlanned} r="4" fill="#94a3b8" />
                      <text x={x} y="195" className={styles.chartLabel}>{d.sprint}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

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
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)' }}>{donutData.completed}%</div>
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
                      <div className={styles.legendColor} style={{ background: 'var(--danger)' }}></div> Overdue
                    </div>
                    <div className={styles.legendValue}>{donutData.overdue}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeView === 'calendar' && (
            <div>
              <div className={styles.sectionTitle}>May 2026 - Approved Leaves</div>
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
          
          {activeView === 'velocity' && (
            <div>
              <div className={styles.sectionTitle}>Sprint Velocity Details</div>
              <table className={styles.prodTable}>
                <thead>
                  <tr>
                    <th>Sprint</th>
                    <th>Planned Story Points</th>
                    <th>Completed Story Points</th>
                    <th>Variance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {velocityData.map((d, i) => {
                    const variance = d.actual - d.planned;
                    const isPositive = variance >= 0;
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: '600' }}>{d.sprint}</td>
                        <td>{d.planned} pts</td>
                        <td>{d.actual} pts</td>
                        <td style={{ color: isPositive ? 'var(--success)' : 'var(--danger)', fontWeight: '600' }}>
                          {isPositive ? `+${variance}` : variance} pts
                        </td>
                        <td>
                          <span style={{ 
                            fontSize: '11px', 
                            fontWeight: '700', 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            backgroundColor: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                            color: isPositive ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {variance > 0 ? 'EXCEEDED' : variance === 0 ? 'ACHIEVED' : 'SHORTFALL'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

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
                    <th>Avg Hours/Task</th>
                    <th>On-Time Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {productivityData.map((user, i) => (
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
                      <td>{user.avgHours}h</td>
                      <td>{user.onTimeRate}</td>
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
                    <th>Task Count</th>
                    <th>Percentage</th>
                    <th>Priority Breakdown (H/M/L)</th>
                    <th>Avg Days Open</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { category: 'Completed', count: 65, pct: '65%', priority: '22H / 30M / 13L', avgDays: '4.2 days', color: 'var(--success)' },
                    { category: 'In Progress', count: 20, pct: '20%', priority: '8H / 10M / 2L', avgDays: '12.5 days', color: 'var(--info)' },
                    { category: 'Blocked', count: 10, pct: '10%', priority: '5H / 4M / 1L', avgDays: '18.2 days', color: 'var(--warning)' },
                    { category: 'Overdue', count: 5, pct: '5%', priority: '3H / 2M / 0L', avgDays: '25.0 days', color: 'var(--danger)' }
                  ].map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: row.color }}></span>
                        {row.category}
                      </td>
                      <td>{row.count} tasks</td>
                      <td style={{ fontWeight: '600' }}>{row.pct}</td>
                      <td>{row.priority}</td>
                      <td>{row.avgDays}</td>
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
                <button onClick={handleExportLeavesCSV} className={styles.exportBtn}>
                  <Download size={16} /> Export to CSV
                </button>
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
                  {leavesDetailData.map((l, i) => (
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
