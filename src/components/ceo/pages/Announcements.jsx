import React, { useState } from 'react';
import { 
  Megaphone, Send, Users, Calendar, AlertCircle, Eye,
  Bold, Italic, List, Link2, CheckCircle, Clock
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const mockAnnouncements = [
  { id: 1, title: 'Important Policy Update — April 2025', body: 'Please review the attached changes to the WFH policy, effective next month.', priority: 'Urgent', audience: 'All Employees', date: 'Just now', readPct: 45 },
  { id: 2, title: 'Q1 Townhall Recording Available', body: 'Thank you to everyone who joined our all-hands. The recording is now available on the intranet.', priority: 'Normal', audience: 'All Employees', date: 'Yesterday', readPct: 92 },
  { id: 3, title: 'New CRM Rollout for Sales Team', body: 'The new Salesforce integration is live. Please ensure you complete the training modules by Friday.', priority: 'Normal', audience: 'Sales & Marketing', date: 'May 28', readPct: 88 },
];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState(mockAnnouncements);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [readDrawerId, setReadDrawerId] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audience, setAudience] = useState('All Employees');
  const [priority, setPriority] = useState('Normal');

  const handlePost = (e) => {
    e.preventDefault();
    if (!title || !body) return;

    setIsSending(true);
    setTimeout(() => {
      const newAnn = {
        id: Date.now(),
        title,
        body,
        audience,
        priority,
        date: 'Just now',
        readPct: 0
      };
      setAnnouncements([newAnn, ...announcements]);
      setIsSending(false);
      setIsSent(true);
      
      setTimeout(() => {
        setIsSent(false);
        setTitle('');
        setBody('');
        setPriority('Normal');
        setAudience('All Employees');
      }, 2000);
    }, 1000);
  };

  const activeDrawerAnn = announcements.find(a => a.id === readDrawerId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px', position: 'relative', overflow: 'hidden' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Corporate Communications</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Broadcast announcements, track read receipts, and manage company-wide alerts.</p>
      </div>

      {/* CSS GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: readDrawerId ? '400px 1fr 350px' : '400px 1fr',
        gap: '24px',
        flex: 1,
        transition: 'grid-template-columns 0.3s ease'
      }}>
        
        {/* COMPOSE PANEL */}
        <div className="ceo-command-panel" style={{ height: 'fit-content' }}>
          <div className="ceo-command-header">
            <div className="ceo-typography-card-title"><Megaphone size={18} color="var(--ceo-primary)" /> Compose Announcement</div>
          </div>
          <div className="ceo-command-content">
            {isSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', color: 'var(--ceo-success)' }}>
                <CheckCircle size={48} style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '18px', fontWeight: 600 }}>Announcement Posted</div>
              </div>
            ) : (
              <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                  <label>Title</label>
                  <input className="ceo-form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter title..." required disabled={isSending} />
                </div>

                <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                  <label>Audience</label>
                  <select className="ceo-form-input" value={audience} onChange={e => setAudience(e.target.value)} disabled={isSending}>
                    <option>All Employees</option>
                    <option>Engineering Team</option>
                    <option>Sales & Marketing</option>
                    <option>Executive Team</option>
                  </select>
                </div>

                <div className="ceo-form-group" style={{ marginBottom: 0 }}>
                  <label>Message Body</label>
                  <div style={{ border: '1px solid var(--ceo-border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid var(--ceo-border)', background: 'var(--ceo-bg)', display: 'flex', gap: '8px' }}>
                      <button type="button" className="ceo-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }}><Bold size={14}/></button>
                      <button type="button" className="ceo-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }}><Italic size={14}/></button>
                      <button type="button" className="ceo-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }}><List size={14}/></button>
                      <button type="button" className="ceo-btn" style={{ padding: '4px', border: 'none', background: 'transparent' }}><Link2 size={14}/></button>
                    </div>
                    <textarea 
                      className="ceo-form-input" 
                      style={{ border: 'none', borderRadius: 0, resize: 'vertical' }} 
                      rows={6} 
                      value={body} 
                      onChange={e => setBody(e.target.value)} 
                      placeholder="Write your announcement..." 
                      required 
                      disabled={isSending}
                    ></textarea>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ceo-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--ceo-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} color={priority === 'Urgent' ? 'var(--ceo-danger)' : 'var(--ceo-text-muted)'} />
                    <span className="ceo-typography-meta" style={{ fontWeight: 600 }}>Urgent Priority</span>
                  </div>
                  <label className="switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={priority === 'Urgent'} onChange={e => setPriority(e.target.checked ? 'Urgent' : 'Normal')} disabled={isSending} style={{ width: '18px', height: '18px', accentColor: 'var(--ceo-danger)' }} />
                  </label>
                </div>

                <div style={{ borderTop: '1px solid var(--ceo-border)', paddingTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" className="ceo-btn" disabled={isSending}>
                    <Calendar size={16} /> Schedule
                  </button>
                  <button type="submit" className="ceo-btn ceo-btn-primary" disabled={isSending}>
                    {isSending ? <Clock size={16} className="spin" /> : <Send size={16} />} 
                    {isSending ? 'Posting...' : 'Post Now'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* FEED PANEL */}
        <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
          {announcements.map(ann => (
            <div key={ann.id} className="ceo-command-panel" style={{ 
              padding: '24px',
              borderLeft: ann.priority === 'Urgent' ? '4px solid var(--ceo-danger)' : '1px solid var(--ceo-border)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {ann.priority === 'Urgent' && <span className="ceo-badge critical">URGENT</span>}
                  <span className="ceo-badge neutral"><Users size={12}/> {ann.audience}</span>
                </div>
                <span className="ceo-typography-meta">{ann.date}</span>
              </div>
              
              <div className="ceo-typography-section-title" style={{ marginBottom: '8px' }}>{ann.title}</div>
              <div className="ceo-typography-body" style={{ marginBottom: '24px' }}>{ann.body}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--ceo-bg)', borderRadius: '8px', border: '1px solid var(--ceo-border)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="ceo-typography-meta">Read Receipt Tracking</span>
                    <span className="ceo-typography-meta" style={{ fontWeight: 700, color: 'var(--ceo-primary)' }}>{ann.readPct}%</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--ceo-divider)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ann.readPct}%`, background: 'var(--ceo-primary)' }}></div>
                  </div>
                </div>
                <button 
                  className="ceo-btn" 
                  style={{ marginLeft: '24px' }}
                  onClick={() => setReadDrawerId(ann.id)}
                >
                  <Eye size={16}/> Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* READ RECEIPT DRAWER */}
        {readDrawerId && activeDrawerAnn && (
          <div className="ceo-command-panel" style={{ height: '100%', borderLeft: '1px solid var(--ceo-border)', boxShadow: '-4px 0 15px rgba(0,0,0,0.05)' }}>
            <div className="ceo-command-header" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                <div className="ceo-typography-card-title">Receipt Status</div>
                <button className="ceo-btn" onClick={() => setReadDrawerId(null)} style={{ padding: '4px', border: 'none', background: 'transparent' }}>✕</button>
              </div>
            </div>
            <div className="ceo-command-content" style={{ padding: '24px', overflowY: 'auto' }}>
              
              <div style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--ceo-primary)', textAlign: 'center' }}>{activeDrawerAnn.readPct}%</div>
                <div className="ceo-typography-meta" style={{ textAlign: 'center', marginTop: '4px' }}>Overall Read Rate</div>
              </div>

              <div className="ceo-typography-section-title" style={{ fontSize: '14px', marginBottom: '16px' }}>Not Read Yet (Action Required)</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--ceo-bg)', borderRadius: '8px', border: '1px solid var(--ceo-border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>Employee {i}</div>
                      <div className="ceo-typography-meta">Engineering Dept</div>
                    </div>
                    <button className="ceo-btn" style={{ padding: '4px 8px', fontSize: '12px' }}>Ping</button>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
