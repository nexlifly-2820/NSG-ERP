import React, { useState, useEffect } from 'react';

export function ReportsEngineView() {
  const [activeReport, setActiveReport] = useState('overview');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      setReportData(null);
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const res = await fetch(`/api/hr-portal/reports/${activeReport}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setReportData(await res.json());
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchReport();
  }, [activeReport]);

  const rd = reportData || {};

  // ── STAT CARD helper ───────────────────────────────────────────────────────
  const StatCard = ({ title, value, sub, color, icon }) => (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderLeft: `4px solid ${color}`,
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      transition: 'transform 0.15s',
      cursor: 'default'
    }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>{title}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <span style={{ fontSize: 32, fontWeight: 800, color }}>{value}</span>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{sub}</span>
    </div>
  );

  // ── BAR CHART helper ───────────────────────────────────────────────────────
  const BarChart = ({ data, color }) => {
    const max = Math.max(...data.map(d => d.value), 1);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 110, fontSize: 12, color: 'var(--text-secondary)', textAlign: 'right', flexShrink: 0 }}>{d.label}</div>
            <div style={{ flex: 1, height: 22, background: 'var(--bg-primary)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${(d.value / max) * 100}%`, height: '100%', background: color, borderRadius: 6, transition: 'width 0.5s ease', display: 'flex', alignItems: 'center', paddingLeft: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{d.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'leave', label: '🌴 Leave' },
    { id: 'workforce', label: '👥 Workforce' },
  ];

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Reports & BI Engine</h1>
          <p>Live analytics from real HR data — leave and workforce insights.</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--border-color)', marginBottom: 24, paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveReport(t.id)} style={{
            background: 'none', border: 'none', padding: '6px 14px', cursor: 'pointer',
            color: activeReport === t.id ? 'var(--accent-pink)' : 'var(--text-muted)',
            borderBottom: activeReport === t.id ? '2.5px solid var(--accent-pink)' : '2.5px solid transparent',
            fontWeight: 600, fontSize: 13, transition: 'all 0.15s'
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeReport === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            <StatCard title="Total Employees" value={rd.totalEmployees || 0} sub="Active headcount" color="#60a5fa" icon="👥" />
            <StatCard title="Attrition Rate" value={`${rd.attritionRate || 0}%`} sub={`${rd.approvedResignations || 0} voluntary exits`} color="#f87171" icon="📉" />
            <StatCard title="Compliance Rate" value={`${rd.complianceRate || 0}%`} sub={`${rd.passedQuiz || 0}/${rd.totalEmployees || 0} quiz passed`} color="#10b981" icon="✅" />
            <StatCard title="Pending Actions" value={rd.pendingActions || 0} sub="Leave + increment queue" color="#fbbf24" icon="⚡" />
          </div>

          {/* Department breakdown bar chart */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18, color: 'var(--text-primary)' }}>👥 Headcount by Department</div>
            {!rd.departmentHeadcounts || Object.keys(rd.departmentHeadcounts).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No employee data available.</div>
            ) : (
              <BarChart data={Object.entries(rd.departmentHeadcounts).map(([label, value]) => ({ label, value }))} color="#60a5fa" />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--text-primary)' }}>📋 Onboarding Progress</div>
              <div style={{ position: 'relative', height: 10, background: 'var(--bg-primary)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ width: `0%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 10, transition: 'width 0.5s' }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>0 / 0 tasks completed (0%)</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16, color: 'var(--text-primary)' }}>🌴 Leave Utilization</div>
              <div style={{ position: 'relative', height: 10, background: 'var(--bg-primary)', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                <div style={{ width: `0%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: 10 }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Data available in Leave tab</div>
            </div>
          </div>
        </div>
      )}


      {/* ── LEAVE ── */}
      {activeReport === 'leave' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <StatCard title="Pending Requests" value={rd.pendingRequests || 0} sub="Awaiting HR approval" color="#fbbf24" icon="⏳" />
            <StatCard title="Approved This Year" value={rd.approvedThisYear || 0} sub="Leave requests approved" color="#10b981" icon="✅" />
            <StatCard title="Avg Leave Used" value={`${rd.avgLeaveUsedPct || 0}%`} sub="Of total allocation per employee" color="#60a5fa" icon="📊" />
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>🌴 Leave Balance by Employee</div>
            {!rd.employeeBalances || rd.employeeBalances.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No leave balance data available.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Employee', 'CL Left', 'SL Left', 'EL Left', 'Total Left', 'Utilized'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rd.employeeBalances.map((lb, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{lb.employee_name}</td>
                      <td style={{ padding: '12px 16px' }}>{lb.cl_left}</td>
                      <td style={{ padding: '12px 16px' }}>{lb.sl_left}</td>
                      <td style={{ padding: '12px 16px' }}>{lb.el_left}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981' }}>{lb.total_left}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 80, height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${lb.utilization_pct}%`, height: '100%', background: lb.utilization_pct > 70 ? '#f87171' : '#fbbf24', borderRadius: 3 }} />
                          </div>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{lb.utilization_pct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}


      {/* ── WORKFORCE ── */}
      {activeReport === 'workforce' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <StatCard title="Active Employees" value={rd.activeEmployees || 0} sub="Currently on payroll" color="#10b981" icon="👥" />
            <StatCard title="Attrition Rate" value={`${rd.attritionRate || 0}%`} sub={`${rd.approvedResignations || 0} exits this year`} color="#f87171" icon="📉" />
            <StatCard title="Departments" value={rd.departmentsCount || 0} sub="Active teams" color="#a78bfa" icon="🏢" />
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 18 }}>🏢 Department Headcount</div>
            {!rd.departmentHeadcounts || Object.keys(rd.departmentHeadcounts).length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No employee data.</div>
            ) : (
              <BarChart data={Object.entries(rd.departmentHeadcounts).sort((a,b) => b[1]-a[1]).map(([label, value]) => ({ label, value }))} color="var(--accent-pink)" />
            )}
          </div>

          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>📋 Employee Directory</div>
            {!rd.employeeDirectory ? null : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    {['Name', 'Department', 'Designation', 'Grade', 'Status'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rd.employeeDirectory.map((emp, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-color)', opacity: emp.exited ? 0.5 : 1 }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{emp.name}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>{emp.department || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>{emp.designation || '—'}</td>
                      <td style={{ padding: '12px 16px' }}>G{emp.grade || 1}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                          background: emp.exited ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                          color: emp.exited ? '#f87171' : '#10b981' }}>
                          {emp.exited ? 'Exited' : 'Active'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
