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
import { AppDispatch } from '../../store';
import { loginUserSession } from '../../store/authSlice';
import api from '../../services/api';
import { useLanguage } from '../../services/i18n';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useLanguage();
  const { colors, role, isClient } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password mode
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email/username and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const responseData = response.data;
      
      if (responseData && responseData.token && responseData.user) {
        const { user, token } = responseData;
        
        // Safety verification gate
        if (user.role !== role) {
          const appName = isClient ? 'Client App' : 'Worker App';
          const suggestedApp = isClient ? 'Worker App' : 'Client App';
          Alert.alert(
            'Access Denied',
            `This account is registered for another role. Please use the ${suggestedApp}.`
          );
          setLoading(false);
          return;
        }

        await dispatch(loginUserSession({ user, token }));
        const parentNav = navigation.getParent();
        if (parentNav) {
          parentNav.navigate('MainApp');
        } else {
          navigation.navigate('MainApp');
        }
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Invalid credentials.';
      Alert.alert('Login Failed', errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!forgotEmail) {
      Alert.alert('Error', 'Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      Alert.alert('OTP Sent', 'Check your email/console for the 6-digit OTP code.');
      setOtpSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to request reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotEmail || !resetOtp || !newPassword) {
      Alert.alert('Error', 'Please fill in all reset password fields.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: resetOtp,
        newPassword,
      });
      Alert.alert('Success', 'Password has been reset. Please login with your new password.');
      setForgotMode(false);
      setOtpSent(false);
      setEmail(forgotEmail);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: string) => {
    Alert.alert(
      `${provider} Authentication`,
      `Quick login via ${provider} is disabled in developer mode. Please use your standard login credentials.`
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Decorative Blurs */}
      <View style={[styles.topBlur, { backgroundColor: colors.primary + '10' }]} />
      <View style={[styles.bottomBlur, { backgroundColor: colors.primary + '15' }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header Bar */}
        <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Feather name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>WorkQuora</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.signUpHeaderBtn}>
            <Text style={[styles.signUpHeaderBtnText, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          {/* Logo Brand Header */}
          <View style={styles.brandContainer}>
            <View style={[styles.logoIconBox, { backgroundColor: colors.accent }]}>
              <Feather name="refresh-cw" size={32} color={colors.primary} />
            </View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>WorkQuora</Text>
            <Text style={[styles.brandSubtitle, { color: colors.primary }]}>
              {isClient ? 'Client Console' : 'Worker Console'}
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {!forgotMode ? (
              <>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Login</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  Enter details to access your dashboard
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text }]}>Email or Username</Text>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                    <Feather name="mail" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="name@domain.com"
                      placeholderTextColor={colors.textMuted + '80'}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
                    <TouchableOpacity onPress={() => setForgotMode(true)}>
                      <Text style={[styles.forgotLink, { color: colors.primary }]}>Forgot?</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                    <Feather name="lock" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      placeholder="••••••••"
                      placeholderTextColor={colors.textMuted + '80'}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.white} size="small" />
                  ) : (
                    <Text style={[styles.primaryButtonText, { color: colors.white }]}>LOG IN →</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Reset Password</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
                  Retrieve access to your account
                </Text>

                {!otpSent ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Account Email</Text>
                      <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                        <Feather name="mail" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="name@domain.com"
                          placeholderTextColor={colors.textMuted + '80'}
                          value={forgotEmail}
                          onChangeText={setForgotEmail}
                          autoCapitalize="none"
                          keyboardType="email-address"
                        />
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                      onPress={handleRequestOtp}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <Text style={[styles.primaryButtonText, { color: colors.white }]}>REQUEST OTP →</Text>
                      )}
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>Enter 6-Digit OTP</Text>
                      <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                        <Feather name="key" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="000000"
                          placeholderTextColor={colors.textMuted + '80'}
                          value={resetOtp}
                          onChangeText={setResetOtp}
                          keyboardType="number-pad"
                          maxLength={6}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.text }]}>New Password</Text>
                      <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                        <Feather name="lock" size={18} color={colors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          style={[styles.input, { color: colors.text }]}
                          placeholder="••••••••"
                          placeholderTextColor={colors.textMuted + '80'}
                          value={newPassword}
                          onChangeText={setNewPassword}
                          secureTextEntry
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                      onPress={handleResetPassword}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color={colors.white} size="small" />
                      ) : (
                        <Text style={[styles.primaryButtonText, { color: colors.white }]}>RESET PASSWORD →</Text>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity
                  onPress={() => {
                    setForgotMode(false);
                    setOtpSent(false);
                  }}
                  style={styles.backToLoginBtn}
                >
                  <Text style={[styles.backToLoginText, { color: colors.primary }]}>← Back to Login</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Social SSO Connectors */}
          <View style={styles.socialHeader}>
            <View style={[styles.socialLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.socialHeaderText, { color: colors.textMuted }]}>or connect with</Text>
            <View style={[styles.socialLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => handleSocialAuth('Google')}
              activeOpacity={0.8}
            >
              <FontAwesome name="google" size={18} color="#ea4335" />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Google</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.socialButton, { borderColor: colors.border, backgroundColor: colors.card }]}
              onPress={() => handleSocialAuth('Facebook')}
              activeOpacity={0.8}
            >
              <FontAwesome name="facebook" size={18} color="#1877f2" />
              <Text style={[styles.socialButtonText, { color: colors.text }]}>Facebook</Text>
            </TouchableOpacity>
          </View>

          {/* Copyright footer note */}
          <Text style={[styles.copyrightText, { color: colors.textMuted }]}>
            © 2026 WorkQuora Inc. All rights reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  topBlur: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  bottomBlur: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  keyboardView: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signUpHeaderBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  signUpHeaderBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 28,
  },
  logoIconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
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
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: '#fafafa',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  backToLoginBtn: {
    alignItems: 'center',
    marginTop: 16,
  },
  backToLoginText: {
    fontSize: 13,
    fontWeight: '700',
  },
  socialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  socialLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#ccc',
  },
  socialHeaderText: {
    fontSize: 12,
    color: '#888',
    paddingHorizontal: 12,
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  socialButtonText: {
    fontSize: 13,
    color: '#444',
    fontWeight: '700',
  },
  copyrightText: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '500',
  },
});
