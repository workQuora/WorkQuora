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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { getApiData } from '../services/api';

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const { user } = useSelector((s: RootState) => s.auth);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [pinVerificationEnabled, setPinVerificationEnabled] = useState(true);
  const [safetyPin, setSafetyPin] = useState('----');
  const [profileData, setProfileData] = useState<any>(null);
  
  // Modal for changing PIN
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Mobile Verification States
  const [mobileOtpModalVisible, setMobileOtpModalVisible] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
  const [isVerifyingMobile, setIsVerifyingMobile] = useState(false);
  const dispatch = useDispatch();

  // Load saved settings & profile details
  useEffect(() => {
    AsyncStorage.getItem('safety_alerts_enabled').then((val) => {
      if (val !== null) setAlertsEnabled(val === 'true');
    });
    AsyncStorage.getItem('safety_pin_enabled').then((val) => {
      if (val !== null) setPinVerificationEnabled(val === 'true');
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

  const toggleAlerts = async (val: boolean) => {
    setAlertsEnabled(val);
    await AsyncStorage.setItem('safety_alerts_enabled', val.toString());
  };

  const togglePinVerification = async (val: boolean) => {
    setPinVerificationEnabled(val);
    await AsyncStorage.setItem('safety_pin_enabled', val.toString());
  };

  const handleUpdatePin = async () => {
    if (newPin.length !== 4 || isNaN(Number(newPin))) {
      Alert.alert('Error', 'PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match.');
      return;
    }
    setSafetyPin(newPin);
    await AsyncStorage.setItem('user_safety_pin', newPin);
    setPinModalVisible(false);
    setNewPin('');
    setConfirmPin('');
    Alert.alert('Success', 'Safety verification PIN updated successfully!');
  };

  const handleSendMobileOtp = async () => {
    try {
      setIsSendingMobileOtp(true);
      await api.post('/auth/send-mobile-otp', { email: user?.email });
      setMobileOtpModalVisible(true);
      Alert.alert('OTP Sent', 'Mobile OTP sent via SMS.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send OTP.');
    } finally {
      setIsSendingMobileOtp(false);
    }
  };

  const handleVerifyMobile = async () => {
    if (!mobileOtp) return Alert.alert('Error', 'Enter OTP');
    try {
      setIsVerifyingMobile(true);
      await api.post('/auth/verify-mobile', { email: user?.email, otp: mobileOtp });
      Alert.alert('Success', 'Mobile Verified Successfully!');
      setMobileOtpModalVisible(false);
      // Update store
      dispatch({ type: 'auth/updateUser', payload: { ...user, isMobileVerified: true } });
      api.get('/profile/me').then(res => setProfileData(res.data?.data));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsVerifyingMobile(false);
    }
  };

  // Determine dynamic verification tags
  const kycStatus = profileData?.kyc?.status || (profileData?.kycVerified ? 'verified' : 'Not Linked');
  const isAadharVerified = profileData?.kyc?.aadharVerified || profileData?.kycVerified;
  const isPanVerified = profileData?.kyc?.panVerified || profileData?.kycVerified;
  const hasBankDetails = !!profileData?.bankDetails;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety hub</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Safety tools</Text>

        {/* Safety Preferences / Alerts */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="shield" size={18} color="#000" />
              </View>
              <View style={styles.metaContainer}>
                <Text style={styles.rowTitle}>RideCheck Notifications</Text>
                <Text style={styles.rowSub}>
                  Send alerts if a gig or worker is delayed or does not progress as planned.
                </Text>
              </View>
            </View>
            <Switch
              value={alertsEnabled}
              onValueChange={toggleAlerts}
              trackColor={{ false: '#767577', true: '#4f46e5' }}
              thumbColor={alertsEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* PIN Verification toggle */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="grid" size={18} color="#000" />
              </View>
              <View style={styles.metaContainer}>
                <Text style={styles.rowTitle}>PIN verification</Text>
                <Text style={styles.rowSub}>
                  Use a PIN to verify the right worker is coming to your job site.
                </Text>
              </View>
            </View>
            <Switch
              value={pinVerificationEnabled}
              onValueChange={togglePinVerification}
              trackColor={{ false: '#767577', true: '#4f46e5' }}
              thumbColor={pinVerificationEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {pinVerificationEnabled && (
            <View style={styles.pinDisplayContainer}>
              <Text style={styles.pinLabel}>Your Verification PIN</Text>
              <View style={styles.pinRow}>
                <Text style={styles.pinValue}>
                  {safetyPin.split('').join(' ')}
                </Text>
                <TouchableOpacity
                  style={styles.changePinBtn}
                  onPress={() => setPinModalVisible(true)}
                >
                  <Text style={styles.changePinBtnTxt}>Change</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Account Verification Details */}
        <Text style={styles.sectionTitle}>Account Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Full Name</Text>
            <Text style={styles.detailValue}>{profileData?.name || user?.name || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Username</Text>
            <Text style={styles.detailValue}>@{profileData?.username || user?.username || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Gender</Text>
            <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>
              {(profileData?.gender || user?.gender || '—').toLowerCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Role</Text>
            <Text style={styles.detailValue}>{profileData?.role || user?.role || 'CLIENT'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Email Address</Text>
            <Text style={styles.detailValue}>{profileData?.email || user?.email || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone Number</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.detailValue}>{profileData?.mobileNumber || user?.mobileNumber || 'Not Linked'} </Text>
              {user?.isMobileVerified ? (
                <View style={{ backgroundColor: '#10b98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                  <Text style={{ color: '#10b981', fontSize: 10, fontWeight: 'bold' }}>✓ Verified</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={handleSendMobileOtp} disabled={isSendingMobileOtp} style={{ backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{isSendingMobileOtp ? 'Sending...' : 'Verify'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Aadhaar Card KYC</Text>
            <View style={styles.badgeRow}>
              <Feather 
                name={isAadharVerified ? "check-circle" : (kycStatus === 'pending' ? "clock" : "alert-circle")} 
                size={12} 
                color={isAadharVerified ? "#10b981" : (kycStatus === 'pending' ? "#f59e0b" : "#9ca3af")} 
              />
              <Text style={[
                styles.detailValue, 
                { 
                  color: isAadharVerified ? '#10b981' : (kycStatus === 'pending' ? '#f59e0b' : '#9ca3af'), 
                  fontWeight: 'bold' 
                }
              ]}>
                {' '}{isAadharVerified ? 'Verified' : (kycStatus === 'pending' ? 'Pending' : 'Not Verified')}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PAN Card</Text>
            <View style={styles.badgeRow}>
              <Feather 
                name={isPanVerified ? "check-circle" : (kycStatus === 'pending' ? "clock" : "alert-circle")} 
                size={12} 
                color={isPanVerified ? "#10b981" : (kycStatus === 'pending' ? "#f59e0b" : "#9ca3af")} 
              />
              <Text style={[
                styles.detailValue, 
                { 
                  color: isPanVerified ? '#10b981' : (kycStatus === 'pending' ? '#f59e0b' : '#9ca3af'), 
                  fontWeight: 'bold' 
                }
              ]}>
                {' '}{isPanVerified ? 'Linked' : (kycStatus === 'pending' ? 'Pending' : 'Not Linked')}
              </Text>
            </View>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>Bank Accounts</Text>
            <Text style={[styles.detailValue, { color: hasBankDetails ? '#10b981' : '#9ca3af', fontWeight: 'bold' }]}>
              {hasBankDetails ? (profileData?.bankDetails?.bankName ? `Linked (${profileData.bankDetails.bankName})` : 'Linked') : 'Not Linked'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal visible={pinModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Set Safety PIN</Text>
            <Text style={styles.modalSub}>
              Enter a new 4-digit code. Share this code with workers so they can start the work.
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Enter 4-Digit PIN"
              placeholderTextColor="#9ca3af"
              maxLength={4}
              keyboardType="numeric"
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm 4-Digit PIN"
              placeholderTextColor="#9ca3af"
              maxLength={4}
              keyboardType="numeric"
              secureTextEntry
              value={confirmPin}
              onChangeText={setConfirmPin}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setPinModalVisible(false)}
              >
                <Text style={styles.cancelBtnTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleUpdatePin}
              >
                <Text style={styles.saveBtnTxt}>Save PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Mobile OTP Modal */}
      <Modal visible={mobileOtpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Mobile OTP</Text>
            <Text style={styles.modalSub}>We sent a 6-digit OTP to your mobile number.</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="000000"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              maxLength={6}
              value={mobileOtp}
              onChangeText={setMobileOtp}
              textAlign="center"
            />
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setMobileOtpModalVisible(false)}>
                <Text style={styles.modalCancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleVerifyMobile} disabled={isVerifyingMobile}>
                <Text style={styles.modalSaveTxt}>{isVerifyingMobile ? 'Verifying...' : 'Verify'}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
    marginBottom: 16,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  metaContainer: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  rowSub: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 16,
  },
  pinDisplayContainer: {
    borderTopWidth: 1,
    borderColor: '#f3f4f6',
    marginTop: 16,
    paddingTop: 16,
  },
  pinLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600',
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  pinValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 4,
    color: '#000',
  },
  changePinBtn: {
    backgroundColor: '#f8f7ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePinBtnTxt: {
    color: '#4f46e5',
    fontWeight: '700',
    fontSize: 13,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  detailLabel: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
  },
  modalSub: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#000',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
  },
  cancelBtnTxt: {
    color: '#374151',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
  },
  saveBtnTxt: {
    color: '#fff',
    fontWeight: '700',
  },
});
