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
import { useLanguage } from '../services/i18n';
import api from '../services/api';

const settingsText = {
  en: {
    safetyHub: 'Safety hub',
    safetyTools: 'Safety tools',
    ridecheckTitle: 'RideCheck Notifications',
    ridecheckSub: 'Send alerts if a gig or contract does not progress as planned.',
    pinVerification: 'PIN verification',
    pinSub: 'Use a safety PIN to verify with your client before starting work.',
    pinLabel: 'Your Safety PIN',
    changeBtn: 'Change',
    accountDetails: 'Account Details',
    emailLabel: 'Email Address',
    phoneLabel: 'Phone Number',
    aadharLabel: 'Aadhaar Card KYC',
    panLabel: 'PAN Card',
    bankLabel: 'Bank Accounts',
    verified: 'Verified',
    linked: 'Linked',
    notLinked: 'Not Linked',
    modalTitle: 'Set Safety PIN',
    modalSub: 'Enter a 4-digit code. Share this with your client upon arrival to verify work startup.',
    cancel: 'Cancel',
    save: 'Save PIN',
    nameLabel: 'Full Name',
    usernameLabel: 'Username',
    genderLabel: 'Gender',
    roleLabel: 'Role',
  },
  hi: {
    safetyHub: 'सुरक्षा हब',
    safetyTools: 'सुरक्षा उपकरण',
    ridecheckTitle: 'रेडचेक सूचनाएं',
    ridecheckSub: 'यदि कोई काम योजना के अनुसार प्रगति नहीं करता है तो सचेत करें।',
    pinVerification: 'पिन सत्यापन',
    pinSub: 'काम शुरू करने से पहले अपने क्लाइंट के साथ सत्यापित करने के लिए पिन उपयोग करें।',
    pinLabel: 'आपका सुरक्षा पिन',
    changeBtn: 'बदलें',
    accountDetails: 'खाता विवरण',
    emailLabel: 'ईमेल पता',
    phoneLabel: 'फोन नंबर',
    aadharLabel: 'आधार कार्ड केवाईसी',
    panLabel: 'पैन कार्ड',
    bankLabel: 'बैंक खाते',
    verified: 'सत्यापित',
    linked: 'संबद्ध',
    notLinked: 'संबद्ध नहीं',
    modalTitle: 'सुरक्षा पिन सेट करें',
    modalSub: '4-अंकीय कोड दर्ज करें। काम शुरू करने के लिए आगमन पर इसे अपने ग्राहक के साथ साझा करें।',
    cancel: 'रद्द करें',
    save: 'पिन सहेजें',
    nameLabel: 'पूरा नाम',
    usernameLabel: 'यूज़रनेम',
    genderLabel: 'लिंग',
    roleLabel: 'भूमिका',
  },
  bn: {
    safetyHub: 'নিরাপত্তা হাব',
    safetyTools: 'নিরাপত্তা সরঞ্জাম',
    ridecheckTitle: 'রাইডচেক নোটিফিকেশন',
    ridecheckSub: 'কোনো কাজ পরিকল্পনা অনুযায়ী না চললে নোটিফিকেশন পাঠান।',
    pinVerification: 'পিন যাচাইকরণ',
    pinSub: 'কাজ শুরু করার আগে ক্লায়েন্টের সাথে যাচাই করতে পিন ব্যবহার করুন।',
    pinLabel: 'আপনার নিরাপত্তা পিন',
    changeBtn: 'পরিবর্তন',
    accountDetails: 'অ্যাকাউন্টের বিবরণ',
    emailLabel: 'ইমেল ঠিকানা',
    phoneLabel: 'ফোন নম্বর',
    aadharLabel: 'আধার কার্ড কেওয়াইসি',
    panLabel: 'প্যান কার্ড',
    bankLabel: 'ব্যাংক অ্যাকাউন্ট',
    verified: 'যাচাইকৃত',
    linked: 'সংযুক্ত',
    notLinked: 'সংযুক্ত নেই',
    modalTitle: 'নিরাপত্তা পিন সেট করুন',
    modalSub: 'একটি ৪-সংখ্যার কোড দিন। কাজ শুরু করতে ক্লায়েন্টকে এই কোডটি বলুন।',
    cancel: 'বাতিল',
    save: 'পিন সেভ করুন',
    nameLabel: 'পুরো নাম',
    usernameLabel: 'ব্যবহারকারীর নাম',
    genderLabel: 'লিঙ্গ',
    roleLabel: 'ভূমিকা',
  },
  bho: {
    safetyHub: 'सुरक्षा हब',
    safetyTools: 'सुरक्षा उपकरण',
    ridecheckTitle: 'रेडचेक नोटिफिकेशन',
    ridecheckSub: 'अगर काम योजना के हिसाब से आगे ना बढ़े त सचेत करीं।',
    pinVerification: 'पिन सत्यापन',
    pinSub: 'काम शुरू करे से पहिले मालिक से सत्यापित करे खातिर पिन के प्रयोग करीं।',
    pinLabel: 'राउर सुरक्षा पिन',
    changeBtn: 'बदलीं',
    accountDetails: 'खाता विवरण',
    emailLabel: 'ईमेल पता',
    phoneLabel: 'फोन नंबर',
    aadharLabel: 'आधार कार्ड केवाईसी',
    panLabel: 'पैन कार्ड',
    bankLabel: 'बैंक खाता',
    verified: 'सत्यापित',
    linked: 'जुड़ल बा',
    notLinked: 'जुड़ल नईखे',
    modalTitle: 'सुरक्षा पिन सेट करीं',
    modalSub: '4-अंक के सुरक्षा पिन सेट करीं अउर काम शुरू करे खातिर एकरा के मालिक के बताईं।',
    cancel: 'रद्द करीं',
    save: 'पिन सहेजीं',
    nameLabel: 'पूरा नाम',
    usernameLabel: 'यूजरनेम',
    genderLabel: 'लिंग',
    roleLabel: 'भूमिका',
  },
};

export default function SettingsScreen({ navigation }: { navigation: any }) {
  const { user } = useSelector((s: RootState) => s.auth);
  const { locale } = useLanguage();
  const currentLang = settingsText[locale as keyof typeof settingsText] || settingsText.en;

  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [pinVerificationEnabled, setPinVerificationEnabled] = useState(true);
  const [safetyPin, setSafetyPin] = useState('----');

  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [profileData, setProfileData] = useState<any>(null);

  // Mobile Verification States
  const [mobileOtpModalVisible, setMobileOtpModalVisible] = useState(false);
  const [mobileOtp, setMobileOtp] = useState('');
  const [isSendingMobileOtp, setIsSendingMobileOtp] = useState(false);
  const [isVerifyingMobile, setIsVerifyingMobile] = useState(false);
  const dispatch = useDispatch();

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
      .catch((err) => console.error('Failed to load profile details in worker settings:', err));
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
    Alert.alert('Success', 'Safety PIN updated successfully!');
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
      dispatch({ type: 'auth/updateUser', payload: { ...user, isMobileVerified: true } });
      api.get('/profile/me').then(res => setProfileData(res.data?.data));
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid OTP.');
    } finally {
      setIsVerifyingMobile(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{currentLang.safetyHub}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{currentLang.safetyTools}</Text>

        {/* Safety Preferences / Alerts */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <Feather name="shield" size={18} color="#000" />
              </View>
              <View style={styles.metaContainer}>
                <Text style={styles.rowTitle}>{currentLang.ridecheckTitle}</Text>
                <Text style={styles.rowSub}>{currentLang.ridecheckSub}</Text>
              </View>
            </View>
            <Switch
              value={alertsEnabled}
              onValueChange={toggleAlerts}
              trackColor={{ false: '#767577', true: '#059669' }}
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
                <Text style={styles.rowTitle}>{currentLang.pinVerification}</Text>
                <Text style={styles.rowSub}>{currentLang.pinSub}</Text>
              </View>
            </View>
            <Switch
              value={pinVerificationEnabled}
              onValueChange={togglePinVerification}
              trackColor={{ false: '#767577', true: '#059669' }}
              thumbColor={pinVerificationEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {pinVerificationEnabled && (
            <View style={styles.pinDisplayContainer}>
              <Text style={styles.pinLabel}>{currentLang.pinLabel}</Text>
              <View style={styles.pinRow}>
                <Text style={styles.pinValue}>
                  {safetyPin.split('').join(' ')}
                </Text>
                <TouchableOpacity
                  style={styles.changePinBtn}
                  onPress={() => setPinModalVisible(true)}
                >
                  <Text style={styles.changePinBtnTxt}>{currentLang.changeBtn}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Account Details */}
        <Text style={styles.sectionTitle}>{currentLang.accountDetails}</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{currentLang.nameLabel || 'Full Name'}</Text>
            <Text style={styles.detailValue}>{profileData?.name || user?.name || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{currentLang.usernameLabel || 'Username'}</Text>
            <Text style={styles.detailValue}>@{profileData?.username || user?.username || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{currentLang.genderLabel || 'Gender'}</Text>
            <Text style={[styles.detailValue, { textTransform: 'capitalize' }]}>
              {(profileData?.gender || user?.gender || '—').toLowerCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{currentLang.roleLabel || 'Role'}</Text>
            <Text style={styles.detailValue}>{profileData?.role || user?.role || 'FREELANCER'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{currentLang.emailLabel}</Text>
            <Text style={styles.detailValue}>{profileData?.email || user?.email || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{currentLang.phoneLabel}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.detailValue}>{profileData?.mobileNumber || user?.mobileNumber || 'Not Linked'} </Text>
              {user?.isMobileVerified ? (
                <View style={{ backgroundColor: '#10b98120', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 }}>
                  <Text style={{ color: '#10b981', fontSize: 10, fontWeight: 'bold' }}>✓ {currentLang.verified}</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={handleSendMobileOtp} disabled={isSendingMobileOtp} style={{ backgroundColor: '#f59e0b', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginLeft: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>{isSendingMobileOtp ? 'Sending...' : 'Verify'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{currentLang.aadharLabel}</Text>
            <View style={styles.badgeRow}>
              <Feather 
                name={profileData?.kycVerified || profileData?.kyc?.aadharVerified ? "check-circle" : (profileData?.kyc?.status === 'pending' ? "clock" : "alert-circle")} 
                size={12} 
                color={profileData?.kycVerified || profileData?.kyc?.aadharVerified ? "#059669" : (profileData?.kyc?.status === 'pending' ? "#f59e0b" : "#9ca3af")} 
              />
              <Text style={[
                styles.detailValue, 
                { 
                  color: profileData?.kycVerified || profileData?.kyc?.aadharVerified ? '#059669' : (profileData?.kyc?.status === 'pending' ? '#f59e0b' : '#9ca3af'), 
                  fontWeight: 'bold' 
                }
              ]}>
                {' '}{profileData?.kycVerified || profileData?.kyc?.aadharVerified ? currentLang.verified : (profileData?.kyc?.status === 'pending' ? 'Pending' : currentLang.notLinked)}
              </Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{currentLang.panLabel}</Text>
            <View style={styles.badgeRow}>
              <Feather 
                name={profileData?.kycVerified || profileData?.kyc?.panVerified ? "check-circle" : (profileData?.kyc?.status === 'pending' ? "clock" : "alert-circle")} 
                size={12} 
                color={profileData?.kycVerified || profileData?.kyc?.panVerified ? "#059669" : (profileData?.kyc?.status === 'pending' ? "#f59e0b" : "#9ca3af")} 
              />
              <Text style={[
                styles.detailValue, 
                { 
                  color: profileData?.kycVerified || profileData?.kyc?.panVerified ? '#059669' : (profileData?.kyc?.status === 'pending' ? '#f59e0b' : '#9ca3af'), 
                  fontWeight: 'bold' 
                }
              ]}>
                {' '}{profileData?.kycVerified || profileData?.kyc?.panVerified ? currentLang.linked : (profileData?.kyc?.status === 'pending' ? 'Pending' : currentLang.notLinked)}
              </Text>
            </View>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>{currentLang.bankLabel}</Text>
            <Text style={[styles.detailValue, { color: profileData?.bankDetails ? '#059669' : '#9ca3af', fontWeight: 'bold' }]}>
              {profileData?.bankDetails ? (profileData.bankDetails.bankName ? `${currentLang.linked} (${profileData.bankDetails.bankName})` : currentLang.linked) : currentLang.notLinked}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal visible={pinModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{currentLang.modalTitle}</Text>
            <Text style={styles.modalSub}>{currentLang.modalSub}</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="0000"
              placeholderTextColor="#9ca3af"
              maxLength={4}
              keyboardType="numeric"
              secureTextEntry
              value={newPin}
              onChangeText={setNewPin}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="0000"
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
                <Text style={styles.cancelBtnTxt}>{currentLang.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleUpdatePin}
              >
                <Text style={styles.saveBtnTxt}>{currentLang.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Mobile OTP Modal */}
      <Modal visible={mobileOtpModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalCard}>
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
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setMobileOtpModalVisible(false)}>
                <Text style={styles.cancelBtnTxt}>{currentLang.cancel}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleVerifyMobile} disabled={isVerifyingMobile}>
                <Text style={styles.saveBtnTxt}>{isVerifyingMobile ? 'Verifying...' : 'Verify'}</Text>
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
    backgroundColor: '#ecfdf5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#064e3b',
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#064e3b',
    marginBottom: 16,
    marginTop: 10,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
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
    backgroundColor: '#f0fdf4',
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
    color: '#1d1b20',
  },
  rowSub: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
    lineHeight: 16,
  },
  pinDisplayContainer: {
    borderTopWidth: 1,
    borderColor: '#d1fae5',
    marginTop: 16,
    paddingTop: 16,
  },
  pinLabel: {
    fontSize: 14,
    color: '#047857',
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
    color: '#1d1b20',
  },
  changePinBtn: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changePinBtnTxt: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 13,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#d1fae5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#047857',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1d1b20',
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
    color: '#064e3b',
  },
  modalSub: {
    fontSize: 13,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    marginBottom: 20,
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    color: '#1d1b20',
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
    backgroundColor: '#f0fdf4',
  },
  cancelBtnTxt: {
    color: '#047857',
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#059669',
  },
  saveBtnTxt: {
    color: '#fff',
    fontWeight: '700',
  },
});
