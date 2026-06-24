import React, { useState, useEffect } from 'react';
import styles from './performance.module.css';
import { Award, ClipboardSignature, Send, ListTodo, Loader2, AlertCircle, Download, Search, Filter } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useCompany } from '../../common/CompanyContext';

export default function Performance({ currentUser }) {
  const { companyName, companyLogo } = useCompany();
  const [teamMembers, setTeamMembers] = useState([]);
  const [scorecards, setScorecards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination & Filtering
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [filterName, setFilterName] = useState('');
  const [filterRating, setFilterRating] = useState('All');

  const [formState, setFormState] = useState({
    employeeName: '',
    rating: '',
    comments: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const ratings = [
    'A — Excellent',
    'B — Competent',
    'C — Developing',
    'D — Needs Improvement'
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('nsg_jwt_token');
      const headers = { 'Authorization': `Bearer ${token}` };

      try {
        const [membersRes, scorecardsRes] = await Promise.all([
          fetch('/api/team-lead/team-members', { headers }),
          fetch('/api/team-lead/scorecards', { headers })
        ]);

        if (!membersRes.ok || !scorecardsRes.ok) {
          throw new Error('Failed to fetch data from the server.');
        }

        const membersData = await membersRes.json();
        const scorecardsData = await scorecardsRes.json();

        setTeamMembers(membersData);
        setScorecards(scorecardsData);
        setTeamMembers(membersData);
        setScorecards(scorecardsData);
      } catch (err) {
        console.error(err);
        setError(err.message || 'An error occurred while loading performance data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formState.employeeName) newErrors.employeeName = "Target Employee is required.";
    if (!formState.rating) newErrors.rating = "Performance Rating Band is required.";
    if (!formState.comments.trim()) newErrors.comments = "TL Feedback Comments are required.";

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      if (window.toast && window.toast.warning) window.toast.warning('Please fix the validation errors.');
      return;
    }
    setFormErrors({});

    setSubmitLoading(true);
    const token = localStorage.getItem('nsg_jwt_token');

    try {
      const response = await fetch('/api/team-lead/scorecards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employee_name: formState.employeeName,
          rating: formState.rating,
          comments: formState.comments
        })
      });

      if (!response.ok) {
        let errStr = 'Failed to submit scorecard.';
        try {
          const errData = await response.json();
          if (errData.detail) errStr = typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail);
        } catch(e) {}
        throw new Error(errStr);
      }

      const savedScorecard = await response.json();
      setScorecards(prev => [savedScorecard, ...prev]);
      setFormState({ employeeName: '', rating: '', comments: '' });
      setFormErrors({});
      if (window.toast) window.toast.success('Performance scorecard submitted successfully!');
    } catch (err) {
      console.error(err);
      window.toast.error(err.message || 'Failed to submit the scorecard.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const getRatingBadgeClass = (rating) => {
    if (rating.startsWith('A')) return styles.badgeExcellent;
    if (rating.startsWith('B')) return styles.badgeCompetent;
    if (rating.startsWith('C')) return styles.badgeDeveloping;
    return styles.badgeNeedsImprovement;
  };

  // Filter Logic
  const filteredScorecards = scorecards.filter(sc => {
    const matchName = sc.employee_name.toLowerCase().includes(filterName.toLowerCase());
    const matchRating = filterRating === 'All' || sc.rating.startsWith(filterRating.charAt(0));
    return matchName && matchRating;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredScorecards.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentScorecards = filteredScorecards.slice(indexOfFirstItem, indexOfLastItem);

  const exportPDF = () => {
    const doc = new jsPDF('landscape', 'pt', 'a4');
    
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = companyLogo || '/hmns-logo.png';
    
    const renderPDF = () => {
      // Premium White Header
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 110, 'F');
      
      try {
        const imgRatio = img.width / img.height;
        const logoHeight = 45;
        const logoWidth = logoHeight * imgRatio;
        doc.addImage(img, 'PNG', 40, 25, logoWidth, logoHeight);
      } catch (e) {
        doc.setFontSize(20);
        doc.setTextColor(15, 23, 42);
        doc.text(companyName, 40, 50);
      }
      
      // Divider Line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(40, 100, doc.internal.pageSize.getWidth() - 40, 100);
      
      // Report Title
      doc.setFontSize(20);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.text('TEAM PERFORMANCE SCORECARDS REPORT', doc.internal.pageSize.getWidth() - 40, 45, { align: 'right' });
      
      // Timestamp
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.getWidth() - 40, 65, { align: 'right' });

      // Filter info
      let filterText = `Filters: `;
      if (filterName) filterText += `Employee: ${filterName} | `;
      filterText += `Rating: ${filterRating}`;
      
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(filterText, 40, 85);

      // Table Data
      const tableColumn = ['Employee', 'Rating', 'Feedback Comments', 'Emp Acknowledged', 'HR Approved'];
      const tableRows = [];

      filteredScorecards.forEach(sc => {
        tableRows.push([
          sc.employee_name, 
          sc.rating, 
          sc.comments, 
          sc.emp_acknowledged ? 'Yes' : 'Pending', 
          sc.hr_acknowledged ? 'Yes' : 'Pending'
        ]);
      });

      autoTable(doc, {
        startY: 120,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid',
        headStyles: { 
          fillColor: [59, 130, 246], // blue-500
          textColor: [255, 255, 255], 
          fontStyle: 'bold',
          halign: 'left',
          valign: 'middle'
        },
        styles: { 
          fontSize: 10, 
          cellPadding: 8,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
          lineWidth: 0.5
        },
        alternateRowStyles: { fillColor: [248, 250, 252] }, // slate-50
        columnStyles: {
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center', fontStyle: 'bold' }
        },
        margin: { top: 120, left: 40, right: 40, bottom: 40 },
        didDrawPage: function (data) {
          doc.setFontSize(9);
          doc.setTextColor(148, 163, 184); // slate-400
          doc.text(`Page ${doc.internal.getNumberOfPages()}`, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
        }
      });

      doc.save(`Team_Scorecards_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    img.onload = renderPDF;
    img.onerror = renderPDF;
  };

  return (
    <div className={styles.container}>
      <div className="component-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={28} style={{ color: '#3b82f6' }} />
            Team Performance Calibration
          </h1>
          <p>Assess team member contributions, calibrate ratings, and submit evaluation scorecards for review.</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column', gap: '12px' }}>
          <Loader2 className="animate-spin" size={32} style={{ color: '#3b82f6' }} />
          <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Loading team calibration data...</span>
        </div>
      ) : error ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '16px' }}>
          <AlertCircle size={40} style={{ color: 'var(--danger)' }} />
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', textAlign: 'center' }}>{error}</div>
        </div>
      ) : (
        <div className={styles.layout}>
          {/* Submission Form */}
          <div className={styles.formCard}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', padding: 0 }}>
              <ClipboardSignature size={18} style={{ color: '#3b82f6' }} />
              Submit Scorecard
            </h3>
            
            {teamMembers.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>
                No active team members found in your department.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="target-employee">Target Employee</label>
                  {formErrors.employeeName && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px', marginBottom: '4px' }}><AlertCircle size={12} /><span>{formErrors.employeeName}</span></div>}
                  <select
                    id="target-employee"
                    className={styles.formSelect}
                    value={formState.employeeName}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, employeeName: e.target.value }));
                      if (!e.target.value) setFormErrors(prev => ({...prev, employeeName: "Target Employee is required."}));
                      else setFormErrors(prev => ({...prev, employeeName: null}));
                    }}
                    onFocus={(e) => { if(!e.target.value) setFormErrors(prev => ({...prev, employeeName: "Target Employee is required."})); }}
                    onBlur={(e) => { if (!e.target.value) setFormErrors(prev => ({...prev, employeeName: "Target Employee is required."})); }}
                    style={formErrors.employeeName ? { borderColor: '#ef4444' } : {}}
                  >
                    <option value="">Select an employee...</option>
                    {teamMembers.map(member => (
                      <option key={member.id} value={member.name}>
                        {member.name} ({member.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="rating-band">Performance Rating Band</label>
                  {formErrors.rating && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px', marginBottom: '4px' }}><AlertCircle size={12} /><span>{formErrors.rating}</span></div>}
                  <select
                    id="rating-band"
                    className={styles.formSelect}
                    value={formState.rating}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, rating: e.target.value }));
                      if (!e.target.value) setFormErrors(prev => ({...prev, rating: "Performance Rating Band is required."}));
                      else setFormErrors(prev => ({...prev, rating: null}));
                    }}
                    onFocus={(e) => { if(!e.target.value) setFormErrors(prev => ({...prev, rating: "Performance Rating Band is required."})); }}
                    onBlur={(e) => { if (!e.target.value) setFormErrors(prev => ({...prev, rating: "Performance Rating Band is required."})); }}
                    style={formErrors.rating ? { borderColor: '#ef4444' } : {}}
                  >
                    <option value="">Select a rating band...</option>
                    {ratings.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="tl-comments">TL Feedback Comments</label>
                  {formErrors.comments && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', marginTop: '4px', marginBottom: '4px' }}><AlertCircle size={12} /><span>{formErrors.comments}</span></div>}
                  <textarea
                    id="tl-comments"
                    className={styles.formTextarea}
                    placeholder="Provide detailed feedback on milestones achieved, software quality, velocity, and areas of growth..."
                    value={formState.comments}
                    onChange={(e) => {
                      setFormState(prev => ({ ...prev, comments: e.target.value }));
                      if (!e.target.value.trim()) setFormErrors(prev => ({...prev, comments: "TL Feedback Comments are required."}));
                      else setFormErrors(prev => ({...prev, comments: null}));
                    }}
                    onFocus={(e) => { if(!e.target.value.trim()) setFormErrors(prev => ({...prev, comments: "TL Feedback Comments are required."})); }}
                    onBlur={(e) => { if (!e.target.value || String(e.target.value).trim() === '') setFormErrors(prev => ({...prev, comments: "TL Feedback Comments are required."})); }}
                    style={formErrors.comments ? { borderColor: '#ef4444' } : {}}
                    maxLength={1000}
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={submitLoading}>
                  {submitLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={16} /> Submit Scorecard
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Submitted Tracker */}
          <div className={styles.activeCard} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', padding: 0 }}>
                <ListTodo size={18} style={{ color: '#3b82f6' }} />
                Submitted Scorecards ({filteredScorecards.length})
              </h3>
              <button 
                onClick={exportPDF}
                className={styles.submitBtn} 
                style={{ width: 'auto', padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '6px' }}
              >
                <Download size={14} /> Export PDF
              </button>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search employee..." 
                  value={filterName}
                  onChange={(e) => { setFilterName(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px' }}
                />
              </div>
              <div style={{ position: 'relative', width: '150px' }}>
                <Filter size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select 
                  value={filterRating}
                  onChange={(e) => { setFilterRating(e.target.value); setCurrentPage(1); }}
                  style={{ width: '100%', padding: '8px 8px 8px 32px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', appearance: 'none' }}
                >
                  <option value="All">All Ratings</option>
                  <option value="A">A Band</option>
                  <option value="B">B Band</option>
                  <option value="C">C Band</option>
                  <option value="D">D Band</option>
                </select>
              </div>
            </div>
            
            <div className={styles.tableWrapper} style={{ flex: 1 }}>
              {filteredScorecards.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', fontStyle: 'italic' }}>
                  No scorecards match the criteria.
                </div>
              ) : (
                <table className={styles.trackerTable}>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Rating</th>
                      <th>Feedback / Comments</th>
                      <th>Status (Employee & HR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentScorecards.map(sc => (
                      <tr key={sc.id}>
                        <td><strong>{sc.employee_name}</strong></td>
                        <td>
                          <span className={`${styles.badge} ${sc.rating.startsWith('A') ? styles.badgeSuccess : sc.rating.startsWith('B') ? styles.badgeWarning : styles.badgeDanger}`}>
                            {sc.rating}
                          </span>
                        </td>
                        <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>"{sc.comments}"</td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {sc.emp_acknowledged && (
                              <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#0ea5e9', backgroundColor: 'rgba(14,165,233,0.1)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                ✅ Emp Ack
                              </span>
                            )}
                            {sc.hr_acknowledged && (
                              <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#16a34a', backgroundColor: 'rgba(34,197,94,0.1)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                ✅ HR Appr
                              </span>
                            )}
                            {!sc.emp_acknowledged && !sc.hr_acknowledged && (
                              <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                                ⏳ Pending
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Controls */}
            {filteredScorecards.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', fontSize: '12px' }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredScorecards.length)} of {filteredScorecards.length} entries
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: currentPage === 1 ? 'transparent' : 'var(--bg-secondary)', color: currentPage === 1 ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <span style={{ padding: '4px 8px', fontWeight: 'bold' }}>Page {currentPage} of {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '4px 12px', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: currentPage === totalPages ? 'transparent' : 'var(--bg-secondary)', color: currentPage === totalPages ? 'var(--text-muted)' : 'var(--text-primary)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
