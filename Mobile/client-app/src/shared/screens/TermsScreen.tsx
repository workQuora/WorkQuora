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
import { AppDispatch } from '../../store';
import { loginUserSession } from '../../store/authSlice';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

interface TermsScreenProps {
  route: any;
  navigation: any;
}

export default function TermsScreen({ route, navigation }: TermsScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { colors, isClient } = useTheme();
  const { user, token } = route.params || {};
  const [agreed, setAgreed] = useState(false);

  const requestPermissionsAndLogin = () => {
    if (Platform.OS === 'web') {
      const cam = window.confirm('Allow Camera Access?\n\nWorkQuora requires camera permission to take profile photos and capture KYC documents.');
      const notify = window.confirm('Allow Notification Access?\n\nWorkQuora requires notification permission to alert you when tasks update.');
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
      'WorkQuora requires notification permission to alert you when you receive messages or when gigs are booked.',
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Terms of Service</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.termsTitle, { color: colors.primary }]}>WorkQuora Terms & Conditions</Text>
          <Text style={[styles.termsSubtitle, { color: colors.textMuted }]}>
            Last updated: June 2026
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.text }]}>1. User Obligations</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Users must provide accurate information when registering. Standard checks are run on profiles to guarantee marketplace safety and prevent duplicate user identity registrations.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.text }]}>2. KYC Verification</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            To keep the marketplace secure, all service providers (Workers) and hiring Clients must verify their identities using valid government identifiers (Aadhaar, PAN). Verification details are encrypted.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.text }]}>3. Escrow Payments</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            WorkQuora operates an escrow payment service. Clients fund tasks before they start, and funds are securely held in escrow. Payouts are released directly to the worker's bank details once the client verifies checking-in and work completion.
          </Text>

          <Text style={[styles.sectionHeading, { color: colors.text }]}>4. Safety PIN System</Text>
          <Text style={[styles.paragraph, { color: colors.textMuted }]}>
            Every task has a safety 4-digit verification PIN. The Worker must request and submit this safety PIN upon arriving at the job location to check-in and start the session timing track.
          </Text>
        </View>

        {/* Checkbox */}
        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.checkbox,
            { borderColor: colors.primary },
            agreed && { backgroundColor: colors.primary }
          ]}>
            {agreed && <Feather name="check" size={14} color={colors.white} />}
          </View>
          <Text style={[styles.checkboxText, { color: colors.text }]}>
            I read and agree to all terms, permissions, and security conditions.
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: agreed ? colors.primary : colors.grayMedium },
          ]}
          disabled={!agreed}
          onPress={requestPermissionsAndLogin}
        >
          <Text style={[styles.submitButtonText, { color: colors.white }]}>
            AGREE & CONTINUE →
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  termsTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  termsSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  submitButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
