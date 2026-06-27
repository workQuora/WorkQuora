import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  ScrollView,
  RefreshControl,
  Image,
  Alert,
  Platform,
} from 'react-native';
import api, { getApiData } from '../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../shared/theme/theme';

interface Job {
  _id: string;
  title: string;
  description: string;
  category: string;
  budget: number;
  status: string;
  location?: { address?: string; coordinates?: [number, number] };
  address?: string;
  distance?: number;
  isUrgent?: boolean;
}

interface BrowseGigsScreenProps {
  navigation: any;
}

export default function BrowseGigsScreen({ navigation }: BrowseGigsScreenProps) {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const { colors } = useTheme();

  

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Electrician', 'Plumber', 'Cleaner', 'AC Repair', 'Painter', 'Carpenter'];

  // Advertisement carousel state
  const [activeAdIndex, setActiveAdIndex] = useState(0);
  const ads = [
    {
      tag: 'PROMOTED',
      title: 'Unlock Premium Gigs',
      sub: 'Pro Member Perks. Find the best jobs.',
      actionLabel: 'Learn More',
      image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
    },
    {
      tag: 'SPONSORED',
      title: 'Promote Your Profile',
      sub: 'Get featured at the top of client search results.',
      actionLabel: 'Boost Now',
      image: 'https://images.unsplash.com/photo-1521737711867-e3b90473bd58?auto=format&fit=crop&w=600&q=80',
    },
    {
      tag: 'PROMOTED',
      title: 'WorkQuora Pro Member',
      sub: 'Enjoy zero commission fees on your first 5 client contracts.',
      actionLabel: 'Join Pro',
      image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80',
    }
  ];

  // Rotate ads every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAdIndex((prev) => (prev + 1) % ads.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Fetch nearby jobs from database
  const fetchJobs = async (isRefresh = false, search = searchQuery, cat = selectedCategory) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const userLat = user?.location?.coordinates?.[1] || 23.2599;
      const userLng = user?.location?.coordinates?.[0] || 77.4126;

      const params: any = {
        lat: userLat,
        lng: userLng,
        radius: 100, // search radius in km
      };

      if (search.trim().length > 0) {
        params.keyword = search.trim();
      }
      if (cat !== 'All') {
        params.category = cat;
      }

      const response = await api.get('/geo/nearby-jobs', { params });
      const data = getApiData(response);
      const allJobs = data?.jobs || data || [];

      if (Array.isArray(allJobs)) {
        // Only show open jobs
        const openJobs = allJobs.filter((j: any) => j.status === 'open');
        setJobs(openJobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const unsub = navigation.addListener('focus', () => fetchJobs());
    return unsub;
  }, [navigation, isAuthenticated, user]);

  const handleSearchSubmit = () => {
    fetchJobs(false, searchQuery, selectedCategory);
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    fetchJobs(false, searchQuery, cat);
  };

  const handleMenuPress = () => {
    Alert.alert('Menu', 'Quick actions and stats are available in your Profile screen.');
  };

  const handleApply = (job: Job) => {
    navigation.navigate('GigDetails', { job });
  };

  // Render advertisement sliding card
  const renderAdCard = () => {
    const ad = ads[activeAdIndex];
    return (
      <View style={styles.adCard}>
        <Image source={{ uri: ad.image }} style={styles.adCardBg} resizeMode="cover" />
        <View style={styles.adOverlay} />
        <View style={styles.adContent}>
          <View style={styles.adTagContainer}>
            <Text style={styles.adTagText}>{ad.tag}</Text>
          </View>
          <Text style={styles.adTitle}>{ad.title}</Text>
          
          <View style={styles.adFooterRow}>
            <View style={styles.adDotsRow}>
              {ads.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.adDot,
                    idx === activeAdIndex ? styles.adDotActive : styles.adDotInactive,
                  ]}
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.adBtn}
              onPress={() => Alert.alert('WorkQuora Pro', 'This premium feature is coming soon!')}
            >
              <Text style={styles.adBtnText}>{ad.actionLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Render job list item
  const renderJobCard = (job: Job, index: number) => {
    const addressText = job.location?.address || job.address || 'Financial District, Manhattan';
    // Fallback/dummy distance for mockup alignment if distance is not provided
    const distanceVal = job.distance !== undefined ? job.distance : (0.8 + index * 0.4);
    const distanceText = `${distanceVal.toFixed(1)} miles away`;

    // Badges determination
    const isUrgent = 
      job.isUrgent === true ||
      job.title?.toLowerCase().includes('urgent') || 
      job.description?.toLowerCase().includes('urgent') ||
      job.title?.toLowerCase().includes('emergency') || 
      job.description?.toLowerCase().includes('emergency');
    
    const isHighPay = job.budget >= 50; // assuming USD / standard budget threshold

    // Category badge text
    const categoryBadge = job.category ? job.category.toUpperCase() : 'GENERAL';

    // Rate details
    const isHourly = job.budget < 100;
    const rateText = isHourly ? `$${job.budget.toFixed(2)}/hr` : `Est. Pay: $${Math.round(job.budget)}`;
    const rateSubText = isHourly ? 'Flexible hours' : 'Fixed price project';

    // ─── Emergency Layout ───
    if (isUrgent) {
      return (
        <View key={job._id || index} style={styles.emergencyGigCard}>
          <View style={styles.urgentHeaderRow}>
            <View style={styles.urgentBadgeContainer}>
              <Text style={styles.urgentBadgeText}>EMERGENCY</Text>
            </View>
          </View>
          <Text style={styles.gigTitle}>{job.title}</Text>
          <Text style={styles.gigDescription} numberOfLines={3}>
            {job.description}
          </Text>

          <View style={styles.emergencyFooterRow}>
            <View style={styles.emergencyLeft}>
              <Text style={[styles.emergencyRate, { color: colors.primary }]}>{rateText}</Text>
              <Text style={styles.emergencyLocationText}>{addressText}</Text>
            </View>
            <TouchableOpacity
              style={[styles.urgentClaimBtn, { backgroundColor: colors.primary }]}
              onPress={() => handleApply(job)}
            >
              <Text style={styles.claimBtnText}>Urgent Claim</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // ─── Standard Layout ───
    return (
      <View key={job._id || index} style={styles.gigCard}>
        {/* Row 1: Badges and Rate */}
        <View style={styles.cardTopRow}>
          <View style={styles.badgeGroup}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryBadge}</Text>
            </View>
            {isHighPay && (
              <View style={styles.highPayBadge}>
                <Text style={styles.highPayBadgeText}>HIGH PAY</Text>
              </View>
            )}
          </View>
          <View style={styles.rateContainer}>
            <Text style={[styles.rateText, { color: colors.primary }]}>{rateText}</Text>
            <Text style={styles.rateSubText}>{rateSubText}</Text>
          </View>
        </View>

        {/* Row 2: Title & Description */}
        <Text style={styles.gigTitle}>{job.title}</Text>
        <Text style={styles.gigDescription} numberOfLines={3}>
          {job.description}
        </Text>

        {/* Row 3: Footer details */}
        <View style={styles.cardFooter}>
          <View style={styles.footerDetails}>
            <View style={styles.footerIconRow}>
              <Feather name="map-pin" size={13} color="#64748b" style={styles.footerIcon} />
              <Text style={styles.footerDetailText} numberOfLines={1}>
                {addressText}
              </Text>
            </View>
            <View style={styles.footerIconRow}>
              <Feather name="navigation" size={13} color="#64748b" style={styles.footerIcon} />
              <Text style={styles.footerDetailText}>{distanceText}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.applyBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleApply(job)}
          >
            <Text style={styles.applyBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Avatar resolution
  const userGender = user?.gender || 'OTHER';
  const defaultAvatar = (userGender.toUpperCase() === 'MALE')
    ? 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack'
    : (userGender.toUpperCase() === 'FEMALE')
      ? 'https://api.dicebear.com/7.x/avataaars/png?seed=Lily'
      : 'https://api.dicebear.com/7.x/avataaars/png?seed=User';
  const finalAvatarUrl = user?.avatar || (user as any)?.profilePic || defaultAvatar;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: '#f8fafc' }]}>
      {/* custom branding app bar header */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={handleMenuPress}>
          <Feather name="menu" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={require('../../assets/icon.png')} style={{ width: 24, height: 24, borderRadius: 4 }} />
          <Text style={[styles.headerTitle, { color: colors.primary }]}>WorkQuora</Text>
        </View>
        <View style={styles.headerRightGroup}>
          <TouchableOpacity style={[styles.headerIconBtn, { marginRight: 12 }]} onPress={() => navigation.navigate('Notification')}>
            <Feather name="bell" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ProfileTab')}>
            <Image source={{ uri: finalAvatarUrl }} style={styles.avatarImage} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContainer}>
        {/* Search Field */}
        <View style={styles.searchBarContainer}>
          <Feather name="search" size={18} color="#94a3b8" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for wiring, AC fix..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.filterBtn} onPress={() => Alert.alert('Filters', 'Advanced filter criteria option coming soon!')}>
            <Feather name="sliders" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Categories Chips scrolling row */}
        <View style={styles.chipsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.choiceChip,
                    isSelected 
                      ? [styles.chipSelected, { backgroundColor: colors.primary, borderColor: colors.primary }]
                      : styles.chipUnselected,
                  ]}
                  onPress={() => handleCategorySelect(cat)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isSelected ? styles.chipTextSelected : styles.chipTextUnselected,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Section title & count */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recommended for You</Text>
          <Text style={styles.sectionCount}>{jobs.length} jobs nearby</Text>
        </View>

        {/* Gigs List scroll */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : jobs.length === 0 ? (
            <View style={styles.center}>
              <Feather name="info" size={32} color="#cbd5e1" style={{ marginBottom: 8 }} />
              <Text style={styles.noGigsText}>No matching jobs available nearby.</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listScroll}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => fetchJobs(true)}
                  tintColor={colors.primary}
                />
              }
            >
              {/* Insert cards & loop ad carousel dynamically */}
              {jobs.map((job, index) => (
                <React.Fragment key={job._id || index}>
                  {index === 2 && renderAdCard()}
                  {renderJobCard(job, index)}
                </React.Fragment>
              ))}
              {jobs.length < 2 && renderAdCard()}
            </ScrollView>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerIconBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    height: 48,
    paddingLeft: 14,
    paddingRight: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '500',
    height: '100%',
    ...Platform.select({
      web: { outlineStyle: 'none' }
    })
  } as any,
  filterBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsSection: {
    height: 36,
    marginBottom: 20,
  },
  chipsScroll: {
    paddingRight: 16,
  },
  choiceChip: {
    paddingHorizontal: 16,
    borderRadius: 18,
    marginRight: 8,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  chipSelected: {
    // dynamically applied
  },
  chipUnselected: {
    backgroundColor: '#f1f5f9',
    borderColor: '#f1f5f9',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextUnselected: {
    color: '#64748b',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  listContainer: {
    flex: 1,
  },
  listScroll: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  noGigsText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  gigCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    maxWidth: '65%',
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.3,
  },
  highPayBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  highPayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  rateContainer: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 16,
    fontWeight: '800',
  },
  rateSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  gigTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
    marginBottom: 6,
  },
  gigDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  footerDetails: {
    flex: 1,
    paddingRight: 8,
    gap: 4,
  },
  footerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerIcon: {
    marginRight: 6,
  },
  footerDetailText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  applyBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  
  // Emergency Job Card styles
  emergencyGigCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#fee2e2', // light red border
    padding: 16,
    marginBottom: 16,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  urgentHeaderRow: {
    marginBottom: 10,
  },
  urgentBadgeContainer: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ef4444',
    letterSpacing: 0.3,
  },
  emergencyFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#fee2e2',
    paddingTop: 12,
    marginTop: 4,
  },
  emergencyLeft: {
    flex: 1,
    paddingRight: 10,
  },
  emergencyRate: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  emergencyLocationText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  urgentClaimBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  claimBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Advertisement Card styles
  adCard: {
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adCardBg: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  adOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.65)', // dark glass overlay
  },
  adContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  adTagContainer: {
    backgroundColor: '#ecfdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  adTagText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  adTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  adFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  adDotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  adDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  adDotActive: {
    backgroundColor: '#ffffff',
    width: 12, // slightly expanded active dot
  },
  adDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  adBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adBtnText: {
    color: '#0f172a',
    fontSize: 12,
    fontWeight: '700',
  },
});
