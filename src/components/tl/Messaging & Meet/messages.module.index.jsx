import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './messages.module.css';
import { Hash, Send, Plus, Search, Sparkles, X, PhoneCall, ChevronDown, ChevronUp, Video, Mic, VideoOff, MicOff, Monitor, Volume2, Trash2, PhoneOff, Users, Smile, Hand, MoreVertical, MessageSquare, Paperclip, Clock, Pizza, Building, Lightbulb, Trophy, LayoutGrid, Maximize, PictureInPicture, AlertOctagon, AlertCircle, Activity, Settings, ArrowLeft, Subtitles, Languages } from 'lucide-react';
import HuddleModal from '../../employee/HuddleModal';

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

const Messages = ({ initialSelectedChannel, db, onUpdateDb }) => {
  const chatChannels = db?.chatChannels && db.chatChannels.length > 0 ? db.chatChannels : DEFAULT_CHAT_CHANNELS;
  const myChannels = chatChannels.filter(c => c.members.includes('101'));

  // Selected channel state
  const [selectedChannel, setSelectedChannel] = useState(() => {
    if (initialSelectedChannel) return initialSelectedChannel;
    return myChannels.length > 0 ? myChannels[0].id : 'team-room';
  });

  const [huddlePeer, setHuddlePeer] = useState(null);

  // Update selected channel if it changes from parent (e.g. clicking an avatar in dashboard)
  useEffect(() => {
    if (initialSelectedChannel) {
      setSelectedChannel(initialSelectedChannel);
    }
  }, [initialSelectedChannel]);

  const [channelDescriptions, setChannelDescriptions] = useState({
    'general-channel': 'Company-wide general announcement and conversation room.',
    'team-room': 'General engineering sprint updates, PR reviews, and deploy logs.',
    'grievance-room': 'Confidential private channel with HR department.',
    'ceo-channel': 'Restricted CEO and Executive Suite forum.',
    'tl-channel': 'Team Lead Forum'
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [channelError, setChannelError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callScreenMic, setCallScreenMic] = useState(true);
  const [callScreenCamera, setCallScreenCamera] = useState(true);
  const [callScreenShare, setCallScreenShare] = useState(false);
  const [callRaiseHand, setCallRaiseHand] = useState(false);
  const [callReactionsOpen, setCallReactionsOpen] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);
  const [skinToneIndex, setSkinToneIndex] = useState(0);
  const [callChatOpen, setCallChatOpen] = useState(false);
  const [callMembersOpen, setCallMembersOpen] = useState(false);
  const [liveCaption, setLiveCaption] = useState(false);
  const [liveTranslate, setLiveTranslate] = useState(false);
  const [translateLanguage, setTranslateLanguage] = useState('Spanish');
  const [callChatMessages, setCallChatMessages] = useState([
    { id: 1, sender: 'Sarah Jenkins', text: 'Hey, can everyone see my screen?', time: '10:01 AM', self: false },
    { id: 2, sender: 'You', text: 'Yes, all good!', time: '10:01 AM', self: true },
  ]);
  const [callChatInput, setCallChatInput] = useState('');
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [isDraggingChat, setIsDraggingChat] = useState(false);
  const chatDragStart = useRef({ x: 0, y: 0 });
  const [membersPosition, setMembersPosition] = useState({ x: -340, y: 0 });
  const [isDraggingMembers, setIsDraggingMembers] = useState(false);
  const membersDragStart = useRef({ x: 0, y: 0 });
  const callTimerRef = useRef(null);
  const mainInputRef = useRef(null);
  const callInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const previewVideoRef = useRef(null);
  const callCameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [emojiPickerTarget, setEmojiPickerTarget] = useState(null); // 'main' | 'call' | null
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerCategory, setPickerCategory] = useState('smileys');
  const [isMoreOptionsOpen, setIsMoreOptionsOpen] = useState(false);
  const [cameraBackground, setCameraBackground] = useState('none'); // 'none' | 'blur' | 'office' | 'neon'
  const [callLayout, setCallLayout] = useState('grid'); // 'grid' | 'spotlight'
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
  const [toastMessage, setToastMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mainMentionQuery, setMainMentionQuery] = useState(null);
  const [callMentionQuery, setCallMentionQuery] = useState(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);
  const [recentEmojis, setRecentEmojis] = useState(['😮', '😢', '😡', '😍', '😎', '👏', '👊', '🔥', '🎉', '👀', '💯', '💡', '✔', '➕', '❌', '➡️', '🚢', '🤔', '🥺', '😭', '🥰', '😌', '😰', '📎', '🙃', '😋', '😱', '😐', '🙄', '🤩', '🤪', '😑', '🥳', '🤣', '👋', '🤘']);
  // { [msgId]: { [emoji]: { count, reacted: bool } } }
  const [messageReactions, setMessageReactions] = useState({});
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const [reactionPickerMsgId, setReactionPickerMsgId] = useState(null);
  const [callMessageReactions, setCallMessageReactions] = useState({});
  const [hoveredCallMessageId, setHoveredCallMessageId] = useState(null);
  const [reactionPickerCallMsgId, setReactionPickerCallMsgId] = useState(null);

  const [channelMembers, setChannelMembers] = useState({
    'announcements': [
      { id: 2, name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', initial: 'S' }
    ],
    'general': [
      { id: 2, name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', initial: 'S' },
      { id: 3, name: 'Michael Chang', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', initial: 'M' },
      { id: 4, name: 'Emily Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100', initial: 'E' },
      { id: 5, name: 'David Miller', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', initial: 'D' }
    ],
    'dev-team': [
      { id: 3, name: 'Michael Chang', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', initial: 'M' },
      { id: 5, name: 'David Miller', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', initial: 'D' }
    ],
    'hr-room': [
      { id: 2, name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', initial: 'S' },
      { id: 4, name: 'Emily Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100', initial: 'E' }
    ]
  });

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [selectedAddMemberIds, setSelectedAddMemberIds] = useState([]);
  const [isCallDropdownOpen, setIsCallDropdownOpen] = useState(false);

  const [isCallPreviewOpen, setIsCallPreviewOpen] = useState(false);
  const [callType, setCallType] = useState('video'); // 'video' or 'audio'
  const [activeCallType, setActiveCallType] = useState('video'); // 'video' or 'audio'
  const [callPreviewCamera, setCallPreviewCamera] = useState(true);
  const [callPreviewMic, setCallPreviewMic] = useState(true);
  const [alwaysShowPreview, setAlwaysShowPreview] = useState(true);

  // ── Callback Refs for Videos to ensure auto-play on dynamic mount ─────────
  const handlePreviewVideoRef = useCallback((el) => {
    previewVideoRef.current = el;
    if (el && cameraStreamRef.current) {
      if (el.srcObject !== cameraStreamRef.current) {
        el.srcObject = cameraStreamRef.current;
        el.play().catch(() => {});
      }
    }
  }, []);

  const handleCallCameraVideoRef = useCallback((el) => {
    callCameraVideoRef.current = el;
    if (el && cameraStreamRef.current) {
      if (el.srcObject !== cameraStreamRef.current) {
        el.srcObject = cameraStreamRef.current;
        el.play().catch(() => {});
      }
    }
  }, []);

  // ── Real webcam feed ──────────────────────────────────────────────────────
  useEffect(() => {
    const wantCamera = (isCallPreviewOpen && callPreviewCamera) || (isInCall && callScreenCamera && !callScreenShare);

    if (wantCamera) {
      // Start or reuse existing stream
      if (!cameraStreamRef.current) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          .then(stream => {
            cameraStreamRef.current = stream;
            if (previewVideoRef.current && previewVideoRef.current.srcObject !== stream) {
              previewVideoRef.current.srcObject = stream;
              previewVideoRef.current.play().catch(() => {});
            }
            if (callCameraVideoRef.current && callCameraVideoRef.current.srcObject !== stream) {
              callCameraVideoRef.current.srcObject = stream;
              callCameraVideoRef.current.play().catch(() => {});
            }
          })
          .catch((err) => {
            console.error("Camera access error:", err);
          });
      } else {
        // Stream exists — just (re-)attach if not already attached to prevent re-decoding blinking
        if (previewVideoRef.current && previewVideoRef.current.srcObject !== cameraStreamRef.current) {
          previewVideoRef.current.srcObject = cameraStreamRef.current;
          previewVideoRef.current.play().catch(() => {});
        }
        if (callCameraVideoRef.current && callCameraVideoRef.current.srcObject !== cameraStreamRef.current) {
          callCameraVideoRef.current.srcObject = cameraStreamRef.current;
          callCameraVideoRef.current.play().catch(() => {});
        }
      }
    } else {
      // Stop and release stream when camera is disabled or call inactive
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(t => t.stop());
        cameraStreamRef.current = null;
      }
    }
  }, [isCallPreviewOpen, callPreviewCamera, isInCall, callScreenCamera, callScreenShare]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);


  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const startOffset = useRef({ x: 0, y: 0 });
  
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Alice Chen', avatar: 'https://ui-avatars.com/api/?name=Alice+Chen&background=0D8ABC&color=fff', status: 'Active' },
    { id: 2, name: 'Bob Smith', avatar: 'https://ui-avatars.com/api/?name=Bob+Smith&background=3B82F6&color=fff', status: 'Active' },
    { id: 3, name: 'Charlie Davis', avatar: 'https://ui-avatars.com/api/?name=Charlie+Davis&background=6B7280&color=fff', status: 'Active' },
    { id: 4, name: 'Diana Prince', avatar: 'https://ui-avatars.com/api/?name=Diana+Prince&background=F59E0B&color=fff', status: 'On Leave' },
    { id: 5, name: 'Evan Wright', avatar: 'https://ui-avatars.com/api/?name=Evan+Wright&background=EF4444&color=fff', status: 'Active' },
    { id: 6, name: 'Fiona Gallagher', avatar: 'https://ui-avatars.com/api/?name=Fiona+Gallagher&background=10B981&color=fff', status: 'Active' },
    { id: 7, name: 'George Hale', avatar: 'https://ui-avatars.com/api/?name=George+Hale&background=3B82F6&color=fff', status: 'Active' },
    { id: 8, name: 'Hannah Lee', avatar: 'https://ui-avatars.com/api/?name=Hannah+Lee&background=F59E0B&color=fff', status: 'Active' },
    { id: 9, name: 'Ivy Green', avatar: 'https://ui-avatars.com/api/?name=Ivy+Green&background=EF4444&color=fff', status: 'Active' },
    { id: 10, name: 'Jack White', avatar: 'https://ui-avatars.com/api/?name=Jack+White&background=EF4444&color=fff', status: 'Active' },
    { id: 11, name: 'Kevin Taylor', avatar: 'https://ui-avatars.com/api/?name=Kevin+Taylor&background=8B5CF6&color=fff', status: 'Active' },
    { id: 12, name: 'Michael Chang', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', status: 'Active' },
    { id: 102, name: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', status: 'Active' },
    { id: 104, name: 'Emily Rodriguez', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100', status: 'Active' },
    { id: 105, name: 'David Miller', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', status: 'On Leave' }
  ]);

  const globalDirectory = [
    { id: 106, name: 'Sophia Patel', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=100', status: 'On Leave', role: 'Marketing Specialist' },
    { id: 107, name: 'Alex Rivera', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=100', status: 'Active', role: 'Frontend Developer Candidate' },
    { id: 108, name: 'Jessica Chen', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=100', status: 'Active', role: 'Product Manager Candidate' },
    { id: 109, name: 'Liam O\'Connor', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', status: 'Active', role: 'DevOps Candidate' }
  ];

  const currentChannel = chatChannels.find(c => c.id === selectedChannel);

  const [localDmMessages, setLocalDmMessages] = useState({
    'dm-12': [
      { id: 1, sender: 'Sarah Jenkins', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', text: 'Hi Michael, did you get a chance to look at the onboarding tasks?', timestamp: 'Yesterday' },
      { id: 2, sender: 'Michael Chang', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', text: 'Yes Sarah! Finished the database structures and directory mappings.', timestamp: 'Yesterday' }
    ]
  });

  const messages = currentChannel 
    ? { [selectedChannel]: (currentChannel.messages || []) }
    : localDmMessages;

  const [inputVal, setInputVal] = useState('');
  const chatEndRef = useRef(null);
  const screenStreamRef = useRef(null);
  const screenVideoRef = useRef(null);
  const fileInputRef = useRef(null);
  const mainFileInputRef = useRef(null);

  const isDM = selectedChannel.startsWith('dm-');
  const dmEmpId = isDM ? parseInt(selectedChannel.replace('dm-', ''), 10) : null;
  const dmEmployee = isDM ? employees.find(e => e.id === dmEmpId) : null;

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedChannel]);

  // Call duration timer
  useEffect(() => {
    if (isInCall) {
      setCallDuration(0);
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [isInCall]);

  const formatCallDuration = (secs) => {
    const m = String(Math.floor(secs / 60)).padStart(2, '0');
    const s = String(secs % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  const sendReaction = (emoji) => {
    const id = Date.now() + Math.random();
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2000);
  };

  // Reactively bind the screen stream to the <video> element after React commits
  useEffect(() => {
    if (screenVideoRef.current) {
      screenVideoRef.current.srcObject = screenStreamRef.current || null;
      if (screenStreamRef.current) {
        screenVideoRef.current.play().catch(() => {});
      }
    }
  }, [callScreenShare]);

  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      screenStreamRef.current = stream;
      setCallScreenShare(true); // triggers the useEffect above after commit
      // Auto-stop when user clicks browser's native "Stop sharing"
      stream.getVideoTracks()[0].addEventListener('ended', stopScreenShare);
    } catch (err) {
      console.warn('Screen share cancelled or denied:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    setCallScreenShare(false); // triggers the useEffect to clear srcObject
  };

  // Reset position on channel switch
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [selectedChannel]);

  // Handle document level mouse events when dragging is active
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const newX = e.clientX - startOffset.current.x;
      const newY = e.clientY - startOffset.current.y;
      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle click outside to close call dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (isCallDropdownOpen && !e.target.closest(`.${styles.headerActions}`)) {
        setIsCallDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [isCallDropdownOpen]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('img')) return;
    setIsDragging(true);
    startOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.preventDefault();
  };

  // Handle document level mouse events when dragging the in-call chat is active
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingChat) return;
      const newX = e.clientX - chatDragStart.current.x;
      const newY = e.clientY - chatDragStart.current.y;
      setChatPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingChat(false);
    };

    if (isDraggingChat) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingChat]);

  const handleChatMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDraggingChat(true);
    chatDragStart.current = {
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y
    };
    e.preventDefault();
  };

  // Handle document level mouse events when dragging the members panel is active
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingMembers) return;
      const newX = e.clientX - membersDragStart.current.x;
      const newY = e.clientY - membersDragStart.current.y;
      setMembersPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDraggingMembers(false);
    };

    if (isDraggingMembers) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingMembers]);

  const handleMembersMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsDraggingMembers(true);
    membersDragStart.current = {
      x: e.clientX - membersPosition.x,
      y: e.clientY - membersPosition.y
    };
    e.preventDefault();
  };

  const handleCreateChannel = (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) {
      setChannelError('Channel name is required.');
      return;
    }
    
    const formattedName = newChannelName.startsWith('#') ? newChannelName.trim() : `#${newChannelName.trim()}`;
    const newId = formattedName.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/^-+|-+$/g, '');
    
    if (chatChannels.some(c => c.id === newId)) {
      setChannelError('A channel with this name already exists.');
      return;
    }
    
    const newChan = {
      id: newId,
      name: formattedName,
      label: newChannelDesc.trim() || `${newChannelName} Channel`,
      type: 'staff',
      members: ['101', '102', '103', '105', 'hr'],
      messages: [
        {
          id: Date.now(),
          sender: 'System',
          text: `Channel ${formattedName} created by TL Michael Vance.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    
    const updated = [...chatChannels, newChan];
    onUpdateDb({ ...db, chatChannels: updated });
    
    setNewChannelName('');
    setNewChannelDesc('');
    setIsModalOpen(false);
    setSelectedChannel(newId);
  };

  const handleDeleteChannel = (channelName) => {
    if (!window.confirm(`Are you sure you want to delete the channel #${channelName}?`)) {
      return;
    }
    
    const updatedChannels = channels.filter(c => c !== channelName);
    const myRemainingChannels = updatedChannels.filter(chan => (channelMembers[chan] || []).some(m => m.id === 2));

    setChannels(updatedChannels);
    
    if (selectedChannel === channelName) {
      if (myRemainingChannels.length > 0) {
        setSelectedChannel(myRemainingChannels[0]);
      } else {
        setSelectedChannel('');
      }
    }

    setChannelDescriptions(prev => {
      const next = { ...prev };
      delete next[channelName];
      return next;
    });

    setMessages(prev => {
      const next = { ...prev };
      delete next[channelName];
      return next;
    });
  };

  const handleAddMembers = (e) => {
    e.preventDefault();
    if (selectedAddMemberIds.length === 0) {
      setIsAddMemberModalOpen(false);
      return;
    }

    // Merge employees and globalDirectory to search from all available users
    const allAvailableUsers = [...employees];
    globalDirectory.forEach(item => {
      if (!allAvailableUsers.some(u => u.id === item.id)) {
        allAvailableUsers.push(item);
      }
    });

    const membersToAdd = allAvailableUsers.filter(emp => selectedAddMemberIds.includes(emp.id));
    
    const mappedAdditions = membersToAdd.map(m => ({
      ...m,
      initial: m.name.charAt(0).toLowerCase()
    }));

    setChannelMembers(prev => {
      const currentList = prev[selectedChannel] || [];
      const cleanList = currentList.filter(m => !m.isPlaceholder);
      return {
        ...prev,
        [selectedChannel]: [...cleanList, ...mappedAdditions]
      };
    });

    // Also add to active employees list if they are a newly added candidate
    setEmployees(prev => {
      const updated = [...prev];
      membersToAdd.forEach(m => {
        if (!updated.some(u => u.id === m.id)) {
          updated.push(m);
        }
      });
      return updated;
    });

    setIsAddMemberModalOpen(false);
    setSelectedAddMemberIds([]);
  };

  // Handle chat submission and simulated reply
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);

    const newMsg = {
      id: Date.now(),
      sender: 'Michael Vance (Team Lead)',
      avatar: 'https://ui-avatars.com/api/?name=Michael+Vance&background=3b82f6&color=fff',
      text: inputVal,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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

    // Trigger simulated chat response from a random colleague or the DM recipient
    setTimeout(() => {
      if (isDM) {
        if (dmEmpId === 101) return; // No auto-reply for notes to self
        
        const dmReplies = [
          "Awesome, thanks for the update!",
          "I'll look into this right away.",
          "Sounds good to me, let's sync up later.",
          "Can you share the file or link for that?",
          "Got it, thanks Michael!"
        ];
        const randomDMReply = dmReplies[Math.floor(Math.random() * dmReplies.length)];
        
        const colleagueMsg = {
          id: Date.now() + 1,
          sender: dmEmployee?.name || 'Colleague',
          avatar: dmEmployee?.avatar || 'https://ui-avatars.com/api/?name=Colleague',
          text: randomDMReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setLocalDmMessages(prev => ({
          ...prev,
          [selectedChannel]: [...(prev[selectedChannel] || []), colleagueMsg]
        }));
        return;
      }

      if (selectedChannel === 'team-room') {
        const replies = [
          "Vite project hot module replacement is lightning fast!",
          "Agreed. Scoped CSS modules solved all our visual overlap issues.",
          "Pushing my branch updates now. All clean!",
          "Working on the task Kanban columns today."
        ];
        const randomReply = replies[Math.floor(Math.random() * replies.length)];
        
        const colleagueMsg = {
          id: Date.now() + 1,
          sender: 'Jane Smith',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100',
          text: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const updatedChannels = chatChannels.map(c => {
          if (c.id === 'team-room') {
            return {
              ...c,
              messages: [...(c.messages || []), colleagueMsg]
            };
          }
          return c;
        });
        onUpdateDb({ ...db, chatChannels: updatedChannels });
      }
    }, 1500);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCallChatMessages(prev => [...prev, {
      id: Date.now(),
      sender: 'You',
      text: `📎 Shared file: ${file.name}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      self: true,
    }]);
    e.target.value = '';
  };

  const handleMainFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);

    const newMsg = {
      id: Date.now(),
      sender: 'Michael Vance (Team Lead)',
      avatar: 'https://ui-avatars.com/api/?name=Michael+Vance&background=3b82f6&color=fff',
      text: `📎 Shared file: ${file.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
    e.target.value = '';
  };

  const emojiCategories = {
    smileys: {
      name: 'Smileys & Emotion',
      emojis: ['😊', '😂', '🤣', '🥰', '😍', '🤩', '😎', '😜', '🤪', '🤔', '🤨', '😐', '😑', '🙄', '😬', '😌', '😔', '😪', '😴', '😷', '🥵', '🥶', '😵', '🤯', '😭', '🥺', '😡', '😱']
    },
    gestures: {
      name: 'Gestures & Body',
      emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪']
    },
    people: {
      name: 'People',
      emojis: ['👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👩‍🦱', '🧑‍🦱', '👨‍🦱', '👱‍♀️', '👱', '👱‍♂️', '👩‍🦳', '🧑‍🦳', '👨‍🦳', '🦸‍♀️', '🦸', '🦸‍♂️', '🦹‍♀️', '🦹', '🦹‍♂️', '🧙‍♀️', '🧙‍♂️']
    },
    animals: {
      name: 'Animals & Nature',
      emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐝', '🐛']
    },
    food: {
      name: 'Food & Drink',
      emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🍕', '🍔', '🍟', '🌭', '🥪']
    },
    places: {
      name: 'Travel & Places',
      emojis: ['🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️', '🏟️', '🏛️', '🏘️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏬', '🏭', '🏰', '🗼']
    },
    objects: {
      name: 'Objects',
      emojis: ['⌚', '📱', '💻', '⌨️', '🖱️', '🕯️', '💡', '🔦', '🏮', '📔', '📕', '📖', '📗', '📘', '📚', '✉️', '📧', '📨', '📩', '📦', '✏️', '✒️', '📝', '📁', '📂', '📅', '📎']
    },
    activities: {
      name: 'Activities',
      emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🎱', '🏓', '🏸', '🏒', '🏏', '🥅', '⛳', '🏹', '🎣', '🥊', '🥋', '🛹', '🛼', '⛸️', '🎿', '🏂']
    },
    symbols: {
      name: 'Symbols & Hearts',
      emojis: ['💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💤', '⚠️', '⛔', '🚫', '⬆️', '➡️', '⬇️', '⬅️', '🔜', '🔝']
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emojiPickerTarget &&
        !e.target.closest(`.${styles.emojiPickerPopup}`) &&
        !e.target.closest(`.${styles.callEmojiPickerPopup}`) &&
        !e.target.closest(`.${styles.chatActionBtn}`) &&
        !e.target.closest(`.${styles.callChatActionBtn}`)
      ) {
        setEmojiPickerTarget(null);
      }
      if (
        isMoreOptionsOpen &&
        !e.target.closest(`.${styles.moreOptionsContainer}`)
      ) {
        setIsMoreOptionsOpen(false);
      }
      if (
        mainMentionQuery !== null &&
        !e.target.closest(`.${styles.mentionDropdown}`) &&
        !e.target.closest(`.${styles.chatInput}`)
      ) {
        setMainMentionQuery(null);
      }
      if (
        callMentionQuery !== null &&
        !e.target.closest(`.${styles.mentionDropdown}`) &&
        !e.target.closest(`.${styles.callChatInput}`)
      ) {
        setCallMentionQuery(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [emojiPickerTarget, isMoreOptionsOpen, mainMentionQuery, callMentionQuery]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn("Fullscreen request failed:", err);
      });
    } else {
      try {
        document.exitFullscreen().catch((err) => {
          console.warn("Fullscreen exit failed:", err);
        });
      } catch (err) {
        console.warn("Fullscreen exit error:", err);
      }
    }
    setIsMoreOptionsOpen(false);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? '' : prev);
    }, 3500);
  };

  const handleAdjustView = () => {
    const nextLayout = callLayout === 'grid' ? 'spotlight' : 'grid';
    setCallLayout(nextLayout);
    showToast(`Layout adjusted to ${nextLayout === 'grid' ? 'Grid View' : 'Spotlight View'}.`);
    setIsMoreOptionsOpen(false);
  };

  const handleFullScreen = () => {
    const isEntering = !document.fullscreenElement;
    toggleFullScreen();
    showToast(isEntering ? "Entered fullscreen mode" : "Exited fullscreen mode");
  };

  const handlePictureInPicture = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showToast("Exited picture-in-picture mode.");
      } else {
        const videoEl = callScreenShare ? screenVideoRef.current : (callScreenCamera ? callCameraVideoRef.current : null);
        if (videoEl) {
          await videoEl.requestPictureInPicture();
          showToast("Entered picture-in-picture mode.");
        } else {
          showToast("Picture-in-picture requires active camera or screen share.");
        }
      }
    } catch (err) {
      console.error("Picture-in-picture error:", err);
      showToast("Picture-in-picture is not supported or failed.");
    }
    setIsMoreOptionsOpen(false);
  };

  const handleBackgrounds = () => {
    const bgTypes = ['none', 'blur', 'office', 'neon'];
    const nextIdx = (bgTypes.indexOf(cameraBackground) + 1) % bgTypes.length;
    const nextBg = bgTypes[nextIdx];
    setCameraBackground(nextBg);
    
    let bgLabel = "Normal Camera";
    if (nextBg === 'blur') bgLabel = "Blurred Background";
    if (nextBg === 'office') bgLabel = "Virtual Office Room";
    if (nextBg === 'neon') bgLabel = "Cyberpunk Neon Party";
    
    showToast(`Background applied: ${bgLabel}`);
    setIsMoreOptionsOpen(false);
  };

  const handleReportProblem = () => {
    showToast("Thank you. Feedback report has been sent to ERP Support.");
    setIsMoreOptionsOpen(false);
  };

  const handleReportAbuse = () => {
    showToast("Safety report submitted successfully.");
    setIsMoreOptionsOpen(false);
  };

  const handleTroubleshoot = () => {
    showToast("Diagnostics: Latency: 12ms | Loss: 0% | FPS: 30 | Audio: OK");
    setIsMoreOptionsOpen(false);
  };

  const handleSettings = () => {
    showToast("SyncUp device settings are fully optimized.");
    setIsMoreOptionsOpen(false);
  };

  const handleEndCall = async () => {
    playRelevantSound('endcall');
    
    // 1. Stop screen share stream if active
    stopScreenShare();
    
    // 2. Stop camera stream
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(t => t.stop());
      cameraStreamRef.current = null;
    }
    
    // 3. Stop recording if recording is active
    if (isRecording && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    
    // 4. Exit picture-in-picture if active
    if (document.pictureInPictureElement) {
      try {
        await document.exitPictureInPicture();
      } catch (err) {
        console.warn("Exit PiP failed:", err);
      }
    }
    
    // 5. Exit fullscreen if active
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch (err) {
        console.warn("Exit fullscreen failed:", err);
      }
    }
    
    // 6. Reset layouts and panels
    setCallLayout('grid');
    setCallChatOpen(false);
    setCallReactionsOpen(false);
    setIsMoreOptionsOpen(false);
    setCallScreenMic(true);
    setCallScreenCamera(true);
    setChatPosition({ x: 0, y: 0 });
    
    // 7. Finally, exit call overlay
    setIsInCall(false);
  };

  const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

  const handleQuickReact = (msgId, emoji) => {
    setMessageReactions(prev => {
      const msgReacts = prev[msgId] || {};
      const existing = msgReacts[emoji] || { count: 0, reacted: false };
      const nowReacted = !existing.reacted;
      const newCount = nowReacted ? existing.count + 1 : existing.count - 1;
      if (newCount <= 0) {
        const { [emoji]: _removed, ...rest } = msgReacts;
        return { ...prev, [msgId]: rest };
      }
      return {
        ...prev,
        [msgId]: { ...msgReacts, [emoji]: { count: newCount, reacted: nowReacted } }
      };
    });
    setReactionPickerMsgId(null);
  };

  const handleCallQuickReact = (msgId, emoji) => {
    setCallMessageReactions(prev => {
      const msgReacts = prev[msgId] || {};
      const existing = msgReacts[emoji] || { count: 0, reacted: false };
      const nowReacted = !existing.reacted;
      const newCount = nowReacted ? existing.count + 1 : existing.count - 1;
      if (newCount <= 0) {
        const { [emoji]: _removed, ...rest } = msgReacts;
        return { ...prev, [msgId]: rest };
      }
      return {
        ...prev,
        [msgId]: { ...msgReacts, [emoji]: { count: newCount, reacted: nowReacted } }
      };
    });
    setReactionPickerCallMsgId(null);
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      // Stop recording → triggers ondataavailable → save file
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      setIsMoreOptionsOpen(false);
    } else {
      // Start recording
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { frameRate: 30 },
          audio: true
        });
        let combinedStream = displayStream;
        try {
          const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const dest = audioCtx.createMediaStreamDestination();
          [displayStream, micStream].forEach(s => {
            if (s.getAudioTracks().length > 0) {
              audioCtx.createMediaStreamSource(s).connect(dest);
            }
          });
          combinedStream = new MediaStream([
            ...displayStream.getVideoTracks(),
            ...dest.stream.getAudioTracks()
          ]);
        } catch (_) {
          // mic permission denied — record display only
        }

        recordingChunksRef.current = [];
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
          ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';
        const recorder = new MediaRecorder(combinedStream, { mimeType });
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) recordingChunksRef.current.push(e.data);
        };

        recorder.onstop = () => {
          const blob = new Blob(recordingChunksRef.current, { type: mimeType });
          const now = new Date();
          const pad = n => String(n).padStart(2, '0');
          const filename = `SyncUp-Recording-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.webm`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          showToast(`✅ Saved to Downloads: ${filename}`);
          combinedStream.getTracks().forEach(t => t.stop());
        };

        // Stop recording if user ends the screen-share natively
        displayStream.getVideoTracks()[0].onended = () => {
          if (recorder.state !== 'inactive') recorder.stop();
          setIsRecording(false);
        };

        recorder.start(1000); // collect chunks every 1 s
        setIsRecording(true);
        showToast('🔴 Recording started — file will download when stopped');
        setIsMoreOptionsOpen(false);
      } catch (err) {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          showToast('⚠️ Could not start recording: ' + err.message);
        }
        setIsMoreOptionsOpen(false);
      }
    }
  };

  const playRelevantSound = (type, stateBeforeClick) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const playTone = (freq, time, duration, gainVal = 1.0, typeOsc = 'triangle') => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = typeOsc;
        osc.frequency.setValueAtTime(freq, time);
        gain.gain.setValueAtTime(gainVal, time);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      const now = ctx.currentTime;
      
      if (type === 'mic' || type === 'camera' || type === 'screenshare') {
        // stateBeforeClick: true = turning OFF, false = turning ON
        if (stateBeforeClick) {
          // Turning OFF (descending chime)
          playTone(900, now, 0.08, 0.8, 'sine');
          playTone(600, now + 0.06, 0.12, 0.8, 'sine');
        } else {
          // Turning ON (ascending chime)
          playTone(600, now, 0.08, 0.8, 'sine');
          playTone(900, now + 0.06, 0.12, 0.8, 'sine');
        }
      } else if (type === 'panel') {
        // stateBeforeClick: true = closing panel, false = opening panel
        if (stateBeforeClick) {
          // Closing (descending slide/pop)
          playTone(1000, now, 0.06, 0.6, 'triangle');
          playTone(700, now + 0.04, 0.1, 0.6, 'triangle');
        } else {
          // Opening (ascending slide/pop)
          playTone(700, now, 0.06, 0.6, 'triangle');
          playTone(1000, now + 0.04, 0.1, 0.6, 'triangle');
        }
      } else if (type === 'hand') {
        // stateBeforeClick: true = lowering hand, false = raising hand
        if (stateBeforeClick) {
          // Lowering hand (descending slip)
          playTone(1200, now, 0.06, 0.8, 'sine');
          playTone(800, now + 0.05, 0.12, 0.8, 'sine');
        } else {
          // Raising hand (pleasant bright bell notify)
          playTone(880, now, 0.05, 0.8, 'triangle');
          playTone(1760, now + 0.03, 0.25, 0.8, 'triangle');
        }
      } else if (type === 'endcall') {
        // End call chime (descending disconnect tone chord)
        playTone(600, now, 0.1, 1.0, 'sine');
        playTone(450, now + 0.08, 0.15, 1.0, 'sine');
        playTone(300, now + 0.16, 0.22, 1.0, 'sine');
      } else if (type === 'cancel') {
        // Cancel — soft quiet descending double pop (dismissive)
        playTone(500, now, 0.07, 0.5, 'sine');
        playTone(350, now + 0.05, 0.1, 0.4, 'sine');
      } else if (type === 'startcall') {
        // Start SyncUp — bright triumphant ascending triple chime
        playTone(660, now, 0.07, 0.9, 'triangle');
        playTone(880, now + 0.06, 0.07, 0.9, 'triangle');
        playTone(1320, now + 0.12, 0.18, 0.9, 'triangle');
      }

      // Close the AudioContext after 800ms to allow all tones to finish and release browser media resources
      setTimeout(() => {
        if (ctx && ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      }, 800);
    } catch (error) {
      console.warn("Failed to play relevant sound:", error);
    }
  };

  const getMentionQuery = (text, selectionStart) => {
    if (selectionStart === undefined) return null;
    const textBeforeCursor = text.slice(0, selectionStart);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    if (lastAtIndex === -1) return null;
    
    const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
    if (textAfterAt.includes(' ')) return null; 
    
    if (lastAtIndex > 0 && textBeforeCursor[lastAtIndex - 1] !== ' ') {
      return null;
    }
    
    return textAfterAt.toLowerCase();
  };

  const getMentionSuggestions = (query) => {
    if (query === null) return [];
    
    let allUsers = [];
    if (isDM) {
      allUsers = [];
      if (dmEmployee && dmEmployee.id !== 2 && String(dmEmployee.id) !== '2' && dmEmployee.name !== 'Sarah Jenkins') {
        allUsers.push({
          id: dmEmployee.id,
          name: dmEmployee.name,
          avatar: dmEmployee.avatar,
          role: dmEmployee.role,
          status: dmEmployee.status
        });
      }
    } else {
      allUsers = (channelMembers[selectedChannel] || [])
        .filter(member => member.id !== 2 && String(member.id) !== '2' && member.name !== 'Sarah Jenkins')
        .map(member => {
          const details = employees.find(e => e.id === member.id) || 
                          globalDirectory.find(e => e.id === member.id);
          return {
            id: member.id,
            name: member.name,
            avatar: member.avatar,
            role: details?.role,
            status: details?.status
          };
        });
      
      // Prepend @All option
      allUsers.unshift({
        id: 'all',
        name: 'All',
        avatar: '', // blank to trigger Group icon fallback
        role: 'Mention everyone in this group',
        status: 'Group'
      });
    }

    if (query === '') return allUsers;
    
    return allUsers.filter(user => 
      user.name.toLowerCase().includes(query) || 
      (user.role && user.role.toLowerCase().includes(query))
    );
  };

  const insertMention = (target, employeeName) => {
    if (target === 'main') {
      const text = inputVal;
      const inputEl = mainInputRef.current;
      if (!inputEl) return;
      const selStart = inputEl.selectionStart;
      const textBeforeCursor = text.slice(0, selStart);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      const newText = text.slice(0, lastAtIndex) + `@${employeeName} ` + text.slice(selStart);
      setInputVal(newText);
      setMainMentionQuery(null);
      
      setTimeout(() => {
        inputEl.focus();
        const cursorPosition = lastAtIndex + employeeName.length + 2;
        inputEl.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    } else {
      const text = callChatInput;
      const inputEl = callInputRef.current;
      if (!inputEl) return;
      const selStart = inputEl.selectionStart;
      const textBeforeCursor = text.slice(0, selStart);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      const newText = text.slice(0, lastAtIndex) + `@${employeeName} ` + text.slice(selStart);
      setCallChatInput(newText);
      setCallMentionQuery(null);
      
      setTimeout(() => {
        inputEl.focus();
        const cursorPosition = lastAtIndex + employeeName.length + 2;
        inputEl.setSelectionRange(cursorPosition, cursorPosition);
      }, 0);
    }
  };

  const handleMainInputChange = (e) => {
    const val = e.target.value;
    setInputVal(val);
    const query = getMentionQuery(val, e.target.selectionStart);
    setMainMentionQuery(query);
    setActiveSuggestionIndex(0);
  };
  
  const handleMainInputKeyDown = (e) => {
    if (mainMentionQuery !== null) {
      const suggestions = getMentionSuggestions(mainMentionQuery);
      if (suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          insertMention('main', suggestions[activeSuggestionIndex].name);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setMainMentionQuery(null);
        }
      }
    }
  };

  const handleCallInputChange = (e) => {
    const val = e.target.value;
    setCallChatInput(val);
    const query = getMentionQuery(val, e.target.selectionStart);
    setCallMentionQuery(query);
    setActiveSuggestionIndex(0);
  };
  
  const handleCallInputKeyDown = (e) => {
    if (callMentionQuery !== null) {
      const suggestions = getMentionSuggestions(callMentionQuery);
      if (suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          insertMention('call', suggestions[activeSuggestionIndex].name);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          setCallMentionQuery(null);
        }
      }
    }
  };

  const renderMentionDropdown = (target) => {
    const query = target === 'main' ? mainMentionQuery : callMentionQuery;
    const suggestions = getMentionSuggestions(query);
    if (suggestions.length === 0) return null;
    
    const isDark = target === 'call';
    
    return (
      <div className={`${styles.mentionDropdown} ${isDark ? styles.mentionDropdownDark : styles.mentionDropdownLight}`}>
        {suggestions.map((user, index) => {
          const isActive = index === activeSuggestionIndex;
          return (
            <div 
              key={user.id} 
              className={`${styles.mentionItem} ${isActive ? styles.mentionItemActive : ''}`}
              onClick={() => insertMention(target, user.name)}
              onMouseEnter={() => setActiveSuggestionIndex(index)}
            >
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className={styles.mentionAvatar} />
              ) : (
                <div className={`${styles.mentionAvatar} ${styles.mentionAvatarGroup}`}>
                  <Users size={14} style={{ color: isDark ? '#94a3b8' : 'var(--text-secondary)' }} />
                </div>
              )}
              <div className={styles.mentionUserInfo}>
                <span className={styles.mentionName}>{user.name}</span>
                <span className={styles.mentionRole}>{user.role || (user.status === 'Active' ? 'Active' : 'On Leave')}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const toggleEmojiPicker = (target) => {
    if (emojiPickerTarget === target) {
      setEmojiPickerTarget(null);
    } else {
      setEmojiPickerTarget(target);
      setPickerSearch('');
      setPickerCategory('smileys');
    }
  };

  const renderEmojiPicker = (theme) => {
    const isDark = theme === 'dark';
    const categoriesList = [
      { id: 'recent', icon: <Clock size={16} />, title: 'Recent' },
      { id: 'smileys', icon: <Smile size={16} />, title: 'Smileys & Emotion' },
      { id: 'gestures', icon: <Hand size={16} />, title: 'Gestures & Body' },
      { id: 'people', icon: <Users size={16} />, title: 'People' },
      { id: 'animals', icon: <Sparkles size={16} />, title: 'Animals & Nature' },
      { id: 'food', icon: <Pizza size={16} />, title: 'Food & Drink' },
      { id: 'places', icon: <Building size={16} />, title: 'Travel & Places' },
      { id: 'objects', icon: <Lightbulb size={16} />, title: 'Objects' },
      { id: 'activities', icon: <Trophy size={16} />, title: 'Activities' },
      { id: 'symbols', icon: <Hash size={16} />, title: 'Symbols' }
    ];

    const handleEmojiClick = (emoji) => {
      if (emojiPickerTarget === 'main') {
        setInputVal(prev => prev + emoji);
      } else {
        setCallChatInput(prev => prev + emoji);
      }
      setRecentEmojis(prev => {
        const filtered = prev.filter(e => e !== emoji);
        return [emoji, ...filtered].slice(0, 36);
      });
    };

    const getFilteredEmojis = () => {
      if (!pickerSearch.trim()) {
        if (pickerCategory === 'recent') return recentEmojis;
        return emojiCategories[pickerCategory]?.emojis || [];
      }
      const query = pickerSearch.toLowerCase();
      let matches = [];
      Object.values(emojiCategories).forEach(cat => {
        cat.emojis.forEach(e => {
          if (e.includes(query) || cat.name.toLowerCase().includes(query)) {
            if (!matches.includes(e)) matches.push(e);
          }
        });
      });
      return matches;
    };

    return (
      <div className={isDark ? styles.callEmojiPickerPopup : styles.emojiPickerPopup}>
        <div className={styles.pickerSearchRow}>
          <div className={styles.pickerSearchWrapper}>
            <input 
              type="text" 
              placeholder="Find something fun" 
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
            />
            <Search size={14} className={styles.pickerSearchIcon} />
          </div>
          <button type="button" className={styles.pickerSmileBrushBtn} title="Customize">
            <Smile size={16} />
            <span className={styles.brushDot} />
          </button>
        </div>

        <div className={styles.pickerContentBody}>
          <div className={styles.emojiGridContainer}>
            <div className={styles.categoryTitleHeader}>
              {pickerSearch ? 'Search Results' : categoriesList.find(c => c.id === pickerCategory)?.title}
            </div>
            <div className={styles.emojiGrid}>
              {getFilteredEmojis().map((emoji, index) => (
                <button 
                  key={index} 
                  type="button" 
                  className={styles.emojiGridCell}
                  onClick={() => handleEmojiClick(emoji)}
                >
                  {emoji}
                </button>
              ))}
              {getFilteredEmojis().length === 0 && (
                <div className={styles.noPickerResults}>No emojis found</div>
              )}
            </div>
          </div>
        </div>

        {!pickerSearch && (
          <div className={styles.pickerCategoriesBar}>
            {categoriesList.map(cat => (
              <button 
                key={cat.id} 
                type="button" 
                className={`${styles.pickerCategoryBtn} ${pickerCategory === cat.id ? styles.activeCategory : ''}`}
                onClick={() => setPickerCategory(cat.id)}
                title={cat.title}
              >
                {cat.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getCallParticipants = () => {
    if (isDM) {
      return [
        { id: 101, name: 'Michael Vance (Team Lead)', avatar: 'https://ui-avatars.com/api/?name=Michael+Vance&background=3b82f6&color=fff', initial: 'M', isMe: true },
        ...(dmEmployee ? [{ id: dmEmployee.id, name: dmEmployee.name, avatar: dmEmployee.avatar, initial: dmEmployee.name[0], isMe: false }] : [])
      ];
    } else {
      const members = channelMembers[selectedChannel] || [];
      const hasMe = members.some(m => m.id === 101);
      const list = hasMe ? [...members] : [...members, { id: 101, name: 'Michael Vance (Team Lead)', avatar: 'https://ui-avatars.com/api/?name=Michael+Vance&background=3b82f6&color=fff', initial: 'M' }];
      return list
        .filter(m => {
          const emp = employees.find(e => e.id === m.id);
          return emp?.status !== 'On Leave';
        })
        .map(m => ({
          ...m,
          isMe: m.id === 101
        }));
    }
  };

  const channelMessages = messages[selectedChannel] || [];

  return (
    <>
      <div className={`fade-in ${styles.chatContainer} ${selectedChannel ? styles.channelActive : ''}`}>
      {/* Channels Sidebar */}
      <div className={styles.channelsSidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Colleagues Chat</h3>
          <button 
            className={styles.addBtn} 
            title="Create Channel"
            onClick={() => {
              setIsModalOpen(true);
              setNewChannelName('');
              setNewChannelDesc('');
              setChannelError('');
            }}
          >
            <Plus size={16} />
          </button>
        </div>

        <div className={styles.searchBox}>
          <Search size={14} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="search a candidate" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button" 
              className={styles.clearSearchBtn} 
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className={styles.sectionTitle}>Channels</div>
        <div className={styles.list}>
          {myChannels
            .filter(chan => chan.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(chan => {
              const isActive = selectedChannel === chan.id;
              return (
                <div
                  key={chan.id}
                  className={`${styles.channelItemWrapper} ${isActive ? styles.active : ''}`}
                >
                  <button
                    className={styles.channelItemBtn}
                    onClick={() => setSelectedChannel(chan.id)}
                  >
                    <Hash size={16} />
                    <span>{chan.name}</span>
                  </button>
                </div>
              );
            })}
          {myChannels.filter(chan => chan.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
            <div className={styles.noResultsText}>No channels found</div>
          )}
        </div>

        <div className={styles.sectionTitle}>Direct Messages</div>
        <div className={styles.list}>
          {employees
            .filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .map(emp => {
              const isSelected = selectedChannel === `dm-${emp.id}`;
              return (
                <button
                  key={emp.id}
                  className={`${styles.directItem} ${isSelected ? styles.active : ''}`}
                  onClick={() => setSelectedChannel(`dm-${emp.id}`)}
                >
                  <div className={styles.avatarWrapper}>
                    <img src={emp.avatar} alt={emp.name} />
                    <span className={`${styles.statusDot} ${emp.status === 'On Leave' ? styles.onleave : styles.active}`} />
                  </div>
                  <span>{emp.name}</span>
                </button>
              );
            })}
          {employees
            .filter(emp => emp.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className={styles.noResultsText}>No colleagues found</div>
            )}
        </div>

        {searchQuery && (
          <>
            <div className={styles.sectionTitle}>Candidates & Other Colleagues</div>
            <div className={styles.list}>
              {globalDirectory
                .filter(item => !employees.some(e => e.id === item.id))
                .filter(item => 
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (item.role && item.role.toLowerCase().includes(searchQuery.toLowerCase()))
                )
                .map(item => (
                  <button
                    key={item.id}
                    className={styles.directItem}
                    onClick={() => {
                      setEmployees(prev => [...prev, item]);
                      setSelectedChannel(`dm-${item.id}`);
                      setSearchQuery('');
                    }}
                    title={`Start chat with ${item.name}`}
                  >
                    <div className={styles.avatarWrapper}>
                      <img src={item.avatar} alt={item.name} />
                      <span className={`${styles.statusDot} ${item.status === 'On Leave' ? styles.onleave : styles.active}`} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: '600' }}>{item.name}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-light)', marginTop: '2px' }}>
                        {item.role || 'Candidate'}
                      </span>
                    </div>
                  </button>
                ))
              }
              {globalDirectory
                .filter(item => !employees.some(e => e.id === item.id))
                .filter(item => 
                  item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (item.role && item.role.toLowerCase().includes(searchQuery.toLowerCase()))
                ).length === 0 && (
                  <div className={styles.noResultsText}>No candidates found</div>
                )
              }
            </div>
          </>
        )}
      </div>

      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        {!selectedChannel ? (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center', padding: '40px', background: '#ffffff', color: 'var(--text-main)' }}>
            <Hash size={48} style={{ color: 'var(--text-light)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>No active conversation</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '280px', textAlign: 'center', lineHeight: '1.5' }}>
              Select a channel or colleague from the sidebar, or create a new channel to get started.
            </p>
          </div>
        ) : (
          <>
            <div className={styles.chatHeader}>
              <div className={styles.channelName}>
                <button 
                  type="button" 
                  className={styles.mobileBackBtn}
                  onClick={() => setSelectedChannel('')}
                  title="Back to channels"
                >
                  <ArrowLeft size={20} />
                </button>
                {isDM ? (
              <div className={styles.avatarWrapper} style={{ width: '28px', height: '28px', position: 'relative' }}>
                <img src={dmEmployee?.avatar} alt={dmEmployee?.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                <span className={`${styles.statusDot} ${dmEmployee?.status === 'On Leave' ? styles.onleave : styles.active}`} style={{ border: '2px solid #ffffff' }} />
              </div>
            ) : (
              <Hash size={20} className={styles.hashIcon} />
            )}
            <h2 style={{ marginLeft: isDM ? '8px' : '0' }}>{isDM ? dmEmployee?.name : selectedChannel}</h2>
            <span className={styles.channelDesc}>
              {isDM 
                ? (dmEmployee?.status === 'On Leave' ? 'On Leave' : 'Active') 
                : (channelDescriptions[selectedChannel] || 'Custom team discussion channel.')}
            </span>
          </div>
          <div className={styles.headerActions}>
            <div className={`${styles.splitBtnContainer} ${isCallDropdownOpen ? styles.active : ''}`}>
              <button 
                type="button" 
                className={styles.splitBtnAction}
                onClick={() => {
                  if (activeCallType === 'video') {
                    setCallType('video');
                    setCallPreviewCamera(true);
                    setCallPreviewMic(true);
                  } else {
                    setCallType('audio');
                    setCallPreviewCamera(false);
                    setCallPreviewMic(true);
                  }
                  setIsCallPreviewOpen(true);
                  setIsCallDropdownOpen(false);
                }}
                title={activeCallType === 'video' ? "Start Video Call" : "Start Voice Call"}
              >
                {activeCallType === 'video' ? <Video size={16} /> : <PhoneCall size={16} />}
              </button>
              <div className={styles.splitBtnSeparator} />
              <button 
                type="button"
                className={styles.splitBtnTrigger}
                onClick={() => setIsCallDropdownOpen(!isCallDropdownOpen)}
                title="Call Options"
              >
                <ChevronDown size={12} />
              </button>
            </div>

            {isCallDropdownOpen && (
              <div className={styles.callDropdownMenu}>
                <button 
                  type="button" 
                  className={`${styles.dropdownItem} ${activeCallType === 'video' ? styles.activeDropdownItem : ''}`}
                  onClick={() => {
                    setActiveCallType('video');
                    setIsCallDropdownOpen(false);
                  }}
                >
                  <Video size={14} />
                  <span>Video Call</span>
                </button>
                <button 
                  type="button" 
                  className={`${styles.dropdownItem} ${activeCallType === 'audio' ? styles.activeDropdownItem : ''}`}
                  onClick={() => {
                    setActiveCallType('audio');
                    setIsCallDropdownOpen(false);
                  }}
                >
                  <PhoneCall size={14} />
                  <span>Voice Call</span>
                </button>
                <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }} />
                <button 
                  type="button" 
                  className={styles.dropdownItem}
                  onClick={() => {
                    setIsCallDropdownOpen(false);
                    const members = channelMembers[selectedChannel] || [];
                    const colleagues = members.filter(m => m.id !== 2);
                    if (colleagues.length > 0) {
                      const randomColleague = colleagues[Math.floor(Math.random() * colleagues.length)];
                      const callMsg = {
                        id: (messages[selectedChannel]?.length || 0) + 1,
                        sender: randomColleague.name,
                        avatar: randomColleague.avatar,
                        text: `Started a video call`,
                        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isCallStatus: true
                      };
                      setMessages(prev => ({
                        ...prev,
                        [selectedChannel]: [...(prev[selectedChannel] || []), callMsg]
                      }));
                    }
                  }}
                >
                  <PhoneCall size={14} />
                  <span>Simulate Colleague Call</span>
                </button>
              </div>
            )}
            
            {!isDM && (
              <button
                type="button"
                className={styles.headerAddMemberBtn}
                onClick={() => {
                  setIsAddMemberModalOpen(true);
                  setSelectedAddMemberIds([]);
                  setModalSearchQuery('');
                }}
              >
                Add member
              </button>
            )}
          </div>
        </div>

        <div className={styles.messagesTimeline}>
          {channelMessages.map((msg, index) => {
            const isMe = msg.sender && (msg.sender.includes('Michael Vance') || msg.sender.includes('Vance'));
            const msgId = msg.id || index;
            const reactions = messageReactions[msgId] || {};
            const isHovered = hoveredMessageId === msgId;
            const showPicker = reactionPickerMsgId === msgId;
            return (
              <div
                key={msgId}
                className={`${styles.messageWrapper} ${isMe ? styles.myMessage : ''}`}
                onMouseEnter={() => setHoveredMessageId(msgId)}
                onMouseLeave={() => { setHoveredMessageId(null); if (reactionPickerMsgId === msgId) setReactionPickerMsgId(null); }}
              >
                <img src={msg.avatar} alt={msg.sender} className={styles.senderAvatar} />
                <div className={styles.messageContent}>
                  <div className={styles.messageMeta}>
                    <span className={styles.senderName}>{msg.sender}</span>
                    <span className={styles.messageTime}>{msg.timestamp}</span>
                  </div>

                  <div className={styles.messageBubbleWrapper}>
                    <div className={msg.isCallStatus ? '' : styles.messageBubble} style={msg.isCallStatus ? { padding: '12px 16px', backgroundColor: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '8px', display: 'inline-block' } : {}}>
                      {msg.text.startsWith('http') && msg.text.includes('.gif') ? (
                        <img src={msg.text} alt="gif" className={styles.chatGifImage} />
                      ) : msg.isCallStatus ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: '600' }}>
                          {msg.text.includes('audio') ? <PhoneCall size={16} /> : <Video size={16} />}
                          <span>{msg.text}</span>
                          <button 
                            type="button" 
                            style={{ marginLeft: '12px', padding: '6px 16px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: 'white', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}
                            onClick={() => {
                              setHuddlePeer({
                                channelId: selectedChannel,
                                roomName: selectedChannel,
                                name: selectedChannel,
                                displayName: 'Michael Vance (Team Lead)'
                              });
                            }}
                          >
                            Join
                          </button>
                        </div>
                      ) : (
                        <p>{msg.text}</p>
                      )}
                    </div>

                    {/* Hover reaction toolbar */}
                    {isHovered && (
                      <div className={styles.messageReactionToolbar}>
                        {QUICK_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            className={`${styles.reactionToolbarBtn} ${reactions[emoji]?.reacted ? styles.reactionToolbarBtnActive : ''}`}
                            onClick={() => handleQuickReact(msgId, emoji)}
                            title={`React with ${emoji}`}
                          >
                            {emoji}
                          </button>
                        ))}
                        <button
                          type="button"
                          className={styles.reactionToolbarMore}
                          onClick={(e) => { e.stopPropagation(); setReactionPickerMsgId(showPicker ? null : msgId); }}
                          title="More reactions"
                        >
                          ➕
                        </button>
                      </div>
                    )}

                    {/* Full emoji picker for this message */}
                    {showPicker && (
                      <div className={styles.messageEmojiPicker} onClick={e => e.stopPropagation()}>
                        <div className={styles.messageEmojiGrid}>
                          {['😊','😂','🤣','🥰','😍','🤩','😎','😜','🤔','😮','😢','😡','👍','👎','👏','🙌','🔥','🎉','💯','❤️','💙','💚','🌟','✨','🚀','🎯','💡','🤝','🙏','😱','😴','🥺','😭','🥳','😋','😅','🤦','🤷','💪','👀'].map(e => (
                            <button
                              key={e}
                              type="button"
                              className={styles.messageEmojiBtn}
                              onClick={() => handleQuickReact(msgId, e)}
                            >{e}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Reaction pills below bubble */}
                  {Object.keys(reactions).length > 0 && (
                    <div className={styles.reactionPillsRow}>
                      {Object.entries(reactions).map(([emoji, data]) => (
                        <button
                          key={emoji}
                          type="button"
                          className={`${styles.reactionPill} ${data.reacted ? styles.reactionPillActive : ''}`}
                          onClick={() => handleQuickReact(msgId, emoji)}
                          title={`${emoji} · ${data.count}`}
                        >
                          <span>{emoji}</span>
                          <span className={styles.reactionPillCount}>{data.count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Floating Members Card */}
        {!isDM && (
          <div 
            className={`${styles.membersCard} ${isDragging ? styles.dragging : ''}`}
            style={{ transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)` }}
            onMouseDown={handleMouseDown}
          >
          <div className={styles.membersCardHeader}>
            <h3 className={styles.membersTitle}>Members</h3>
            <button
              type="button"
              className={styles.seeAllBtn}
              onClick={(e) => { e.stopPropagation(); setShowAllMembers(prev => !prev); }}
            >
              {showAllMembers ? 'See less' : 'See all'}
            </button>
          </div>
          
          <div className={styles.membersList}>
            {(() => {
              const statusOrder = (member) => {
                const emp = employees.find(e => e.id === member.id);
                const status = emp?.status || 'Active';
                if (status === 'Active') return 0;
                if (status === 'On Leave') return 2;
                return 1; // Offline or anything else
              };
              const allMembers = [...(channelMembers[selectedChannel] || [])].sort(
                (a, b) => statusOrder(a) - statusOrder(b)
              );
              const visibleMembers = showAllMembers ? allMembers : allMembers.slice(0, 4);
              const hiddenCount = allMembers.length - 4;
              return (
                <>
                  {visibleMembers.map((member) => {
                    const memberEmp = employees.find(e => e.id === member.id);
                    const isOnLeave = memberEmp?.status === 'On Leave';
                    return (
                      <div key={member.id} className={styles.memberAvatarWrapper} title={member.name}>
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className={styles.memberAvatarImg} />
                        ) : (
                          <div className={styles.memberAvatarPlaceholder}>
                            {member.initial}
                          </div>
                        )}
                        <span className={`${styles.memberStatusDot} ${isOnLeave ? styles.onleave : styles.active}`} />
                      </div>
                    );
                  })}
                  {!showAllMembers && hiddenCount > 0 && (
                    <button
                      type="button"
                      className={styles.overflowCountBtn}
                      onClick={(e) => { e.stopPropagation(); setShowAllMembers(true); }}
                      title={`${hiddenCount} more members`}
                    >
                      +{hiddenCount}
                    </button>
                  )}
                </>
              );
            })()}
            
            <button 
              type="button" 
              className={styles.quickAddMemberBtn}
              onClick={() => {
                setIsAddMemberModalOpen(true);
                setSelectedAddMemberIds([]);
                setModalSearchQuery('');
              }}
              title="Add Member"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

        <form onSubmit={handleSend} className={styles.chatForm}>
          <div className={styles.chatInputWrapper}>
            {emojiPickerTarget === 'main' && renderEmojiPicker('light')}
            <button
              type="button"
              className={styles.chatActionBtn}
              onClick={() => toggleEmojiPicker('main')}
              title="Insert emoji"
            >
              <Smile size={18} />
            </button>
            <button
              type="button"
              className={styles.chatActionBtn}
              onClick={() => mainFileInputRef.current?.click()}
              title="Attach file"
            >
              <Paperclip size={18} />
            </button>
            {mainMentionQuery !== null && renderMentionDropdown('main')}
            <input
              type="text"
              ref={mainInputRef}
              className={styles.chatInput}
              value={inputVal}
              onChange={handleMainInputChange}
              onKeyDown={handleMainInputKeyDown}
              placeholder={isDM ? `Message ${dmEmployee?.name}...` : `Message #${selectedChannel} (Type message & get simulated feedback...)`}
            />
            <input
              type="file"
              ref={mainFileInputRef}
              style={{ display: 'none' }}
              onChange={handleMainFileChange}
            />
          </div>
          <button type="submit" className={styles.sendBtn} disabled={!inputVal.trim()}>
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
          </>
        )}
      </div>
    </div>

      {/* Create Channel Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Create a Channel</h3>
              <button className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateChannel}>
              <div className={styles.modalBody}>
                <p className={styles.modalSub}>
                  Channels are where your team communicates. They’re best when organized around a topic (e.g. marketing-campaign).
                </p>
                
                <div className={styles.formGroup}>
                  <label htmlFor="channel-name">Name</label>
                  <div className={styles.inputWrapper}>
                    <Hash size={16} className={styles.inputHashIcon} />
                    <input
                      id="channel-name"
                      type="text"
                      placeholder="e.g. plan-launch"
                      value={newChannelName}
                      onChange={(e) => {
                        setNewChannelName(e.target.value);
                        if (channelError) setChannelError('');
                      }}
                      autoFocus
                    />
                  </div>
                  {channelError && <span className={styles.errorText}>{channelError}</span>}
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="channel-desc">Description <span className={styles.optional}>(optional)</span></label>
                  <input
                    id="channel-desc"
                    type="text"
                    placeholder="What is this channel about?"
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                  />
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Create Channel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {isAddMemberModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsAddMemberModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Add Members to #{selectedChannel}</h3>
              <button className={styles.closeBtn} onClick={() => setIsAddMemberModalOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddMembers}>
              <div className={styles.modalBody}>
                <p className={styles.modalSub}>
                  Select team members to add them to this channel.
                </p>

                <div className={styles.modalSearchBox}>
                  <Search size={14} className={styles.modalSearchIcon} />
                  <input
                    type="text"
                    placeholder="search a candidate"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                  />
                  {modalSearchQuery && (
                    <button
                      type="button"
                      className={styles.modalClearSearchBtn}
                      onClick={() => setModalSearchQuery('')}
                      title="Clear search"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
                
                <div className={styles.addMemberList}>
                  {(() => {
                    const allAvailableUsers = [...employees];
                    globalDirectory.forEach(item => {
                      if (!allAvailableUsers.some(u => u.id === item.id)) {
                        allAvailableUsers.push(item);
                      }
                    });

                    const filteredAvailable = allAvailableUsers
                      .filter(emp => !(channelMembers[selectedChannel] || []).some(m => m.id === emp.id))
                      .filter(emp => 
                        emp.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
                        (emp.role && emp.role.toLowerCase().includes(modalSearchQuery.toLowerCase()))
                      );

                    if (filteredAvailable.length === 0) {
                      return (
                        <p className={styles.noMembersText}>
                          {modalSearchQuery ? 'No matching candidates or team members found.' : 'All employees and candidates are already members of this channel.'}
                        </p>
                      );
                    }

                    return filteredAvailable.map(emp => {
                      const isSelected = selectedAddMemberIds.includes(emp.id);
                      return (
                        <div 
                          key={emp.id} 
                          className={`${styles.addMemberRow} ${isSelected ? styles.selectedRow : ''}`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedAddMemberIds(prev => prev.filter(id => id !== emp.id));
                            } else {
                              setSelectedAddMemberIds(prev => [...prev, emp.id]);
                            }
                          }}
                        >
                          <img src={emp.avatar} alt={emp.name} className={styles.addMemberAvatar} />
                          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                            <span className={styles.addMemberName}>{emp.name}</span>
                            {emp.role && (
                              <span style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                                {emp.role}
                              </span>
                            )}
                          </div>
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => {}} // handled by row click
                            className={styles.addMemberCheckbox}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelBtn} onClick={() => setIsAddMemberModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Add Selected
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Call Preview Modal (Dark Theme as shown in mockup) */}
      {isCallPreviewOpen && (
        <div className={styles.callModalOverlay} onClick={() => setIsCallPreviewOpen(false)}>
          <div className={styles.callModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.callModalHeader}>
              <h3>SyncUp with {isDM ? dmEmployee?.name : `#${selectedChannel}`}</h3>
            </div>
            
            <div className={styles.callPreviewContainer}>
              {/* Preview Box */}
              <div className={styles.callPreviewBox}>
                <div className={styles.callerTag}>
                  YOU
                </div>
                {callPreviewCamera ? (
                  <div className={styles.previewCameraActive}>
                    <video
                      ref={handlePreviewVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={styles.cameraStreamImg}
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  </div>
                ) : (
                  <div className={styles.previewCameraMuted}>
                    <div className={styles.largeAvatarPlaceholder}>
                      Y
                    </div>
                  </div>
                )}
              </div>

              {/* Toggle controls */}
              <div className={styles.callControlsRow}>
                <button 
                  type="button" 
                  className={`${styles.callCtrlCircle} ${callPreviewCamera ? styles.ctrlActive : styles.ctrlMuted}`}
                  onClick={() => {
                    playRelevantSound('camera', callPreviewCamera);
                    setCallPreviewCamera(!callPreviewCamera);
                  }}
                >
                  {callPreviewCamera ? <Video size={20} /> : <VideoOff size={20} />}
                </button>
                <button 
                  type="button" 
                  className={`${styles.callCtrlCircle} ${callPreviewMic ? styles.ctrlActive : styles.ctrlMuted}`}
                  onClick={() => {
                    playRelevantSound('mic', callPreviewMic);
                    setCallPreviewMic(!callPreviewMic);
                  }}
                >
                  {callPreviewMic ? <Mic size={20} /> : <MicOff size={20} />}
                </button>
              </div>

              {/* Selection Dropdowns */}
              <div className={styles.deviceSettingsList}>
                <div className={styles.deviceSelectGroup}>
                  <Video size={16} className={styles.deviceIcon} />
                  <select 
                    value={callPreviewCamera ? "allow" : "block"}
                    onChange={(e) => setCallPreviewCamera(e.target.value === "allow")}
                  >
                    <option value="allow">Allow camera access</option>
                    <option value="block">Block camera access</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectChevron} />
                </div>

                <div className={styles.deviceSelectGroup}>
                  <Mic size={16} className={styles.deviceIcon} />
                  <select defaultValue="microphone">
                    <option value="microphone">Microphone Array (Intel® Smart Sound Technology...)</option>
                    <option value="external">Default External Microphone</option>
                  </select>
                  <ChevronDown size={14} className={styles.selectChevron} />
                </div>
              </div>

              {/* Checkbox */}
              <label className={styles.alwaysShowCheckboxRow}>
                <input 
                  type="checkbox" 
                  checked={alwaysShowPreview} 
                  onChange={(e) => setAlwaysShowPreview(e.target.checked)}
                />
                <span>Always show preview before joining</span>
              </label>
            </div>

            {/* Footer Buttons */}
            <div className={styles.callModalFooter}>
              <button 
                type="button" 
                className={styles.callCancelBtn} 
                onClick={() => {
                  playRelevantSound('cancel');
                  setIsCallPreviewOpen(false);
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.callStartBtn}
                onClick={() => {
                  playRelevantSound('startcall');
                  setIsCallPreviewOpen(false);
                  
                  setHuddlePeer({
                    channelId: selectedChannel,
                    roomName: isDM ? `DM-${dmEmployee?.name}` : selectedChannel,
                    name: selectedChannel,
                    displayName: 'Michael Vance (Team Lead)'
                  });

                  const isCorporateChannel = chatChannels.some(c => c.id === selectedChannel);
                  const callMsg = {
                    id: Date.now(),
                    sender: 'Michael Vance (Team Lead)',
                    avatar: 'https://ui-avatars.com/api/?name=Michael+Vance&background=3b82f6&color=fff',
                    text: `Started ${activeCallType === 'audio' ? 'an audio' : 'a video'} call`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    isCallStatus: true
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
                }}
              >
                Start SyncUp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Full-Screen Call UI */}
      {isInCall && (
        <div className={styles.activeCallOverlay}>
          {/* Top bar */}
          <div className={styles.activeCallTopBar}>
            <div className={styles.activeCallInfo}>
              <span className={styles.activeCallLiveDot} />
              <span className={styles.activeCallTitle}>
                SyncUp — {isDM ? dmEmployee?.name : `#${selectedChannel}`}
              </span>
              {isRecording && (
                <span className={styles.huddleRecPill}>
                  <span className={styles.huddleRecDot} />
                  <span>REC</span>
                </span>
              )}
            </div>
            <span className={styles.activeCallTimer}>{formatCallDuration(callDuration)}</span>
          </div>

          {/* Main video area */}
          <div className={styles.activeCallVideoArea}>
            {callScreenShare || callLayout === 'spotlight' ? (
              <div className={styles.screenShareContainer}>
                {callScreenShare ? (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={styles.screenShareVideo}
                  />
                ) : (
                  (() => {
                    const participants = getCallParticipants();
                    const spotlight = participants.find(p => !p.isMe) || participants[0];
                    if (!spotlight) return null;
                    return (
                      <div className={`${styles.participantCard} ${cameraBackground === 'neon' ? styles.neonCard : cameraBackground === 'office' ? styles.officeCard : ''}`} style={{ width: '100%', height: '100%' }}>
                        {spotlight.isMe ? (
                          callScreenCamera ? (
                            <video
                              ref={handleCallCameraVideoRef}
                              autoPlay
                              playsInline
                              muted
                              className={styles.participantVideo}
                              style={{
                                transform: 'scaleX(-1)',
                                filter: cameraBackground === 'blur' ? 'blur(12px) brightness(0.85)' :
                                        cameraBackground === 'office' ? 'sepia(0.2) saturate(1.1) contrast(1.05) brightness(1.04) hue-rotate(-10deg)' :
                                        cameraBackground === 'neon' ? 'hue-rotate(140deg) saturate(1.8) brightness(0.9) contrast(1.15)' : 'none',
                                transition: 'filter 0.4s ease'
                              }}
                            />
                          ) : (
                            <div className={styles.participantAvatarFallback}>
                              <div className={styles.participantAvatarInitial}>M</div>
                            </div>
                          )
                        ) : (
                          <div className={styles.participantAvatarFallback}>
                            {spotlight.avatar ? (
                              <img src={spotlight.avatar} alt={spotlight.name} className={styles.participantAvatarImg} style={{ width: '140px', height: '140px' }} />
                            ) : (
                              <div className={styles.participantAvatarInitial} style={{ width: '140px', height: '140px', fontSize: '54px' }}>{spotlight.initial}</div>
                            )}
                            {spotlight.id % 2 === 0 && (
                              <div className={styles.audioWaveformIndicator} style={{ bottom: '20px', right: '20px' }}>
                                <span className={styles.waveBar} />
                                <span className={styles.waveBar} />
                                <span className={styles.waveBar} />
                              </div>
                            )}
                          </div>
                        )}
                        <div className={styles.participantNameTag} style={{ bottom: '20px', left: '20px' }}>
                          {spotlight.name} {spotlight.isMe ? '(You)' : ''} (Spotlight)
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* Overlay small floating list/row of other participants */}
                <div className={styles.floatingParticipantsRow}>
                  {getCallParticipants().map((p) => (
                    <div key={p.id} className={styles.floatingParticipantThumb} title={p.name}>
                      {p.isMe ? (
                        callScreenCamera ? (
                          <video
                            ref={handleCallCameraVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={styles.floatingParticipantVideo}
                            style={{ transform: 'scaleX(-1)' }}
                          />
                        ) : (
                          <div className={styles.floatingParticipantAvatarPlaceholder}>M</div>
                        )
                      ) : (
                        p.avatar ? (
                          <img src={p.avatar} alt={p.name} className={styles.floatingParticipantAvatar} />
                        ) : (
                          <div className={styles.floatingParticipantAvatarPlaceholder}>{p.initial}</div>
                        )
                      )}
                      <span className={styles.floatingParticipantName}>{p.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`${styles.participantsGrid} ${styles[`grid${getCallParticipants().length}`] || styles.gridMore}`}>
                {getCallParticipants().map((p) => {
                  if (p.isMe) {
                    return (
                      <div key={p.id} className={`${styles.participantCard} ${cameraBackground === 'neon' ? styles.neonCard : cameraBackground === 'office' ? styles.officeCard : ''}`}>
                        {callScreenCamera ? (
                          <video
                            ref={handleCallCameraVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className={styles.participantVideo}
                            style={{
                              transform: 'scaleX(-1)',
                              filter: cameraBackground === 'blur' ? 'blur(12px) brightness(0.85)' :
                                      cameraBackground === 'office' ? 'sepia(0.2) saturate(1.1) contrast(1.05) brightness(1.04) hue-rotate(-10deg)' :
                                      cameraBackground === 'neon' ? 'hue-rotate(140deg) saturate(1.8) brightness(0.9) contrast(1.15)' : 'none',
                              transition: 'filter 0.4s ease'
                            }}
                          />
                        ) : (
                          <div className={styles.participantAvatarFallback}>
                            <div className={styles.participantAvatarInitial}>M</div>
                          </div>
                        )}
                        <div className={styles.participantNameTag}>
                          {p.name} (You)
                        </div>
                        <div className={styles.participantMicTag}>
                          {callScreenMic ? <Mic size={14} className={styles.micActiveIcon} /> : <MicOff size={14} className={styles.micMutedIcon} />}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div key={p.id} className={styles.participantCard}>
                        <div className={styles.participantAvatarFallback}>
                          {p.avatar ? (
                            <img src={p.avatar} alt={p.name} className={styles.participantAvatarImg} />
                          ) : (
                            <div className={styles.participantAvatarInitial}>{p.initial}</div>
                          )}
                          {/* Audio speaking animation indicator for active participants */}
                          {p.id % 2 === 0 && (
                            <div className={styles.audioWaveformIndicator}>
                              <span className={styles.waveBar} />
                              <span className={styles.waveBar} />
                              <span className={styles.waveBar} />
                            </div>
                          )}
                        </div>
                        <div className={styles.participantNameTag}>{p.name}</div>
                        <div className={styles.participantMicTag}>
                          {p.id % 2 === 0 ? <Mic size={14} className={styles.micActiveIcon} /> : <MicOff size={14} className={styles.micMutedIcon} />}
                        </div>
                      </div>
                    );
                  }
                })}
              </div>
            )}

            {/* Floating Reactions Container */}
            <div className={styles.floatingReactionsContainer}>
              {floatingReactions.map(r => (
                <div key={r.id} className={styles.floatingReaction}>
                  {r.emoji}
                </div>
              ))}
            </div>
          </div>

          {/* Call Members Panel */}
          {callMembersOpen && (
            <div 
              className={styles.callChatPanel}
              style={{ transform: `translate(${membersPosition.x}px, ${membersPosition.y}px)` }}
            >
              <div 
                className={styles.callChatHeader}
                onMouseDown={handleMembersMouseDown}
              >
                <span>Participants</span>
                <button type="button" className={styles.callChatCloseBtn} onClick={() => setCallMembersOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className={styles.callChatMessages} style={{ padding: '0', display: 'block' }}>
                {(() => {
                  const participants = getCallParticipants();
                  const allMembers = channelMembers[selectedChannel] || [];
                  const joinedIds = new Set(participants.map(p => p.id));
                  const notJoined = allMembers.filter(m => !joinedIds.has(m.id));
                  
                  return (
                    <div style={{ padding: '20px' }}>
                      <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                          In Call — {participants.length}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {participants.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div className={styles.memberAvatarWrapper} style={{ width: '36px', height: '36px' }}>
                                {p.avatar ? (
                                  <img src={p.avatar} alt={p.name} className={styles.memberAvatarImg} />
                                ) : (
                                  <div className={styles.memberAvatarPlaceholder} style={{ fontSize: '14px', width: '100%', height: '100%' }}>{p.initial}</div>
                                )}
                                <span className={styles.memberStatusDot} style={{ background: '#10b981', bottom: '-2px', right: '-2px', width: '12px', height: '12px', border: '2px solid #1e212b' }} />
                              </div>
                              <span style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '500' }}>{p.name} {p.isMe ? <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '400' }}>(You)</span> : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {notJoined.length > 0 && (
                        <div>
                          <h4 style={{ color: '#94a3b8', fontSize: '11px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Not Joined — {notJoined.length}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {notJoined.map(p => {
                              const emp = employees.find(e => e.id === p.id);
                              const isOnLeave = emp?.status === 'On Leave';
                              
                              return (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.6 }}>
                                  <div className={styles.memberAvatarWrapper} style={{ width: '36px', height: '36px' }}>
                                    {p.avatar ? (
                                      <img src={p.avatar} alt={p.name} className={styles.memberAvatarImg} />
                                    ) : (
                                      <div className={styles.memberAvatarPlaceholder} style={{ fontSize: '14px', width: '100%', height: '100%' }}>{p.initial}</div>
                                    )}
                                    <span className={styles.memberStatusDot} style={{ background: isOnLeave ? '#f59e0b' : '#64748b', bottom: '-2px', right: '-2px', width: '12px', height: '12px', border: '2px solid #1e212b' }} />
                                  </div>
                                  <span style={{ color: '#f8fafc', fontSize: '14px', fontWeight: '500' }}>{p.name}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* In-call chat panel */}
          {callChatOpen && (
            <div 
              className={styles.callChatPanel}
              style={{ transform: `translate(${chatPosition.x}px, ${chatPosition.y}px)` }}
            >
              <div 
                className={styles.callChatHeader}
                onMouseDown={handleChatMouseDown}
              >
                <span>In-call messages</span>
                <button type="button" className={styles.callChatCloseBtn} onClick={() => setCallChatOpen(false)}>
                  <X size={16} />
                </button>
              </div>
              <div className={styles.callChatMessages}>
                {callChatMessages.map(msg => {
                  const msgId = msg.id;
                  const reactions = callMessageReactions[msgId] || {};
                  const isHovered = hoveredCallMessageId === msgId;
                  const showPicker = reactionPickerCallMsgId === msgId;
                  return (
                    <div
                      key={msgId}
                      className={`${styles.callChatMsg} ${msg.self ? styles.callChatMsgSelf : ''}`}
                      onMouseEnter={() => setHoveredCallMessageId(msgId)}
                      onMouseLeave={() => {
                        setHoveredCallMessageId(null);
                        if (reactionPickerCallMsgId === msgId) setReactionPickerCallMsgId(null);
                      }}
                    >
                      {!msg.self && <span className={styles.callChatSender}>{msg.sender}</span>}
                      <div className={styles.callChatBubbleWrapper}>
                        <div className={styles.callChatBubble}>
                          {msg.text.startsWith('http') && msg.text.includes('.gif') ? (
                            <img src={msg.text} alt="gif" className={styles.chatGifImage} />
                          ) : (
                            msg.text
                          )}
                        </div>

                        {/* Hover reaction toolbar */}
                        {isHovered && (
                          <div className={styles.callChatReactionToolbar}>
                            {QUICK_REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                type="button"
                                className={`${styles.callChatReactionToolbarBtn} ${reactions[emoji]?.reacted ? styles.callChatReactionToolbarBtnActive : ''}`}
                                onClick={() => handleCallQuickReact(msgId, emoji)}
                                title={`React with ${emoji}`}
                              >
                                {emoji}
                              </button>
                            ))}
                            <button
                              type="button"
                              className={styles.callChatReactionToolbarMore}
                              onClick={(e) => {
                                e.stopPropagation();
                                setReactionPickerCallMsgId(showPicker ? null : msgId);
                              }}
                              title="More reactions"
                            >
                              ➕
                            </button>
                          </div>
                        )}

                        {/* Full emoji picker for call messages */}
                        {showPicker && (
                          <div className={styles.callChatEmojiPicker} onClick={e => e.stopPropagation()}>
                            <div className={styles.callChatEmojiGrid}>
                              {['😊','😂','🤣','🥰','😍','🤩','😎','😜','🤔','😮','😢','😡','👍','👎','👏','🙌','🔥','🎉','💯','❤️','💙','💚','🌟','✨','🚀','🎯','💡','🤝','🙏','😱','😴','🥺','😭','🥳','😋','😅','🤦','🤷','💪','👀'].map(e => (
                                <button
                                  key={e}
                                  type="button"
                                  className={styles.callChatEmojiBtn}
                                  onClick={() => handleCallQuickReact(msgId, e)}
                                >{e}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reaction pills below bubble */}
                      {Object.keys(reactions).length > 0 && (
                        <div className={styles.callChatReactionPillsRow}>
                          {Object.entries(reactions).map(([emoji, data]) => (
                            <button
                              key={emoji}
                              type="button"
                              className={`${styles.callChatReactionPill} ${data.reacted ? styles.callChatReactionPillActive : ''}`}
                              onClick={() => handleCallQuickReact(msgId, emoji)}
                              title={`${emoji} · ${data.count}`}
                            >
                              <span>{emoji}</span>
                              <span className={styles.callChatReactionPillCount}>{data.count}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <span className={styles.callChatTime}>{msg.time}</span>
                    </div>
                  );
                })}
              </div>
              <form
                className={styles.callChatForm}
                onSubmit={(e) => {
                  e.preventDefault();
                  const text = callChatInput.trim();
                  if (!text) return;
                  setCallChatMessages(prev => [...prev, {
                    id: Date.now(),
                    sender: 'You',
                    text,
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    self: true,
                  }]);
                  setCallChatInput('');
                }}
              >
                <div className={styles.callChatInputWrapper}>
                  {emojiPickerTarget === 'call' && renderEmojiPicker('dark')}
                  <button
                    type="button"
                    className={styles.callChatActionBtn}
                    onClick={() => toggleEmojiPicker('call')}
                    title="Insert emoji"
                  >
                    <Smile size={18} />
                  </button>
                  <button
                    type="button"
                    className={styles.callChatActionBtn}
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach file"
                  >
                    <Paperclip size={18} />
                  </button>
                  {callMentionQuery !== null && renderMentionDropdown('call')}
                  <input
                    type="text"
                    ref={callInputRef}
                    className={styles.callChatInput}
                    placeholder="Send a message..."
                    value={callChatInput}
                    onChange={handleCallInputChange}
                    onKeyDown={handleCallInputKeyDown}
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
                </div>
                <button type="submit" className={styles.callChatSendBtn}>
                  <Send size={16} />
                </button>
              </form>
            </div>
          )}

          {/* Reactions Floating Bar */}
          {callReactionsOpen && (
            <div className={styles.callReactionsBar}>
              {(() => {
                const skinTones = ['', '🏻', '🏼', '🏽', '🏾', '🏿'];
                const skinToneColors = ['#ffc107', '#fadcac', '#e0b892', '#b58150', '#8a5a36', '#5c3826'];
                const getEmoji = (base) => base + skinTones[skinToneIndex];
                return (
                  <>
                    <button type="button" className={styles.reactionEmoji} onClick={() => sendReaction('💖')}>💖</button>
                    <button type="button" className={styles.reactionEmoji} onClick={() => sendReaction(getEmoji('👍'))}>{getEmoji('👍')}</button>
                    <button type="button" className={styles.reactionEmoji} onClick={() => sendReaction('🎉')}>🎉</button>
                    <button type="button" className={styles.reactionEmoji} onClick={() => sendReaction(getEmoji('👏'))}>{getEmoji('👏')}</button>
                    <button type="button" className={styles.reactionEmoji} onClick={() => sendReaction('😂')}>😂</button>
                    <button type="button" className={styles.reactionEmoji} onClick={() => sendReaction('😮')}>😮</button>
                    <button type="button" className={styles.reactionEmoji} onClick={() => sendReaction('😢')}>😢</button>
                    <button type="button" className={styles.reactionEmoji} onClick={() => sendReaction('🤔')}>🤔</button>
                    <button type="button" className={styles.reactionEmoji} onClick={() => sendReaction(getEmoji('👎'))}>{getEmoji('👎')}</button>
                    <div className={styles.reactionDivider} />
                    <button 
                      type="button" 
                      className={styles.skinToneBtn} 
                      onClick={() => setSkinToneIndex(prev => (prev + 1) % skinTones.length)}
                      style={{ backgroundColor: skinToneColors[skinToneIndex] }}
                      title="Change emoji skin tone"
                    />
                  </>
                );
              })()}
            </div>
          )}

          {/* Live Captions */}
          {liveCaption && (
            <div className={styles.liveCaptionBox}>
              <div className={styles.liveCaptionText}>
                <span style={{ fontWeight: 'bold', color: '#93c5fd' }}>Sarah Jenkins: </span>
                {liveTranslate 
                  ? `[Translated to ${translateLanguage}] Repasemos las nuevas especificaciones de diseño del panel.` 
                  : `Let's go over the new design specs for the dashboard. I think we need more contrast on these active buttons.`
                }
              </div>
            </div>
          )}

          {/* Bottom control bar */}
          <div className={styles.activeCallControlBar}>

            {/* Mic */}
            <button
              type="button"
              className={`${styles.activeCallCtrl} ${!callScreenMic ? styles.activeCallCtrlMuted : ''}`}
              onClick={() => {
                playRelevantSound('mic', callScreenMic);
                setCallScreenMic(prev => !prev);
              }}
              title={callScreenMic ? 'Mute mic' : 'Unmute mic'}
            >
              {callScreenMic ? <Mic size={20} /> : <MicOff size={20} />}
            </button>

            {/* Camera */}
            <button
              type="button"
              className={`${styles.activeCallCtrl} ${!callScreenCamera ? styles.activeCallCtrlMuted : ''}`}
              onClick={() => {
                playRelevantSound('camera', callScreenCamera);
                setCallScreenCamera(prev => !prev);
              }}
              title={callScreenCamera ? 'Stop camera' : 'Start camera'}
            >
              {callScreenCamera ? <Video size={20} /> : <VideoOff size={20} />}
            </button>

            {/* Screen share */}
            <button
              type="button"
              className={`${styles.activeCallCtrl} ${callScreenShare ? styles.activeCallCtrlActive : ''}`}
              onClick={() => {
                playRelevantSound('screenshare', callScreenShare);
                callScreenShare ? stopScreenShare() : startScreenShare();
              }}
              title={callScreenShare ? 'Stop presenting' : 'Present now'}
            >
              <Monitor size={20} />
            </button>

            {/* Reactions */}
            <button
              type="button"
              className={`${styles.activeCallCtrl} ${callReactionsOpen ? styles.activeCallCtrlActive : ''}`}
              onClick={() => {
                playRelevantSound('panel', callReactionsOpen);
                setCallReactionsOpen(prev => !prev);
              }}
              title="Reactions"
            >
              <Smile size={20} />
            </button>

            {/* Chat */}
            <button
              type="button"
              className={`${styles.activeCallCtrl} ${callChatOpen ? styles.activeCallCtrlActive : ''}`}
              onClick={() => {
                playRelevantSound('panel', callChatOpen);
                setCallChatOpen(prev => !prev);
              }}
              title="In-call chat"
            >
              <MessageSquare size={20} />
            </button>

            {/* Participants */}
            <button
              type="button"
              className={`${styles.activeCallCtrl} ${callMembersOpen ? styles.activeCallCtrlActive : ''}`}
              onClick={() => {
                playRelevantSound('panel', callMembersOpen);
                setCallMembersOpen(prev => !prev);
              }}
              title="Participants"
            >
              <Users size={20} />
            </button>

            {/* Record Meeting */}
            <button
              type="button"
              className={`${styles.activeCallCtrl} ${isRecording ? styles.activeCallCtrlActive : ''}`}
              onClick={handleToggleRecording}
              title={isRecording ? "Stop recording : Stop and save this recording" : "Record meeting : Start recording"}
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                className={isRecording ? styles.recordingActiveDot : ''}
                style={{ color: isRecording ? '#ef4444' : 'currentColor' }}
              >
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4" fill="currentColor" />
              </svg>
            </button>

            {/* Raise hand */}
            <button
              type="button"
              className={`${styles.activeCallCtrl} ${callRaiseHand ? styles.activeCallCtrlActive : ''}`}
              onClick={() => {
                playRelevantSound('hand', callRaiseHand);
                setCallRaiseHand(prev => !prev);
              }}
              title="Raise hand"
            >
              <Hand size={20} />
            </button>

            {/* More options */}
            <div className={styles.moreOptionsContainer}>
              {isMoreOptionsOpen && (
                <div className={styles.moreOptionsDropdown}>
                  {/* Recording moved to main toolbar */}
                  
                  <button type="button" className={styles.moreOptionsItem} onClick={handleAdjustView}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7" height="7" />
                      <rect x="14" y="3" width="7" height="7" />
                      <rect x="14" y="14" width="7" height="7" />
                      <rect x="3" y="14" width="7" height="7" />
                    </svg>
                    <span>Adjust view</span>
                  </button>
                  
                  <button type="button" className={styles.moreOptionsItem} onClick={handleFullScreen}>
                    {isFullscreen ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 14h3v3" />
                          <path d="M20 14h-3v3" />
                          <path d="M20 10h-3V7" />
                          <path d="M4 10h3V7" />
                        </svg>
                        <span>Exit full screen</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                          <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                          <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                          <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                        </svg>
                        <span>Full screen</span>
                      </>
                    )}
                  </button>
                  
                  <button type="button" className={styles.moreOptionsItem} onClick={handlePictureInPicture}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <rect x="13" y="11" width="7" height="5" rx="1" ry="1" fill="currentColor" />
                    </svg>
                    <span>Open picture-in-picture</span>
                  </button>
                  
                  <button type="button" className={styles.moreOptionsItem} onClick={handleBackgrounds}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="14" height="14" rx="2" />
                      <circle cx="10" cy="8" r="2.5" />
                      <path d="M5 15a5 5 0 0 1 10 0" />
                      <path d="M20 16l1.5-1.5L20 13l-1.5 1.5zm-3-7l1-1-1-1-1 1zm4 1l1-1-1-1-1 1z" fill="currentColor" stroke="none" />
                    </svg>
                    <span>Backgrounds and effects</span>
                  </button>
                  
                  <div className={styles.moreOptionsDivider} />
                  
                  <div className={styles.moreOptionsItem} style={{ padding: '8px 12px' }}>
                    <Subtitles size={18} strokeWidth={2} />
                    <span>Live Caption</span>
                    <label className={styles.switchLabel}>
                      <div className={styles.switch}>
                        <input type="checkbox" checked={liveCaption} onChange={() => setLiveCaption(!liveCaption)} />
                        <span className={styles.slider}></span>
                      </div>
                    </label>
                  </div>
                  
                  <div className={styles.moreOptionsItem} style={{ padding: '8px 12px' }}>
                    <Languages size={18} strokeWidth={2} />
                    <span>Live Translate</span>
                    <label className={styles.switchLabel}>
                      <div className={styles.switch}>
                        <input type="checkbox" checked={liveTranslate} onChange={() => setLiveTranslate(!liveTranslate)} />
                        <span className={styles.slider}></span>
                      </div>
                    </label>
                  </div>
                  
                  {liveTranslate && (
                    <div style={{ padding: '0 12px 12px 42px' }}>
                      <select 
                        value={translateLanguage} 
                        onChange={(e) => setTranslateLanguage(e.target.value)}
                        className={styles.languageSelect}
                      >
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Hindi">Hindi</option>
                      </select>
                    </div>
                  )}
                  
                  <div className={styles.moreOptionsDivider} />
                  
                  <button type="button" className={styles.moreOptionsItem} onClick={handleTroubleshoot}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="10" cy="10" r="6" />
                      <path d="M7 10h1.5l1-2.5 1.5 5 1-2.5h1.5" />
                      <line x1="21" y1="21" x2="15" y2="15" />
                    </svg>
                    <span>Troubleshooting & help</span>
                  </button>
                  

                </div>
              )}
              <button
                type="button"
                className={`${styles.moreOptionsBtn} ${isMoreOptionsOpen ? styles.moreOptionsBtnActive : ''}`}
                onClick={() => {
                  playRelevantSound('panel', isMoreOptionsOpen);
                  setIsMoreOptionsOpen(prev => !prev);
                }}
                title="More options"
              >
                <MoreVertical size={20} />
              </button>
            </div>

            <div className={styles.activeCallCtrlDivider} />

            {/* End call */}
            <button
              type="button"
              className={styles.activeCallEndBtn}
              onClick={handleEndCall}
              title="End call"
            >
              <PhoneOff size={20} />
            </button>
          </div>

          {/* Toast Notification for Huddle actions */}
          {toastMessage && (
            <div className={styles.huddleToast}>
              {toastMessage}
            </div>
          )}
        </div>
      )}
      {huddlePeer && (
        <HuddleModal 
          peer={huddlePeer} 
          onClose={() => setHuddlePeer(null)} 
        />
      )}
    </>
  );
};

export default Messages;
