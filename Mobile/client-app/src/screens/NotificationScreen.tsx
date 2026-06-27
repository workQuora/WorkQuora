import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api, { getApiData } from '../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

export default function NotificationScreen({ navigation }: { navigation: any }) {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/notifications');
      const data = getApiData(response);
      setNotifications(data?.notifications || data || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (error) {
      console.error('Fetch notifications error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
      Alert.alert('Success', 'All notifications marked as read.');
    } catch (error) {
      console.error('Mark all notifications error:', error);
    }
  };

  const handleNotificationClick = async (n: any) => {
    const isUnread = !(n.isRead || n.read);
    if (isUnread) {
      try {
        await api.put(`/notifications/${n._id || n.id}/read`);
        fetchNotifications();
      } catch (error) {
        console.error('Mark one notification read error:', error);
      }
    }
    
    // Navigate based on metadata model
    if (n.onModel === 'Job' && n.relatedId) {
      navigation.navigate('Home');
    } else if (n.onModel === 'Message') {
      navigation.navigate('Chat');
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.gateRoot}>
        <View style={styles.gateContent}>
          <View style={styles.iconCircle}>
            <Feather name="bell" size={32} color="#fff" />
          </View>
          <Text style={styles.gateTitle}>Login to see notifications</Text>
          <Text style={styles.gateSub}>
            Sign in to view real-time updates, chat messages, and job applications.
          </Text>
          <TouchableOpacity
            style={styles.gateBtn}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={styles.gateBtnTxt}>Go to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const isUnread = !(item.isRead || item.read);
    return (
      <TouchableOpacity
        style={[styles.itemRow, isUnread && styles.itemRowUnread]}
        onPress={() => handleNotificationClick(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.avatarBox, isUnread && styles.avatarBoxUnread]}>
          <Feather name="bell" size={16} color={isUnread ? '#4f46e5' : '#6366f1'} />
        </View>
        <View style={styles.itemMeta}>
          <Text style={[styles.itemText, isUnread && styles.itemTextUnread]}>
            {item.message || item.text}
          </Text>
          <Text style={styles.itemTime}>{formatDate(item.createdAt)}</Text>
        </View>
        {isUnread && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Feather name="check-square" size={14} color="#4f46e5" />
            <Text style={styles.markAllBtnTxt}> Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4f46e5']} />
          }
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <View style={styles.emptyCircle}>
                <Feather name="bell-off" size={32} color="#dbdbdb" />
              </View>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptySub}>No notifications found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7ff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e7ff',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  markAllBtnTxt: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4f46e5',
  },
  listContainer: {
    paddingBottom: 20,
  },
  loaderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e7ff',
  },
  itemRowUnread: {
    backgroundColor: '#f8f7ff',
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarBoxUnread: {
    backgroundColor: '#e0e7ff',
  },
  itemMeta: {
    flex: 1,
    marginRight: 8,
  },
  itemText: {
    fontSize: 13,
    color: '#6366f1',
    lineHeight: 18,
  },
  itemTextUnread: {
    color: '#1d1b20',
    fontWeight: '600',
  },
  itemTime: {
    fontSize: 10,
    color: '#6366f1',
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4f46e5',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  emptySub: {
    fontSize: 13,
    color: '#6366f1',
    marginTop: 6,
    textAlign: 'center',
  },
  gateRoot: {
    flex: 1,
    backgroundColor: '#f8f7ff',
  },
  gateContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1e1b4b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  gateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b4b',
    marginBottom: 8,
  },
  gateSub: {
    fontSize: 13,
    color: '#6366f1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  gateBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  gateBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
