import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loginUserSession } from '../store/authSlice';
import api, { getApiData } from '../services/api';

interface OtpScreenProps {
  route: any;
  navigation: any;
}

export default function OtpScreen({ route, navigation }: OtpScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const email = route.params?.email || '';
  const [emailOtp, setEmailOtp] = useState('');
  const [mobileOtp, setMobileOtp] = useState('');
  const [step, setStep] = useState<'EMAIL' | 'MOBILE'>('EMAIL');
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async () => {
    if (!emailOtp) return Alert.alert('Error', 'Please enter the Email OTP.');
    setLoading(true);
    try {
      await api.post('/auth/verify-registration', { email, otp: emailOtp });
      setStep('MOBILE');
      Alert.alert('Email Verified', 'A 6-digit OTP has been sent to your Mobile Number.');
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid Email OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMobile = async () => {
    if (!mobileOtp) return Alert.alert('Error', 'Please enter the Mobile OTP.');
    setLoading(true);
    try {
      const response = await api.post('/auth/verify-mobile', { email, otp: mobileOtp });
      const responseData = response.data;

      if (responseData && responseData.token && responseData.user) {
        const { user, token } = responseData;
        Alert.alert('Verification Successful', 'Please read and agree to our Terms & Conditions to complete registration.');
        navigation.navigate('Terms', { user, token });
      } else {
        Alert.alert('Error', 'Invalid verification response. Please try logging in.');
        navigation.navigate('Login');
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.response?.data?.message || 'Invalid Mobile OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.logoText}>Verify Client Account</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>{step === 'EMAIL' ? 'Email OTP' : 'Mobile OTP'}</Text>
            <Text style={styles.cardSubtitle}>
              {step === 'EMAIL' ? 'We sent a 6-digit code to:' : 'We sent a 6-digit code to your Mobile Number for:'}{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor="#bbb"
                value={step === 'EMAIL' ? emailOtp : mobileOtp}
                onChangeText={step === 'EMAIL' ? setEmailOtp : setMobileOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[styles.verifyButton, loading && styles.disabledButton]}
              onPress={step === 'EMAIL' ? handleVerifyEmail : handleVerifyMobile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>Verify & Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButtonText: {
    color: '#1e3a8a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e3a8a',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
  },
  emailHighlight: {
    fontWeight: '700',
    color: '#1e3a8a',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  otpInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 16,
    paddingVertical: 16,
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: 8,
  },
  verifyButton: {
    backgroundColor: '#1e3a8a',
    borderRadius: 16,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#1e3a8a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
