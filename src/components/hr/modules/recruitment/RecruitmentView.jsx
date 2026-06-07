import React, { useState, useEffect } from 'react';
import { Calendar, FileText, ArrowRight } from 'lucide-react';
import { notify } from '../../utils/notify';

export function RecruitmentView({ db, onUpdateDb, queryParams, setQueryParams }) {
  const subTab = queryParams?.get('subTab') || '';
  const showScheduler = subTab === 'schedule';
  const setShowScheduler = (val) => setQueryParams({ subTab: val ? 'schedule' : '' });
  
  const showOfferForm = subTab === 'offer';
  const setShowOfferForm = (val) => setQueryParams({ subTab: val ? 'offer' : '' });
  
  const showAnalyzer = subTab === 'analyzer';
  const setShowAnalyzer = (val) => setQueryParams({ subTab: val ? 'analyzer' : '' });

  const candIdStr = queryParams?.get('candId');
  const candidates = db?.candidates || [];

  const selectedCandidate = candIdStr ? candidates.find(c => String(c.id) === candIdStr) : null;
  const setSelectedCandidate = (cand) => setQueryParams({ subTab: cand ? 'offer' : '', candId: cand ? String(cand.id) : '' });

  const analyzerCandidate = candIdStr ? candidates.find(c => String(c.id) === candIdStr) : null;
  const setAnalyzerCandidate = (cand) => {
    setQueryParams({ subTab: 'analyzer', candId: cand ? String(cand.id) : '' });
  };
  
  // Offer Form States
  const [basicPay, setBasicPay] = useState(30000);
  const [hra, setHra] = useState(12000);
  const [allowance, setAllowance] = useState(8000);

  // Interview Scheduler States
  const [schedCandidateId, setSchedCandidateId] = useState('');
  const [schedInterviewer, setSchedInterviewer] = useState('John Doe (Engineering Lead)');
  const [schedDateTime, setSchedDateTime] = useState('');

  // Resume Analyzer States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedCandidateName, setUploadedCandidateName] = useState('');
  const [uploadedCandidateRole, setUploadedCandidateRole] = useState('Senior React Developer');
  const [parsedResult, setParsedResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [customRole, setCustomRole] = useState('');
  const [customRoles, setCustomRoles] = useState([]);

  const defaultRoles = [
    'Senior React Developer',
    'Product Manager',
    'QA Automation Engineer',
    'DevOps Engineer',
    'Junior UI/UX Designer'
  ];

  const allRoles = Array.from(new Set([
    ...defaultRoles,
    ...candidates.map(c => c.role),
    ...customRoles
  ])).filter(Boolean);

  const stages = [
    { id: 'applied', label: 'Applied' },
    { id: 'screening', label: 'Screening' },
    { id: 'interview', label: 'Interview' },
    { id: 'offer', label: 'Offer' },
    { id: 'joined', label: 'Joined' }
  ];

  // Fetch candidates and sync to parent state
  const fetchCandidates = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch('/api/hr-portal/candidates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Also fetch employees to keep complete sync
        const empRes = await fetch('/api/hr-portal/employees', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const empData = empRes.ok ? await empRes.json() : db.employees;
        
        onUpdateDb({
          ...db,
          candidates: data,
          employees: empData
        });
      }
    } catch (err) {
      console.error('Failed to fetch candidates/employees:', err);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleMoveStage = async (id, newStage) => {
    const token = localStorage.getItem('nsg_jwt_token');
    
    if (newStage === 'joined') {
      try {
        const res = await fetch(`/api/hr-portal/candidates/${id}/join`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || 'Failed to convert candidate to employee.');
        }
        const result = await res.json();
        const createdEmp = result.employee;
        const tempPassword = result.temporary_password;

        notify(`${createdEmp.name} is now an employee. Login: ${createdEmp.email} / ${tempPassword}`, 'success');
        notify('Onboarding checklist assigned. View in Employee Registry and Onboarding.', 'info');
        await fetchCandidates();
      } catch (err) {
        notify(`Error: ${err.message}`, 'error');
      }
      return;
    }

    // Otherwise, move stage
    try {
      const res = await fetch(`/api/hr-portal/candidates/${id}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: newStage })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to update candidate stage.');
      }
      await fetchCandidates();
      notify(`Candidate moved to ${newStage}.`, 'success');
    } catch (err) {
      notify(`Error updating stage: ${err.message}`, 'error');
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    if (!schedCandidateId) {
      notify('Please select a candidate.', 'warning');
      return;
    }
    const cand = candidates.find(c => String(c.id) === schedCandidateId);
    const token = localStorage.getItem('nsg_jwt_token');
    
    try {
      const res = await fetch('/api/hr-portal/interviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidate_id: Number(schedCandidateId),
          candidate_name: cand?.name || 'Unknown',
          role: cand?.role || 'Unknown',
          interviewer: schedInterviewer,
          scheduled_at: new Date(schedDateTime).toISOString()
        })
      });
      if (!res.ok) throw new Error('Failed to schedule interview');
      
      notify('Interview scheduled and saved to database successfully.', 'success');
      setShowScheduler(false);
      
      // Auto-move to interview stage
      if (cand && cand.stage !== 'interview') {
        handleMoveStage(cand.id, 'interview');
      }
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  const handleCreateOffer = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) {
      notify('No candidate selected for offer.', 'warning');
      return;
    }
    const token = localStorage.getItem('nsg_jwt_token');
    
    try {
      const res = await fetch('/api/hr-portal/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          candidate_id: Number(selectedCandidate.id),
          basic_pay: basicPay,
          hra: hra,
          allowance: allowance
        })
      });
      if (!res.ok) throw new Error('Failed to create offer');
      
      notify(`Offer generated: ₹${basicPay + hra + allowance}/month gross CTC and saved to database.`, 'success');
      setShowOfferForm(false);
      
      // Auto-move to offer stage
      if (selectedCandidate.stage !== 'offer') {
        handleMoveStage(selectedCandidate.id, 'offer');
      }
    } catch (err) {
      notify(`Error: ${err.message}`, 'error');
    }
  };

  // Mock analysis generator helper
  const getMockAnalysis = (candidate) => {
    if (candidate && candidate.parsedResult) {
      return candidate.parsedResult;
    }
    const name = candidate.name;
    const role = candidate.role || 'Developer';
    
    if (name.includes('Malhotra') || role.toLowerCase().includes('react')) {
      return {
        score: 94,
        skills: [
          { name: 'React.js', matched: true },
          { name: 'Redux Toolkit', matched: true },
          { name: 'JavaScript (ES6+)', matched: true },
          { name: 'TypeScript', matched: true },
          { name: 'Webpack / Vite', matched: true },
          { name: 'CSS Grid & Flexbox', matched: true },
          { name: 'Node.js / Express', matched: false },
          { name: 'AWS Cloud / S3', matched: false }
        ],
        recommendation: 'Exceptional frontend skill set. Expert-level state management experience. Recommended for immediate tech round, highly aligned with senior frontend path.'
      };
    } else if (name.includes('Sharma') || role.toLowerCase().includes('product')) {
      return {
        score: 88,
        skills: [
          { name: 'Product Roadmap Design', matched: true },
          { name: 'Jira & Confluence', matched: true },
          { name: 'Agile & Scrum Sprints', matched: true },
          { name: 'User Persona Mapping', matched: true },
          { name: 'Product Strategy & KPI', matched: true },
          { name: 'Figma Wireframing', matched: true },
          { name: 'SQL Analytics & Python', matched: false }
        ],
        recommendation: 'Highly structured PM with strong execution focus. Exceptional technical empathy and UI design literacy. Minor gap in data analysis tools, but highly recommended for business sprints.'
      };
    } else if (name.includes('Deshmukh') || role.toLowerCase().includes('designer') || role.toLowerCase().includes('ui')) {
      return {
        score: 79,
        skills: [
          { name: 'Figma UI Layouts', matched: true },
          { name: 'Adobe XD / Creative Cloud', matched: true },
          { name: 'Interactive Prototyping', matched: true },
          { name: 'User Flow Mapping', matched: true },
          { name: 'React Component Architecture', matched: false },
          { name: 'Framer Motion Animations', matched: false }
        ],
        recommendation: 'Creative designer with polished UI aesthetics. Outstanding visual design portfolio. Needs guidance on developer component handoffs and responsive web constraints.'
      };
    } else if (name.includes('Iyer') || role.toLowerCase().includes('qa') || role.toLowerCase().includes('testing')) {
      return {
        score: 91,
        skills: [
          { name: 'Selenium Webdriver', matched: true },
          { name: 'Cypress Testing Suite', matched: true },
          { name: 'JavaScript & Java', matched: true },
          { name: 'Jest Unit Testing', matched: true },
          { name: 'Automation Sprints Plan', matched: true },
          { name: 'Docker Containers', matched: false },
          { name: 'Jenkins CI/CD Pipelines', matched: false }
        ],
        recommendation: 'Extensive test suite automation coverage. Clear bug reporting and defect-tracking standards. Highly methodical and well-suited for high-frequency deployment environments.'
      };
    } else {
      return {
        score: 86,
        skills: [
          { name: 'Core Skill Competency', matched: true },
          { name: 'Team Collaboration Sprints', matched: true },
          { name: 'Git Version Control', matched: true },
          { name: 'Problem Solving Focus', matched: true },
          { name: 'Containerization / Deployment', matched: false },
          { name: 'Cloud Server Scaling', matched: false }
        ],
        recommendation: 'Solid candidate profile displaying robust foundational competencies. Demonstrates strong communication and structured logic. Fits target designation constraints cleanly.'
      };
    }
  };

  const handleStartParsing = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      notify('Please upload a resume file first.', 'warning');
      return;
    }
    if (!uploadedCandidateName.trim()) {
      notify('Please enter a candidate name.', 'warning');
      return;
    }
    
    const roleToAnalyze = uploadedCandidateRole === 'Other' ? customRole.trim() : uploadedCandidateRole;
    if (uploadedCandidateRole === 'Other' && !roleToAnalyze) {
      notify('Please enter a custom target role.', 'warning');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStatus('Uploading document...');
    
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('target_role', roleToAnalyze);
      
      setAnalysisStatus('Parsing resume content...');
      const response = await fetch('/api/hr-portal/candidates/analyze-resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to analyze resume');
      }
      
      setAnalysisStatus('AI matching evaluation...');
      const result = await response.json();
      
      // Update states with the real parsed result
      setParsedResult(result);
      if (result.name && result.name !== 'Parsed Candidate' && result.name !== 'Unknown Candidate') {
        setUploadedCandidateName(result.name);
      }
      
      // If we analyzed a custom role successfully, add it to custom roles list and switch select to it
      if (uploadedCandidateRole === 'Other') {
        setCustomRoles(prev => Array.from(new Set([...prev, roleToAnalyze])));
        setUploadedCandidateRole(roleToAnalyze);
      }
      
      setIsAnalyzing(false);
    } catch (err) {
      console.error(err);
      notify(`Error analyzing resume: ${err.message}`, 'error');
      setIsAnalyzing(false);
    }
  };

  const handleImportCandidate = async () => {
    if (!uploadedCandidateName) return;
    
    const token = localStorage.getItem('nsg_jwt_token');
    try {
      const res = await fetch('/api/hr-portal/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: uploadedCandidateName,
          email: (uploadedCandidateName.toLowerCase().replace(/\s+/g, '.')) + '@nsgapplicant.com',
          phone: '+91 ' + String(Math.floor(7000000000 + Math.random() * 2999999999)),
          role: uploadedCandidateRole === 'Other' ? customRole : uploadedCandidateRole,
          source: 'AI Resume Parser',
          stage: 'applied',
          resume_url: '#'
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to import candidate.');
      }
      
      notify(`${uploadedCandidateName} imported into Applied board.`, 'success');
      
      // Reset states
      setShowAnalyzer(false);
      setUploadedCandidateName('');
      setUploadedFileName('');
      setParsedResult(null);
      setSelectedFile(null);
      setCustomRole('');
      
      await fetchCandidates();
    } catch (err) {
      notify(`Error importing candidate: ${err.message}`, 'error');
    }
  };

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Recruitment & ATS Board</h1>
          <p>Source candidates, coordinate tech screens, schedule video interviews, and release offer structures.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button className="strategic-list-item" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent-pink)', border: '1px solid var(--accent-pink)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => { setAnalyzerCandidate(null); setUploadedFileName(''); setUploadedCandidateName(''); setParsedResult(null); setShowAnalyzer(true); }}>
            <FileText size={16} /> AI Resume Analyzer
          </button>
          <button className="strategic-list-item" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowScheduler(true)}>
            <Calendar size={16} /> Schedule Interview
          </button>
        </div>
      </div>

      {/* ATS board grids arranged 3 per row without horizontal scrollbar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', paddingBottom: '16px' }}>
        {stages.map(st => (
          <div key={st.id} style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '16px', minWidth: '0' }}>
            <h4 style={{ margin: '0 0 16px 0', borderBottom: '2px solid var(--border-color)', paddingBottom: '8px', textTransform: 'uppercase', fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
              <span>{st.label}</span>
              <span className="badge-pill bg-pink">{candidates.filter(c => c.stage === st.id).length}</span>
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {candidates.filter(c => c.stage === st.id).map(cand => (
                <div key={cand.id} className="metric-card" style={{ padding: '14px', gap: '8px', borderLeft: '3px solid var(--accent-pink)' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{cand.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{cand.role}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                    {st.id !== 'joined' && (
                      <button style={{ background: 'none', border: '1px solid var(--border-color)', cursor: 'pointer', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }} onClick={() => {
                        const nextStage = stages[stages.findIndex(s => s.id === st.id) + 1]?.id;
                        if (nextStage) handleMoveStage(cand.id, nextStage);
                      }}>
                        Move <ArrowRight size={10} />
                      </button>
                    )}
                    <button style={{ background: 'none', border: '1px solid var(--border-color)', cursor: 'pointer', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-primary)' }} onClick={() => {
                      setAnalyzerCandidate(cand);
                      setShowAnalyzer(true);
                    }}>
                      📄 Analyze
                    </button>
                    {st.id !== 'joined' && (
                      <button style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', borderRadius: '4px', padding: '2px 6px', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => {
                        if (window.confirm(`Are you sure you want to reject ${cand.name}?`)) {
                          handleMoveStage(cand.id, 'rejected');
                        }
                      }}>
                        ✕ Reject
                      </button>
                    )}
                    {st.id === 'interview' && (
                      <button style={{ background: 'none', border: '1px solid var(--accent-pink)', color: 'var(--accent-pink)', cursor: 'pointer', borderRadius: '4px', padding: '2px 6px', fontSize: '10px' }} onClick={() => {
                        setSelectedCandidate(cand);
                        setShowOfferForm(true);
                      }}>
                        CTC Offer
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Popups Scheduler */}
      {showScheduler && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleScheduleInterview} className="card" style={{ width: '400px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3>📅 Schedule Video Interview</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
              <label style={{ fontSize: '12px' }}>Candidate Name</label>
              <select value={schedCandidateId} onChange={e => setSchedCandidateId(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}>
                <option value="">Select a Candidate...</option>
                {candidates.filter(c => ['applied', 'screening', 'interview'].includes(c.stage)).map(c => (
                  <option key={c.id} value={c.id}>{c.name} - {c.role}</option>
                ))}
              </select>
              
              <label style={{ fontSize: '12px' }}>Interviewer (TL)</label>
              <select value={schedInterviewer} onChange={e => setSchedInterviewer(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}>
                <option>John Doe (Engineering Lead)</option>
                <option>Vikram Sen (Sales Director)</option>
              </select>

              <label style={{ fontSize: '12px' }}>Scheduled Date & Time</label>
              <input type="datetime-local" value={schedDateTime} onChange={e => setSchedDateTime(e.target.value)} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setShowScheduler(false)}>Cancel</button>
              <button type="submit" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Schedule</button>
            </div>
          </form>
        </div>
      )}

      {/* Popups Offer Forms */}
      {showOfferForm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreateOffer} className="card" style={{ width: '420px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <h3>📄 Propose CTC Offer Structure</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', margin: '16px 0' }}>
              <label style={{ fontSize: '12px' }}>Basic Salary (Monthly)</label>
              <input type="number" value={basicPay} onChange={(e) => setBasicPay(Number(e.target.value))} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
              
              <label style={{ fontSize: '12px' }}>HRA (Monthly)</label>
              <input type="number" value={hra} onChange={(e) => setHra(Number(e.target.value))} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <label style={{ fontSize: '12px' }}>Special Allowance (Monthly)</label>
              <input type="number" value={allowance} onChange={(e) => setAllowance(Number(e.target.value))} required style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span>Simulated EPF Contribution (12% Basic):</span>
                  <strong>₹{Math.floor(basicPay * 0.12)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 'bold', marginTop: '8px', color: 'var(--accent-pink)' }}>
                  <span>Gross Monthly CTC:</span>
                  <span>₹{basicPay + hra + allowance}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }} onClick={() => setShowOfferForm(false)}>Cancel</button>
              <button type="submit" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Generate Offer</button>
            </div>
          </form>
        </div>
      )}

      {/* Popups AI Resume Analyzer */}
      {showAnalyzer && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div className="card" style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
                <span style={{ fontSize: '20px' }}>🧠</span> NSG AI Resume Analyzer &amp; Parser
              </h3>
              <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '16px' }} onClick={() => setShowAnalyzer(false)}>✕</button>
            </div>

            {/* CASE 1: Analyzing an existing candidate */}
            {analyzerCandidate ? (() => {
              const analysis = getMockAnalysis(analyzerCandidate);
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{analyzerCandidate.name}</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Targeting: {analyzerCandidate.role}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Match Score</span>
                      <strong style={{ fontSize: '22px', color: analysis.score >= 90 ? 'var(--accent-green)' : 'var(--accent-gold)' }}>{analysis.score}%</strong>
                    </div>
                  </div>

                  {/* Score Indicator Slider */}
                  <div>
                    <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${analysis.score}%`, background: 'linear-gradient(90deg, var(--accent-pink) 0%, var(--accent-blue) 100%)', borderRadius: '3px' }} />
                    </div>
                  </div>

                  {/* Skills Grid */}
                  <div>
                    <h5 style={{ margin: '0 0 10px 0', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>AI Keyword &amp; Competency Match</h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {analysis.skills.map((sk, index) => (
                        <span key={index} style={{ 
                          fontSize: '11px', 
                          padding: '4px 10px', 
                          borderRadius: '20px', 
                          border: '1px solid', 
                          backgroundColor: sk.matched ? 'rgba(74, 222, 128, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                          borderColor: sk.matched ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                          color: sk.matched ? 'var(--accent-green)' : '#f87171',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {sk.matched ? '✓' : '✗'} {sk.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* AI Recommendation */}
                  <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.03)', border: '1px dashed var(--accent-blue)', borderRadius: '10px', padding: '16px' }}>
                    <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-blue)', fontWeight: 'bold' }}>NSG AI Recommendation &amp; Summary</h5>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', fontStyle: 'italic' }}>
                      "{analysis.recommendation}"
                    </p>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setShowAnalyzer(false)}>Close Analysis</button>
                  </div>
                </div>
              );
            })() : (
              /* CASE 2: Resume Parser Hub (Simulate uploading any resume) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* Simulated file uploader active state */}
                {isAnalyzing ? (
                  <div style={{ padding: '40px 0', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ border: '4px solid var(--border-color)', borderTopColor: 'var(--accent-pink)', borderRadius: '50%', width: '48px', height: '48px', animation: 'spin 1s linear infinite' }} />
                    <div>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>NSG Engine Parsing Resume</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{analysisStatus}</p>
                    </div>
                  </div>
                ) : parsedResult ? (
                  /* Parsing Completed Result */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ backgroundColor: 'rgba(74, 222, 128, 0.05)', padding: '12px', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '8px', fontSize: '12px', color: 'var(--accent-green)', textAlign: 'center', fontWeight: '500' }}>
                      ✓ AI Parsing Completed! Core credentials extracted successfully.
                    </div>

                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-primary)' }}>{uploadedCandidateName}</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Targeting: {uploadedCandidateRole}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>AI Match Score</span>
                        <strong style={{ fontSize: '22px', color: 'var(--accent-green)' }}>{parsedResult.score}%</strong>
                      </div>
                    </div>

                    {/* Skills Grid */}
                    <div>
                      <h5 style={{ margin: '0 0 10px 0', fontSize: '12px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Extracted Competency Profile</h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {parsedResult.skills.map((sk, index) => (
                          <span key={index} style={{ 
                            fontSize: '11px', 
                            padding: '4px 10px', 
                            borderRadius: '20px', 
                            border: '1px solid', 
                            backgroundColor: sk.matched ? 'rgba(74, 222, 128, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                            borderColor: sk.matched ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                            color: sk.matched ? 'var(--accent-green)' : '#f87171',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {sk.matched ? '✓' : '✗'} {sk.name}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.03)', border: '1px dashed var(--accent-blue)', borderRadius: '10px', padding: '16px' }}>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', textTransform: 'uppercase', color: 'var(--accent-blue)', fontWeight: 'bold' }}>NSG AI Recommendation &amp; Summary</h5>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', fontStyle: 'italic' }}>
                        "{parsedResult.recommendation}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <button style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setParsedResult(null)}>Re-upload</button>
                      <button style={{ backgroundColor: 'var(--accent-green)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }} onClick={handleImportCandidate}>Import Into ATS Board</button>
                    </div>
                  </div>
                ) : (
                  /* File drag drop selector form */
                  <form onSubmit={handleStartParsing} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    
                    <div 
                      onClick={() => document.getElementById('resume-file-input').click()} 
                      style={{ 
                        border: '2px dashed var(--border-color)', 
                        borderRadius: '12px', 
                        padding: '30px 16px', 
                        textAlign: 'center', 
                        cursor: 'pointer', 
                        backgroundColor: uploadedFileName ? 'rgba(236,72,153,0.02)' : 'transparent',
                        borderColor: uploadedFileName ? 'var(--accent-pink)' : 'var(--border-color)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="file" 
                        id="resume-file-input" 
                        accept=".pdf,.docx,.txt" 
                        style={{ display: 'none' }} 
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setSelectedFile(file);
                            setUploadedFileName(file.name);
                            // Pre-fill candidate name based on file name if empty
                            const cleanName = file.name.split('.')[0]
                              .replace(/_|-/g, ' ')
                              .replace(/\b\w/g, c => c.toUpperCase());
                            setUploadedCandidateName(cleanName);
                          }
                        }}
                      />
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
                      {uploadedFileName ? (
                        <div>
                          <strong style={{ color: 'var(--accent-pink)', fontSize: '13px' }}>{uploadedFileName}</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Ready for parsing. Click to change.</p>
                        </div>
                      ) : (
                        <div>
                          <strong style={{ fontSize: '13px', color: 'var(--text-primary)' }}>Click to select candidate resume</strong>
                          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Supports PDF, DOCX, TXT formats</p>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label style={{ fontSize: '12px' }}>Applicant Full Name</label>
                      <input type="text" value={uploadedCandidateName} onChange={(e) => setUploadedCandidateName(e.target.value)} required placeholder="e.g. John Doe" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }} />
                      
                      <label style={{ fontSize: '12px' }}>Target Enterprise Role</label>
                      <select value={uploadedCandidateRole} onChange={(e) => setUploadedCandidateRole(e.target.value)} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px' }}>
                        {allRoles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                        <option value="Other">Other...</option>
                      </select>
                      
                      {uploadedCandidateRole === 'Other' && (
                        <input 
                          type="text" 
                          placeholder="Enter custom role (e.g. Data Scientist)" 
                          value={customRole} 
                          onChange={(e) => setCustomRole(e.target.value)} 
                          required 
                          style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '8px', borderRadius: '6px', marginTop: '8px' }} 
                        />
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }} onClick={() => setShowAnalyzer(false)}>Cancel</button>
                      <button type="submit" disabled={!uploadedFileName} style={{ backgroundColor: uploadedFileName ? 'var(--accent-pink)' : 'var(--border-color)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: uploadedFileName ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 'bold' }}>Run AI Analysis</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. EMPLOYEE REGISTRY VIEW
