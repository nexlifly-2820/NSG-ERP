import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  Search, CheckCircle, AlertTriangle, Clock, Target, Plus, RefreshCw, AlertCircle, X
} from 'lucide-react';
import '../CEO.css';

export default function Projects({ currentUser }) {
  const token = localStorage.getItem('nsg_jwt_token');
  const fetcher = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.json());

  const { data: rawProjects, mutate: mutateProjects } = useSWR('/api/ceo-portal/projects', fetcher);
  const projects = Array.isArray(rawProjects) ? rawProjects : (rawProjects?.projects ?? rawProjects?.data ?? []);
  const { data: departments = [] } = useSWR('/api/ceo-portal/departments', fetcher);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [signoffProject, setSignoffProject] = useState(null);
  const [signature, setSignature] = useState(false);
  const [signingOff, setSigningOff] = useState(false);

  const [editProject, setEditProject] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', department: '', budget: '', used: '', status: 'Active', deadline: '', checklist: '', attachments: '' });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [projectToDelete, setProjectToDelete] = useState(null);

  

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/ceo-portal/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      mutateProjects();
    } catch (err) {
      console.error(err);
      setError('Failed to load projects from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleFileUpload = async (e, setter, stateObj) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;
    setUploading(true);
    
    let currentAttachments = [];
    try {
      currentAttachments = stateObj.attachments ? JSON.parse(stateObj.attachments) : [];
    } catch(e) { currentAttachments = []; }

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/ceo-portal/projects/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        currentAttachments.push({ name: file.name, url: data.url });
      }
      setter({ ...stateObj, attachments: JSON.stringify(currentAttachments) });
    } catch (err) {
      alert('File upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (setter, stateObj, indexToRemove) => {
    try {
      const currentAttachments = stateObj.attachments ? JSON.parse(stateObj.attachments) : [];
      currentAttachments.splice(indexToRemove, 1);
      setter({ ...stateObj, attachments: JSON.stringify(currentAttachments) });
    } catch (e) {
      console.error('Failed to remove attachment', e);
    }
  };

  const getBudgetColor = (used, total) => {
    const pct = used / total;
    if (pct > 0.9) return 'var(--ceo-danger)';
    if (pct > 0.75) return 'var(--ceo-warning)';
    return 'var(--ceo-success)';
  };

  const handleSignoff = async () => {
    if (!signature || !signoffProject) return;
    setSigningOff(true);
    try {
      const res = await fetch(`/api/ceo-portal/projects/${signoffProject.id}/signoff`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Signoff failed');
      const updated = await res.json();
      mutateProjects();
      setSignoffProject(null);
      setSignature(false);
    } catch (err) {
      alert('Failed to sign off project: ' + err.message);
    } finally {
      setSigningOff(false);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/ceo-portal/projects/${editProject.id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProject.name,
          client: editProject.client,
          department: editProject.department,
          budget: Number(editProject.budget),
          used: Number(editProject.used),
          status: editProject.status,
          deadline: editProject.deadline,
          checklist: editProject.checklist,
          attachments: editProject.attachments
        })
      });
      if (!res.ok) throw new Error('Save failed');
      const updated = await res.json();
      mutateProjects();
      setEditProject(null);
    } catch (err) {
      alert('Failed to save project: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/ceo-portal/projects', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProject.name,
          client: newProject.client,
          department: newProject.department,
          budget: Number(newProject.budget),
          used: Number(newProject.used) || 0,
          status: newProject.status,
          deadline: newProject.deadline,
          checklist: newProject.checklist,
          attachments: newProject.attachments
        })
      });
      if (!res.ok) throw new Error('Create failed');
      const created = await res.json();
      mutateProjects();
      setShowCreateModal(false);
      setNewProject({ name: '', client: '', department: '', budget: '', used: '', status: 'Active', deadline: '', checklist: '', attachments: '' });
    } catch (err) {
      alert('Failed to create project: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (id) => {
    try {
      const res = await fetch(`/api/ceo-portal/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      mutateProjects();
      if (typeof alert !== "undefined") alert('Project deleted successfully.');
    } catch (err) {
      if (typeof alert !== "undefined") alert('Failed to delete project: ' + err.message);
    } finally {
      setProjectToDelete(null);
    }
  };

  const filteredProjects = projects.filter(proj => {
    const matchesSearch = proj.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          proj.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || proj.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px', gap: '16px' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--ceo-border)', borderTopColor: 'var(--ceo-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ color: 'var(--ceo-text-secondary)', fontSize: '14px' }}>Loading live project portfolio...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '16px', textAlign: 'center', padding: '24px' }}>
        <AlertCircle size={48} color="var(--ceo-danger)" />
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Connection Error</h2>
        <p style={{ color: 'var(--ceo-text-secondary)', maxWidth: '400px', fontSize: '14px' }}>{error}</p>
        <button className="ceo-btn ceo-btn-primary" onClick={fetchProjects}>
          <RefreshCw size={14} style={{ marginRight: '6px' }} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px', position: 'relative' }}>
      
      {/* HEADER & TOOLBAR */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h1 className="ceo-typography-page-title">Enterprise Project Portfolio</h1>
          <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Strategic oversight of budgets, deadlines, and deliverables.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: '250px' }}>
            <Search size={16} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ceo-form-input" 
              placeholder="Search projects..." 
              style={{ paddingLeft: '36px', height: '40px', width: '100%' }} 
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)} 
            className="ceo-form-input" 
            style={{ height: '40px', cursor: 'pointer', minWidth: '130px' }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="At Risk">At Risk</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
          <button className="ceo-btn ceo-btn-primary" onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', whiteSpace: 'nowrap' }}>
            <Plus size={16} /> New Project
          </button>
        </div>
      </div>

      {/* PROJECTS GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 350px), 1fr))', gap: '24px' }}>
          {filteredProjects.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--ceo-text-muted)' }}>
              No projects found matching your criteria.
            </div>
          ) : (
            filteredProjects.map(proj => (
            <div key={proj.id} className="ceo-command-panel" style={{ padding: '24px', opacity: proj.status === 'Completed' ? 0.7 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span className={`ceo-badge ${proj.status === 'At Risk' ? 'critical' : proj.status === 'Active' ? 'success' : proj.status === 'On Hold' ? 'warning' : 'neutral'}`}>
                  {proj.status}
                </span>
                <span className="ceo-typography-meta"><Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/> {proj.deadline}</span>
              </div>
              
              <div className="ceo-typography-section-title" style={{ fontSize: '18px' }}>{proj.name}</div>
              <div className="ceo-typography-meta" style={{ fontStyle: 'italic', marginTop: '4px' }}>Client: {proj.client}</div>
              {proj.department && <div className="ceo-typography-meta" style={{ marginBottom: '24px', color: 'var(--ceo-primary)' }}>Dept: {proj.department}</div>}
              {!proj.department && <div style={{ marginBottom: '24px' }}></div>}
              
              {/* Budget Bar */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="ceo-typography-meta">Budget Usage</span>
                  <span className="ceo-typography-meta" style={{ fontWeight: 600, color: 'var(--ceo-text-primary)' }}>
                    ₹{(proj.used/1000).toFixed(0)}K / ₹{(proj.budget/1000).toFixed(0)}K
                  </span>
                </div>
                <div style={{ height: '8px', background: 'var(--ceo-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${Math.min(100, (proj.used / proj.budget) * 100)}%`, 
                    background: getBudgetColor(proj.used, proj.budget),
                    borderRadius: '4px',
                    transition: 'width 0.5s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--ceo-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="ceo-btn" onClick={() => setEditProject({...proj})}>
                    Edit
                  </button>
                  {projectToDelete === proj.id ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="ceo-btn" style={{ color: '#fff', background: 'var(--ceo-danger)', borderColor: 'var(--ceo-danger)' }} onClick={() => handleDeleteProject(proj.id)}>
                        Sure?
                      </button>
                      <button className="ceo-btn" onClick={() => setProjectToDelete(null)}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button className="ceo-btn" style={{ color: 'var(--ceo-danger)', borderColor: 'var(--ceo-danger)' }} onClick={() => setProjectToDelete(proj.id)}>
                      Delete
                    </button>
                  )}
                </div>
                <button 
                  className="ceo-btn" 
                  onClick={() => { setSignoffProject(proj); setSignature(false); }} 
                  disabled={proj.status === 'Completed'}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Target size={16} /> {proj.status === 'Completed' ? 'Signed-off' : 'Sign-off Project'}
                </button>
              </div>
            </div>
          )))}
        </div>

      {/* SIGNOFF MODAL */}
      {signoffProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if(e.target === e.currentTarget) { setSignoffProject(null); setSignature(false); } }}>
          <div className="ceo-command-panel" style={{ width: '500px', maxWidth: '90vw' }}>
            <div className="ceo-command-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ceo-typography-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={20} color="var(--ceo-success)"/> Executive Sign-off</div>
              <button onClick={() => { setSignoffProject(null); setSignature(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-muted)' }}><X size={20} /></button>
            </div>
            <div className="ceo-command-content">
              <div style={{ marginBottom: '24px' }}>
                <div className="ceo-typography-meta">Project</div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>{signoffProject.name}</div>
              </div>

              <div style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="ceo-typography-section-title" style={{ fontSize: '14px' }}>Project Checklist</div>
                {(() => {
                  const baseItems = signoffProject.checklist 
                    ? signoffProject.checklist.split(',').map(s => s.trim()).filter(Boolean).map(item => ({ name: item, checked: true }))
                    : [];
                  const milestonesItems = (signoffProject.milestones || []).map(m => ({
                    name: `Milestone: ${m.name} (${m.progress}% Completed)`,
                    checked: m.progress === 100,
                    isMilestone: true
                  }));
                  const fullChecklist = [...baseItems, ...milestonesItems];
                  
                  if (fullChecklist.length === 0) {
                    return <div style={{ fontSize: '13px', color: 'var(--ceo-text-muted)', fontStyle: 'italic' }}>No milestones or checklist items found for this project.</div>;
                  }

                  return fullChecklist.map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                      <input type="checkbox" defaultChecked={item.checked} />
                      <span style={item.isMilestone ? { color: item.checked ? 'var(--ceo-success)' : 'var(--ceo-text)', fontWeight: 500 } : {}}>
                        {item.name}
                      </span>
                    </label>
                  ));
                })()}
              </div>

              <div style={{ marginBottom: '32px' }}>
                <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '8px' }}>Digital Signature</div>
                <div 
                  onClick={() => setSignature(!signature)}
                  style={{ 
                    height: '100px', 
                    background: 'var(--ceo-bg)', 
                    border: `1px dashed ${signature ? 'var(--ceo-primary)' : 'var(--ceo-border)'}`, 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.2s'
                  }}
                >
                  {signature ? (
                    <span style={{ fontFamily: 'cursive', fontSize: '32px', color: 'var(--ceo-primary)' }}>{currentUser?.name || 'CEO'} Approved ✓</span>
                  ) : (
                    <span className="ceo-typography-meta">Click to sign</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button className="ceo-btn" onClick={() => { setSignoffProject(null); setSignature(false); }}>Cancel</button>
                <button 
                  className="ceo-btn ceo-btn-primary" 
                  onClick={handleSignoff} 
                  disabled={!signature || signingOff}
                >
                  {signingOff ? 'Processing...' : 'Authorize Sign-off'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editProject && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ceo-command-panel" style={{ width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="ceo-command-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ceo-typography-section-title">Modify Project Details</div>
              <button onClick={() => setEditProject(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleSaveEdit} className="ceo-command-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="ceo-typography-meta">Project Name</label>
                <input required className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={editProject.name} onChange={e => setEditProject({...editProject, name: e.target.value})} />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Client</label>
                  <input required className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={editProject.client} onChange={e => setEditProject({...editProject, client: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Department</label>
                  <select className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={editProject.department || ''} onChange={e => setEditProject({...editProject, department: e.target.value})}>
                    <option value="">None / Global</option>
                    {departments.map(d => <option key={d.id} value={d.name || d.department}>{d.name || d.department}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Status</label>
                  <select className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={editProject.status} onChange={e => setEditProject({...editProject, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Total Budget (₹)</label>
                  <input required type="text" className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={editProject.budget} onChange={e => setEditProject({...editProject, budget: e.target.value})} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Used Budget (₹)</label>
                  <input required type="text" className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={editProject.used} onChange={e => setEditProject({...editProject, used: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="ceo-typography-meta">Deadline</label>
                <input required type="date" className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={editProject.deadline || ''} onChange={e => setEditProject({...editProject, deadline: e.target.value})} />
              </div>

              <div>
                <label className="ceo-typography-meta">Attachments</label>
                <input type="file" multiple className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} onChange={e => handleFileUpload(e, setEditProject, editProject)} disabled={uploading} />
                {uploading && <span style={{fontSize: '12px', color: 'var(--ceo-primary)'}}>Uploading...</span>}
                {editProject.attachments && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(() => {
                      try {
                        const atts = JSON.parse(editProject.attachments);
                        return atts.map((att, i) => (
                          <div key={i} style={{fontSize: '13px', background: 'var(--ceo-bg)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <a href={att.url} target="_blank" rel="noreferrer" style={{color: 'var(--ceo-primary)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{att.name}</a>
                            <button type="button" onClick={() => removeAttachment(setEditProject, editProject, i)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px'}} title="Remove file">×</button>
                          </div>
                        ));
                      } catch(e) { return null; }
                    })()}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="ceo-btn" onClick={() => setEditProject(null)}>Cancel</button>
                <button type="submit" className="ceo-btn ceo-btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="ceo-command-panel" style={{ width: '500px', maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="ceo-command-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ceo-typography-section-title">Add New Project</div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateProject} className="ceo-command-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="ceo-typography-meta">Project Name</label>
                <input required className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} placeholder="Enter project name" />
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Client</label>
                  <input required className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={newProject.client} onChange={e => setNewProject({...newProject, client: e.target.value})} placeholder="Enter client name" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Department</label>
                  <select className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={newProject.department} onChange={e => setNewProject({...newProject, department: e.target.value})}>
                    <option value="">None / Global</option>
                    {departments.map(d => <option key={d.id} value={d.name || d.department}>{d.name || d.department}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Status</label>
                  <select className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={newProject.status} onChange={e => setNewProject({...newProject, status: e.target.value})}>
                    <option value="Active">Active</option>
                    <option value="At Risk">At Risk</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Total Budget (₹)</label>
                  <input required type="text" className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={newProject.budget} onChange={e => setNewProject({...newProject, budget: e.target.value})} placeholder="Enter total budget" />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="ceo-typography-meta">Used Budget (₹)</label>
                  <input type="text" className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={newProject.used} onChange={e => setNewProject({...newProject, used: e.target.value})} placeholder="Enter used budget" />
                </div>
              </div>
              <div>
                <label className="ceo-typography-meta">Deadline</label>
                <input required type="date" className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} value={newProject.deadline} onChange={e => setNewProject({...newProject, deadline: e.target.value})} placeholder="Enter deadline" />
              </div>

              <div>
                <label className="ceo-typography-meta">Attachments</label>
                <input type="file" multiple className="ceo-form-input" style={{ width: '100%', marginTop: '4px' }} onChange={e => handleFileUpload(e, setNewProject, newProject)} disabled={uploading} />
                {uploading && <span style={{fontSize: '12px', color: 'var(--ceo-primary)'}}>Uploading...</span>}
                {newProject.attachments && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(() => {
                      try {
                        const atts = JSON.parse(newProject.attachments);
                        return atts.map((att, i) => (
                          <div key={i} style={{fontSize: '13px', background: 'var(--ceo-bg)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <a href={att.url} target="_blank" rel="noreferrer" style={{color: 'var(--ceo-primary)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{att.name}</a>
                            <button type="button" onClick={() => removeAttachment(setNewProject, newProject, i)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', padding: '0 4px'}} title="Remove file">×</button>
                          </div>
                        ));
                      } catch(e) { return null; }
                    })()}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="ceo-btn" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="ceo-btn ceo-btn-primary" disabled={creating}>
                  <Plus size={14} style={{ marginRight: '4px' }} />{creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
