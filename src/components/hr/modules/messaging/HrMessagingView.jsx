import React, { useState, useRef, useEffect } from 'react';
import { Send, Video, MessageSquare, Lock, Eye, MoreVertical, Edit2, Trash2, Reply, Forward, Bookmark, X, Check } from 'lucide-react';
import HuddleModal from '../../../employee/HuddleModal';

const DEFAULT_CHAT_CHANNELS = [
  {
    id: 'general-channel',
    name: '#general-channel',
    label: 'Company General Room',
    type: 'staff',
    members: ['101', '102', '103', '104', '105', 'hr', 'ceo'],
    messages: [
      { id: 1, sender: 'CEO (John Doe)', text: 'Welcome to the unified NSG-ERP communications channel!', time: 'Yesterday' }
    ]
  },
  {
    id: 'team-room',
    name: '#team-room',
    label: 'Engineering Team Room',
    type: 'staff',
    members: ['101', '102', '103', '105', 'hr'],
    messages: [
      { id: 1, sender: 'Marcus Vance', text: 'Hey team, morning! Please drop your standup items here. Also, let\'s aim to deploy the new build by 4 PM.', time: '9:15 AM' },
      { id: 2, sender: 'Alex Wong', text: 'Morning! Working on the payment gate validation fixes. PR is ready for review: #412.', time: '9:30 AM' },
      { id: 3, sender: 'Sarah Jenkins', text: 'Morning! I\'m wrapping up the Asset Requests validation and mobile tab changes. I\'ll review your PR, Alex, right after.', time: '9:35 AM' }
    ]
  },
  {
    id: 'grievance-room',
    name: '#grievance-room',
    label: 'HR Grievance (Private)',
    type: 'grievance',
    members: ['102', 'hr'],
    messages: [
      { id: 1, sender: 'Sophia Reed (HR Officer)', text: 'Hello Sarah, welcome to your secure grievance portal. Anything shared here remains private. How can I assist you today?', time: 'Yesterday' }
    ]
  },
  {
    id: 'ceo-channel',
    name: '#ceo-channel',
    label: 'CEO Suite Room',
    type: 'management',
    members: ['hr', 'ceo'],
    messages: [
      { id: 1, sender: 'CEO (John Doe)', text: "Sarah, let's audit the monthly payroll maker file before release.", time: '11:15 AM' }
    ]
  },
  {
    id: 'tl-channel',
    name: '#tl-channel',
    label: 'Team Lead Forum',
    type: 'management',
    members: ['hr', '101'],
    messages: [
      { id: 1, sender: 'TL (Michael Vance)', text: 'Are the Shift A attendance exceptions fully resolved?', time: '09:30 AM' }
    ]
  }
];

export function HrMessagingView({ db, onUpdateDb, currentUser }) {
  const hrName = currentUser?.name || 'Sarah Jenkins';
  const [selectedChannel, setSelectedChannel]     = useState('general-channel');
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
  
  // Roster & Channel Creator States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageMembersModal, setShowManageMembersModal] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelLabel, setNewChannelLabel] = useState('');
  const [newChannelType, setNewChannelType] = useState('staff');
  const [selectedRosterMembers, setSelectedRosterMembers] = useState(['hr']);
  const [huddlePeer, setHuddlePeer] = useState(null);

  const [dbChannels, setDbChannels] = useState([]);
  const [tickets, setTickets] = useState([]);
  const socketRef = useRef(null);

  const inputRef   = useRef(null);
  const menuRef    = useRef(null);
  const messagesEndRef = useRef(null);

  const fetchTickets = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
    if (!token) return;
    try {
      const res = await fetch('/api/hr-portal/tickets', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error("Failed to load tickets", e);
    }
  };

  const resolveTicket = async (id) => {
    const token = localStorage.getItem('nsg_jwt_token');
    if (!token) return;
    try {
      const res = await fetch(`/api/hr-portal/tickets/${id}/resolve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (e) {
      console.error("Failed to resolve ticket", e);
    }
  };

  const fetchChannelsAndMessages = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
    if (!token) return;
    try {
      const res = await fetch('/api/employee-portal/chat/channels', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const chans = await res.json();
        const loadedChannels = await Promise.all(chans.map(async (c) => {
          try {
            const msgRes = await fetch(`/api/employee-portal/chat/channels/${c.id}/messages`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (msgRes.ok) {
              const msgs = await msgRes.json();
              return {
                id: c.id,
                name: c.name,
                label: c.label,
                type: c.type,
                members: c.type === 'grievance' ? ['102', 'hr'] : ['101', '102', '103', '104', '105', 'hr', 'ceo'],
                messages: msgs.map(m => ({
                  id: m.id,
                  sender: (m.sender === hrName || m.sender === hrName + ' (HR)' || m.sender === 'Sarah Jenkins' || m.sender === 'Sarah Jenkins (HR)' || m.sender === 'Sophia Reed' || m.sender === 'Sophia Reed (HR)') ? 'You' : m.sender,
                  text: m.text,
                  time: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isPrivate: false,
                  mention: null,
                  replyTo: null,
                  saved: false,
                  edited: false
                }))
              };
            }
          } catch (e) {
            console.error("Error loading messages for channel", c.id, e);
          }
          return {
            id: c.id,
            name: c.name,
            label: c.label,
            type: c.type,
            members: c.type === 'grievance' ? ['102', 'hr'] : ['101', '102', '103', '104', '105', 'hr', 'ceo'],
            messages: []
          };
        }));
        setDbChannels(loadedChannels);
        if (onUpdateDb) {
          onUpdateDb({
            ...db,
            chatChannels: loadedChannels
          });
        }
      }
    } catch (e) {
      console.error("Failed to load channels", e);
    }
  };

  useEffect(() => {
    fetchChannelsAndMessages();
    fetchTickets();
  }, []);

  // Initialize WebSocket connection for real-time messaging
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/employee-portal/ws/${encodeURIComponent(hrName)}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const newMsg = JSON.parse(event.data);
        const isCorporateChannel = chatChannels.some(c => c.id === newMsg.channel_id);

        if (isCorporateChannel) {
          fetchChannelsAndMessages();
        }
      } catch (e) {
        console.error("Failed to parse incoming WebSocket message:", e);
      }
    };

    socket.onerror = (e) => {
      console.warn("WebSocket connection error. Operating in offline simulation mode:", e);
    };

    return () => {
      socket.close();
    };
  }, [db, onUpdateDb, chatChannels]);

  // ── Channel Configuration (Derived dynamically from DB) ──────────────────────
  const chatChannels = dbChannels.length > 0 ? dbChannels : (db?.chatChannels && db.chatChannels.length > 0 ? db.chatChannels : DEFAULT_CHAT_CHANNELS);

  const derivedChannels = {
    management: chatChannels.filter(c => c.type === 'management'),
    staff: chatChannels.filter(c => c.type === 'staff'),
    grievance: chatChannels.filter(c => c.type === 'grievance'),
    support: [
      { id: 'support-tickets', name: '🎫 Support Tickets', label: 'Employee IT/HR Tickets' }
    ]
  };

  const allChannels = [
    ...derivedChannels.management,
    ...derivedChannels.staff,
    ...derivedChannels.grievance,
    ...derivedChannels.support
  ];

  const currentChannel = allChannels.find(c => c.id === selectedChannel);

  // ── Channel members (Derived dynamically from DB) ─────────────────────────────
  const getChannelMembers = (channelId) => {
    const ch = chatChannels.find(c => c.id === channelId);
    if (!ch || !ch.members) return [];
    return ch.members.map(memberId => {
      if (memberId === 'hr') {
        return { id: 'hr', name: 'Sarah Jenkins', role: 'HR Manager' };
      }
      if (memberId === 'ceo') {
        return { id: 'ceo', name: 'John Doe', role: 'CEO' };
      }
      const emp = db.employees?.find(e => String(e.id) === String(memberId));
      if (emp) {
        return { id: emp.id, name: emp.name, role: emp.designation };
      }
      return { id: memberId, name: memberId, role: 'Member' };
    });
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
    if (!newMsg.trim() || !currentChannel) return;

    // Send via WebSocket if connection is active
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        channel_id: selectedChannel,
        text: newMsg.trim(),
        sender: hrName
      }));
      setNewMsg('');
      setMentionedMember(null);
      setIsPrivate(false);
      setShowMentionDropdown(false);
      setReplyTo(null);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
      return;
    }

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

    const updatedChannels = chatChannels.map(c => {
      if (c.id === selectedChannel) {
        return {
          ...c,
          messages: [...(c.messages || []), msg]
        };
      }
      return c;
    });

    onUpdateDb({ ...db, chatChannels: updatedChannels });
    setNewMsg(''); setMentionedMember(null); setIsPrivate(false);
    setShowMentionDropdown(false); setReplyTo(null);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  };

  // ── Context menu actions ─────────────────────────────────────────────────────
  const updateMsg = (id, patch) => {
    const updatedChannels = chatChannels.map(c => {
      if (c.id === selectedChannel) {
        return {
          ...c,
          messages: (c.messages || []).map(m => m.id === id ? { ...m, ...patch } : m)
        };
      }
      return c;
    });
    onUpdateDb({ ...db, chatChannels: updatedChannels });
  };

  const handleDelete = (id) => {
    const updatedChannels = chatChannels.map(c => {
      if (c.id === selectedChannel) {
        return {
          ...c,
          messages: (c.messages || []).filter(m => m.id !== id)
        };
      }
      return c;
    });
    onUpdateDb({ ...db, chatChannels: updatedChannels });
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
      forwarded: true, forwardedFrom: currentChannel?.name || selectedChannel
    };
    const updatedChannels = chatChannels.map(c => {
      if (c.id === forwardTarget) {
        return {
          ...c,
          messages: [...(c.messages || []), fwdMsg]
        };
      }
      return c;
    });
    onUpdateDb({ ...db, chatChannels: updatedChannels });
    setForwardMsg(null);
  };

  const handleSave = (id, saved) => { updateMsg(id, { saved: !saved }); setOpenMenuId(null); };

  // ── Roster & Channel Creation Handlers ───────────────────────────────────────
  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    if (!onUpdateDb) {
      alert('Database not ready. Please refresh the page.');
      return;
    }
    
    const rawName = newChannelName.trim().replace(/^#+/, '');
    const formattedName = `#${rawName}`;
    // Use timestamp suffix to guarantee uniqueness every time
    const baseId = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'channel';
    const newId = `${baseId}-${Date.now()}`;
    
    const newChan = {
      id: newId,
      name: formattedName,
      label: newChannelLabel.trim() || `${rawName} Channel`,
      type: newChannelType,
      members: selectedRosterMembers.length > 0 ? selectedRosterMembers : ['hr'],
      messages: [
        {
          id: Date.now(),
          sender: 'System',
          text: `Channel ${formattedName} created by HR Manager.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    
    const currentChannels = db?.chatChannels && db.chatChannels.length > 0 ? db.chatChannels : DEFAULT_CHAT_CHANNELS;
    const updated = [...currentChannels, newChan];
    onUpdateDb({ ...db, chatChannels: updated });
    
    setNewChannelName('');
    setNewChannelLabel('');
    setNewChannelType('staff');
    setSelectedRosterMembers(['hr']);
    setShowCreateModal(false);
    setSelectedChannel(newId);
  };

  const handleToggleMember = (memberId) => {
    if (!currentChannel) return;
    const membersList = currentChannel.members || [];
    let updatedMembers;
    if (membersList.includes(memberId)) {
      updatedMembers = membersList.filter(id => id !== memberId);
    } else {
      updatedMembers = [...membersList, memberId];
    }
    
    const updatedChannels = chatChannels.map(c => {
      if (c.id === selectedChannel) {
        return {
          ...c,
          members: updatedMembers
        };
      }
      return c;
    });
    
    onUpdateDb({ ...db, chatChannels: updatedChannels });
  };

  // ── Visible messages (private filter) ────────────────────────────────────────
  const visibleMessages = currentChannel ? (currentChannel.messages || []).filter(m =>
    m.isPrivate ? m.sender === 'You' || m.mention === 'Sarah Jenkins' : true
  ) : [];

  const isStaffChannel = currentChannel ? (currentChannel.type === 'staff') : false;

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
              {derivedChannels.management.map(ch => (
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
              {derivedChannels.staff.map(ch => (
                <div key={ch.id} onClick={() => setSelectedChannel(ch.id)}
                  style={{ padding: '9px 12px', backgroundColor: selectedChannel === ch.id ? 'rgba(236,72,153,0.08)' : 'transparent', color: selectedChannel === ch.id ? 'var(--accent-pink)' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: selectedChannel === ch.id ? '600' : 'normal', border: selectedChannel === ch.id ? '1px solid rgba(236,72,153,0.2)' : '1px solid transparent', transition: 'all 0.15s' }}>
                  <MessageSquare size={13} style={{ color: selectedChannel === ch.id ? 'var(--accent-pink)' : 'var(--text-muted)', flexShrink: 0 }} />
                  {ch.name}
                </div>
              ))}
            </div>
          </div>
          {derivedChannels.grievance.length > 0 && (
            <div>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>🛡️ Support & Grievances</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {derivedChannels.grievance.map(ch => (
                  <div key={ch.id} onClick={() => setSelectedChannel(ch.id)}
                    style={{ padding: '9px 12px', backgroundColor: selectedChannel === ch.id ? 'rgba(236,72,153,0.08)' : 'transparent', color: selectedChannel === ch.id ? 'var(--accent-pink)' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: selectedChannel === ch.id ? '600' : 'normal', border: selectedChannel === ch.id ? '1px solid rgba(236,72,153,0.2)' : '1px solid transparent', transition: 'all 0.15s' }}>
                    <MessageSquare size={13} style={{ color: selectedChannel === ch.id ? 'var(--accent-pink)' : 'var(--text-muted)', flexShrink: 0 }} />
                    {ch.name}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Support Tickets Channel */}
          <div>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>🎫 Support Queue</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div onClick={() => setSelectedChannel('support-tickets')}
                style={{ padding: '9px 12px', backgroundColor: selectedChannel === 'support-tickets' ? 'rgba(236,72,153,0.08)' : 'transparent', color: selectedChannel === 'support-tickets' ? 'var(--accent-pink)' : 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: selectedChannel === 'support-tickets' ? '600' : 'normal', border: selectedChannel === 'support-tickets' ? '1px solid rgba(236,72,153,0.2)' : '1px solid transparent', transition: 'all 0.15s', justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MessageSquare size={13} style={{ color: selectedChannel === 'support-tickets' ? 'var(--accent-pink)' : 'var(--text-muted)', flexShrink: 0 }} />
                  🎫 Support Tickets
                </span>
                {tickets.filter(t => t.status === 'open').length > 0 && (
                  <span style={{ fontSize: '9px', fontWeight: '700', backgroundColor: '#ef4444', color: '#fff', borderRadius: '10px', padding: '1px 6px' }}>
                    {tickets.filter(t => t.status === 'open').length}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', letterSpacing: '0.5px' }}>🎥 Actions</span>
            <div
              role="button"
              onClick={() => setShowCreateModal(true)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'var(--accent-pink)',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '12.5px',
                color: '#fff',
                border: 'none',
                fontWeight: 'bold',
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              ➕ Create Channel
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(236,72,153,0.05)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--accent-pink)', border: '1px dashed rgba(236,72,153,0.3)' }} onClick={() => setHuddlePeer({ name: 'HR Interview', roomName: 'Screening Huddle', channelId: 'hr-interview-rtc' })}>
              <Video size={13} /> Launch Interview RTC
            </div>
          </div>
        </div>

        {/* ── Right: Chat window OR Support Tickets panel ─────────────────────── */}
        <div className="card flex-2" style={{ margin: 0, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', gap: 0 }}>

          {/* Support Tickets Panel */}
          {selectedChannel === 'support-tickets' ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
                <strong style={{ fontSize: '15px' }}>🎫 Employee Support Tickets</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                  {tickets.filter(t => t.status === 'open').length} open
                </span>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                    No support tickets yet. Employee submissions will appear here.
                  </div>
                ) : (
                  tickets.map((tkt) => (
                    <div key={tkt.id} style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '11px', fontWeight: '700', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{tkt.id}</span>
                          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase',
                            color: tkt.priority === 'High' ? '#ef4444' : tkt.priority === 'Medium' ? '#f59e0b' : 'var(--text-muted)' }}>
                            {tkt.priority}
                          </span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{tkt.category}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                            backgroundColor: tkt.status === 'open' ? 'rgba(59,130,246,0.1)' : 'rgba(16,185,129,0.1)',
                            color: tkt.status === 'open' ? '#3b82f6' : '#10b981' }}>
                            {tkt.status}
                          </span>
                          {tkt.status === 'open' && (
                            <button
                              type="button"
                              onClick={() => resolveTicket(tkt.id)}
                              style={{ fontSize: '10px', fontWeight: '700', padding: '3px 10px', borderRadius: '4px', border: 'none', backgroundColor: 'var(--accent-pink)', color: '#fff', cursor: 'pointer' }}
                            >
                              ✓ Mark Resolved
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>{tkt.description}</p>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                        <span>From: <strong>{tkt.employee_name || 'Employee'}</strong></span>
                        <span>Logged: {new Date(tkt.created_at).toLocaleString()}</span>
                        {tkt.status === 'Resolved' && <span>Resolved</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <>
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '15px' }}>{currentChannel?.name}</strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>({currentChannel?.members?.length || 0} members)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {selectedChannel !== 'support-tickets' && (
                <>
                  {/* Manage Members Button */}
                  <button
                    type="button"
                    onClick={() => setShowManageMembersModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '5px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-pink)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    ⚙️ Manage Members
                  </button>

                  {/* Start Huddle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setHuddlePeer({
                        name: 'HR / Management',
                        roomName: currentChannel?.name || 'HR Portal Conference',
                        channelId: selectedChannel
                      });
                    }}
                    style={{
                      backgroundColor: 'rgba(236,72,153,0.08)',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '5px 12px',
                      color: 'var(--accent-pink)',
                      fontSize: '11px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(236,72,153,0.15)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(236,72,153,0.08)'}
                  >
                    <Video size={12} />
                    <span>Start Huddle</span>
                  </button>
                </>
              )}
              <span style={{ fontSize: '11px', color: 'var(--accent-pink)', fontWeight: 'bold', textTransform: 'uppercase', backgroundColor: 'rgba(236,72,153,0.08)', padding: '2px 8px', borderRadius: '4px' }}>
                {currentChannel?.type === 'staff' ? 'Staff Room' : currentChannel?.type === 'management' ? 'Management Room' : 'Grievance Room'}
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
            </>
          )}
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

      {/* ── Create Channel Modal ──────────────────────────────────────────────── */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ width: '480px', maxHeight: '90vh', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-pink)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>➕ Create Corporate Channel</h3>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowCreateModal(false)}><X size={16} /></button>
            </div>
            
            <form onSubmit={handleCreateChannel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Channel Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. #design-scrum"
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Channel Description / Label</label>
                <input
                  type="text"
                  placeholder="e.g. Design & UX alignment room"
                  value={newChannelLabel}
                  onChange={e => setNewChannelLabel(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>Channel Type</label>
                <select
                  value={newChannelType}
                  onChange={e => setNewChannelType(e.target.value)}
                  style={{ width: '100%', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: '#fff', padding: '10px 12px', borderRadius: '8px', outline: 'none' }}
                >
                  <option value="staff">Staff Room (General corporate communications)</option>
                  <option value="management">Management Room (Restricted forums)</option>
                  <option value="grievance">Grievance Room (Confidential/HR Support)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Select Roster Members</label>
                <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '12px', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  
                  {/* CEO option */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} className="member-select-row">
                    <input
                      type="checkbox"
                      checked={selectedRosterMembers.includes('ceo')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRosterMembers(prev => [...prev, 'ceo']);
                        else setSelectedRosterMembers(prev => prev.filter(id => id !== 'ceo'));
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <strong>John Doe</strong> <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(CEO)</span>
                    </div>
                  </label>

                  {/* HR option */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} className="member-select-row">
                    <input
                      type="checkbox"
                      checked={selectedRosterMembers.includes('hr')}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedRosterMembers(prev => [...prev, 'hr']);
                        else setSelectedRosterMembers(prev => prev.filter(id => id !== 'hr'));
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <div>
                      <strong>Sarah Jenkins</strong> <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>(HR Manager - You)</span>
                    </div>
                  </label>

                  {/* Employees list */}
                  {(db.employees || []).map(emp => (
                    <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', padding: '4px', borderRadius: '4px' }} className="member-select-row">
                      <input
                        type="checkbox"
                        checked={selectedRosterMembers.includes(String(emp.id))}
                        onChange={(e) => {
                          const idStr = String(emp.id);
                          if (e.target.checked) setSelectedRosterMembers(prev => [...prev, idStr]);
                          else setSelectedRosterMembers(prev => prev.filter(id => id !== idStr));
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <div>
                        <strong>{emp.name}</strong> <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>({emp.designation} · {emp.department})</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '10px' }}>
                <button type="button" style={{ background: 'none', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }} onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Members Modal ──────────────────────────────────────────────── */}
      {showManageMembersModal && currentChannel && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ width: '460px', maxHeight: '80vh', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderLeft: '4px solid var(--accent-pink)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', gap: '8px' }}>⚙️ Manage Roster Members</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>Channel: {currentChannel.name}</p>
              </div>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setShowManageMembersModal(false)}><X size={16} /></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              
              {/* CEO */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>John Doe</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>CEO</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleMember('ceo')}
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: currentChannel.members.includes('ceo') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    color: currentChannel.members.includes('ceo') ? '#ef4444' : '#10b981',
                    cursor: 'pointer'
                  }}
                >
                  {currentChannel.members.includes('ceo') ? '✕ Remove' : '＋ Add'}
                </button>
              </div>

              {/* HR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div>
                  <strong style={{ fontSize: '13px' }}>Sarah Jenkins</strong>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>HR Manager (You)</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleMember('hr')}
                  style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: currentChannel.members.includes('hr') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                    color: currentChannel.members.includes('hr') ? '#ef4444' : '#10b981',
                    cursor: 'pointer'
                  }}
                >
                  {currentChannel.members.includes('hr') ? '✕ Remove' : '＋ Add'}
                </button>
              </div>

              {/* Employees */}
              {(db.employees || []).map(emp => {
                const idStr = String(emp.id);
                const isMember = currentChannel?.members && currentChannel.members.includes(idStr);
                return (
                  <div key={emp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <strong style={{ fontSize: '13px' }}>{emp.name}</strong>
                      <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{emp.designation} · {emp.department}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleMember(idStr)}
                      style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: 'none',
                        backgroundColor: isMember ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: isMember ? '#ef4444' : '#10b981',
                        cursor: 'pointer'
                      }}
                    >
                      {isMember ? '✕ Remove' : '＋ Add'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '10px' }}>
              <button type="button" style={{ backgroundColor: 'var(--accent-pink)', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }} onClick={() => setShowManageMembersModal(false)}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dynamic Jitsi Huddle Overlay ────────────────────────────────────── */}
      {huddlePeer && (
        <HuddleModal
          peer={huddlePeer}
          onClose={() => setHuddlePeer(null)}
        />
      )}
    </div>
  );
}
