import React, { useState } from 'react';
import { Calendar, RefreshCw } from 'lucide-react';
import { HOLIDAYS, LEAVE_POLICIES } from '../../mockData';

export function HrSettingsView({ db, onUpdateDb }) {
  const handleResetDemoData = () => {
    if (confirm('Are you sure you want to reset the client-side simulated database? This will restore all original seed values.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>HR Settings &amp; Holiday calendar</h1>
          <p>Tweak carryover leaf policies, add official holiday timelines, or reset your local simulator data.</p>
        </div>
        <div>
          <button className="print-btn" style={{ backgroundColor: 'red', color: '#fff', border: 'none' }} onClick={handleResetDemoData}>
            <RefreshCw size={16} /> Reset Demo Data
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Leave Policies */}
        <div className="card flex-1" style={{ borderLeft: '4px solid var(--accent-pink)' }}>
          <h3>Leave Policies Quick Config</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {LEAVE_POLICIES.map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>{p.type} Policy:</span>
                <strong>{p.max_balance} days Max</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Holidays */}
        <div className="card flex-1" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
          <h3>Holiday Calendar Roster</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {HOLIDAYS.map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>{h.name}:</span>
                <strong>{h.date}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 17. MESSAGING & MEET VIEW
