import React, { useState } from 'react';
import { 
  Target, ChevronRight, CheckCircle, AlertTriangle, Link, 
  BarChart, Calendar
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const mockOKRs = [
  { 
    id: 1, 
    title: 'Launch Client Portal MVP', 
    status: 'On Track', 
    progress: 75,
    owner: 'Product Team',
    krs: [
      { id: 11, title: 'Achieve 95% test coverage', target: 95, current: 80, unit: '%' },
      { id: 12, title: 'Onboard 5 beta clients', target: 5, current: 4, unit: 'clients' },
      { id: 13, title: 'Release production build', target: 100, current: 100, unit: '%' }
    ]
  },
  { 
    id: 2, 
    title: 'Reduce Churn Rate to < 2%', 
    status: 'At Risk', 
    progress: 45,
    owner: 'Customer Success',
    krs: [
      { id: 21, title: 'Conduct 50 check-in calls', target: 50, current: 12, unit: 'calls' },
      { id: 22, title: 'Implement automated health score', target: 100, current: 60, unit: '%' }
    ]
  },
  { 
    id: 3, 
    title: 'Expand to European Market', 
    status: 'Behind', 
    progress: 15,
    owner: 'Sales & Marketing',
    krs: [
      { id: 31, title: 'Hire Regional Director', target: 1, current: 0, unit: 'hire' },
      { id: 32, title: 'Secure 3 partner agencies', target: 3, current: 1, unit: 'partners' }
    ]
  }
];

// Helper for SVG Progress Ring
const ProgressRing = ({ progress, color, size = 64, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          stroke="var(--ceo-divider)"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '14px', fontWeight: 700, color: 'var(--ceo-text-primary)'
      }}>
        {progress}%
      </div>
    </div>
  );
};

export default function StrategyOKRs() {
  const [selectedOkrId, setSelectedOkrId] = useState(mockOKRs[0].id);
  const [quarter, setQuarter] = useState('Q3');

  const selectedOkr = mockOKRs.find(o => o.id === selectedOkrId);

  const getStatusColor = (status) => {
    if (status === 'On Track') return 'var(--ceo-success)';
    if (status === 'At Risk') return 'var(--ceo-warning)';
    if (status === 'Behind') return 'var(--ceo-danger)';
    return 'var(--ceo-primary)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Strategy & OKRs</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Align enterprise execution with strategic objectives.</p>
      </div>

      {/* CSS GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '340px 1fr',
        gridTemplateRows: '52px 1fr',
        gridTemplateAreas: `
          "qselect qselect"
          "okrlist okrdetail"
        `,
        gap: '24px',
        flex: 1
      }}>
        
        {/* QUARTER SELECTOR */}
        <div style={{ gridArea: 'qselect', display: 'flex', gap: '8px', borderBottom: '1px solid var(--ceo-border)' }}>
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              style={{
                padding: '12px 24px',
                background: quarter === q ? 'var(--tab-active-bg)' : 'transparent',
                color: quarter === q ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                border: 'none',
                borderBottom: quarter === q ? '2px solid var(--ceo-primary)' : '2px solid transparent',
                borderRadius: '4px 4px 0 0',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {q} 2025
            </button>
          ))}
          <div style={{ flex: 1 }}></div>
          <button className="ceo-btn ceo-btn-primary" style={{ padding: '6px 16px', height: '36px', alignSelf: 'center' }}>
            <Target size={16}/> New Objective
          </button>
        </div>

        {/* OKR LIST */}
        <div style={{ gridArea: 'okrlist', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', paddingRight: '4px' }}>
          {mockOKRs.map(okr => (
            <div 
              key={okr.id}
              onClick={() => setSelectedOkrId(okr.id)}
              style={{
                background: selectedOkrId === okr.id ? 'var(--ceo-hover)' : 'var(--ceo-card-bg)',
                border: selectedOkrId === okr.id ? '1px solid var(--ceo-primary)' : '1px solid var(--ceo-border)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: selectedOkrId === okr.id ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'var(--ceo-shadow)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <span className={`ceo-badge ${okr.status === 'On Track' ? 'success' : okr.status === 'At Risk' ? 'warning' : 'critical'}`}>
                  {okr.status}
                </span>
                <ProgressRing progress={okr.progress} color={getStatusColor(okr.status)} size={48} strokeWidth={4} />
              </div>
              <div className="ceo-typography-section-title" style={{ fontSize: '15px', lineHeight: 1.3 }}>{okr.title}</div>
              <div className="ceo-typography-meta" style={{ marginTop: '8px' }}>Owner: {okr.owner}</div>
            </div>
          ))}
        </div>

        {/* OKR DETAIL */}
        <div className="ceo-command-panel" style={{ gridArea: 'okrdetail', display: 'flex', flexDirection: 'column' }}>
          {selectedOkr ? (
            <>
              <div className="ceo-command-header" style={{ padding: '32px 32px 24px 32px', display: 'flex', gap: '32px', alignItems: 'center' }}>
                <ProgressRing progress={selectedOkr.progress} color={getStatusColor(selectedOkr.status)} size={100} strokeWidth={8} />
                <div style={{ flex: 1 }}>
                  <span className={`ceo-badge ${selectedOkr.status === 'On Track' ? 'success' : selectedOkr.status === 'At Risk' ? 'warning' : 'critical'}`} style={{ marginBottom: '12px' }}>
                    {selectedOkr.status}
                  </span>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--ceo-text-primary)', marginBottom: '8px' }}>{selectedOkr.title}</div>
                  <div className="ceo-typography-body">Owned by {selectedOkr.owner}</div>
                </div>
              </div>

              <div className="ceo-command-content" style={{ padding: '0 32px 32px 32px', overflowY: 'auto' }}>
                <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '24px', color: 'var(--ceo-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Key Results ({selectedOkr.krs.length})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {selectedOkr.krs.map(kr => {
                    const pct = Math.min(100, (kr.current / kr.target) * 100);
                    const isCompleted = pct === 100;
                    return (
                      <div key={kr.id} style={{ 
                        background: 'var(--ceo-bg)', 
                        border: '1px solid var(--ceo-border)', 
                        padding: '24px', 
                        borderRadius: '12px' 
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'flex-start' }}>
                          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}>{kr.title}</div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: isCompleted ? 'var(--ceo-success)' : 'var(--ceo-text-primary)', background: 'var(--ceo-card-bg)', padding: '4px 12px', borderRadius: '16px', border: '1px solid var(--ceo-border)' }}>
                            {kr.current} / {kr.target} <span style={{ color: 'var(--ceo-text-muted)', fontWeight: 500 }}>{kr.unit}</span>
                          </div>
                        </div>

                        {/* KR Progress Bar */}
                        <div style={{ height: '12px', background: 'var(--ceo-divider)', borderRadius: '6px', overflow: 'hidden', marginBottom: '16px' }}>
                          <div style={{ 
                            height: '100%', width: `${pct}%`, 
                            background: isCompleted ? 'var(--ceo-success)' : 'var(--ceo-primary)',
                            borderRadius: '6px', transition: 'width 0.5s ease-out'
                          }}></div>
                        </div>

                        {/* Cascade Link */}
                        <div style={{ borderTop: '1px dashed var(--ceo-divider)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ceo-text-secondary)', fontSize: '13px', fontWeight: 500 }}>
                            <Link size={14} color="var(--ceo-text-muted)" />
                            {isCompleted ? 'Cascade complete' : 'Cascaded to Engineering Sprint 42'}
                          </div>
                          {!isCompleted && <button className="ceo-btn" style={{ padding: '4px 12px', fontSize: '12px' }}>Update Progress</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ceo-text-muted)' }}>
              Select an Objective to view Key Results
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
