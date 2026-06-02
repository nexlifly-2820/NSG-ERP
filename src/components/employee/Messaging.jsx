import { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Shield, Send, Smile, Paperclip, 
  Video, ArrowLeft, Plus, MessageCircle, X, Circle, Image, FileText 
} from 'lucide-react';
import HuddleModal from './HuddleModal';

let msgIdCounter = 10000;

// Mock database for contacts (filtered by team_id)
// Sarah Jenkins is in team_id: 'eng' (Engineering)
const CONTACTS = [
  { id: 'c1', name: 'Marcus Vance', role: 'Team Lead', teamId: 'eng', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100', status: 'Online' },
  { id: 'c2', name: 'Alex Wong', role: 'Senior Developer', teamId: 'eng', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100', status: 'Offline' },
  { id: 'c3', name: 'Jessica Taylor', role: 'UI/UX Designer', teamId: 'eng', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100', status: 'Online' },
  { id: 'c4', name: 'David Carter', role: 'Product Manager', teamId: 'eng', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100', status: 'Online' },
  // Non-teammates (should be excluded from DMs list)
  { id: 'c5', name: 'Emma Watson', role: 'Marketing Lead', teamId: 'mkt', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100', status: 'Online' },
  { id: 'c6', name: 'Liam Neeson', role: 'Sales Manager', teamId: 'sales', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100', status: 'Online' }
];

// Pre-populated conversations
const initialRoomData = {
  'team-room': {
    id: 'team-room',
    name: 'Team Chat Room',
    type: 'team',
    desc: 'General engineering sprint updates, PR reviews, and deploy logs.',
    messages: [
      { id: 1, sender: 'Marcus Vance', text: 'Hey team, morning! Please drop your standup items here. Also, let\'s aim to deploy the new build by 4 PM.', time: '9:15 AM', isMe: false },
      { id: 2, sender: 'Alex Wong', text: 'Morning! Working on the payment gate validation fixes. PR is ready for review: #412.', time: '9:30 AM', isMe: false },
      { id: 3, sender: 'Sarah Jenkins', text: 'Morning! I\'m wrapping up the Asset Requests validation and mobile tab changes. I\'ll review your PR, Alex, right after.', time: '9:35 AM', isMe: true }
    ]
  },
  'grievance-room': {
    id: 'grievance-room',
    name: 'HR Grievance (Private)',
    type: 'grievance',
    desc: 'Confidential private channel with HR department.',
    messages: [
      { id: 1, sender: 'Sophia Reed (HR Officer)', text: 'Hello Sarah, welcome to your secure grievance portal. Anything shared here remains private. How can I assist you today?', time: 'Yesterday', isMe: false }
    ]
  }
};

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

export default function Messaging({ db, onUpdateDb }) {
  const getInitialRooms = () => {
    if (db?.employeeChatRooms) {
      return db.employeeChatRooms;
    }
    const saved = localStorage.getItem('nsg_employee_chat_rooms');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return {};
      }
    }
    return {};
  };

  const [rooms, setRooms] = useState(getInitialRooms);

  // Keep state synchronized with global database updates
  useEffect(() => {
    if (db?.employeeChatRooms) {
      setRooms(db.employeeChatRooms);
    }
  }, [db]);

  const [activeRoomId, setActiveRoomId] = useState('team-room');
  const [inputText, setInputText] = useState('');
  
  // Emoji & Attachment States
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  
  // Huddle States
  const [huddlePeer, setHuddlePeer] = useState(null);
  const [showHuddleCreator, setShowHuddleCreator] = useState(false);

  // Responsive UI States
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [mobileView, setMobileView] = useState('sidebar'); // 'sidebar' or 'chat'

  const chatEndRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Filter contacts to Sarah's team only (team_id === 'eng')
  const teammates = CONTACTS.filter((c) => c.teamId === 'eng');

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const mob = window.innerWidth < 768;
      setIsMobile(mob);
      if (!mob) setMobileView('chat');
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto Scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoomId, rooms]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('nsg_employee_chat_rooms', JSON.stringify(rooms));
  }, [rooms]);

  const chatChannels = db?.chatChannels && db.chatChannels.length > 0 ? db.chatChannels : DEFAULT_CHAT_CHANNELS;

  const activeRoom = chatChannels.find(c => c.id === activeRoomId) || rooms[activeRoomId] || (
    activeRoomId.startsWith('c') ? {
      id: activeRoomId,
      name: teammates.find((c) => c.id === activeRoomId)?.name || 'Teammate',
      type: 'dm',
      desc: `Direct chat with ${teammates.find((c) => c.id === activeRoomId)?.role || 'Teammate'}`,
      messages: []
    } : {
      id: activeRoomId,
      name: 'Corporate Channel',
      type: 'staff',
      messages: []
    }
  );

  // Start direct message
  const handleSelectDM = (contactId) => {
    if (!rooms[contactId]) {
      // Create a new DM room empty state
      const newDMRoom = {
        id: contactId,
        name: teammates.find((c) => c.id === contactId)?.name || 'Teammate',
        type: 'dm',
        messages: [
          { id: 999, sender: teammates.find((c) => c.id === contactId)?.name, text: 'Hey there! How can I help you today?', time: 'Just Now', isMe: false }
        ]
      };
      const newRooms = {
        ...rooms,
        [contactId]: newDMRoom
      };
      setRooms(newRooms);
      if (db && onUpdateDb) {
        onUpdateDb({ ...db, employeeChatRooms: newRooms });
      }
    }
    setActiveRoomId(contactId);
    if (isMobile) {
      setMobileView('chat');
    }
  };

  // Select standard room
  const handleSelectRoom = (roomId) => {
    setActiveRoomId(roomId);
    if (isMobile) {
      setMobileView('chat');
    }
  };

  // Send Message
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim() && attachedFiles.length === 0) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = {
      id: Date.now(),
      sender: 'Jane Smith',
      text: inputText.trim(),
      time: timeString,
      isMe: true,
      files: attachedFiles
    };

    const isCorporateChannel = chatChannels.some(c => c.id === activeRoomId);

    if (isCorporateChannel) {
      const updatedChannels = chatChannels.map(c => {
        if (c.id === activeRoomId) {
          return {
            ...c,
            messages: [...(c.messages || []), userMessage]
          };
        }
        return c;
      });
      onUpdateDb({ ...db, chatChannels: updatedChannels });
    } else {
      const updatedMessages = [...(activeRoom.messages || []), userMessage];
      const newRooms = {
        ...rooms,
        [activeRoomId]: {
          ...activeRoom,
          messages: updatedMessages
        }
      };
      setRooms(newRooms);
      if (db && onUpdateDb) {
        onUpdateDb({ ...db, employeeChatRooms: newRooms });
      } else {
        localStorage.setItem('nsg_employee_chat_rooms', JSON.stringify(newRooms));
      }
    }
    const sentText = inputText;
    setInputText('');
    setAttachedFiles([]);
    setShowEmojiPicker(false);

    // Bot Response Simulator
    setTimeout(() => {
      let replyText = "Awesome, received!";
      let senderName = activeRoom.name;

      if (activeRoom.type === 'grievance') {
        senderName = 'Sophia Reed (HR Officer)';
        if (sentText.toLowerCase().includes('resigned') || sentText.toLowerCase().includes('resignation')) {
          replyText = "I see your query relates to resignation. Please double check that you signed all pending Asset NOCs on the Asset Requests tab for HR processing.";
        } else if (sentText.toLowerCase().includes('salary') || sentText.toLowerCase().includes('payroll')) {
          replyText = "I have flagged this payroll query. Our accounts department will investigate and update you within 24 hours.";
        } else {
          replyText = "Thank you for sharing. I've logged this grievance query under private review. We will reach back out shortly.";
        }
      } else if (activeRoom.type === 'team' || activeRoomId === 'team-room') {
        const randMember = teammates[Math.floor(Math.random() * teammates.length)];
        senderName = randMember.name;
        replyText = `Thanks for the update Jane! Looks good, let's sync up later.`;
      } else if (activeRoom.type === 'dm') {
        const currentContact = teammates.find((c) => c.id === activeRoomId);
        senderName = currentContact ? currentContact.name : 'Teammate';
        replyText = `Hey Jane! Got your message. Let me review and get back to you soon.`;
      } else {
        return; // No bot response in general/ceo rooms
      }

      const botMessage = {
        id: Date.now() + 1,
        sender: senderName,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: false
      };

      if (isCorporateChannel) {
        const latestChannels = (db.chatChannels || []).map(c => {
          if (c.id === activeRoomId) {
            return {
              ...c,
              messages: [...(c.messages || []), botMessage]
            };
          }
          return c;
        });
        onUpdateDb({ ...db, chatChannels: latestChannels });
      } else {
        const currentRooms = db?.employeeChatRooms || rooms;
        const latestRoom = currentRooms[activeRoomId] || activeRoom;
        const finalRooms = {
          ...currentRooms,
          [activeRoomId]: {
            ...latestRoom,
            messages: [...(latestRoom.messages || []), botMessage]
          }
        };
        setRooms(finalRooms);
        if (db && onUpdateDb) {
          onUpdateDb({ ...db, employeeChatRooms: finalRooms });
        } else {
          localStorage.setItem('nsg_employee_chat_rooms', JSON.stringify(finalRooms));
        }
      }
    }, 1200);
  };

  // Emojis list
  const emojis = ['👍', '😂', '❤️', '🎉', '🔥', '👏', '😮', '🚀', '👀', '💡'];

  const appendEmoji = (emoji) => {
    setInputText((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAttachedFiles((prev) => [
      ...prev,
      {
        id: `file-${msgIdCounter++}`,
        name: file.name,
        type: 'image',
        url: previewUrl,
        size: formatBytes(file.size)
      }
    ]);
    e.target.value = '';
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setAttachedFiles((prev) => [
      ...prev,
      {
        id: `file-${msgIdCounter++}`,
        name: file.name,
        type: 'document',
        url: previewUrl,
        size: formatBytes(file.size)
      }
    ]);
    e.target.value = '';
  };

  // Triggering Huddle
  const handleLaunchHuddle = (targetPeerName) => {
    let peerInfo;
    if (activeRoom.type === 'dm') {
      const peerContact = teammates.find((c) => c.id === activeRoomId);
      peerInfo = {
        name: peerContact.name,
        avatar: peerContact.avatar,
        roomName: `1-on-1 with ${peerContact.name}`,
        channelId: activeRoomId
      };
    } else {
      // Find a teammate to host huddle with
      const host = teammates[0];
      peerInfo = {
        name: host ? host.name : (targetPeerName || 'Engineering Team'),
        avatar: host ? host.avatar : undefined,
        roomName: activeRoom.name,
        channelId: activeRoomId
      };
    }
    setHuddlePeer(peerInfo);
    setShowHuddleCreator(false);
  };

  const renderFileAttachment = (file, isMe) => {
    return (
      <div key={file.id || file.name} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {file.type === 'image' ? (
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: isMe ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid var(--border-color)', maxWidth: '240px' }}>
            <img 
              src={file.url} 
              alt={file.name} 
              style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', display: 'block', cursor: 'pointer' }}
              onClick={() => { if (file.url) window.open(file.url, '_blank'); }}
            />
            <div 
              style={{
                padding: '6px 10px',
                backgroundColor: 'rgba(15, 23, 42, 0.85)',
                fontSize: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ color: '#ffffff', fontWeight: '600', wordBreak: 'break-all' }}>{file.name}</span>
              <span style={{ fontSize: '9px', color: '#cbd5e1', flexShrink: 0 }}>{file.size}</span>
            </div>
          </div>
        ) : (
          <div 
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: isMe ? 'rgba(255, 255, 255, 0.08)' : 'var(--bg-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '11.5px',
              border: isMe ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--border-color)',
              maxWidth: '240px',
              cursor: 'pointer'
            }}
            onClick={() => {
              if (file.url) window.open(file.url, '_blank');
            }}
          >
            <FileText size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontWeight: '600', color: isMe ? '#ffffff' : 'var(--text-primary)', wordBreak: 'break-all' }}>
                {file.name}
              </span>
              <span style={{ fontSize: '9px', color: isMe ? '#cbd5e1' : 'var(--text-muted)' }}>{file.size}</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const mainEl = document.querySelector('.main-content');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, []);

  return (
    <div className="component-container" style={{ height: 'calc(100vh - 72px)', minHeight: '400px', display: 'flex', flexDirection: 'column', padding: '20px 24px 16px 24px', gap: '16px' }}>
      
      {/* Dynamic styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .messaging-grid {
          display: grid;
          grid-template-columns: 1fr;
          flex: 1;
          min-height: 0;
          border: 1px solid var(--border-color);
          border-radius: 12px;
          overflow: hidden;
          background-color: var(--bg-secondary);
          box-shadow: var(--shadow-sm);
        }

        @media (min-width: 768px) {
          .messaging-grid {
            grid-template-columns: 260px 1fr;
          }
        }

        .chat-sidebar {
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          background-color: var(--bg-secondary);
        }

        .chat-main {
          display: flex;
          flex-direction: column;
          background-color: var(--bg-primary);
        }

        .chat-msg-row {
          display: flex;
          gap: 12px;
          max-width: 80%;
          margin-bottom: 12px;
        }

        .chat-msg-row.me {
          align-self: flex-end;
          flex-direction: row-reverse;
        }

        .chat-bubble {
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 12.5px;
          line-height: 1.4;
          word-break: break-word;
        }

        .chat-bubble.me {
          background-color: var(--text-primary);
          color: var(--bg-secondary);
          border-top-right-radius: 2px;
        }

        .chat-bubble.other {
          background-color: var(--bg-secondary);
          color: var(--text-primary);
          border-top-left-radius: 2px;
          border: 1px solid var(--border-color);
        }

        .sidebar-item {
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid var(--border-color);
          border-left: 4px solid transparent;
        }

        .sidebar-item:hover {
          background-color: var(--bg-tertiary);
        }

        .sidebar-item.active {
          background-color: rgba(16, 185, 129, 0.05);
          border-left-color: #10b981;
        }

        /* Custom scrollbar styling */
        .chat-sidebar-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .chat-sidebar-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-sidebar-scroll::-webkit-scrollbar-thumb {
          background: var(--text-muted);
          border-radius: 4px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }
        .chat-sidebar-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-secondary);
          border: 2px solid transparent;
          background-clip: padding-box;
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

      <div className="component-header" style={{ marginBottom: '16px' }}>
        <div>
          <h1>Messaging & Meet Portal</h1>
          <p>Collaborate with teammates via Slack-like workspaces, DMs, or instant audio/video huddles.</p>
        </div>
      </div>

      {/* Main Messaging Interface */}
      <div className="messaging-grid">

        {/* 1. ROOMS & DIRECT MESSAGES SIDEBAR */}
        {(!isMobile || mobileView === 'sidebar') && (
          <div className="chat-sidebar">
            {/* Sidebar Title */}
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rooms & Channels
              </span>
              <button 
                type="button" 
                onClick={() => setShowHuddleCreator(true)}
                style={{
                  padding: '4px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Start Huddle"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Channels & Rooms List */}
            <div style={{ flex: 1, overflowY: 'auto' }} className="chat-sidebar-scroll">
              {(db.chatChannels || []).filter(c => c.members.includes('102')).map(c => {
                const isActive = activeRoomId === c.id;
                const isGrievance = c.type === 'grievance';
                return (
                  <div 
                    key={c.id}
                    className={`sidebar-item ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectRoom(c.id)}
                  >
                    <div 
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        backgroundColor: isGrievance ? 'rgba(139, 92, 246, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                        color: isGrievance ? 'hsl(265, 70%, 60%)' : 'hsl(150, 70%, 50%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isGrievance ? <Shield size={16} /> : <MessageCircle size={16} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{c.name}</span>
                        {isGrievance && (
                          <span 
                            style={{
                              fontSize: '9px',
                              fontWeight: '700',
                              backgroundColor: 'rgba(245, 158, 11, 0.08)',
                              color: 'var(--accent-gold)',
                              padding: '1px 4px',
                              borderRadius: '3px',
                              border: '1px solid rgba(245, 158, 11, 0.15)'
                            }}
                            title="SLA Response Time Limit"
                          >
                            SLA: 48h
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.label || 'Corporate Channel'}</span>
                    </div>
                  </div>
                );
              })}

              {/* Direct Messages Subheader */}
              <div style={{ padding: '14px 16px 6px 16px', fontSize: '10px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Direct Messages (Teammates)
              </div>

              {/* DM Contacts List */}
              {teammates.map((contact) => (
                <div 
                  key={contact.id}
                  className={`sidebar-item ${activeRoomId === contact.id ? 'active' : ''}`}
                  onClick={() => handleSelectDM(contact.id)}
                >
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={contact.avatar} 
                      alt={contact.name} 
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <Circle 
                      size={8} 
                      fill={contact.status === 'Online' ? '#10b981' : '#94a3b8'} 
                      color={contact.status === 'Online' ? '#10b981' : '#94a3b8'} 
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        border: '1.5px solid var(--bg-secondary)',
                        borderRadius: '50%'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{contact.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{contact.role}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Meeting Action Box */}
            <div style={{ padding: '16px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
              <button
                type="button"
                onClick={() => handleLaunchHuddle()}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                <Video size={13} />
                <span>[+ New Huddle]</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. MAIN CHAT PANE */}
        {(!isMobile || mobileView === 'chat') && (
          <div className="chat-main">
            {/* Chat Pane Header */}
            <div 
              style={{
                height: '60px',
                borderBottom: '1px solid var(--border-color)',
                padding: '0 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: 'var(--bg-secondary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                {isMobile && (
                  <button 
                    type="button"
                    onClick={() => setMobileView('sidebar')}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {activeRoom.name}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {activeRoom.desc || 'Active discussion'}
                  </span>
                </div>
              </div>

              {/* Start Huddle shortcut in chat window header */}
              <button
                type="button"
                onClick={() => handleLaunchHuddle(activeRoom.name)}
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.08)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  color: '#10b981',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s ease'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.15)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)'}
              >
                <Video size={12} />
                <span style={{ display: 'none', smDisplay: 'inline' }} className="huddle-label-btn">Start Huddle</span>
              </button>
              <style dangerouslySetInnerHTML={{ __html: `
                @media (min-width: 480px) {
                  .huddle-label-btn { display: inline !important; }
                }
              ` }} />
            </div>

            {/* Chat History Messages Scroll area */}
            <div 
              className="chat-history-scroll"
              style={{
                flex: 1,
                overflowY: 'scroll',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {activeRoom.messages && activeRoom.messages.length > 0 ? (
                activeRoom.messages.map((msg) => (
                  <div key={msg.id} className={`chat-msg-row ${msg.isMe ? 'me' : ''}`}>
                    {/* User profile initials/avatar */}
                    <div 
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: msg.isMe ? 'var(--bg-tertiary)' : '#8b5cf6',
                        backgroundImage: !msg.isMe && activeRoom.type === 'dm' ? `url(${teammates.find(c => c.name === msg.sender)?.avatar})` : 'none',
                        backgroundSize: 'cover',
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: '700',
                        flexShrink: 0
                      }}
                    >
                      {msg.isMe ? 'SJ' : (msg.sender ? msg.sender.substring(0, 2).toUpperCase() : 'DM')}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: msg.isMe ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {msg.sender}
                        </span>
                        <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                          {msg.time}
                        </span>
                      </div>
                      <div className={`chat-bubble ${msg.isMe ? 'me' : 'other'}`}>
                        {msg.text}
                        
                        {/* File details if attached */}
                        {(msg.files || msg.file) && (
                          <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {msg.file && renderFileAttachment(msg.file, msg.isMe)}
                            {msg.files && msg.files.map((file) => renderFileAttachment(file, msg.isMe))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ margin: 'auto', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <MessageSquare size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>No Messages Yet</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px' }}>Be the first to send a message in this channel.</p>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Files attached indicator preview bar */}
            {attachedFiles.length > 0 && (
              <div 
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'var(--bg-secondary)',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                {attachedFiles.map((file) => (
                  <div 
                    key={file.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      color: 'var(--text-primary)',
                      backgroundColor: 'var(--bg-tertiary)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-color)'
                    }}
                  >
                    {file.type === 'image' ? <Image size={12} color="#10b981" /> : <FileText size={12} color="#3b82f6" />}
                    <span style={{ fontWeight: '600', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.name}
                    </span>
                    <span style={{ fontSize: '9px', opacity: 0.7 }}>({file.size})</span>
                    <button 
                      type="button" 
                      onClick={() => setAttachedFiles((prev) => prev.filter((f) => f.id !== file.id))}
                      style={{ 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer', 
                        color: 'var(--text-muted)', 
                        display: 'flex', 
                        padding: '4px',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s ease, color 0.2s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                        e.currentTarget.style.color = '#ef4444';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-muted)';
                      }}
                      title="Remove attachment"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Input form panel */}
            <div 
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                position: 'relative'
              }}
            >
              {/* Emoji Picker Popover */}
              {showEmojiPicker && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '60px',
                    left: '16px',
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 100
                  }}
                >
                  {emojis.map((emoji) => (
                    <button 
                      key={emoji}
                      type="button" 
                      onClick={() => appendEmoji(emoji)}
                      style={{
                        border: 'none',
                        background: 'none',
                        fontSize: '16px',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px'
                      }}
                      className="emoji-item-btn"
                    >
                      {emoji}
                    </button>
                  ))}
                  <style dangerouslySetInnerHTML={{ __html: `
                    .emoji-item-btn:hover { background-color: var(--bg-tertiary); }
                  ` }} />
                </div>
              )}

              <form onSubmit={handleSendMessage} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Hidden File Inputs */}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  ref={imageInputRef} 
                  onChange={handleImageUpload} 
                />
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt" 
                  style={{ display: 'none' }} 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />

                {/* Attach File Button */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Attach Image"
                  >
                    <Image size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      border: 'none',
                      background: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Attach PDF"
                  >
                    <Paperclip size={16} />
                  </button>
                </div>

                {/* Text Message Input */}
                <input 
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={`Message ${activeRoom.name}...`}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '12px',
                    outline: 'none'
                  }}
                />

                {/* Toggle Emoji picker */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  style={{
                    border: 'none',
                    background: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Insert Emoji"
                >
                  <Smile size={16} />
                </button>

                {/* Submit button */}
                <button
                  type="submit"
                  style={{
                    backgroundColor: 'var(--text-primary)',
                    color: 'var(--bg-secondary)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                    flexShrink: 0
                  }}
                  title="Send Message"
                >
                  <Send size={13} style={{ marginLeft: '1px' }} />
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* 3. POPUP SELECTION MODAL FOR HUDDLE CREATOR */}
      {showHuddleCreator && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div 
            style={{
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '360px',
              padding: '20px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                Start Huddle with Teammate
              </h4>
              <button 
                type="button" 
                onClick={() => setShowHuddleCreator(false)}
                style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
              {teammates.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleLaunchHuddle(c.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '6px',
                    width: '100%',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                  className="creator-teammate-btn"
                >
                  <img src={c.avatar} alt={c.name} style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>{c.name}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{c.role}</span>
                  </div>
                </button>
              ))}
              <style dangerouslySetInnerHTML={{ __html: `
                .creator-teammate-btn:hover { background-color: var(--bg-tertiary) !important; }
              ` }} />
            </div>

            <button
              type="button"
              onClick={() => handleLaunchHuddle('Engineering Team')}
              style={{
                width: '100%',
                padding: '10px',
                backgroundColor: 'var(--text-primary)',
                color: 'var(--bg-secondary)',
                border: 'none',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Start General Scrum Huddle
            </button>
          </div>
        </div>
      )}

      {/* 4. HIGH FIDELITY HUDDLE OVERLAY MODAL */}
      {huddlePeer && (
        <HuddleModal 
          peer={huddlePeer} 
          onClose={() => setHuddlePeer(null)} 
        />
      )}
    </div>
  );
}
