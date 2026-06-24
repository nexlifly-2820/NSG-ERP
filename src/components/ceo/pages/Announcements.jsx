import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Send, Users, CheckCircle, 
  BarChart3, Clock, ArrowLeft, AlertTriangle, Trash2, AlertCircle
} from 'lucide-react';
import '../CEO.css';

const formatAnnDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (isToday) return `Today, ${timeStr}`;
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${timeStr}`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + `, ${timeStr}`;
  } catch { return dateStr; }
};

export default function Announcements() {
  const token = localStorage.getItem('nsg_jwt_token');

  // State
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('');
  const [audience, setAudience] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedAnnId, setSelectedAnnId] = useState(null);
  const [unreadUsers, setUnreadUsers] = useState([]);
  const [errors, setErrors] = useState({});

  // Fetch all announcements
  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/ceo-portal/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setAnnouncements(await res.json());
      }
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  // Publish new announcement
  const handlePublish = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    const newErrors = {};

    if (!audience) newErrors.audience = 'Please select Target Audience.';
    if (!priority) newErrors.priority = 'Please select Priority.';
    if (!title.trim()) newErrors.title = 'Please enter a Subject Line.';
    if (!body.trim()) newErrors.body = 'Please enter a Message Body.';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/ceo-portal/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          priority,
          audience
        })
      });

      if (res.ok) {
        setTitle('');
        setBody('');
        setPriority('');
        setAudience('');
        setErrors({});
        setSuccessMsg('Announcement published successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        await fetchAnnouncements();
      } else {
        const errData = await res.text();
        setErrorMsg(`Failed to publish (${res.status}): ${errData}`);
      }
    } catch (err) {
      setErrorMsg(`Network error: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Delete announcement
  const handleDelete = async (id) => {
    if (!id) {
      window.toast.error("Error: Announcement ID is missing.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      const res = await fetch(`/api/ceo-portal/announcements/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSelectedAnnId(null);
        await fetchAnnouncements();
      } else {
        const errText = await res.text();
        window.toast.error(`Failed to delete announcement. Status: ${res.status}. Error: ${errText}`);
      }
    } catch (err) {
      window.toast.error('Error deleting: ' + err.message);
    }
  };

  // No longer using Engagement Analytics per user request


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Announcements</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Broadcast updates to the company and track engagement.</p>
      </div>

      {/* Success Banner */}
      {successMsg && (
        <div style={{ marginBottom: '16px', padding: '12px 20px', background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: '8px', color: '#065F46', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Error Banner */}
      {errorMsg && (
        <div style={{ marginBottom: '16px', padding: '12px 20px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#991B1B', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} /> {errorMsg}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: '400px minmax(0, 1fr)',
        gap: '24px',
        flex: 1,
        minHeight: '500px',
        height: 'calc(100vh - 200px)'
      }}>
        
        {/* LEFT: Broadcast History */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="ceo-command-header" style={{ padding: '20px', borderBottom: '1px solid var(--ceo-border)', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="ceo-typography-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} color="var(--ceo-primary)" /> Broadcast History
            </div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-muted)' }}>{announcements.length} Posts</span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#F1F5F9' }}>
            {announcements.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ceo-text-muted)', fontSize: '14px' }}>
                No announcements yet. Create your first broadcast!
              </div>
            )}
            {announcements.map(ann => (
              <div 
                key={ann.id} 
                style={{ 
                  background: '#FFF',
                  border: '1px solid',
                  borderColor: 'var(--ceo-border)',
                  borderLeft: ann.priority === 'Urgent' ? '4px solid var(--ceo-danger)' : '4px solid var(--ceo-primary)',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--ceo-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                      C
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ceo-text-primary)' }}>{ann.author || 'CEO Office'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--ceo-text-muted)', marginTop: '2px' }}>{formatAnnDate(ann.created_at)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {ann.priority === 'Urgent' && (
                      <span style={{ background: '#FEF2F2', color: 'var(--ceo-danger)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, border: '1px solid #FCA5A5' }}>URGENT</span>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(ann.id); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ceo-danger)', padding: '4px', display: 'flex', alignItems: 'center' }}
                      title="Delete Announcement"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--ceo-text-primary)' }}>{ann.title}</div>
                <div style={{ fontSize: '13px', color: 'var(--ceo-text-secondary)', marginBottom: '16px', lineHeight: 1.5, maxHeight: '3em', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ann.body}</div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--ceo-divider)', paddingTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600 }}>
                    <Users size={14}/> {ann.audience}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <BarChart3 size={14}/> {ann.read_pct || 0}% Read
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Composer */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* ── COMPOSER ── */}
              <div className="ceo-command-header" style={{ padding: '20px 32px', borderBottom: '1px solid var(--ceo-border)' }}>
                <div className="ceo-typography-card-title">Compose Corporate Broadcast</div>
              </div>
              <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1 }}>
                
                {/* Row 1: Audience + Priority */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: errors.audience ? '4px' : '8px', display: 'block' }}>Target Audience</label>
                    {errors.audience && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {errors.audience}</div>}
                    <select 
                      className={`ceo-form-input ${errors.audience ? 'error' : ''}`} 
                      value={audience} 
                      onChange={e => { setAudience(e.target.value); if (e.target.value) setErrors(prev => ({...prev, audience: ''})); }} 
                      onFocus={e => { if (!e.target.value) setErrors(prev => ({...prev, audience: 'Please select Target Audience.'})); }}
                      onBlur={e => { if (!e.target.value) setErrors(prev => ({...prev, audience: 'Please select Target Audience.'})); }}
                      onClick={e => { if (!e.target.value) setErrors(prev => ({...prev, audience: 'Please select Target Audience.'})); else setErrors(prev => ({...prev, audience: ''})); }}
                      style={{ height: '44px', background: '#F8FAFC', width: '100%' }}
                    >
                      <option value="" disabled hidden>Select Target Audience</option>
                      <option value="All Portals">All Portals</option>
                      <option value="HR Portal">HR Portal</option>
                      <option value="TL Portal">TL Portal</option>
                      <option value="Employee Portal">Employee Portal</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: errors.priority ? '4px' : '8px', display: 'block' }}>Priority</label>
                    {errors.priority && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {errors.priority}</div>}
                    <select 
                      className={`ceo-form-input ${errors.priority ? 'error' : ''}`} 
                      value={priority} 
                      onChange={e => { setPriority(e.target.value); if (e.target.value) setErrors(prev => ({...prev, priority: ''})); }} 
                      onFocus={e => { if (!e.target.value) setErrors(prev => ({...prev, priority: 'Please select Priority.'})); }}
                      onBlur={e => { if (!e.target.value) setErrors(prev => ({...prev, priority: 'Please select Priority.'})); }}
                      onClick={e => { if (!e.target.value) setErrors(prev => ({...prev, priority: 'Please select Priority.'})); else setErrors(prev => ({...prev, priority: ''})); }}
                      style={{ height: '44px', background: '#F8FAFC', width: '100%' }}
                    >
                      <option value="" disabled hidden>Select Priority</option>
                      <option value="Normal">Normal</option>
                      <option value="Urgent">🔴 Urgent</option>
                    </select>
                  </div>
                </div>

                {/* Row 2: Subject */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: errors.title ? '4px' : '8px', display: 'block' }}>Subject Line *</label>
                  {errors.title && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {errors.title}</div>}
                  <input 
                    className={`ceo-form-input ${errors.title ? 'error' : ''}`} 
                    value={title} 
                    onChange={e => { setTitle(e.target.value); if (e.target.value.trim()) setErrors(prev => ({...prev, title: ''})); }} 
                    onFocus={e => { if (!e.target.value.trim()) setErrors(prev => ({...prev, title: 'Please enter a Subject Line.'})); }}
                    onBlur={e => { if (!e.target.value.trim()) setErrors(prev => ({...prev, title: 'Please enter a Subject Line.'})); }}
                    onClick={e => { if (!e.target.value.trim()) setErrors(prev => ({...prev, title: 'Please enter a Subject Line.'})); else setErrors(prev => ({...prev, title: ''})); }}
                    placeholder="Enter a clear, actionable subject..." 
                    style={{ height: '44px', fontSize: '15px', fontWeight: 600 }} 
                  />
                </div>

                {/* Row 3: Message Body */}
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: errors.body ? '4px' : '8px', display: 'block' }}>Message Body *</label>
                  {errors.body && <div style={{ color: 'var(--ceo-danger)', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><AlertCircle size={14} /> {errors.body}</div>}
                  <textarea 
                    className={`ceo-form-input ${errors.body ? 'error' : ''}`} 
                    value={body} 
                    onChange={e => { setBody(e.target.value); if (e.target.value.trim()) setErrors(prev => ({...prev, body: ''})); }} 
                    onFocus={e => { if (!e.target.value.trim()) setErrors(prev => ({...prev, body: 'Please enter a Message Body.'})); }}
                    onBlur={e => { if (!e.target.value.trim()) setErrors(prev => ({...prev, body: 'Please enter a Message Body.'})); }}
                    onClick={e => { if (!e.target.value.trim()) setErrors(prev => ({...prev, body: 'Please enter a Message Body.'})); else setErrors(prev => ({...prev, body: ''})); }}
                    placeholder="Type your announcement message here..."
                    rows={8}
                    style={{ resize: 'vertical', fontSize: '14px', lineHeight: '1.6', minHeight: '180px', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Row 4: Publish Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
                  <button 
                    type="button"
                    onClick={handlePublish}
                    disabled={isSending}
                    className="ceo-btn ceo-btn-primary"
                    style={{ 
                      padding: '12px 32px', 
                      fontSize: '15px', 
                      fontWeight: 700,
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      cursor: isSending ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isSending ? (
                      <><Clock size={16} className="spin"/> Publishing...</>
                    ) : (
                      <><Send size={16}/> Publish Now</>
                    )}
                  </button>
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}
