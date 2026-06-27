import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../shared/theme/theme';
import { useDispatch } from 'react-redux';
import { updateUser } from '../store/authSlice';

export default function KycScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const dispatch = useDispatch();

  // Screen state
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  // Step 1: Aadhaar Form State
  const [aadharNumber, setAadharNumber] = useState('');

  // Step 2: PAN Form State
  const [panCard, setPanCard] = useState('');

  // Step 3: Bank Form State
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  // Load profile data on focus
  const fetchKycStatus = async () => {
    try {
      setLoading(true);
      const res = await api.get('/profile/me');
      if (res.data?.success) {
        const data = res.data.data;
        setProfileData(data);
        dispatch(updateUser(data));
        if (data.kyc?.aadharNumber) {
          setAadharNumber(data.kyc.aadharNumber);
        }
        if (data.kyc?.panCard) {
          setPanCard(data.kyc.panCard);
        }
        if (data.bankDetails) {
          setBankName(data.bankDetails.bankName || '');
          setAccountNo(data.bankDetails.accountNo || '');
          setIfscCode(data.bankDetails.ifscCode || '');
        }
      }
    } catch (err: any) {
      console.error('Failed to load profile details in KYC:', err);
      Alert.alert('Error', 'Failed to load your KYC status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // Helpers to check status
  const isAadharVerified = !!(profileData?.kyc?.aadharVerified || profileData?.kycVerified);
  const isPanVerified = !!(profileData?.kyc?.panVerified || profileData?.kycVerified);
  const hasBankDetails = !!profileData?.bankDetails;

  const handleAadharSubmit = async () => {
    if (aadharNumber.length !== 12 || /\D/.test(aadharNumber)) {
      Alert.alert('Validation Error', 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/kyc/aadhaar/submit', { aadhaarNumber });
      if (res.data?.success) {
        Alert.alert('Success', 'Aadhaar submitted successfully! Please link your PAN card next.');
        await fetchKycStatus();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit Aadhaar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetKyc = async () => {
    setSubmitting(true);
    try {
      const res = await api.post('/kyc/reset');
      if (res.data?.success) {
        Alert.alert('Success', 'KYC and Bank details have been reset. You can now test the flow from scratch.');
        setAadharNumber('');
        setPanCard('');
        setBankName('');
        setAccountNo('');
        setIfscCode('');
        setWithdrawalPin('');
        setConfirmPin('');
        await fetchKycStatus();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reset KYC status');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: PAN Card Action
  const handleLinkPan = async () => {
    const formattedPan = panCard.trim().toUpperCase();
    if (formattedPan.length !== 10) {
      Alert.alert('Validation Error', 'Please enter a valid 10-character PAN number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/kyc/pan', { panCard: formattedPan });
      if (res.data?.success) {
        Alert.alert('Success', 'PAN card verified! KYC has been completed successfully.');
        await fetchKycStatus();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to link PAN card');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 3: Bank account link Action
  const handleLinkBank = async () => {
    if (!bankName.trim() || !accountNo.trim() || !ifscCode.trim()) {
      Alert.alert('Validation Error', 'Please fill in all bank details.');
      return;
    }

    if (withdrawalPin && withdrawalPin.length !== 4) {
      Alert.alert('Validation Error', 'Withdrawal PIN must be exactly 4 digits.');
      return;
    }

    if (withdrawalPin !== confirmPin) {
      Alert.alert('Validation Error', 'Withdrawal PINs do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/kyc/bank', {
        bankName: bankName.trim(),
        accountNo: accountNo.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        pin: withdrawalPin || undefined,
        confirmPin: confirmPin || undefined,
      });
      if (res.data?.success) {
        Alert.alert('Success', 'Bank details linked and Withdrawal PIN configured successfully!');
        setWithdrawalPin('');
        setConfirmPin('');
        await fetchKycStatus();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to link bank account');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Checking KYC Status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>KYC Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      {!profileData?.isMobileVerified ? (
        <View style={styles.blockContainer}>
          <Feather name="smartphone" size={64} color="#f59e0b" style={{ marginBottom: 16 }} />
          <Text style={[styles.blockTitle, { color: colors.text }]}>Mobile Verification Required</Text>
          <Text style={[styles.blockSub, { color: colors.textMuted }]}>
            You must verify your mobile number before you can proceed with KYC verification.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: '#f59e0b', marginTop: 24 }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.btnText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.accent, borderColor: colors.border }]}>
          <Feather name="shield" size={20} color={colors.primary} style={styles.infoIcon} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>Identity Verification</Text>
            <Text style={[styles.infoSub, { color: colors.textMuted }]}>
              Link your Aadhaar, PAN card, and bank details to unlock secure escrow payments and display a verification tick badge on your profile.
            </Text>
          </View>
        </View>

        {/* Step 1: Aadhaar */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.stepBadge, { backgroundColor: isAadharVerified ? '#e6f4ea' : '#eff6ff' }]}>
              <Text style={[styles.stepBadgeText, { color: isAadharVerified ? '#137333' : '#1e1b4b' }]}>STEP 1</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Aadhaar Card Verification</Text>
            {isAadharVerified && (
              <Feather name="check-circle" size={18} color="#10b981" style={styles.successTick} />
            )}
          </View>

          {isAadharVerified ? (
            <View style={styles.verifiedContainer}>
              <Feather name="lock" size={14} color="#10b981" />
              <Text style={styles.verifiedText}>
                Aadhaar Linked (XXXX XXXX {aadharNumber.slice(-4)})
              </Text>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>12-Digit Aadhaar Number</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="0000 0000 0000"
                placeholderTextColor="#bbb"
                maxLength={12}
                keyboardType="numeric"
                value={aadharNumber}
                onChangeText={setAadharNumber}
              />

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={handleAadharSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Submit Aadhaar</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Step 2: PAN Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            !isAadharVerified && styles.disabledCard,
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.stepBadge,
                { backgroundColor: isPanVerified ? '#e6f4ea' : isAadharVerified ? '#eff6ff' : '#f3f4f6' },
              ]}
            >
              <Text style={[styles.stepBadgeText, { color: isPanVerified ? '#137333' : isAadharVerified ? '#1e1b4b' : '#9ca3af' }]}>
                STEP 2
              </Text>
            </View>
            <Text style={[styles.cardTitle, { color: isAadharVerified ? colors.text : '#9ca3af' }]}>
              PAN Card Link
            </Text>
            {isPanVerified && (
              <Feather name="check-circle" size={18} color="#10b981" style={styles.successTick} />
            )}
          </View>

          {!isAadharVerified ? (
            <Text style={styles.lockText}>Complete Step 1 to unlock</Text>
          ) : isPanVerified ? (
            <View style={styles.verifiedContainer}>
              <Feather name="lock" size={14} color="#10b981" />
              <Text style={styles.verifiedText}>PAN Linked ({panCard.toUpperCase()})</Text>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>10-Character PAN Number</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="ABCDE1234F"
                placeholderTextColor="#bbb"
                maxLength={10}
                autoCapitalize="characters"
                value={panCard}
                onChangeText={setPanCard}
              />
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={handleLinkPan}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>Verify & Link PAN</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Step 3: Bank Details & Withdrawal PIN */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
            !isPanVerified && styles.disabledCard,
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.stepBadge,
                { backgroundColor: hasBankDetails ? '#e6f4ea' : isPanVerified ? '#eff6ff' : '#f3f4f6' },
              ]}
            >
              <Text style={[styles.stepBadgeText, { color: hasBankDetails ? '#137333' : isPanVerified ? '#1e1b4b' : '#9ca3af' }]}>
                STEP 3
              </Text>
            </View>
            <Text style={[styles.cardTitle, { color: isPanVerified ? colors.text : '#9ca3af' }]}>
              Bank Details & Security PIN
            </Text>
            {hasBankDetails && (
              <Feather name="check-circle" size={18} color="#10b981" style={styles.successTick} />
            )}
          </View>

          {!isPanVerified ? (
            <Text style={styles.lockText}>Complete Step 2 to unlock</Text>
          ) : (
            <View style={styles.formContainer}>
              {hasBankDetails && (
                <View style={[styles.verifiedContainer, { marginBottom: 16 }]}>
                  <Feather name="check" size={14} color="#10b981" />
                  <Text style={styles.verifiedText}>
                    Active Bank Account Linked ({bankName})
                  </Text>
                </View>
              )}

              <Text style={[styles.inputLabel, { color: colors.text }]}>Bank Name</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="State Bank of India"
                placeholderTextColor="#bbb"
                value={bankName}
                onChangeText={setBankName}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Account Number</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="123456789012"
                placeholderTextColor="#bbb"
                keyboardType="numeric"
                value={accountNo}
                onChangeText={setAccountNo}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>IFSC Code</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="SBIN0001234"
                placeholderTextColor="#bbb"
                autoCapitalize="characters"
                value={ifscCode}
                onChangeText={setIfscCode}
              />

              <View style={styles.separator} />

              <Text style={[styles.sectionSubtitle, { color: colors.primary }]}>
                {hasBankDetails ? 'Change Withdrawal PIN (Optional)' : 'Set Withdrawal PIN (4-Digits)'}
              </Text>
              <Text style={styles.pinHint}>
                This PIN is required when releasing payments or performing transactions.
              </Text>

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Withdrawal PIN</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="••••"
                placeholderTextColor="#bbb"
                maxLength={4}
                keyboardType="numeric"
                secureTextEntry
                value={withdrawalPin}
                onChangeText={setWithdrawalPin}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>Confirm PIN</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, color: colors.text }]}
                placeholder="••••"
                placeholderTextColor="#bbb"
                maxLength={4}
                keyboardType="numeric"
                secureTextEntry
                value={confirmPin}
                onChangeText={setConfirmPin}
              />

              <TouchableOpacity
                style={[styles.btn, { backgroundColor: colors.primary, marginTop: 18 }]}
                onPress={handleLinkBank}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>
                    {hasBankDetails ? 'Update Details' : 'Link Account & Save PIN'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Reset button for testing */}
        {(isAadharVerified || isPanVerified || hasBankDetails) && (
          <TouchableOpacity
            style={styles.resetKycBtn}
            onPress={handleResetKyc}
          >
            <Text style={styles.resetKycBtnText}>Reset KYC Status (For Testing)</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  blockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  blockTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  blockSub: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 12,
    lineHeight: 18,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  disabledCard: {
    opacity: 0.6,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  successTick: {
    marginLeft: 8,
  },
  lockText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 10,
  },
  verifiedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f4ea',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  verifiedText: {
    fontSize: 13,
    color: '#137333',
    fontWeight: '700',
  },
  formContainer: {
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  btn: {
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  btnHalf: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnTextHalf: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  separator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  pinHint: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 16,
  },
  resetKycBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fca5a5',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  resetKycBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 14,
  },
});
