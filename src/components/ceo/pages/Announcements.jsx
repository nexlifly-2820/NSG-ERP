import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Send, Users, CheckCircle, 
  BarChart3, Eye, Clock, X, ArrowLeft,
  Bold, Italic, List, Link as LinkIcon, AlertTriangle
} from 'lucide-react';
import '../CEO.css';

const mockAnnouncements = [];

const formatAnnDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (isToday) {
      return `Today, ${timeStr}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }
    
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + `, ${timeStr}`;
  } catch (e) {
    return dateStr;
  }
};

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [audience, setAudience] = useState('All Employees');
  const [scheduleTime, setScheduleTime] = useState('');
  const [readDrawerId, setReadDrawerId] = useState(null);

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
    if (!token) return;
    try {
      const res = await fetch('/api/ceo-portal/announcements', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error("Failed to fetch announcements", err);
      setAnnouncements([]);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePost = async (e) => {
    e.preventDefault();
    if (!title || !body) return;
    setIsSending(true);

    const token = localStorage.getItem('nsg_jwt_token');
    if (!token) {
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch('/api/ceo-portal/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          body,
          priority,
          audience: audience || 'All Employees'
        })
      });

      if (res.ok) {
        await fetchAnnouncements();
        setTitle(''); 
        setBody(''); 
        setPriority('Normal'); 
        setAudience('All Employees'); 
        setScheduleTime('');
      } else {
        alert('Failed to post announcement. Please try again.');
      }
    } catch (err) {
      console.error("Error posting announcement", err);
      alert('Error connecting to backend server.');
    } finally {
      setIsSending(false);
    }
  };

  const activeDrawerAnn = announcements.find(a => a.id === readDrawerId);


  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Announcements</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Broadcast updates to the company and track engagement.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '400px minmax(0, 1fr)',
        gap: '24px',
        flex: 1,
        minHeight: '500px',
        height: 'calc(100vh - 160px)'
      }}>
        
        {/* FEED (LEFT SIDE - FIXED) */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          <div className="ceo-command-header" style={{ padding: '20px', borderBottom: '1px solid var(--ceo-border)', background: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="ceo-typography-card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Megaphone size={18} color="var(--ceo-primary)" /> Broadcast History
            </div>
            {!readDrawerId && (
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-muted)' }}>{announcements.length} Posts</span>
            )}
            {readDrawerId && (
              <button className="ceo-btn ceo-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setReadDrawerId(null)}>
                + New Post
              </button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#F1F5F9' }}>
            {announcements.map(ann => {
              const displayDate = ann.created_at ? formatAnnDate(ann.created_at) : ann.date;
              const displayReadPct = ann.read_pct !== undefined ? ann.read_pct : (ann.readPct || 0);
              
              return (
                <div key={ann.id} style={{ 
                  background: '#FFF',
                  border: '1px solid var(--ceo-border)',
                  borderLeft: ann.priority === 'Urgent' ? '4px solid var(--ceo-danger)' : '4px solid var(--ceo-primary)',
                  borderRadius: '8px',
                  padding: '20px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--ceo-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
                        {ann.author ? ann.author.charAt(0) : 'C'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ceo-text-primary)' }}>{ann.author || 'CEO Office'}</div>
                        <div style={{ fontSize: '11px', color: 'var(--ceo-text-muted)', marginTop: '2px' }}>{displayDate}</div>
                      </div>
                    </div>
                    {ann.priority === 'Urgent' && <span style={{ background: '#FEF2F2', color: 'var(--ceo-danger)', padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, border: '1px solid #FCA5A5' }}>URGENT</span>}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--ceo-text-primary)' }}>{ann.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--ceo-text-secondary)', marginBottom: '16px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ann.body}</div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--ceo-divider)', paddingTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600 }}>
                      <Users size={14}/> {ann.audience}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setReadDrawerId(ann.id); }}
                      style={{ 
                        padding: '6px 12px', fontSize: '12px', background: readDrawerId === ann.id ? 'var(--ceo-primary)' : '#F8FAFC', 
                        color: readDrawerId === ann.id ? '#FFF' : 'var(--ceo-text-primary)',
                        border: '1px solid', borderColor: readDrawerId === ann.id ? 'var(--ceo-primary)' : 'var(--ceo-border)',
                        borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                        fontWeight: 600, transition: 'all 0.2s'
                      }}>
                      <BarChart3 size={14}/> {displayReadPct}% Read
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE (COMPOSER OR ANALYTICS) */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          
          {!readDrawerId ? (
            /* COMPOSER */
            <>
              <div className="ceo-command-header" style={{ padding: '20px 32px', borderBottom: '1px solid var(--ceo-border)' }}>
                <div className="ceo-typography-card-title">Compose Corporate Broadcast</div>
              </div>
              <form onSubmit={handlePost} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1 }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: '8px', display: 'block' }}>Target Audience</label>
                    <select className="ceo-form-input" value={audience} onChange={e=>setAudience(e.target.value)} style={{ height: '44px', background: '#F8FAFC' }}>
                      <option value="All Employees">All Employees (Company-Wide)</option>
                      <option value="IT Department">IT Department</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Operations">Operations</option>
                      <option value="Finance">Finance</option>
                    </select>
                  </div>
                  <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: '8px', display: 'block' }}>Schedule Delivery (Optional)</label>
                    <input type="datetime-local" className="ceo-form-input" value={scheduleTime} onChange={e=>setScheduleTime(e.target.value)} style={{ height: '44px', background: '#F8FAFC' }} />
                  </div>
                </div>

                <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: '8px', display: 'block' }}>Subject Line</label>
                  <input className="ceo-form-input" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Enter a clear, actionable subject..." required style={{ height: '44px', fontSize: '15px', fontWeight: 600 }} />
                </div>

                <div className="ceo-form-group" style={{ marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)', marginBottom: '8px', display: 'block' }}>Message Body</label>
                  <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', overflow: 'hidden', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ background: '#F8FAFC', borderBottom: '1px solid var(--ceo-border)', padding: '8px 12px', display: 'flex', gap: '16px' }}>
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-secondary)' }}><Bold size={16}/></button>
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-secondary)' }}><Italic size={16}/></button>
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-secondary)' }}><List size={16}/></button>
                      <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-secondary)' }}><LinkIcon size={16}/></button>
                    </div>
                    <textarea className="ceo-form-input" value={body} onChange={e=>setBody(e.target.value)} placeholder="Write your corporate communication here. Rich text is supported." required style={{ flex: 1, border: 'none', padding: '16px', resize: 'none', fontSize: '14px', lineHeight: 1.6 }}></textarea>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC', padding: '16px 24px', borderRadius: '8px', border: '1px solid var(--ceo-border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}>
                    <div style={{ width: '40px', height: '24px', borderRadius: '12px', background: priority === 'Urgent' ? 'var(--ceo-danger)' : '#CBD5E1', position: 'relative', transition: 'background 0.3s' }}>
                      <div style={{ width: '18px', height: '18px', borderRadius: '9px', background: '#FFF', position: 'absolute', top: '3px', left: priority === 'Urgent' ? '19px' : '3px', transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}></div>
                    </div>
                    <input type="checkbox" checked={priority === 'Urgent'} onChange={e=>setPriority(e.target.checked ? 'Urgent' : 'Normal')} style={{ display: 'none' }} />
                    <span style={{ color: priority === 'Urgent' ? 'var(--ceo-danger)' : 'var(--ceo-text-primary)' }}>Flag as Urgent Broadcast</span>
                  </label>
                  <button type="submit" className="ceo-btn ceo-btn-primary" disabled={isSending} style={{ padding: '10px 24px', fontSize: '14px' }}>
                    {isSending ? <Clock size={16} className="spin"/> : <Send size={16}/>} {scheduleTime ? 'Schedule Broadcast' : 'Publish Now'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* ANALYTICS DRAWER */
            <>
              <div className="ceo-command-header" style={{ padding: '20px 32px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="ceo-btn" onClick={() => setReadDrawerId(null)} style={{ padding: '8px', border: '1px solid var(--ceo-border)', background: '#F8FAFC' }}><ArrowLeft size={16}/></button>
                <div>
                  <div className="ceo-typography-card-title">Engagement Analytics</div>
                  <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', marginTop: '2px' }}>{activeDrawerAnn?.title}</div>
                </div>
              </div>
              <div className="ceo-command-content" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto' }}>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ padding: '32px', background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)', borderRadius: '12px', border: '1px solid var(--ceo-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--ceo-primary)', lineHeight: 1 }}>
                      {activeDrawerAnn?.read_pct !== undefined ? activeDrawerAnn.read_pct : (activeDrawerAnn?.readPct || 0)}%
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginTop: '12px', letterSpacing: '1px' }}>GLOBAL READ RATE</div>
                  </div>
                  <div style={{ padding: '32px', background: '#FFF', borderRadius: '12px', border: '1px solid var(--ceo-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--ceo-text-primary)', lineHeight: 1 }}>
                      {activeDrawerAnn?.read_count !== undefined ? activeDrawerAnn.read_count : (activeDrawerAnn?.readCount || 0)}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginTop: '12px', letterSpacing: '1px' }}>UNIQUE VIEWS</div>
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>Unread Employees</div>
                      <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', marginTop: '4px' }}>Targeted audience members who have not opened this broadcast.</div>
                    </div>
                    <button className="ceo-btn" style={{ padding: '8px 16px', background: '#FFF', border: '1px solid var(--ceo-border)', color: 'var(--ceo-danger)', fontWeight: 600, display: 'flex', gap: '8px' }}>
                      <AlertTriangle size={16}/> Ping Unread
                    </button>
                  </div>
                  <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', background: '#FFF' }}>
                      <thead style={{ background: '#F8FAFC', borderBottom: '1px solid var(--ceo-border)' }}>
                        <tr>
                          <th style={{ padding: '12px 24px', textAlign: 'left', fontWeight: 600, color: 'var(--ceo-text-secondary)', fontSize: '12px' }}>EMPLOYEE NAME</th>
                          <th style={{ padding: '12px 24px', textAlign: 'right', fontWeight: 600, color: 'var(--ceo-text-secondary)', fontSize: '12px' }}>DEPARTMENT</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--ceo-divider)' }}>
                          <td style={{ padding: '16px 24px', fontWeight: 600 }}>Arjun Sharma</td>
                          <td style={{ padding: '16px 24px', color: 'var(--ceo-text-secondary)', textAlign: 'right' }}>IT Dept</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--ceo-divider)' }}>
                          <td style={{ padding: '16px 24px', fontWeight: 600 }}>Priya Menon</td>
                          <td style={{ padding: '16px 24px', color: 'var(--ceo-text-secondary)', textAlign: 'right' }}>Marketing</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '16px 24px', fontWeight: 600 }}>Rahul Verma</td>
                          <td style={{ padding: '16px 24px', color: 'var(--ceo-text-secondary)', textAlign: 'right' }}>Sales</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
