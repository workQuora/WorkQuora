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
  Image,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store';
import { loginUserSession } from '../store/authSlice';
import api from '../services/api';
import { useLanguage } from '../services/i18n';
import { Feather } from '@expo/vector-icons';

interface LoginScreenProps {
  navigation: any;
}

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { locale, setLocale, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password states
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
        
        if (user.role !== 'CLIENT') {
          Alert.alert(
            'Access Denied',
            'This app is for Clients/Employers only. Please use the Worker App.'
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
      Alert.alert('OTP Sent', 'Check your developer console/email for the 6-digit reset OTP.');
      setOtpSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to request reset OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!forgotEmail || !resetOtp || !newPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: forgotEmail,
        otp: resetOtp,
        newPassword
      });
      Alert.alert('Success', 'Password reset successfully! You can now log in.');
      setForgotMode(false);
      setOtpSent(false);
      setForgotEmail('');
      setResetOtp('');
      setNewPassword('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (platform: string) => {
    Alert.alert('Social Authentication', `${platform} login requires Expo Native App IDs. Once configured, this will trigger the OAuth flow and call POST /auth/social.`);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Decorative Blurs */}
      <View style={styles.topBlur} />
      <View style={styles.bottomBlur} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          
          {/* Language Selector Row */}
          <View style={styles.languageSelectorRow}>
            <TouchableOpacity onPress={() => setLocale('en')} style={[styles.langBtn, locale === 'en' && styles.langBtnActive]}>
              <Text style={[styles.langText, locale === 'en' && styles.langTextActive]}>English</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLocale('hi')} style={[styles.langBtn, locale === 'hi' && styles.langBtnActive]}>
              <Text style={[styles.langText, locale === 'hi' && styles.langTextActive]}>हिंदी</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLocale('bn')} style={[styles.langBtn, locale === 'bn' && styles.langBtnActive]}>
              <Text style={[styles.langText, locale === 'bn' && styles.langTextActive]}>বাংলা</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLocale('bho')} style={[styles.langBtn, locale === 'bho' && styles.langBtnActive]}>
              <Text style={[styles.langText, locale === 'bho' && styles.langTextActive]}>भोजपुरी</Text>
            </TouchableOpacity>
          </View>

          {/* Top Branding Section */}
          <View style={styles.headerContainer}>
            <View style={styles.logoIconContainer}>
              <Feather name="repeat" size={40} color="#1e3a8a" style={styles.logoIcon} />
            </View>
            <Text style={styles.logoText}>WorkQuora</Text>
            <Text style={styles.subLogoText}>
              Connect with top opportunities and talent in one seamless marketplace.
            </Text>
          </View>

          {forgotMode ? (
            /* Forgot Password Card */
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Reset Password</Text>
              <Text style={styles.cardSubtitle}>
                {!otpSent ? 'Request an OTP to reset your password' : 'Enter details to change password'}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={[styles.input, otpSent && { backgroundColor: '#f1f5f9', color: '#94a3b8' }]}
                  placeholder="example@gmail.com"
                  placeholderTextColor="#94a3b8"
                  value={forgotEmail}
                  onChangeText={setForgotEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!otpSent}
                />
              </View>

              {otpSent && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>6-Digit OTP</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="000000"
                      placeholderTextColor="#94a3b8"
                      value={resetOtp}
                      onChangeText={setResetOtp}
                      keyboardType="numeric"
                      maxLength={6}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>New Password</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="••••••••"
                      placeholderTextColor="#94a3b8"
                      value={newPassword}
                      onChangeText={setNewPassword}
                      secureTextEntry
                      autoCapitalize="none"
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={!otpSent ? handleRequestOtp : handleResetPassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.primaryButtonText}>
                      {!otpSent ? 'Send Reset OTP' : 'Reset Password'}
                    </Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToSignInBtn}
                onPress={() => {
                  setForgotMode(false);
                  setOtpSent(false);
                }}
              >
                <Text style={styles.backToSignInTxt}>Back to Sign In</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Login Form Card */
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{t('loginTitle')}</Text>
              <Text style={styles.cardSubtitle}>{t('loginSubtitle')}</Text>

              {/* Email / Username Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('emailLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="example@gmail.com or username"
                  placeholderTextColor="#94a3b8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('passwordLabel')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#94a3b8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              {/* Forgot Password Link */}
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => setForgotMode(true)}
              >
                <Text style={styles.forgotTxt}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Login Submit Button */}
              <TouchableOpacity
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonContent}>
                    <Text style={styles.primaryButtonText}>Continue</Text>
                    <Feather name="arrow-right" size={18} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>

              {/* OR Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login Buttons */}
              <View style={styles.socialRow}>
                {/* Google Button */}
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('Google')}
                >
                  <Image
                    source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuALSvcpd4ooRWOPQrGOj3oaW3I_AXVZw5X07Fkh1vH0hG6mLsDq8Ni7WG9wfHQ9tWmjQp2-8QF62M1uVT1J1Zk-Cl5Ngq3Akg8Or-5CBblKMx0HaO6JazSbj4xzGWce6SvNGROZtzd7tXtKEOFh6VhdZ-MfiYNeFQTBKFXPe_moFwWOkUaZTX8Q-laKBAYL3bc6i0SEEzobw5aESbKqCxCcQ50gU21kEsuvohKRmwyuRi4whb9gVYqK3JVjy-XvT7oMqsRDcAyryUAF' }}
                    style={styles.googleIcon}
                    resizeMode="contain"
                  />
                  <Text style={styles.socialText}>Google</Text>
                </TouchableOpacity>

                {/* Facebook Button */}
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={() => handleSocialLogin('Facebook')}
                >
                  <View style={[styles.whatsappIconBox, { backgroundColor: '#1877F2' }]}>
                    <Feather name="facebook" size={20} color="#fff" />
                  </View>
                  <Text style={styles.socialText}>Facebook</Text>
                </TouchableOpacity>
              </View>

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerPrefix}>New to the platform? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                  <Text style={styles.registerLink}>Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Footer Policy */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to WorkQuora's{' '}
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Terms')}>Terms of Service</Text> and{' '}
              <Text style={styles.footerLink} onPress={() => navigation.navigate('Terms')}>Privacy Policy</Text>.
            </Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 12,
  },
  // Language Selector Row
  languageSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 6,
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  langBtnActive: {
    backgroundColor: '#eff7ff',
    borderColor: '#1e3a8a',
    borderWidth: 1.5,
  },
  langText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  langTextActive: {
    color: '#1e3a8a',
    fontWeight: '800',
  },
  // Top Branding Section
  headerContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  logoIconContainer: {
    marginBottom: 12,
  },
  logoIcon: {
    transform: [{ scaleX: -1 }],
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: -0.5,
  },
  subLogoText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
  // Card layout
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
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  input: {
    height: 56,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#0f172a',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    paddingVertical: 2,
  },
  forgotTxt: {
    color: '#1e3a8a',
    fontWeight: '700',
    fontSize: 14,
  },
  primaryButton: {
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
  disabledButton: {
    backgroundColor: '#93c5fd',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  whatsappIconBox: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerPrefix: {
    fontSize: 14,
    color: '#475569',
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e3a8a',
  },
  // Footer
  footer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  footerLink: {
    textDecorationLine: 'underline',
  },
  // Blurs
  topBlur: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(30, 58, 138, 0.05)',
    zIndex: -1,
  },
  bottomBlur: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    zIndex: -1,
  },
  backToSignInBtn: {
    marginTop: 16,
    alignItems: 'center',
  },
  backToSignInTxt: {
    color: '#1e3a8a',
    fontWeight: '700',
    fontSize: 14,
  },
});
