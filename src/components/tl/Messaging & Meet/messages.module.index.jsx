// Crash fix applied
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  Hash, Send, Plus, Search, Sparkles, X, PhoneCall, ChevronDown, ChevronUp, 
  Video, Mic, VideoOff, MicOff, Monitor, Volume2, Trash2, PhoneOff, Users, 
  Smile, Hand, MoreVertical, MessageSquare, Paperclip, Clock, PictureInPicture,
  Maximize, Activity, Settings, AlertOctagon, Heart, ThumbsUp, Check, CheckCheck, Camera,
  Pin, Image
} from 'lucide-react';
import HuddleModal from '../../employee/HuddleModal';
import '../../ceo/CEO.css';
import EmojiPicker from 'emoji-picker-react';
import { Download, Copy } from 'lucide-react';

const DEFAULT_CHAT_CHANNELS = [];

export default function Messages({ initialSelectedChannel, currentUser }) {
  const tlName = currentUser?.name || 'Michael Vance';
  const [huddlePeer, setHuddlePeer] = useState(null);
  const [dbChannels, setDbChannels] = useState([]);

  const socketRef = useRef(null);

  const fetchChannelsAndMessages = async () => {
    const token = localStorage.getItem('nsg_jwt_token');
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
                members: c.members && c.members.length > 0 ? c.members : (c.type === 'grievance' ? ['102', 'hr'] : ['101', '102', '103', '104', '105', 'hr', 'ceo']),
                messages: msgs.map(m => {
                  const tzFixed = m.timestamp.endsWith('Z') ? m.timestamp : m.timestamp + 'Z';
                  return {
                    id: m.id,
                    sender: m.sender,
                    text: m.text,
                    timestamp: new Date(tzFixed).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isMe: m.sender === tlName || m.sender === tlName + ' (TL)' || m.sender === 'John Doe (TL)' || m.sender === 'John Doe',
                    is_edited: m.is_edited,
                    is_pinned: m.is_pinned,
                    parent_id: m.parent_id,
                    deleted_at: m.deleted_at,
                    reactions: m.reactions,
                    seen_by: m.seen_by,
                    delivered_to: m.delivered_to,
                    attachment_url: m.attachment_url,
                    attachment_type: m.attachment_type
                  };
                })
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
      }
    } catch (e) {
      console.error("Failed to load channels", e);
    }
  };

  useEffect(() => {
    fetchChannelsAndMessages();
  }, []);
  
  const chatChannels = dbChannels;
  const myChannels = chatChannels.filter(c => c.id === "general-channel" || (c.members && c.members.includes(String(currentUser?.id || 'tl'))));

  const [selectedChannel, setSelectedChannel] = useState(() => {
    if (initialSelectedChannel) return initialSelectedChannel;
    return myChannels.length > 0 ? myChannels[0].id : '';
  });

  const [employees, setEmployees] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeoutRef = useRef(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const queue = JSON.parse(localStorage.getItem('nsg_chat_queue') || '[]');
      if (queue.length > 0) {
        queue.forEach(msg => {
          if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
             socketRef.current.send(JSON.stringify(msg));
          }
        });
        localStorage.removeItem('nsg_chat_queue');
      }
    };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  const handleDPUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const token = localStorage.getItem('nsg_jwt_token');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/employee-portal/profile/upload-dp', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        window.dispatchEvent(new CustomEvent('dp_updated', { detail: data.url }));
      }
    } catch(e) {}
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      const token = localStorage.getItem('nsg_jwt_token');
      try {
        const res = await fetch('/api/employee-portal/chat/users', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setEmployees(await res.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  const [localDmMessages, setLocalDmMessages] = useState({});

  const currentChannel = chatChannels.find(c => c.id === selectedChannel);

  const messages = useMemo(() => {
    if (currentChannel) {
      return { [selectedChannel]: (currentChannel.messages || []) };
    }
    return localDmMessages;
  }, [currentChannel, selectedChannel, localDmMessages]);

  const [inputVal, setInputVal] = useState('');
  const [activeThreadMessage, setActiveThreadMessage] = useState(null);
  const [showMentionsPopup, setShowMentionsPopup] = useState(false);

  const [forwardMessageModal, setForwardMessageModal] = useState(null);

  const executeForwardMessage = (targetChannelId) => {
    let fwdText = "[Forwarded]: " + (forwardMessageModal.text || '');
    const msgPayload = {
      type: 'new_message',
      channel_id: targetChannelId,
      text: fwdText,
      sender: typeof currentUser !== 'undefined' && currentUser ? currentUser.name : (typeof ceoName !== 'undefined' ? ceoName : 'Unknown'),
      attachment_url: forwardMessageModal.attachment_url || null,
      attachment_type: forwardMessageModal.attachment_type || null,
      parent_id: null,
      mentions: null
    };

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'new_message', ...msgPayload }));
    } else {
      const queue = JSON.parse(localStorage.getItem('nsg_chat_queue') || '[]');
      queue.push({ type: 'new_message', ...msgPayload });
      localStorage.setItem('nsg_chat_queue', JSON.stringify(queue));
    }

    setForwardMessageModal(null);
    setSelectedChannel(targetChannelId); // Switch to the target channel
  };
  const [mentionsFilter, setMentionsFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const chatEndRef = useRef(null);

  // === CHANNEL MANAGEMENT ===
  const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [channelMembers, setChannelMembers] = useState({});
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);

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

  const [userPresence, setUserPresence] = useState({});

  // Initialize WebSocket connection for real-time messaging
  useEffect(() => {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//127.0.0.1:8000/employee-portal/ws/${encodeURIComponent(tlName)}`;
    const socket = new WebSocket(wsUrl);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        const eventType = payload.event_type;

        if (eventType === 'presence_update') {
          setUserPresence(prev => ({
            ...prev,
            [payload.user]: { online: payload.online, last_active: payload.last_active }
          }));
          return;
        }

        if (eventType === 'typing_start') {
           setTypingUsers(prev => ({ ...prev, [payload.channel_id]: [...new Set([...(prev[payload.channel_id] || []), payload.user])] }));
           return;
        }
        if (eventType === 'typing_stop') {
           setTypingUsers(prev => ({ ...prev, [payload.channel_id]: (prev[payload.channel_id] || []).filter(u => u !== payload.user) }));
           return;
        }

        if (eventType === 'message_pinned') {
          fetchChannelsAndMessages();
          return;
        }

        if (eventType === 'message_delivered' || eventType === 'message_read' || eventType === 'update_message' || eventType === 'delete_message') {
          fetchChannelsAndMessages();
          return;
        }

        const newMsg = payload;
        
        // Auto-send delivered receipt
        if (newMsg.id && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify({ type: 'delivered', msg_id: newMsg.id }));
        }

        const isCorporateChannel = chatChannels.some(c => c.id === newMsg.channel_id);

        if (isCorporateChannel) {
          fetchChannelsAndMessages();
        } else {
          // Update DM/custom rooms
          setLocalDmMessages(prevRooms => {
            const roomMsgs = prevRooms[newMsg.channel_id] || [];
            const alreadyExists = roomMsgs.some(m => m.id === newMsg.id);
            if (alreadyExists) return prevRooms;
            
            return {
              ...prevRooms,
              [newMsg.channel_id]: [
                ...roomMsgs,
                {
                  id: newMsg.id,
                  sender: newMsg.sender,
                  avatar: employees.find(e => e.name === newMsg.sender || `dm-${e.id}` === newMsg.channel_id)?.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(newMsg.sender),
                  text: newMsg.text,
                  timestamp: newMsg.timestamp ? new Date(newMsg.timestamp.endsWith('Z') ? newMsg.timestamp : newMsg.timestamp + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                  isMe: newMsg.sender === tlName || newMsg.sender === tlName + ' (TL)' || newMsg.sender === 'TL (TL)' || newMsg.sender === 'TL',
                  is_edited: newMsg.is_edited,
                  deleted_at: newMsg.deleted_at,
                  reactions: newMsg.reactions,
                  seen_by: newMsg.seen_by,
                  delivered_to: newMsg.delivered_to,
                  attachment_url: newMsg.attachment_url,
                  attachment_type: newMsg.attachment_type
                }
              ]
            };
          });
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
  }, [chatChannels, employees]);

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

  const [lightboxMedia, setLightboxMedia] = useState(null);

  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachmentFile(file);
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      setAttachmentPreview(URL.createObjectURL(file));
    } else {
      setAttachmentPreview('document');
    }
  };

  const clearAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
  };

  const handleSearch = async (e) => {
    if (e.key === 'Enter') {
      if (!searchQuery.trim()) {
        setSearchResults(null);
        return;
      }
      setIsSearching(true);
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const res = await fetch(`/api/employee-portal/chat/search?query=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) { console.error(err); }
      setIsSearching(false);
    }
  };

  // Chat Send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputVal.trim() && !attachmentFile) return;

    let attachUrl = null;
    let attachType = null;

    if (attachmentFile) {
      if (!isOnline) {
         alert("Cannot upload attachments while offline.");
         return;
      }
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", attachmentFile);
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const res = await fetch('/api/employee-portal/chat/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        if (res.ok) {
          const data = await res.json();
          attachUrl = data.url;
          attachType = data.type;
        } else {
          const errText = await res.text();
          alert("Upload failed with status " + res.status + ": " + errText);
        }
      } catch (err) { 
        console.error("Upload failed", err); 
        alert("Upload failed: " + err.message);
      }
      setIsUploading(false);
      clearAttachment();
    }

    const mentionsMatch = inputVal.match(/@(\w+)/g);
    const mentions = mentionsMatch ? JSON.stringify(mentionsMatch.map(m => m.substring(1))) : null;

    const msgPayload = {
      type: 'new_message',
      channel_id: selectedChannel,
      text: inputVal.trim(),
      sender: tlName,
      attachment_url: attachUrl,
      attachment_type: attachType,
      parent_id: activeThreadMessage ? activeThreadMessage.id : null,
      mentions: mentions
    };

    if (!isOnline) {
      const queue = JSON.parse(localStorage.getItem('nsg_chat_queue') || '[]');
      queue.push(msgPayload);
      localStorage.setItem('nsg_chat_queue', JSON.stringify(queue));
      
      const offlineMsg = {
        id: Date.now(),
        sender: tlName,
        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=1e293b&color=fff',
        text: inputVal.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: true,
        is_offline_queued: true
      };
      
      const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);
      if (isCorporateChannel) {
        setDbChannels(prev => prev.map(c => c.id === selectedChannel ? { ...c, messages: [...(c.messages || []), offlineMsg] } : c));
      } else {
        setLocalDmMessages(prev => ({ ...prev, [selectedChannel]: [...(prev[selectedChannel] || []), offlineMsg] }));
      }
      setInputVal('');
      return;
    }

    // Send via WebSocket if connection is active
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msgPayload));
      setInputVal('');
      return;
    }

    const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);

    const newMsg = {
      id: Date.now(),
      sender: tlName,
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
      setDbChannels(updatedChannels);
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



  // Start Call WebRTC
  const handleStartCall = () => {
    if (!isOnline) {
      alert("You are offline. Cannot start video call without an internet connection.");
      return;
    }
    // Only use HuddleModal, avoid the broken floating PIP
    setHuddlePeer({
      channelId: selectedChannel,
      roomName: isDM ? `DM-${employees.find(e => `dm-${e.id}` === selectedChannel)?.name}` : selectedChannel,
      name: selectedChannel,
      displayName: 'TL (TL)'
    });

    const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);
    const callMsg = {
      displayName: 'TL (TL)',
      sender: 'TL (TL)',
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
      setDbChannels(updatedChannels);
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
  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    
    const rawName = newChannelName.trim().replace(/^#+/, '');
    const formattedName = `#${rawName}`;
    const baseId = rawName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'channel';
    const newId = `${baseId}-${Date.now()}`;
    
    const channelMembers = selectedMembers.length > 0 ? selectedMembers : ['ceo'];
    if (!channelMembers.includes('ceo')) channelMembers.push('ceo');

    const newChan = {
      id: newId,
      name: formattedName,
      label: `${rawName} Channel`,
      type: 'staff',
      members: channelMembers,
      messages: [
        {
          id: Date.now(),
          sender: 'System',
          text: `Channel ${formattedName} created by TL.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      await fetch('/api/employee-portal/chat/channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id: newChan.id,
          name: newChan.name,
          label: newChan.label,
          type: newChan.type,
          members: newChan.members
        })
      });
    } catch (err) {
      console.error("Failed to save channel to backend:", err);
    }

    const currentChannels = dbChannels;
    const updated = [...currentChannels, newChan];
    setDbChannels(updated);
    
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

  const handleEditChannel = async (e) => {
    e.preventDefault();
    const formattedName = editChannelName.replace(/\s+/g, '-').toLowerCase();
    
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/employee-portal/chat/channels/${selectedChannel}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '#' + formattedName.replace(/^#+/, ''), label: formattedName })
      });
      if (res.ok) {
        fetchChannelsAndMessages();
        setSelectedChannel(selectedChannel); // keeps same id, just name changed
        setIsEditChannelOpen(false);
      } else {
        alert("Failed to edit channel.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteChannel = async () => {
    if (dbChannels.length <= 1) {
      alert("You cannot delete the last channel.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete #${selectedChannel}?`)) {
      try {
        const token = localStorage.getItem('nsg_jwt_token');
        const res = await fetch(`/api/employee-portal/chat/channels/${selectedChannel}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          await fetchChannelsAndMessages();
          setSelectedChannel('general-channel');
        }
      } catch (err) {
        console.error(err);
      }
    }
    setIsChannelMenuOpen(false);
  };

  const [contextMenu, setContextMenu] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(null);
  const [showChatEmojiPicker, setShowChatEmojiPicker] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const handleMessageDoubleClick = (e, msg) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      msg: msg
    });
    setShowEmojiPicker(null);
  };

  const closeContextMenu = () => {
    setContextMenu(null);
    setShowEmojiPicker(null);
  };

  const submitEditMessage = async (msgId, newText) => {
    if(!newText.trim()) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/employee-portal/chat/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newText.trim() })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error('Edit failed:', res.status, err);
        alert('Failed to edit message: ' + (err.detail || res.status));
        return;
      }
      setEditingMessageId(null);
      setEditingText('');
      fetchChannelsAndMessages();
    } catch (err) { console.error(err); }
  };

  const handleDeleteMessage = async (msgId) => {
    if(!window.confirm("Delete this message?")) return;
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      const res = await fetch(`/api/employee-portal/chat/messages/${msgId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert('Failed to delete: ' + (err.detail || res.status));
        return;
      }
      fetchChannelsAndMessages();
    } catch (err) { console.error(err); }
  };

  const handleReactMessage = async (msgId, currentReactions, emoji) => {
    let reactionsObj = {};
    try {
      reactionsObj = currentReactions ? JSON.parse(currentReactions) : {};
    } catch(e){}
    
    if(!reactionsObj[emoji]) reactionsObj[emoji] = [];
    if(reactionsObj[emoji].includes(tlName)) {
      reactionsObj[emoji] = reactionsObj[emoji].filter(n => n !== tlName);
      if(reactionsObj[emoji].length === 0) delete reactionsObj[emoji];
    } else {
      reactionsObj[emoji].push(tlName);
    }
    
    try {
      const token = localStorage.getItem('nsg_jwt_token');
      await fetch(`/api/employee-portal/chat/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactions: JSON.stringify(reactionsObj) })
      });
    } catch (err) { console.error(err); }
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

  const getUnreadCount = (channelId) => {
    const msgs = messages[channelId] || [];
    return msgs.filter(m => {
       if (m.isMe || (m.sender && m.sender.includes('TL'))) return false;
       try {
         const seenArr = m.seen_by ? JSON.parse(m.seen_by) : [];
         return !seenArr.includes(tlName);
       } catch(e) { return true; }
    }).length;
  };

  const renderMessageText = (text) => {
    if (!text) return null;
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return <span key={i} style={{ color: '#3B82F6', fontWeight: 800, background: 'rgba(59,130,246,0.1)', padding: '0 4px', borderRadius: '4px' }}>{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', overflow: 'hidden', background: '#F8FAFC', borderRadius: '12px', border: '1px solid var(--ceo-border)' }}>
      
      {/* === LEFT SIDEBAR === */}
      <div style={{ width: '280px', background: '#FFFFFF', borderRight: '1px solid var(--ceo-border)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--ceo-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--ceo-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={20} color="var(--ceo-primary)" /> Team Chat
            </h2>
            <label style={{ cursor: 'pointer', position: 'relative' }} title="Change Profile Picture">
              <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={currentUser?.photo ? `${currentUser.photo}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(tlName)}`} alt="You" style={{ width: '36px', height: '36px', borderRadius: '18px', objectFit: 'cover', border: '2px solid var(--ceo-border)' }}  />
              <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--ceo-primary)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #FFF' }}>
                <Camera size={10} color="#FFF" />
              </div>
              <input type="file" style={{ display: 'none' }} accept="image/*" onChange={handleDPUpload} />
            </label>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--ceo-text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
            <input 
              type="text" 
              placeholder={isSearching ? "Searching..." : "Search messages..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
              className="ceo-form-input" 
              style={{ width: '100%', paddingLeft: '32px', height: '34px', fontSize: '13px' }} 
              disabled={isSearching}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingLeft: '8px', paddingRight: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)', letterSpacing: '0.5px' }}>CHANNELS</div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Hash size={16} /> {chan.name}</div>
                {getUnreadCount(chan.id) > 0 && <span style={{ background: 'var(--ceo-danger)', color: '#FFF', fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px' }}>{getUnreadCount(chan.id)}</span>}
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
                    <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo ? `${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`)} alt={emp.name} style={{ width: '24px', height: '24px', borderRadius: '12px', objectFit: 'cover' }}  />
                    <div style={{ position: 'absolute', bottom: -2, right: -2, width: '8px', height: '8px', borderRadius: '4px', background: emp.status === 'Active' ? 'var(--ceo-success)' : 'var(--ceo-warning)', border: '2px solid #FFF' }}></div>
                  </div>
                  <div style={{ flex: 1 }}>{emp.name}</div>
                  {getUnreadCount(dmId) > 0 && <span style={{ background: 'var(--ceo-danger)', color: '#FFF', fontSize: '11px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px' }}>{getUnreadCount(dmId)}</span>}
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
            <div 
              style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ceo-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: isDM ? 'default' : 'pointer' }}
              onClick={() => !isDM && setShowGroupMembersModal(true)}
            >
              {isDM ? <span style={{ color: 'var(--ceo-primary)' }}>@</span> : <Hash size={20} color="var(--ceo-text-muted)" />}
              {isDM ? employees.find(e => `dm-${e.id}` === selectedChannel)?.name : selectedChannel}
            </div>
            <div 
              style={{ fontSize: '12px', color: 'var(--ceo-text-secondary)', fontWeight: 500, marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', cursor: isDM ? 'default' : 'pointer' }}
              onClick={() => !isDM && setShowGroupMembersModal(true)}
            >
              {isDM ? (
                (() => {
                  const dmUser = employees.find(e => `dm-${e.id}` === selectedChannel);
                  const presence = dmUser ? userPresence[dmUser.name] : null;
                  if (presence?.online) return <span style={{ color: 'var(--ceo-success)' }}>Online</span>;
                  if (presence?.last_active) return <span>Last seen at {new Date(presence.last_active + (presence.last_active.endsWith('Z') ? '' : 'Z')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>;
                  return <span>Offline</span>;
                })()
              ) : (
                <><Users size={12} /> {currentMembersCount} members (Click to view)</>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', position: 'relative' }}>
            {!isDM && (
              <button onClick={() => setShowGroupMembersModal(true)} className="ceo-btn" style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid var(--ceo-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--ceo-primary)" /> Members
              </button>
            )}
            <button onClick={() => setIsGalleryOpen(!isGalleryOpen)} className="ceo-btn" style={{ padding: '8px 16px', background: '#F8FAFC', border: '1px solid var(--ceo-border)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Image size={16} color="var(--ceo-primary)" /> Files & Media
            </button>
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

        {/* Pinned Messages Banner */}
        {(() => {
          const pinnedMsgs = (messages[selectedChannel] || []).filter(m => m.is_pinned);
          if (pinnedMsgs.length === 0) return null;
          return (
            <div style={{ background: '#FEF3C7', borderBottom: '1px solid #FDE68A', padding: '10px 24px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Pin size={16} color="#D97706" style={{ marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                 <div style={{ fontSize: '11px', fontWeight: 800, color: '#D97706', textTransform: 'uppercase', marginBottom: '2px' }}>Pinned Messages ({pinnedMsgs.length})</div>
                 <div style={{ fontSize: '13px', color: '#92400E', maxHeight: '40px', overflowY: 'auto' }}>
                    {pinnedMsgs.map(pm => (
                       <div 
                         key={pm.id} 
                         onClick={() => {
                           const el = document.getElementById(`msg-${pm.id}`);
                           if(el) {
                             el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                             el.style.backgroundColor = '#FEF3C7';
                             setTimeout(() => el.style.backgroundColor = '', 2000);
                           }
                         }}
                         style={{ display: 'flex', gap: '8px', marginBottom: '4px', cursor: 'pointer', transition: 'background-color 0.3s', padding: '2px 4px', borderRadius: '4px' }}
                         onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(217, 119, 6, 0.1)'}
                         onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                       >
                          <strong>{pm.sender}:</strong>
                          <span>{renderMessageText(pm.text)}</span>
                       </div>
                    ))}
                 </div>
              </div>
            </div>
          );
        })()}

        {/* Offline Banner */}
        {!isOnline && (
          <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '8px 24px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertOctagon size={16} />
            You are currently offline. Messaging and calls are disabled until network is restored.
          </div>
        )}

        {/* Messages Feed */}
        {searchResults ? (
           <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--ceo-border)', paddingBottom: '16px' }}>
                 <h2 style={{ fontSize: '18px', fontWeight: 800 }}>Search Results for "{searchQuery}"</h2>
                 <button onClick={() => { setSearchResults(null); setSearchQuery(''); setIsSearching(false); }} className="ceo-btn" style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700 }}>Close Search</button>
              </div>
              {searchResults.length === 0 ? (
                 <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--ceo-text-muted)' }}>No messages found.</div>
              ) : (
                 searchResults.map(res => (
                    <div key={res.id} onClick={() => { setSelectedChannel(res.channel_id); setSearchResults(null); setSearchQuery(''); setIsSearching(false); }} style={{ padding: '16px', border: '1px solid var(--ceo-border)', borderRadius: '12px', cursor: 'pointer', background: '#F8FAFC' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <strong style={{ fontSize: '14px', color: 'var(--ceo-primary)' }}>{res.sender} <span style={{ color: 'var(--ceo-text-muted)' }}>in {res.channel_id}</span></strong>
                          <span style={{ fontSize: '12px', color: 'var(--ceo-text-muted)' }}>{new Date(res.timestamp + (res.timestamp.endsWith('Z') ? '' : 'Z')).toLocaleString()}</span>
                       </div>
                       <div style={{ fontSize: '14px' }}>{renderMessageText(res.text)}</div>
                    </div>
                 ))
              )}
           </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', background: '#F8FAFC' }}>
          {(messages[selectedChannel] || []).filter(m => !m.parent_id).length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--ceo-text-muted)' }}>
              <MessageSquare size={48} style={{ opacity: 0.2, margin: '0 auto 16px auto' }} />
              <div style={{ fontSize: '16px', fontWeight: 600 }}>No messages yet</div>
              <div style={{ fontSize: '13px' }}>Start the conversation!</div>
            </div>
          ) : (
            (messages[selectedChannel] || []).filter(m => !m.parent_id).map((msg, idx) => {
              const isMsgMe = msg.isMe || (msg.sender && (msg.sender === tlName || msg.sender.includes('CEO') || msg.sender.includes('HR') || msg.sender.toLowerCase() === 'hr' || msg.sender.includes('TL') || msg.sender.toLowerCase() === 'tl' || msg.sender.includes('TL')));
              const isDeleted = !!msg.deleted_at;
              
              let parsedReactions = {};
              try { parsedReactions = msg.reactions ? JSON.parse(msg.reactions) : {}; } catch(e){}
              const hasReactions = Object.keys(parsedReactions).length > 0;

              return (
                <div key={msg.id || idx} style={{ display: 'flex', gap: '16px', flexDirection: isMsgMe ? 'row-reverse' : 'row', position: 'relative' }} className="message-row" id={`msg-${msg.id}`}
                     onDoubleClick={(e) => !isDeleted && handleMessageDoubleClick(e, msg)}
                     onContextMenu={(e) => { e.preventDefault(); if(!isDeleted) handleMessageDoubleClick(e, msg); }}
                >
                  {(() => {
                    const senderEmp = employees.find(e => e.name === msg.sender);
                    const senderAvatar = senderEmp?.photo ? `${senderEmp.photo}` : (msg.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender)}`);
                    return <img src={senderAvatar} alt={msg.sender} style={{ width: '36px', height: '36px', borderRadius: '18px', border: '1px solid var(--tl-border)', flexShrink: 0, objectFit: 'cover' }} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender || 'User')}`; }} />;
                  })()}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMsgMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexDirection: isMsgMe ? 'row-reverse' : 'row' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--tl-text-primary)' }}>{isMsgMe ? 'You' : msg.sender}</span>
                      <span style={{ fontSize: '11px', color: 'var(--tl-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {msg.timestamp || msg.time} {msg.is_edited && !isDeleted && '(Edited)'}
                        {isMsgMe && !isDeleted && (() => {
                          let isRead = false;
                          let isDelivered = false;
                          const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);
                          try {
                            const seenArr = msg.seen_by ? JSON.parse(msg.seen_by) : [];
                            const deliveredArr = msg.delivered_to ? JSON.parse(msg.delivered_to) : [];
                            isRead = isCorporateChannel ? seenArr.length >= currentMembersCount - 1 : seenArr.length > 0;
                            isDelivered = isCorporateChannel ? deliveredArr.length >= currentMembersCount - 1 : deliveredArr.length > 0;
                          } catch(e) {}
                          if (isRead) return <CheckCheck size={14} color="#3B82F6" />;
                          if (isDelivered) return <CheckCheck size={14} color="#94A3B8" />;
                          return <Check size={14} color="#94A3B8" />;
                        })()}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isMsgMe ? 'row-reverse' : 'row' }}>
                      <div style={{ 
                        background: isDeleted ? '#F1F5F9' : (isMsgMe ? 'var(--ceo-primary)' : '#FFF'), 
                        color: isDeleted ? 'var(--ceo-text-muted)' : (isMsgMe ? '#FFF' : 'var(--ceo-text-primary)'),
                        padding: '12px 16px', borderRadius: '12px', border: (isMsgMe && !isDeleted) ? 'none' : '1px solid var(--ceo-border)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', fontSize: '14px', lineHeight: '1.5', fontStyle: isDeleted ? 'italic' : 'normal'
                      }}>
                        {isDeleted ? (
                          <span>This message was deleted.</span>
                        ) : editingMessageId === msg.id ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                              type="text" autoFocus 
                              value={editingText} onChange={e=>setEditingText(e.target.value)}
                              onKeyDown={e => { if(e.key === 'Enter') submitEditMessage(msg.id, editingText); if(e.key === 'Escape') setEditingMessageId(null); }}
                              style={{ border: 'none', background: 'rgba(255,255,255,0.2)', color: isMsgMe ? '#FFF' : '#000', outline: 'none', minWidth: '200px' }} 
                            />
                            <button onClick={()=>submitEditMessage(msg.id, editingText)} style={{ background: 'transparent', border: 'none', color: isMsgMe ? '#FFF' : 'var(--ceo-primary)', cursor: 'pointer', fontWeight: 'bold' }}>Save</button>
                            <button onClick={()=>setEditingMessageId(null)} style={{ background: 'transparent', border: 'none', color: isMsgMe ? 'rgba(255,255,255,0.7)' : 'var(--ceo-text-muted)', cursor: 'pointer' }}>Cancel</button>
                          </div>
                        ) : msg.isCallStatus ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isMsgMe ? '#FFF' : 'var(--ceo-primary)', fontWeight: '600' }}>
                            <Video size={16} />
                            <span>{renderMessageText(msg.text)}</span>
                            <button 
                              type="button" 
                              style={{ marginLeft: '12px', padding: '6px 16px', borderRadius: '6px', backgroundColor: isMsgMe ? '#FFF' : 'var(--ceo-primary)', color: isMsgMe ? 'var(--ceo-primary)' : 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                              onClick={() => {
                                setHuddlePeer({ channelId: selectedChannel, roomName: selectedChannel, name: selectedChannel, displayName: 'TL (TL)' });
                              }}
                            >
                              Join
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {msg.attachment_url && (
                              <div style={{ marginBottom: '4px' }}>
                                {msg.attachment_type === 'image' ? (
                                  <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={`${msg.attachment_url}`} alt="attachment" style={{ maxWidth: '250px', maxHeight: '250px', borderRadius: '8px', objectFit: 'cover', cursor: 'pointer' }} onClick={() => setLightboxMedia({ url: `${msg.attachment_url}`, type: msg.attachment_type })} />
                                ) : msg.attachment_type === 'video' ? (
                                  <video src={`${msg.attachment_url}`} style={{ maxWidth: '250px', maxHeight: '250px', borderRadius: '8px', cursor: 'pointer' }} controls={false} onClick={() => setLightboxMedia({ url: `${msg.attachment_url}`, type: msg.attachment_type })} />
                                ) : (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: isMsgMe ? 'rgba(255,255,255,0.2)' : '#F1F5F9', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                                    <Paperclip size={16} />
                                    <a href={`${msg.attachment_url}`} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }} onClick={(e) => e.stopPropagation()}>Download File</a>
                                  </div>
                                )}
                              </div>
                            )}
                            {msg.text && <span>{renderMessageText(msg.text)}</span>}
                          </div>
                        )}
                      </div>

                      </div>
                    
                    {/* Reactions Strip */}
                    {hasReactions && !isDeleted && (
                      <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexDirection: isMsgMe ? 'row-reverse' : 'row' }}>
                        {Object.entries(parsedReactions).map(([emoji, users]) => (
                          <div key={emoji} onClick={()=>handleReactMessage(msg.id, msg.reactions, emoji)} style={{ background: '#F1F5F9', border: '1px solid var(--ceo-border)', borderRadius: '12px', padding: '2px 6px', fontSize: '12px', cursor: 'pointer', display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span>{emoji}</span>
                            <span style={{ fontWeight: 600, color: 'var(--ceo-text-secondary)' }}>{users.length}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>
        )}

        {/* Message Input */}
        <div style={{ padding: '20px 24px', background: '#FFF', borderTop: '1px solid var(--ceo-border)', position: 'relative' }}>
          
          {/* Typing Indicator */}
          {typingUsers[selectedChannel] && typingUsers[selectedChannel].length > 0 && (
            <div style={{ position: 'absolute', top: '-24px', left: '24px', fontSize: '12px', color: 'var(--ceo-text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ display: 'flex', gap: '2px' }}>
                 <span style={{ animation: 'pulse 1.5s infinite' }}>.</span><span style={{ animation: 'pulse 1.5s infinite 0.2s' }}>.</span><span style={{ animation: 'pulse 1.5s infinite 0.4s' }}>.</span>
              </div>
              {typingUsers[selectedChannel].join(', ')} {typingUsers[selectedChannel].length > 1 ? 'are' : 'is'} typing...
            </div>
          )}
          
          {/* Attachment Preview */}
          {attachmentFile && (
            <div style={{ position: 'absolute', bottom: '100%', left: '24px', background: '#FFF', border: '1px solid var(--ceo-border)', padding: '8px', borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 -4px 6px -1px rgba(0,0,0,0.05)' }}>
              {attachmentPreview === 'document' ? <div style={{width:'40px', height:'40px', background:'#F1F5F9', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center'}}><Paperclip size={20}/></div> : <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={attachmentPreview} alt="preview" style={{width:'40px', height:'40px', objectFit:'cover', borderRadius:'4px'}}  />}
              <div style={{fontSize:'12px', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{attachmentFile.name}</div>
              <button onClick={clearAttachment} style={{background:'transparent', border:'none', cursor:'pointer'}}><X size={14} color="var(--ceo-danger)"/></button>
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '8px 16px', borderRadius: '12px', border: '1px solid var(--ceo-border)' }}>
            <label style={{ cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}>
              <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
              <Paperclip size={18} color="var(--ceo-text-muted)" />
            </label>
            <div style={{ position: 'relative', flex: 1 }}>
              <input 
                type="text" 
                value={inputVal} 
                onChange={e => {
                  const val = e.target.value;
                  setInputVal(val);
                  const atMatch = val.match(/@(\w*)$/);
                  if (atMatch && !selectedChannel.startsWith('dm-')) {
                    setShowMentionsPopup(true);
                    setMentionsFilter(atMatch[1].toLowerCase());
                  } else {
                    setShowMentionsPopup(false);
                  }
                  if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                    socketRef.current.send(JSON.stringify({ type: 'typing_start', channel_id: selectedChannel, sender: tlName }));
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => {
                      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                        socketRef.current.send(JSON.stringify({ type: 'typing_stop', channel_id: selectedChannel, sender: tlName }));
                      }
                    }, 2000);
                  }
                }} 
                placeholder={`Message ${selectedChannel.startsWith('dm-') ? '@' + employees.find(e => `dm-${e.id}` === selectedChannel)?.name : '#' + selectedChannel}`}
                style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', padding: '8px 0', color: 'var(--ceo-text-primary)' }} 
                disabled={isUploading}
              />
              {showMentionsPopup && (
                <div style={{ position: 'absolute', bottom: '100%', left: 0, background: '#FFF', borderRadius: '8px', border: '1px solid var(--ceo-border)', boxShadow: '0 -4px 10px rgba(0,0,0,0.1)', zIndex: 3000, width: '250px', maxHeight: '150px', overflowY: 'auto' }}>
                  {employees.filter(e => e.name.toLowerCase().includes(mentionsFilter)).map(emp => (
                    <div key={emp.id} onClick={() => {
                       setInputVal(prev => prev.replace(/@\w*$/, `@${emp.name.replace(/\s+/g, '')} `));
                       setShowMentionsPopup(false);
                    }} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--ceo-divider)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo ? `${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}`)} alt="" style={{ width: '20px', height: '20px', borderRadius: '10px' }}  />
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>{emp.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => setShowChatEmojiPicker(!showChatEmojiPicker)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }}><Smile size={18} color="var(--ceo-text-muted)" /></button>
            
            {showChatEmojiPicker && (
              <div style={{ position: 'absolute', bottom: '100%', right: '80px', marginBottom: '10px', zIndex: 3001 }}>
                <EmojiPicker 
                  onEmojiClick={(emojiData) => {
                    setInputVal(prev => prev + emojiData.emoji);
                    setShowChatEmojiPicker(false);
                  }} 
                />
              </div>
            )}

            <button type="submit" disabled={(!inputVal.trim() && !attachmentFile) || isUploading} style={{ background: (inputVal.trim() || attachmentFile) && !isUploading ? 'var(--ceo-primary)' : '#E2E8F0', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: (inputVal.trim() || attachmentFile) && !isUploading ? 'pointer' : 'not-allowed', color: '#FFF', fontWeight: 600, transition: 'all 0.2s' }}>
              {isUploading ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
      
      {/* Right Thread Panel */}
      {activeThreadMessage && (
        <div style={{ width: '320px', background: '#FFF', borderLeft: '1px solid var(--ceo-border)', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
             <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Thread</h3>
             <button onClick={() => setActiveThreadMessage(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} color="var(--ceo-text-muted)" /></button>
           </div>
           <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--ceo-divider)', marginBottom: '20px' }}>
                 <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>{activeThreadMessage.sender}</div>
                 <div style={{ fontSize: '14px', lineHeight: 1.5 }}>{renderMessageText(activeThreadMessage.text)}</div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-muted)', marginBottom: '16px' }}>REPLIES</div>
              {(messages[selectedChannel] || []).filter(m => m.parent_id === activeThreadMessage.id).map(msg => (
                 <div key={msg.id} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '16px', background: 'var(--ceo-primary)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}>{msg.sender.charAt(0)}</div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '2px' }}>{msg.sender} <span style={{ fontSize: '11px', color: 'var(--ceo-text-muted)', fontWeight: 'normal' }}>{msg.timestamp || msg.time}</span></div>
                      <div style={{ fontSize: '14px', lineHeight: 1.5 }}>{renderMessageText(msg.text)}</div>
                    </div>
                 </div>
              ))}
           </div>
           <div style={{ padding: '16px', borderTop: '1px solid var(--ceo-border)' }}>
             <input type="text" placeholder="Reply..." onKeyDown={e => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                   const payload = { type: 'new_message', channel_id: selectedChannel, sender: tlName, text: e.target.value.trim(), parent_id: activeThreadMessage.id };
                   if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                      socketRef.current.send(JSON.stringify(payload));
                   }
                   e.target.value = '';
                }
             }} style={{ width: '100%', padding: '12px', border: '1px solid var(--ceo-border)', borderRadius: '8px', outline: 'none', fontSize: '13px' }} />
           </div>
        </div>
      )}

      {/* Right Media Gallery Panel */}
      {isGalleryOpen && (
        <div style={{ width: '320px', background: '#FFF', borderLeft: '1px solid var(--ceo-border)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
           <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
             <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><Image size={18} color="var(--ceo-primary)" /> Files & Media</h3>
             <button onClick={() => setIsGalleryOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={18} color="var(--ceo-text-muted)" /></button>
           </div>
           <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {(() => {
                const mediaMsgs = (messages[selectedChannel] || []).filter(m => m.attachment_url);
                if (mediaMsgs.length === 0) return <div style={{ textAlign: 'center', color: 'var(--ceo-text-muted)', marginTop: '40px' }}>No files shared yet.</div>;
                
                const images = mediaMsgs.filter(m => m.attachment_type === 'image');
                const others = mediaMsgs.filter(m => m.attachment_type !== 'image');

                return (
                  <div>
                    {images.length > 0 && (
                      <div style={{ marginBottom: '24px' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-muted)', marginBottom: '12px' }}>IMAGES</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {images.map(m => (
                             <img key={m.id} onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={`${m.attachment_url}`} alt="media" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} onClick={() => setLightboxMedia({ url: `${m.attachment_url}`, type: 'image' })} />
                          ))}
                        </div>
                      </div>
                    )}
                    {others.length > 0 && (
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-muted)', marginBottom: '12px' }}>DOCUMENTS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {others.map(m => (
                             <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#F8FAFC', border: '1px solid var(--ceo-border)', borderRadius: '8px' }}>
                                <Paperclip size={16} color="var(--ceo-text-muted)" />
                                <a href={`${m.attachment_url}`} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--ceo-primary)', textDecoration: 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.attachment_url.split('/').pop()}</a>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
           </div>
        </div>
      )}

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
                        <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo ? `${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=random`)} alt={emp.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}  />
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
                          <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo ? `${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=random`)} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '18px' }}  />
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
                          <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo ? `${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=random`)} alt={emp.name} style={{ width: '36px', height: '36px', borderRadius: '18px', filter: 'grayscale(100%)' }}  />
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={(e) => { if(e.target === e.currentTarget) setIsCreateChannelOpen(false); }}>
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
              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--ceo-text-secondary)', marginBottom: '8px' }}>SELECT MEMBERS</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--ceo-border)', borderRadius: '8px', padding: '8px', background: '#F8FAFC' }}>
                  {employees.filter(e => String(e.id) !== 'ceo').map(emp => (
                    <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', cursor: 'pointer', borderRadius: '4px', ':hover': { background: '#FFF' } }}>
                      <input 
                        type="checkbox" 
                        checked={selectedMembers.includes(String(emp.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMembers([...selectedMembers, String(emp.id)]);
                          } else {
                            setSelectedMembers(selectedMembers.filter(id => id !== String(emp.id)));
                          }
                        }}
                      />
                      <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo ? `${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=random`)} alt={emp.name} style={{ width: '24px', height: '24px', borderRadius: '12px' }}  />
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}>{emp.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" onClick={() => { setIsCreateChannelOpen(false); setSelectedMembers([]); setNewChannelName(''); }} className="ceo-btn" style={{ fontWeight: 700 }}>Cancel</button>
                <button type="submit" className="ceo-btn ceo-btn-primary" style={{ fontWeight: 700 }}>Create Channel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Channel Modal */}
      {isEditChannelOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={(e) => { if (e.target === e.currentTarget) { setIsEditChannelOpen(false) } }}>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={(e) => { if(e.target === e.currentTarget) setIsAddMemberOpen(false); }}>
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
                      <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={emp.photo ? `${emp.photo}` : (emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name || "User")}&background=random`)} alt={emp.name} style={{ width: '32px', height: '32px', borderRadius: '16px' }}  />
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
        .message-row .msg-actions {
          opacity: 0 !important;
        }
        .message-row:hover .msg-actions {
          opacity: 1 !important;
        }
      `}</style>

      {/* Context Menu (Double Tap / Right Click) */}
      {contextMenu && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 3000 }} 
          onClick={closeContextMenu}
          onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }}
        >
          <div 
            style={{ 
              position: 'absolute', 
              top: Math.min(contextMenu.y, window.innerHeight - 300), 
              left: Math.min(contextMenu.x, window.innerWidth - 200), // prevent going off-screen
              background: '#FFF', 
              borderRadius: '12px', 
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)', 
              border: '1px solid var(--ceo-border)',
              width: '180px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--ceo-divider)', background: '#F8FAFC', fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)' }}>
              MESSAGE ACTIONS
            </div>
            
            <button 
              onClick={() => { 
                navigator.clipboard.writeText(contextMenu.msg.text || '');
                closeContextMenu();
              }} 
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--ceo-divider)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}
            >
              <Copy size={16} /> Copy Message
            </button>

            <button 
              onClick={() => { setActiveThreadMessage(contextMenu.msg); closeContextMenu(); }} 
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--ceo-divider)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}
            >
              <MessageSquare size={16} /> Reply in Thread
            </button>

            <button 
              onClick={() => {
                if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                  socketRef.current.send(JSON.stringify({ type: 'pin_message', msg_id: contextMenu.msg.id, channel_id: selectedChannel, is_pinned: !contextMenu.msg.is_pinned }));
                }
                closeContextMenu();
              }} 
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--ceo-divider)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}
            >
              <Pin size={16} /> {contextMenu.msg.is_pinned ? 'Unpin Message' : 'Pin Message'}
            </button>

            <button 
              onClick={() => { setShowEmojiPicker(contextMenu.msg.id); }} 
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--ceo-divider)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}
            >
              <Smile size={16} /> React
            </button>

            <button 
              onClick={() => { 
                setForwardMessageModal(contextMenu.msg);
                closeContextMenu();
              }} 
              style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--ceo-divider)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}
            >
              <Send size={16} /> Forward Message
            </button>

            {/* If it's my message, I can edit/delete */}
            {(contextMenu.msg.isMe || (contextMenu.msg.sender && (contextMenu.msg.sender === tlName || contextMenu.msg.sender.includes('TL') || contextMenu.msg.sender.includes('CEO') || contextMenu.msg.sender.toLowerCase() === 'ceo' || contextMenu.msg.sender.includes('HR') || contextMenu.msg.sender.toLowerCase() === 'hr' || contextMenu.msg.sender.includes('TL') || contextMenu.msg.sender.toLowerCase() === 'tl'))) && (
              <>
                <button 
                  onClick={() => { setEditingMessageId(contextMenu.msg.id); setEditingText(contextMenu.msg.text); closeContextMenu(); }} 
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', borderBottom: '1px solid var(--ceo-divider)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}
                >
                  <MessageSquare size={16} /> Edit Message
                </button>
                <button 
                  onClick={() => { handleDeleteMessage(contextMenu.msg.id); closeContextMenu(); }} 
                  style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: 'var(--ceo-danger)' }}
                >
                  <Trash2 size={16} /> Delete Message
                </button>
              </>
            )}
          </div>

          {/* Emoji Picker Overlay */}
          {showEmojiPicker && (
            <div 
              style={{ position: 'absolute', top: contextMenu.y + 10, left: Math.min(contextMenu.x + 190, window.innerWidth - 350), zIndex: 3001 }}
              onClick={(e) => e.stopPropagation()}
            >
              <EmojiPicker 
                onEmojiClick={(emojiData) => {
                  handleReactMessage(showEmojiPicker, contextMenu.msg.reactions, emojiData.emoji);
                  closeContextMenu();
                }} 
              />
            </div>
          )}
        </div>
      )}

      {/* Lightbox Modal */}
      {lightboxMedia && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if(e.target === e.currentTarget) setLightboxMedia(null); }}>
          <button onClick={() => setLightboxMedia(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#FFF' }}>
            <X size={32} />
          </button>
          <a href={lightboxMedia.url} download target="_blank" rel="noreferrer" style={{ position: 'absolute', top: '20px', right: '80px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#FFF', textDecoration: 'none' }}>
            <Download size={32} />
          </a>
          {lightboxMedia.type === 'image' ? (
            <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={lightboxMedia.url} alt="fullscreen" style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain' }}  />
          ) : (
            <video src={lightboxMedia.url} style={{ maxWidth: '90%', maxHeight: '90%' }} controls autoPlay />
          )}
        </div>
      )}

      {/* Group Members Modal */}
      {showGroupMembersModal && currentChannel && !isDM && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if(e.target === e.currentTarget) setShowGroupMembersModal(false); }}>
          <div style={{ background: '#FFF', borderRadius: '16px', width: '400px', maxWidth: '90%', maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--ceo-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--ceo-text-primary)' }}>Group Members</h3>
              <button onClick={() => setShowGroupMembersModal(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={20} color="var(--ceo-text-muted)" /></button>
            </div>
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(currentChannel.members || []).map(empId => {
                const emp = employees.find(e => String(e.id) === String(empId) || e.id === empId);
                const name = emp ? emp.name : (empId === 'ceo' ? 'TL' : (empId === 'hr' ? 'HR Manager' : `Emp #${empId}`));
                const avatar = emp?.photo ? `${emp.photo}` : (emp?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`);
                return (
                  <div key={empId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(e.target.alt || 'User')}&background=random`; }} src={avatar} alt={name} style={{ width: '40px', height: '40px', borderRadius: '20px', objectFit: 'cover', border: '1px solid var(--ceo-border)' }}  />
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--ceo-text-primary)' }}>{name}</div>
                    </div>
                    {empId !== 'ceo' && (
                      <button 
                        onClick={() => {
                          setSelectedChannel(`dm-${empId}`);
                          setShowGroupMembersModal(false);
                        }}
                        style={{ padding: '6px 12px', background: '#F1F5F9', border: '1px solid var(--ceo-border)', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: 'var(--ceo-text-primary)', display: 'flex', gap: '6px', alignItems: 'center' }}
                      >
                        <MessageSquare size={14} /> Message
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {huddlePeer && (
        <HuddleModal 
          peer={huddlePeer} 
          onClose={() => setHuddlePeer(null)} 
        />
      )}

    
      {forwardMessageModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) { setForwardMessageModal(null) } }}>
          <div style={{ background: '#FFF', width: '400px', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Forward Message To...</h3>
            <div style={{ fontSize: '13px', color: 'var(--ceo-text-muted)', background: '#F8FAFC', padding: '12px', borderRadius: '8px', border: '1px solid var(--ceo-border)', fontStyle: 'italic' }}>
               "{forwardMessageModal.text}"
               {forwardMessageModal.attachment_url && <div style={{marginTop: '4px', color: 'var(--ceo-primary)'}}>[Attachment Included]</div>}
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '8px' }}>
               <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)' }}>CHANNELS</div>
               {(typeof dbChannels !== 'undefined' ? dbChannels : (typeof chatChannels !== 'undefined' ? chatChannels : [])).map(c => (
                  <button key={"fwd-"+c.id} onClick={() => executeForwardMessage(c.id)} style={{ padding: '10px 12px', textAlign: 'left', background: 'transparent', border: '1px solid var(--ceo-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}>
                    <Hash size={16} color="var(--ceo-text-muted)"/> {c.name}
                  </button>
               ))}
               <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ceo-text-muted)', marginTop: '8px' }}>DIRECT MESSAGES</div>
               {(typeof employees !== 'undefined' ? employees : []).filter(e => !e.isMe).map(e => (
                  <button key={"fwd-dm-"+e.id} onClick={() => executeForwardMessage("dm-"+e.id)} style={{ padding: '10px 12px', textAlign: 'left', background: 'transparent', border: '1px solid var(--ceo-border)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: 'var(--ceo-text-primary)' }}>
                    <img src={e.photo ? e.photo : (e.avatar || "https://ui-avatars.com/api/?name="+e.name.replace(' ', '+'))} alt="" style={{width: '24px', height: '24px', borderRadius: '12px', objectFit: 'cover'}} onError={(ev)=>{ev.target.onerror=null;ev.target.src="https://ui-avatars.com/api/?name="+e.name.replace(' ', '+');}} /> {e.name}
                  </button>
               ))}
            </div>
            <button onClick={() => setForwardMessageModal(null)} style={{ padding: '12px', background: '#E2E8F0', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', color: 'var(--ceo-text-primary)' }}>Cancel</button>
          </div>
        </div>
      )}

    </div>
);
}

