import React, { useState } from 'react';

export function ReportsEngineView({ db, onUpdateDb }) {
  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Reports &amp; BI Engine</h1>
          <p>Export staff attrition graphs, payroll costs, and carryover leaf utilization rates.</p>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-pink)' }}>
          <span className="card-title">Employee Attrition Rate</span>
          <span className="metric-value">4.2%</span>
          <span className="info-txt">Voluntary separations this year</span>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <span className="card-title">Payroll Cost Payouts</span>
          <span className="metric-value">₹99,800</span>
          <span className="info-txt">Total gross payments last month</span>
        </div>
      </div>
    </div>
  );
}



// ==========================================
// 16. SETTINGS VIEW
