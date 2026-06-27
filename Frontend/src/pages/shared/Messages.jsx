import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Phone, Video, MoreVertical, Image as ImageIcon, Paperclip, Loader2, Wifi, WifiOff, ArrowLeft, Home, MapPin, PhoneOff } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { socketService } from '../../services/socket';

const LocalVideo = ({ stream }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline muted className="w-full h-full object-cover rounded-lg" />;
};

const RemoteVideo = ({ stream }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={ref} autoPlay playsInline className="w-full h-full object-cover rounded-lg" />;
};

const RemoteAudio = ({ stream }) => {
  const ref = useRef();
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);
  return <audio ref={ref} autoPlay className="hidden" />;
};

const Messages = () => {
  const { user, token } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [searchParams] = useSearchParams();
  const selectJobId = searchParams.get('jobId');
  const selectOtherUserId = searchParams.get('otherUserId');

  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);
  const activeRoomRef = useRef(activeRoom);

  // WebRTC & File Upload State & Refs
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'ringing' | 'connected'
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callerName, setCallerName] = useState('');
  const [callParticipant, setCallParticipant] = useState(null);
  const [localStreamObj, setLocalStreamObj] = useState(null);
  const [remoteStreamObj, setRemoteStreamObj] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [blockedUsersList, setBlockedUsersList] = useState([]);

  useEffect(() => {
    if (token) {
      api.get('/profile/me')
        .then((res) => {
          setBlockedUsersList(res.data?.data?.blockedUsers || []);
        })
        .catch((err) => console.error('Failed to fetch user block list:', err));
    }
  }, [token]);

  const handleBlockUnblock = async () => {
    if (!activeRoom) return;
    const isBlocked = blockedUsersList.includes(activeRoom.otherUserId);
    try {
      if (isBlocked) {
        await api.post(`/profile/unblock/${activeRoom.otherUserId}`);
        setBlockedUsersList((prev) => prev.filter((id) => id !== activeRoom.otherUserId));
      } else {
        await api.post(`/profile/block/${activeRoom.otherUserId}`);
        setBlockedUsersList((prev) => [...prev, activeRoom.otherUserId]);
      }
    } catch (err) {
      console.error('Failed to update block status:', err);
    }
    setShowDropdown(false);
  };

  const handleVisitProfile = () => {
    if (activeRoom?.otherUserId) {
      navigate(`/freelancer/${activeRoom.otherUserId}`);
    }
  };

  const callStateRef = useRef(callState);
  const currentCallOfferRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaInputRef = useRef(null);

  const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  };

  useEffect(() => {
    activeRoomRef.current = activeRoom;
  }, [activeRoom]);

  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  // Conversation list via TanStack Query
  const { data: conversations = [], isLoading: convoLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then((r) => r.data?.conversations ?? r.data ?? []),
  });

  // Automatically select room if query params match, or build a temp fallback
  useEffect(() => {
    if (!selectJobId || !selectOtherUserId) return;

    const match = conversations.find(
      (c) => String(c.jobId) === String(selectJobId) && String(c.otherUserId) === String(selectOtherUserId)
    );
    if (match) {
      setActiveRoom(match);
    } else if (!convoLoading) {
      // Fetch user and job info to build a dummy/temp room so we can initiate chat
      Promise.all([
        api.get(`/profile/user/${selectOtherUserId}`).catch(() => null),
        api.get(`/jobs/${selectJobId}`).catch(() => null)
      ]).then(([userRes, jobRes]) => {
        const uData = userRes?.data?.data || userRes?.data;
        const jData = jobRes?.data?.data || jobRes?.data;
        if (uData) {
          setActiveRoom({
            jobId: selectJobId,
            otherUserId: selectOtherUserId,
            jobTitle: jData?.job?.title || jData?.title || 'Job Thread',
            name: uData.name,
            profilePic: uData.profilePic || uData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uData.name}`,
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0,
            isTemp: true
          });
        }
      });
    }
  }, [selectJobId, selectOtherUserId, convoLoading]);

  // Load history when room changes
  useEffect(() => {
    if (!activeRoom) return;
    api.get(`/messages/${activeRoom.jobId}/${activeRoom.otherUserId}`)
      .then((r) => {
        setMessages(r.data?.data ?? []);
        // Mark messages as read immediately
        socketService.getSocket()?.emit('mark_read', { jobId: activeRoom.jobId, senderId: activeRoom.otherUserId });
      })
      .catch(() => setMessages([]));
  }, [activeRoom]);

  // Socket setup
  useEffect(() => {
    if (!token) return;
    const socket = socketService.connect(token);
    
    // Set connected status immediately if already connected
    if (socket.connected) {
      setConnected(true);
    } else {
      setConnected(false);
    }

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);
    
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    socket.on('receive_message', (msg) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });

      // Automatically mark as read if this conversation is active
      const currentActive = activeRoomRef.current;
      const myId = user?._id || user?.id;
      const otherId = msg.sender === myId || msg.senderId === myId ? msg.receiver : (msg.sender || msg.senderId);
      if (currentActive && String(currentActive.jobId) === String(msg.job) && String(currentActive.otherUserId) === String(otherId)) {
        if (msg.sender !== myId && msg.senderId !== myId) {
          socket.emit('mark_read', { jobId: msg.job, senderId: otherId });
          msg.status = 'read';
          msg.isRead = true;
        }
      }

      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        if (myId && (msg.sender === myId || msg.senderId === myId)) {
          const tempIdx = prev.findIndex((m) => String(m._id).startsWith('temp_') && m.text === msg.text);
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = msg;
            return updated;
          }
        }
        return [...prev, msg];
      });
    });

    socket.on('typing_status', ({ userId, isTyping: t }) => {
      if (userId !== (user?._id || user?.id)) setIsTyping(t);
    });

    socket.on('messages_read', ({ jobId, readerId }) => {
      const currentActive = activeRoomRef.current;
      if (currentActive && String(currentActive.jobId) === String(jobId) && String(currentActive.otherUserId) === String(readerId)) {
        setMessages((prev) =>
          prev.map((m) => {
            const myId = user?._id || user?.id;
            if (myId && (m.sender === myId || m.senderId === myId)) {
              return { ...m, status: 'read', isRead: true };
            }
            return m;
          })
        );
      }
    });

    socket.on('messages_delivered', ({ jobId, receiverId }) => {
      const currentActive = activeRoomRef.current;
      if (currentActive && String(currentActive.jobId) === String(jobId) && String(currentActive.otherUserId) === String(receiverId)) {
        setMessages((prev) =>
          prev.map((m) => {
            const myId = user?._id || user?.id;
            if (myId && (m.sender === myId || msg.senderId === myId) && m.status !== 'read') {
              return { ...m, status: 'delivered' };
            }
            return m;
          })
        );
      }
    });

    // WebRTC Signaling Events
    socket.on('incoming_call', ({ from, offer, isVideo, callerName, jobId }) => {
      if (callStateRef.current !== 'idle') {
        socket.emit('decline_call', { to: from });
        return;
      }
      setCallState('ringing');
      setIsVideoCall(isVideo);
      setCallerName(callerName);
      setCallParticipant({ id: from, name: callerName });
      currentCallOfferRef.current = { from, offer, isVideo, jobId };
    });

    socket.on('call_accepted', ({ answer }) => {
      peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(answer))
        .catch((err) => console.error('Failed to set remote description on call accept:', err));
    });

    socket.on('call_declined', () => {
      alert('Call declined.');
      endCall(false);
    });

    socket.on('call_ended', () => {
      endCall(false);
    });

    socket.on('ice_candidate', ({ candidate }) => {
      peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
        .catch((err) => console.error('Failed to add ICE candidate:', err));
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('receive_message');
      socket.off('typing_status');
      socket.off('messages_read');
      socket.off('messages_delivered');
      socket.off('incoming_call');
      socket.off('call_accepted');
      socket.off('call_declined');
      socket.off('call_ended');
      socket.off('ice_candidate');
    };
  }, [token, user?._id, user?.id, qc]);

  // Join room when activeRoom changes or socket connects/reconnects
  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !activeRoom) return;

    const joinRoom = () => {
      const roomId = `${activeRoom.jobId}_${activeRoom.otherUserId}`;
      socket.emit('join_room', { roomId });
    };

    if (socket.connected) {
      joinRoom();
    }
    
    socket.on('connect', joinRoom);
    return () => {
      socket.off('connect', joinRoom);
    };
  }, [activeRoom, connected]);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // --- WebRTC Call Methods ---
  const startCall = async (isVideo) => {
    if (!activeRoom) return;
    setCallState('calling');
    setIsVideoCall(isVideo);
    setCallParticipant({
      id: activeRoom.otherUserId,
      name: activeRoom.name,
      profilePic: activeRoom.profilePic
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });
      localStreamRef.current = stream;
      setLocalStreamObj(stream);

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketService.getSocket()?.emit('ice_candidate', { to: activeRoom.otherUserId, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        remoteStreamRef.current = e.streams[0];
        setRemoteStreamObj(e.streams[0]);
        setCallState('connected');
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketService.getSocket()?.emit('call_user', {
        to: activeRoom.otherUserId,
        offer,
        isVideo,
        callerName: user?.name,
        jobId: activeRoom.jobId
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      alert('Could not access microphone/camera.');
      endCall(false);
    }
  };

  const answerCall = async () => {
    if (!currentCallOfferRef.current) return;
    const { from, offer, isVideo } = currentCallOfferRef.current;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: isVideo
      });
      localStreamRef.current = stream;
      setLocalStreamObj(stream);
      setCallState('connected');

      const pc = new RTCPeerConnection(rtcConfig);
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketService.getSocket()?.emit('ice_candidate', { to: from, candidate: e.candidate });
        }
      };

      pc.ontrack = (e) => {
        remoteStreamRef.current = e.streams[0];
        setRemoteStreamObj(e.streams[0]);
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.getSocket()?.emit('answer_call', { to: from, answer });
    } catch (err) {
      console.error('Failed to answer call:', err);
      alert('Could not access microphone/camera. Declining call.');
      declineCall();
    }
  };

  const declineCall = () => {
    if (currentCallOfferRef.current) {
      socketService.getSocket()?.emit('decline_call', { to: currentCallOfferRef.current.from });
    }
    endCall(false);
  };

  const endCall = (emit = true) => {
    const pc = peerConnectionRef.current;
    const localStream = localStreamRef.current;
    const remoteStream = remoteStreamRef.current;

    localStream?.getTracks().forEach((track) => track.stop());
    remoteStream?.getTracks().forEach((track) => track.stop());

    pc?.close();

    peerConnectionRef.current = null;
    localStreamRef.current = null;
    remoteStreamRef.current = null;
    setLocalStreamObj(null);
    setRemoteStreamObj(null);
    setCallState('idle');
    setCallParticipant(null);

    if (emit) {
      const targetId = activeRoomRef.current?.otherUserId || currentCallOfferRef.current?.from;
      if (targetId) {
        socketService.getSocket()?.emit('end_call', { to: targetId });
      }
    }
    currentCallOfferRef.current = null;
  };

  // --- Chat File Upload & Location Methods ---
  const handleFileUpload = async (e, category) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        const { fileUrl, fileType } = res.data;
        const socket = socketService.getSocket();
        const roomId = `${activeRoom.jobId}_${activeRoom.otherUserId}`;
        const myId = user?._id || user?.id;

        const tempId = `temp_${Date.now()}`;
        const msg = {
          _id: tempId,
          roomId,
          text: '',
          fileUrl,
          fileType,
          senderId: myId,
          senderName: user?.name,
          timestamp: new Date().toISOString(),
          isOwn: true,
        };

        setMessages((prev) => [...prev, msg]);
        socket?.emit('send_message', {
          jobId: activeRoom.jobId,
          receiverId: activeRoom.otherUserId,
          text: '',
          fileUrl,
          fileType,
        });

        qc.invalidateQueries({ queryKey: ['conversations'] });
      }
    } catch (err) {
      console.error('File upload failed:', err);
      alert('File upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const sendLocation = () => {
    if (!navigator.geolocation) {
      return alert('Geolocation is not supported by your browser.');
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const socket = socketService.getSocket();
        const roomId = `${activeRoom.jobId}_${activeRoom.otherUserId}`;
        const myId = user?._id || user?.id;

        const tempId = `temp_${Date.now()}`;
        const msg = {
          _id: tempId,
          roomId,
          text: '',
          fileType: 'location',
          location: { latitude, longitude, address: 'Shared Location' },
          senderId: myId,
          senderName: user?.name,
          timestamp: new Date().toISOString(),
          isOwn: true,
        };

        setMessages((prev) => [...prev, msg]);
        socket?.emit('send_message', {
          jobId: activeRoom.jobId,
          receiverId: activeRoom.otherUserId,
          text: '',
          fileType: 'location',
          location: { latitude, longitude, address: 'Shared Location' },
        });

        qc.invalidateQueries({ queryKey: ['conversations'] });
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Could not retrieve location. Please check permissions.');
      }
    );
  };

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || !activeRoom) return;
    const socket = socketService.getSocket();
    const roomId = `${activeRoom.jobId}_${activeRoom.otherUserId}`;
    const myId = user?._id || user?.id;
    const msg = { roomId, text: inputText.trim(), senderId: myId, senderName: user?.name, timestamp: new Date().toISOString(), _id: `temp_${Date.now()}`, isOwn: true };
    setMessages((prev) => [...prev, msg]);
    socket?.emit('send_message', { jobId: activeRoom.jobId, receiverId: activeRoom.otherUserId, text: msg.text });
    socket?.emit('typing_status', { roomId, userId: myId, isTyping: false });
    qc.invalidateQueries({ queryKey: ['conversations'] });
    setInputText('');
    clearTimeout(typingTimeout.current);
  }, [inputText, activeRoom, user, qc]);

  const handleInput = (e) => {
    setInputText(e.target.value);
    const socket = socketService.getSocket();
    const roomId = `${activeRoom?.jobId}_${activeRoom?.otherUserId}`;
    const myId = user?._id || user?.id;
    socket?.emit('typing_status', { roomId, userId: myId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket?.emit('typing_status', { roomId, userId: myId, isTyping: false }), 1500);
  };

  const filtered = conversations.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-[calc(100vh-40px)] m-4 md:m-8 bg-card border border-border rounded-2xl overflow-hidden flex shadow-2xl">
      {/* Sidebar */}
      <div className={`${activeRoom ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-card flex flex-col border-r border-border flex-shrink-0`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-1.5 bg-muted hover:bg-accent rounded-lg text-muted-foreground transition-colors" title="Back">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/')} className="p-1.5 bg-muted hover:bg-accent rounded-lg text-muted-foreground transition-colors" title="Home">
                <Home className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-bold text-foreground ml-1">Messages</h2>
            </div>
            {connected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="w-full bg-background border border-border text-foreground rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convoLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-12">No conversations yet.</p>
          ) : (
            filtered.map((c) => {
              const roomKey = `${c.jobId}_${c.otherUserId}`;
              const activeKey = activeRoom ? `${activeRoom.jobId}_${activeRoom.otherUserId}` : '';
              return (
                <div key={roomKey} onClick={() => setActiveRoom(c)}
                  className={`p-4 border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors border-l-4 ${activeKey === roomKey ? 'bg-accent/30 border-l-primary' : 'border-l-transparent'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <img 
                        src={c.profilePic} 
                        alt={c.name}
                        className="w-9 h-9 rounded-full object-cover border border-border flex-shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`;
                        }}
                      />
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{c.name}</h4>
                        <p className="text-xs text-primary truncate">{c.jobTitle || 'Direct'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-muted-foreground">{c.lastMessageTime}</span>
                      {c.unreadCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>}
                    </div>
                  </div>
                  <p className={`text-xs mt-1 truncate pl-11 ${c.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{c.lastMessage}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeRoom ? (
        <div className={`${activeRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background min-w-0`}>
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={handleVisitProfile} title="Visit Profile">
              {/* Mobile Back Button */}
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveRoom(null); }} 
                className="p-1.5 md:hidden bg-muted hover:bg-accent rounded-lg text-muted-foreground transition-colors mr-1"
                title="Back to List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <img 
                src={activeRoom.profilePic} 
                alt={activeRoom.name}
                className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeRoom.name}`;
                }}
              />
              <div>
                <h3 className="font-bold text-foreground text-sm group-hover:underline group-hover:text-primary transition-colors">{activeRoom.name}</h3>
                <p className="text-xs">
                  {isTyping ? <span className="text-primary">typing...</span>
                    : connected ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1" /><span className="text-emerald-500">Online</span></>
                    : <span className="text-muted-foreground">Connecting...</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground relative">
              <button 
                onClick={() => startCall(false)}
                disabled={blockedUsersList.includes(activeRoom.otherUserId)}
                className="p-1.5 rounded-lg hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Voice Call"
              >
                <Phone className="w-4 h-4" />
              </button>
              <button 
                onClick={() => startCall(true)}
                disabled={blockedUsersList.includes(activeRoom.otherUserId)}
                className="p-1.5 rounded-lg hover:bg-accent hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                title="Video Call"
              >
                <Video className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-border mx-1" />
              <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-1.5 rounded-lg hover:bg-accent hover:text-foreground transition-colors"
                title="More Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-card border border-border shadow-xl z-30 overflow-hidden py-1">
                  <button 
                    onClick={handleBlockUnblock}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors text-destructive font-semibold"
                  >
                    {blockedUsersList.includes(activeRoom.otherUserId) ? 'Unblock User' : 'Block User'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0
              ? <p className="text-center text-muted-foreground text-sm py-10">No messages yet. Say hello! 👋</p>
              : messages.map((msg) => {
                  const myId = user?._id || user?.id;
                  const isOwn = !!myId && (msg.senderId === myId || msg.sender === myId || msg.isOwn);
                  return (
                    <div key={msg._id} className={`flex gap-3 max-w-[78%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <img 
                          src={activeRoom.profilePic} 
                          alt={msg.senderName || activeRoom.name}
                          className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName || activeRoom.name || 'User'}`;
                          }}
                        />
                      )}
                      <div>
                        <div className={`p-3 rounded-2xl text-sm ${
                          isOwn 
                            ? user?.role?.toLowerCase() === 'client'
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-emerald-600 text-white rounded-tr-none'
                            : user?.role?.toLowerCase() === 'client'
                              ? 'bg-emerald-600/10 text-foreground border border-emerald-500/20 rounded-tl-none'
                              : 'bg-indigo-600/10 text-foreground border border-indigo-500/20 rounded-tl-none'
                        }`}>
                          {msg.fileType === 'image' && msg.fileUrl && (
                            <img 
                              src={msg.fileUrl} 
                              alt="Attached photo" 
                              className="max-w-xs max-h-60 rounded-lg object-cover cursor-pointer mb-2 hover:opacity-95" 
                              onClick={() => window.open(msg.fileUrl, '_blank')} 
                            />
                          )}
                          {msg.fileType === 'video' && msg.fileUrl && (
                            <video 
                              src={msg.fileUrl} 
                              controls 
                              className="max-w-xs max-h-60 rounded-lg mb-2" 
                            />
                          )}
                          {msg.fileType === 'audio' && msg.fileUrl && (
                            <audio 
                              src={msg.fileUrl} 
                              controls 
                              className="max-w-xs mb-2" 
                            />
                          )}
                          {msg.fileType === 'location' && msg.location && (
                            <div className="w-64 h-48 rounded-lg overflow-hidden border border-border/20 mb-2">
                              <iframe
                                title="Location Map"
                                width="100%"
                                height="100%"
                                src={`https://maps.google.com/maps?q=${msg.location.latitude},${msg.location.longitude}&z=15&output=embed`}
                                frameBorder="0"
                                scrolling="no"
                                marginHeight="0"
                                marginWidth="0"
                              />
                              <div className="p-2 bg-black/40 text-[10px] flex justify-between items-center">
                                <span className="truncate">Shared Location</span>
                                <a 
                                  href={`https://www.google.com/maps/search/?api=1&query=${msg.location.latitude},${msg.location.longitude}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-primary hover:underline font-bold"
                                >
                                  Open Google Maps
                                </a>
                              </div>
                            </div>
                          )}
                          {msg.fileType === 'document' && msg.fileUrl && (
                            <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-lg border border-white/10 max-w-xs mb-2">
                              <Paperclip className="w-6 h-6 text-primary flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium truncate text-white">{msg.fileUrl.split('/').pop() || 'Attachment'}</p>
                                <a 
                                  href={msg.fileUrl} 
                                  download 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="text-[10px] text-primary hover:underline font-bold"
                                >
                                  Download File
                                </a>
                              </div>
                            </div>
                          )}
                          {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                        </div>
                        <span className={`text-[10px] text-muted-foreground mt-1 flex items-center justify-end gap-1 ${isOwn ? 'text-right' : ''}`}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          {isOwn && (
                            msg.status === 'read' || msg.isRead ? (
                              <span className="text-sky-400 font-bold text-xs select-none">✓✓</span>
                            ) : msg.status === 'delivered' ? (
                              <span className="text-muted-foreground/60 font-bold text-xs select-none">✓✓</span>
                            ) : (
                              <span className="text-muted-foreground/40 text-xs select-none">✓</span>
                            )
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
            }
            {isTyping && (
              <div className="flex gap-3 max-w-[78%]">
                <img 
                  src={activeRoom.profilePic} 
                  alt={activeRoom.name}
                  className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeRoom.name}`;
                  }}
                />
                <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                  {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
            {blockedUsersList.includes(activeRoom.otherUserId) ? (
              <div className="text-center py-3.5 text-sm text-destructive font-semibold bg-destructive/10 border border-destructive/20 rounded-xl">
                You have blocked this user. Unblock them in the menu options to send messages or start calls.
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => handleFileUpload(e, 'document')} 
                  className="hidden" 
                />
                <input 
                  type="file" 
                  ref={mediaInputRef} 
                  accept="image/*,video/*,audio/*" 
                  onChange={(e) => handleFileUpload(e, 'media')} 
                  className="hidden" 
                />
                
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors relative"
                  title="Attach Document"
                >
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Paperclip className="w-5 h-5" />}
                </button>
                <button 
                  type="button" 
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Attach Photo/Video/Audio"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <button 
                  type="button" 
                  onClick={sendLocation}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                  title="Share Location"
                >
                  <MapPin className="w-5 h-5" />
                </button>
                
                <div className="flex-1 relative">
                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={handleInput}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type your message..."
                    className="w-full bg-background border border-border focus:border-primary text-foreground rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none transition-colors" 
                  />
                  <button 
                    onClick={sendMessage} 
                    disabled={!inputText.trim()}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-primary hover:opacity-90 disabled:opacity-40 text-primary-foreground rounded-full transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-4"><Send className="w-7 h-7 text-muted-foreground" /></div>
            <p className="text-muted-foreground font-medium">Select a conversation</p>
          </div>
        </div>
      )}

      {/* Call Overlay */}
      {callState !== 'idle' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/85 backdrop-blur-md text-foreground p-6">
          <div className="w-full max-w-md bg-card/65 border border-border/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl flex flex-col items-center justify-between min-h-[480px]">
            {/* Ringing/Calling User Info */}
            <div className="flex flex-col items-center gap-4 text-center mt-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-primary shadow-xl animate-pulse">
                  <img 
                    src={callParticipant?.profilePic || `https://api.dicebear.com/7.x/avataaars/svg?seed=${callParticipant?.name || 'User'}`} 
                    alt={callParticipant?.name || 'User'} 
                    className="w-full h-full object-cover" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${callParticipant?.name || 'User'}`;
                    }}
                  />
                </div>
                {isVideoCall && (
                  <span className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full text-xs">
                    <Video className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{callParticipant?.name || callerName || 'Unknown Caller'}</h2>
                <p className="text-sm text-muted-foreground mt-1 capitalize animate-pulse">
                  {callState === 'calling' && 'Calling...'}
                  {callState === 'ringing' && 'Incoming Call...'}
                  {callState === 'connected' && 'Call Active'}
                </p>
              </div>
            </div>

            {/* Video stream rendering if connected & isVideoCall */}
            {callState === 'connected' && isVideoCall && (
              <div className="w-full flex-1 min-h-[200px] my-6 relative rounded-2xl overflow-hidden bg-black border border-border/30">
                {/* Remote Video */}
                {remoteStreamObj ? (
                  <RemoteVideo stream={remoteStreamObj} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                    Connecting video stream...
                  </div>
                )}
                
                {/* Local Video */}
                {localStreamObj && (
                  <div className="absolute bottom-3 right-3 w-28 h-36 rounded-lg overflow-hidden border border-white/20 shadow-lg bg-black z-10">
                    <LocalVideo stream={localStreamObj} />
                  </div>
                )}
              </div>
            )}

            {/* Audio active call details if connected & not isVideoCall */}
            {callState === 'connected' && !isVideoCall && (
              <div className="flex-1 flex flex-col items-center justify-center my-6">
                <div className="flex gap-1 items-end h-8">
                  {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                    <span 
                      key={i} 
                      className="w-1 bg-primary rounded-full animate-pulse" 
                      style={{ 
                        height: `${h * 15}%`, 
                        animationDuration: `${0.8 + (i % 3) * 0.2}s` 
                      }} 
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Voice connection secure</p>
                {remoteStreamObj && <RemoteAudio stream={remoteStreamObj} />}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-6 mt-6">
              {callState === 'ringing' ? (
                <>
                  <button 
                    onClick={declineCall} 
                    className="w-14 h-14 bg-destructive hover:bg-destructive/90 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                    title="Decline Call"
                  >
                    <PhoneOff className="w-6 h-6 text-white" />
                  </button>
                  <button 
                    onClick={answerCall} 
                    className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                    title="Accept Call"
                  >
                    <Phone className="w-6 h-6 text-white" />
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => endCall(true)} 
                  className="w-14 h-14 bg-destructive hover:bg-destructive/90 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
                  title="Hang Up"
                >
                  <PhoneOff className="w-6 h-6 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;