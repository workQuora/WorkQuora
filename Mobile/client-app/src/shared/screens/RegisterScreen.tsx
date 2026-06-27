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
import { useLanguage } from '../../services/i18n';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

interface RegisterScreenProps {
  navigation: any;
}

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { t } = useLanguage();
  const { colors, role, isClient } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState('MALE'); // MALE / FEMALE
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !username || !mobileNumber || !password) {
      Alert.alert('Error', 'All fields are required.');
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
        role: role, // Dynamically use the active app role: CLIENT or FREELANCER
      });

      if (response.data?.success) {
        Alert.alert(
          'Verification Code Sent',
          'A 6-digit OTP code has been sent to your registration email.'
        );
        navigation.navigate('Otp', { email });
      } else {
        Alert.alert('Registration Failed', response.data?.message || 'Please try again.');
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Registration failed. Please verify fields.';
      Alert.alert('Error', errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.bg }]}>
      {/* Decorative background gradients */}
      <View style={[styles.topBlur, { backgroundColor: colors.primary + '10' }]} />
      <View style={[styles.bottomBlur, { backgroundColor: colors.primary + '15' }]} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header Bar */}
        <View style={[styles.headerBar, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="chevron-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>WorkQuora</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.signInBtn}>
            <Text style={[styles.signInBtnText, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
          
          <View style={styles.brandContainer}>
            <Text style={[styles.brandTitle, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.brandSubtitle, { color: colors.textMuted }]}>
              {isClient ? 'Sign up to hire local workers' : 'Sign up to browse & apply to gigs'}
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            
            {/* Target Role Path selections */}
            <View style={styles.pathCardWrapper}>
              <View style={[styles.pathCard, { borderColor: colors.primary, backgroundColor: colors.accent }]}>
                <View style={[styles.pathCircle, { backgroundColor: colors.primary }]}>
                  <Feather name={isClient ? 'briefcase' : 'users'} size={16} color={colors.white} />
                </View>
                <View style={styles.pathInfo}>
                  <Text style={[styles.pathTitle, { color: colors.primary }]}>
                    {isClient ? 'Hire Local Service' : 'Find Gigs / Work'}
                  </Text>
                  <Text style={[styles.pathSub, { color: colors.textMuted }]}>
                    {isClient ? 'CLIENT ACCOUNT' : 'WORKER ACCOUNT'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                <Feather name="user" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Rahul Sharma"
                  placeholderTextColor={colors.textMuted + '80'}
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Username (Unique)</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                <Feather name="at-sign" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="rahul_sharma"
                  placeholderTextColor={colors.textMuted + '80'}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Email Address</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                <Feather name="mail" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="rahul@domain.com"
                  placeholderTextColor={colors.textMuted + '80'}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Mobile Number</Text>
              <View style={[styles.inputWrapper, { borderColor: colors.border, backgroundColor: colors.grayLight }]}>
                <Feather name="phone" size={18} color={colors.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="9876543210"
                  placeholderTextColor={colors.textMuted + '80'}
                  value={mobileNumber}
                  onChangeText={setMobileNumber}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Password</Text>
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

            {/* Gender Selection Grid */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Gender</Text>
              <View style={styles.genderGrid}>
                <TouchableOpacity
                  style={[
                    styles.genderCard,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    gender === 'MALE' && { borderColor: colors.primary, backgroundColor: colors.accent },
                  ]}
                  onPress={() => setGender('MALE')}
                  activeOpacity={0.8}
                >
                  <Feather name="user" size={18} color={gender === 'MALE' ? colors.primary : colors.textMuted} />
                  <Text style={[styles.genderText, { color: gender === 'MALE' ? colors.primary : colors.text }]}>
                    Male
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderCard,
                    { borderColor: colors.border, backgroundColor: colors.card },
                    gender === 'FEMALE' && { borderColor: colors.primary, backgroundColor: colors.accent },
                  ]}
                  onPress={() => setGender('FEMALE')}
                  activeOpacity={0.8}
                >
                  <Feather name="user-plus" size={18} color={gender === 'FEMALE' ? colors.primary : colors.textMuted} />
                  <Text style={[styles.genderText, { color: gender === 'FEMALE' ? colors.primary : colors.text }]}>
                    Female
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms checkbox */}
            <TouchableOpacity
              style={styles.termsWrapper}
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.8}
            >
              <View style={[
                styles.checkbox,
                { borderColor: colors.primary },
                termsAccepted && { backgroundColor: colors.primary }
              ]}>
                {termsAccepted && <Feather name="check" size={12} color={colors.white} />}
              </View>
              <Text style={[styles.termsText, { color: colors.text }]}>
                I agree to the Terms of Service & Privacy Policy.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.white }]}>REGISTER & SEND OTP →</Text>
              )}
            </TouchableOpacity>

          </View>

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
    top: -120,
    left: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  bottomBlur: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
  },
  keyboardView: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signInBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  signInBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  brandContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  brandSubtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  pathCardWrapper: {
    marginBottom: 20,
  },
  pathCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
  },
  pathCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pathInfo: {
    flex: 1,
  },
  pathTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  pathSub: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
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
  genderGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  genderCard: {
    flex: 1,
    flexDirection: 'row',
    height: 46,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    gap: 8,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '700',
  },
  termsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  termsText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  submitBtn: {
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
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  copyrightText: {
    fontSize: 10,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '500',
  },
});
