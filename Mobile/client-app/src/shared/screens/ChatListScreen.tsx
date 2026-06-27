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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api, { getApiData } from '../../services/api';
import { useTheme } from '../theme/theme';

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
  const { colors } = useTheme();
  const { user, isAuthenticated } = useSelector((s: any) => s.auth);

  

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text) {
      setFilteredConversations(conversations);
      return;
    }
    const filtered = conversations.filter(
      (c) =>
        c.name.toLowerCase().includes(text.toLowerCase()) ||
        c.jobTitle.toLowerCase().includes(text.toLowerCase()) ||
        c.lastMessage.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredConversations(filtered);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search contact or job..."
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearBtn}>
              <Feather name="x" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => `${item.jobId}-${item.otherUserId}`}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.accent }]}>
                <Feather name="message-square" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Conversations</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                You have no active message threads at the moment.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const hasUnread = item.unreadCount > 0;
            const initials = item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
            return (
              <TouchableOpacity
                style={[
                  styles.threadRow,
                  { borderBottomColor: colors.border, backgroundColor: colors.card },
                  hasUnread && { borderLeftColor: colors.primary, borderLeftWidth: 3 },
                ]}
                onPress={() =>
                  navigation.navigate('ChatDetail', {
                    jobId: item.jobId,
                    otherUserId: item.otherUserId,
                    otherUserName: item.name,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  {item.profilePic ? (
                    <Image source={{ uri: item.profilePic }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatarFallback, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
                    </View>
                  )}
                  {/* Status Indicator mockup ring */}
                  <View style={[styles.statusRing, { backgroundColor: colors.success }]} />
                </View>

                <View style={styles.threadDetails}>
                  <View style={styles.rowHeader}>
                    <Text style={[styles.nameText, { color: colors.text }, hasUnread && styles.unreadText]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={[styles.timeText, { color: colors.textMuted }]}>
                      {item.lastMessageTime}
                    </Text>
                  </View>

                  <Text style={[styles.jobText, { color: colors.primary }]} numberOfLines={1}>
                    {item.jobTitle}
                  </Text>

                  <Text style={[styles.messageSnippet, { color: colors.textMuted }, hasUnread && styles.unreadSnippet]} numberOfLines={1}>
                    {item.lastMessage}
                  </Text>
                </View>

                {hasUnread && (
                  <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
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
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  searchContainer: {
    padding: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 2,
  },
  clearBtn: {
    padding: 2,
  },
  loaderWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  threadRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 15,
    fontWeight: '700',
  },
  statusRing: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  threadDetails: {
    flex: 1,
    marginRight: 8,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
  },
  jobText: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  messageSnippet: {
    fontSize: 13,
  },
  unreadSnippet: {
    fontWeight: '600',
    color: '#000000',
  },
  unreadBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  emptyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
