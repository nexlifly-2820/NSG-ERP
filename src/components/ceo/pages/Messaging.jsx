import React, { useState } from 'react';
import { 
  MessageSquare, Search, Phone, Video, MoreVertical, 
  Send, Paperclip, Smile, Image as ImageIcon
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const mockThreads = [
  { id: 1, name: 'Executive Team', lastMsg: 'The Q3 board slides are ready for review.', time: '10:45 AM', unread: 2, group: true },
  { id: 2, name: 'Priya Patel (HR)', lastMsg: 'I have scheduled the final round interview for the VP of Sales role.', time: '09:30 AM', unread: 0, group: false },
  { id: 3, name: 'David Lee (Marketing)', lastMsg: 'Campaign metrics are looking good.', time: 'Yesterday', unread: 0, group: false },
  { id: 4, name: 'Finance Committee', lastMsg: 'Please approve the updated budget.', time: 'Yesterday', unread: 0, group: true },
  { id: 5, name: 'Sarah Connor (IT)', lastMsg: 'Server migration completed successfully.', time: 'May 28', unread: 0, group: false }
];

const mockMessages = [
  { id: 101, sender: 'Priya Patel', text: 'Hi Vivek, just a quick update on the hiring pipeline.', time: '10:30 AM', isMe: false },
  { id: 102, sender: 'Priya Patel', text: 'The VP of Sales candidates have been shortlisted to the final 2.', time: '10:31 AM', isMe: false },
  { id: 103, sender: 'Vivek', text: 'Excellent. When are the final rounds?', time: '10:35 AM', isMe: true },
  { id: 104, sender: 'Priya Patel', text: 'I have scheduled the final round interview for the VP of Sales role for Thursday morning.', time: '10:45 AM', isMe: false }
];

export default function Messaging() {
  const [activeThreadId, setActiveThreadId] = useState(2);
  const [msgInput, setMsgInput] = useState('');
  
  const activeThread = mockThreads.find(t => t.id === activeThreadId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', paddingBottom: '32px' }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: '24px' }}>
        <h1 className="ceo-typography-page-title">Executive Communications</h1>
        <p className="ceo-typography-body" style={{ marginTop: '4px' }}>Secure, encrypted internal messaging channels.</p>
      </div>

      {/* CSS GRID LAYOUT */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '320px 1fr',
        gap: '24px',
        flex: 1
      }}>
        
        {/* LEFT: THREADS */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ceo-command-header" style={{ padding: '16px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
              <input type="text" className="ceo-form-input" placeholder="Search messages..." style={{ paddingLeft: '36px', height: '36px', padding: '8px' }} />
            </div>
          </div>
          
          <div style={{ overflowY: 'auto', flex: 1, padding: '8px' }}>
            {mockThreads.map(thread => (
              <div 
                key={thread.id} 
                onClick={() => setActiveThreadId(thread.id)}
                style={{ 
                  display: 'flex', gap: '12px', padding: '12px', 
                  borderRadius: '8px', cursor: 'pointer',
                  background: activeThreadId === thread.id ? 'var(--ceo-hover)' : 'transparent',
                  borderLeft: activeThreadId === thread.id ? '3px solid var(--ceo-primary)' : '3px solid transparent'
                }}
              >
                <div style={{ position: 'relative' }}>
                  <img src={`https://ui-avatars.com/api/?name=${thread.name}&background=${thread.group ? '2563EB' : '10B981'}&color=fff`} alt={thread.name} style={{ width: '48px', height: '48px', borderRadius: '24px' }} />
                  {thread.unread > 0 && (
                    <div style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--ceo-danger)', color: '#fff', fontSize: '10px', fontWeight: 700, width: '18px', height: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--ceo-card-bg)' }}>
                      {thread.unread}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{thread.name}</div>
                    <div className="ceo-typography-meta" style={{ fontSize: '11px' }}>{thread.time}</div>
                  </div>
                  <div className="ceo-typography-meta" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: thread.unread > 0 ? 'var(--ceo-text-primary)' : 'var(--ceo-text-muted)', fontWeight: thread.unread > 0 ? 600 : 400 }}>
                    {thread.lastMsg}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: CHAT AREA */}
        <div className="ceo-command-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          {activeThread ? (
            <>
              {/* CHAT HEADER */}
              <div className="ceo-command-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <img src={`https://ui-avatars.com/api/?name=${activeThread.name}&background=${activeThread.group ? '2563EB' : '10B981'}&color=fff`} alt={activeThread.name} style={{ width: '40px', height: '40px', borderRadius: '20px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '16px' }}>{activeThread.name}</div>
                    <div className="ceo-typography-meta">{activeThread.group ? '3 Members' : 'Online'}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="ceo-btn" style={{ padding: '8px' }}><Phone size={18} color="var(--ceo-text-secondary)" /></button>
                  <button className="ceo-btn" style={{ padding: '8px' }}><Video size={18} color="var(--ceo-text-secondary)" /></button>
                  <button className="ceo-btn" style={{ padding: '8px' }}><MoreVertical size={18} color="var(--ceo-text-secondary)" /></button>
                </div>
              </div>

              {/* MESSAGES AREA */}
              <div className="ceo-command-content" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px', background: 'var(--ceo-bg)' }}>
                {mockMessages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexDirection: msg.isMe ? 'row-reverse' : 'row' }}>
                      {!msg.isMe && <img src={`https://ui-avatars.com/api/?name=${msg.sender}&background=10B981&color=fff`} alt={msg.sender} style={{ width: '28px', height: '28px', borderRadius: '14px' }} />}
                      <div style={{ 
                        background: msg.isMe ? 'var(--ceo-primary)' : 'var(--ceo-card-bg)', 
                        color: msg.isMe ? '#fff' : 'var(--ceo-text-primary)',
                        padding: '12px 16px', 
                        borderRadius: msg.isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                        border: msg.isMe ? 'none' : '1px solid var(--ceo-border)',
                        maxWidth: '500px',
                        boxShadow: 'var(--ceo-shadow)',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        {msg.text}
                      </div>
                    </div>
                    <div className="ceo-typography-meta" style={{ marginTop: '4px', [msg.isMe ? 'marginRight' : 'marginLeft']: '40px', fontSize: '11px' }}>
                      {msg.time}
                    </div>
                  </div>
                ))}
              </div>

              {/* INPUT AREA */}
              <div style={{ padding: '16px 24px', borderTop: '1px solid var(--ceo-border)', background: 'var(--ceo-card-bg)', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button className="ceo-btn" style={{ padding: '8px', border: 'none', background: 'transparent' }}><Paperclip size={20} color="var(--ceo-text-secondary)" /></button>
                <button className="ceo-btn" style={{ padding: '8px', border: 'none', background: 'transparent' }}><ImageIcon size={20} color="var(--ceo-text-secondary)" /></button>
                
                <input 
                  type="text" 
                  className="ceo-form-input" 
                  placeholder="Type a message..." 
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  style={{ flex: 1, borderRadius: '24px', padding: '12px 20px', background: 'var(--ceo-bg)' }} 
                />
                
                <button className="ceo-btn" style={{ padding: '8px', border: 'none', background: 'transparent' }}><Smile size={20} color="var(--ceo-text-secondary)" /></button>
                <button className="ceo-btn ceo-btn-primary" style={{ padding: '10px', borderRadius: '20px' }}>
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--ceo-text-muted)' }}>
              Select a conversation to start messaging
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
