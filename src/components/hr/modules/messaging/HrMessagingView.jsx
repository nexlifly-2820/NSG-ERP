import React, { useState, useRef, useEffect } from 'react';
import { Send, Video, MessageSquare, Lock, Eye, MoreVertical, Edit2, Trash2, Reply, Forward, Bookmark, X, Check } from 'lucide-react';

export function HrMessagingView({ db }) {
  const [selectedChannel, setSelectedChannel]     = useState('hr-channel');
  const [newMsg, setNewMsg]                       = useState('');
  const [isPrivate, setIsPrivate]                 = useState(false);
  const [mentionQuery, setMentionQuery]           = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionedMember, setMentionedMember]     = useState(null);
  const [hoveredMsgId, setHoveredMsgId]           = useState(null);
  const [openMenuId, setOpenMenuId]               = useState(null);   // which message's context menu is open
  const [editingMsgId, setEditingMsgId]           = useState(null);
  const [editingText, setEditingText]             = useState('');
  const [replyTo, setReplyTo]                     = useState(null);   // { id, sender, text }
  const [forwardMsg, setForwardMsg]               = useState(null);   // message being forwarded
  const [forwardTarget, setForwardTarget]         = useState('');
  const inputRef   = useRef(null);
  const menuRef    = useRef(null);
  const messagesEndRef = useRef(null);

  // ── Channel Configuration ────────────────────────────────────────────────────
  const channels = {
    management: [
      { id: 'ceo-channel', name: '#ceo-channel', label: 'CEO Suite Room'   },
      { id: 'tl-channel',  name: '#tl-channel',  label: 'Team Lead Forum'  }
    ],
    staff: [
      { id: 'it-channel',                name: '#it-channel',                label: 'IT Systems Room'   },
      { id: 'digital-marketing-channel', name: '#digital-marketing-channel', label: 'Digital Marketing'  },
      { id: 'hr-channel',                name: '#hr-channel',                label: 'HR Dept Room'      },
      { id: 'ba-channel',                name: '#ba-channel',                label: 'Business Analysis'  }
    ]
  };
  const allChannels = [...channels.management, ...channels.staff];

  // ── Seed message history ─────────────────────────────────────────────────────
  const [channelMessages, setChannelMessages] = useState({
    'ceo-channel': [
      { id: 1, sender: 'CEO (John Doe)', text: "Sarah, let's audit the monthly payroll maker file before release.", time: '11:15 AM', isPrivate: false, mention: null, saved: false }
    ],
    'tl-channel': [
      { id: 1, sender: 'TL (Michael Vance)', text: 'Are the Shift A attendance exceptions fully resolved?', time: '09:30 AM', isPrivate: false, mention: null, saved: false }
    ],
    'it-channel': [
      { id: 1, sender: 'IT Lead', text: 'Provisions for MacBook NSG-MAC-093 are cleared.', time: 'Yesterday', isPrivate: false, mention: null, saved: false }
    ],
    'digital-marketing-channel': [
      { id: 1, sender: 'Marketing Lead', text: 'Social campaign metrics for Q2 look excellent!', time: 'Yesterday', isPrivate: false, mention: null, saved: false }
    ],
    'hr-channel': [
      { id: 1, sender: 'John Doe', text: 'Hi Sarah, is Vikram Malhotra interview scheduled?', time: '10:00 AM', isPrivate: false, mention: null, saved: false },
      { id: 2, sender: 'You', text: 'Yes, enqueued under Jitsi WebRTC launchers!', time: '10:05 AM', isPrivate: false, mention: null, saved: false }
    ],
    'ba-channel': [
      { id: 1, sender: 'BA Lead', text: 'Requirements doc for ERP sub-routing is completed.', time: '2 days ago', isPrivate: false, mention: null, saved: false }
    ]
  });

  // ── Channel members ──────────────────────────────────────────────────────────
  const getChannelMembers = (channelId) => {
    switch (channelId) {
      case 'ceo-channel':  return [{ id: 'ceo', name: 'John Doe', role: 'CEO' }, { id: 'hr', name: 'Sarah Jenkins', role: 'HR Manager' }];
      case 'tl-channel':   return [{ id: 'hr', name: 'Sarah Jenkins', role: 'HR Manager' }, { id: 'tl-1', name: 'Michael Vance', role: 'Engineering Lead' }, { id: 'tl-2', name: 'David Miller', role: 'Operations Lead' }];
      case 'it-channel': {
        const l = db.employees.filter(e => e.department === 'IT' || e.department === 'Engineering');
        return l.length ? l.map(e => ({ id: e.id, name: e.name, role: e.designation })) : [{ id: 101, name: 'David Miller', role: 'IT Support' }, { id: 102, name: 'Jane Smith', role: 'Systems Engineer' }];
      }
      case 'digital-marketing-channel': {
        const l = db.employees.filter(e => e.department === 'Marketing' || e.department === 'Sales');
        return l.length ? l.map(e => ({ id: e.id, name: e.name, role: e.designation })) : [{ id: 103, name: 'Rahul Roy', role: 'Marketing Lead' }, { id: 104, name: 'Priya Nair', role: 'SEO Analyst' }];
      }
      case 'hr-channel': {
        const l = db.employees.filter(e => e.department === 'HR');
        return l.length ? l.map(e => ({ id: e.id, name: e.name, role: e.designation })) : [{ id: 'hr', name: 'Sarah Jenkins', role: 'HR Manager' }, { id: 105, name: 'John Doe', role: 'HR Recruiter' }];
      }
      case 'ba-channel': {
        const l = db.employees.filter(e => e.department === 'BA');
        return l.length ? l.map(e => ({ id: e.id, name: e.name, role: e.designation })) : [{ id: 106, name: 'Rahul Roy', role: 'Business Analyst' }, { id: 107, name: 'David Miller', role: 'Systems Analyst' }];
      }
      default: return [];
    }
  };

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Reset on channel switch
  useEffect(() => {
    setShowMentionDropdown(false); setMentionedMember(null); setIsPrivate(false);
    setNewMsg(''); setReplyTo(null); setEditingMsgId(null); setOpenMenuId(null);
  }, [selectedChannel]);

  // ── @ Mention input handler ──────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    setNewMsg(val);
    const lastAt = val.lastIndexOf('@');
    if (lastAt !== -1) {
      const query = val.slice(lastAt + 1).toLowerCase();
      if (!query.includes(' ')) { setMentionQuery(query); setShowMentionDropdown(true); return; }
    }
    setShowMentionDropdown(false); setMentionQuery('');
    if (!val.includes('@')) { setMentionedMember(null); setIsPrivate(false); }
  };

  const filteredMembers = getChannelMembers(selectedChannel).filter(m =>
    m.name.toLowerCase().includes(mentionQuery)
  );

  const handleSelectMention = (member) => {
    const lastAt = newMsg.lastIndexOf('@');
    setNewMsg(`${newMsg.slice(0, lastAt)}@${member.name} `);
    setMentionedMember(member);
    setShowMentionDropdown(false); setMentionQuery('');
    inputRef.current?.focus();
  };

  // ── Send message ─────────────────────────────────────────────────────────────
  const handleSend = (e) => {
    e.preventDefault();
    if (!newMsg.trim()) return;
    const msg = {
      id: Date.now(),
      sender: 'You',
      text: newMsg.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPrivate: !!mentionedMember && isPrivate,
      mention: mentionedMember?.name || null,
      replyTo: replyTo ? { sender: replyTo.sender, text: replyTo.text } : null,
      saved: false,
      edited: false
    };
    setChannelMessages(p => ({ ...p, [selectedChannel]: [...(p[selectedChannel] || []), msg] }));
    setNewMsg(''); setMentionedMember(null); setIsPrivate(false);
    setShowMentionDropdown(false); setReplyTo(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  // ── Context menu actions ─────────────────────────────────────────────────────
  const updateMsg = (id, patch) => {
    setChannelMessages(p => ({
      ...p,
      [selectedChannel]: (p[selectedChannel] || []).map(m => m.id === id ? { ...m, ...patch } : m)
    }));
  };

  const handleDelete = (id) => {
    setChannelMessages(p => ({ ...p, [selectedChannel]: (p[selectedChannel] || []).filter(m => m.id !== id) }));
    setOpenMenuId(null);
  };

  const handleEdit = (msg) => {
    setEditingMsgId(msg.id); setEditingText(msg.text); setOpenMenuId(null);
  };

  const handleEditSave = (id) => {
    if (editingText.trim()) updateMsg(id, { text: editingText.trim(), edited: true });
    setEditingMsgId(null); setEditingText('');
  };

  const handleReply = (msg) => {
    setReplyTo(msg); setOpenMenuId(null); inputRef.current?.focus();
  };

  const handleForward = (msg) => {
    setForwardMsg(msg); setForwardTarget(allChannels.find(c => c.id !== selectedChannel)?.id || '');
    setOpenMenuId(null);
  };

  const handleForwardConfirm = () => {
    if (!forwardTarget || !forwardMsg) return;
    const fwdMsg = {
      id: Date.now(), sender: 'You',
      text: forwardMsg.text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isPrivate: false, mention: null, replyTo: null, saved: false, edited: false,
      forwarded: true, forwardedFrom: selectedChannel
    };
    setChannelMessages(p => ({ ...p, [forwardTarget]: [...(p[forwardTarget] || []), fwdMsg] }));
    setForwardMsg(null);
  };

  const handleSave = (id, saved) => { updateMsg(id, { saved: !saved }); setOpenMenuId(null); };

  // ── Visible messages (private filter) ────────────────────────────────────────
  const visibleMessages = (channelMessages[selectedChannel] || []).filter(m =>
    m.isPrivate ? m.sender === 'You' || m.mention === 'Sarah Jenkins' : true
  );

  const isStaffChannel = channels.staff.some(ch => ch.id === selectedChannel);

  // ── Context Menu Item ─────────────────────────────────────────────────────────
  const MenuItem = ({ icon, label, onClick, danger }) => (
    <button
      type="button"
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: '9px', width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: danger ? '#f87171' : 'var(--text-primary)', fontSize: '12.5px', cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s' }}
      onMouseEnter={e => e.currentTarget.style.backgroundColor = danger ? 'rgba(248,113,113,0.08)' : 'rgba(236,72,153,0.06)'}
      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="component-container">
      <div className="component-header">
        <div>
          <h1>Messaging channels</h1>
          <p>Collaborate in private department rooms or launch instant screening RTC calls.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', alignItems: 'stretch', height: '540px' }}>

        {/* ── Left: Channel list ──────────────────────────────────────────────── */}
        <div className="card flex-1" style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-pink)', borderRadius: '12px', overflowY: 'auto' }}>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>🏛️ Management Forums</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {channels.management.map(ch => (
                <div key={ch.id} onClick={() => setSelectedChannel(ch.id)}
                  style={{ padding: '9px 12px', backgroundColor: selectedChannel === ch.id ? 'rgba(236,72,153,0.08)' : 'transparent', color: selectedChannel === ch.id ? 'var(--accent-pink)' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: selectedChannel === ch.id ? '600' : 'normal', border: selectedChannel === ch.id ? '1px solid rgba(236,72,153,0.2)' : '1px solid transparent', transition: 'all 0.15s' }}>
                  <MessageSquare size={13} style={{ color: selectedChannel === ch.id ? 'var(--accent-pink)' : 'var(--text-muted)', flexShrink: 0 }} />
                  {ch.name}
                </div>
              ))}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>👥 Staff Member Channels</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {channels.staff.map(ch => (
                <div key={ch.id} onClick={() => setSelectedChannel(ch.id)}
                  style={{ padding: '9px 12px', backgroundColor: selectedChannel === ch.id ? 'rgba(236,72,153,0.08)' : 'transparent', color: selectedChannel === ch.id ? 'var(--accent-pink)' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: selectedChannel === ch.id ? '600' : 'normal', border: selectedChannel === ch.id ? '1px solid rgba(236,72,153,0.2)' : '1px solid transparent', transition: 'all 0.15s' }}>
                  <MessageSquare size={13} style={{ color: selectedChannel === ch.id ? 'var(--accent-pink)' : 'var(--text-muted)', flexShrink: 0 }} />
                  {ch.name}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: 'auto' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>🎥 Quick Actions</span>
            <div style={{ padding: '10px 12px', background: 'rgba(236,72,153,0.05)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--accent-pink)', border: '1px dashed rgba(236,72,153,0.3)' }} onClick={() => alert('Creating secure WebRTC video room...')}>
              <Video size={13} /> Launch Interview RTC
            </div>
          </div>
        </div>

        {/* ── Right: Chat window ──────────────────────────────────────────────── */}
        <div className="card flex-2" style={{ margin: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', gap: 0 }}>

          {/* Header */}
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '15px' }}>{allChannels.find(c => c.id === selectedChannel)?.name}</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({getChannelMembers(selectedChannel).length} members online)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isStaffChannel && <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Type <strong>@name</strong> to mention</span>}
              <span style={{ fontSize: '11px', color: 'var(--accent-pink)', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: 'rgba(236,72,153,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                {isStaffChannel ? 'Staff Room' : 'Management Room'}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="custom-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px', marginBottom: '12px' }}>
            {visibleMessages.map(m => {
              const isOwn    = m.sender === 'You';
              const isHover  = hoveredMsgId === m.id;
              const menuOpen = openMenuId   === m.id;
              const isEditing = editingMsgId === m.id;

              return (
                <div
                  key={m.id}
                  style={{ display: 'flex', flexDirection: 'column', alignSelf: isOwn ? 'flex-end' : 'flex-start', maxWidth: '72%', position: 'relative' }}
                  onMouseEnter={() => setHoveredMsgId(m.id)}
                  onMouseLeave={() => { setHoveredMsgId(null); }}
                >
                  {/* Sender name row */}
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: isOwn ? 'right' : 'left', marginBottom: '3px', display: 'flex', gap: '5px', justifyContent: isOwn ? 'flex-end' : 'flex-start', alignItems: 'center' }}>
                    {m.saved && <Bookmark size={9} style={{ color: '#fbbf24', fill: '#fbbf24' }} />}
                    {m.isPrivate && <Lock size={9} style={{ color: '#a78bfa' }} />}
                    {m.sender}
                    {m.edited && <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontStyle: 'italic' }}>(edited)</span>}
                    {m.forwarded && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>↪ forwarded</span>}
                    {m.isPrivate && <span style={{ fontSize: '9px', color: '#a78bfa', fontWeight: 'bold', backgroundColor: 'rgba(167,139,250,0.1)', padding: '1px 4px', borderRadius: '3px' }}>PRIVATE</span>}
                    {m.time && <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{m.time}</span>}

                    {/* ⋮ context menu trigger */}
                    {(isHover || menuOpen) && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(menuOpen ? null : m.id); }}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '1px 3px', borderRadius: '4px', display: 'flex', alignItems: 'center', transition: 'all 0.1s', backgroundColor: menuOpen ? 'rgba(236,72,153,0.1)' : 'transparent' }}
                      >
                        <MoreVertical size={13} />
                      </button>
                    )}
                  </div>

                  {/* Reply preview */}
                  {m.replyTo && (
                    <div style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderLeft: '3px solid rgba(236,72,153,0.5)', padding: '4px 8px', borderRadius: '4px', marginBottom: '3px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <strong style={{ color: 'var(--accent-pink)', fontSize: '10px' }}>{m.replyTo.sender}</strong>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px' }}>{m.replyTo.text}</div>
                    </div>
                  )}

                  {/* Bubble */}
                  {isEditing ? (
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <input
                        autoFocus
                        value={editingText}
                        onChange={e => setEditingText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleEditSave(m.id); if (e.key === 'Escape') setEditingMsgId(null); }}
                        style={{ flex: 1, backgroundColor: 'var(--bg-primary)', border: '1px solid var(--accent-pink)', color: '#fff', padding: '8px 10px', borderRadius: '8px', outline: 'none', fontSize: '13px' }}
                      />
                      <button type="button" onClick={() => handleEditSave(m.id)} style={{ background: 'var(--accent-pink)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#fff', display: 'flex' }}><Check size={13} /></button>
                      <button type="button" onClick={() => setEditingMsgId(null)} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={13} /></button>
                    </div>
                  ) : (
                    <div style={{ padding: '9px 13px', backgroundColor: isOwn ? (m.isPrivate ? '#7c3aed' : 'var(--accent-pink)') : 'var(--bg-tertiary)', borderRadius: isOwn ? '12px 12px 3px 12px' : '12px 12px 12px 3px', color: '#fff', fontSize: '13px', border: isOwn ? 'none' : '1px solid var(--border-color)', lineHeight: '1.5', boxShadow: m.saved ? '0 0 0 1.5px #fbbf24' : 'none' }}>
                      {m.mention && <span style={{ color: m.isPrivate ? '#c4b5fd' : '#fde68a', fontWeight: 'bold', marginRight: '4px' }}>@{m.mention}</span>}
                      {m.text.replace(`@${m.mention} `, '')}
                    </div>
                  )}

                  {/* Floating context menu */}
                  {menuOpen && (
                    <div
                      ref={menuRef}
                      style={{ position: 'absolute', [isOwn ? 'right' : 'left']: 0, top: '100%', marginTop: '4px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', zIndex: 600, minWidth: '160px', overflow: 'hidden', animation: 'fadeIn 0.12s ease' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <MenuItem icon={<Reply size={13} />}   label="Reply"           onClick={() => handleReply(m)} />
                      {isOwn && <MenuItem icon={<Edit2 size={13} />} label="Edit"    onClick={() => handleEdit(m)} />}
                      <MenuItem icon={<Forward size={13} />}  label="Forward"         onClick={() => handleForward(m)} />
                      <MenuItem icon={<Bookmark size={13} />} label={m.saved ? 'Unsave' : 'Save'} onClick={() => handleSave(m.id, m.saved)} />
                      {isOwn && <MenuItem icon={<Trash2 size={13} />} label="Delete" onClick={() => handleDelete(m.id)} danger />}
                    </div>
                  )}
                </div>
              );
            })}
            {visibleMessages.length === 0 && (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                No messages yet. Start collaborating below.
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Compose Area ──────────────────────────────────────────────────── */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', position: 'relative' }}>

            {/* @ Mention dropdown */}
            {showMentionDropdown && filteredMembers.length > 0 && (
              <div style={{ position: 'absolute', bottom: '100%', left: 0, right: 0, backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '10px', marginBottom: '6px', boxShadow: 'var(--shadow-lg)', zIndex: 500, overflow: 'hidden' }}>
                <div style={{ padding: '6px 12px', fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-tertiary)' }}>📡 Mention a Channel Member</div>
                {filteredMembers.map(member => (
                  <div key={member.id} onClick={() => handleSelectMention(member)}
                    style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-color)', transition: 'background 0.1s' }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(236,72,153,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'rgba(236,72,153,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', color: 'var(--accent-pink)', flexShrink: 0 }}>{member.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{member.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{member.role}</div>
                    </div>
                    <div style={{ marginLeft: 'auto', fontSize: '10px', color: 'var(--accent-pink)', fontWeight: 'bold' }}>@mention</div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply preview bar */}
            {replyTo && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', backgroundColor: 'rgba(255,255,255,0.03)', borderLeft: '3px solid var(--accent-pink)', padding: '6px 10px', borderRadius: '6px' }}>
                <Reply size={12} style={{ color: 'var(--accent-pink)', flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <strong style={{ color: 'var(--accent-pink)' }}>{replyTo.sender}:</strong> {replyTo.text}
                </div>
                <button type="button" onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}><X size={12} /></button>
              </div>
            )}

            {/* Mentioned badge + Private toggle */}
            {mentionedMember && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.25)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', color: 'var(--accent-pink)', fontWeight: '600' }}>
                  <span>@{mentionedMember.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 'normal' }}>· {mentionedMember.role}</span>
                  <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', padding: '0 0 0 4px', lineHeight: 1 }} onClick={() => { setMentionedMember(null); setIsPrivate(false); setNewMsg(newMsg.replace(`@${mentionedMember.name} `, '')); }}>✕</button>
                </div>
                <button type="button" onClick={() => setIsPrivate(p => !p)}
                  style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', border: isPrivate ? '1px solid #7c3aed' : '1px solid var(--border-color)', backgroundColor: isPrivate ? 'rgba(124,58,237,0.12)' : 'transparent', color: isPrivate ? '#a78bfa' : 'var(--text-muted)', fontSize: '11px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {isPrivate ? <Lock size={11} /> : <Eye size={11} />}
                  {isPrivate ? 'Private (only @mention sees this)' : 'Public (group can see)'}
                </button>
              </div>
            )}

            {/* Input + Send */}
            <form onSubmit={handleSend} style={{ display: 'flex', gap: '8px' }}>
              <input
                ref={inputRef}
                type="text"
                placeholder={isStaffChannel ? 'Write message... (type @ to mention someone)' : 'Write message...'}
                value={newMsg}
                onChange={handleInputChange}
                style={{ flex: 1, backgroundColor: 'var(--bg-primary)', border: `1px solid ${isPrivate ? '#7c3aed' : 'var(--border-color)'}`, color: '#fff', padding: '10px 13px', borderRadius: '8px', outline: 'none', fontSize: '13px', transition: 'border-color 0.2s' }}
              />
              <button type="submit" style={{ backgroundColor: isPrivate ? '#7c3aed' : 'var(--accent-pink)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                {isPrivate ? <Lock size={14} /> : <Send size={14} />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── Forward Modal ─────────────────────────────────────────────────────── */}
      {forwardMsg && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ width: '420px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-pink)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, border: 'none', padding: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}><Forward size={16} /> Forward Message</h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setForwardMsg(null)}><X size={16} /></button>
            </div>
            <div style={{ backgroundColor: 'var(--bg-tertiary)', borderLeft: '3px solid var(--border-color)', padding: '10px 12px', borderRadius: '6px', fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
              "{forwardMsg.text}"
            </div>
            <div>
              <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Forward to channel</label>
              <select value={forwardTarget} onChange={e => setForwardTarget(e.target.value)}
                style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}>
                {allChannels.filter(c => c.id !== selectedChannel).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
              <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }} onClick={() => setForwardMsg(null)}>Cancel</button>
              <button type="button" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }} onClick={handleForwardConfirm}>Forward Now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
