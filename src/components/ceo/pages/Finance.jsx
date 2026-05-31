import React, { useState } from 'react';
import { 
  IndianRupee, TrendingUp, TrendingDown, AlertTriangle, 
  Plus, Check, X, Calculator, Settings, Clock, CheckCircle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const forecastData = [
  { month: 'Jan', actual: 4200, forecast: 4200 },
  { month: 'Feb', actual: 4350, forecast: 4300 },
  { month: 'Mar', actual: 4100, forecast: 4400 },
  { month: 'Apr', actual: 4500, forecast: 4450 },
  { month: 'May', actual: null, forecast: 4600 },
  { month: 'Jun', actual: null, forecast: 4800 },
];

const mockBudgets = [
  { id: 1, dept: 'Marketing', title: 'Q3 Ad Spend', amount: '₹1,500,000', reqBy: 'David L.', status: 'pending' },
  { id: 2, dept: 'IT', title: 'AWS Renewal', amount: '₹850,000', reqBy: 'Sarah C.', status: 'pending' },
  { id: 3, dept: 'HR', title: 'Annual Offsite', amount: '₹400,000', reqBy: 'Amit P.', status: 'approved' },
];

const SUBTABS = [
  { id: 'salary', label: 'Salary Structures' },
  { id: 'budget', label: 'Budget Requests' },
  { id: 'payroll', label: 'Payroll Summary' },
  { id: 'statutory', label: 'Statutory' },
  { id: 'bi', label: 'BI Forecast' }
];

export default function Finance() {
  const [activeTab, setActiveTab] = useState('salary');

  // Salary Builder State
  const [components, setComponents] = useState([
    { id: 1, name: 'Basic Salary', type: 'Fixed', calc: 'Flat', value: 45000, tax: true },
    { id: 2, name: 'HRA', type: 'Fixed', calc: '% of Basic', value: 50, tax: false }
  ]);
  const [editingId, setEditingId] = useState(null);

  // Budget State
  const [budgets, setBudgets] = useState(mockBudgets);

  const addComponent = () => {
    const newId = Date.now();
    setComponents([...components, { id: newId, name: '', type: 'Fixed', calc: 'Flat', value: 0, tax: true }]);
    setEditingId(newId);
  };

  const updateComponent = (id, field, val) => {
    setComponents(components.map(c => c.id === id ? { ...c, [field]: val } : c));
  };

  const removeComponent = (id) => {
    setComponents(components.filter(c => c.id !== id));
  };

  const approveBudget = (id) => {
    setBudgets(budgets.map(b => b.id === id ? { ...b, status: 'approved' } : b));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Finance & Payroll Hub</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Configure salary structures, approve budgets, and analyze costs.</p>
      </div>

      {/* GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gridTemplateRows: 'auto 1fr',
        gap: '24px',
        flex: 1
      }}>
        
        {/* SUBTABS */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--ceo-border)', paddingBottom: '8px' }}>
          {SUBTABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                background: activeTab === tab.id ? 'var(--tab-active-bg)' : 'transparent',
                color: activeTab === tab.id ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                border: 'none',
                borderBottom: activeTab === tab.id ? '2px solid var(--ceo-primary)' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CONTENT ZONE */}
        <div className="ceo-command-panel" style={{ flex: 1, minHeight: '500px' }}>
          
          {/* TAB 1: SALARY BUILDER */}
          {activeTab === 'salary' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><Calculator size={18} color="var(--ceo-primary)" /> Structure Builder</div>
                <button className="ceo-btn ceo-btn-primary" onClick={addComponent} style={{ padding: '6px 12px', fontSize: '12px' }}>
                  <Plus size={14} /> Add Component
                </button>
              </div>
              <div className="ceo-command-content" style={{ overflowY: 'auto' }}>
                <table className="ceo-erp-table">
                  <thead>
                    <tr>
                      <th>Component Name</th>
                      <th>Type</th>
                      <th>Calculation</th>
                      <th>Amount / %</th>
                      <th>Taxable</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {components.map(comp => {
                      const isEditing = editingId === comp.id;
                      return (
                        <tr key={comp.id} style={{ height: '52px' }}>
                          <td>
                            {isEditing ? (
                              <input className="ceo-form-input" style={{ padding: '6px' }} value={comp.name} onChange={(e) => updateComponent(comp.id, 'name', e.target.value)} placeholder="e.g. Basic" autoFocus />
                            ) : (
                              <span style={{ fontWeight: 600 }}>{comp.name || '(Unnamed)'}</span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <select className="ceo-form-input" style={{ padding: '6px' }} value={comp.type} onChange={(e) => updateComponent(comp.id, 'type', e.target.value)}>
                                <option>Fixed</option><option>Variable</option><option>Statutory</option>
                              </select>
                            ) : comp.type}
                          </td>
                          <td>
                            {isEditing ? (
                              <select className="ceo-form-input" style={{ padding: '6px' }} value={comp.calc} onChange={(e) => updateComponent(comp.id, 'calc', e.target.value)}>
                                <option>Flat</option><option>% of Basic</option><option>% of Gross</option>
                              </select>
                            ) : comp.calc}
                          </td>
                          <td>
                            {isEditing ? (
                              <input type="number" className="ceo-form-input" style={{ padding: '6px', width: '100px' }} value={comp.value} onChange={(e) => updateComponent(comp.id, 'value', Number(e.target.value))} />
                            ) : (
                              <span className="ceo-typography-meta" style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ceo-primary)' }}>
                                {comp.calc === 'Flat' ? `₹${comp.value.toLocaleString()}` : `${comp.value}%`}
                              </span>
                            )}
                          </td>
                          <td>
                            {isEditing ? (
                              <input type="checkbox" checked={comp.tax} onChange={(e) => updateComponent(comp.id, 'tax', e.target.checked)} />
                            ) : (
                              comp.tax ? <span className="ceo-badge neutral">Yes</span> : <span className="ceo-badge neutral" style={{ opacity: 0.5 }}>No</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isEditing ? (
                              <button className="ceo-btn" onClick={() => setEditingId(null)} style={{ padding: '4px 8px', fontSize: '12px', background: 'var(--ceo-success)', color: 'white' }}>Save</button>
                            ) : (
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button className="ceo-btn" onClick={() => setEditingId(comp.id)} style={{ padding: '4px', border: 'none', background: 'transparent' }}><Settings size={16} color="var(--ceo-text-secondary)"/></button>
                                <button className="ceo-btn" onClick={() => removeComponent(comp.id)} style={{ padding: '4px', border: 'none', background: 'transparent' }}><X size={16} color="var(--ceo-danger)"/></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: BUDGET REQUESTS */}
          {activeTab === 'budget' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><IndianRupee size={18} color="var(--ceo-warning)" /> Pending Budget Approvals</div>
              </div>
              <div className="ceo-command-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px', alignContent: 'start' }}>
                {budgets.map(b => (
                  <div key={b.id} style={{ 
                    border: '1px solid var(--ceo-border)', 
                    borderRadius: '12px', 
                    padding: '20px', 
                    background: 'var(--ceo-card-bg)',
                    opacity: b.status === 'approved' ? 0.6 : 1,
                    boxShadow: 'var(--ceo-shadow)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span className="ceo-badge neutral">{b.dept}</span>
                      {b.status === 'approved' && <span className="ceo-badge success"><CheckCircle size={12}/> Approved</span>}
                    </div>
                    <div className="ceo-typography-section-title" style={{ fontSize: '16px' }}>{b.title}</div>
                    <div className="ceo-typography-meta" style={{ marginBottom: '16px', marginTop: '4px' }}>Requested by {b.reqBy}</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ceo-primary)', marginBottom: '20px' }}>{b.amount}</div>
                    
                    {b.status === 'pending' ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="ceo-btn ceo-btn-primary" style={{ flex: 1 }} onClick={() => approveBudget(b.id)}>Approve</button>
                        <button className="ceo-btn" style={{ flex: 1 }}>Reject</button>
                      </div>
                    ) : (
                      <div className="ceo-typography-meta" style={{ textAlign: 'center' }}>Approved by CEO</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BI FORECAST */}
          {activeTab === 'bi' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="ceo-command-header">
                <div className="ceo-typography-card-title"><TrendingUp size={18} color="var(--ceo-purple)" /> 6-Month Cost Forecast (₹K)</div>
              </div>
              <div className="ceo-command-content" style={{ padding: '32px' }}>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={forecastData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--ceo-border)" vertical={false} />
                    <XAxis dataKey="month" stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--ceo-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'var(--ceo-bg)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--ceo-border)' }} />
                    <Line type="monotone" dataKey="actual" name="Actual Cost" stroke="var(--ceo-primary)" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="forecast" name="AI Forecast" stroke="var(--ceo-warning)" strokeWidth={3} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* OTHER TABS */}
          {['payroll', 'statutory'].includes(activeTab) && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ceo-text-muted)' }}>
              <AlertTriangle size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <div className="ceo-typography-section-title">Module Pending</div>
              <p className="ceo-typography-body">Data integration with backend required.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
