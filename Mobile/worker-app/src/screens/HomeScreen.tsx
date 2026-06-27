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
} from 'react-native';
import api, { getApiData } from '../services/api';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useKycGate } from '../shared/hooks/useKycGate';
import * as Location from 'expo-location';
import { updateUser } from '../store/authSlice';
import AdBanner from '../shared/components/AdBanner';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  _id: string;
  status: string;
  job: { _id: string; title: string; budget: number; category?: string };
}

interface DashboardData {
  finances: { walletBalance: number; todayIncome: number; allTimeIncome: number };
  stats: { totalAssignedTasks: number; pendingTasks: number; completedTasks: number };
  recentTasks: Task[];
}

interface NearbyJob {
  _id: string;
  title: string;
  budget: number;
  category: string;
  status: string;
  distance: number;
  location?: { address?: string; coordinates?: number[] };
  pictures?: string[];
  clientInfo?: { name: string; profilePic?: string; avatar?: string };
}

// ─── Category chips ───────────────────────────────────────────────────────────

const CATEGORIES = [
  { key: 'All',         label: 'All',       icon: 'grid'       },
  { key: 'Electrician', label: 'Electric',  icon: 'zap'        },
  { key: 'Plumber',     label: 'Plumbing',  icon: 'droplet'    },
  { key: 'Carpenter',   label: 'Carpentry', icon: 'tool'       },
  { key: 'Cleaner',     label: 'Cleaning',  icon: 'wind'       },
  { key: 'IT',          label: 'IT / Tech', icon: 'code'       },
];

// ─── Category cover images (Unsplash) ─────────────────────────────────────────

const CATEGORY_IMAGES: Record<string, string> = {
  Electrician: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=60',
  Plumber:     'https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=400&q=60',
  Carpenter:   'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&q=60',
  Cleaner:     'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=60',
  IT:          'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&q=60',
  Default:     'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&q=60',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const dispatch = useDispatch();

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Nearby jobs
  const [jobs, setJobs] = useState<NearbyJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Location modal
  const [locationModal, setLocationModal] = useState(false);
  const [inputCity, setInputCity] = useState('');
  const [inputZip, setInputZip] = useState('');
  const [manualUpdating, setManualUpdating] = useState(false);
  const [autoUpdating, setAutoUpdating] = useState(false);

  // ─── Fetch dashboard ────────────────────────────────────────────────────────

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    if (!isAuthenticated) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/dashboard/freelancer');
      const data = getApiData(res);
      if (data) setDashboard(data);
    } catch (e) {
      console.error('Worker dashboard error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  // ─── Fetch nearby jobs ─────────────────────────────────────────────────────

  const fetchJobs = useCallback(async (cat = selectedCategory, kw = searchQuery) => {
    setJobsLoading(true);
    try {
      const lat = (user as any)?.location?.coordinates?.[1] ?? 23.2599;
      const lng = (user as any)?.location?.coordinates?.[0] ?? 77.4126;
      const params: any = { lat, lng, radius: 9999 };
      if (kw) params.keyword = kw;
      if (cat && cat !== 'All') params.category = cat;

      const res = await api.get('/geo/nearby-jobs', { params });
      const raw: NearbyJob[] = res.data?.jobs ?? res.data?.data ?? [];
      setJobs(raw);
    } catch (e) {
      console.error('Nearby jobs error:', e);
    } finally {
      setJobsLoading(false);
    }
  }, [user, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchDashboard();
    fetchJobs();
    const unsub = navigation.addListener('focus', () => {
      fetchDashboard();
      fetchJobs();
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    fetchJobs(selectedCategory, searchQuery);
  }, [selectedCategory]);

  // ─── Location helpers ───────────────────────────────────────────────────────

  const saveLocation = async (lat: number, lng: number, addr: string, city: string) => {
    try {
      const res = await api.put('/geo/update-location', {
        latitude: lat, longitude: lng, address: addr, city,
      });
      if (res.data?.success && res.data?.user) {
        dispatch(updateUser(res.data.user));
        Alert.alert('Location Updated', addr);
        setLocationModal(false);
        setInputCity(''); setInputZip('');
        fetchJobs();
      } else {
        Alert.alert('Error', 'Failed to save location.');
      }
    } catch {
      Alert.alert('Error', 'Network error while saving location.');
    }
  };

  const handleManualUpdate = async () => {
    if (!inputCity.trim() || !inputZip.trim()) {
      Alert.alert('Validation', 'Please enter both city and zip code.');
      return;
    }
    setManualUpdating(true);
    try {
      const q = encodeURIComponent(`${inputCity.trim()} ${inputZip.trim()} India`);
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`,
        { headers: { 'User-Agent': 'WorkQuoraApp/1.0' } }
      );
      const results = await r.json();
      if (!results?.length) { Alert.alert('Not Found', 'Could not locate that city/zip.'); return; }
      await saveLocation(
        parseFloat(results[0].lat),
        parseFloat(results[0].lon),
        `${inputCity.trim()}, ${inputZip.trim()}`,
        inputCity.trim()
      );
    } catch {
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
      const city = data.address?.city || data.address?.town || data.address?.village || 'Nearby';
      const zip  = data.address?.postcode ?? '';
      await saveLocation(latitude, longitude, zip ? `${city}, ${zip}` : city, city);
    } catch (e) {
      console.error('Geo error', e);
      Alert.alert('Error', 'Could not detect location.');
    } finally {
      setAutoUpdating(false);
    }
  };

  // ─── Derived values ─────────────────────────────────────────────────────────

  const userName       = user?.name ?? 'Partner';
  const firstName      = userName.split(' ')[0];
  const walletBalance  = dashboard?.finances?.walletBalance  ?? 0;
  const todayIncome    = dashboard?.finances?.todayIncome    ?? 0;
  const totalAssigned  = dashboard?.stats?.totalAssignedTasks ?? 0;
  const pendingTasks   = dashboard?.stats?.pendingTasks      ?? 0;
  const completedTasks = dashboard?.stats?.completedTasks    ?? 0;
  const recentTasks    = dashboard?.recentTasks ?? [];

  const locationLabel =
    (user as any)?.location?.address &&
    (user as any).location.address.trim() !== '' &&
    (user as any).location.address !== '0, 0'
      ? (user as any).location.address
      : 'Set your location';

  // ─── Job card ───────────────────────────────────────────────────────────────

  const getJobImage = (job: NearbyJob) => {
    if (job.pictures?.length) return job.pictures[0];
    return CATEGORY_IMAGES[job.category] ?? CATEGORY_IMAGES.Default;
  };

  const getJobBadge = (job: NearbyJob) => {
    const dist = job.distance ?? 0;
    if (dist < 1)  return { label: 'NEAR YOU',  color: '#059669', bg: '#d1fae5' };
    if (dist < 3)  return { label: 'ACTIVE',     color: '#059669', bg: '#d1fae5' };
    return              { label: 'OPEN',         color: '#f59e0b', bg: '#fef3c7' };
  };

  const renderJobCard = ({ item }: { item: NearbyJob }) => {
    const badge = getJobBadge(item);
    return (
      <TouchableOpacity
        style={styles.jobCard}
        activeOpacity={0.88}
        onPress={() =>
          navigation.navigate('GigDetails', { jobId: item._id, jobTitle: item.title })
        }
      >
        <View style={styles.jobImageBox}>
          <Image source={{ uri: getJobImage(item) }} style={styles.jobImage as any} />
          <View style={[styles.jobBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.jobBadgeText, { color: badge.color }]}>{badge.label}</Text>
          </View>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.jobRate}>₹{item.budget}</Text>
          <View style={styles.jobMeta}>
            <Feather name="map-pin" size={10} color="#64748b" />
            <Text style={styles.jobMetaText}>
              {item.distance != null ? `${item.distance} km` : item.location?.address ?? 'Nearby'}
            </Text>
          </View>
          {item.clientInfo?.name && (
            <View style={styles.jobMeta}>
              {item.clientInfo?.profilePic || item.clientInfo?.avatar ? (
                <Image 
                  source={{ uri: item.clientInfo.profilePic || item.clientInfo.avatar }} 
                  style={{ width: 12, height: 12, borderRadius: 6 }} 
                />
              ) : (
                <Feather name="user" size={10} color="#64748b" />
              )}
              <Text style={styles.jobMetaText} numberOfLines={1}>{item.clientInfo.name}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading && isAuthenticated) {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading your portal…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { fetchDashboard(true); fetchJobs(); }}
            tintColor="#059669"
          />
        }
        stickyHeaderIndices={[0]}
      >
        {/* ── Dark Green Header ── */}
        <View style={styles.header}>
          {/* Row 1: Greeting + wallet + avatar */}
          <View style={styles.headerRow1}>
            <View style={{ flex: 1 }}>
              <Text style={styles.helloText}>Hello, {firstName} 👋</Text>
              <TouchableOpacity
                style={styles.locationPill}
                onPress={() => setLocationModal(true)}
                activeOpacity={0.7}
              >
                <Feather name="map-pin" size={11} color="#6ee7b7" />
                <Text style={styles.locationPillText} numberOfLines={1}>{locationLabel}</Text>
                <Feather name="chevron-down" size={11} color="#6ee7b7" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.walletPill}
              onPress={() => navigation.navigate('Earnings')}
              activeOpacity={0.85}
            >
              <Feather name="dollar-sign" size={13} color="#6ee7b7" />
              <Text style={styles.walletText}>₹{walletBalance}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 4, marginHorizontal: 8 }}
              onPress={() => navigation.navigate('Notification')}
              activeOpacity={0.7}
            >
              <Feather name="bell" size={20} color="#6ee7b7" />
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
              placeholder='Search "available gigs…"'
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => fetchJobs(selectedCategory, searchQuery)}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={() => fetchJobs(selectedCategory, searchQuery)}>
              <Feather name="mic" size={16} color="#059669" />
            </TouchableOpacity>
          </View>

          {/* Row 3: Category chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={{ paddingRight: 12 }}
          >
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
                    <Feather name={c.icon as any} size={14} color={active ? '#fff' : '#059669'} />
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
              { icon: 'list',         val: totalAssigned,  label: 'Total Tasks', color: '#059669' },
              { icon: 'clock',        val: pendingTasks,   label: 'Pending',     color: '#f59e0b' },
              { icon: 'check-circle', val: completedTasks, label: 'Done',        color: '#059669' },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <Feather name={s.icon as any} size={18} color={s.color} />
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Today's income banner */}
          <View style={styles.todayBanner}>
            <View>
              <Text style={styles.todayLabel}>Today's Earnings</Text>
              <Text style={styles.todayAmount}>₹{todayIncome}</Text>
            </View>
            <TouchableOpacity
              style={styles.withdrawBtn}
              onPress={() => navigation.navigate('Earnings')}
              activeOpacity={0.85}
            >
              <Feather name="arrow-up-right" size={13} color="#064e3b" />
              <Text style={styles.withdrawText}>View Wallet</Text>
            </TouchableOpacity>
          </View>

          {/* Dynamic Ad Banner */}
          <AdBanner platform="MOBILE" />

          {/* Nearby Gigs */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Gigs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BrowseGigs')}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>

          {jobsLoading ? (
            <View style={styles.jobsLoader}>
              <ActivityIndicator color="#059669" />
            </View>
          ) : jobs.length === 0 ? (
            <View style={styles.emptyJobs}>
              <Feather name="briefcase" size={32} color="#d1d5db" />
              <Text style={styles.emptyJobsText}>No open gigs found nearby.</Text>
              <Text style={styles.emptyJobsSub}>Update your location to find work around you.</Text>
            </View>
          ) : (
            <FlatList
              data={jobs.slice(0, 8)}
              renderItem={renderJobCard}
              keyExtractor={(i) => i._id}
              numColumns={2}
              columnWrapperStyle={styles.jobsRow}
              scrollEnabled={false}
            />
          )}

          {/* Active Contracts */}
          {recentTasks.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>My Active Contracts</Text>
              </View>
              {recentTasks.map((task) => (
                <TouchableOpacity
                  key={task._id}
                  style={styles.contractCard}
                  onPress={() => navigation.navigate('ActiveGigsStack')}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.contractTitle} numberOfLines={1}>
                      {task.job?.title ?? 'No Title'}
                    </Text>
                    <Text style={styles.contractSub}>
                      ₹{task.job?.budget} · {task.job?.category || 'General'}
                    </Text>
                  </View>
                  <View style={[styles.contractChip, task.status === 'assigned' && styles.contractChipActive]}>
                    <Text style={[styles.contractChipText, task.status === 'assigned' && styles.contractChipTextActive]}>
                      {(task.status ?? 'PENDING').toUpperCase()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* ── Location Modal ── */}
      <Modal
        animationType="slide"
        transparent
        visible={locationModal}
        onRequestClose={() => setLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Update Location</Text>
              <TouchableOpacity onPress={() => setLocationModal(false)}>
                <Feather name="x" size={20} color="#1d1b20" />
              </TouchableOpacity>
            </View>

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
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ecfdf5' },
  loadingCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#064e3b', fontSize: 14 },

  // Header (dark green)
  header: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow1: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  helloText: { color: '#f0fdf4', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  locationPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
    alignSelf: 'flex-start',
  },
  locationPillText: { color: '#6ee7b7', fontSize: 11, fontWeight: '700', maxWidth: 160 },
  walletPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(110,231,183,0.12)',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, marginRight: 10,
  },
  walletText: { color: '#6ee7b7', fontWeight: '800', fontSize: 13 },
  avatarCircle: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#059669',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(110,231,183,0.35)',
  },
  avatarLetter: { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Search
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 14, height: 46, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  searchInput: {
    flex: 1, fontSize: 14, color: '#1d1b20',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },

  // Category chips
  catScroll: { marginBottom: 4 },
  catChip: { alignItems: 'center', marginRight: 16, opacity: 0.7 },
  catChipActive: { opacity: 1 },
  catIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(5,150,105,0.15)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  catIconActive: { backgroundColor: '#059669' },
  catLabel: { color: '#6ee7b7', fontSize: 11, fontWeight: '600' },
  catLabelActive: { color: '#fff', fontWeight: '800' },

  // Body
  body: { paddingHorizontal: 16, paddingTop: 20 },

  // Stats
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
    alignItems: 'flex-start', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  statVal: { fontSize: 20, fontWeight: '800', color: '#1d1b20' },
  statLabel: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },

  // Today's earnings banner
  todayBanner: {
    backgroundColor: '#059669',
    borderRadius: 18, padding: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#059669', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
  },
  todayLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  todayAmount: { color: '#fff', fontSize: 26, fontWeight: '800' },
  withdrawBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  withdrawText: { color: '#064e3b', fontWeight: '800', fontSize: 13 },

  // Section
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: '#1d1b20' },
  seeAll: { fontSize: 13, fontWeight: '700', color: '#059669' },

  // Job grid
  jobsRow: { justifyContent: 'space-between', marginBottom: 14 },
  jobCard: {
    width: CARD_WIDTH, backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  jobImageBox: { width: '100%', height: CARD_WIDTH * 0.75, position: 'relative' },
  jobImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  jobBadge: {
    position: 'absolute', top: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
  },
  jobBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  jobInfo: { padding: 10 },
  jobTitle: { fontSize: 12, fontWeight: '700', color: '#1d1b20', marginBottom: 2, lineHeight: 16 },
  jobRate: { fontSize: 15, fontWeight: '800', color: '#059669', marginBottom: 5 },
  jobMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  jobMetaText: { fontSize: 10, color: '#64748b', flex: 1 },

  jobsLoader: { paddingVertical: 32, alignItems: 'center' },
  emptyJobs: { alignItems: 'center', paddingVertical: 32 },
  emptyJobsText: { fontSize: 15, fontWeight: '700', color: '#64748b', marginTop: 10 },
  emptyJobsSub: { fontSize: 12, color: '#94a3b8', marginTop: 4, textAlign: 'center' },

  // Contracts
  contractCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  contractTitle: { fontSize: 14, fontWeight: '700', color: '#1d1b20' },
  contractSub: { fontSize: 12, color: '#64748b', marginTop: 2 },
  contractChip: {
    backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  contractChipActive: { backgroundColor: '#d1fae5' },
  contractChipText: { fontSize: 9, fontWeight: '800', color: '#475569' },
  contractChipTextActive: { color: '#064e3b' },

  // Location modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
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
    height: 48, backgroundColor: '#059669', borderRadius: 24,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  autoBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  btnDisabled: { opacity: 0.55 },
  orRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  orLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700', marginHorizontal: 12 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#064e3b', marginBottom: 6 },
  fieldInput: {
    backgroundColor: '#f0fdf4', borderRadius: 10,
    paddingHorizontal: 14, height: 46, marginBottom: 14,
    fontSize: 14, color: '#1d1b20',
    ...Platform.select({ web: { outlineStyle: 'none' } as any }),
  },
  saveBtn: {
    height: 48, backgroundColor: '#059669', borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
