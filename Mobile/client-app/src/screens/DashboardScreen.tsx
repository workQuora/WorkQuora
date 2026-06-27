import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Modal,
  Alert,
  Image,
  Platform,
  FlatList,
  Dimensions,
  Animated,
  Switch,
} from 'react-native';
import api, { getApiData } from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Feather } from '@expo/vector-icons';
import { updateUser } from '../store/authSlice';
import { useKycGate } from '../shared/hooks/useKycGate';
import * as Location from 'expo-location';
import AdBanner from '../shared/components/AdBanner';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface Job {
  _id: string;
  title: string;
  category: string;
  budget: number;
  status: string;
  location?: { address?: string };
}

interface DashboardData {
  finances: { escrowBalance: number };
  stats: { totalJobsPosted: number; activeJobs: number; completedJobs: number };
  recentJobs: Job[];
}

interface Freelancer {
  id: string;
  name: string;
  role: string;
  rating: number;
  skills: string[];
  image: string;
  isVerified: boolean;
}

const CATEGORIES = [
  { key: 'All',        label: 'All',       icon: 'grid' },
  { key: 'Designers',  label: 'Designers', icon: 'pen-tool' },
  { key: 'Developers', label: 'Dev',       icon: 'code' },
  { key: 'Marketing',  label: 'Marketing', icon: 'trending-up' },
];

// ─── Ad Data (replace with API call later) ────────────────────────────────────
const AD_DATA = [
  {
    id: '1',
    tag: 'SPONSORED',
    brand: 'Groww',
    headline: 'Invest smarter.\nEarn more from your savings.',
    cta: 'Start Investing',
    bg: ['#1a1a2e', '#16213e'],
    accent: '#e94560',
    icon: '📈',
  },
  {
    id: '2',
    tag: 'AD',
    brand: 'Swiggy Business',
    headline: 'Hungry team?\nOrder office meals in bulk.',
    cta: 'Explore Offers',
    bg: ['#1a1200', '#2d1f00'],
    accent: '#ff6600',
    icon: '🍔',
  },
  {
    id: '3',
    tag: 'PROMOTED',
    brand: 'Razorpay',
    headline: 'Accept payments\nseamlessly with Razorpay.',
    cta: 'Get Started Free',
    bg: ['#0a1628', '#0f2744'],
    accent: '#3395ff',
    icon: '💳',
  },
];

// ─── Ad Carousel Component ────────────────────────────────────────────────────
function AdCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  const slideTo = useCallback(
    (next: number) => {
      if (isAnimating.current) return;
      isAnimating.current = true;

      // Slide out left
      Animated.timing(translateX, {
        toValue: -width,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        // Jump to start instantly (no animation), update index
        translateX.setValue(width);
        setActiveIndex(next);
        // Slide in from right
        Animated.timing(translateX, {
          toValue: 0,
          duration: 380,
          useNativeDriver: true,
        }).start(() => {
          isAnimating.current = false;
        });
      });
    },
    [translateX]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % AD_DATA.length;
        slideTo(next);
        return prev; // actual update happens inside slideTo via setActiveIndex
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [slideTo]);

  const ad = AD_DATA[activeIndex];

  return (
    <View style={adStyles.wrapper}>
      <Animated.View
        style={[
          adStyles.card,
          { backgroundColor: ad.bg[0], transform: [{ translateX }] },
        ]}
      >
        {/* Decorative gradient blob */}
        <View style={[adStyles.blob, { backgroundColor: ad.accent }]} />

        {/* Top row: tag + brand */}
        <View style={adStyles.topRow}>
          <View style={[adStyles.tagBadge, { borderColor: ad.accent }]}>
            <Text style={[adStyles.tagText, { color: ad.accent }]}>{ad.tag}</Text>
          </View>
          <Text style={adStyles.brandText}>{ad.brand}</Text>
        </View>

        {/* Icon */}
        <Text style={adStyles.adIcon}>{ad.icon}</Text>

        {/* Headline */}
        <Text style={adStyles.headline}>{ad.headline}</Text>

        {/* CTA */}
        <TouchableOpacity
          style={[adStyles.ctaBtn, { backgroundColor: ad.accent }]}
          activeOpacity={0.85}
        >
          <Text style={adStyles.ctaText}>{ad.cta}</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Dot indicators */}
      <View style={adStyles.dots}>
        {AD_DATA.map((_, i) => (
          <View
            key={i}
            style={[
              adStyles.dot,
              i === activeIndex && adStyles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const adStyles = StyleSheet.create({
  wrapper: { marginBottom: 24 },
  card: {
    borderRadius: 20,
    padding: 20,
    height: 168,
    overflow: 'hidden',
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    right: -30,
    top: -30,
    opacity: 0.18,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  tagBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  brandText: { color: 'rgba(255,255,255,0.55)', fontSize: 12, fontWeight: '700' },
  adIcon: { fontSize: 26, marginBottom: 6 },
  headline: { color: '#fff', fontSize: 15, fontWeight: '800', lineHeight: 21, marginBottom: 14 },
  ctaBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#d1d5db',
  },
  dotActive: {
    width: 20, height: 6, borderRadius: 3,
    backgroundColor: '#4f46e5',
  },
});

export default function DashboardScreen({ navigation }: { navigation: any }) {
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();
  const requireKycOrToast = useKycGate();

  // Dashboard data
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Talent
  const [talent, setTalent] = useState<Freelancer[]>([]);
  const [talentLoading, setTalentLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Location modal
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [inputCity, setInputCity] = useState('');
  const [inputZip, setInputZip] = useState('');
  const [manualUpdating, setManualUpdating] = useState(false);
  const [autoUpdating, setAutoUpdating] = useState(false);

  // Post Job Modal
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobCategory, setJobCategory] = useState('Electrician');
  const [jobBudget, setJobBudget] = useState(500);
  const [jobAddress, setJobAddress] = useState('');
  const [jobIsUrgent, setJobIsUrgent] = useState(false);
  const [posting, setPosting] = useState(false);
  const [categoryDropdownVisible, setCategoryDropdownVisible] = useState(false);

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/dashboard/client');
      const data = getApiData(res);
      if (data) setDashboard(data);
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  const fetchTalent = useCallback(async (cat = selectedCategory, kw = searchQuery) => {
    setTalentLoading(true);
    try {
      const lat = user?.location?.coordinates?.[1] ?? 23.2599;
      const lng = user?.location?.coordinates?.[0] ?? 77.4126;
      const res = await api.get('/geo/nearby-freelancers', {
        params: { lat, lng, radius: 25, keyword: kw || undefined },
      });
      const raw: any[] = res.data?.freelancers ?? res.data?.data ?? [];

      const mapped: Freelancer[] = raw.map((f: any) => {
        const skillsList: string[] = f.skills?.filter(
          (s: string) => !['Designers', 'Developers', 'Marketing'].includes(s)
        ) ?? [];
        const textChunk = [...skillsList, f.title ?? ''].join(' ').toLowerCase();
        let fCat = 'Developers';
        if (textChunk.includes('design')) fCat = 'Designers';
        else if (textChunk.includes('market') || textChunk.includes('seo')) fCat = 'Marketing';

        const avatar = f.avatar || f.profilePic;
        const gender = (f.gender ?? 'OTHER').toUpperCase();
        const defaultAvatar =
          gender === 'MALE'
            ? 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack'
            : gender === 'FEMALE'
            ? 'https://api.dicebear.com/7.x/avataaars/png?seed=Lily'
            : 'https://api.dicebear.com/7.x/avataaars/png?seed=User';

        return {
          id: f._id ?? f.id,
          name: f.name ?? 'Expert',
          role: f.title || (skillsList[0] ? `${skillsList[0]} Specialist` : 'Freelancer'),
          rating: f.averageRating > 0 ? f.averageRating : 4.8,
          skills: skillsList.slice(0, 3),
          image: avatar ?? defaultAvatar,
          isVerified: !!(f.kycVerified),
          category: fCat,
        } as any;
      });

      const filtered =
        cat === 'All' ? mapped : mapped.filter((f: any) => f.category === cat);
      setTalent(filtered);
    } catch (e) {
      console.error('Talent fetch error:', e);
    } finally {
      setTalentLoading(false);
    }
  }, [user?.location, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchDashboardData();
    fetchTalent();
    const unsub = navigation.addListener('focus', () => {
      fetchDashboardData();
      fetchTalent();
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    fetchTalent(selectedCategory, searchQuery);
  }, [selectedCategory]);

  // ─── Location handlers ────────────────────────────────────────────────────

  const saveLocation = async (lat: number, lng: number, addr: string, city: string) => {
    const apiRes = await api.put('/geo/update-location', {
      latitude: lat, longitude: lng, address: addr, city,
    });
    if (apiRes.data?.success && apiRes.data?.user) {
      dispatch(updateUser(apiRes.data.user));
      Alert.alert('Location Updated', addr);
      setLocationModalVisible(false);
      setInputCity(''); setInputZip('');
      fetchTalent();
    } else {
      Alert.alert('Error', 'Failed to save location.');
    }
  };

  const handleManualUpdate = async () => {
    if (!inputCity.trim() || !inputZip.trim()) {
      Alert.alert('Validation', 'Please enter both city and zip code.'); return;
    }
    setManualUpdating(true);
    try {
      const q = encodeURIComponent(`${inputCity.trim()} ${inputZip.trim()} India`);
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { 'User-Agent': 'WorkQuoraApp/1.0' } }
      );
      const results = await r.json();
      if (!results?.length) {
        Alert.alert('Not Found', 'Could not locate that city/zip. Try again.'); return;
      }
      const lat = parseFloat(results[0].lat);
      const lng = parseFloat(results[0].lon);
      await saveLocation(lat, lng, `${inputCity.trim()}, ${inputZip.trim()}`, inputCity.trim());
    } catch (e) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setManualUpdating(false);
    }
  };

  const handleAutoDetect = async () => {
    try {
      setAutoUpdating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Access Denied', 'Permission to access location was denied');
        setAutoUpdating(false);
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
        { headers: { 'User-Agent': 'WorkQuoraApp/1.0' } }
      );
      const data = await r.json();
      const city =
        data.address?.city || data.address?.town || data.address?.village || 'Nearby';
      const zip = data.address?.postcode ?? '';
      const addr = zip ? `${city}, ${zip}` : city;
      await saveLocation(latitude, longitude, addr, city);
    } catch (e) {
      console.error('Geo error', e);
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setAutoUpdating(false);
    }
  };

  // ─── Post Job ─────────────────────────────────────────────────────────────

  const handlePostJob = async () => {
    if (!jobTitle.trim()) { Alert.alert('Error', 'Gig title is required.'); return; }
    if (!jobDescription.trim()) { Alert.alert('Error', 'Description is required.'); return; }
    if (!jobAddress.trim()) { Alert.alert('Error', 'Location is required.'); return; }
    setPosting(true);
    try {
      const res = await api.post('/jobs', {
        title: jobTitle.trim(),
        description: jobDescription.trim(),
        budget: jobBudget,
        category: jobCategory,
        location: { type: 'Point', address: jobAddress.trim(), coordinates: [77.2090, 28.6139] },
        isUrgent: jobIsUrgent,
      });
      if (res.data?.success) {
        Alert.alert('Posted!', 'Your gig is live.');
        setPostModalVisible(false);
        setJobTitle(''); setJobDescription(''); setJobAddress(''); setJobBudget(500); setJobIsUrgent(false);
        fetchDashboardData();
      } else Alert.alert('Error', res.data?.message || 'Could not post job.');
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.message || 'Could not post job.');
    } finally { setPosting(false); }
  };

  // ─── Derived values ───────────────────────────────────────────────────────

  const userName = user?.name ?? 'Guest';
  const firstName = userName.split(' ')[0];
  const escrowBalance = dashboard?.finances?.escrowBalance ?? 0;
  const totalPosted = dashboard?.stats?.totalJobsPosted ?? 0;
  const activeJobs = dashboard?.stats?.activeJobs ?? 0;
  const completedJobs = dashboard?.stats?.completedJobs ?? 0;
  const recentJobs = dashboard?.recentJobs ?? [];

  const locationLabel =
    user?.location?.address &&
    user.location.address.trim() !== '' &&
    user.location.address !== '0, 0'
      ? user.location.address
      : 'Set your location';

  // ─── Talent card ──────────────────────────────────────────────────────────

  const renderTalentCard = ({ item }: { item: Freelancer }) => (
    <TouchableOpacity
      style={styles.talentCard}
      activeOpacity={0.88}
      onPress={() =>
        navigation.navigate('Chat', {
          screen: 'ChatDetail',
          params: { otherUserId: item.id, otherUserName: item.name, jobId: '000000000000000000000000' },
        })
      }
    >
      <View style={styles.talentImageBox}>
        <Image source={{ uri: item.image }} style={styles.talentImage as any} />
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingBadgeText}>★ {item.rating.toFixed(1)}</Text>
        </View>
        {item.isVerified && (
          <View style={styles.verifiedBadge}>
            <Feather name="check" size={8} color="#fff" />
          </View>
        )}
      </View>
      <View style={styles.talentInfo}>
        <Text style={styles.talentName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.talentRole} numberOfLines={1}>{item.role}</Text>
        <View style={styles.skillPills}>
          {item.skills.slice(0, 2).map((s, i) => (
            <View key={i} style={styles.skillPill}>
              <Text style={styles.skillPillText}>{s}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── Loading screen ───────────────────────────────────────────────────────

  if (loading && isAuthenticated) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading your portal…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Main Render ──────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { fetchDashboardData(true); fetchTalent(); }}
            tintColor="#4f46e5"
          />
        }
        stickyHeaderIndices={[0]}
      >
        {/* ── Dark Header ── */}
        <View style={styles.header}>
          {/* Row 1: greeting + wallet + avatar */}
          <View style={styles.headerRow1}>
            <View style={{ flex: 1 }}>
              <Text style={styles.helloText}>Hello, {firstName} 👋</Text>
              <TouchableOpacity
                style={styles.locationPill}
                onPress={() => setLocationModalVisible(true)}
                activeOpacity={0.7}
              >
                <Feather name="map-pin" size={11} color="#a5b4fc" />
                <Text style={styles.locationPillText} numberOfLines={1}>{locationLabel}</Text>
                <Feather name="chevron-down" size={11} color="#a5b4fc" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.walletPill}
              onPress={() => navigation.navigate('Wallet')}
              activeOpacity={0.85}
            >
              <Feather name="dollar-sign" size={13} color="#fbbf24" />
              <Text style={styles.walletText}>₹{escrowBalance}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 4, marginHorizontal: 8 }}
              onPress={() => navigation.navigate('Notification')}
              activeOpacity={0.7}
            >
              <Feather name="bell" size={20} color="#a5b4fc" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarCircle}
              onPress={() => navigation.navigate('ProfileTab')}
              activeOpacity={0.8}
            >
              {(user as any)?.profilePic || (user as any)?.avatar ? (
                <Image source={{ uri: (user as any).profilePic || (user as any).avatar }} style={{ width: '100%', height: '100%', borderRadius: 19 }} />
              ) : (
                <Text style={styles.avatarLetter}>{firstName[0]?.toUpperCase()}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Row 2: Search bar */}
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color="#94a3b8" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search workers, skills, roles…"
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => fetchTalent(selectedCategory, searchQuery)}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={() => fetchTalent(selectedCategory, searchQuery)}>
              <Feather name="mic" size={16} color="#4f46e5" />
            </TouchableOpacity>
          </View>

          {/* Row 3: Category chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ paddingRight: 12 }}>
            {CATEGORIES.map((c) => {
              const active = selectedCategory === c.key;
              return (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => setSelectedCategory(c.key)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.catIcon, active && styles.catIconActive]}>
                    <Feather name={c.icon as any} size={14} color={active ? '#fff' : '#4f46e5'} />
                  </View>
                  <Text style={[styles.catLabel, active && styles.catLabelActive]}>{c.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Body ── */}
        <View style={styles.body}>

          {/* Stats row */}
          <View style={styles.statsRow}>
            {[
              { icon: 'briefcase', val: totalPosted, label: 'Total Gigs', color: '#4f46e5' },
              { icon: 'clock',     val: activeJobs,  label: 'Active',     color: '#f59e0b' },
              { icon: 'check-circle', val: completedJobs, label: 'Done',  color: '#10b981' },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Feather name={s.icon as any} size={18} color={s.color} />
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Advertisement Carousel ── */}
          <AdCarousel />

          {/* Recommended Talent */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended Talent</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Discover')}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {talentLoading ? (
            <View style={styles.talentLoader}>
              <ActivityIndicator color="#4f46e5" />
            </View>
          ) : talent.length === 0 ? (
            <View style={styles.emptyTalent}>
              <Feather name="user-x" size={32} color="#cbd5e1" />
              <Text style={styles.emptyTalentText}>No freelancers found nearby.</Text>
              <Text style={styles.emptyTalentSub}>Update your location to discover talent around you.</Text>
            </View>
          ) : (
            <FlatList
              data={talent.slice(0, 6)}
              renderItem={renderTalentCard}
              keyExtractor={(i) => i.id}
              numColumns={2}
              columnWrapperStyle={styles.talentRow}
              scrollEnabled={false}
            />
          )}

          {/* Active Gigs */}
          {recentJobs.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Posted Gigs</Text>
              </View>
              {recentJobs.map((job) => (
                <TouchableOpacity
                  key={job._id}
                  style={styles.gigCard}
                  onPress={() =>
                    navigation.navigate('ManageProposals', { jobId: job._id, jobTitle: job.title })
                  }
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.gigTitle} numberOfLines={1}>{job.title}</Text>
                    <Text style={styles.gigSub}>
                      ₹{job.budget} · {job.category || 'General'}
                    </Text>
                  </View>
                  <View style={[styles.statusChip, job.status === 'open' && styles.statusOpen]}>
                    <Text style={[styles.statusText, job.status === 'open' && styles.statusTextOpen]}>
                      {(job.status ?? 'OPEN').toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── FAB ── */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => requireKycOrToast(() => setPostModalVisible(true), 'Complete KYC to post a job')}
        activeOpacity={0.88}
      >
        <Feather name="plus" size={20} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.fabText}>Post a Job</Text>
      </TouchableOpacity>

      {/* ── Location Modal ── */}
      <Modal
        animationType="slide"
        transparent
        visible={locationModalVisible}
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Update Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Feather name="x" size={20} color="#1d1b20" />
              </TouchableOpacity>
            </View>

            {/* Auto detect */}
            <TouchableOpacity
              style={[styles.autoBtn, autoUpdating && styles.btnDisabled]}
              onPress={handleAutoDetect}
              disabled={autoUpdating || manualUpdating}
              activeOpacity={0.85}
            >
              {autoUpdating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <Feather name="navigation" size={15} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.autoBtnText}>Use Current Location</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orLabel}>OR ENTER MANUALLY</Text>
              <View style={styles.orLine} />
            </View>

            <Text style={styles.fieldLabel}>City Name</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Bhopal"
              placeholderTextColor="#94a3b8"
              value={inputCity}
              onChangeText={setInputCity}
            />

            <Text style={styles.fieldLabel}>PIN Code (Zip)</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 462001"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              value={inputZip}
              onChangeText={setInputZip}
            />

            <TouchableOpacity
              style={[styles.saveBtn, manualUpdating && styles.btnDisabled]}
              onPress={handleManualUpdate}
              disabled={manualUpdating || autoUpdating}
              activeOpacity={0.85}
            >
              {manualUpdating ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Update Location</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Post Job Modal ── */}
      <Modal
        visible={postModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPostModalVisible(false)}
      >
        <SafeAreaView style={styles.postModalRoot}>
          <View style={styles.postModalHeader}>
            <TouchableOpacity onPress={() => setPostModalVisible(false)} style={{ padding: 4 }}>
              <Feather name="arrow-left" size={22} color="#1d1b20" />
            </TouchableOpacity>
            <Text style={styles.postModalTitle}>Post a New Gig</Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Gig Title *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Living room wiring fix"
              placeholderTextColor="#9ca3af"
              value={jobTitle}
              onChangeText={setJobTitle}
            />

            <Text style={styles.fieldLabel}>Category *</Text>
            <TouchableOpacity
              style={styles.dropdownTrigger}
              onPress={() => setCategoryDropdownVisible(true)}
            >
              <Text style={{ color: '#1d1b20', fontSize: 14 }}>{jobCategory}</Text>
              <Feather name="chevron-down" size={16} color="#6366f1" />
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Description *</Text>
            <TextInput
              style={[styles.fieldInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
              placeholder="Describe the work to be done…"
              placeholderTextColor="#9ca3af"
              multiline
              value={jobDescription}
              onChangeText={setJobDescription}
            />

            <Text style={styles.fieldLabel}>Budget (₹) *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. 1500"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={String(jobBudget)}
              onChangeText={(v) => setJobBudget(parseInt(v) || 0)}
            />

            <Text style={styles.fieldLabel}>Location / Address *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. MP Nagar, Bhopal"
              placeholderTextColor="#9ca3af"
              value={jobAddress}
              onChangeText={setJobAddress}
            />

            <View style={styles.switchRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.switchLabel}>Emergency / Urgent Gig</Text>
                <Text style={styles.switchSublabel}>Mark this gig as urgent to highlight it to workers</Text>
              </View>
              <Switch
                value={jobIsUrgent}
                onValueChange={setJobIsUrgent}
                trackColor={{ false: '#e2e8f0', true: '#c7d2fe' }}
                thumbColor={jobIsUrgent ? '#4f46e5' : '#cbd5e1'}
              />
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, posting && styles.btnDisabled, { marginTop: 8, marginBottom: 40 }]}
              onPress={handlePostJob}
              disabled={posting}
              activeOpacity={0.85}
            >
              {posting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Post Gig</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Category picker modal */}
      <Modal
        visible={categoryDropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryDropdownVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryDropdownVisible(false)}
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Select Category</Text>
            {['Electrician','Plumber','Cleaner','AC Repair','Painter','Carpenter','Other'].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.pickerItem, jobCategory === cat && styles.pickerItemActive]}
                onPress={() => { setJobCategory(cat); setCategoryDropdownVisible(false); }}
              >
                <Text style={[styles.pickerItemText, jobCategory === cat && { color: '#4f46e5', fontWeight: '700' }]}>
                  {cat}
                </Text>
                {jobCategory === cat && <Feather name="check" size={15} color="#4f46e5" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8f7ff' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#6366f1', fontSize: 14 },

  // Header (dark)
  header: {
    backgroundColor: '#1e1b4b',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow1: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  helloText: { color: '#f1f5f9', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  locationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
    alignSelf: 'flex-start',
  },
  locationPillText: { color: '#a5b4fc', fontSize: 11, fontWeight: '700', maxWidth: 160 },
  walletPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(251,191,36,0.12)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 10,
  },
  walletText: { color: '#fbbf24', fontWeight: '800', fontSize: 13 },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#4f46e5',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(165,180,252,0.35)',
  },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, height: 46,
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#1d1b20',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },

  // Categories
  catScroll: { marginBottom: 4 },
  catChip: {
    alignItems: 'center', marginRight: 16,
    opacity: 0.7,
  },
  catChipActive: { opacity: 1 },
  catIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(79,70,229,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 4,
  },
  catIconActive: { backgroundColor: '#4f46e5' },
  catLabel: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  catLabelActive: { color: '#a5b4fc', fontWeight: '800' },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 20 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'flex-start', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statVal: { fontSize: 20, fontWeight: '800', color: '#1d1b20' },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  // Promo banner
  promoBanner: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20, padding: 20,
    marginBottom: 24, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'flex-end',
  },
  promoTag: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 8, marginBottom: 8,
  },
  promoTagText: { color: '#a5b4fc', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  promoHeading: { color: '#fff', fontSize: 16, fontWeight: '800', lineHeight: 22, marginBottom: 16 },
  promoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fff', alignSelf: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
  },
  promoBtnText: { color: '#1e1b4b', fontWeight: '800', fontSize: 13 },

  // Section header
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1d1b20' },
  viewAll: { fontSize: 13, fontWeight: '700', color: '#4f46e5' },

  // Talent grid
  talentRow: { justifyContent: 'space-between', marginBottom: 14 },
  talentCard: {
    width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  talentImageBox: { width: '100%', height: CARD_WIDTH * 0.85, position: 'relative' },
  talentImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  ratingBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(15,23,42,0.7)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  ratingBadgeText: { color: '#fbbf24', fontSize: 11, fontWeight: '800' },
  verifiedBadge: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: '#4f46e5',
    width: 18, height: 18, borderRadius: 9,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  talentInfo: { padding: 10 },
  talentName: { fontSize: 13, fontWeight: '800', color: '#1d1b20', marginBottom: 2 },
  talentRole: { fontSize: 11, color: '#64748b', marginBottom: 6 },
  skillPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  skillPill: {
    backgroundColor: '#f8f7ff', paddingHorizontal: 6,
    paddingVertical: 2, borderRadius: 8,
  },
  skillPillText: { fontSize: 9, color: '#6366f1', fontWeight: '700' },

  talentLoader: { paddingVertical: 32, alignItems: 'center' },
  emptyTalent: { alignItems: 'center', paddingVertical: 32 },
  emptyTalentText: { fontSize: 15, fontWeight: '700', color: '#64748b', marginTop: 10 },
  emptyTalentSub: { fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' },

  // Gig cards
  gigCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  gigTitle: { fontSize: 14, fontWeight: '700', color: '#1d1b20' },
  gigSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  statusChip: {
    backgroundColor: '#f1f5f9', paddingHorizontal: 8,
    paddingVertical: 4, borderRadius: 8,
  },
  statusOpen: { backgroundColor: '#d1fae5' },
  statusText: { fontSize: 9, fontWeight: '800', color: '#475569' },
  statusTextOpen: { color: '#059669' },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 18,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#4f46e5', borderRadius: 28,
    paddingHorizontal: 18, paddingVertical: 12,
    shadowColor: '#4f46e5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabText: { color: '#fff', fontWeight: '800', fontSize: 14 },

  // Location modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  locationModal: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#e2e8f0',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#1d1b20' },
  autoBtn: {
    height: 48, backgroundColor: '#4f46e5', borderRadius: 24,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginBottom: 14,
  },
  autoBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnDisabled: { opacity: 0.55 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  orLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700', marginHorizontal: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#6366f1', marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#f8f7ff', borderRadius: 10,
    paddingHorizontal: 14, height: 46, marginBottom: 14,
    fontSize: 14, color: '#1d1b20',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  saveBtn: {
    height: 48, backgroundColor: '#4f46e5', borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },

  // Post job modal
  postModalRoot: { flex: 1, backgroundColor: '#fff' },
  postModalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    height: 56, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingHorizontal: 16,
  },
  postModalTitle: { fontSize: 17, fontWeight: '800', color: '#1d1b20' },
  dropdownTrigger: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#f8f7ff', borderRadius: 10, paddingHorizontal: 14, height: 46, marginBottom: 14,
  },

  // Category picker
  pickerCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, margin: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 6,
  },
  pickerTitle: { fontSize: 16, fontWeight: '800', color: '#1d1b20', marginBottom: 10, paddingHorizontal: 4 },
  pickerItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 8, borderRadius: 10,
  },
  pickerItemActive: { backgroundColor: '#f8f7ff' },
  pickerItemText: { fontSize: 14, color: '#1d1b20' },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f7ff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e1b4b',
    marginBottom: 2,
  },
  switchSublabel: {
    fontSize: 12,
    color: '#6366f1',
    lineHeight: 16,
  },
});
