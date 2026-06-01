import React, { useState } from 'react';
import { AlertTriangle, UserPlus, LogOut, Briefcase } from 'lucide-react';

export function HrDashboardView({ db, onUpdateDb }) {
  const openOnboardings = db.employees.filter(e => e.status === 'probation').length;
  const pendingExits = db.resignations ? db.resignations.filter(r => r.status === 'pending').length : 1;
  const activeRecruitments = db.candidates.filter(c => c.stage !== 'joined' && c.stage !== 'rejected').length;
  const unresolvedGrievances = db.disciplinaryTickets ? db.disciplinaryTickets.filter(t => t.status === 'issued').length : 2;

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>HR Management Command Center</h1>
          <p>Operational summary of talent lifecycles, onboarding SLAs, and compliance items.</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metrics-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-pink)' }}>
          <div className="card-header-flex">
            <span className="card-title">Probation / Onboardings</span>
            <div className="card-icon" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent-pink)' }}>
              <UserPlus size={18} />
            </div>
          </div>
          <span className="metric-value">{openOnboardings}</span>
          <span className="info-txt">Active new hires in checklist</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-blue)' }}>
          <div className="card-header-flex">
            <span className="card-title">Pending Exit Claims</span>
            <div className="card-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-blue)' }}>
              <LogOut size={18} />
            </div>
          </div>
          <span className="metric-value">{pendingExits}</span>
          <span className="info-txt">Resignations awaiting review</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-gold)' }}>
          <div className="card-header-flex">
            <span className="card-title">Open Job Pipelines</span>
            <div className="card-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-gold)' }}>
              <Briefcase size={18} />
            </div>
          </div>
          <span className="metric-value">{activeRecruitments}</span>
          <span className="info-txt">Candidates in ATS screening</span>
        </div>

        <div className="metric-card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="card-header-flex">
            <span className="card-title">Grievance Watchdog</span>
            <div className="card-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
          <span className="metric-value">{unresolvedGrievances}</span>
          <span className="info-txt">Warnings awaiting acknowledgment</span>
        </div>
      </div>

      <div className="dashboard-row-grid">
        {/* New Joiners Checklist */}
        <div className="content-card flex-2">
          <div className="card-header">
            <h3>New Joiners Checklist Progress</h3>
          </div>
          <div className="card-content-list">
            {db.employees.filter(e => e.status === 'probation').map(joiner => (
              <div key={joiner.id} className="strategic-list-item">
                <div className="progress-ring-mini" style={{ backgroundColor: 'var(--accent-pink)' }}></div>
                <div className="item-text">
                  <h5>{joiner.name}</h5>
                  <p>{joiner.designation} — Joined {joiner.join_date}</p>
                </div>
                <span className="badge-pill warning">Onboarding Checklist Active</span>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Watchdog */}
        <div className="content-card flex-1">
          <div className="card-header">
            <h3 style={{ color: '#ef4444' }}>⚠️ SLA Watchdog Alerts</h3>
          </div>
          <div className="card-content-list">
            {db.disciplinaryTickets.filter(t => t.status === 'issued').map(t => {
              const emp = db.employees.find(e => e.id === t.employee_id) || { name: 'Unknown' };
              return (
                <div key={t.id} className="strategic-list-item" style={{ borderLeft: '3px solid #ef4444', paddingLeft: '8px' }}>
                  <div className="item-text">
                    <h5 style={{ color: 'var(--text-primary)' }}>{t.violation_type.toUpperCase()} Warning</h5>
                    <p>Target: {emp.name} — Pending response</p>
                  </div>
                  <span className="badge-pill danger">Critical</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. RECRUITMENT & ATS VIEW
