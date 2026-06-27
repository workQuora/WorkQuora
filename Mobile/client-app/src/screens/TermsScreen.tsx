import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loginUserSession } from '../store/authSlice';
import { Feather } from '@expo/vector-icons';

interface TermsScreenProps {
  route: any;
  navigation: any;
}

export default function TermsScreen({ route, navigation }: TermsScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = route.params || {};
  const [agreed, setAgreed] = useState(false);

  const requestPermissionsAndLogin = () => {
    if (Platform.OS === 'web') {
      const cam = window.confirm('Allow Camera Access?\n\nWorkQuora requires camera permission to take profile photos and capture KYC documents.');
      const notify = window.confirm('Allow Notification Access?\n\nWorkQuora requires notification permission to alert you when workers apply to your jobs.');
      completeRegistrationFlow(cam, notify);
    } else {
      Alert.alert(
        'Camera Access Required',
        'WorkQuora requires camera permission to take profile photos and capture KYC documents.',
        [
          {
            text: "Don't Allow",
            onPress: () => requestNotificationAccess(false),
            style: 'cancel',
          },
          {
            text: 'Allow',
            onPress: () => requestNotificationAccess(true),
          },
        ]
      );
    }
  };

  const requestNotificationAccess = (cameraAllowed: boolean) => {
    Alert.alert(
      'Notification Access Required',
      'WorkQuora requires notification permission to alert you when workers apply to your jobs or send you messages.',
      [
        {
          text: "Don't Allow",
          onPress: () => completeRegistrationFlow(cameraAllowed, false),
          style: 'cancel',
        },
        {
          text: 'Allow',
          onPress: () => completeRegistrationFlow(cameraAllowed, true),
        },
      ]
    );
  };

  const completeRegistrationFlow = async (camera: boolean, notify: boolean) => {
    console.log(`Permissions status - Camera: ${camera}, Notifications: ${notify}`);
    if (Platform.OS !== 'web') {
      Alert.alert(
        'Account Ready',
        'Thank you! Your terms agreement and permission configurations have been completed.'
      );
    }
    
    if (user && token) {
      await dispatch(loginUserSession({ user, token }));
      const parentNav = navigation.getParent();
      if (parentNav) {
        parentNav.navigate('MainApp');
      } else {
        navigation.navigate('MainApp');
      }
    } else {
      navigation.navigate('Login');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#1e3a8a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>1. Welcome to WorkQuora</Text>
          <Text style={styles.paragraph}>
            By registering an account with WorkQuora, you agree to comply with and be bound by the following terms and conditions. If you disagree with any part of these terms, please do not proceed.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>2. Escrow & Payments</Text>
          <Text style={styles.paragraph}>
            As a client, you agree to deposit job payments into the secure Escrow wallet upon hiring a worker. The funds will be securely held and released only when the worker completes the task and you verify the work.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>3. Location Services</Text>
          <Text style={styles.paragraph}>
            WorkQuora utilizes your geographic location to match you with nearby gig workers. By agreeing, you authorize WorkQuora to request location data to display job listings and active workers accurately.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>4. User Code of Conduct</Text>
          <Text style={styles.paragraph}>
            All users must interact respectfully. Harassment, payment evasion, fraud, or spamming will result in immediate permanent suspension from the platform.
          </Text>
        </View>
      </ScrollView>

      {/* Agree Tick Box & Footer button */}
      <View style={styles.agreeContainer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, agreed && styles.checkboxSelected]}>
            {agreed && <Feather name="check" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkboxLabel}>
            I agree to all Terms and Conditions.{'\n'}
            मैं सभी नियमों और शर्तों से सहमत हूँ।
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, !agreed && styles.btnDisabled]}
          disabled={!agreed}
          onPress={requestPermissionsAndLogin}
        >
          <View style={styles.buttonContent}>
            <Text style={styles.btnText}>Agree & Continue</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    textAlign: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#cbd5e1',
    marginVertical: 20,
  },
  agreeContainer: {
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#1e3a8a',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#1e3a8a',
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  btn: {
    height: 56,
    backgroundColor: '#1e3a8a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  btnDisabled: {
    backgroundColor: '#93c5fd',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
