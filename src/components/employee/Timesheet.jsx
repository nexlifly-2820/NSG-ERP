import React, { useState, useEffect } from 'react';
import { Filter, Send, Edit, Trash2, CheckCircle, Clock, AlertTriangle, Save, CalendarDays, Check } from 'lucide-react';
import './Timesheet.css';
import './pagination.css';

export default function Timesheet() {
  const [timesheets, setTimesheets] = useState([]);

  const today = new Date();
  const initialYear = today.getFullYear();
  const initialMonth = today.getMonth() + 1;
  const initialWeek = Math.ceil(today.getDate() / 7);

  // Filter states
  const [filterYear, setFilterYear] = useState(initialYear);
  const [filterMonth, setFilterMonth] = useState(initialMonth);
  const [filterWeek, setFilterWeek] = useState(initialWeek);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [timesheets.length, filterYear, filterMonth, filterWeek]);

  const totalPages = Math.ceil(timesheets.length / ITEMS_PER_PAGE);
  const paginatedTimesheets = timesheets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formProject, setFormProject] = useState('');
  const [formTask, setFormTask] = useState('');
  const [formDate, setFormDate] = useState(today.toISOString().slice(0, 10));
  const [formHours, setFormHours] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const fetchTimesheets = async () => {
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      let url = `/api/timesheets/my-timesheets?year=${filterYear}&month=${filterMonth}`;
      if (filterWeek > 0) {
        url += `&week=${filterWeek}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTimesheets(data);
      } else {
        console.error("Failed to fetch timesheets", await res.text());
      }
    } catch (e) { console.error("Network error fetching timesheets", e); }
  };

  useEffect(() => {
    fetchTimesheets();
  }, [filterYear, filterMonth, filterWeek]);

  const handleSaveDraft = async () => {
    setErrorMsg('');
    const newErrors = {};

    if (!formProject.trim()) newErrors.project = "Project is required.";
    if (!formTask.trim()) newErrors.task = "Task is required.";
    if (!formDate) newErrors.date = "Date is required.";
    
    if (!formHours) {
      newErrors.hours = "Hours is required.";
    } else {
      const hours = parseFloat(formHours);
      if (isNaN(hours) || hours <= 0 || hours > 9) {
        newErrors.hours = "Invalid hours.";
      }
    }
    
    if (!formDescription.trim()) newErrors.description = "Description is required.";

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setErrorMsg("Please fix the validation errors below.");
      return;
    }
    setFormErrors({});

    const hours = parseFloat(formHours);

    const payload = {
      project: formProject.trim(),
      task: formTask.trim(),
      date: formDate,
      hours: hours,
      description: formDescription.trim(),
      status: 'draft'
    };

    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const url = isEditing ? `/api/timesheets/${editId}` : `/api/timesheets/`;
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        resetForm();
        fetchTimesheets();
      } else {
        let errStr = "Error saving timesheet.";
        try {
          const err = await res.json();
          errStr = err.detail || errStr;
        } catch (e) {
          errStr += ` Status: ${res.status}`;
        }
        setErrorMsg(errStr);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg("Network error. Please check your connection to the server.");
    }
  };

  const submitAllDrafts = async () => {
    const drafts = timesheets.filter(t => t.status === 'draft' || t.status === 'rejected').map(t => t.id);
    if (drafts.length === 0) return;

    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch('/api/timesheets/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ids: drafts })
      });
      if (res.ok) {
        fetchTimesheets();
      }
    } catch (e) { }
  };

  const handleEdit = (ts) => {
    setIsEditing(true);
    setEditId(ts.id);
    setFormProject(ts.project);
    setFormTask(ts.task);
    setFormDate(ts.date);
    setFormDescription(ts.description);
    setFormHours(ts.hours.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this log?")) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/timesheets/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTimesheets();
      } else {
        const err = await res.json();
        window.toast.error(err.detail || "Failed to delete.");
      }
    } catch (e) { }
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditId(null);
    setFormProject('');
    setFormTask('');
    setFormDescription('');
    setFormHours('');
    setErrorMsg('');
    setFormErrors({});
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="status-badge status-approved"><CheckCircle size={14} /> Approved</span>;
      case 'rejected': return <span className="status-badge status-rejected"><AlertTriangle size={14} /> Rejected</span>;
      case 'pending': return <span className="status-badge status-pending"><Clock size={14} /> Pending</span>;
      case 'draft': return <span className="status-badge status-draft">Draft</span>;
      default: return null;
    }
  };

  const draftsCount = timesheets.filter(t => t.status === 'draft' || t.status === 'rejected').length;

  return (
    <div className="ts-root">

      <div className="ts-card">
        <div className="ts-header">
          <div>
            <h2>Daily Timesheets</h2>
            <p>Log your daily work tasks below. Add new tasks instantly via the top row.</p>
          </div>
          <div className="filters">
            <Filter size={20} color="#94a3b8" />
            <select value={filterWeek} onChange={e => setFilterWeek(parseInt(e.target.value))}>
              <option value={0}>All Weeks</option>
              <option value={1}>Week 1</option>
              <option value={2}>Week 2</option>
              <option value={3}>Week 3</option>
              <option value={4}>Week 4</option>
              <option value={5}>Week 5</option>
            </select>
            <select value={filterMonth} onChange={e => setFilterMonth(parseInt(e.target.value))}>
              <option value={1}>January</option><option value={2}>February</option>
              <option value={3}>March</option><option value={4}>April</option>
              <option value={5}>May</option><option value={6}>June</option>
              <option value={7}>July</option><option value={8}>August</option>
              <option value={9}>September</option><option value={10}>October</option>
              <option value={11}>November</option><option value={12}>December</option>
            </select>
            <select value={filterYear} onChange={e => setFilterYear(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {errorMsg && (
          <div className="ts-error">
            <AlertTriangle size={20} /> {errorMsg}
          </div>
        )}

        <div className="ts-table-container">
          <table className="ts-table">
            <thead>
              <tr>
                <th style={{ width: '16%' }}>Project / Sprint</th>
                <th style={{ width: '20%' }}>Task Name</th>
                <th style={{ width: '150px' }}>Date</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Hours</th>
                <th style={{ width: 'auto' }}>Description</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Status</th>
                <th style={{ width: '140px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {/* Add New Entry Row */}
              <tr className="entry-row">
                <td style={{ verticalAlign: 'top' }}>
                  <input type="text" className="ts-input" placeholder="e.g. ERP" value={formProject} onChange={e => { setFormProject(e.target.value); if(!e.target.value.trim()) setFormErrors(prev => ({...prev, project: "Project is required."})); else setFormErrors(prev => ({...prev, project: null})); }} onFocus={(e) => { if(!e.target.value.trim()) setFormErrors(prev => ({...prev, project: "Project is required."})); }} onBlur={(e) => { if (!e.target.value || String(e.target.value).trim() === '') setFormErrors(prev => ({...prev, project: "Project is required."})); }} style={formErrors.project ? { borderColor: '#ef4444' } : {}} />
                  {formErrors.project && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', marginTop: '4px' }}><span>{formErrors.project}</span></div>}
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  <input type="text" className="ts-input" placeholder="e.g. API Dev" value={formTask} onChange={e => { setFormTask(e.target.value); if(!e.target.value.trim()) setFormErrors(prev => ({...prev, task: "Task is required."})); else setFormErrors(prev => ({...prev, task: null})); }} onFocus={(e) => { if(!e.target.value.trim()) setFormErrors(prev => ({...prev, task: "Task is required."})); }} onBlur={(e) => { if (!e.target.value || String(e.target.value).trim() === '') setFormErrors(prev => ({...prev, task: "Task is required."})); }} style={formErrors.task ? { borderColor: '#ef4444' } : {}} />
                  {formErrors.task && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', marginTop: '4px' }}><span>{formErrors.task}</span></div>}
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  <input type="date" className="ts-input" value={formDate} onChange={e => { setFormDate(e.target.value); if(!e.target.value) setFormErrors(prev => ({...prev, date: "Date is required."})); else setFormErrors(prev => ({...prev, date: null})); }} onFocus={(e) => { if(!e.target.value) setFormErrors(prev => ({...prev, date: "Date is required."})); }} onBlur={(e) => { if (!e.target.value) setFormErrors(prev => ({...prev, date: "Date is required."})); }} style={formErrors.date ? { borderColor: '#ef4444' } : {}} disabled={isEditing} />
                  {formErrors.date && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', marginTop: '4px' }}><span>{formErrors.date}</span></div>}
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  <input type="number" step="0.5" min="0.5" max="9" className="ts-input" style={{ textAlign: 'center', ...(formErrors.hours ? { borderColor: '#ef4444' } : {}) }} placeholder="0.0" value={formHours} onChange={e => { setFormHours(e.target.value); if(!e.target.value) setFormErrors(prev => ({...prev, hours: "Required."})); else setFormErrors(prev => ({...prev, hours: null})); }} onFocus={(e) => { if(!e.target.value) setFormErrors(prev => ({...prev, hours: "Required."})); }} onBlur={(e) => { if (!e.target.value) setFormErrors(prev => ({...prev, hours: "Required."})); }} />
                  {formErrors.hours && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', marginTop: '4px' }}><span>{formErrors.hours}</span></div>}
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  <input type="text" className="ts-input" placeholder="Describe exactly what you did..." value={formDescription} onChange={e => { setFormDescription(e.target.value); if(!e.target.value.trim()) setFormErrors(prev => ({...prev, description: "Description is required."})); else setFormErrors(prev => ({...prev, description: null})); }} onFocus={(e) => { if(!e.target.value.trim()) setFormErrors(prev => ({...prev, description: "Description is required."})); }} onBlur={(e) => { if (!e.target.value || String(e.target.value).trim() === '') setFormErrors(prev => ({...prev, description: "Description is required."})); }} style={formErrors.description ? { borderColor: '#ef4444' } : {}} />
                  {formErrors.description && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '11px', marginTop: '4px' }}><span>{formErrors.description}</span></div>}
                </td>
                <td style={{ verticalAlign: 'top', textAlign: 'center' }}>
                  <span className="status-badge status-draft" style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#94a3b8' }}>
                    <Edit size={12} /> {isEditing ? 'Editing...' : 'New Log'}
                  </span>
                </td>
                <td style={{ verticalAlign: 'top' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-primary" onClick={handleSaveDraft} style={{ flex: 1, padding: '0' }} title="Save">
                        <Check size={16} />
                      </button>
                      <button className="btn-secondary" onClick={resetForm} style={{ flex: 1, padding: '0' }} title="Cancel">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="btn-primary" onClick={handleSaveDraft} style={{ width: '100%' }}>
                      <Save size={16} /> Save Draft
                    </button>
                  )}
                </td>
              </tr>

              {/* Logged Rows */}
              {paginatedTimesheets.length > 0 ? paginatedTimesheets.map(ts => (
                <tr key={ts.id} className="log-row">
                  <td className="log-project">{ts.project}</td>
                  <td className="log-task">{ts.task}</td>
                  <td>
                    <span className="log-date"><CalendarDays size={14} color="#94a3b8" /> {ts.date}</span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="log-hours">{ts.hours}</span>
                  </td>
                  <td>
                    <div className="log-desc" title={ts.description}>{ts.description}</div>
                    {ts.status === 'rejected' && ts.rejection_comment && (
                      <div className="rejection-note">TL Note: {ts.rejection_comment}</div>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {getStatusBadge(ts.status)}
                  </td>
                  <td className="action-cell">
                    {(ts.status === 'pending' || ts.status === 'draft' || ts.status === 'rejected') ? (
                      <>
                        <button className="icon-btn edit" onClick={() => handleEdit(ts)} title="Edit Log">
                          <Edit size={18} />
                        </button>
                        <button className="icon-btn delete" onClick={() => handleDelete(ts.id)} title="Delete Log">
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', fontWeight: 500 }}>Locked</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', background: '#f1f5f9', marginBottom: '16px' }}>
                      <CalendarDays size={32} color="#94a3b8" />
                    </div>
                    <div style={{ color: '#475569', fontSize: '16px', fontWeight: 600 }}>No logs found for this period</div>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '8px' }}>Enter your daily work in the top row and click "Save Draft"</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {timesheets.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, timesheets.length)} of {timesheets.length} entries
            </div>
            <div className="pagination-controls">
              <button
                className="page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}
              <button
                className="page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Bottom Submit Section */}
        <div className="submit-section">
          <div className="submit-instruction">
            <h4>Ready for Approval?</h4>
            <p>Review your drafted logs in the table above. When complete, submit them to your TL.</p>
          </div>
          <button
            className="btn-primary"
            onClick={submitAllDrafts}
            disabled={draftsCount === 0}
            style={{
              opacity: draftsCount === 0 ? 0.5 : 1,
              cursor: draftsCount === 0 ? 'not-allowed' : 'pointer',
              width: 'auto',
              padding: '0 24px',
              background: draftsCount > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : '#cbd5e1'
            }}
          >
            <Send size={16} /> Submit {draftsCount} Drafts to TL
          </button>
        </div>

      </div>
    </div>
  );
}