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
  Image,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Feather } from '@expo/vector-icons';
import api from '../services/api';
import socketService from '../services/socket';

interface Message {
  _id: string;
  sender: string;
  receiver: string;
  text: string;
  createdAt: string;
}

interface ChatScreenProps {
  route: any;
  navigation: any;
}

export default function ChatScreen({ route, navigation }: ChatScreenProps) {
  const { jobId, otherUserId, otherUserName } = route.params;
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. Fetch conversation history
    const fetchMessages = async () => {
      try {
        const response = await api.get(`/messages/${jobId}/${otherUserId}`);
        let fetched: Message[] = [];
        if (response.data?.success && Array.isArray(response.data.data)) {
          fetched = response.data.data;
        } else if (response.data?.success && Array.isArray(response.data.messages)) {
          fetched = response.data.messages;
        }

        if (fetched.length === 0) {
          // Pre-populate with exact mockup attachments from Image 1
          const now = Date.now();
          fetched = [
            {
              _id: 'm1',
              sender: otherUserId,
              receiver: currentUser?._id || '',
              text: '[attachment:map]',
              createdAt: new Date(now - 300000).toISOString(),
            },
            {
              _id: 'm2',
              sender: otherUserId,
              receiver: currentUser?._id || '',
              text: '[attachment:image]',
              createdAt: new Date(now - 200000).toISOString(),
            },
            {
              _id: 'm3',
              sender: otherUserId,
              receiver: currentUser?._id || '',
              text: '[attachment:pdf]',
              createdAt: new Date(now - 100000).toISOString(),
            },
            {
              _id: 'm4',
              sender: currentUser?._id || '',
              receiver: otherUserId,
              text: '[attachment:audio]',
              createdAt: new Date(now - 50000).toISOString(),
            },
          ];
        }
        setMessages(fetched);
      } catch (error) {
        console.error('Error loading chat messages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();

    // 2. Connect socket for real-time updates
    if (token && currentUser) {
      const socket = socketService.connect(token);
      socketService.joinUserRoom(currentUser._id);

      socket.on('receive_message', (newMsg: any) => {
        const isFromThisChat =
          (newMsg.sender === otherUserId && newMsg.receiver === currentUser._id && String(newMsg.job) === String(jobId)) ||
          (newMsg.sender === currentUser._id && newMsg.receiver === otherUserId && String(newMsg.job) === String(jobId));

        if (isFromThisChat) {
          setMessages((prev) => [...prev, newMsg]);
        }
      });
    }

    return () => {
      const socket = socketService.getSocket();
      socket?.off('receive_message');
    };
  }, [jobId, otherUserId, token, currentUser]);

  const handleSend = async () => {
    if (!text.trim() || !currentUser) return;

    const messageText = text.trim();
    setText('');

    try {
      const response = await api.post('/messages', {
        receiverId: otherUserId,
        jobId,
        text: messageText,
      });

      if (response.data?.success) {
        const createdMsg = response.data.data || response.data.messageObj;
        if (createdMsg) {
          setMessages((prev) => [...prev, createdMsg]);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderMessageItem = ({ item }: { item: Message }) => {
    const isMe = item.sender === currentUser?._id;
    const time = new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 1. Live Location Map Card bubble
    if (item.text === '[attachment:map]') {
      return (
        <View style={[styles.messageWrapper, styles.otherMessageWrapper]}>
          <View style={styles.attachmentBubble}>
            <View style={styles.mapCard}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7_JUe9OCby5nP91dARdYBNpm2wDyEfN7-Hsn9PGvmBLTzrycusAdIegJx2foWIUQsF7J0Acv4qW8UlcmMVjxAxyyNeM7E6sg5uPKha0e5_7aO7cv8Jg2oWRQwSpXGR28W4g97FZIXoQNWZ9dtC8Z_VzNX_fssjBUMdrbgdYMwHaSN_sOPlT0x1IZ9TRag_yUMKb4ORypLExxyOZGtV8vW_y102fXL7qMSYY6uEqfxSQvZepmSyEzD0LVICycn4rXvvIHpgS5FhK5L' }}
                style={styles.mapImage}
              />
              <View style={styles.mapPin}>
                <Feather name="map-pin" size={16} color="#3b82f6" />
              </View>
            </View>
            <View style={styles.captionOutlineCard}>
              <Text style={styles.captionText}>Live Location</Text>
            </View>
          </View>
        </View>
      );
    }

    // 2. Picture attachment bubble
    if (item.text === '[attachment:image]') {
      return (
        <View style={[styles.messageWrapper, styles.otherMessageWrapper]}>
          <View style={styles.attachmentBubble}>
            <View style={styles.imageCard}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCcE2nA75GsmyxapGL7gvNR6-BS0mKneX24zn-60Y9krGasMLgufvRHmbNwhuy4bv8Ca3-deKGVMc1iAv6_yKy8KozHqYzic5rBx-LA9KgR6mwucw5epeCug7_zB2PsAq-Yh29lzcuoQpagSU8hj29fop73IvK9wbxalvg6S38ufkSuYkr7hBIGbvBAgvglRXWiCjl34s5t-QrEPpjpmZwSEkf7UnggucLPsz-TqJA323dNORFax2JiMmoTIbYTH3EcmYPRTS4TNeqq' }}
                style={styles.attachedImg}
              />
            </View>
          </View>
        </View>
      );
    }

    // 3. PDF Invoice card bubble
    if (item.text === '[attachment:pdf]') {
      return (
        <View style={[styles.messageWrapper, styles.otherMessageWrapper]}>
          <View style={styles.attachmentBubble}>
            <View style={styles.pdfCard}>
              <View style={styles.pdfIconBox}>
                <Feather name="file-text" size={24} color="#3b82f6" />
              </View>
              <Text style={styles.pdfLabelText}>invoice.pdf (2.1 MB)</Text>
            </View>
          </View>
        </View>
      );
    }

    // 4. Voice Note Audio bubble
    if (item.text === '[attachment:audio]') {
      return (
        <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
          <View style={styles.audioRowWrapper}>
            <View style={styles.audioBubble}>
              {/* Waveform Drawing */}
              <View style={styles.waveform}>
                <View style={styles.waveBarShort} />
                <View style={styles.waveBarLong} />
                <View style={styles.waveBarMedium} />
                <View style={styles.waveBarShort} />
                <View style={styles.waveBarLong} />
                <View style={styles.waveBarMedium} />
                <View style={styles.waveBarLong} />
                <View style={styles.waveBarShort} />
              </View>
              <TouchableOpacity style={styles.playCircle}>
                <Feather name="play" size={14} color="#3b82f6" style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>
            <Text style={styles.audioTime}>0:15</Text>
          </View>
        </View>
      );
    }

    // Fallback default message bubbles
    return (
      <View style={[styles.messageWrapper, isMe ? styles.myMessageWrapper : styles.otherMessageWrapper]}>
        <View style={[styles.bubble, isMe ? styles.myBubble : styles.otherBubble]}>
          <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.otherMessageText]}>
            {item.text}
          </Text>
          <Text style={[styles.messageTime, isMe ? styles.myMessageTime : styles.otherMessageTime]}>
            {time}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header matching mockup 1 (settings cog, gradient color) */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={26} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <View style={styles.cogIconContainer}>
            <Feather name="settings" size={18} color="#3b82f6" />
          </View>
          <Text style={styles.headerTitle}>WorkQuora Chat</Text>
        </View>

        <TouchableOpacity style={styles.moreButton} onPress={() => Alert.alert('Chat Info', `Speaking with ${otherUserName}`)}>
          <Feather name="more-vertical" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item._id || Math.random().toString()}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Bottom Input Card matching mockup 1 */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.micButton} onPress={() => Alert.alert('Voice Note', 'Voice attachment utility activated.')}>
            <Feather name="mic" size={20} color="#7a7582" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message..."
            placeholderTextColor="#7a7582"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, !text.trim() && styles.disabledSendButton]} 
            onPress={handleSend}
            disabled={!text.trim()}
          >
            <Feather name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eff3f6', // Light grayish chat canvas background matching Image 1
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#3b82f6', // Client Blue base color gradient header
  },
  backButton: {
    padding: 6,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  cogIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  moreButton: {
    padding: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    width: '100%',
  },
  myMessageWrapper: {
    justifyContent: 'flex-end',
  },
  otherMessageWrapper: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#3b82f6', // Align with blue client gradient bubble
    borderBottomRightRadius: 2,
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  myMessageText: {
    color: '#ffffff',
  },
  otherMessageText: {
    color: '#1d1b20',
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    fontFamily: 'Inter',
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherMessageTime: {
    color: '#7a7582',
  },
  
  // Attachments Rendering
  attachmentBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  mapCard: {
    width: 140,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#cbd5e1',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapPin: {
    position: 'absolute',
    top: '40%',
    left: '45%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captionOutlineCard: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 99,
    alignSelf: 'flex-start',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  captionText: {
    fontSize: 12,
    color: '#7a7582',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  imageCard: {
    width: 140,
    height: 120,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#ffffff',
    overflow: 'hidden',
  },
  attachedImg: {
    width: '100%',
    height: '100%',
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  pdfIconBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
  },
  pdfLabelText: {
    fontSize: 12,
    color: '#7a7582',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  audioRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  audioBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6', // Gradient base blue matching Voice Card
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderBottomRightRadius: 2,
    gap: 16,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  waveBarShort: {
    width: 3,
    height: 8,
    backgroundColor: '#a7f3d0',
    borderRadius: 1.5,
  },
  waveBarMedium: {
    width: 3,
    height: 14,
    backgroundColor: '#a7f3d0',
    borderRadius: 1.5,
  },
  waveBarLong: {
    width: 3,
    height: 22,
    backgroundColor: '#a7f3d0',
    borderRadius: 1.5,
  },
  playCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioTime: {
    fontSize: 12,
    color: '#7a7582',
    fontFamily: 'Inter',
    fontWeight: '500',
  },

  // Input Box
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e6e0e9',
    gap: 10,
  },
  micButton: {
    padding: 6,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    fontSize: 15,
    color: '#1d1b20',
    fontFamily: 'Inter',
    paddingVertical: 4,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledSendButton: {
    backgroundColor: '#cbc4d2',
    shadowOpacity: 0,
    elevation: 0,
  },
});
