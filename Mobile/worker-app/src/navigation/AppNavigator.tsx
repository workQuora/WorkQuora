import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
  ScrollView,
  SafeAreaView,
  Image,
  Alert,
  Switch,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store';
import { restoreToken, logoutUserSession } from '../store/authSlice';
import { Feather } from '@expo/vector-icons';
import api from '../services/api';
import { useTheme } from '../shared/theme/theme';

// Screens
// Shared Components & Screens
import WelcomeScreen from '../shared/screens/WelcomeScreen';
import LoginScreen from '../shared/screens/LoginScreen';
import RegisterScreen from '../shared/screens/RegisterScreen';
import OtpScreen from '../shared/screens/OtpScreen';
import ChatListScreen from '../shared/screens/ChatListScreen';
import ChatScreen from '../shared/screens/ChatScreen';
import TermsScreen from '../shared/screens/TermsScreen';
import NotificationScreen from '../shared/screens/NotificationScreen';
import SettingsScreen from '../shared/screens/SettingsScreen';
import NotificationSettingsScreen from '../shared/screens/NotificationSettingsScreen';
import CategoryChip from '../shared/components/CategoryChip';
import HomeScreen from '../screens/HomeScreen';
import BrowseGigsScreen from '../screens/BrowseGigsScreen';
import ActiveGigsScreen from '../screens/ActiveGigsScreen';
import WalletScreen from '../screens/WalletScreen';
import KycScreen from '../screens/KycScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import GigDetailsScreen from '../screens/GigDetailsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();

// ─── Auth Stack ───────────────────────────────────────────────────────────────
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="Otp" component={OtpScreen} />
      <AuthStack.Screen name="Terms" component={TermsScreen} />
    </AuthStack.Navigator>
  );
}

// ─── Login Gate ───────────────────────────────────────────────────────────────
function LoginGateScreen({ navigation, featureName }: { navigation: any; featureName?: string }) {
  return (
    <SafeAreaView style={gateStyles.root}>
      <View style={gateStyles.inner}>
        <View style={gateStyles.iconCircle}>
          <Feather name="lock" size={36} color="#fff" />
        </View>
        <Text style={gateStyles.title}>Sign in to continue</Text>
        <Text style={gateStyles.sub}>
          {featureName
            ? `${featureName} is only available for logged‑in users.`
            : 'Create an account or sign in to access this feature.'}
        </Text>
        <TouchableOpacity
          style={gateStyles.loginBtn}
          onPress={() => navigation.navigate('ProfileTab')}
        >
          <Text style={gateStyles.loginBtnTxt}>Log in</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={gateStyles.registerBtn}
          onPress={() => navigation.navigate('ProfileTab')}
        >
          <Text style={gateStyles.registerBtnTxt}>Create new account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────
function ProfileTabScreen({ navigation }: { navigation: any }) {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  const [profileData, setProfileData] = useState<any>(null);
  const [roleSwitch, setRoleSwitch] = useState(false);

  // Edit Profile States
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const currentUsername = profileData?.username || user?.username || '';
  const currentName = profileData?.name || user?.name || '';

  const handleSaveProfile = async () => {
    if (!editName.trim() || !editUsername.trim()) {
      Alert.alert('Error', 'Name and Username are required.');
      return;
    }

    const cleanUsername = editUsername.trim().toLowerCase().replace(/[^a-z0-9_.]/g, '');

    // Username change month limit check
    if (cleanUsername !== currentUsername) {
      const lastChangeKey = `last_username_change_${user?._id}`;
      const lastChangeDate = await AsyncStorage.getItem(lastChangeKey);
      if (lastChangeDate) {
        const nextAllowedDate = new Date(lastChangeDate);
        nextAllowedDate.setMonth(nextAllowedDate.getMonth() + 1);

        if (new Date() < nextAllowedDate) {
          const daysLeft = Math.ceil((nextAllowedDate.getTime() - Date.now()) / (1000 * 3600 * 24));
          Alert.alert(
            'Limit Reached',
            `You can only change your username once a month. You can change it again in ${daysLeft} days.`
          );
          return;
        }
      }
    }

    setSavingProfile(true);
    try {
      const res = await api.put('/profile/update', {
        name: editName.trim(),
        username: cleanUsername,
        bio: editBio.trim(),
      });
      if (res.data?.success) {
        Alert.alert('Success', 'Profile updated successfully!');
        if (cleanUsername !== currentUsername) {
          const lastChangeKey = `last_username_change_${user?._id}`;
          await AsyncStorage.setItem(lastChangeKey, new Date().toISOString());
        }
        setEditProfileModalVisible(false);
        fetchProfileData();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const fetchProfileData = async () => {
    try {
      const response = await api.get('/profile/me');
      if (response.data?.success) {
        setProfileData(response.data?.data || response.data.data);
      }
    } catch (e) {
      console.error('Failed to load profile stats:', e);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchProfileData();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchProfileData();
    });
    return unsubscribe;
  }, [navigation, isAuthenticated]);

  const handleRoleSwitch = () => {
    setRoleSwitch(!roleSwitch);
    Alert.alert(
      'Switch to Client',
      'To post jobs and hire talent, please open the WorkQuora Client App.'
    );
    setTimeout(() => setRoleSwitch(false), 500);
  };

  const handleHelp = () => {
    Alert.alert('Help & Support', 'Email us at support@workquora.com or visit our Help Center.');
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[profileStyles.root, { backgroundColor: '#ecfdf5' }]}>
        <ScrollView contentContainerStyle={profileStyles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={profileStyles.authHeader}>
            <View style={profileStyles.guestAvatar}>
              <Feather name="user" size={40} color="#047857" />
            </View>
            <Text style={profileStyles.authName}>Guest User</Text>
            <Text style={profileStyles.authHandle}>@guest</Text>
          </View>

          {/* CTA Buttons */}
          <View style={profileStyles.authBtns}>
            <TouchableOpacity
              style={[profileStyles.loginBtn, { backgroundColor: '#059669' }]}
              onPress={() => navigation.navigate('AuthModal')}
            >
              <Text style={profileStyles.loginBtnTxt}>Log in</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={profileStyles.signupBtn}
              onPress={() => navigation.navigate('AuthModal', { screen: 'Register' })}
            >
              <Text style={[profileStyles.signupBtnTxt, { color: '#059669' }]}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Feature list */}
          <View style={profileStyles.featureSection}>
            <Text style={profileStyles.featureSectionTitle}>What you unlock</Text>
            {[
              { icon: 'briefcase' as const, title: 'Apply for Gigs', sub: 'Browse & apply to local jobs near you' },
              { icon: 'dollar-sign' as const, title: 'Earn & Withdraw', sub: 'Get paid directly to your bank account' },
              { icon: 'shield' as const, title: 'KYC Verification', sub: 'Get the verified worker badge' },
              { icon: 'message-circle' as const, title: 'Chat with Clients', sub: 'Coordinate jobs in real-time' },
            ].map((f, i) => (
              <View key={i} style={profileStyles.featureRow}>
                <View style={profileStyles.featureIconBox}>
                  <Feather name={f.icon} size={18} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={profileStyles.featureTitle}>{f.title}</Text>
                  <Text style={profileStyles.featureSub}>{f.sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Authenticated profile details
  const initials = user?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const completedJobs = profileData?.earnings?.completedJobs || profileData?.totalJobsCompleted || 0;
  const allTimeIncome = profileData?.earnings?.allTimeIncome || 0;
  const averageRating = profileData?.averageRating || 5.0;
  const isKycComplete = profileData?.kycVerified || profileData?.kyc?.status === 'verified';
  const avatarUrl = profileData?.avatar || profileData?.profilePic || null;
  const userGender = profileData?.gender || user?.gender || 'OTHER';
  const defaultAvatar = (userGender.toUpperCase() === 'MALE')
    ? 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack'
    : (userGender.toUpperCase() === 'FEMALE')
      ? 'https://api.dicebear.com/7.x/avataaars/png?seed=Lily'
      : 'https://api.dicebear.com/7.x/avataaars/png?seed=User';
  const finalAvatarUrl = avatarUrl || defaultAvatar;

  return (
    <SafeAreaView style={[profileStyles.root, { backgroundColor: '#ecfdf5' }]}>
      {/* Top Bar Header */}
      <View style={profileStyles.topHeaderBar}>
        <Text style={profileStyles.topHeaderTitle}>WorkQuora</Text>
        <TouchableOpacity style={profileStyles.secureBadge} onPress={handleHelp}>
          <Feather name="help-circle" size={18} color="#059669" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={profileStyles.scroll} showsVerticalScrollIndicator={false}>
        
        {/* Profile Card */}
        <View style={profileStyles.profileCard}>
          <View style={profileStyles.avatarRing}>
            <View style={profileStyles.avatarInner}>
              <Image source={{ uri: finalAvatarUrl }} style={profileStyles.avatarImage} />
            </View>
            <TouchableOpacity 
              style={[profileStyles.cameraButton, { backgroundColor: '#059669' }]} 
              activeOpacity={0.8}
            >
              <Feather name="camera" size={14} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <View style={profileStyles.profileHeaderDetails}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={profileStyles.authName}>{currentName}</Text>
              {isKycComplete && (
                <Feather name="check-circle" size={18} color="#059669" style={{ marginLeft: 6 }} />
              )}
            </View>
            <Text style={profileStyles.profileRoleSub}>
              {profileData?.bio || 'Senior UI/UX Designer & Product Strategy Consultant'}
            </Text>
          </View>

          {/* Edit Profile Button inside Profile Card */}
          <TouchableOpacity
            style={profileStyles.editProfileBtn}
            onPress={() => {
              setEditName(profileData?.name || user?.name || '');
              setEditUsername(profileData?.username || user?.username || '');
              setEditBio(profileData?.bio || (user as any)?.bio || '');
              setEditProfileModalVisible(true);
            }}
          >
            <Feather name="edit-2" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={profileStyles.editProfileBtnTxt}>Edit Profile</Text>
          </TouchableOpacity>

          {/* Horizontal profile divider */}
          <View style={profileStyles.profileDivider} />

          {/* Stats Grid */}
          <View style={profileStyles.statsContainer}>
            <View style={profileStyles.statBox}>
              <Text style={[profileStyles.statNum, { color: '#059669' }]}>{averageRating.toFixed(1)}</Text>
              <Text style={profileStyles.statLabel}>RATING</Text>
            </View>
            <View style={profileStyles.statBox}>
              <Text style={[profileStyles.statNum, { color: '#059669' }]}>{completedJobs}</Text>
              <Text style={profileStyles.statLabel}>GIGS DONE</Text>
            </View>
          </View>
        </View>

        {/* Settings & Privacy Section Title & Subtitle */}
        <View style={profileStyles.sectionHeadingContainer}>
          <Text style={profileStyles.sectionHeading}>Settings & Privacy</Text>
          <Text style={profileStyles.sectionSubtitle}>
            Manage your account preferences and security
          </Text>
        </View>

        {/* Settings List */}
        <View style={profileStyles.bentoMenu}>
          
          {/* Security */}
          <TouchableOpacity
            style={profileStyles.menuRow}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[profileStyles.menuIconBox, { backgroundColor: '#e0f2fe' }]}>
              <Feather name="shield" size={18} color="#0284c7" />
            </View>
            <View style={profileStyles.menuTextContainer}>
              <Text style={profileStyles.menuLabel}>Security</Text>
              <Text style={profileStyles.menuSubLabel}>Two-factor authentication, Safety PIN, KYC</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            style={profileStyles.menuRow}
            onPress={() => navigation.navigate('NotificationSettings')}
          >
            <View style={[profileStyles.menuIconBox, { backgroundColor: '#f3e8ff' }]}>
              <Feather name="bell" size={18} color="#9333ea" />
            </View>
            <View style={profileStyles.menuTextContainer}>
              <Text style={profileStyles.menuLabel}>Notifications</Text>
              <Text style={profileStyles.menuSubLabel}>Email, Push alerts, SMS updates</Text>
            </View>
            <View style={profileStyles.badgeContainer}>
              <Text style={profileStyles.badgeText}>3 NEW</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {/* Language */}
          <TouchableOpacity
            style={profileStyles.menuRow}
            onPress={() => navigation.navigate('Settings')}
          >
            <View style={[profileStyles.menuIconBox, { backgroundColor: '#fef3c7' }]}>
              <Feather name="globe" size={18} color="#d97706" />
            </View>
            <View style={profileStyles.menuTextContainer}>
              <Text style={profileStyles.menuLabel}>Language</Text>
              <Text style={profileStyles.menuSubLabel}>English (United States)</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {/* Help Center */}
          <TouchableOpacity
            style={profileStyles.menuRow}
            onPress={handleHelp}
          >
            <View style={[profileStyles.menuIconBox, { backgroundColor: '#d1fae5' }]}>
              <Feather name="help-circle" size={18} color="#059669" />
            </View>
            <View style={profileStyles.menuTextContainer}>
              <Text style={profileStyles.menuLabel}>Help Center</Text>
              <Text style={profileStyles.menuSubLabel}>FAQs, Contact Support, Community</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            style={[profileStyles.menuRow, { borderBottomWidth: 0 }]}
            onPress={() => dispatch(logoutUserSession())}
          >
            <View style={[profileStyles.menuIconBox, { backgroundColor: '#fee2e2' }]}>
              <Feather name="log-out" size={18} color="#dc2626" />
            </View>
            <View style={profileStyles.menuTextContainer}>
              <Text style={profileStyles.menuLabel}>Logout</Text>
              <Text style={profileStyles.menuSubLabel}>Securely exit your account session</Text>
            </View>
            <Feather name="chevron-right" size={16} color="#9ca3af" />
          </TouchableOpacity>

        </View>

        {/* Decorative Bento grid elements */}
        <View style={profileStyles.bentoDecoGrid}>
          <View style={[profileStyles.decoCard, { backgroundColor: '#10b981' }]}>
            <Feather name="award" size={24} color="rgba(255,255,255,0.25)" style={profileStyles.decoIcon} />
            <Text style={profileStyles.decoLabel}>Account Status</Text>
            <Text style={profileStyles.decoVal}>Premium Member</Text>
          </View>
          <View style={[profileStyles.decoCard, { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#10b981' }]}>
            <Feather name="trending-up" size={24} color="rgba(16,185,129,0.15)" style={profileStyles.decoIcon} />
            <Text style={[profileStyles.decoLabel, { color: '#065f46' }]}>Earnings this Month</Text>
            <Text style={[profileStyles.decoVal, { color: '#065f46' }]}>₹{allTimeIncome.toLocaleString('en-IN')}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editProfileModalVisible}
        onRequestClose={() => setEditProfileModalVisible(false)}
      >
        <View style={profileStyles.editModalOverlay}>
          <View style={profileStyles.editModalCard}>
            <View style={profileStyles.editModalHeader}>
              <Text style={profileStyles.editModalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditProfileModalVisible(false)} style={profileStyles.editModalCloseBtn}>
                <Feather name="x" size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={profileStyles.editModalScroll} showsVerticalScrollIndicator={false}>
              
              {/* Name field */}
              <View style={profileStyles.editInputGroup}>
                <Text style={profileStyles.editInputLabel}>Full Name</Text>
                <TextInput
                  style={profileStyles.editInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Full Name"
                />
              </View>

              {/* Username field */}
              <View style={profileStyles.editInputGroup}>
                <Text style={profileStyles.editInputLabel}>Username (1 change per month)</Text>
                <TextInput
                  style={profileStyles.editInput}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="username"
                  autoCapitalize="none"
                />
              </View>

              {/* Bio field */}
              <View style={profileStyles.editInputGroup}>
                <Text style={profileStyles.editInputLabel}>Bio / Headline</Text>
                <TextInput
                  style={[profileStyles.editInput, { height: 80, paddingTop: 10, textAlignVertical: 'top' }]}
                  value={editBio}
                  onChangeText={setEditBio}
                  placeholder="Tell clients about your professional skills"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Save changes Button */}
              <TouchableOpacity
                style={[profileStyles.editSaveBtn, { backgroundColor: '#6366f1' }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={profileStyles.editSaveBtnTxt}>Save Changes</Text>
                )}
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Protected wrapper ────────────────────────────────────────────────────────
function Protected({
  Screen,
  navigation,
  featureName,
}: {
  Screen: React.ComponentType<any>;
  navigation: any;
  featureName?: string;
}) {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  return isAuthenticated ? (
    <Screen navigation={navigation} />
  ) : (
    <LoginGateScreen navigation={navigation} featureName={featureName} />
  );
}

// ─── Chat stack ───────────────────────────────────────────────────────────────
function ChatStack({ navigation }: { navigation: any }) {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  if (!isAuthenticated) return <LoginGateScreen navigation={navigation} featureName="Chats" />;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="ChatDetail" component={ChatScreen} />
    </Stack.Navigator>
  );
}

// ─── Active Gigs stack (protected) ───────────────────────────────────────────
function ActiveGigsStack({ navigation }: { navigation: any }) {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);
  if (!isAuthenticated) return <LoginGateScreen navigation={navigation} featureName="My Gigs" />;
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActiveGigsMain" component={ActiveGigsScreen} />
      <Stack.Screen name="Kyc" component={KycScreen} />
    </Stack.Navigator>
  );
}

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#8e8e8e',
        tabBarStyle: {
          height: 68,
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingBottom: Platform.OS === 'ios' ? 16 : 8,
          paddingTop: 8,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        },
        tabBarItemStyle: {
          padding: 0,
        },
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, any> = {
            Home: 'home',
            Discover: 'compass',
            Chat: 'message-square',
            ProfileTab: 'user',
          };
          const labels: Record<string, string> = {
            Home: 'Home',
            Discover: 'Discover',
            Chat: 'Chats',
            ProfileTab: 'Profile',
          };
          const name = icons[route.name] || 'circle';
          const label = labels[route.name] || '';

          if (focused) {
            return (
              <View style={[navBarStyles.activeTabItem, { backgroundColor: colors.accent }]}>
                <Feather name={name} size={18} color={colors.primary} />
                <Text style={[navBarStyles.activeTabLabel, { color: colors.primary }]}>{label}</Text>
              </View>
            );
          } else {
            return (
              <View style={navBarStyles.inactiveTabItem}>
                <Feather name={name} size={20} color="#9ca3af" />
                <Text style={navBarStyles.inactiveTabLabel}>{label}</Text>
              </View>
            );
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Discover" component={BrowseGigsScreen} />
      <Tab.Screen name="Chat">
        {({ navigation }) => <ChatStack navigation={navigation} />}
      </Tab.Screen>
      <Tab.Screen name="ProfileTab" component={ProfileTabScreen} />
    </Tab.Navigator>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    dispatch(restoreToken());
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={splashStyle.root}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={splashStyle.txt}>WorkQuora</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainApp" component={MainTabs} />
        <Stack.Screen name="AuthModal" component={AuthNavigator} options={{ presentation: 'fullScreenModal' }} />
        {/* Deep-link screens accessible from Profile tab */}
        <Stack.Screen name="ActiveGigsStack" component={ActiveGigsStack as any} />
        <Stack.Screen name="Kyc" component={KycScreen} />
        <Stack.Screen name="Discover" component={DiscoverScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="GigDetails" component={GigDetailsScreen} />
        <Stack.Screen name="Earnings">
          {({ navigation }) => (
            <Protected Screen={WalletScreen} navigation={navigation} featureName="Earnings" />
          )}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const tabBarStyle = {
  height: 70,
  backgroundColor: '#fff',
  borderTopWidth: StyleSheet.hairlineWidth,
  borderTopColor: '#dbdbdb',
  paddingBottom: Platform.OS === 'ios' ? 15 : 5,
  paddingTop: 5,
};

const splashStyle = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  txt: { marginTop: 14, fontSize: 22, fontWeight: '700', color: '#000', letterSpacing: -0.5 },
});

const gateStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#8e8e8e', textAlign: 'center', lineHeight: 20, marginBottom: 32 },
  loginBtn: {
    width: '100%',
    backgroundColor: '#0095f6',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  loginBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 15 },
  registerBtn: {
    width: '100%',
    backgroundColor: '#eff7ff',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  registerBtnTxt: { color: '#0095f6', fontWeight: '700', fontSize: 15 },
});

const profileStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fdf7ff' },
  scroll: { paddingBottom: 40 },

  // Guest header
  guestHeader: { alignItems: 'center', paddingTop: 30, paddingBottom: 20 },
  guestAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#efefef',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  // Authenticated header & details
  authHeader: { alignItems: 'center', paddingTop: 30, paddingBottom: 20 },
  authName: { fontSize: 20, fontWeight: '700', color: '#1d1b20' },
  authHandle: { fontSize: 13, color: '#7a7582', marginTop: 2 },
  
  // Guest CTA
  authBtns: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  loginBtn: {
    flex: 1,
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginBtnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
  signupBtn: {
    flex: 1,
    backgroundColor: '#efefef',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  signupBtnTxt: { color: '#000', fontWeight: '600', fontSize: 14 },

  // Feature section
  featureSection: { paddingHorizontal: 16, paddingTop: 20 },
  featureSectionTitle: { fontSize: 13, fontWeight: '700', color: '#7a7582', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#efefef',
  },
  featureIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTitle: { fontSize: 14, fontWeight: '600', color: '#1d1b20' },
  featureSub: { fontSize: 12, color: '#7a7582', marginTop: 1 },

  // Settings menu
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1d1b20',
    letterSpacing: 0.2,
  },

  // Bento layout styles
  topHeaderBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#cbc4d2',
    backgroundColor: '#ffffff',
  },
  topHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10b981',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#cbc4d2',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  avatarRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#d1fae5',
    padding: 2,
    position: 'relative',
    marginBottom: 12,
  },
  avatarInner: {
    flex: 1,
    borderRadius: 45,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  editProfileBtn: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
    width: '100%',
  },
  editProfileBtnTxt: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    width: '100%',
    marginBottom: 16,
  },
  sectionHeadingContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#7a7582',
    marginTop: 2,
  },
  badgeContainer: {
    backgroundColor: '#ef4444',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  editModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    padding: 20,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1d1b20',
  },
  editModalCloseBtn: {
    padding: 4,
  },
  editModalScroll: {
    paddingVertical: 15,
  },
  editInputGroup: {
    marginBottom: 16,
  },
  editInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7a7582',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
    color: '#1d1b20',
  },
  editSaveBtn: {
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  editSaveBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  profileHeaderDetails: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileRoleSub: {
    fontSize: 13,
    color: '#7a7582',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    paddingTop: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNum: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#7a7582',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#cbc4d2',
  },
  roleSwitchCard: {
    backgroundColor: '#f8f2fa',
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#cbc4d2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleSwitchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleSwitchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d1b20',
  },
  roleSwitchSub: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  bentoMenu: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#cbc4d2',
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#efefef',
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '700', color: '#1d1b20' },
  menuTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  menuSubLabel: {
    fontSize: 11,
    color: '#7a7582',
    marginTop: 2,
  },
  rowVerifiedTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bentoDecoGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 12,
    marginBottom: 30,
  },
  decoCard: {
    flex: 1,
    height: 100,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  decoIcon: {
    position: 'absolute',
    right: -5,
    bottom: -5,
    transform: [{ scale: 1.5 }],
  },
  decoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
  decoVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  secureBadge: {
    padding: 4,
  },
});

// Bottom navigation style wrappers
const navBarStyles = StyleSheet.create({
  activeTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    height: 38,
    gap: 6,
  },
  activeTabLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  inactiveTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'column',
    height: 42,
  },
  inactiveTabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8e8e8e',
    marginTop: 2,
  },
});
