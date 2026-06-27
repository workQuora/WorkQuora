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
import api from '../../services/api';
import { useTheme } from '../theme/theme';

interface OtpScreenProps {
  route: any;
  navigation: any;
}

export default function OtpScreen({ route, navigation }: OtpScreenProps) {
  const { colors, isClient } = useTheme();
  const email = route.params?.email || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-registration', { email, otp });
      const responseData = response.data;

      if (responseData && responseData.token && responseData.user) {
        const { user, token } = responseData;
        Alert.alert(
          'Verification Successful',
          'Please read and agree to our Terms & Conditions to complete registration.'
        );
        navigation.navigate('Terms', { user, token });
      } else {
        Alert.alert('Error', 'Invalid verification response. Please try logging in.');
        navigation.navigate('Login');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Invalid or expired OTP.';
      Alert.alert('Verification Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: colors.primary }]}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={[styles.logoText, { color: colors.primary }]}>
              {isClient ? 'Verify Client Account' : 'Verify Worker Account'}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Enter OTP</Text>
            <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
              We sent a 6-digit verification code to:{'\n'}
              <Text style={[styles.emailHighlight, { color: colors.primary }]}>{email}</Text>
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.otpInput, { color: colors.text, borderBottomColor: colors.primary }]}
                placeholder="000000"
                placeholderTextColor="#bbb"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                textAlign="center"
                autoFocus
              />
            </View>

            <TouchableOpacity
              style={[
                styles.verifyButton,
                { backgroundColor: colors.primary },
                loading && styles.disabledButton,
              ]}
              onPress={handleVerify}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={[styles.verifyButtonText, { color: colors.white }]}>VERIFY & LOGIN →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Code Resent',
                  'If the email is valid, a new verification code will arrive shortly.'
                );
              }}
              style={styles.resendButton}
            >
              <Text style={[styles.resendText, { color: colors.primary }]}>Didn't receive email? Resend code</Text>
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  backButton: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
  },
  emailHighlight: {
    fontWeight: '700',
  },
  inputContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  otpInput: {
    width: 200,
    height: 50,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 8,
    borderBottomWidth: 2,
    paddingBottom: 4,
  },
  verifyButton: {
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
  verifyButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 20,
    padding: 4,
  },
  resendText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
