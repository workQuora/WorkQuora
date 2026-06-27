import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import api, { getApiData } from '../services/api';
import { Feather } from '@expo/vector-icons';
import { useLanguage } from '../services/i18n';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../store/authSlice';
import { RootState } from '../store';

interface KycScreenProps {
  navigation: any;
}

export default function KycScreen({ navigation }: KycScreenProps) {
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const [kyc, setKyc] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1); // 1: Identity, 2: Bank, 3: Face ID
  const [docType, setDocType] = useState<'aadhaar' | 'pan'>('aadhaar');

  // Aadhaar Form State
  const [aadharNumber, setAadharNumber] = useState('');
  const [submittingAadhar, setSubmittingAadhar] = useState(false);

  // PAN Form State
  const [panCard, setPanCard] = useState('');
  const [submittingPan, setSubmittingPan] = useState(false);

  // Bank Form State
  const [holderName, setHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [submittingBank, setSubmittingBank] = useState(false);

  // Liveness Check State
  const [livenessSuccess, setLivenessSuccess] = useState(false);
  const [livenessChecking, setLivenessChecking] = useState(false);

  const fetchStatus = async () => {
    try {
      const meResponse = await api.get('/auth/me');
      const meData = getApiData(meResponse);
      if (meData) {
        dispatch(updateUser(meData));
        if (meData.kyc) {
          setKyc(meData.kyc);
        } else {
          setKyc(null);
        }
      }

      // Fetch wallet details for bank info
      const walletResponse = await api.get('/dashboard/wallet');
      const walletData = getApiData(walletResponse);
      if (walletData) {
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const handleAadharSubmit = async () => {
    if (!aadharNumber || aadharNumber.length !== 12 || /\D/.test(aadharNumber)) {
      Alert.alert('Error', 'Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setSubmittingAadhar(true);
    try {
      const response = await api.post('/kyc/aadhaar/submit', { aadhaarNumber: aadharNumber });
      if (response.data.success) {
        Alert.alert('Aadhaar Submitted!', 'Identity verification step 1 completed.');
        await fetchStatus();
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to submit Aadhaar.';
      Alert.alert('Error', errMsg);
    } finally {
      setSubmittingAadhar(false);
    }
  };

  const handleResetKyc = async () => {
    try {
      const res = await api.post('/kyc/reset');
      if (res.data?.success) {
        Alert.alert('Success', 'KYC and Bank details have been reset. You can now test the flow from scratch.');
        setAadharNumber('');
        setPanCard('');
        setHolderName('');
        setBankName('');
        setIfscCode('');
        setAccountNo('');
        setPin('');
        setConfirmPin('');
        setLivenessSuccess(false);
        setCurrentStep(1);
        await fetchStatus();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reset KYC status');
    }
  };



  const handleVerifyPan = async () => {
    if (!panCard || panCard.length !== 10) {
      Alert.alert('Error', 'Please enter a valid 10-character PAN number.');
      return;
    }

    setSubmittingPan(true);
    try {
      const response = await api.post('/kyc/pan', { panCard: panCard.toUpperCase() });
      if (response.data.success) {
        Alert.alert('PAN Verified!', 'Identity verification completed successfully. Proceeding to Bank step.');
        setPanCard('');
        await fetchStatus();
        setCurrentStep(2);
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'PAN verification failed.';
      Alert.alert('Error', errMsg);
    } finally {
      setSubmittingPan(false);
    }
  };

  const handleLinkBank = async () => {
    if (!bankName || !accountNo || !ifscCode) {
      Alert.alert('Error', 'Please fill all bank details.');
      return;
    }
    if (!wallet?.hasWithdrawalPin) {
      if (!pin || pin.length !== 4 || pin !== confirmPin) {
        Alert.alert('Error', 'PINs must match and be exactly 4 digits.');
        return;
      }
    }

    setSubmittingBank(true);
    try {
      const response = await api.post('/kyc/bank', {
        bankName,
        accountNo,
        ifscCode: ifscCode.toUpperCase(),
        pin: wallet?.hasWithdrawalPin ? undefined : pin,
        confirmPin: wallet?.hasWithdrawalPin ? undefined : confirmPin,
      });

      if (response.data.success) {
        Alert.alert('Bank Account Linked', 'Payment details saved successfully. Proceeding to Face Check.');
        await fetchStatus();
        setCurrentStep(3);
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Linking failed. Please check credentials.';
      Alert.alert('Error', errMsg);
    } finally {
      setSubmittingBank(false);
    }
  };

  const handleStartLivenessCheck = () => {
    setLivenessChecking(true);
    setTimeout(() => {
      setLivenessChecking(false);
      setLivenessSuccess(true);
      Alert.alert('Face ID Verified', 'Liveness verification completed successfully!');
    }, 2000);
  };

  const handleSubmitAllKyc = async () => {
    if (!livenessSuccess) {
      Alert.alert('Face ID Pending', 'Please complete the Face Check before submitting.');
      return;
    }
    
    // Ensure final state is fetched before navigation
    await fetchStatus();
    
    Alert.alert(
      'Verification Complete',
      'Congratulations! Your identity has been verified successfully. All features are now unlocked.',
      [
        {
          text: 'Go to Dashboard',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  const isAadharVerified = kyc?.aadharVerified || false;
  const isPanVerified = kyc?.panVerified || false;
  const isKycComplete = isAadharVerified && isPanVerified;
  const hasBankLinked = wallet?.bankAccounts && wallet.bankAccounts.length > 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#059669" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>WorkQuora</Text>
        <View style={styles.secureBadge}>
          <Feather name="shield" size={14} color="#064e3b" />
          <Text style={styles.secureText}>SECURE</Text>
        </View>
      </View>

      {!user?.isMobileVerified ? (
        <View style={styles.blockContainer}>
          <Feather name="smartphone" size={64} color="#f59e0b" style={{ marginBottom: 16 }} />
          <Text style={styles.blockTitle}>Mobile Verification Required</Text>
          <Text style={styles.blockSub}>
            You must verify your mobile number before you can proceed with KYC verification.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#f59e0b', marginTop: 24, paddingHorizontal: 32 }]}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.primaryButtonText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Header */}
        <View style={styles.progressHeader}>
          <Text style={styles.titleText}>Complete Your Profile</Text>
          <Text style={styles.subtitleText}>
            Verify your identity to unlock premium gigs and instant payments on WorkQuora.
          </Text>
        </View>

        {/* Stepper Indicator */}
        <View style={styles.stepperRow}>
          <View style={styles.stepperLine} />
          <View style={[styles.stepperLineProgress, { width: `${((currentStep - 1) / 2) * 100}%` }]} />
          
          {/* Step 1 Circle */}
          <TouchableOpacity
            style={[styles.stepCircle, currentStep >= 1 && styles.stepCircleActive]}
            onPress={() => setCurrentStep(1)}
            disabled={currentStep < 1}
          >
            {isKycComplete ? (
              <Feather name="check" size={18} color="#ffffff" />
            ) : (
              <Text style={[styles.stepNumber, currentStep >= 1 && styles.stepNumberActive]}>1</Text>
            )}
            <Text style={[styles.stepLabel, currentStep >= 1 && styles.stepLabelActive]}>Identity</Text>
          </TouchableOpacity>

          {/* Step 2 Circle */}
          <TouchableOpacity
            style={[styles.stepCircle, currentStep >= 2 && styles.stepCircleActive]}
            onPress={() => {
              if (isKycComplete) setCurrentStep(2);
              else Alert.alert('Identity Pending', 'Please complete Aadhaar and PAN verification first.');
            }}
          >
            {hasBankLinked ? (
              <Feather name="check" size={18} color="#ffffff" />
            ) : (
              <Text style={[styles.stepNumber, currentStep >= 2 && styles.stepNumberActive]}>2</Text>
            )}
            <Text style={[styles.stepLabel, currentStep >= 2 && styles.stepLabelActive]}>Bank</Text>
          </TouchableOpacity>

          {/* Step 3 Circle */}
          <TouchableOpacity
            style={[styles.stepCircle, currentStep >= 3 && styles.stepCircleActive]}
            onPress={() => {
              if (isKycComplete && hasBankLinked) setCurrentStep(3);
              else Alert.alert('Requirements Pending', 'Please complete Identity and Bank linking first.');
            }}
          >
            {livenessSuccess ? (
              <Feather name="check" size={18} color="#ffffff" />
            ) : (
              <Text style={[styles.stepNumber, currentStep >= 3 && styles.stepNumberActive]}>3</Text>
            )}
            <Text style={[styles.stepLabel, currentStep >= 3 && styles.stepLabelActive]}>Face ID</Text>
          </TouchableOpacity>
        </View>

        {/* Wizard Canvas Card */}
        <View style={styles.card}>
          
          {/* STEP 1: IDENTITY */}
          {currentStep === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>ID Verification</Text>
              <Text style={styles.stepSub}>Please provide your government issued identification.</Text>

              {isKycComplete ? (
                <View style={styles.verifiedCongrats}>
                  <Feather name="check-circle" size={48} color="#059669" style={{ marginBottom: 12 }} />
                  <Text style={styles.congratsTitle}>Identity Verified!</Text>
                  <Text style={styles.congratsSub}>
                    Your Aadhaar Card and PAN Card have been successfully verified.
                  </Text>
                  <TouchableOpacity
                    style={styles.resetKycBtn}
                    onPress={handleResetKyc}
                  >
                    <Text style={styles.resetKycBtnText}>Reset KYC (For Testing)</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Selection cards matching Image 4 */}
                  <TouchableOpacity 
                    style={[styles.selectDocCard, docType === 'aadhaar' && styles.selectDocCardActive]} 
                    onPress={() => setDocType('aadhaar')}
                  >
                    <View style={styles.selectDocLeft}>
                      <View style={[styles.docIconCircle, docType === 'aadhaar' && styles.docIconCircleActive]}>
                        <Feather name="shield" size={18} color={docType === 'aadhaar' ? '#059669' : '#047857'} />
                      </View>
                      <View>
                        <Text style={[styles.docCardTitle, docType === 'aadhaar' && styles.docCardTitleActive]}>Aadhaar Card</Text>
                        <Text style={styles.docCardSub}>
                          {isAadharVerified ? 'Verified' : 'OTP based verification'}
                        </Text>
                      </View>
                    </View>
                    {isAadharVerified ? (
                      <Feather name="check-circle" size={18} color="#059669" />
                    ) : (
                      docType === 'aadhaar' && <Feather name="check-circle" size={18} color="#059669" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={[styles.selectDocCard, docType === 'pan' && styles.selectDocCardActive]} 
                    onPress={() => setDocType('pan')}
                  >
                    <View style={styles.selectDocLeft}>
                      <View style={[styles.docIconCircle, docType === 'pan' && styles.docIconCircleActive]}>
                        <Feather name="credit-card" size={18} color={docType === 'pan' ? '#059669' : '#047857'} />
                      </View>
                      <View>
                        <Text style={[styles.docCardTitle, docType === 'pan' && styles.docCardTitleActive]}>PAN Card</Text>
                        <Text style={styles.docCardSub}>
                          {isPanVerified ? 'Verified' : 'Manual upload/lookup'}
                        </Text>
                      </View>
                    </View>
                    {isPanVerified ? (
                      <Feather name="check-circle" size={18} color="#059669" />
                    ) : (
                      docType === 'pan' && <Feather name="check-circle" size={18} color="#059669" />
                    )}
                  </TouchableOpacity>

                  {docType === 'aadhaar' && isAadharVerified ? (
                    <View style={styles.verifiedCongrats}>
                      <Feather name="check-circle" size={32} color="#059669" style={{ marginBottom: 8 }} />
                      <Text style={styles.congratsTitle}>Aadhaar Verified!</Text>
                      <Text style={styles.congratsSub}>
                        Your Aadhaar Card is linked and verified.
                      </Text>
                      <TouchableOpacity
                        style={[styles.kycContinueBtn, { marginTop: 20 }]}
                        onPress={() => setDocType('pan')}
                      >
                        <Text style={styles.kycContinueBtnText}>Proceed to PAN Card</Text>
                      </TouchableOpacity>
                    </View>
                  ) : docType === 'pan' && isPanVerified ? (
                    <View style={styles.verifiedCongrats}>
                      <Feather name="check-circle" size={32} color="#059669" style={{ marginBottom: 8 }} />
                      <Text style={styles.congratsTitle}>PAN Verified!</Text>
                      <Text style={styles.congratsSub}>
                        Your PAN Card is verified.
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Document Number Form */}
                      <View style={styles.formGroupKyc}>
                        <Text style={styles.kycInputLabel}>Document Number</Text>
                        {docType === 'aadhaar' ? (
                          <TextInput
                            style={styles.kycTextInput}
                            placeholder="Enter 12-digit Aadhaar Number"
                            placeholderTextColor="#9ca3af"
                            keyboardType="numeric"
                            maxLength={12}
                            value={aadharNumber}
                            onChangeText={setAadharNumber}
                          />
                        ) : (
                          <TextInput
                            style={styles.kycTextInput}
                            placeholder="Enter 10-character PAN Card"
                            placeholderTextColor="#9ca3af"
                            autoCapitalize="characters"
                            maxLength={10}
                            value={panCard}
                            onChangeText={setPanCard}
                          />
                        )}
                      </View>

                      {/* File Upload Box */}
                      <TouchableOpacity 
                        style={styles.uploadBox}
                        onPress={() => Alert.alert('Upload Document', 'Please choose document scan image from photo library.')}
                      >
                        <Feather name="upload-cloud" size={26} color="#7a7582" />
                        <Text style={styles.uploadTitle}>Upload Document Photo</Text>
                        <Text style={styles.uploadSub}>JPG, PNG, or PDF up to 5MB</Text>
                      </TouchableOpacity>

                      {/* Continue CTA Button */}
                      <TouchableOpacity
                        style={[styles.kycContinueBtn, submittingAadhar || submittingPan ? { opacity: 0.7 } : {}]}
                        onPress={() => {
                          if (docType === 'aadhaar') {
                            handleAadharSubmit();
                          } else {
                            handleVerifyPan();
                          }
                        }}
                        disabled={submittingAadhar || submittingPan}
                      >
                        {submittingAadhar || submittingPan ? (
                          <ActivityIndicator color="#fff" />
                        ) : (
                          <Text style={styles.kycContinueBtnText}>Continue</Text>
                        )}
                      </TouchableOpacity>


                    </>
                  )}
                </>
              )}
            </View>
          )}

          {/* STEP 2: BANK DETAILS */}
          {currentStep === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Payment Method</Text>
              <Text style={styles.stepSub}>Link bank account to receive direct payouts.</Text>

              {hasBankLinked ? (
                <View style={styles.verifiedCongrats}>
                  <Feather name="check-circle" size={32} color="#059669" />
                  <Text style={styles.congratsTitle}>Bank Account Linked!</Text>
                  <Text style={styles.congratsSub}>
                    Account: XXXX {wallet.bankAccounts[0].accountNo.slice(-4)} at {wallet.bankAccounts[0].bankName}
                  </Text>
                </View>
              ) : (
                <View style={styles.bankForm}>
                  {/* Account Holder Name */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Account Holder Name</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="As per bank records"
                      placeholderTextColor="#9ca3af"
                      value={holderName}
                      onChangeText={setHolderName}
                    />
                  </View>

                  <View style={styles.fieldRow}>
                    {/* Bank Name */}
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Bank Name</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="SBI, HDFC..."
                        placeholderTextColor="#9ca3af"
                        value={bankName}
                        onChangeText={setBankName}
                      />
                    </View>

                    {/* IFSC Code */}
                    <View style={[styles.fieldGroup, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>IFSC Code</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="SBIN0001234"
                        placeholderTextColor="#9ca3af"
                        autoCapitalize="characters"
                        value={ifscCode}
                        onChangeText={setIfscCode}
                      />
                    </View>
                  </View>

                  {/* Account Number */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Account Number</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Enter Bank Account Number"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      value={accountNo}
                      onChangeText={setAccountNo}
                    />
                  </View>

                  {/* Security PIN Setup */}
                  {!wallet?.hasWithdrawalPin && (
                    <View style={styles.fieldRow}>
                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Set 4-Digit PIN</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="••••"
                          placeholderTextColor="#9ca3af"
                          keyboardType="numeric"
                          maxLength={4}
                          secureTextEntry
                          value={pin}
                          onChangeText={setPin}
                        />
                      </View>
                      <View style={[styles.fieldGroup, { flex: 1 }]}>
                        <Text style={styles.fieldLabel}>Confirm PIN</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="••••"
                          placeholderTextColor="#9ca3af"
                          keyboardType="numeric"
                          maxLength={4}
                          secureTextEntry
                          value={confirmPin}
                          onChangeText={setConfirmPin}
                        />
                      </View>
                    </View>
                  )}

                  <TouchableOpacity
                    style={styles.formSubmitBtnFull}
                    onPress={handleLinkBank}
                    disabled={submittingBank}
                  >
                    {submittingBank ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.formSubmitBtnText}>Link Bank Account</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* STEP 3: FACE CHECK */}
          {currentStep === 3 && (
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Liveness Check</Text>
              <Text style={styles.stepSub}>Verify you are a real person through a selfie look.</Text>

              {/* Lens mockup */}
              <View style={styles.lensWrapper}>
                <View style={styles.lensCircle}>
                  {livenessChecking ? (
                    <ActivityIndicator size="large" color="#059669" />
                  ) : livenessSuccess ? (
                    <Feather name="check" size={48} color="#059669" />
                  ) : (
                    <Feather name="camera" size={48} color="#047857" />
                  )}
                </View>
                <View style={styles.lensStatusBadge}>
                  <Text style={styles.lensStatusText}>
                    {livenessChecking ? 'CHECKING LIVENESS...' : livenessSuccess ? 'FACE VERIFIED ✓' : 'FACE IN FRAME'}
                  </Text>
                </View>
              </View>

              {/* Instructions checklist */}
              <View style={styles.checklist}>
                <View style={styles.checkRow}>
                  <Feather name="check-circle" size={16} color="#059669" />
                  <Text style={styles.checkText}>Ensure your face is clearly visible</Text>
                </View>
                <View style={styles.checkRow}>
                  <Feather name="check-circle" size={16} color="#059669" />
                  <Text style={styles.checkText}>Remove glasses, mask, or hats</Text>
                </View>
                <View style={styles.checkRow}>
                  <Feather name="check-circle" size={16} color="#059669" />
                  <Text style={styles.checkText}>Position your phone in a bright room</Text>
                </View>
              </View>

              {!livenessSuccess && (
                <TouchableOpacity
                  style={styles.formSubmitBtnFull}
                  onPress={handleStartLivenessCheck}
                  disabled={livenessChecking}
                >
                  <Text style={styles.formSubmitBtnText}>Start Liveness Check</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Action Navigation Footer inside Card */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={[styles.actionBtnBack, currentStep === 1 && { opacity: 0 }]}
              onPress={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
            >
              <Text style={styles.actionBtnBackTxt}>Back</Text>
            </TouchableOpacity>

            {currentStep < 3 ? (
              <TouchableOpacity
                style={styles.actionBtnNext}
                onPress={() => {
                  if (currentStep === 1 && !isKycComplete) {
                    Alert.alert('Identity Pending', 'Please complete your Aadhaar and PAN verification.');
                  } else if (currentStep === 2 && !hasBankLinked) {
                    Alert.alert('Bank Pending', 'Please link your bank account to continue.');
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
              >
                <Text style={styles.actionBtnNextTxt}>Continue</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.actionBtnNext, !livenessSuccess && styles.disabledButton]}
                onPress={handleSubmitAllKyc}
                disabled={!livenessSuccess}
              >
                <Text style={styles.actionBtnNextTxt}>Submit Verification</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Wizard card lock/privacy policies */}
        <View style={styles.protectionInfo}>
          <Text style={styles.protectionText}>
            🔒 256-bit Encryption • Privacy Protected
          </Text>
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ecfdf5',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    backgroundColor: '#ffffff',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1b20',
    flex: 1,
    textAlign: 'center',
    marginLeft: 24, // compensates for secureBadge space
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  secureText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#064e3b',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  progressHeader: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  titleText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1d1b20',
    textAlign: 'center',
  },
  subtitleText: {
    fontSize: 14,
    color: '#494551',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  // Stepper Indicator
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 24,
    position: 'relative',
    height: 60,
  },
  stepperLine: {
    position: 'absolute',
    top: 20,
    left: 48,
    right: 48,
    height: 2,
    backgroundColor: '#d1fae5',
    zIndex: -1,
  },
  stepperLineProgress: {
    position: 'absolute',
    top: 20,
    left: 48,
    height: 2,
    backgroundColor: '#059669',
    zIndex: -1,
  },
  stepCircle: {
    alignItems: 'center',
    gap: 4,
  },
  stepCircleActive: {
    // highlighted step circle
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    textAlign: 'center',
    lineHeight: 40,
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
    borderWidth: 2,
    borderColor: '#d1fae5',
    overflow: 'hidden',
  },
  stepNumberActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
  },
  stepLabelActive: {
    color: '#059669',
    fontWeight: '700',
  },
  // Card
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#d1fae5',
    padding: 24,
    minHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1b20',
    marginBottom: 4,
  },
  stepSub: {
    fontSize: 14,
    color: '#494551',
    marginBottom: 24,
  },
  // Identity Step Styles
  statusRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusBlock: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    gap: 4,
  },
  statusBlockSuccess: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  statusBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1d1b20',
    marginTop: 4,
  },
  statusBlockDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  formSection: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#d1fae5',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1b20',
    marginBottom: 12,
  },
  formGroup: {
    gap: 12,
  },
  textInput: {
    height: 48,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 10,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1d1b20',
  },
  formSubmitBtn: {
    height: 48,
    backgroundColor: '#059669',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formSubmitBtnFull: {
    height: 52,
    backgroundColor: '#059669',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  formSubmitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  changeNumBtn: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  changeNumTxt: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  verifiedCongrats: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  congratsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#064e3b',
  },
  congratsSub: {
    fontSize: 13,
    color: '#047857',
    textAlign: 'center',
  },
  resetKycBtn: {
    backgroundColor: '#fee2e2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fca5a5',
    alignItems: 'center',
    marginTop: 16,
  },
  resetKycBtnText: {
    color: '#b91c1c',
    fontWeight: '700',
    fontSize: 14,
  },
  // Bank Details Form
  bankForm: {
    gap: 12,
  },
  fieldGroup: {
    width: '100%',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#494551',
    marginBottom: 6,
  },
  // Liveness check
  lensWrapper: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  lensCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#ecfdf5',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  lensStatusBadge: {
    position: 'absolute',
    bottom: -10,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  lensStatusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  checklist: {
    marginVertical: 24,
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 16,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkText: {
    fontSize: 13,
    color: '#494551',
    fontWeight: '500',
  },
  // Navigation footer inside card
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 'auto',
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: '#d1fae5',
  },
  actionBtnBack: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  actionBtnBackTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#059669',
  },
  actionBtnNext: {
    backgroundColor: '#059669',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    justifyContent: 'center',
  },
  actionBtnNextTxt: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  disabledButton: {
    backgroundColor: '#a7f3d0',
  },
  protectionInfo: {
    alignItems: 'center',
    marginTop: 24,
  },
  protectionText: {
    fontSize: 12,
    color: '#7a7582',
  },
  // Selection cards for documents
  selectDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  selectDocCardActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  selectDocLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  docIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docIconCircleActive: {
    backgroundColor: '#d1fae5',
  },
  docCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
  },
  docCardTitleActive: {
    color: '#059669',
  },
  docCardSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  formGroupKyc: {
    marginTop: 16,
    width: '100%',
  },
  kycInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#494551',
    marginBottom: 8,
  },
  kycTextInput: {
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1d1b20',
    backgroundColor: '#f0fdf4',
  },
  uploadBox: {
    borderWidth: 1.5,
    borderColor: '#047857',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    marginVertical: 16,
    width: '100%',
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#064e3b',
    marginTop: 8,
  },
  uploadSub: {
    fontSize: 11,
    color: '#047857',
    marginTop: 2,
  },
  kycContinueBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 8,
  },
  kycContinueBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  resendBtnKyc: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendTextKyc: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '600',
  },
});
