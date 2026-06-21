import React, { useState } from 'react';
import { Check, Lock, AlertCircle, Pencil, Trash2, Plus } from 'lucide-react';
import { useCompany } from '../../../common/CompanyContext';

const DEFAULT_QUIZ_QUESTIONS = [];

export function LearningLndView() {
  const { companyName } = useCompany();
  const [db, setDb] = useState({
    quizQuestions: [],
    trainingTracks: [],
    trainingProgress: [],
    onboardingTasks: [],
    employees: [],
    auditLogs: []
  });
  const onUpdateDb = setDb;
  const [lndTab, setLndTab] = useState('progress'); // progress | tracks | quiz | assigner
  const [hoveredRowId, setHoveredRowId] = useState(null);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState(null);

  // Live data states
  const [tracks, setTracks] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [employees, setEmployees] = useState([]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const [tRes, pRes, eRes] = await Promise.all([
        fetch('/api/hr-portal/lnd/tracks', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/hr-portal/lnd/progress', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/hr-portal/employees', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (tRes.ok) setTracks(await tRes.json());
      if (pRes.ok) setProgressData(await pRes.json());
      if (eRes.ok) setEmployees(await eRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchData();
  }, []);

  // Track Builder States
  const [trackName, setTrackName] = useState('');
  const [trackDept, setTrackDept] = useState('All');
  const [m1Title, setM1Title] = useState('');
  const [m2Title, setM2Title] = useState('');
  const [isMandatory, setIsMandatory] = useState(true);

  // ── Quiz CRUD States ──────────────────────────────────────────────
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);

  const getQuizQuestions = () =>
    (db?.quizQuestions && db.quizQuestions.length > 0) ? db.quizQuestions : [];

  const openCreateQ = () => {
    setEditingQuestion(null);
    setQText('');
    setQOptions(['', '', '', '']);
    setQCorrect(0);
    setIsQuizModalOpen(true);
  };

  const openEditQ = (q) => {
    setEditingQuestion(q);
    setQText(q.question);
    setQOptions([...q.options]);
    setQCorrect(q.correct);
    setIsQuizModalOpen(true);
  };

  const handleSaveQ = (e) => {
    e.preventDefault();
    if (!qText.trim() || qOptions.some(o => !o.trim())) return;
    const questions = getQuizQuestions();
    let updated;
    if (editingQuestion) {
      updated = questions.map(q => q.id === editingQuestion.id ? { ...q, question: qText, options: qOptions, correct: qCorrect } : q);
    } else {
      updated = [...questions, { id: Date.now(), question: qText, options: qOptions, correct: qCorrect }];
    }
    onUpdateDb({ ...db, quizQuestions: updated });
    setIsQuizModalOpen(false);
    setEditingQuestion(null);
  };

  const handleDeleteQ = (q) => {
    if (!window.confirm(`Delete question: "${q.question.slice(0, 60)}..."?`)) return;
    const updated = getQuizQuestions().filter(item => item.id !== q.id);
    onUpdateDb({ ...db, quizQuestions: updated });
  };

  const openCreateModal = () => {
    setEditingTrack(null);
    setTrackName('');
    setTrackDept('All');
    setM1Title('');
    setM2Title('');
    setIsMandatory(true);
    setIsBuilderOpen(true);
  };

  const openEditModal = (track) => {
    setEditingTrack(track);
    setTrackName(track.name);
    setTrackDept(track.department || 'All');
    setM1Title(track.modules?.[0]?.title || '');
    setM2Title(track.modules?.[1]?.title || '');
    setIsMandatory(track.is_mandatory !== false);
    setIsBuilderOpen(true);
  };

  const handleSaveTrack = async (e) => {
    e.preventDefault();
    if (!trackName.trim()) return;

    const trackData = {
      name: trackName,
      department: trackDept,
      modules: JSON.stringify([
        { id: 1, title: m1Title || 'Induction Session 1', duration: 30, has_quiz: true },
        { id: 2, title: m2Title || 'Technical Guidelines', duration: 45, has_quiz: true }
      ]),
      is_mandatory: isMandatory
    };

    try {
      const token = localStorage.getItem('nsg_jwt_token');
      // For now, we'll only do CREATE since hr_portal.py doesn't have an update endpoint for tracks
      const res = await fetch('/api/hr-portal/lnd/tracks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(trackData)
      });
      
      if (res.ok) {
        alert(`Training Track "${trackName}" deployed to LMS!`);
        fetchData();
        setIsBuilderOpen(false);
        setEditingTrack(null);
        setTrackName('');
        setM1Title('');
        setM2Title('');
      } else {
        alert('Failed to deploy course track.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTrack = (track) => {
    if (!window.confirm(`Delete track "${track.name}"? This cannot be undone.`)) return;
    const updatedTracks = (db.trainingTracks || []).filter(t => t.id !== track.id);
    onUpdateDb({ ...db, trainingTracks: updatedTracks });
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
            { id: 'quiz', label: 'Quiz Manager' },
            { id: 'assigner', label: 'Mandatory Assigner Matrix' }
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
            onClick={openCreateModal}
            className="print-btn"
            style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-sm)' }}
          >
            ⚙️ Build Course Track
          </button>
        )}
        {lndTab === 'quiz' && (
          <button
            onClick={openCreateQ}
            className="print-btn"
            style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: 'var(--shadow-sm)' }}
          >
            <Plus size={14} /> Add Question
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
                {employees.map(e => {
                  const progress = progressData.find(p => p.employee_id === e.id) || { completed_modules: 0, quiz_score: 0, passed: false };
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
          <div className="table-container" style={{ margin: 0, width: '100%', overflowX: 'auto' }}>
            <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>Active Training Tracks in LMS</div>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Course Track Name</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Target Department</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Modules</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Duration</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Mandatory</th>
                  <th style={{ padding: '16px 40px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(!tracks || tracks.length === 0) && (
                  <tr><td colSpan={6} style={{ padding: '32px 40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No tracks yet. Click "⚙️ Build Course Track" to create one.</td></tr>
                )}
                {tracks?.map((tr, idx) => (
                  <tr key={tr.id || idx}>
                    <td style={{ padding: '16px 40px' }}><strong>{tr.name}</strong></td>
                    <td style={{ padding: '16px 40px' }}>{tr.department || 'All'}</td>
                    <td style={{ padding: '16px 40px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {tr.modules?.map((m, mi) => (
                          <span key={mi} style={{ fontSize: 11, color: 'var(--text-secondary)' }}>• {m.title}</span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '16px 40px' }}>{tr.modules?.reduce((acc, m) => acc + m.duration, 0) || 75} mins</td>
                    <td style={{ padding: '16px 40px' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: tr.is_mandatory !== false ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                        {tr.is_mandatory !== false ? 'Yes ✓' : 'Optional'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 40px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => openEditModal(tr)}
                          title="Edit Track"
                          style={{ padding: '5px 10px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Pencil size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTrack(tr)}
                          title="Delete Track"
                          style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── QUIZ MANAGER TAB ── */}
      {lndTab === 'quiz' && (
        <div className="table-container" style={{ margin: 0, width: '100%', overflowX: 'auto' }}>
          <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>Compliance Quiz Questions Bank</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '12px 20px', textAlign: 'left', width: 40 }}>#</th>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>Question</th>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>Options</th>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>Correct Answer</th>
                <th style={{ padding: '12px 20px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getQuizQuestions().map((q, idx) => (
                <tr key={q.id || idx}>
                  <td style={{ padding: '14px 20px', color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</td>
                  <td style={{ padding: '14px 20px', maxWidth: 280, fontSize: 13 }}>{q.question}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {q.options.map((opt, oi) => (
                        <span key={oi} style={{ fontSize: 11, color: oi === q.correct ? 'var(--accent-green)' : 'var(--text-secondary)', fontWeight: oi === q.correct ? 700 : 400 }}>
                          {oi === q.correct ? '✓ ' : '○ '}{opt}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                      Option {q.correct + 1}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => openEditQ(q)} style={{ padding: '5px 10px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Pencil size={12} /> Edit
                      </button>
                      <button onClick={() => handleDeleteQ(q)} style={{ padding: '5px 10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── QUIZ QUESTION MODAL ── */}
      {isQuizModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { { setIsQuizModalOpen(false); setEditingQuestion(null); } } } }>
          <form onSubmit={handleSaveQ} className="card" style={{ width: 520, maxHeight: 'calc(100vh - 60px)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: '4px solid #6366f1', padding: 24, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: '#a78bfa', fontSize: 15 }}>
                {editingQuestion ? '✏️ Edit Quiz Question' : '➕ Add Quiz Question'}
              </h3>
              <button type="button" onClick={() => { setIsQuizModalOpen(false); setEditingQuestion(null); }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Question Text *</label>
              <textarea value={qText} onChange={e => setQText(e.target.value)} required rows={3} placeholder="e.g. What should you do if you witness workplace harassment?" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: 8, outline: 'none', resize: 'vertical', fontSize: 13 }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold' }}>Answer Options (mark the correct one)</label>
              {qOptions.map((opt, oi) => (
                <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="radio"
                    name="correct"
                    checked={qCorrect === oi}
                    onChange={() => setQCorrect(oi)}
                    title="Mark as correct answer"
                    style={{ accentColor: '#10b981', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }}
                  />
                  <input
                    type="text"
                    value={opt}
                    onChange={e => { const updated = [...qOptions]; updated[oi] = e.target.value; setQOptions(updated); }}
                    required
                    placeholder={`Option ${oi + 1}`}
                    style={{ flex: 1, backgroundColor: qCorrect === oi ? 'rgba(16,185,129,0.08)' : 'var(--bg-primary)', border: `1px solid ${qCorrect === oi ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}`, color: '#fff', padding: '8px 12px', borderRadius: 8, outline: 'none', fontSize: 13, transition: 'all 0.15s' }}
                  />
                  <span style={{ fontSize: 10, color: qCorrect === oi ? '#10b981' : 'var(--text-muted)', fontWeight: 700, width: 50, textAlign: 'right' }}>
                    {qCorrect === oi ? '✓ Correct' : ''}
                  </span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>💡 Click the radio button next to the correct answer</p>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
              <button type="button" onClick={() => { setIsQuizModalOpen(false); setEditingQuestion(null); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: 8, cursor: 'pointer' }}>Cancel</button>
              <button type="submit" style={{ padding: '8px 20px', background: 'linear-gradient(135deg, #6366f1, #a78bfa)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                {editingQuestion ? '💾 Save Changes' : '➕ Add Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {lndTab === 'assigner' && (
        <div className="table-container" style={{ margin: 0, overflowX: 'auto' }}>
          <div className="pipeline-title" style={{ padding: '16px 40px 0 40px' }}>Compliance Induction Assignment Matrix Grid</div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Training Track Course</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Executive Department</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Engineering Department</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Sales Department</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>IT Department</th>
                <th style={{ padding: '16px 40px', textAlign: 'left' }}>Marketing Department</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '16px 40px' }}><strong>{companyName || 'HMNS'} Corporate Inductions (L1)</strong></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
              </tr>
              <tr>
                <td style={{ padding: '16px 40px' }}><strong>Systems Architecture &amp; security (L2)</strong></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--text-muted)' }}>Not Assigned</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--text-muted)' }}>Not Assigned</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Mandatory ✓</span></td>
                <td style={{ padding: '16px 40px' }}><span style={{ color: 'var(--text-muted)' }}>Not Assigned</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ⚙️ TRACK BUILDER / EDITOR MODAL */}
      {isBuilderOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { { setIsBuilderOpen(false); setEditingTrack(null); } } } }>
          <form
            onSubmit={handleSaveTrack}
            className="card"
            style={{ width: '460px', maxHeight: 'calc(100vh - 80px)', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '4px solid var(--accent-pink)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', flexShrink: 0 }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {editingTrack ? '✏️ Edit Course Track' : '⚙️ LMS Course Track Builder'}
              </h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px' }} onClick={() => { setIsBuilderOpen(false); setEditingTrack(null); }}>✕</button>
            </div>

            <div className="custom-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px', overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>Track Name *</label>
                <input type="text" value={trackName} onChange={e => setTrackName(e.target.value)} required placeholder="e.g. Corporate Code of Conduct" style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>Department Scope</label>
                <select value={trackDept} onChange={e => setTrackDept(e.target.value)} style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}>
                  <option value="All">All Departments</option>
                  <option value="Executive">Executive</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="IT">IT</option>
                  <option value="Marketing">Marketing</option>
                  <option value="HR">HR</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>Module 1 Title</label>
                <input type="text" value={m1Title} onChange={e => setM1Title(e.target.value)} placeholder="e.g. Values and Ethics" style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: 8 }}>Module 2 Title</label>
                <input type="text" value={m2Title} onChange={e => setM2Title(e.target.value)} placeholder="e.g. Anti-harassment & POSH" style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="mandatory-chk" checked={isMandatory} onChange={e => setIsMandatory(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--accent-pink)', cursor: 'pointer' }} />
                <label htmlFor="mandatory-chk" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer' }}>Mark as Mandatory for selected department</label>
              </div>

              <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-tertiary)', border: '1px dashed var(--border-color)', padding: '12px', borderRadius: '8px', lineHeight: '1.4' }}>
                ℹ️ {editingTrack ? 'Saving will update this track across all assigned employees.' : 'Published tracks will be automatically mapped to the selected department scopes and enqueued as mandatory induction tracks.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '4px', flexShrink: 0 }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-muted)' }} onClick={() => { setIsBuilderOpen(false); setEditingTrack(null); }}>Cancel</button>
              <button type="submit" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>
                {editingTrack ? '💾 Save Changes' : 'Publish LMS Course Track'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
