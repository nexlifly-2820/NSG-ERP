import { useState, useEffect } from 'react';
import { useCompany } from '../common/CompanyContext';
import './Employee.css';

const DEFAULT_QUIZ_QUESTIONS = [
  { id: 1, question: 'What is the HMNS Code of Conduct primarily concerned with?', options: ['Maximizing individual profits', 'Ethical behavior, integrity and company values', 'Marketing strategy', 'Competitor analysis'], correct: 1 },
  { id: 2, question: 'What should you do if you witness workplace harassment?', options: ['Ignore it and move on', 'Discuss it only with friends outside the company', 'Report it to HR or your Team Lead immediately', 'Handle it yourself informally'], correct: 2 },
  { id: 3, question: 'How many days of Casual Leave (CL) are employees entitled to per year?', options: ['6 days', '10 days', '12 days', '15 days'], correct: 2 },
  { id: 4, question: 'Which of the following best describes confidentiality of company data?', options: ['Company data can be shared with anyone if it is useful', 'Company data must be protected and only shared on a need-to-know basis', 'Only financial data is confidential', "Data security is the IT department's problem alone"], correct: 1 },
  { id: 5, question: 'What is the correct procedure for submitting a timesheet?', options: ['Submit at any time during the month', 'Submit verbally to your Team Lead', 'Submit via the ERP portal by the end of each week', 'No submission needed, HR tracks it automatically'], correct: 2 }
];

const MODULES = [
  { id: 1, title: 'HMNS Corporate Values & Ethics', duration: '30 min', icon: '🏢', description: 'Company culture, code of conduct, and professional ethics.' },
  { id: 2, title: 'Technical Guidelines & Security Policy', duration: '45 min', icon: '🔒', description: 'IT security protocols, data handling, and compliance rules.' }
];

const CURRENT_EMPLOYEE_ID = 102;

export default function Learning({ currentUser }) {
  const { companyName } = useCompany();
  const employeeId = currentUser?.id || CURRENT_EMPLOYEE_ID;
  const employeeName = currentUser?.name || 'Jane Smith';

  // Fallback to defaults since there is no backend endpoint for custom questions yet
  const QUIZ_QUESTIONS = DEFAULT_QUIZ_QUESTIONS.map(q => ({
    ...q,
    question: q.question.replace('HMNS', companyName || 'HMNS')
  }));

  const modulesWithCompany = MODULES.map(m => ({
    ...m,
    title: m.title.replace('HMNS', companyName || 'HMNS')
  }));

  const [progress, setProgress] = useState({ completed_modules: 0, quiz_score: 0, passed: false });
  const [completedModules, setCompletedModules] = useState(new Set());

  // Quiz state
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);

  // Active module viewer
  const [activeModule, setActiveModule] = useState(null);

  const fetchProgress = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/employee-portal/learning/progress', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setProgress(data);
          const done = new Set();
          if (data.completed_modules >= 1) done.add(1);
          if (data.completed_modules >= 2) done.add(2);
          setCompletedModules(done);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const updateProgressAPI = async (payload) => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      await fetch('/api/employee-portal/learning/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      fetchProgress();
    } catch (e) { console.error(e); }
  };

  const handleMarkComplete = (modId) => {
    const newCompleted = new Set(completedModules);
    newCompleted.add(modId);
    setCompletedModules(newCompleted);

    const count = newCompleted.size;
    updateProgressAPI({
      completed_modules: count,
      quiz_score: progress.quiz_score || 0,
      passed: progress.passed || false
    });
    setActiveModule(null);
  };

  const handleSubmitQuiz = (e) => {
    e.preventDefault();
    let correct = 0;
    QUIZ_QUESTIONS.forEach(q => {
      if (parseInt(answers[q.id]) === q.correct) correct++;
    });
    const score = Math.round((correct / QUIZ_QUESTIONS.length) * 100);
    const passed = score >= 80;
    setQuizScore(score);
    setSubmitted(true);

    updateProgressAPI({
      completed_modules: completedModules.size,
      quiz_score: score,
      passed
    });

    setProgress(prev => ({ ...prev, quiz_score: score, passed }));
  };

  const allModulesDone = completedModules.size >= MODULES.length;
  const canTakeQuiz = allModulesDone && !progress.passed;
  const lockGateUnlocked = progress.passed;

  // Color tokens
  const GREEN = '#10b981';
  const YELLOW = '#fbbf24';
  const RED = '#f87171';
  const BLUE = '#60a5fa';

  return (
    <div className="component-container emp-root">
      <div className="component-header">
        <div>
          <h1>Learning & Training</h1>
          <p>Complete your mandatory induction modules and pass the compliance quiz to unlock your probation gate.</p>
        </div>
      </div>

      {/* ── Status Banner ── */}
      <div style={{
        padding: '16px 20px',
        borderRadius: 12,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        background: lockGateUnlocked
          ? 'rgba(16,185,129,0.08)'
          : allModulesDone
          ? 'rgba(96,165,250,0.08)'
          : 'rgba(251,191,36,0.08)',
        border: `1px solid ${lockGateUnlocked ? 'rgba(16,185,129,0.3)' : allModulesDone ? 'rgba(96,165,250,0.3)' : 'rgba(251,191,36,0.3)'}`
      }}>
        <span style={{ fontSize: 32 }}>
          {lockGateUnlocked ? '🔓' : allModulesDone ? '📝' : '🔒'}
        </span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: lockGateUnlocked ? GREEN : allModulesDone ? BLUE : YELLOW }}>
            {lockGateUnlocked
              ? `Compliance Gate Unlocked ✓ — Score: ${progress.quiz_score}%`
              : allModulesDone
              ? 'All modules done! You can now take the quiz.'
              : `Modules completed: ${completedModules.size} / ${modulesWithCompany.length}`}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
            {lockGateUnlocked
              ? 'Your induction quiz has been passed. HR has been notified and your probation confirmation is now unlocked.'
              : allModulesDone
              ? 'Score ≥ 80% to pass and unlock your probation gate.'
              : 'Complete all modules below, then take the compliance quiz.'}
          </div>
        </div>
        {progress.quiz_score > 0 && !lockGateUnlocked && (
          <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: RED }}>{progress.quiz_score}%</div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Last attempt</div>
          </div>
        )}
      </div>

      {/* ── Track Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, color: BLUE }}>
          📚 Corporate Induction Track 1
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mandatory · All Departments</div>
        {/* Progress bar */}
        <div style={{ flex: 1, height: 6, background: 'var(--bg-primary)', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(completedModules.size / modulesWithCompany.length) * 100}%`, background: GREEN, transition: 'width 0.4s ease', borderRadius: 10 }} />
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>{completedModules.size}/{modulesWithCompany.length}</div>
      </div>

      {/* ── Module Cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {modulesWithCompany.map((mod, idx) => {
          const done = completedModules.has(mod.id);
          const locked = idx > 0 && !completedModules.has(modulesWithCompany[idx - 1].id);
          return (
            <div key={mod.id} style={{
              padding: '20px 24px',
              background: 'var(--bg-secondary)',
              border: `1px solid ${done ? 'rgba(16,185,129,0.4)' : locked ? 'rgba(107,114,128,0.2)' : 'var(--border-color)'}`,
              borderLeft: `4px solid ${done ? GREEN : locked ? '#374151' : BLUE}`,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              opacity: locked ? 0.5 : 1,
              transition: 'all 0.2s'
            }}>
              <span style={{ fontSize: 28 }}>{mod.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: done ? GREEN : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {mod.title}
                  {done && <span style={{ fontSize: 12, background: 'rgba(16,185,129,0.1)', color: GREEN, border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, padding: '1px 8px' }}>✓ Completed</span>}
                  {locked && <span style={{ fontSize: 12, color: '#6b7280' }}>🔒 Locked</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{mod.description}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>⏱ {mod.duration}</div>
              </div>
              <div>
                {done ? (
                  <span style={{ fontSize: 13, color: GREEN, fontWeight: 600 }}>✓ Done</span>
                ) : locked ? (
                  <span style={{ fontSize: 12, color: '#6b7280' }}>Complete Module {idx} first</span>
                ) : (
                  <button
                    onClick={() => setActiveModule(mod)}
                    style={{ padding: '8px 18px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 13, transition: 'opacity 0.2s' }}
                    onMouseEnter={e => e.target.style.opacity = '0.85'}
                    onMouseLeave={e => e.target.style.opacity = '1'}
                  >
                    Start Module →
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Quiz Section ── */}
      {!lockGateUnlocked && (
        <div style={{
          padding: '20px 24px',
          background: canTakeQuiz ? 'rgba(96,165,250,0.05)' : 'var(--bg-secondary)',
          border: `1px solid ${canTakeQuiz ? 'rgba(96,165,250,0.4)' : 'rgba(107,114,128,0.2)'}`,
          borderRadius: 12,
          opacity: canTakeQuiz ? 1 : 0.5
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: canTakeQuiz ? BLUE : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                📝 Compliance Quiz
                {!canTakeQuiz && <span style={{ fontSize: 12 }}>🔒</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                5 questions · Pass mark: 80% · Unlimited attempts
              </div>
            </div>
            {canTakeQuiz && (
              <button
                onClick={() => { setShowQuiz(true); setAnswers({}); setSubmitted(false); setQuizScore(null); }}
                style={{ padding: '10px 22px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: 14, boxShadow: '0 4px 12px rgba(59,130,246,0.4)' }}
              >
                Take Quiz 🎯
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Module Viewer Modal ── */}
      {activeModule && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { setActiveModule(null) } }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: `4px solid ${BLUE}`, borderRadius: 16, width: 520, padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: BLUE, fontSize: 16 }}>{activeModule.icon} {activeModule.title}</h3>
              <button onClick={() => setActiveModule(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
            </div>
            <div style={{ background: 'var(--bg-primary)', borderRadius: 10, padding: 18, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, minHeight: 180 }}>
              <p style={{ margin: '0 0 10px', fontWeight: 700, color: 'var(--text-primary)' }}>📖 Module Content</p>
              {activeModule.id === 1 ? (
                <>
                  <p>Welcome to {companyName || 'NSG'}. Our core values are <strong>Integrity, Innovation, and Inclusion</strong>. Every employee is expected to:</p>
                  <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                    <li>Treat all colleagues with respect and professionalism</li>
                    <li>Report any unethical behavior to HR immediately</li>
                    <li>Protect confidential company and client information</li>
                    <li>Adhere to the POSH (Prevention of Sexual Harassment) policy</li>
                    <li>Maintain punctuality and meet commitments</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>{companyName || 'NSG'} follows strict IT security and data governance policies:</p>
                  <ul style={{ paddingLeft: 18, marginTop: 8 }}>
                    <li>All company data is confidential and must not be shared externally</li>
                    <li>Use only company-approved tools for work-related tasks</li>
                    <li>Submit weekly timesheets via the ERP portal every Friday</li>
                    <li>Report any security incidents to the IT team immediately</li>
                    <li>Personal devices must not be used to store company files</li>
                  </ul>
                </>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
              <button onClick={() => setActiveModule(null)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: 8, cursor: 'pointer' }}>Back</button>
              <button
                onClick={() => handleMarkComplete(activeModule.id)}
                style={{ padding: '8px 20px', background: GREEN, border: 'none', color: '#fff', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}
              >
                ✓ Mark as Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quiz Modal ── */}
      {showQuiz && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }} onClick={(e) => { if (e.target === e.currentTarget) { setShowQuiz(false) } }}>
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: '4px solid #6366f1', borderRadius: 16, width: 580, maxHeight: 'calc(100vh - 80px)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: '#a78bfa' }}>📝 Compliance Quiz</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Corporate Induction Track 1 · 5 Questions</div>
              </div>
              {!submitted && (
                <button onClick={() => setShowQuiz(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18 }}>✕</button>
              )}
            </div>

            {submitted ? (
              /* Result screen */
              <div style={{ padding: 32, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 60 }}>{quizScore >= 80 ? '🎉' : '😔'}</div>
                <div style={{ fontSize: 36, fontWeight: 800, color: quizScore >= 80 ? GREEN : RED }}>{quizScore}%</div>
                <div style={{ fontWeight: 700, fontSize: 18, color: quizScore >= 80 ? GREEN : RED }}>
                  {quizScore >= 80 ? 'Quiz Passed! Compliance gate unlocked.' : 'Not quite — try again!'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 340 }}>
                  {quizScore >= 80
                    ? 'Congratulations! Your score has been recorded and HR has been notified. Your probation confirmation gate is now unlocked.'
                    : `You scored ${quizScore}%. A minimum of 80% is required. Review the modules and try again.`}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  {quizScore < 80 && (
                    <button onClick={() => { setAnswers({}); setSubmitted(false); setQuizScore(null); }}
                      style={{ padding: '10px 20px', background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer' }}>
                      Retry Quiz
                    </button>
                  )}
                  <button onClick={() => setShowQuiz(false)}
                    style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: 8, cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Questions */
              <form onSubmit={handleSubmitQuiz} style={{ overflowY: 'auto', flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {QUIZ_QUESTIONS.map((q, qi) => (
                  <div key={q.id}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 12 }}>
                      <span style={{ color: '#a78bfa', marginRight: 6 }}>Q{qi + 1}.</span> {q.question}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, oi) => (
                        <label key={oi} style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                          background: answers[q.id] == oi ? 'rgba(99,102,241,0.15)' : 'var(--bg-primary)',
                          border: `1px solid ${answers[q.id] == oi ? '#6366f1' : 'var(--border-color)'}`,
                          borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s', fontSize: 13
                        }}>
                          <input
                            type="radio"
                            name={`q${q.id}`}
                            value={oi}
                            checked={answers[q.id] == oi}
                            onChange={() => setAnswers(prev => ({ ...prev, [q.id]: oi }))}
                            required
                            style={{ accentColor: '#6366f1' }}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" onClick={() => setShowQuiz(false)}
                    style={{ padding: '10px 18px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', borderRadius: 8, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit"
                    disabled={Object.keys(answers).length < QUIZ_QUESTIONS.length}
                    style={{
                      padding: '10px 24px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
                      border: 'none', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: 14,
                      opacity: Object.keys(answers).length < QUIZ_QUESTIONS.length ? 0.5 : 1
                    }}>
                    Submit Quiz →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
