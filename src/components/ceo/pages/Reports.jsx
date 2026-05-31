import React, { useState } from 'react';
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

const COLORS = ['var(--ceo-primary)', 'var(--ceo-success)', 'var(--ceo-warning)', 'var(--ceo-purple)', 'var(--ceo-danger)'];

export default function Reports() {
  const [activeReport, setActiveReport] = useState('Headcount');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => setIsExporting(false), 2000);
  };

  const renderChart = () => {
    if (activeReport === 'Headcount') {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockHeadcountData}>
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
          <LineChart data={mockPayrollData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
            <XAxis dataKey="month" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}M`} />
            <Tooltip cursor={{ fill: 'var(--ceo-bg)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--ceo-border)' }} formatter={(v) => [`₹${v}M`, 'Cost']} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
            <Line type="monotone" dataKey="cost" name="Payroll Cost" stroke="var(--ceo-danger)" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockAttendanceData}>
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
    } else {
      return (
        <tr>
          <th>Department</th>
          <th>Present (%)</th>
          <th>WFH (%)</th>
          <th>Leave (%)</th>
        </tr>
      );
    }
  };

  const renderTableRows = () => {
    if (activeReport === 'Headcount') {
      return mockHeadcountData.map((d, i) => (
        <tr key={i}>
          <td style={{ fontWeight: 600 }}>{d.month}</td>
          <td>{d.count}</td>
          <td><span style={{ color: 'var(--ceo-success)' }}>+{d.new}</span></td>
          <td><span style={{ color: 'var(--ceo-danger)' }}>-{d.left}</span></td>
        </tr>
      ));
    } else if (activeReport === 'Payroll Cost') {
      return mockPayrollData.map((d, i) => {
        const prev = i > 0 ? mockPayrollData[i-1].cost : d.cost;
        const change = ((d.cost - prev) / prev * 100).toFixed(1);
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
    } else {
      return mockAttendanceData.map((d, i) => (
        <tr key={i}>
          <td style={{ fontWeight: 600 }}>{d.dept}</td>
          <td>{d.present}%</td>
          <td>{d.wfh}%</td>
          <td>{d.leave}%</td>
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
          <div style={{ display: 'flex', background: 'var(--ceo-card-bg)', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '6px 12px', alignItems: 'center', gap: '8px', boxShadow: 'var(--ceo-shadow)', cursor: 'pointer' }}>
            <Calendar size={16} color="var(--ceo-text-secondary)" />
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Jan 1, 2025 - Jul 31, 2025</span>
          </div>
          
          <div style={{ display: 'flex', background: 'var(--ceo-card-bg)', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '6px 12px', alignItems: 'center', gap: '8px', boxShadow: 'var(--ceo-shadow)', cursor: 'pointer' }}>
            <Filter size={16} color="var(--ceo-text-secondary)" />
            <span style={{ fontSize: '13px', fontWeight: 500 }}>All Departments</span>
            <ChevronDown size={14} color="var(--ceo-text-muted)" />
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
