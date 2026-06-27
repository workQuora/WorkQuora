import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { notificationsApi } from '../api/endpoints';

const useNotifications = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    refetchInterval: 30000,
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: notificationsApi.markOneRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    markAllRead: () => markAll.mutate(),
    markOneRead: (id) => markOne.mutate(id),
  };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
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

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setIsOpen((p) => !p)}
        className="p-2.5 bg-accent/40 border border-border hover:bg-accent rounded-xl text-muted-foreground hover:text-foreground transition-all active:scale-95 relative" 
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-background animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-border flex justify-between items-center bg-accent/20">
            <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1 font-semibold">
                <CheckCircle className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs font-medium">
                <Bell className="w-7 h-7 mx-auto mb-2 opacity-30 text-muted-foreground" />
                You're all caught up!
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !(n.isRead || n.read);
                return (
                  <div key={n._id || n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-4 border-b border-border/50 cursor-pointer hover:bg-accent/40 transition-colors ${isUnread ? 'bg-primary/5' : ''}`}>
                    <p className={`text-xs leading-relaxed ${isUnread ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                      {n.message || n.text}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1.5">{formatDate(n.createdAt) || n.time || ''}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;