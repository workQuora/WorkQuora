import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api, { getApiData } from '../services/api';

interface Conversation {
  jobId: string;
  otherUserId: string;
  jobTitle: string;
  name: string;
  profilePic: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatListScreenProps {
  navigation: any;
}

export default function ChatListScreen({ navigation }: ChatListScreenProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchConversations = async () => {
    try {
      const response = await api.get('/messages/conversations');
      let convs: Conversation[] = [];
      if (response.data?.success && Array.isArray(response.data.conversations)) {
        convs = response.data.conversations;
      }

      if (convs.length === 0) {
        // Fallback mock data matching Stitch Chats screen design
        convs = [
          {
            jobId: 'job1',
            otherUserId: 'user1',
            jobTitle: 'Mobile App Audit',
            name: 'Sarah Jenkins',
            profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvo-QuuImRZmKj9gb2kKdRk_m65nCwJ6yDi-1weKLcf1-QkbbiP5PfjaDkGagWYOzW8BgT82C6WyMmWdIwHtwVZ3doTeYvnFK1AxS0pxfh2K5GvIOKf4uqxbMOJVozyLe9Irwxr43BRK4-yxROvtHmvAK_5ZkED3ftuC8x-Dv10EzoDso7buKWdUXOcjIGVH1M1AM6mf_JTeSDzCuRweU6CnSSbsZCfQFXO1QFJEgn3lZpnui4R1sZiriibp7QyGxl37ztQV3mWFy8',
            lastMessage: 'The project milestones are ready for review. Can you take a look?',
            lastMessageTime: '2:45 PM',
            unreadCount: 2,
          },
          {
            jobId: 'job2',
            otherUserId: 'user2',
            jobTitle: 'Smart Contract Integration',
            name: 'Michael Chen',
            profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtWctGklO2cxJZNyFcOhH5T9pWbWyk-M-0S7gbsZlXt0M5ULg43SDhl6dwMww0NGK63mzSOktxquu1LvYgxqXBpu0PR2Fpl7nuzENn-ZZvcQUQZZmjRtNZN-uIKWi5xyIX-C02yXMEZjn1GBNernr6iZyjZHWDyjHfZENsAzRnsyIAliDvs9L1HrqrH0jaQPwxTF0b6MKz9UIUhJRNFyuBYy1GyQRU6KWrQc69GDpC250QtqqhZFky3Tgo_RjpmCfFVDhfTVStNt_4',
            lastMessage: 'Thanks for the update on the smart contract integration!',
            lastMessageTime: '11:20 AM',
            unreadCount: 0,
          },
          {
            jobId: 'job3',
            otherUserId: 'user3',
            jobTitle: 'UI/UX Redesign Assets',
            name: 'Elena Rodriguez',
            profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVmkOXCVtO4UuckVBxlY9ZoUfNlyAfQRdQJiOIvEyjq8FS_8FgdmfqtKmRpADNU_0xFnbH0Kag3nbIclxsqIuABOx_hM7is7AeTQntWHQKb_KnOEMdjEUYVTuhC-k7-jfcbBcsa0Qgha0B9Ajn_JK4AUzGrek8qxi5VCPtw1xWCyHEhlmySL3ngngYvMt6Cy14esH17i79E_BIlnb5q84vexVVymAQ05L7cjry5DE6txptYi97Irko9tYi6J5BOWA1ztsQJWvJBoia',
            lastMessage: "I've uploaded the final Figma files to the dashboard. Check them out!",
            lastMessageTime: 'Yesterday',
            unreadCount: 0,
          },
          {
            jobId: 'job4',
            otherUserId: 'user4',
            jobTitle: 'Corporate Consultation',
            name: 'David Sterling',
            profilePic: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDZYDvT2kcTYwyyp2hO1BuownLOWmESire2UOcQi3iJDR8uZR1vQ6tTkYXXa0TMk4igWTHzebJW_W4p1C1j_Yc4ahbiaUefJKhFFoFAFHF-g2U7Y4GJvmOE5g6wQuIBVCJV3DwSIpfletAmpNJRqbcEkAMAlz5hnwJTG9ex7y-0JgvAwoQBVEXlFuRukoP21V7oe2hTgkozsH40aTlxN4kN_jPLtLNpxE5eB8-9jQyaAXqlRO9w-bsj5Dc3lBRHXjO40CH9CF9WzE00',
            lastMessage: "We'd like to schedule a follow-up call for Wednesday at 10 AM.",
            lastMessageTime: 'Tuesday',
            unreadCount: 0,
          },
        ];
      }
      setConversations(convs);
      setFilteredConversations(convs);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = conversations.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.lastMessage.toLowerCase().includes(query) ||
        (c.jobTitle && c.jobTitle.toLowerCase().includes(query))
      );
      setFilteredConversations(filtered);
    }
  }, [searchQuery, conversations]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const getStatusBadge = (item: Conversation) => {
    // Replicating custom context badges from the Stitch mockup
    if (item.name === 'Elena Rodriguez') {
      return (
        <View style={[styles.badgeContainer, { backgroundColor: '#d1fae5' }]}>
          <Text style={[styles.badgeText, { color: '#065f46' }]}>Paid</Text>
        </View>
      );
    } else if (item.name === 'David Sterling') {
      return (
        <View style={[styles.badgeContainer, { backgroundColor: '#dbeafe' }]}>
          <Text style={[styles.badgeText, { color: '#1e40af' }]}>Interviewing</Text>
        </View>
      );
    }
    return null;
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const isUnread = item.unreadCount > 0;
    const isOnline = item.name === 'Sarah Jenkins' || item.name === 'Michael Chen';

    return (
      <TouchableOpacity
        style={[
          styles.chatRow,
          isUnread && styles.unreadChatRow,
        ]}
        onPress={() =>
          navigation.navigate('ChatDetail', {
            jobId: item.jobId,
            otherUserId: item.otherUserId,
            otherUserName: item.name,
          })
        }
      >
        {/* Avatar with Online indicator */}
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatarBorder, isUnread ? styles.unreadAvatarBorder : styles.readAvatarBorder]}>
            <Image source={{ uri: item.profilePic || 'https://via.placeholder.com/150' }} style={styles.avatar} />
          </View>
          {isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Message Info */}
        <View style={styles.chatDetails}>
          <View style={styles.chatHeaderRow}>
            <View style={styles.nameBadgeRow}>
              <Text style={[styles.clientName, isUnread && styles.unreadClientName]} numberOfLines={1}>
                {item.name}
              </Text>
              {getStatusBadge(item)}
            </View>
            <Text style={[styles.messageTime, isUnread && styles.unreadMessageTime]}>
              {item.lastMessageTime}
            </Text>
          </View>

          <Text style={styles.jobTitle} numberOfLines={1}>
            📌 {item.jobTitle || 'General Discussion'}
          </Text>

          <Text style={[styles.lastMessage, isUnread && styles.unreadMessageText]} numberOfLines={2}>
            {item.lastMessage || 'No messages yet...'}
          </Text>
        </View>

        {/* Unread count badge */}
        {isUnread && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.openDrawer && navigation.openDrawer()}>
            <Feather name="menu" size={24} color="#10b981" style={styles.menuIcon} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerIconButton} onPress={() => Alert.alert('Chat Help', 'Search and select any active message thread to communicate with clients.')}>
            <Feather name="info" size={20} color="#10b981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inline Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#7a7582" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor="#7a7582"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#10b981" />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          renderItem={renderConversationItem}
          keyExtractor={(item, index) => `${item.jobId}_${item.otherUserId}_${index}`}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="message-square" size={32} color="#10b981" />
              </View>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation with clients to get the collaboration going.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => navigation.navigate('Discover')}
        activeOpacity={0.8}
      >
        <Feather name="message-square" size={22} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdf7ff', // Stitch surface background
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e0e9',
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#10b981',
    fontFamily: 'Inter',
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerIconButton: {
    padding: 8,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2ecf4', // Stitch surface-container
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1d1b20',
    fontFamily: 'Inter',
    paddingVertical: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 80,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fdf7ff',
    borderBottomWidth: 1,
    borderColor: '#f2ecf4',
  },
  unreadChatRow: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981', // Emerald left highlight for unread
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarBorder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    padding: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadAvatarBorder: {
    borderColor: '#cfbcff',
  },
  readAvatarBorder: {
    borderColor: '#e6e0e9',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 27,
    backgroundColor: '#f2ecf4',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981', // green online dot
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  chatDetails: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.75,
  },
  clientName: {
    fontSize: 16,
    color: '#1d1b20',
    fontFamily: 'Inter',
    fontWeight: '500',
  },
  unreadClientName: {
    fontWeight: '700',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    marginLeft: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  messageTime: {
    fontSize: 12,
    color: '#7a7582',
    fontFamily: 'Inter',
  },
  unreadMessageTime: {
    color: '#10b981',
    fontWeight: '600',
  },
  jobTitle: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  lastMessage: {
    fontSize: 14,
    color: '#494551',
    lineHeight: 18,
    fontFamily: 'Inter',
  },
  unreadMessageText: {
    color: '#1d1b20',
    fontWeight: '600',
  },
  unreadBadge: {
    backgroundColor: '#10b981',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e6e0e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7a7582',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
