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
  Switch,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api, { getApiData } from '../../services/api';
import { useSelector } from 'react-redux';
import { useTheme } from '../theme/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationScreen({ navigation }: { navigation: any }) {
  const { colors, isClient } = useTheme();
  const isAuthenticated = useSelector((s: any) => s.auth.isAuthenticated);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Notification Preferences States
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('push_notifications_enabled').then((val) => {
      if (val !== null) setPushEnabled(val === 'true');
    });
    AsyncStorage.getItem('email_notifications_enabled').then((val) => {
      if (val !== null) setEmailEnabled(val === 'true');
    });
    AsyncStorage.getItem('sms_alerts_enabled').then((val) => {
      if (val !== null) setSmsEnabled(val === 'true');
    });
  }, []);

  const togglePush = async (val: boolean) => {
    setPushEnabled(val);
    await AsyncStorage.setItem('push_notifications_enabled', String(val));
  };
  const toggleEmail = async (val: boolean) => {
    setEmailEnabled(val);
    await AsyncStorage.setItem('email_notifications_enabled', String(val));
  };
  const toggleSms = async (val: boolean) => {
    setSmsEnabled(val);
    await AsyncStorage.setItem('sms_alerts_enabled', String(val));
  };

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
    
    // Route navigation
    if (n.onModel === 'Job' && n.relatedId) {
      navigation.navigate('Home');
    } else if (n.onModel === 'Message') {
      navigation.navigate('Chat');
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.gateRoot, { backgroundColor: colors.bg }]}>
        <View style={styles.gateContent}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary }]}>
            <Feather name="bell" size={32} color={colors.white} />
          </View>
          <Text style={[styles.gateTitle, { color: colors.text }]}>Login to see notifications</Text>
          <Text style={[styles.gateSub, { color: colors.textMuted }]}>
            Sign in to view real-time updates, chat messages, and job applications.
          </Text>
          <TouchableOpacity
            style={[styles.gateBtn, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={[styles.gateBtnTxt, { color: colors.white }]}>Go to Profile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={[styles.prefCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.prefHeader, { color: isClient ? '#581c87' : colors.primary }]}>
        NOTIFICATION PREFERENCES
      </Text>
      <View style={styles.prefDivider} />
      
      {/* Row 1: Push Notifications */}
      <View style={styles.prefRow}>
        <View style={styles.prefRowLeft}>
          <View style={[styles.prefIconBox, { backgroundColor: colors.grayLight }]}>
            <Feather name="bell" size={18} color={colors.textMuted} />
          </View>
          <View style={styles.prefTextContainer}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>Push Notifications</Text>
            <Text style={[styles.prefSub, { color: colors.textMuted }]}>Jobs and direct messages</Text>
          </View>
        </View>
        <Switch
          value={pushEnabled}
          onValueChange={togglePush}
          trackColor={{ false: '#cbd5e1', true: isClient ? '#6366f1' : colors.primary }}
          thumbColor="#ffffff"
          ios_backgroundColor="#cbd5e1"
        />
      </View>

      {/* Row 2: Email Notifications */}
      <View style={styles.prefRow}>
        <View style={styles.prefRowLeft}>
          <View style={[styles.prefIconBox, { backgroundColor: colors.grayLight }]}>
            <Feather name="mail" size={18} color={colors.textMuted} />
          </View>
          <View style={styles.prefTextContainer}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>Email Notifications</Text>
            <Text style={[styles.prefSub, { color: colors.textMuted }]}>Weekly summaries and reports</Text>
          </View>
        </View>
        <Switch
          value={emailEnabled}
          onValueChange={toggleEmail}
          trackColor={{ false: '#cbd5e1', true: isClient ? '#6366f1' : colors.primary }}
          thumbColor="#ffffff"
          ios_backgroundColor="#cbd5e1"
        />
      </View>

      {/* Row 3: SMS Alerts */}
      <View style={[styles.prefRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
        <View style={styles.prefRowLeft}>
          <View style={[styles.prefIconBox, { backgroundColor: colors.grayLight }]}>
            <Feather name="message-square" size={18} color={colors.textMuted} />
          </View>
          <View style={styles.prefTextContainer}>
            <Text style={[styles.prefTitle, { color: colors.text }]}>SMS Alerts</Text>
            <Text style={[styles.prefSub, { color: colors.textMuted }]}>Urgent account updates only</Text>
          </View>
        </View>
        <Switch
          value={smsEnabled}
          onValueChange={toggleSms}
          trackColor={{ false: '#cbd5e1', true: isClient ? '#6366f1' : colors.primary }}
          thumbColor="#ffffff"
          ios_backgroundColor="#cbd5e1"
        />
      </View>
    </View>
  );

  const canGoBack = navigation.canGoBack && navigation.canGoBack();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {canGoBack && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 12 }}>
              <Feather name="chevron-left" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={[styles.headerTitle, { color: colors.text }]}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary, marginLeft: 8 }]}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
          <Text style={[styles.markAllText, { color: colors.primary }]}>Read All</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id || item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrapper}>
              <View style={[styles.emptyIconBox, { backgroundColor: colors.accent }]}>
                <Feather name="bell-off" size={40} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>All Caught Up!</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                You have no new notifications at the moment.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isUnread = !(item.isRead || item.read);
            return (
              <TouchableOpacity
                style={[
                  styles.notificationRow,
                  { borderBottomColor: colors.border },
                  isUnread && { backgroundColor: colors.accent },
                ]}
                onPress={() => handleNotificationClick(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.typeIconBox, { backgroundColor: isUnread ? colors.white : colors.grayLight }]}>
                  <Feather
                    name={item.type === 'message' ? 'message-circle' : 'briefcase'}
                    size={16}
                    color={colors.primary}
                  />
                </View>
                <View style={styles.textDetails}>
                  <Text style={[styles.rowTitle, { color: colors.text }, isUnread && styles.unreadFont]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.rowBody, { color: colors.textMuted }]}>{item.message}</Text>
                  <Text style={[styles.rowTime, { color: colors.textMuted }]}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                {isUnread && (
                  <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
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
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  unreadBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  markAllBtn: {
    padding: 6,
    marginLeft: 'auto',
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '700',
  },
  loadingWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  typeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  textDetails: {
    flex: 1,
    marginRight: 8,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  unreadFont: {
    fontWeight: '800',
  },
  rowBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  rowTime: {
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  gateRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gateContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  gateTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  gateSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  gateBtn: {
    paddingHorizontal: 24,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gateBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
  },
  prefCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  prefHeader: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  prefDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 8,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  prefRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  prefIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prefTextContainer: {
    flex: 1,
  },
  prefTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  prefSub: {
    fontSize: 12,
    marginTop: 2,
  },
});
