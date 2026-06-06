import React, { useState, useMemo } from 'react';
import { 
  Download, Calendar, Filter, FileSpreadsheet, Activity, ChevronDown
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const REPORT_TYPES = [
  'Headcount', 'Payroll Cost', 'Attendance', 'Leave Trends', 'Project Status', 'Attrition'
];

const mockHeadcountData = [
  { month: 'Jan', count: 750, new: 12, left: 5 },
  { month: 'Feb', count: 757, new: 10, left: 3 },
  { month: 'Mar', count: 770, new: 18, left: 5 },
  { month: 'Apr', count: 785, new: 22, left: 7 },
  { month: 'May', count: 800, new: 20, left: 5 },
  { month: 'Jun', count: 815, new: 25, left: 10 },
  { month: 'Jul', count: 842, new: 35, left: 8 },
];

const mockPayrollData = [
  { month: 'Jan', cost: 21.5 },
  { month: 'Feb', cost: 21.8 },
  { month: 'Mar', cost: 22.0 },
  { month: 'Apr', cost: 23.5 }, // appraisals
  { month: 'May', cost: 24.0 },
  { month: 'Jun', cost: 24.2 },
  { month: 'Jul', cost: 24.5 },
];

const mockAttendanceData = [
  { dept: 'Engineering', present: 95, wfh: 40, leave: 5 },
  { dept: 'Sales', present: 92, wfh: 10, leave: 8 },
  { dept: 'HR', present: 98, wfh: 60, leave: 2 },
  { dept: 'Marketing', present: 90, wfh: 50, leave: 10 },
  { dept: 'Operations', present: 96, wfh: 20, leave: 4 },
];

const mockLeaveTrendsData = [
  { month: 'Jan', casual: 120, sick: 45 },
  { month: 'Feb', casual: 90, sick: 50 },
  { month: 'Mar', casual: 150, sick: 60 },
  { month: 'Apr', casual: 80, sick: 40 },
  { month: 'May', casual: 200, sick: 55 },
  { month: 'Jun', casual: 250, sick: 70 },
  { month: 'Jul', casual: 180, sick: 65 },
];

const mockProjectStatusData = [
  { name: 'Completed', value: 45 },
  { name: 'In Progress', value: 35 },
  { name: 'At Risk', value: 12 },
  { name: 'Delayed', value: 8 },
];

const mockAttritionData = [
  { month: 'Jan', rate: 2.1 },
  { month: 'Feb', rate: 2.4 },
  { month: 'Mar', rate: 3.0 },
  { month: 'Apr', rate: 3.5 },
  { month: 'May', rate: 3.2 },
  { month: 'Jun', rate: 4.1 },
  { month: 'Jul', rate: 4.2 },
];

const COLORS = ['var(--ceo-primary)', 'var(--ceo-success)', 'var(--ceo-warning)', 'var(--ceo-purple)', 'var(--ceo-danger)'];

export default function Reports() {
  const [activeReport, setActiveReport] = useState('Headcount');
  const [isExporting, setIsExporting] = useState(false);
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [dateRange, setDateRange] = useState('Jan 1 - Jul 31, 2025');

  // Dynamic filtering logic to simulate real ERP data changes
  const applyFilters = (data, isPercentage = false) => {
    let result = [...data];
    
    // Simulate Date Range
    if (dateRange === 'Last 30 Days') result = result.slice(-1);
    else if (dateRange === 'Last Quarter') result = result.slice(-3);
    
    // Simulate Department
    if (selectedDept !== 'All Departments') {
      const multipliers = { 'Executive': 0.05, 'Engineering': 0.4, 'Sales': 0.2, 'HR': 0.05, 'Marketing': 0.15, 'Operations': 0.2 };
      const m = multipliers[selectedDept] || 1;
      
      result = result.map(item => {
        let newItem = { ...item };
        for (let key in newItem) {
          if (typeof newItem[key] === 'number') {
            if (isPercentage || ['rate', 'present', 'wfh', 'leave'].includes(key)) {
              // Jitter percentages slightly instead of multiplying
              let jitter = (Math.random() * 6 - 3); // -3 to +3
              newItem[key] = Number(Math.max(0, Math.min(100, newItem[key] + jitter)).toFixed(1));
            } else {
              // Multiply raw counts
              newItem[key] = Math.max(1, Math.round(newItem[key] * m));
            }
          }
        }
        return newItem;
      });
    }
    return result;
  };

  const filteredHeadcount = useMemo(() => applyFilters(mockHeadcountData), [selectedDept, dateRange]);
  const filteredPayroll = useMemo(() => applyFilters(mockPayrollData), [selectedDept, dateRange]);
  const filteredLeave = useMemo(() => applyFilters(mockLeaveTrendsData), [selectedDept, dateRange]);
  const filteredProject = useMemo(() => applyFilters(mockProjectStatusData), [selectedDept, dateRange]);
  const filteredAttrition = useMemo(() => applyFilters(mockAttritionData, true), [selectedDept, dateRange]);
  
  const filteredAttendance = useMemo(() => {
    if (selectedDept !== 'All Departments') return mockAttendanceData.filter(d => d.dept === selectedDept);
    return mockAttendanceData;
  }, [selectedDept]);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
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
    if (activeReport === 'Headcount') {
      return (
        <tr>
          <th>Month</th>
          <th>Total Headcount</th>
          <th>New Hires</th>
          <th>Exits</th>
        </tr>
      );
    } else if (activeReport === 'Payroll Cost') {
      return (
        <tr>
          <th>Month</th>
          <th>Total Payroll Cost</th>
          <th>Change (MoM)</th>
        </tr>
      );
    } else if (activeReport === 'Attendance') {
      return (
        <tr>
          <th>Department</th>
          <th>Present (%)</th>
          <th>WFH (%)</th>
          <th>Leave (%)</th>
        </tr>
      );
    } else if (activeReport === 'Leave Trends') {
      return (
        <tr>
          <th>Month</th>
          <th>Casual Leaves</th>
          <th>Sick Leaves</th>
          <th>Total Leaves</th>
        </tr>
      );
    } else if (activeReport === 'Project Status') {
      return (
        <tr>
          <th>Status Category</th>
          <th>Number of Projects</th>
        </tr>
      );
    } else {
      return (
        <tr>
          <th>Month</th>
          <th>Attrition Rate (%)</th>
        </tr>
      );
    }
  };

  const renderTableRows = () => {
    if (activeReport === 'Headcount') {
      return filteredHeadcount.map((d, i) => (
        <tr key={i}>
          <td style={{ fontWeight: 600 }}>{d.month}</td>
          <td>{d.count}</td>
          <td><span style={{ color: 'var(--ceo-success)' }}>+{d.new}</span></td>
          <td><span style={{ color: 'var(--ceo-danger)' }}>-{d.left}</span></td>
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
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Enterprise Analytics</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Generate and export cross-departmental analytics reports.</p>
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
              <option value="Executive">Executive</option>
              <option value="Engineering">Engineering</option>
              <option value="Sales">Sales</option>
              <option value="HR">HR</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
            </select>
          </div>

          <div style={{ flex: 1 }}></div>

          <button className="ceo-btn ceo-btn-primary" onClick={handleExport} disabled={isExporting} style={{ minWidth: '160px' }}>
            {isExporting ? (
              <span>Exporting...</span>
            ) : (
              <><FileSpreadsheet size={16} /> Export CSV / PDF</>
            )}
          </button>
        </div>

        {/* CHART AREA */}
        <div className="ceo-command-panel" style={{ gridArea: 'chart', padding: '24px' }}>
          {renderChart()}
        </div>

        {/* TABLE AREA */}
        <div className="ceo-command-panel" style={{ gridArea: 'table', display: 'flex', flexDirection: 'column' }}>
          <div className="ceo-command-header">
            <div className="ceo-typography-card-title"><Activity size={18} color="var(--ceo-primary)" /> Data Preview</div>
          </div>
          <div className="ceo-command-content" style={{ padding: 0, overflowY: 'auto' }}>
            <table className="ceo-erp-table">
              <thead>
                {renderTableHeaders()}
              </thead>
              <tbody>
                {renderTableRows()}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
