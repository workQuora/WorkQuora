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
import api from '../services/api';
import { useLanguage } from '../services/i18n';
import { Feather, FontAwesome } from '@expo/vector-icons';

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('MALE'); // MALE / FEMALE
  const [role, setRole] = useState('FREELANCER'); // CLIENT / FREELANCER
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !username || !mobileNumber || !password) {
      Alert.alert(t('errorTitle'), t('allFieldsRequired'));
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Terms Required', 'You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name,
        email,
        username,
        mobileNumber,
        password,
        gender,
        role: 'FREELANCER', // Always freelancer for the worker app
      });

      if (response.data?.success) {
        Alert.alert(
          t('otpSentTitle'),
          t('otpSentMsg')
        );
        navigation.navigate('Otp', { email });
      } else {
        Alert.alert(t('registrationFailed'), response.data?.message || t('pleaseTryAgain'));
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || t('pleaseTryAgain');
      Alert.alert(t('errorTitle'), errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole: string) => {
    if (selectedRole === 'client') {
      Alert.alert(
        'Switch App',
        'To register as a Client / Employer, please download and use the WorkQuora Client App.'
      );
    } else {
      setRole('FREELANCER');
    }
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
        {/* Header bar */}
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>WorkQuora</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.signInHeaderBtn}>
            <Text style={styles.signInHeaderBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>Create your account</Text>
              <Text style={styles.cardSubtitle}>Select your path to get started</Text>
            </View>

            {/* Role Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>I want to...</Text>
              <View style={styles.roleCol}>
                {/* Client option */}
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    role === 'CLIENT' ? styles.roleCardActive : styles.roleCardInactive,
                  ]}
                  onPress={() => handleRoleSelect('client')}
                >
                  <View style={[
                    styles.roleIconCircle,
                    role === 'CLIENT' ? styles.roleIconCircleActive : styles.roleIconCircleInactive,
                  ]}>
                    <Feather name="briefcase" size={20} color={role === 'CLIENT' ? '#ffffff' : '#7a7582'} />
                  </View>
                  <View style={styles.roleTextCol}>
                    <Text style={role === 'CLIENT' ? styles.roleTitleActive : styles.roleTitle}>Hire Talent</Text>
                    <Text style={role === 'CLIENT' ? styles.roleSubActive : styles.roleSub}>I'm here to build a team</Text>
                  </View>
                </TouchableOpacity>

                {/* Worker option */}
                <TouchableOpacity
                  style={[
                    styles.roleCard,
                    role === 'FREELANCER' ? styles.roleCardActive : styles.roleCardInactive,
                  ]}
                  onPress={() => handleRoleSelect('worker')}
                >
                  <View style={[
                    styles.roleIconCircle,
                    role === 'FREELANCER' ? styles.roleIconCircleActive : styles.roleIconCircleInactive,
                  ]}>
                    <Feather name="tool" size={20} color={role === 'FREELANCER' ? '#ffffff' : '#7a7582'} />
                  </View>
                  <View style={styles.roleTextCol}>
                    <Text style={role === 'FREELANCER' ? styles.roleTitleActive : styles.roleTitle}>Find Work</Text>
                    <Text style={role === 'FREELANCER' ? styles.roleSubActive : styles.roleSub}>I'm a professional freelancer</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.fieldsContainer}>
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="user" size={18} color="#7a7582" style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="John Doe"
                    placeholderTextColor="#9ca3af"
                    value={name}
                    onChangeText={setName}
                  />
                </View>
              </View>

              {/* Username */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Username (Unique)</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="at-sign" size={18} color="#7a7582" style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="johndoe123"
                    placeholderTextColor="#9ca3af"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Email Address */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="mail" size={18} color="#7a7582" style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="name@company.com"
                    placeholderTextColor="#9ca3af"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Mobile Number */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="phone" size={18} color="#7a7582" style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor="#9ca3af"
                    value={mobileNumber}
                    onChangeText={setMobileNumber}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Feather name="lock" size={18} color="#7a7582" style={styles.inputIcon} />
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="••••••••"
                    placeholderTextColor="#9ca3af"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* Gender Selection */}
              <View style={styles.fieldGroup}>
                <Text style={styles.inputLabel}>Gender</Text>
                <View style={styles.genderRow}>
                  <TouchableOpacity
                    style={[styles.genderBtn, gender === 'MALE' && styles.genderBtnActive]}
                    onPress={() => setGender('MALE')}
                  >
                    <Text style={styles.genderEmoji}>👨</Text>
                    <Text style={[styles.genderText, gender === 'MALE' && styles.genderTextActive]}>Male</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.genderBtn, gender === 'FEMALE' && styles.genderBtnActive]}
                    onPress={() => setGender('FEMALE')}
                  >
                    <Text style={styles.genderEmoji}>👩</Text>
                    <Text style={[styles.genderText, gender === 'FEMALE' && styles.genderTextActive]}>Female</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Terms Agreement Checkbox */}
            <TouchableOpacity
              style={styles.termsWrapper}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
                {termsAccepted && <Feather name="check" size={12} color="#ffffff" />}
              </View>
              <Text style={styles.termsText}>
                By creating an account, I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink} onPress={() => navigation.navigate('Terms')}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            {/* Register Submit Button */}
            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Create Account</Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* Social Divider */}
            <View style={styles.socialDividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.socialDividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Buttons */}
            <View style={styles.socialButtonsRow}>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <FontAwesome name="google" size={18} color="#EA4335" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
                <FontAwesome name="facebook" size={18} color="#1877F2" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer Navigation */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Footer Copyright */}
          <Text style={styles.copyrightText}>
            © 2024 WorkQuora Inc. All rights reserved.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fdf7ff',
  },
  keyboardView: {
    flex: 1,
  },
  headerBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#cbc4d2',
    backgroundColor: '#ffffff',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#10b981',
  },
  signInHeaderBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    backgroundColor: '#ffffff',
  },
  signInHeaderBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10b981',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#cbc4d2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1d1b20',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#494551',
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#494551',
    marginBottom: 8,
  },
  roleCol: {
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    width: '100%',
  },
  roleCardInactive: {
    borderColor: '#cbc4d2',
    backgroundColor: '#f8f2fa',
    opacity: 0.7,
  },
  roleCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  roleIconCircleInactive: {
    backgroundColor: '#e6e0e9',
  },
  roleIconCircleActive: {
    backgroundColor: '#10b981',
  },
  roleTextCol: {
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
  },
  roleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7a7582',
  },
  roleTitleActive: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  roleSub: {
    fontSize: 12,
    color: '#7a7582',
    marginTop: 2,
  },
  roleSubActive: {
    fontSize: 12,
    color: '#065f46',
    marginTop: 2,
  },
  fieldsContainer: {
    gap: 16,
  },
  fieldGroup: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbc4d2',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  fieldInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1d1b20',
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderBtn: {
    flex: 1,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbc4d2',
    borderRadius: 12,
  },
  genderBtnActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
    borderWidth: 2,
  },
  genderEmoji: {
    fontSize: 18,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#494551',
  },
  genderTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  termsWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#cbc4d2',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#494551',
    lineHeight: 16,
  },
  termsLink: {
    color: '#10b981',
    fontWeight: '700',
  },
  primaryButton: {
    height: 56,
    backgroundColor: '#10b981',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledButton: {
    backgroundColor: '#a7f3d0',
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
  socialDividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbc4d2',
  },
  socialDividerText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: '#7a7582',
    fontWeight: '600',
  },
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  socialButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbc4d2',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  socialIcon: {
    marginRight: 4,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1b20',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: '#494551',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '800',
    color: '#10b981',
  },
  copyrightText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#7a7582',
    marginTop: 32,
  },
  // Blurs
  topBlur: {
    position: 'absolute',
    top: -100,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    zIndex: -1,
  },
  bottomBlur: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    zIndex: -1,
  },
  inputGroup: {
    marginBottom: 16,
    width: '100%',
  },
});
