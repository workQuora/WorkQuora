// hooks/useChat.js
// ─────────────────────────────────────────────────────────────────────────────
// Real-time chat hook using Socket.io
// Events used:
//   emit  → join_room, send_message, typing_status
//   on    → receive_message, typing_status, user_online
// REST   → GET /api/v1/chat/:roomId/history
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import axios from 'axios';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useChat = (roomId) => {
  const { user, token } = useSelector((state) => state.auth);

  const socketRef       = useRef(null);
  const [messages,      setMessages]     = useState([]);
  const [isConnected,   setIsConnected]  = useState(false);
  const [isTyping,      setIsTyping]     = useState(false);   // remote user typing
  const [historyLoading, setHistoryLoading] = useState(false);

  // ── Load chat history from REST API ────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!roomId) return;
    setHistoryLoading(true);
    try {
      const { data } = await axios.get(`/api/v1/chat/${roomId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(data?.messages ?? []);
    } catch (err) {
      console.error('[useChat] History fetch failed:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [roomId, token]);

  // ── Init Socket ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !token) return;

    const socket = io(SOCKET_URL, {
      auth:            { token },
      transports:      ['websocket'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', { roomId });
      loadHistory();
    });

    socket.on('disconnect', () => setIsConnected(false));

    // Incoming messages
    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Remote user typing indicator
    socket.on('typing_status', ({ userId, isTyping: typing }) => {
      if (userId !== user?._id) setIsTyping(typing);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, token, user?._id, loadHistory]);

  // ── Send message ────────────────────────────────────────────────────────────
  const sendMessage = useCallback((text) => {
    if (!text.trim() || !socketRef.current) return;

    const msgPayload = {
      roomId,
      text:      text.trim(),
      senderId:  user?._id,
      senderName: user?.name,
      timestamp: new Date().toISOString(),
    };

    // Optimistic UI — add to local state immediately
    setMessages((prev) => [...prev, { ...msgPayload, _id: `temp_${Date.now()}`, isOwn: true }]);

    socketRef.current.emit('send_message', msgPayload);
  }, [roomId, user]);

  // ── Typing emission (debounced externally or call here) ────────────────────
  const emitTyping = useCallback((typing) => {
    socketRef.current?.emit('typing_status', { roomId, userId: user?._id, isTyping: typing });
  }, [roomId, user?._id]);

  return {
    messages,
    isConnected,
    isTyping,           // remote user is typing
    historyLoading,
    sendMessage,
    emitTyping,
  };
};