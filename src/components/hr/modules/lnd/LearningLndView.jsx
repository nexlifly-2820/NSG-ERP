import React, { useState } from 'react';
import { Check, Lock, AlertCircle } from 'lucide-react';

export function LearningLndView({ db, onUpdateDb }) {
  const [lndTab, setLndTab] = useState('progress'); // progress | tracks | assigner
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  
  // Track Builder States
  const [trackName, setTrackName] = useState('');
  const [trackDept, setTrackDept] = useState('All');
  const [m1Title, setM1Title] = useState('');
  const [m2Title, setM2Title] = useState('');

  const handleCreateTrack = (e) => {
    e.preventDefault();
    if (!trackName.trim()) return;

    const newTrack = {
      id: Date.now(),
      name: trackName,
      department: trackDept,
      modules: [
        { id: 1, title: m1Title || 'Induction Session 1', duration: 30, has_quiz: true },
        { id: 2, title: m2Title || 'Technical Guidelines', duration: 45, has_quiz: true }
      ],
      is_mandatory: true
    };

    onUpdateDb({
      ...db,
      trainingTracks: [...(db.trainingTracks || []), newTrack]
    });

    setTrackName('');
    setM1Title('');
    setM2Title('');
    setIsBuilderOpen(false);
    alert(`Training Track ${newTrack.name} successfully deployed to LMS!`);
  };

  const handleSimulatePass = (empId) => {
    // Find or seed training progress for employee
    const existingIndex = db.trainingProgress?.findIndex(p => p.employee_id === empId);
    let updatedProgress;

    if (existingIndex !== -1 && existingIndex !== undefined) {
      updatedProgress = db.trainingProgress.map(p => {
        if (p.employee_id === empId) {
          return {
            ...p,
            completed_modules: 2,
            quiz_score: 92,
            passed: true
          };
        }
        return p;
      });
    } else {
      updatedProgress = [...(db.trainingProgress || []), {
        id: Date.now(),
        employee_id: empId,
        track_id: 1,
        completed_modules: 2,
        quiz_score: 92,
        passed: true
      }];
    }

    // Also auto complete the corresponding onboarding task for them if present
    const updatedTasks = db.onboardingTasks?.map(t => {
      if (t.instance_id === empId && t.task_name.includes('Induction Quiz')) {
        return {
          ...t,
          status: 'completed',
          completed_at: new Date().toISOString().split('T')[0]
        };
      }
      return t;
    });

    const emp = db.employees.find(e => e.id === empId) || { name: 'Staff' };
    const newLogs = [...db.auditLogs, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      initiator_id: 'Sarah Jenkins',
      module: 'Learning',
      record_id: empId,
      action_type: 'verify_doc',
      change_diff: { quiz_passed: true, score: 92, probation_lock_released: emp.name },
      ip_address: '192.168.1.104',
      client_agent: 'Chrome / Windows'
    }];

    onUpdateDb({
      ...db,
      trainingProgress: updatedProgress,
      onboardingTasks: updatedTasks || [],
      auditLogs: newLogs
    });

    alert(`Quiz pass simulated for ${emp.name}! Quiz Score: 92% committed. Compliance lock-gate successfully unblocked.`);
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Inductions &amp; Training Tracks (LMS)</h1>
          <p>Plan corporate compliance tracks and track onboarding learning milestones.</p>
        </div>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', gap: '16px', marginBottom: '20px', paddingBottom: '4px' }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { id: 'progress', label: 'Quiz & Compliance Progress' },
            { id: 'tracks', label: 'Training Course Tracks' },
            { id: 'assigner', label: 'Mandatory Assigner matrix' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setLndTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                color: lndTab === tab.id ? 'var(--accent-pink)' : 'var(--text-muted)',
                borderBottom: lndTab === tab.id ? '2.5px solid var(--accent-pink)' : 'none',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {lndTab === 'tracks' && (
          <button
            onClick={() => setIsBuilderOpen(true)}
            className="print-btn"
            style={{
              backgroundColor: 'var(--accent-pink)',
              color: '#fff',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            ⚙️ Build Course Track
          </button>
        )}
      </div>

      {lndTab === 'progress' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%' }}>
          {/* Compliance checklist */}
          <div className="table-container" style={{ margin: 0, width: '100%', overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Employee Name</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Mandatory Inductions Track</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Modules Completed</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Quiz Score</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Lock Gate Status</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Actions Panel</th>
                </tr>
              </thead>
              <tbody>
                {db.employees.map(e => {
                  const progress = db.trainingProgress?.find(p => p.employee_id === e.id) || { completed_modules: 0, quiz_score: 0, passed: false };
                  return (
                    <tr key={e.id}>
                      <td style={{ padding: '16px 40px' }}><strong>{e.name}</strong></td>
                      <td style={{ padding: '16px 40px' }}>Corporate Induction Track 1</td>
                      <td style={{ padding: '16px 40px' }}>{progress.completed_modules} / 2 Modules</td>
                      <td style={{ padding: '16px 40px', fontWeight: 'bold', color: progress.passed ? 'var(--accent-green)' : '#fbbf24' }}>
                        {progress.quiz_score > 0 ? `${progress.quiz_score}%` : 'Not Attempted'}
                      </td>
                      <td style={{ padding: '16px 40px', position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge-pill ${progress.passed ? 'badge-green' : 'badge-gold'}`}>
                            {progress.passed ? 'Unlocked (Confirm Enabled)' : 'Locked (Confirm Blocked)'}
                          </span>
                          
                          {/* Symmetrical Hoverable Warning / Info Icon */}
                          <div 
                            style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredRowId(e.id)}
                            onMouseLeave={() => setHoveredRowId(null)}
                          >
                            <AlertCircle size={15} style={{ color: progress.passed ? 'var(--accent-green)' : '#fbbf24' }} />
                            
                            {/* Premium Tooltip popover overlay */}
                            {hoveredRowId === e.id && (
                              <div style={{
                                position: 'absolute',
                                bottom: '100%',
                                left: '50%',
                                transform: 'translateX(-50%) translateY(-8px)',
                                width: '280px',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border-color)',
                                borderLeft: '4px solid var(--accent-pink)',
                                borderRadius: '10px',
                                padding: '14px',
                                color: 'var(--text-primary)',
                                boxShadow: 'var(--shadow-lg)',
                                zIndex: 1000,
                                pointerEvents: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px',
                                fontSize: '11.5px',
                                lineHeight: '1.4',
                                textAlign: 'left'
                              }}>
                                <div style={{ fontWeight: 'bold', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  💡 Probation Gate Compliance
                                </div>
                                <div style={{ color: 'var(--text-secondary)' }}>
                                  <strong>Lock Gate Compliance Check:</strong> The Employee Registry probation confirmation workflow queries training progress records reactively. New hires must clear the induction quiz with a score ≥ 80% to release the confirm lock.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 40px' }}>
                        {!progress.passed ? (
                          <button
                            className="print-btn"
                            style={{ padding: '4px 8px', fontSize: '11px', backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none' }}
                            onClick={() => handleSimulatePass(e.id)}
                          >
                            Simulate Pass
                          </button>
                        ) : (
                          <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>Lock released ✓</span>
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

      {lndTab === 'tracks' && (
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', width: '100%' }}>
          {/* Configured Tracks list */}
          <div className="table-container" style={{ margin: 0, width: '100%', overflowX: 'auto' }}>
            <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>Active Training tracks in LMS</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Course Track Name</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Target Department</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Syllabus Duration</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Mandatory</th>
                </tr>
              </thead>
              <tbody>
                {db.trainingTracks?.map((tr, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '16px 40px' }}><strong>{tr.name}</strong></td>
                    <td style={{ padding: '16px 40px' }}>{tr.department}</td>
                    <td style={{ padding: '16px 40px' }}>{tr.modules?.reduce((acc, m) => acc + m.duration, 0) || 75} mins (2 modules)</td>
                    <td style={{ padding: '16px 40px' }}>{tr.is_mandatory ? 'Yes ✓' : 'Optional'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {lndTab === 'assigner' && (
        <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
          <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>Compliance Induction Assignment Matrix Grid</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Training Track Course</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Engineering Department</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Sales Department</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>IT Department</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Marketing Department</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '16px 40px' }}><strong>NSG Corporate Inductions (L1)</strong></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
              </tr>
              <tr>
                <td style={{ padding: '16px 40px' }}><strong>Systems Architecture &amp; security (L2)</strong></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--text-muted)' }}>Not Assigned</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--text-muted)' }}>Not Assigned</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ⚙️ LMS COURSE TRACK BUILDER MODAL OVERLAY */}
      {isBuilderOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <form 
            onSubmit={handleCreateTrack}
            className="card" 
            style={{ width: '460px', maxHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                ⚙️ LMS Course Track Builder
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setIsBuilderOpen(false)}>✕</button>
            </div>

            <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>Track Name</label>
                </div>
                <input 
                  type="text" 
                  value={trackName} 
                  onChange={(e) => setTrackName(e.target.value)} 
                  required 
                  placeholder="e.g. Corporate Code of Conduct" 
                  style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>Department Scope</label>
                </div>
                <select 
                  value={trackDept} 
                  onChange={(e) => setTrackDept(e.target.value)} 
                  style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="All">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="IT">IT</option>
                </select>
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>Module 1 Title</label>
                </div>
                <input 
                  type="text" 
                  value={m1Title} 
                  onChange={(e) => setM1Title(e.target.value)} 
                  placeholder="e.g. Values and Ethics" 
                  style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                />
              </div>

              <div>
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block' }}>Module 2 Title</label>
                </div>
                <input 
                  type="text" 
                  value={m2Title} 
                  onChange={(e) => setM2Title(e.target.value)} 
                  placeholder="e.g. Anti-harassment & POSH" 
                  style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} 
                />
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)', padding: '12px', borderRadius: '8px', lineHeight: '1.4', marginTop: '4px' }}>
                ℹ️ Published tracks will be automatically mapped to the selected department scopes, and enqueued as mandatory inductees tracks.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px', flexShrink: 0 }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setIsBuilderOpen(false)}>Cancel</button>
              <button 
                type="submit" 
                style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}
              >
                Publish LMS Course Track
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
