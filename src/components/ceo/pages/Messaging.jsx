import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Search, Plus, Filter, MoreVertical, 
  Paperclip, Send, Phone, Video, Info, CheckCircle, 
  Clock, ChevronRight, User, Star
} from 'lucide-react';
import '../CEO.css';

// ==========================================
// MOCK DATA
// ==========================================
const conversations = [
  { id: 1, name: "Executive Board", type: "group", lastMsg: "Please review the Q3 projections before the 2PM call.", time: "10:42 AM", unread: 3, active: true },
  { id: 2, name: "Sarah Connor", type: "direct", role: "VP Engineering", lastMsg: "The cloud migration is complete. Zero downtime.", time: "09:15 AM", unread: 0 },
  { id: 3, name: "Crisis Management", type: "group", lastMsg: "PR statement has been finalized and sent to legal.", time: "Yesterday", unread: 0 },
  { id: 4, name: "John Doe", type: "direct", role: "CFO", lastMsg: "I've attached the revised budget sheets for approval.", time: "Yesterday", unread: 1 },
  { id: 5, name: "Harvey Specter", type: "direct", role: "Chief Legal Officer", lastMsg: "Contract terms look solid. Proceed to signing.", time: "28 May", unread: 0 },
];

const currentChat = [
  { sender: "Sarah Connor", role: "VP Eng", time: "09:05 AM", msg: "Vivek, the final cluster migration is starting now.", isMe: false },
  { sender: "Vivek C.", role: "CEO", time: "09:10 AM", msg: "Understood. Keep me posted on any latency spikes.", isMe: true },
  { sender: "Sarah Connor", role: "VP Eng", time: "09:15 AM", msg: "The cloud migration is complete. Zero downtime. Performance metrics look completely stable across all regions.", isMe: false },
];

// ==========================================
// ANIMATION VARIANTS
// ==========================================
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Messaging() {
  return (
    <div style={{ padding: '0 32px 32px 32px', maxWidth: '1800px', margin: '0 auto', color: 'var(--ceo-text-primary)' }}>
      
      {/* SECTION 1: Executive Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px', borderBottom: '1px solid var(--ceo-border)', paddingBottom: '24px' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="ceo-badge neutral">Communications</span>
            <ChevronRight size={14} color="var(--ceo-text-muted)" />
            <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>Internal Network</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>Executive Comms Hub</h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="ceo-btn"><Phone size={16} /> Conference Bridge</button>
          <button className="ceo-btn ceo-btn-primary"><Plus size={16} /> New Secure Channel</button>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
        
        <div className="ceo-command-panel" style={{ height: '100%', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
          
          {/* SIDEBAR - Inbox */}
          <div style={{ width: '350px', borderRight: '1px solid var(--ceo-border)', display: 'flex', flexDirection: 'column', background: 'var(--ceo-bg)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--ceo-border)', background: '#FFFFFF' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input type="text" placeholder="Search secure channels..." className="ceo-form-input" style={{ paddingLeft: '32px', background: 'var(--ceo-bg)' }} />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {conversations.map((chat) => (
                <div 
                  key={chat.id} 
                  style={{ 
                    padding: '16px 20px', 
                    borderBottom: '1px solid var(--ceo-border)', 
                    cursor: 'pointer',
                    background: chat.active ? '#FFFFFF' : 'transparent',
                    borderLeft: chat.active ? '4px solid var(--ceo-primary)' : '4px solid transparent',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ceo-text-primary)' }}>{chat.name}</div>
                    <div style={{ fontSize: '11px', color: chat.unread > 0 ? 'var(--ceo-primary)' : 'var(--ceo-text-muted)', fontWeight: chat.unread > 0 ? 600 : 400 }}>{chat.time}</div>
                  </div>
                  {chat.role && <div style={{ fontSize: '11px', color: 'var(--ceo-text-secondary)', marginBottom: '6px' }}>{chat.role}</div>}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '13px', color: chat.unread > 0 ? 'var(--ceo-text-primary)' : 'var(--ceo-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '250px', fontWeight: chat.unread > 0 ? 600 : 400 }}>
                      {chat.lastMsg}
                    </div>
                    {chat.unread > 0 && (
                      <div style={{ background: 'var(--ceo-primary)', color: 'white', fontSize: '10px', fontWeight: 'bold', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {chat.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MAIN CHAT AREA */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
            
            {/* Chat Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--ceo-bg)', border: '1px solid var(--ceo-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                  SC
                </div>
                <div>
                  <h2 style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 4px 0' }}>Sarah Connor</h2>
                  <div style={{ fontSize: '12px', color: 'var(--ceo-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--ceo-success)' }}></div>
                    VP Engineering • Active Now
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="ceo-btn" style={{ padding: '8px' }}><Phone size={16} /></button>
                <button className="ceo-btn" style={{ padding: '8px' }}><Video size={16} /></button>
                <button className="ceo-btn" style={{ padding: '8px' }}><Info size={16} /></button>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <span className="ceo-badge neutral" style={{ fontSize: '10px' }}>Today</span>
              </div>
              
              {currentChat.map((msg, i) => (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ceo-text-secondary)' }}>{msg.sender}</span>
                    <span style={{ fontSize: '10px', color: 'var(--ceo-text-muted)' }}>{msg.time}</span>
                  </div>
                  <div style={{ 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    background: msg.isMe ? 'var(--ceo-primary)' : 'var(--ceo-bg)',
                    color: msg.isMe ? '#FFFFFF' : 'var(--ceo-text-primary)',
                    border: msg.isMe ? 'none' : '1px solid var(--ceo-border)',
                    maxWidth: '70%',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    borderTopRightRadius: msg.isMe ? 0 : '8px',
                    borderTopLeftRadius: msg.isMe ? '8px' : 0
                  }}>
                    {msg.msg}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--ceo-border)', background: 'var(--ceo-bg)' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--ceo-text-muted)', cursor: 'pointer', padding: '8px' }}><Paperclip size={20} /></button>
                <input 
                  type="text" 
                  placeholder="Type a secure message..." 
                  className="ceo-form-input" 
                  style={{ flex: 1, padding: '12px 16px', background: '#FFFFFF' }} 
                />
                <button className="ceo-btn ceo-btn-primary" style={{ padding: '12px 24px' }}>
                  <Send size={16} /> Send
                </button>
              </div>
            </div>

          </div>
        </div>

      </motion.div>
    </div>
  );
}
