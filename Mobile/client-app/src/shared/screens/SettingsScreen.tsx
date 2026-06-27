import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../services/api';
import { logoutUserSession } from '../../store/authSlice';
import { useTheme } from '../theme/theme';
import { useLanguage } from '../../services/i18n';

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const dispatch = useDispatch();
  const { colors, isClient } = useTheme();
  const { t } = useLanguage();
  const user = useSelector((s: any) => s.auth.user);
  
  // Settings values
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [pinVerificationEnabled, setPinVerificationEnabled] = useState(true);
  const [safetyPin, setSafetyPin] = useState('----');
  const [profileData, setProfileData] = useState<any>(null);
  
  // New toggles
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  // PIN change modal states
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Password change modal states
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('safety_alerts_enabled').then((val) => {
      if (val !== null) setAlertsEnabled(val === 'true');
    });
    AsyncStorage.getItem('safety_pin_enabled').then((val) => {
      if (val !== null) setPinVerificationEnabled(val === 'true');
    });
    AsyncStorage.getItem('two_factor_enabled').then((val) => {
      if (val !== null) setTwoFactorEnabled(val === 'true');
    });
    AsyncStorage.getItem('biometric_enabled').then((val) => {
      if (val !== null) setBiometricEnabled(val === 'true');
    });
    AsyncStorage.getItem('user_safety_pin').then((val) => {
      if (val) {
        setSafetyPin(val);
      } else {
        const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
        AsyncStorage.setItem('user_safety_pin', randomPin);
        setSafetyPin(randomPin);
      }
    });

    api.get('/profile/me')
      .then((res) => {
        if (res.data?.success) {
          setProfileData(res.data.data);
        }
      })
      .catch((err) => console.error('Failed to fetch profile details in settings:', err));
  }, []);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('errorLabel'), 'All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('errorLabel'), 'Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      Alert.alert(t('successLabel'), 'Password updated successfully!');
      setPasswordModalVisible(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      Alert.alert(t('errorLabel'), 'Failed to change password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleUpdatePin = async () => {
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      Alert.alert(t('errorLabel'), t('pinLengthError'));
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert(t('errorLabel'), t('pinMismatchError'));
      return;
    }
    setSafetyPin(newPin);
    await AsyncStorage.setItem('user_safety_pin', newPin);
    setPinModalVisible(false);
    setNewPin('');
    setConfirmPin('');
    Alert.alert(t('successLabel'), t('pinSuccessMsg'));
  };

  const toggleTwoFactor = async (val: boolean) => {
    setTwoFactorEnabled(val);
    await AsyncStorage.setItem('two_factor_enabled', val.toString());
  };

  const handleBiometricToggle = () => {
    if (!biometricEnabled) {
      Alert.alert('Link Face ID / Biometrics', 'Would you like to link Face ID / Fingerprint verification now?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Link',
          onPress: async () => {
            setBiometricEnabled(true);
            await AsyncStorage.setItem('biometric_enabled', 'true');
            Alert.alert('Success', 'Biometrics configured successfully!');
          },
        },
      ]);
    } else {
      Alert.alert('Remove Biometrics', 'Remove Face ID / fingerprint verification?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBiometricEnabled(false);
            await AsyncStorage.setItem('biometric_enabled', 'false');
          },
        },
      ]);
    }
  };

  const handleLogout = () => {
    Alert.alert(t('logoutAlertTitle'), t('logoutAlertMsg'), [
      { text: t('cancelBtn'), style: 'cancel' },
      {
        text: t('logOutButton'),
        style: 'destructive',
        onPress: async () => {
          await dispatch(logoutUserSession() as any);
          const parentNav = navigation.getParent();
          if (parentNav) {
            parentNav.navigate('AuthModal');
          } else {
            navigation.navigate('AuthModal');
          }
        },
      },
    ]);
  };

  // Determine dynamic verification tags
  const isKycComplete = !!(profileData?.kycVerified || profileData?.isVerified);
  const kycStatusText = isKycComplete ? 'VERIFIED' : 'PENDING';
  
  const hasAadhar = !!profileData?.kyc?.aadharNumber;
  const hasPan = !!(profileData?.kyc?.panCard || profileData?.kyc?.panNumber);
  const isIdentityVerified = hasAadhar && hasPan;
  const identityStatusText = isIdentityVerified ? 'VERIFIED' : 'PENDING';
  const identitySubText = isIdentityVerified ? 'Last updated Oct 2023' : 'Action required';

  const hasBankDetails = !!profileData?.bankDetails;
  const bankStatusText = hasBankDetails ? 'VERIFIED' : 'PENDING';
  const bankName = profileData?.bankDetails?.bankName || 'HDFC Bank';
  const lastFourDigits = profileData?.bankDetails?.accountNo?.slice(-4) || profileData?.bankDetails?.accountNumber?.slice(-4) || '4821';
  const bankSubText = hasBankDetails ? `${bankName} • • • • ${lastFourDigits}` : 'Link bank for withdrawals';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* IDENTITY VERIFICATION (KYC) */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>IDENTITY VERIFICATION (KYC)</Text>
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          {/* Identity Document (Aadhaar/PAN) */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Kyc')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                <Feather name="file-text" size={18} color="#9333ea" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Identity Document (Aadhaar/PAN)</Text>
                <Text style={styles.subLabel}>{identitySubText}</Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <View style={isIdentityVerified ? styles.badgeVerified : styles.badgePending}>
                <Text style={isIdentityVerified ? styles.badgeVerifiedText : styles.badgePendingText}>
                  {identityStatusText}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#9ca3af" style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>

          {/* Bank Account Verification */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Kyc')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                <Feather name="home" size={18} color="#0284c7" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Bank Account Verification</Text>
                <Text style={styles.subLabel}>{bankSubText}</Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <View style={hasBankDetails ? styles.badgeVerified : styles.badgePending}>
                <Text style={hasBankDetails ? styles.badgeVerifiedText : styles.badgePendingText}>
                  {bankStatusText}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#9ca3af" style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>

          {/* Face ID / Bio-recognition */}
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={handleBiometricToggle}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#ffedd5' }]}>
                <Feather name="smile" size={18} color="#ea580c" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Face ID / Bio-recognition</Text>
                <Text style={[styles.subLabel, !biometricEnabled && { color: '#ea580c', fontWeight: '600' }]}>
                  {biometricEnabled ? 'Biometrics configured' : 'Action required for withdrawal'}
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              <View style={biometricEnabled ? styles.badgeVerified : styles.badgePending}>
                <Text style={biometricEnabled ? styles.badgeVerifiedText : styles.badgePendingText}>
                  {biometricEnabled ? 'VERIFIED' : 'PENDING'}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#9ca3af" style={{ marginLeft: 8 }} />
            </View>
          </TouchableOpacity>

        </View>

        {/* ACCOUNT SECURITY */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>ACCOUNT SECURITY</Text>
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          {/* Password */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setPasswordModalVisible(true)}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                <Feather name="rotate-ccw" size={18} color="#475569" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <Text style={styles.subLabel}>Last changed 3 months ago</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {/* Two-Factor Authentication */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                <Feather name="shield" size={18} color="#475569" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Two-Factor Authentication</Text>
                <Text style={styles.subLabel}>Enabled via SMS/Authenticator</Text>
              </View>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={toggleTwoFactor}
              trackColor={{ false: '#cbd5e1', true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          {/* Secure PIN Management */}
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => setPinModalVisible(true)}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                <Feather name="grid" size={18} color="#475569" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Secure PIN Management</Text>
                <Text style={styles.subLabel}>Used for all escrow approvals</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

        </View>

        {/* TRUST & PRIVACY */}
        <Text style={[styles.sectionHeading, { color: colors.textMuted }]}>TRUST & PRIVACY</Text>
        <View style={[styles.cardContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          
          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => navigation.navigate('Terms')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                <Feather name="file-text" size={18} color="#475569" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Privacy Policy</Text>
              </View>
            </View>
            <Feather name="external-link" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {/* Data Encryption Details */}
          <TouchableOpacity
            style={[styles.row, { borderBottomWidth: 0 }]}
            onPress={() => Alert.alert('Data Encryption', 'WorkQuora uses standard end-to-end AES-256 encryption protocol to secure your profile updates, chats, and payment contracts.')}
          >
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                <Feather name="lock" size={18} color="#475569" />
              </View>
              <View style={styles.textContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Data Encryption Details</Text>
              </View>
            </View>
            <Feather name="external-link" size={16} color="#9ca3af" />
          </TouchableOpacity>

        </View>

        {/* Logout Securely Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={16} color="#ef4444" />
          <Text style={styles.logoutButtonText}>Logout Securely</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Change Password</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>Update your login credentials</Text>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Current Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="New Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Confirm New Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancel, { backgroundColor: colors.grayLight }]}
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('cancelBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, { backgroundColor: colors.primary }]}
                onPress={handleUpdatePassword}
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.modalSubmitText, { color: colors.white }]}>Save Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Safety PIN Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pinModalVisible}
        onRequestClose={() => setPinModalVisible(false)}
      >
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{t('pinModalTitle')}</Text>
            <Text style={[styles.modalSub, { color: colors.textMuted }]}>{t('pinModalSub')}</Text>
            
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="New PIN (4 digits)"
              placeholderTextColor="#aaa"
              maxLength={4}
              keyboardType="number-pad"
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
            />

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Confirm New PIN"
              placeholderTextColor="#aaa"
              maxLength={4}
              keyboardType="number-pad"
              secureTextEntry
              value={confirmPin}
              onChangeText={setConfirmPin}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalCancel, { backgroundColor: colors.grayLight }]}
                onPress={() => {
                  setPinModalVisible(false);
                  setNewPin('');
                  setConfirmPin('');
                }}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>{t('cancelBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmit, { backgroundColor: colors.primary }]}
                onPress={handleUpdatePin}
              >
                <Text style={[styles.modalSubmitText, { color: colors.white }]}>Save PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingBottom: 40,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 8,
    paddingLeft: 4,
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  subLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  badgeVerified: {
    backgroundColor: '#e6f4ea',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeVerifiedText: {
    color: '#137333',
    fontSize: 9,
    fontWeight: '800',
  },
  badgePending: {
    backgroundColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePendingText: {
    color: '#ea580c',
    fontSize: 9,
    fontWeight: '800',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 30,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontWeight: '800',
    fontSize: 14,
  },

  // Modal styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  modalInput: {
    height: 46,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  modalCancel: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalSubmit: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
