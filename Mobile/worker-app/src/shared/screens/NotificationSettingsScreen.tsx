import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/theme';

export default function NotificationSettingsScreen({ navigation }: { navigation: any }) {
  const { colors, isClient } = useTheme();

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notification Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={[styles.prefCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.prefHeader, { color: isClient ? '#581c87' : colors.primary }]}>
            NOTIFICATION PREFERENCES
          </Text>
          <View style={styles.prefDivider} />
          
          {/* Row 1: Push Notifications */}
          <View style={styles.prefRow}>
            <View style={styles.prefRowLeft}>
              <View style={[styles.prefIconBox, { backgroundColor: '#f1f5f9' }]}>
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
              <View style={[styles.prefIconBox, { backgroundColor: '#f1f5f9' }]}>
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
              <View style={[styles.prefIconBox, { backgroundColor: '#f1f5f9' }]}>
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
      </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scroll: {
    padding: 16,
  },
  prefCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  prefHeader: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  prefDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 12,
  },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  prefTextContainer: {
    flex: 1,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  prefSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
});
