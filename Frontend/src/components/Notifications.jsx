import React, { useState, useRef, useEffect } from 'react';
import {
  Bell, CheckCircle, Loader2, ClipboardList, Wallet, Info, MessageSquare, Star,
  UserCog, ShieldAlert, ShieldCheck, BellOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { notificationsApi } from '../api/endpoints';
import { socketService } from '../services/socket';

const useNotifications = () => {
  const qc = useQueryClient();
  const token = useSelector((s) => s.auth.token);
  const userId = useSelector((s) => s.auth.user?._id || s.auth.user?.id);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    refetchInterval: 60000, // fallback poll — socket delivers instantly when connected
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: notificationsApi.markOneRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // ── Real-time push: backend emits 'receive_notification' to a per-user
  // socket room (Backend/src/utils/notification.js). Membership in that room
  // is tied to the socket instance via 'join_user_room' and is NOT persisted
  // across reconnects, so it has to be (re)requested on every 'connect', not
  // just once on mount. socketService.connect() is idempotent — safe to call
  // here even if Messages.jsx has already opened the same socket.
  useEffect(() => {
    if (!token || !userId) return;
    const socket = socketService.connect(token);

    const joinRoom = () => socketService.joinUserRoom(userId);
    if (socket.connected) joinRoom();
    socket.on('connect', joinRoom);

    const handleNewNotification = (notification) => {
      qc.setQueryData(['notifications'], (old) => {
        if (!old) return old;
        // Guard a duplicate delivery if the 60s poll and the socket push land together
        if (old.notifications?.some((n) => n._id === notification._id)) return old;
        return {
          ...old,
          notifications: [notification, ...(old.notifications || [])],
          unreadCount: (old.unreadCount || 0) + 1,
        };
      });
    };
    socket.on('receive_notification', handleNewNotification);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('receive_notification', handleNewNotification);
    };
  }, [token, userId, qc]);

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    markAllRead: () => markAll.mutate(),
    markOneRead: (id) => markOne.mutate(id),
  };
};

const TYPE_ICONS = {
  task_update: ClipboardList,
  payment_alert: Wallet,
  system_alert: Info,
  new_message: MessageSquare,
  review_received: Star,
  account_activity: UserCog,
  security_alert: ShieldAlert,
  kyc_update: ShieldCheck,
};

const getIcon = (type) => TYPE_ICONS[type] || Bell;

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday - startOfDate) / (24 * 60 * 60 * 1000));
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadSnapshot, setUnreadSnapshot] = useState(new Set());
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { notifications, unreadCount, isLoading, markAllRead, markOneRead } = useNotifications();

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Opening the panel is treated as "seen" — the bell badge clears shortly
  // after, matching how LinkedIn/Twitter behave. The unread *highlight*
  // inside the list stays keyed off this snapshot (not live isRead), so
  // items don't visually flip to "read" out from under the user mid-glance.
  useEffect(() => {
    if (!isOpen) return;
    setUnreadSnapshot(new Set(notifications.filter((n) => !(n.isRead || n.read)).map((n) => n._id || n.id)));
    if (unreadCount > 0) {
      const t = setTimeout(() => markAllRead(), 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleNotificationClick = (n) => {
    const isUnread = !(n.isRead || n.read);
    if (isUnread) {
      markOneRead(n._id || n.id);
    }

    // Navigate based on metadata
    if (n.onModel === 'Job' && n.relatedId) {
      navigate(`/job/${n.relatedId}`);
    } else if (n.onModel === 'Message') {
      navigate('/shared/messages');
    } else if (n.onModel === 'Task') {
      const isClient = user?.role?.toLowerCase() === 'client';
      navigate(isClient ? '/client/dashboard' : '/freelancer/dashboard');
    } else if (n.onModel === 'Review') {
      navigate('/profile');
    }
    setIsOpen(false);
  };

  const badgeLabel = unreadCount > 9 ? '9+' : unreadCount;

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setIsOpen((p) => !p)}
        className="p-2.5 bg-accent/40 border border-border hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95 relative"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-background leading-none">
            {badgeLabel}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Subtle backdrop — dims the page slightly and blurs it a touch,
                without going fully opaque/heavy. Click closes the panel. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-accent/20">
                <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </h3>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                    <CheckCircle className="w-3 h-3" /> Mark all as read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                  <div className="flex justify-center items-center p-10">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="px-8 py-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <BellOff className="w-5 h-5 text-primary/60" />
                    </div>
                    <p className="text-sm font-bold text-foreground">You're all caught up!</p>
                    <p className="text-xs text-muted-foreground mt-1">No new notifications right now.</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isUnread = unreadSnapshot.has(n._id || n.id);
                    const Icon = getIcon(n.type);
                    return (
                      <div key={n._id || n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`flex items-start gap-3 p-4 border-b border-border/50 cursor-pointer hover:bg-accent/40 transition-colors ${isUnread ? 'bg-primary/5' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUnread ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs leading-relaxed ${isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                            {n.message || n.text}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{formatRelativeTime(n.createdAt) || n.time || ''}</p>
                        </div>
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />}
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
