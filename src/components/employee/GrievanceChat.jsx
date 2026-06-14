import { useState, useEffect, useRef } from 'react';
import { Send, ShieldAlert, User } from 'lucide-react';

export default function GrievanceChat({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [channelId, setChannelId] = useState(null);
  const messagesEndRef = useRef(null);

  const token = localStorage.getItem('nsg_jwt_token');

  // Auto-scroll messages to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadChannelAndMessages = async () => {
    if (!token || !currentUser) return;
    try {
      // Fetch user channels
      const res = await fetch('/api/employee-portal/chat/my-channels', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const channels = await res.json();
        let grievanceCh = channels.find(c => c.type === 'grievance');
        
        if (!grievanceCh) {
          // Auto create channel if it doesn't exist
          const newChId = `grievance_${currentUser.id}`;
          const createRes = await fetch('/api/employee-portal/chat/channels', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({
                id: newChId,
                name: 'HR Grievance',
                label: 'Private',
                type: 'grievance',
                members: [String(currentUser.id)] // HR is assigned dynamically by backend
             })
          });
          if (createRes.ok) {
            grievanceCh = await createRes.json();
          }
        }

        if (grievanceCh) {
          setChannelId(grievanceCh.id);
          // Fetch messages
          const msgRes = await fetch(`/api/employee-portal/chat/channels/${grievanceCh.id}/messages`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          if (msgRes.ok) {
            const data = await msgRes.json();
            setMessages(data.map(m => ({
               id: m.id,
               sender: m.sender,
               text: m.text,
               time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
               isMe: m.sender === currentUser?.name
            })));
          }
        }
      }
    } catch(e) {}
  };

  useEffect(() => {
    loadChannelAndMessages();
  }, [currentUser, token]);

  // SLA date: 48 hours from now
  const getSlaDateString = () => {
    const d = new Date();
    d.setHours(d.getHours() + 48);
    // Format e.g., Jun 2, 13:30
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const month = months[d.getMonth()];
    const date = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${month} ${date}, ${hours}:${minutes}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !channelId || !token) return;

    const originalText = inputText.trim();
    setInputText('');
    
    // Optimistic UI update
    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = {
      id: Date.now(),
      sender: currentUser?.name || 'Me',
      text: originalText,
      time: userTime,
      isMe: true
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      await fetch(`/api/employee-portal/chat/channels/${channelId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
           text: originalText
        })
      });
      // Optionally reload messages:
      // loadChannelAndMessages();
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <div 
      style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        height: '420px',
        overflow: 'hidden'
      }}
    >
      {/* Header: assigned HR officer + SLA countdown badge + online indicator */}
      <div 
        style={{
          borderBottom: '1px solid var(--border-color)',
          padding: '14px 20px',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          {/* HR Officer Name & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative' }}>
              <div 
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--bg-tertiary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--text-secondary)'
                }}
              >
                <User size={16} />
              </div>
              <div 
                style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  right: 0, 
                  width: '9px', 
                  height: '9px', 
                  borderRadius: '50%', 
                  backgroundColor: 'var(--accent-green)',
                  border: '2px solid var(--bg-primary)' 
                }} 
              />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                HR Representative
              </h4>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '600' }}>
                Assigned HR Officer
              </span>
            </div>
          </div>

          {/* Secure Badge HSL(--grievance-private-badge) */}
          <div 
            style={{ 
              fontSize: '9px', 
              fontWeight: '700', 
              textTransform: 'uppercase', 
              letterSpacing: '0.5px',
              backgroundColor: 'rgba(139, 92, 246, 0.08)',
              color: 'hsl(265, 70%, 60%)', // --grievance-private-badge HSL
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(139, 92, 246, 0.15)'
            }}
          >
            Secured Channel
          </div>
        </div>

        {/* SLA Countdown Warning state in header: Resolve by [date] */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            padding: '6px 10px',
            borderRadius: '6px',
            color: '#d97706' // amber text
          }}
        >
          <ShieldAlert size={12} style={{ flexShrink: 0 }} />
          <span 
            style={{ 
              fontSize: '12px', // Typography Token: SLA countdown in chat: 12px / 700
              fontWeight: '700' 
            }}
          >
            Resolve by {getSlaDateString()}
          </span>
        </div>
      </div>

      {/* Message logs area */}
      <div 
        className="chat-history-scroll"
        style={{
          flex: 1,
          padding: '16px 20px',
          overflowY: 'scroll',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          backgroundColor: 'var(--bg-secondary)'
        }}
      >
        {messages.map((msg) => (
          <div 
            key={msg.id}
            style={{
              alignSelf: msg.isMe ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.isMe ? 'flex-end' : 'flex-start',
              gap: '3px'
            }}
          >
            <span style={{ fontSize: '9px', fontWeight: '700', color: 'var(--text-muted)' }}>
              {msg.sender}
            </span>
            <div 
              style={{
                backgroundColor: msg.isMe ? 'var(--text-primary)' : 'var(--bg-tertiary)',
                color: msg.isMe ? 'var(--bg-secondary)' : 'var(--text-primary)',
                padding: '10px 14px',
                borderRadius: msg.isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                fontSize: '12px',
                lineHeight: '1.5'
              }}
            >
              {msg.text}
            </div>
            <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
              {msg.time}
            </span>
          </div>
        ))}

        {isTyping && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px', padding: '6px' }}>
            <div style={{ width: '4px', height: '4px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate' }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate 0.2s' }} />
            <div style={{ width: '4px', height: '4px', backgroundColor: 'var(--text-muted)', borderRadius: '50%', animation: 'bounce 0.6s infinite alternate 0.4s' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: '4px' }}>
              HR is typing...
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls form */}
      <form 
        onSubmit={handleSendMessage}
        style={{
          borderTop: '1px solid var(--border-color)',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <input 
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe your query or request privately..."
          required
          style={{
            flex: 1,
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            fontSize: '12px',
            outline: 'none'
          }}
        />
        <button 
          type="submit"
          style={{
            backgroundColor: 'var(--text-primary)',
            color: 'var(--bg-secondary)',
            border: 'none',
            borderRadius: '6px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease'
          }}
        >
          <Send size={14} />
        </button>
      </form>

      {/* CSS bounce animation for typing indicator */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce {
          from { transform: translateY(0); }
          to { transform: translateY(-4px); }
        }

        .chat-history-scroll::-webkit-scrollbar {
          width: 12px;
        }
        .chat-history-scroll::-webkit-scrollbar-track {
          background: var(--bg-tertiary);
          border-left: 1px solid var(--border-color);
        }
        .chat-history-scroll::-webkit-scrollbar-thumb {
          background: var(--text-muted);
          border-radius: 6px;
          border: 3px solid var(--bg-tertiary);
        }
        .chat-history-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary);
        }
      ` }} />
    </div>
  );
}
