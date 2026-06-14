import React, { useState, useEffect, useMemo } from 'react';
import { 
  Download, Calendar, Filter, FileSpreadsheet, Activity, RefreshCw, AlertCircle
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import '../CEO.css';

const REPORT_TYPES = ['Headcount', 'Payroll Cost', 'Attendance', 'Leave Trends', 'Project Status', 'Attrition'];
const COLORS = ['var(--ceo-primary)', 'var(--ceo-success)', 'var(--ceo-warning)', 'var(--ceo-purple)', 'var(--ceo-danger)'];



export default function Reports() {
  const [activeReport, setActiveReport] = useState('Headcount');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [dateRange, setDateRange] = useState('Jan 1 - Jul 31, 2025');

  // Real data from backend
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = () => localStorage.getItem('nsg_jwt_token');

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ceo-portal/reports/analytics', {
        headers: { 'Authorization': `Bearer ${token()}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
      setError('Could not load live analytics.');
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // Resolve data — use real data or empty defaults
  const rawData = useMemo(() => ({
    headcount: analytics?.headcount || [],
    payroll: analytics?.payroll || [],
    attendance: analytics?.attendance || [],
    leaveTrends: analytics?.leaveTrends || [],
    projectStatus: analytics?.projectStatus || [],
    attrition: analytics?.attrition || [],
    departments: analytics?.departments || [],
    totalEmployees: analytics?.totalEmployees || 0,
    totalProjects: analytics?.totalProjects || 0,
  }), [analytics]);

  // Apply date range filter (slice months)
  const applyDateFilter = (arr) => {
    if (!Array.isArray(arr)) return arr;
    if (dateRange === 'Last 30 Days') return arr.slice(-1);
    if (dateRange === 'Last Quarter') return arr.slice(-3);
    return arr;
  };

  // Apply dept filter for attendance
  const filteredAttendance = useMemo(() => {
    if (selectedDept !== 'All Departments') {
      return rawData.attendance.filter(d => d.dept === selectedDept);
    }
    return rawData.attendance;
  }, [rawData.attendance, selectedDept]);

  const filteredHeadcount = useMemo(() => applyDateFilter(rawData.headcount), [rawData.headcount, dateRange]);
  const filteredPayroll = useMemo(() => applyDateFilter(rawData.payroll), [rawData.payroll, dateRange]);
  const filteredLeave = useMemo(() => applyDateFilter(rawData.leaveTrends), [rawData.leaveTrends, dateRange]);
  const filteredProject = rawData.projectStatus;
  const filteredAttrition = useMemo(() => applyDateFilter(rawData.attrition), [rawData.attrition, dateRange]);

  // Real CSV Export
  const handleExport = () => {
    setIsExporting(true);
    try {
      let rows = [];
      let filename = `${activeReport.replace(/ /g, '_')}_Report.csv`;

      if (activeReport === 'Headcount') {
        rows = [['Month', 'Total Headcount', 'New Hires', 'Exits'], ...filteredHeadcount.map(d => [d.month, d.count, d.new, d.left])];
      } else if (activeReport === 'Payroll Cost') {
        rows = [['Month', 'Cost (₹M)'], ...filteredPayroll.map(d => [d.month, d.cost])];
      } else if (activeReport === 'Attendance') {
        rows = [['Department', 'Present %', 'WFH %', 'Leave %'], ...filteredAttendance.map(d => [d.dept, d.present, d.wfh, d.leave])];
      } else if (activeReport === 'Leave Trends') {
        rows = [['Month', 'Casual', 'Sick', 'Total'], ...filteredLeave.map(d => [d.month, d.casual, d.sick, d.casual + d.sick])];
      } else if (activeReport === 'Project Status') {
        rows = [['Status', 'Count'], ...filteredProject.map(d => [d.name, d.value])];
      } else {
        rows = [['Month', 'Attrition Rate (%)'], ...filteredAttrition.map(d => [d.month, d.rate])];
      }

      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const renderChart = () => {
    if (activeReport === 'Headcount') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredHeadcount}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'var(--ceo-bg)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--ceo-border)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="count" name="Total Headcount" stroke="var(--ceo-primary)" strokeWidth={3} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="new" name="New Hires" stroke="var(--ceo-success)" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="left" name="Exits" stroke="var(--ceo-danger)" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="4 4" />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (activeReport === 'Payroll Cost') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredPayroll}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}M`} />
            <Tooltip cursor={{ fill: 'var(--ceo-bg)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--ceo-border)' }} formatter={(v) => [`₹${v}M`, 'Cost']} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="cost" name="Payroll Cost" stroke="var(--ceo-danger)" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    } else if (activeReport === 'Attendance') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredAttendance}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
            <XAxis dataKey="dept" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'var(--ceo-bg)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--ceo-border)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="present" name="Present %" fill="var(--ceo-primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="wfh" name="WFH %" fill="var(--ceo-purple)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="leave" name="Leave %" fill="var(--ceo-warning)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (activeReport === 'Leave Trends') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={filteredLeave}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'var(--ceo-bg)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--ceo-border)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="casual" name="Casual Leaves" fill="var(--ceo-warning)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sick" name="Sick Leaves" fill="var(--ceo-danger)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (activeReport === 'Project Status') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={filteredProject} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value" label={({name, value}) => `${name}: ${value}`}>
              {filteredProject.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--ceo-border)' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
          </PieChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredAttrition}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip cursor={{ fill: 'var(--ceo-bg)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--ceo-border)' }} formatter={(v) => [`${v}%`, 'Attrition Rate']} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="rate" name="Attrition Rate" stroke="var(--ceo-purple)" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  const renderTableHeaders = () => {
    if (activeReport === 'Headcount') return (<tr><th>Month</th><th>Total Headcount</th><th>New Hires</th><th>Exits</th></tr>);
    if (activeReport === 'Payroll Cost') return (<tr><th>Month</th><th>Total Payroll Cost</th><th>Change (MoM)</th></tr>);
    if (activeReport === 'Attendance') return (<tr><th>Department</th><th>Present (%)</th><th>WFH (%)</th><th>Leave (%)</th></tr>);
    if (activeReport === 'Leave Trends') return (<tr><th>Month</th><th>Casual Leaves</th><th>Sick Leaves</th><th>Total</th></tr>);
    if (activeReport === 'Project Status') return (<tr><th>Status</th><th>Projects Count</th></tr>);
    return (<tr><th>Month</th><th>Attrition Rate (%)</th></tr>);
  };

  const renderTableRows = () => {
    if (activeReport === 'Headcount') {
      return filteredHeadcount.map((d, i) => (
        <tr key={i}>
          <td style={{ fontWeight: 600 }}>{d.month}</td>
          <td>{d.count}</td>
          <td><span style={{ color: 'var(--ceo-success)' }}>+{d.new}</span></td>
          <td><span style={{ color: 'var(--ceo-danger)' }}>{d.left > 0 ? `-${d.left}` : '—'}</span></td>
        </tr>
      ));
    } else if (activeReport === 'Payroll Cost') {
      return filteredPayroll.map((d, i) => {
        const prev = i > 0 ? filteredPayroll[i-1].cost : d.cost;
        const change = prev ? ((d.cost - prev) / prev * 100).toFixed(1) : 0;
        return (
          <tr key={i}>
            <td style={{ fontWeight: 600 }}>{d.month}</td>
            <td>₹{d.cost}M</td>
            <td>
              {change > 0 ? <span style={{ color: 'var(--ceo-danger)' }}>+{change}%</span> :
               change < 0 ? <span style={{ color: 'var(--ceo-success)' }}>{change}%</span> :
               <span style={{ color: 'var(--ceo-text-muted)' }}>0%</span>}
            </td>
          </tr>
        );
      });
    } else if (activeReport === 'Attendance') {
      return filteredAttendance.map((d, i) => (
        <tr key={i}>
          <td style={{ fontWeight: 600 }}>{d.dept}</td>
          <td>{d.present}%</td>
          <td>{d.wfh}%</td>
          <td>{d.leave}%</td>
        </tr>
      ));
    } else if (activeReport === 'Leave Trends') {
      return filteredLeave.map((d, i) => (
        <tr key={i}>
          <td style={{ fontWeight: 600 }}>{d.month}</td>
          <td>{d.casual}</td>
          <td>{d.sick}</td>
          <td style={{ fontWeight: 700 }}>{d.casual + d.sick}</td>
        </tr>
      ));
    } else if (activeReport === 'Project Status') {
      return filteredProject.map((d, i) => (
        <tr key={i}>
          <td style={{ fontWeight: 600 }}>{d.name}</td>
          <td>{d.value}</td>
        </tr>
      ));
    } else {
      return filteredAttrition.map((d, i) => (
        <tr key={i}>
          <td style={{ fontWeight: 600 }}>{d.month}</td>
          <td style={{ color: d.rate > 3.5 ? 'var(--ceo-danger)' : 'var(--ceo-text-primary)', fontWeight: d.rate > 3.5 ? 700 : 400 }}>
            {d.rate}%
          </td>
        </tr>
      ));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="ceo-typography-page-title">Enterprise Analytics</h1>
          <p className="ceo-typography-body" style={{ marginTop: '4px' }}>
            Generate and export cross-departmental analytics reports.
            {analytics && (
              <span style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--ceo-success)', fontWeight: 600 }}>
                ● Live — {rawData.totalEmployees} employees · {rawData.totalProjects} projects
              </span>
            )}
            {error && (
              <span style={{ marginLeft: '12px', fontSize: '12px', color: 'var(--ceo-warning)', fontWeight: 600 }}>
                ⚠ Estimated data
              </span>
            )}
          </p>
        </div>
        <button className="ceo-btn" onClick={fetchAnalytics} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* CSS GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: '56px 52px 320px 1fr',
        gridTemplateAreas: `
          "typebar"
          "filters"
          "chart"
          "table"
        `,
        gap: '24px',
        flex: 1
      }}>
        
        {/* REPORT TYPE TABS */}
        <div style={{ gridArea: 'typebar', display: 'flex', gap: '8px', borderBottom: '1px solid var(--ceo-border)', overflowX: 'auto' }}>
          {REPORT_TYPES.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveReport(tab)}
              style={{
                padding: '12px 20px',
                background: activeReport === tab ? 'var(--tab-active-bg)' : 'transparent',
                color: activeReport === tab ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                border: 'none',
                borderBottom: activeReport === tab ? '2px solid var(--ceo-primary)' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* FILTERS TOOLBAR */}
        <div style={{ gridArea: 'filters', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--ceo-card-bg)', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '6px 12px', alignItems: 'center', gap: '8px', boxShadow: 'var(--ceo-shadow)' }}>
            <Calendar size={16} color="var(--ceo-text-secondary)" />
            <select value={dateRange} onChange={e => setDateRange(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', paddingRight: '8px' }}>
              <option value="Jan 1 - Jul 31, 2025">Jan 1 - Jul 31, 2025</option>
              <option value="Last 30 Days">Last 30 Days</option>
              <option value="Last Quarter">Last Quarter</option>
              <option value="Year to Date">Year to Date</option>
            </select>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--ceo-card-bg)', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '6px 12px', alignItems: 'center', gap: '8px', boxShadow: 'var(--ceo-shadow)' }}>
            <Filter size={16} color="var(--ceo-text-secondary)" />
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', fontWeight: 500, cursor: 'pointer', paddingRight: '8px' }}>
              <option value="All Departments">All Departments</option>
              {rawData.departments.map(d => <option key={d} value={d}>{d}</option>)}

            </select>
          </div>

          <div style={{ flex: 1 }}></div>

          <button className="ceo-btn ceo-btn-primary" onClick={handleExport} disabled={isExporting} style={{ minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isExporting ? (
              <span>Exporting...</span>
            ) : (
              <><FileSpreadsheet size={16} /> Export CSV / PDF</>
            )}
          </button>
        </div>

        {/* CHART AREA */}
        <div className="ceo-command-panel" style={{ gridArea: 'chart', padding: '24px' }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '12px', color: 'var(--ceo-text-secondary)' }}>
              <div style={{ width: '24px', height: '24px', border: '2px solid var(--ceo-border)', borderTopColor: 'var(--ceo-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              Loading live analytics...
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : renderChart()}
        </div>

        {/* TABLE AREA */}
        <div className="ceo-command-panel" style={{ gridArea: 'table', display: 'flex', flexDirection: 'column' }}>
          <div className="ceo-command-header">
            <div className="ceo-typography-card-title">
              <Activity size={18} color="var(--ceo-primary)" /> Data Preview
              {!loading && analytics && (
                <span style={{ marginLeft: '12px', fontSize: '11px', background: 'var(--ceo-success)', color: '#fff', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>
                  LIVE
                </span>
              )}
            </div>
          </div>
          <div className="ceo-command-content" style={{ padding: 0, overflowY: 'auto' }}>
            <table className="ceo-erp-table">
              <thead>{renderTableHeaders()}</thead>
              <tbody>{!loading && renderTableRows()}</tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
