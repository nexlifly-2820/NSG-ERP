import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Hash, Send, Plus, Search, Sparkles, X, PhoneCall, ChevronDown, ChevronUp, 
  Video, Mic, VideoOff, MicOff, Monitor, Volume2, Trash2, PhoneOff, Users, 
  Smile, Hand, MoreVertical, MessageSquare, Paperclip, Clock, PictureInPicture,
  Maximize, Activity, Settings, AlertOctagon, Heart, ThumbsUp
} from 'lucide-react';
import HuddleModal from '../../employee/HuddleModal';
import '../CEO.css';

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

export default function Messaging({ initialSelectedChannel, db, onUpdateDb }) {
  const [huddlePeer, setHuddlePeer] = useState(null);
  
  // === MOCK DATA ===
  const chatChannels = db?.chatChannels && db.chatChannels.length > 0 ? db.chatChannels : DEFAULT_CHAT_CHANNELS;
  const myChannels = chatChannels.filter(c => c.members.includes('ceo'));

  const [selectedChannel, setSelectedChannel] = useState(() => {
    if (initialSelectedChannel) return initialSelectedChannel;
    return myChannels.length > 0 ? myChannels[0].id : 'general';
  });

  const [employees, setEmployees] = useState([
    { id: 1, name: 'Alice Chen', avatar: 'https://ui-avatars.com/api/?name=Alice+Chen&background=0D8ABC&color=fff', status: 'Active' },
    { id: 2, name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', status: 'Active' },
    { id: 3, name: 'Michael Chang', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', status: 'Active' },
    { id: 4, name: 'Emily Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100', status: 'Active' },
    { id: 5, name: 'David Miller', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', status: 'On Leave' },
    { id: 'ceo', name: 'John Doe', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=1e293b&color=fff', status: 'Active', isMe: true }
  ]);

  const [localDmMessages, setLocalDmMessages] = useState({
    'dm-3': [
      { id: 1, sender: 'John Doe (CEO)', avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=1e293b&color=fff', text: 'Hi Michael, did you get a chance to look at the onboarding tasks?', timestamp: 'Yesterday', isMe: true },
      { id: 2, sender: 'Michael Chang', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', text: 'Yes Sarah! Finished the database structures and directory mappings.', timestamp: 'Yesterday' }
    ]
  });

  const currentChannel = chatChannels.find(c => c.id === selectedChannel);

  const messages = useMemo(() => {
    if (currentChannel) {
      return { [selectedChannel]: (currentChannel.messages || []) };
    }
    return localDmMessages;
  }, [currentChannel, selectedChannel, localDmMessages]);

  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef(null);

  // === CHANNEL MANAGEMENT ===
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [channelMembers, setChannelMembers] = useState({
    'announcements': [1, 2, 3, 4, 5],
    'general': [1, 2, 3, 4, 5],
    'dev-team': [1, 3],
    'hr-room': [2, 4]
  });
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');

  const [isChannelMenuOpen, setIsChannelMenuOpen] = useState(false);
  const [isEditChannelOpen, setIsEditChannelOpen] = useState(false);
  const [editChannelName, setEditChannelName] = useState('');

  // === CALL STATE ===
  const [isInCall, setIsInCall] = useState(false);
  const [isCallExpanded, setIsCallExpanded] = useState(false);
  const [activeCallParticipants, setActiveCallParticipants] = useState([]);
  const [offlineCallParticipants, setOfflineCallParticipants] = useState([]);

  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);
  
  const [callScreenMic, setCallScreenMic] = useState(true);
  const [callScreenCamera, setCallScreenCamera] = useState(true);
  const [callScreenShare, setCallScreenShare] = useState(false);
  
  // Dragging the PIP modal
  const [callPosition, setCallPosition] = useState({ x: 0, y: 0 });
  const [isDraggingCall, setIsDraggingCall] = useState(false);
  const callDragStart = useRef({ x: 0, y: 0 });

  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const callCameraVideoRef = useRef(null);
  const screenVideoRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChannel]);

  // Call duration timer
  useEffect(() => {
    if (isInCall) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => setCallDuration(prev => prev + 1), 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [isInCall]);

  const formatDuration = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  // Chat Send
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);

    const newMsg = {
      id: Date.now(),
      sender: 'John Doe (CEO)',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=1e293b&color=fff',
      text: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    if (isCorporateChannel) {
      const updatedChannels = chatChannels.map(c => {
        if (c.id === selectedChannel) {
          return {
            ...c,
            messages: [...(c.messages || []), newMsg]
          };
        }
        return c;
      });
      onUpdateDb({ ...db, chatChannels: updatedChannels });
    } else {
      setLocalDmMessages(prev => ({
        ...prev,
        [selectedChannel]: [...(prev[selectedChannel] || []), newMsg]
      }));
    }
    setInputVal('');

    // Simulated reply
    setTimeout(() => {
      const isDM = selectedChannel.startsWith('dm-');
      if (isDM) {
        const senderName = employees.find(e => `dm-${e.id}` === selectedChannel)?.name || 'Colleague';
        const senderAvatar = employees.find(e => `dm-${e.id}` === selectedChannel)?.avatar;

        const autoReply = {
          id: Date.now() + 1,
          sender: senderName,
          avatar: senderAvatar,
          text: 'Got it! I will check that out shortly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setLocalDmMessages(prev => ({
          ...prev,
          [selectedChannel]: [...(prev[selectedChannel] || []), autoReply]
        }));
      }
    }, 2000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);

    const newMsg = {
      id: Date.now(),
      sender: 'John Doe (CEO)',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=1e293b&color=fff',
      text: `📎 Shared file: ${file.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    if (isCorporateChannel) {
      const updatedChannels = chatChannels.map(c => {
        if (c.id === selectedChannel) {
          return {
            ...c,
            messages: [...(c.messages || []), newMsg]
          };
        }
        return c;
      });
      onUpdateDb({ ...db, chatChannels: updatedChannels });
    } else {
      setLocalDmMessages(prev => ({
        ...prev,
        [selectedChannel]: [...(prev[selectedChannel] || []), newMsg]
      }));
    }
  };

  // Start Call WebRTC
  const handleStartCall = () => {
    setHuddlePeer({
      channelId: selectedChannel,
      roomName: isDM ? `DM-${employees.find(e => `dm-${e.id}` === selectedChannel)?.name}` : selectedChannel,
      name: selectedChannel,
      displayName: 'John Doe (CEO)'
    });

    const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);
    const callMsg = {
      id: Date.now(),
      sender: 'John Doe (CEO)',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=1e293b&color=fff',
      text: `Started a video call`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCallStatus: true,
      isMe: true
    };

    if (isCorporateChannel) {
      const updatedChannels = chatChannels.map(c => {
        if (c.id === selectedChannel) {
          return {
            ...c,
            messages: [...(c.messages || []), callMsg]
          };
        }
        return c;
      });
      onUpdateDb({ ...db, chatChannels: updatedChannels });
    } else {
      setLocalDmMessages(prev => ({
        ...prev,
        [selectedChannel]: [...(prev[selectedChannel] || []), callMsg]
      }));
    }
  };

  // Re-attach video stream if component re-renders
  useEffect(() => {
    if (isInCall && callCameraVideoRef.current && cameraStreamRef.current) {
      if (callCameraVideoRef.current.srcObject !== cameraStreamRef.current) {
        callCameraVideoRef.current.srcObject = cameraStreamRef.current;
        callCameraVideoRef.current.play().catch(() => {});
      }
    }
    if (isInCall && screenVideoRef.current && screenStreamRef.current) {
      if (screenVideoRef.current.srcObject !== screenStreamRef.current) {
        screenVideoRef.current.srcObject = screenStreamRef.current;
        screenVideoRef.current.play().catch(() => {});
      }
    }
  }, [isInCall, callScreenCamera, callScreenShare]);

  const handleEndCall = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setIsInCall(false);
    setIsCallExpanded(false);
    setCallScreenShare(false);
  };

  const toggleScreenShare = async () => {
    if (callScreenShare) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      screenStreamRef.current = null;
      setCallScreenShare(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = stream;
        setCallScreenShare(true);
        stream.getVideoTracks()[0].addEventListener('ended', () => {
          setCallScreenShare(false);
          screenStreamRef.current = null;
        });
      } catch (err) {
        console.warn('Screen share denied', err);
      }
    }
  };

  // Call dragging logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingCall) return;
      setCallPosition({
        x: e.clientX - callDragStart.current.x,
        y: e.clientY - callDragStart.current.y
      });
    };
    const handleMouseUp = () => setIsDraggingCall(false);

    if (isDraggingCall) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingCall]);

  const handleCallMouseDown = (e) => {
    if (e.target.closest('button')) return; // don't drag if clicking buttons
    setIsDraggingCall(true);
    callDragStart.current = {
      x: e.clientX - callPosition.x,
      y: e.clientY - callPosition.y
    };
  };

  // Create Channel logic
  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    
    const formattedName = newChannelName.startsWith('#') ? newChannelName.trim() : `#${newChannelName.trim()}`;
    const newId = formattedName.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/^-+|-+$/g, '');
    
    if (chatChannels.some(c => c.id === newId)) {
      alert('A channel with this name already exists.');
      return;
    }
    
    const newChan = {
      id: newId,
      name: formattedName,
      label: `${newChannelName} Channel`,
      type: 'staff',
      members: ['101', '102', '103', '104', '105', 'hr', 'ceo'],
      messages: [
        {
          id: Date.now(),
          sender: 'System',
          text: `Channel ${formattedName} created by CEO John Doe.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    
    const updated = [...chatChannels, newChan];
    onUpdateDb({ ...db, chatChannels: updated });
    
    setNewChannelName('');
    setIsCreateChannelOpen(false);
    setSelectedChannel(newId);
  };

  // Add Member logic
  const toggleMemberInChannel = (empId) => {
    setChannelMembers(prev => {
      const currentMembers = prev[selectedChannel] || [];
      if (currentMembers.includes(empId)) {
        return { ...prev, [selectedChannel]: currentMembers.filter(id => id !== empId) };
      } else {
        return { ...prev, [selectedChannel]: [...currentMembers, empId] };
      }
    });
  };

  // Edit/Delete Channel logic
  const handleEditChannel = (e) => {
    e.preventDefault();
    if (!editChannelName.trim()) return;
    const formattedName = editChannelName.toLowerCase().replace(/\s+/g, '-');
    if(formattedName !== selectedChannel && channels.includes(formattedName)) {
      alert("Channel name already exists.");
      return;
    }
    
    setChannels(prev => prev.map(c => c === selectedChannel ? formattedName : c));
    setChannelMembers(prev => {
      const next = { ...prev };
      next[formattedName] = next[selectedChannel];
      if (formattedName !== selectedChannel) delete next[selectedChannel];
      return next;
    });
    setMessages(prev => {
      const next = { ...prev };
      next[formattedName] = next[selectedChannel];
      if (formattedName !== selectedChannel) delete next[selectedChannel];
      return next;
    });
    
    setSelectedChannel(formattedName);
    setIsEditChannelOpen(false);
  };

  const handleDeleteChannel = () => {
    if (channels.length <= 1) {
      alert("You cannot delete the last channel.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete #${selectedChannel}?`)) {
      const newChannels = channels.filter(c => c !== selectedChannel);
      setChannels(newChannels);
      setSelectedChannel(newChannels[0]);
    }
    setIsChannelMenuOpen(false);
  };

  // Add Guest logic
  const handleAddGuest = (e) => {
    e.preventDefault();
    if(!newGuestName.trim() || !newGuestPhone.trim()) return;
    
    const newGuestId = Date.now();
    const guestObj = {
      id: newGuestId,
      name: newGuestName.trim() + ' (Guest)',
      phone: newGuestPhone.trim(),
      avatar: `https://ui-avatars.com/api/?name=${newGuestName.replace(/\s+/g, '+')}&background=F59E0B&color=fff`,
      status: 'Active'
    };
    
    setEmployees(prev => [...prev, guestObj]);
    setChannelMembers(prev => ({
      ...prev,
      [selectedChannel]: [...(prev[selectedChannel] || []), newGuestId]
    }));
    
    setNewGuestName('');
    setNewGuestPhone('');
  };

  // Get current members for header
  const isDM = selectedChannel.startsWith('dm-');
  const currentMembersCount = isDM ? 2 : (channelMembers[selectedChannel]?.length || 1);

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden', background: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--ceo-border)' }}>
      
      {/* === LEFT SIDEBAR === */}
      <div style={{ width: '280px', background: '#FFFFFF', borderRight: '1px solid var(--ceo-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--ceo-border)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ceo-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} color="var(--ceo-primary)" /> Team Chat
          </h2>
          <div style={{ position: 'relative', marginTop: '16px' }}>
            <Search size={14} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input type="text" placeholder="Search messages..." className="ceo-form-input" style={{ width: '100%', paddingLeft: '32px', height: '34px', fontSize: '13px' }} />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingLeft: '8px', paddingRight: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)', letterSpacing: '0.5px' }}>CHANNELS</div>
            <button onClick={() => setIsCreateChannelOpen(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ceo-text-secondary)' }}><Plus size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px' }}>
            {myChannels.map(chan => (
              <div 
                key={chan.id} 
                onClick={() => setSelectedChannel(chan.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                  background: selectedChannel === chan.id ? '#EFF6FF' : 'transparent',
                  color: selectedChannel === chan.id ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                  fontWeight: selectedChannel === chan.id ? 700 : 600,
                  fontSize: '14px', transition: 'all 0.2s'
                }}
              >
                <Hash size={16} /> {chan.name}
              </div>
            ))}
          </div>

          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)', marginBottom: '8px', paddingLeft: '8px', letterSpacing: '0.5px' }}>DIRECT MESSAGES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {employees.filter(e => !e.isMe).map(emp => {
              const dmId = `dm-${emp.id}`;
              const isSelected = selectedChannel === dmId;
              return (
                <div 
                  key={dmId} 
                  onClick={() => setSelectedChannel(dmId)}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                    background: isSelected ? '#EFF6FF' : 'transparent',
                    color: isSelected ? 'var(--ceo-primary)' : 'var(--ceo-text-secondary)',
                    fontWeight: isSelected ? 700 : 600,
                    fontSize: '14px', transition: 'all 0.2s'
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={emp.avatar} alt={emp.name} style={{ width: '24px', height: '24px', borderRadius: '12px' }} />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: '8px', height: '8px', borderRadius: '4px', background: emp.status === 'Active' ? 'var(--ceo-success)' : 'var(--ceo-warning)', border: '2px solid #FFF' }}></div>
                  </div>
                  {emp.name}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* === MAIN CHAT AREA === */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#FFF' }}>
        
        {/* Chat Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#FFF' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ceo-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isDM ? <span style={{ color: 'var(--ceo-primary)' }}>@</span> : <Hash size={20} color="var(--ceo-text-muted)" />}
              {isDM ? employees.find(e => `dm-${e.id}` === selectedChannel)?.name : selectedChannel}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)', fontWeight: 500, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Users size={12} /> {currentMembersCount} members
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
            {!isDM && (
              <button onClick={() => setIsAddMemberOpen(true)} className="ceo-btn" style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid var(--ceo-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--ceo-primary)" /> Members
              </button>
            )}
            <button onClick={handleStartCall} className="ceo-btn" style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid var(--ceo-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={16} color="var(--ceo-primary)" /> Video Call
            </button>
            {!isDM && (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setIsChannelMenuOpen(!isChannelMenuOpen)} className="ceo-btn" style={{ padding: '8px', background: '#F8FAFC', border: '1px solid var(--ceo-border)' }}><MoreVertical size={16} /></button>
                {isChannelMenuOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: '8px', background: '#FFF', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '1px solid var(--ceo-border)', zIndex: 100, width: '150px', overflow: 'hidden' }}>
                    <button 
                      onClick={() => { setEditChannelName(selectedChannel); setIsEditChannelOpen(true); setIsChannelMenuOpen(false); }} 
                      style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}
                    >Edit Channel Name</button>
                    <button 
                      onClick={handleDeleteChannel}
                      style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--ceo-danger)', borderTop: '1px solid var(--ceo-divider)' }}
                    >Delete Channel</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Messages Feed */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#F8FAFC' }}>
          {(messages[selectedChannel] || []).length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--ceo-text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
              <div style={{ fontSize: '16px', fontWeight: 600 }}>No messages yet</div>
              <div style={{ fontSize: '13px' }}>Start the conversation!</div>
            </div>
          ) : (
            (messages[selectedChannel] || []).map((msg, idx) => {
              const isMsgMe = msg.isMe || (msg.sender && (msg.sender.includes('CEO') || msg.sender.includes('John Doe')));
              return (
                <div key={msg.id || idx} style={{ display: 'flex', gap: '16px', flexDirection: isMsgMe ? 'row-reverse' : 'row' }}>
                  <img src={msg.avatar} alt={msg.sender} style={{ width: '36px', height: '36px', borderRadius: '18px', border: '1px solid var(--ceo-border)', flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMsgMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexDirection: isMsgMe ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ceo-text-primary)' }}>{isMsgMe ? 'You' : msg.sender}</span>
                      <span style={{ fontSize: '11px', color: 'var(--ceo-text-muted)' }}>{msg.timestamp || msg.time}</span>
                    </div>
                    <div style={{ 
                      background: isMsgMe ? 'var(--ceo-primary)' : '#FFF', 
                      color: isMsgMe ? '#FFF' : 'var(--ceo-text-primary)',
                      padding: '12px 16px', borderRadius: '12px', border: isMsgMe ? 'none' : '1px solid var(--ceo-border)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '14px', lineHeight: '1.5'
                    }}>
                      {msg.isCallStatus ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMsgMe ? '#FFF' : 'var(--ceo-primary)', fontWeight: '600' }}>
                          <Video size={16} />
                          <span>{msg.text}</span>
                          <button 
                            type="button" 
                            style={{ marginLeft: '12px', padding: '6px 16px', borderRadius: '6px', backgroundColor: isMsgMe ? '#FFF' : 'var(--ceo-primary)', color: isMsgMe ? 'var(--ceo-primary)' : 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                            onClick={() => {
                              setHuddlePeer({
                                channelId: selectedChannel,
                                roomName: selectedChannel,
                                name: selectedChannel,
                                displayName: 'John Doe (CEO)'
                              });
                            }}
                          >
                            Join
                          </button>
                        </div>
                      ) : msg.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input */}
        <div style={{ padding: '20px 24px', background: '#FFF', borderTop: '1px solid var(--ceo-border)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--ceo-border)' }}>
            <label style={{ cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
              <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
              <Paperclip size={18} color="var(--ceo-text-muted)" />
            </label>
            <input 
              type="text" 
              value={inputVal} 
              onChange={e => setInputVal(e.target.value)} 
              placeholder={`Message ${selectedChannel.startsWith('dm-') ? '@' + employees.find(e => `dm-${e.id}` === selectedChannel)?.name : '#' + selectedChannel}`}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', padding: '8px 0', color: 'var(--ceo-text-primary)' }} 
            />
            <button type="button" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}><Smile size={18} color="var(--ceo-text-muted)" /></button>
            <button type="submit" disabled={!inputVal.trim()} style={{ background: inputVal.trim() ? 'var(--ceo-primary)' : '#E2E8F0', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: inputVal.trim() ? 'pointer' : 'not-allowed', color: '#FFF', fontWeight: 600, transition: 'all 0.2s' }}>Send</button>
          </form>
        </div>
      </div>

      {/* === FLOATING CALL OVERLAY / PIP === */}
      {isInCall && !isCallExpanded && (
        <div 
          onMouseDown={handleCallMouseDown}
          style={{ 
            position: 'absolute', top: 20 + callPosition.y, right: 20 - callPosition.x, zIndex: 1000,
            width: '380px', background: '#0F172A', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
            border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column',
            cursor: isDraggingCall ? 'grabbing' : 'grab', transition: isDraggingCall ? 'none' : 'box-shadow 0.2s'
          }}
        >
          {/* Call Header */}
          <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '4px', background: 'var(--ceo-danger)', animation: 'pulse 2s infinite' }}></div>
              <span style={{ color: '#FFF', fontSize: '12px', fontWeight: 700 }}>{formatDuration(callDuration)}</span>
            </div>
            <div style={{ color: '#FFF', fontSize: '13px', fontWeight: 700 }}>Meeting: {selectedChannel}</div>
            <button onClick={() => setIsCallExpanded(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <Maximize size={16} color="#94A3B8" />
            </button>
          </div>

          {/* Video Area */}
          <div style={{ position: 'relative', width: '100%', height: '220px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Screen Share takes priority if active */}
            {callScreenShare ? (
              <video ref={screenVideoRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted />
            ) : (
              callScreenCamera ? (
                <video ref={callCameraVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} muted />
              ) : (
                <div style={{ width: '80px', height: '80px', borderRadius: '40px', background: 'var(--ceo-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#FFF', fontWeight: 700 }}>SJ</div>
              )
            )}

            {/* Small floating PIP of yourself if screen sharing */}
            {callScreenShare && callScreenCamera && (
               <div style={{ position: 'absolute', bottom: '12px', right: '12px', width: '80px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '2px solid #FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                 <video ref={callCameraVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} muted />
               </div>
            )}

            {/* Mic muted indicator on video */}
            {!callScreenMic && (
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(0,0,0,0.6)', padding: '6px', borderRadius: '20px' }}>
                <MicOff size={14} color="#EF4444" />
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div style={{ padding: '16px', display: 'flex', justifyContent: 'center', gap: '16px', background: '#1E293B' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setCallScreenMic(!callScreenMic); }} 
              style={{ width: '44px', height: '44px', borderRadius: '22px', border: 'none', cursor: 'pointer', background: callScreenMic ? '#334155' : 'var(--ceo-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              {callScreenMic ? <Mic size={20} color="#FFF" /> : <MicOff size={20} color="#FFF" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setCallScreenCamera(!callScreenCamera); }} 
              style={{ width: '44px', height: '44px', borderRadius: '22px', border: 'none', cursor: 'pointer', background: callScreenCamera ? '#334155' : 'var(--ceo-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              {callScreenCamera ? <Video size={20} color="#FFF" /> : <VideoOff size={20} color="#FFF" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleScreenShare(); }} 
              style={{ width: '44px', height: '44px', borderRadius: '22px', border: 'none', cursor: 'pointer', background: callScreenShare ? 'var(--ceo-success)' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              <Monitor size={20} color="#FFF" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleEndCall(); }} 
              style={{ width: '56px', height: '44px', borderRadius: '22px', border: 'none', cursor: 'pointer', background: 'var(--ceo-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              <PhoneOff size={20} color="#FFF" />
            </button>
          </div>
        </div>
      )}

      {/* === FULL SCREEN CALL MODE === */}
      {isInCall && isCallExpanded && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: '#0F172A', zIndex: 3000, display: 'flex', flexDirection: 'column' }}>
          
          {/* Header */}
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '5px', background: 'var(--ceo-danger)', animation: 'pulse 2s infinite' }}></div>
              <span style={{ color: '#FFF', fontSize: '14px', fontWeight: 700 }}>{formatDuration(callDuration)}</span>
              <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.2)' }}></div>
              <span style={{ color: '#E2E8F0', fontSize: '16px', fontWeight: 600 }}>Meeting: {selectedChannel}</span>
            </div>
            <button onClick={() => setIsCallExpanded(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#94A3B8' }}>
              <ChevronDown size={20} /> <span style={{ fontWeight: 600 }}>Minimize</span>
            </button>
          </div>

          {/* Main Content Area (Video Grid + Sidebar) */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            
            {/* Video Grid */}
            <div style={{ flex: 1, padding: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center', alignItems: 'center', alignContent: 'center', overflowY: 'auto' }}>
              {activeCallParticipants.map(id => {
                const emp = employees.find(e => e.id === id);
                if (!emp) return null;
                
                const isMe = emp.isMe;
                return (
                  <div key={id} style={{ 
                    position: 'relative', width: activeCallParticipants.length > 2 ? '45%' : '80%', height: activeCallParticipants.length > 2 ? '45%' : '60%', 
                    background: '#1E293B', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                  }}>
                    {isMe ? (
                      <>
                        {callScreenShare ? (
                           <video ref={screenVideoRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted />
                        ) : (
                          callScreenCamera ? (
                            <video ref={callCameraVideoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} muted />
                          ) : (
                            <div style={{ width: '120px', height: '120px', borderRadius: '60px', background: 'var(--ceo-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', color: '#FFF', fontWeight: 700 }}>SJ</div>
                          )
                        )}
                        {!callScreenMic && (
                          <div style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', padding: '8px', borderRadius: '20px' }}>
                            <MicOff size={16} color="#EF4444" />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <img src={emp.avatar} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 40%)' }}></div>
                      </>
                    )}
                    
                    {/* Participant Name Tag */}
                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '8px', color: '#FFF', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {emp.name} {isMe && '(You)'}
                      {!isMe && <Mic size={14} color="#10B981" />} {/* Fake active mic for others */}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Participants Sidebar */}
            <div style={{ width: '320px', background: '#1E293B', borderLeft: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#FFF', fontSize: '16px', fontWeight: 700, margin: 0 }}>Participants ({currentMembersCount})</h3>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                
                {/* Active in Call */}
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '12px', letterSpacing: '0.5px' }}>IN CALL ({activeCallParticipants.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                  {activeCallParticipants.map(id => {
                    const emp = employees.find(e => e.id === id);
                    if(!emp) return null;
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={emp.avatar} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '18px' }} />
                          <div style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 600 }}>{emp.name} {emp.isMe && '(You)'}</div>
                        </div>
                        {emp.isMe ? (callScreenMic ? <Mic size={16} color="#10B981" /> : <MicOff size={16} color="#EF4444" />) : <Mic size={16} color="#10B981" />}
                      </div>
                    );
                  })}
                </div>

                {/* Offline / Not Joined */}
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', marginBottom: '12px', letterSpacing: '0.5px' }}>OFFLINE / NOT JOINED ({offlineCallParticipants.length})</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {offlineCallParticipants.map(id => {
                    const emp = employees.find(e => e.id === id);
                    if(!emp) return null;
                    return (
                      <div key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: 0.5 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img src={emp.avatar} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '18px', filter: 'grayscale(100%)' }} />
                          <div style={{ color: '#F8FAFC', fontSize: '14px', fontWeight: 600 }}>{emp.name}</div>
                        </div>
                        <div style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 600 }}>Offline</div>
                      </div>
                    );
                  })}
                </div>

              </div>
            </div>

          </div>

          {/* Bottom Controls */}
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', background: '#0F172A', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button 
              onClick={(e) => { e.stopPropagation(); setCallScreenMic(!callScreenMic); }} 
              style={{ width: '56px', height: '56px', borderRadius: '28px', border: 'none', cursor: 'pointer', background: callScreenMic ? '#334155' : 'var(--ceo-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              {callScreenMic ? <Mic size={24} color="#FFF" /> : <MicOff size={24} color="#FFF" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); setCallScreenCamera(!callScreenCamera); }} 
              style={{ width: '56px', height: '56px', borderRadius: '28px', border: 'none', cursor: 'pointer', background: callScreenCamera ? '#334155' : 'var(--ceo-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              {callScreenCamera ? <Video size={24} color="#FFF" /> : <VideoOff size={24} color="#FFF" />}
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); toggleScreenShare(); }} 
              style={{ width: '56px', height: '56px', borderRadius: '28px', border: 'none', cursor: 'pointer', background: callScreenShare ? 'var(--ceo-success)' : '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              <Monitor size={24} color="#FFF" />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); handleEndCall(); }} 
              style={{ width: '80px', height: '56px', borderRadius: '28px', border: 'none', cursor: 'pointer', background: 'var(--ceo-danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
            >
              <PhoneOff size={24} color="#FFF" />
            </button>
          </div>
        </div>
      )}

      {/* === MODALS === */}
      {/* Create Channel Modal */}
      {isCreateChannelOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#FFF', width: '400px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ceo-text-primary)' }}>Create New Channel</h3>
              <button onClick={() => setIsCreateChannelOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} color="var(--ceo-text-muted)" /></button>
            </div>
            <form onSubmit={handleCreateChannel} style={{ padding: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>CHANNEL NAME</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '0 12px' }}>
                <Hash size={16} color="var(--ceo-text-muted)" />
                <input 
                  autoFocus
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="e.g. marketing-campaign" 
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '12px', fontSize: '14px', outline: 'none' }} 
                />
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsCreateChannelOpen(false)} className="ceo-btn" style={{ fontWeight: 700 }}>Cancel</button>
                <button type="submit" className="ceo-btn ceo-btn-primary" style={{ fontWeight: 700 }}>Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Channel Modal */}
      {isEditChannelOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#FFF', width: '400px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ceo-text-primary)' }}>Edit Channel Name</h3>
              <button onClick={() => setIsEditChannelOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} color="var(--ceo-text-muted)" /></button>
            </div>
            <form onSubmit={handleEditChannel} style={{ padding: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>NEW CHANNEL NAME</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#F8FAFC', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '0 12px' }}>
                <Hash size={16} color="var(--ceo-text-muted)" />
                <input 
                  autoFocus
                  required
                  value={editChannelName}
                  onChange={(e) => setEditChannelName(e.target.value)}
                  placeholder="e.g. marketing-campaign" 
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '12px', fontSize: '14px', outline: 'none' }} 
                />
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => setIsEditChannelOpen(false)} className="ceo-btn" style={{ fontWeight: 700 }}>Cancel</button>
                <button type="submit" className="ceo-btn ceo-btn-primary" style={{ fontWeight: 700 }}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {isAddMemberOpen && !isDM && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div style={{ background: '#FFF', width: '500px', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ceo-text-primary)' }}>Manage Members</h3>
                <div style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)' }}>#{selectedChannel}</div>
              </div>
              <button onClick={() => setIsAddMemberOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} color="var(--ceo-text-muted)" /></button>
            </div>
            
            <form onSubmit={handleAddGuest} style={{ padding: '16px', borderBottom: '1px solid var(--ceo-divider)', background: '#F8FAFC' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)', marginBottom: '12px', letterSpacing: '0.5px' }}>INVITE GUEST BY PHONE</div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input required value={newGuestName} onChange={e=>setNewGuestName(e.target.value)} type="text" placeholder="Guest Name" className="ceo-form-input" style={{ flex: 1, height: '36px', fontSize: '13px' }} />
                <input required value={newGuestPhone} onChange={e=>setNewGuestPhone(e.target.value)} type="text" placeholder="+91 Phone Number" className="ceo-form-input" style={{ flex: 1, height: '36px', fontSize: '13px' }} />
                <button type="submit" className="ceo-btn ceo-btn-primary" style={{ padding: '0 16px', fontWeight: 700 }}>Invite</button>
              </div>
            </form>

            <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0', background: '#FFF' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)', margin: '8px 16px', letterSpacing: '0.5px' }}>EXISTING EMPLOYEES</div>
              {employees.map(emp => {
                const isMember = (channelMembers[selectedChannel] || []).includes(emp.id);
                return (
                  <div key={emp.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--ceo-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img src={emp.avatar} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '16px' }} />
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}>{emp.name} {emp.isMe && '(You)'}</div>
                    </div>
                    <button 
                      onClick={() => toggleMemberInChannel(emp.id)}
                      disabled={emp.isMe}
                      className="ceo-btn" 
                      style={{ 
                        padding: '6px 12px', fontSize: '12px', fontWeight: 700, 
                        background: isMember ? 'transparent' : 'var(--ceo-primary)', 
                        color: isMember ? 'var(--ceo-text-secondary)' : '#FFF',
                        border: isMember ? '1px solid var(--ceo-border)' : 'none',
                        opacity: emp.isMe ? 0.5 : 1,
                        cursor: emp.isMe ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isMember ? 'Remove' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Basic inline styling for pulse animation */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
      {huddlePeer && (
        <HuddleModal 
          peer={huddlePeer} 
          onClose={() => setHuddlePeer(null)} 
        />
      )}
    </div>
  );
}
