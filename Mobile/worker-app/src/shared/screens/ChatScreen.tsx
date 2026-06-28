import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { useSelector } from 'react-redux';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';
import socketService from '../../services/socket';
import { useTheme } from '../theme/theme';
import ChatBubble, { ChatMessage } from '../components/ChatBubble';

interface ChatScreenProps {
  route: any;
  navigation: any;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { jobId, otherUserId, otherUserName } = route.params || {};
  const { colors } = useTheme();
  
  const currentUser = useSelector((state: any) => state.auth.user);
  const token = useSelector((state: any) => state.auth.token);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  // Advanced feature states
  const [isBlocked, setIsBlocked] = useState(false);
  const [recordingAudio, setRecordingAudio] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Calling States
  const [callingModalVisible, setCallingModalVisible] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callStatus, setCallStatus] = useState<'dialing' | 'connected' | 'ended'>('dialing');
  const [callSeconds, setCallSeconds] = useState(0);
  const [micMuted, setMicMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);

  useEffect(() => {
    // 1. Fetch conversation history
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/${jobId}/${otherUserId}`);
        let fetched: ChatMessage[] = [];
        if (response.data?.success && Array.isArray(response.data.data)) {
          fetched = response.data.data;
        } else if (response.data?.success && Array.isArray(response.data.messages)) {
          fetched = response.data.messages;
        }

        setMessages(fetched);
      } catch (error) {
        console.error('Error loading chat messages:', error);
      } finally {
        setLoading(false);
      }
    };

    // 2. Fetch block status
    const checkBlockStatus = async () => {
      try {
        const response = await api.get('/profile/me');
        if (response.data?.success && response.data.data?.blockedUsers) {
          setIsBlocked(response.data.data.blockedUsers.includes(otherUserId));
        }
      } catch (err) {
        console.error('Error loading block status:', err);
      }
    };

    // 2.5 Fetch other user profile for dynamic avatar and rating
    const fetchOtherUserProfile = async () => {
      try {
        const response = await api.get(`/profile/user/${otherUserId}`);
        if (response.data?.success && response.data.data) {
          setOtherUserProfile(response.data.data);
        }
      } catch (err) {
        console.error('Error loading other user profile:', err);
      }
    };

    fetchMessages();
    checkBlockStatus();
    fetchOtherUserProfile();

    // 3. Setup Socket communication
    let socket: any = null;
    if (token && currentUser?._id) {
      socket = socketService.connect(token);
      socketService.joinUserRoom(currentUser._id);

      const roomId = `${jobId}_${otherUserId}`;
      socket.emit('join_room', { roomId });

      socket.on('receive_message', (msg: ChatMessage) => {
        if (
          msg.job === jobId &&
          ((msg.sender === otherUserId && msg.receiver === currentUser?._id) ||
            (msg.sender === currentUser?._id && msg.receiver === otherUserId))
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === msg._id)) return prev;
            const tempIndex = prev.findIndex(
              (m) => m._id.startsWith('temp-') && m.sender === msg.sender && m.text === msg.text
            );
            if (tempIndex !== -1) {
              return prev.map((m, idx) => (idx === tempIndex ? msg : m));
            }
            return [...prev, msg];
          });

          if (msg.sender === otherUserId) {
            socket.emit('mark_read', { jobId, senderId: otherUserId });
          }
        }
      });

      socket.on('messages_delivered', ({ jobId: delJobId, receiverId }: { jobId: string; receiverId: string }) => {
        if (delJobId === jobId && receiverId === otherUserId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.sender === currentUser?._id && msg.status === 'sent'
                ? { ...msg, status: 'delivered' }
                : msg
            )
          );
        }
      });

      socket.on('messages_read', ({ jobId: readJobId, readerId }: { jobId: string; readerId: string }) => {
        if (readJobId === jobId && readerId === otherUserId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.sender === currentUser?._id && (msg.status === 'sent' || msg.status === 'delivered')
                ? { ...msg, status: 'read', isRead: true }
                : msg
            )
          );
        }
      });
    }

    return () => {
      if (socket) {
        const roomId = `${jobId}_${otherUserId}`;
        socket.emit('leave_room', { roomId });
        socket.off('receive_message');
        socket.off('messages_delivered');
        socket.off('messages_read');
      }
      socketService.disconnect();
    };
  }, [jobId, otherUserId, token, currentUser]);

  // Voice recording timer
  useEffect(() => {
    let interval: any = null;
    if (recordingAudio) {
      interval = setInterval(() => {
        setRecordSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [recordingAudio]);

  // Calling Status transition simulation
  useEffect(() => {
    let timer: any = null;
    if (callingModalVisible && callStatus === 'dialing') {
      timer = setTimeout(() => {
        setCallStatus('connected');
      }, 2500);
    }
    return () => clearTimeout(timer);
  }, [callingModalVisible, callStatus]);

  // Call timer increment
  useEffect(() => {
    let interval: any = null;
    if (callingModalVisible && callStatus === 'connected') {
      interval = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callingModalVisible, callStatus]);

  const handleSend = async () => {
    if (!text.trim()) return;

    const payload = {
      jobId,
      receiverId: otherUserId,
      text: text.trim(),
    };

    // Optimistic rendering
    const tempMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      sender: currentUser?._id || '',
      receiver: otherUserId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, tempMsg]);
    setText('');

    try {
      const response = await api.post('/messages', payload);
      if (response.data?.success && response.data.data) {
        // Replace temp msg with server verified record
        setMessages((prev) =>
          prev.map((m) => (m._id === tempMsg._id ? response.data.data : m))
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Send Error', 'Message could not be delivered.');
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
    }
  };

  const handleSendAttachment = async (type: string) => {
    let attachmentText = '';
    if (type === 'map') {
      attachmentText = '[attachment:map]';
    } else if (type === 'image') {
      attachmentText = '[attachment:image]';
    } else if (type === 'pdf') {
      attachmentText = '[attachment:pdf]';
    } else if (type === 'audio') {
      attachmentText = '[attachment:audio]';
    }

    if (!attachmentText) return;

    const payload = {
      jobId,
      receiverId: otherUserId,
      text: attachmentText,
    };

    // Optimistic rendering
    const tempMsg: ChatMessage = {
      _id: `temp-${Date.now()}`,
      sender: currentUser?._id || '',
      receiver: otherUserId,
      text: attachmentText,
      createdAt: new Date().toISOString(),
      status: 'sent',
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const response = await api.post('/messages', payload);
      if (response.data?.success && response.data.data) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempMsg._id ? response.data.data : m))
        );
      }
    } catch (e) {
      console.error('Failed to send attachment:', e);
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
    }
  };

  const handleAttachmentPress = (type: string) => {
    Alert.alert('Attachment Download', `Opening attachment file of type: ${type.toUpperCase()}`);
  };

  const handlePlusPress = () => {
    Alert.alert(
      'Share Media',
      'Select the attachment type to send',
      [
        { text: '📷 Photo / Image', onPress: () => handleSendAttachment('image') },
        { text: '📁 PDF Document', onPress: () => handleSendAttachment('pdf') },
        { text: '📍 Live Location', onPress: () => handleSendAttachment('map') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const startAudioRecording = () => {
    setRecordSeconds(0);
    setRecordingAudio(true);
  };

  const handleMorePress = () => {
    Alert.alert(
      'Chat Options',
      'Manage conversation settings',
      [
        {
          text: isBlocked ? 'Unblock User' : 'Block User',
          style: 'destructive',
          onPress: toggleBlockUser,
        },
        {
          text: 'Cancel',
          style: 'cancel',
        }
      ]
    );
  };

  const toggleBlockUser = async () => {
    try {
      const endpoint = isBlocked ? `/profile/unblock/${otherUserId}` : `/profile/block/${otherUserId}`;
      const response = await api.post(endpoint);
      if (response.data?.success) {
        setIsBlocked(!isBlocked);
        Alert.alert('Success', isBlocked ? 'User unblocked successfully.' : 'User blocked successfully.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to update block status.');
    }
  };

  const startCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setCallStatus('dialing');
    setCallSeconds(0);
    setCallingModalVisible(true);
  };

  const formatCallTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>

        <Image 
          source={{ uri: otherUserProfile?.profilePic || otherUserProfile?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserName}` }} 
          style={styles.headerAvatar} 
        />

        <View style={styles.headerInfo}>
          <Text style={[styles.headerName, { color: colors.text }]} numberOfLines={1}>
            {otherUserName}
          </Text>
          <View style={styles.statusRow}>
            {otherUserProfile?.averageRating !== undefined && otherUserProfile?.averageRating > 0 ? (
              <>
                <Text style={styles.starText}>★</Text>
                <Text style={styles.ratingText}>
                  {otherUserProfile.averageRating.toFixed(1)} ({otherUserProfile.role === 'CLIENT' ? 'Client' : `${otherUserProfile.totalJobsCompleted || 0} reviews`})
                </Text>
              </>
            ) : (
              <Text style={styles.ratingText}>
                {otherUserProfile?.role === 'CLIENT' ? 'Client' : 'Freelancer'} • Active
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => startCall('audio')}>
            <Feather name="phone" size={20} color="#63597C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={() => startCall('video')}>
            <Feather name="video" size={20} color="#63597C" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn} onPress={handleMorePress}>
            <Feather name="more-vertical" size={20} color="#63597C" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Message List */}
      {loading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            renderItem={({ item }) => {
              const isSelf = item.sender === (currentUser?._id || '');
              return (
                <ChatBubble
                  message={item}
                  isSelf={isSelf}
                  onPressAttachment={handleAttachmentPress}
                />
              );
            }}
          />

          {/* Interactive Input Bar / Block Bar / Recording Bar */}
          {isBlocked ? (
            <View style={styles.blockedBar}>
              <Feather name="slash" size={16} color="#ba1a1a" style={{ marginRight: 6 }} />
              <Text style={styles.blockedText}>You have blocked this user. Unblock to continue chatting.</Text>
            </View>
          ) : recordingAudio ? (
            <View style={[styles.inputContainerRow, { justifyContent: 'space-between', backgroundColor: '#fef2f2', borderTopColor: '#fecaca' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.pulsingDot} />
                <Text style={{ color: '#ef4444', fontWeight: '700', marginLeft: 8 }}>
                  Recording Audio... {recordSeconds}s
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <TouchableOpacity onPress={() => setRecordingAudio(false)} style={styles.cancelRecordBtn}>
                  <Text style={{ color: '#6b7280', fontWeight: '600' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {
                  setRecordingAudio(false);
                  handleSendAttachment('audio');
                }} style={styles.sendRecordBtn}>
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>Send</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.inputContainerRow}>
              {/* Plus Icon */}
              <TouchableOpacity style={styles.plusBtn} onPress={handlePlusPress}>
                <Feather name="plus" size={20} color="#63597C" />
              </TouchableOpacity>

              {/* Input Box Wrapper */}
              <View style={styles.inputFieldWrapper}>
                <TextInput
                  style={styles.chatTextInput}
                  placeholder="Type a message..."
                  placeholderTextColor="#9ca3af"
                  value={text}
                  onChangeText={setText}
                  onSubmitEditing={handleSend}
                />
                <TouchableOpacity style={styles.emojiBtn}>
                  <Feather name="smile" size={20} color="#9ca3af" />
                </TouchableOpacity>
              </View>

              {/* Mic Icon */}
              <TouchableOpacity style={styles.micBtn} onPress={startAudioRecording}>
                <Feather name="mic" size={20} color="#63597C" />
              </TouchableOpacity>

              {/* Send Icon */}
              <TouchableOpacity
                style={[styles.sendIconBtn, !text.trim() && styles.disabledSendBtn]}
                onPress={handleSend}
                disabled={!text.trim()}
              >
                <Feather name="send" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

      {/* CALLING SYSTEM MODAL OVERLAY */}
      <Modal
        visible={callingModalVisible}
        transparent={false}
        animationType="slide"
        onRequestClose={() => setCallingModalVisible(false)}
      >
        <SafeAreaView style={styles.callContainer}>
          {/* Video Mock background */}
          {callType === 'video' && callStatus === 'connected' ? (
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800' }}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#1e1b29' }]} />
          )}

          {/* User Call Profile Info */}
          <View style={styles.callProfileContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300' }}
              style={styles.callAvatar}
            />
            <Text style={styles.callName}>{otherUserName}</Text>
            <Text style={styles.callState}>
              {callStatus === 'dialing' ? 'Dialing...' : `Connected (${formatCallTime(callSeconds)})`}
            </Text>
          </View>

          {/* Live Wave Pulsar (for Audio Connection) */}
          {callType === 'audio' && callStatus === 'connected' && (
            <View style={styles.waveformContainer}>
              {[12, 28, 40, 24, 16, 20, 36, 44, 22, 14].map((h, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.callWaveBar, 
                    { height: h + Math.sin(callSeconds + i) * 6 }
                  ]} 
                />
              ))}
            </View>
          )}

          {/* Call Controls */}
          <View style={styles.callActionsContainer}>
            <TouchableOpacity 
              style={[styles.callBtn, micMuted && styles.callBtnActive]} 
              onPress={() => setMicMuted(!micMuted)}
            >
              <Feather name={micMuted ? 'mic-off' : 'mic'} size={20} color={micMuted ? '#fff' : '#1e1b29'} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.callBtn, speakerOn && styles.callBtnActive]} 
              onPress={() => setSpeakerOn(!speakerOn)}
            >
              <Feather name="volume-2" size={20} color={speakerOn ? '#fff' : '#1e1b29'} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.callBtn, { backgroundColor: '#ef4444' }]} 
              onPress={() => {
                setCallingModalVisible(false);
                setCallStatus('ended');
              }}
            >
              <Feather name="phone-off" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 6,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerActionBtn: {
    padding: 8,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8,
  },
  starText: {
    color: '#f59e0b',
    fontSize: 12,
    marginRight: 2,
  },
  ratingText: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  plusBtn: {
    padding: 6,
  },
  inputFieldWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    height: 40,
  },
  chatTextInput: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    paddingVertical: 4,
  },
  emojiBtn: {
    padding: 4,
  },
  micBtn: {
    padding: 6,
    marginRight: 6,
  },
  sendIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#63597C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendBtn: {
    opacity: 0.5,
  },
  
  // User Blocking style
  blockedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#fdf2f2',
    borderTopWidth: 1,
    borderTopColor: '#fecaca',
  },
  blockedText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Audio Recording Pulsator
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ef4444',
  },
  cancelRecordBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sendRecordBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },

  // Calling Modal Screen
  callContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 40,
  },
  callProfileContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  callAvatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
    borderColor: '#e1d4fd',
    marginBottom: 20,
  },
  callName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  callState: {
    fontSize: 14,
    color: '#a78bfa',
    fontWeight: '600',
    marginTop: 6,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 60,
  },
  callWaveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#a78bfa',
  },
  callActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginBottom: 40,
  },
  callBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  callBtnActive: {
    backgroundColor: '#6750a4',
  },
});

