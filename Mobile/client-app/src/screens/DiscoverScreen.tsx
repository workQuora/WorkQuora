import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Image,
  ScrollView,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api, { getApiData } from '../services/api';
import AdBanner from '../shared/components/AdBanner';

const { width } = Dimensions.get('window');



// Comprehensive filterable roles for each category
const categoryRoles: Record<string, string[]> = {
  All: [
    'All',
    'UI/UX Designer',
    'Product Designer',
    'Senior Product Designer',
    'Mobile UI Designer',
    'Graphic Designer',
    'Web Designer',
    'Full Stack Developer',
    'Frontend Engineer',
    'Backend Engineer',
    'React Native Developer',
    'Mobile App Developer',
    'Growth Marketing Lead',
    'SEO Specialist',
    'Social Media Manager'
  ],
  Designers: [
    'All',
    'UI/UX Designer',
    'Product Designer',
    'Senior Product Designer',
    'Mobile UI Designer',
    'Graphic Designer',
    'Web Designer',
    'Motion Designer',
    'Brand Identity Designer'
  ],
  Developers: [
    'All',
    'Full Stack Developer',
    'Frontend Engineer',
    'Backend Engineer',
    'React Native Developer',
    'Mobile App Developer',
    'DevOps Engineer',
    'QA Engineer'
  ],
  Marketing: [
    'All',
    'Growth Marketing Lead',
    'SEO Specialist',
    'Social Media Manager',
    'Content Marketer',
    'Digital Marketer',
    'Product Marketer'
  ]
};

export default function DiscoverScreen({ navigation }: { navigation: any }) {
  const { user, isAuthenticated } = useSelector((s: any) => s.auth);
  
  

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All'); // Default to All to show all freelancers initially
  const [favorites, setFavorites] = useState<string[]>([]);
  const [selectedFreelancer, setSelectedFreelancer] = useState<any | null>(null);
  const [clientJobId, setClientJobId] = useState<string>('000000000000000000000000'); // fallback default

  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    setDebouncedQuery(text);
  };

  // Interactive filters state
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState<'role' | 'rating' | 'price' | null>(null);
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedRating, setSelectedRating] = useState('All');
  const [selectedPrice, setSelectedPrice] = useState('All');

  const categories = ['All', 'Designers', 'Developers', 'Marketing'];

  useEffect(() => {
    // Load client's posted jobs on mount to find a real jobId for chat initiation
    api.get('/jobs/my-jobs')
      .then((res) => {
        if (res.data?.success && res.data.data?.length > 0) {
          setClientJobId(res.data.data[0]._id || res.data.data[0].id);
        }
      })
      .catch((err) => console.log('Error fetching client jobs in Discover:', err));
  }, []);

  const fetchData = async (
    query: string = '',
    cat: string = selectedCategory,
    role: string = selectedRole,
    rating: string = selectedRating,
    price: string = selectedPrice
  ) => {
    setLoading(true);
    try {
      // 1. Fetch from nearby freelancers API (radius restricted to 25km)
      const response = await api.get('/geo/nearby-freelancers', {
        params: {
          lat: user?.location?.coordinates?.[1] || 23.2599,
          lng: user?.location?.coordinates?.[0] || 77.4126,
          radius: 25,
          keyword: query,
        },
      });
      const data = getApiData(response);
      const apiFreelancers = data?.freelancers || data || [];

      // Map API freelancers to include fields for display compatibility
      const mappedApi = apiFreelancers.map((f: any) => {
        const avatarUrl = f.avatar || f.profilePic || null;
        const userGender = f.gender || 'OTHER';
        const defaultAvatar = (userGender.toUpperCase() === 'MALE')
          ? 'https://api.dicebear.com/7.x/avataaars/png?seed=Jack'
          : (userGender.toUpperCase() === 'FEMALE')
            ? 'https://api.dicebear.com/7.x/avataaars/png?seed=Lily'
            : 'https://api.dicebear.com/7.x/avataaars/png?seed=User';
        const finalAvatarUrl = avatarUrl || defaultAvatar;

        const skillsList = f.skills || ['General Service'];

        // Determine category based on skills and title
        const text = [...skillsList, f.title || ''].join(' ').toLowerCase();
        let freelancerCategory = 'Developers';
        if (text.includes('design')) {
          freelancerCategory = 'Designers';
        } else if (text.includes('market') || text.includes('seo') || text.includes('mkt')) {
          freelancerCategory = 'Marketing';
        }

        // Determine hourly rate / price
        const rate = f.hourlyRate || 50;
        const priceStr = `$${rate}/hr`;

        // Rating and reviews fallback
        const ratingVal = f.averageRating && f.averageRating > 0 ? f.averageRating : (f.title?.includes('Senior') ? 4.9 : 4.8);
        const reviewsCount = f.totalJobsCompleted || (f.title?.includes('Senior') ? 12 : 5);

        return {
          id: f._id || f.id,
          name: f.name || 'Local Expert',
          role: f.title || (skillsList[0] ? `${skillsList[0]} Specialist` : 'Professional Worker'),
          rating: ratingVal,
          reviews: reviewsCount,
          skills: skillsList.filter((s: string) => s !== 'Designers' && s !== 'Developers' && s !== 'Marketing'),
          price: priceStr,
          category: freelancerCategory,
          image: finalAvatarUrl,
          isVerified: f.isVerified || f.kycVerified,
          bio: f.bio || 'Professional local worker ready to complete jobs around Bhopal/NCR.',
          location: f.location?.address || 'Bhopal, India',
        };
      });

      // 2. Filter mapped API freelancers
      const filteredApi = mappedApi.filter((w: any) => {
        const matchesCat = cat && cat !== 'All' ? w.category === cat : true;
        const matchesQuery = query
          ? w.name.toLowerCase().includes(query.toLowerCase()) ||
            w.role.toLowerCase().includes(query.toLowerCase()) ||
            w.skills.some((s: string) => s.toLowerCase().includes(query.toLowerCase()))
          : true;
          
        // Role filter
        const matchesRole = role === 'All' ? true : w.role === role;

        // Rating filter
        let matchesRating = true;
        if (rating === '4.9+ Stars') matchesRating = w.rating >= 4.9;
        else if (rating === '4.8+ Stars') matchesRating = w.rating >= 4.8;
        else if (rating === '4.7+ Stars') matchesRating = w.rating >= 4.7;

        // Price filter
        let matchesPrice = true;
        const numericPrice = parseInt(w.price.replace(/[^0-9]/g, ''), 10);
        if (price === 'Under $80/hr') matchesPrice = numericPrice < 80;
        else if (price === 'Under $100/hr') matchesPrice = numericPrice < 100;
        else if (price === 'Over $100/hr') matchesPrice = numericPrice >= 100;

        return matchesCat && matchesQuery && matchesRole && matchesRating && matchesPrice;
      });

      setWorkers(filteredApi);
    } catch (error) {
      console.error('Discover query error:', error);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData(debouncedQuery, selectedCategory, selectedRole, selectedRating, selectedPrice);
  }, [debouncedQuery, selectedCategory, selectedRole, selectedRating, selectedPrice]);

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedRole('All'); // Reset role filter when changing category
  };

  const handleSearch = () => {
    setDebouncedQuery(searchQuery);
  };

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter((favId) => favId !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const handleChatInitiation = (freelancer: any) => {
    setSelectedFreelancer(null);
    navigation.navigate('Chat', {
      screen: 'ChatDetail',
      params: {
        jobId: clientJobId,
        otherUserId: freelancer.id,
        otherUserName: freelancer.name,
      },
    });
  };

  // Helper for filter picker
  const getFilterOptions = () => {
    if (activeFilterType === 'role') {
      return categoryRoles[selectedCategory] || ['All'];
    }
    if (activeFilterType === 'rating') {
      return ['All', '4.9+ Stars', '4.8+ Stars', '4.7+ Stars'];
    }
    if (activeFilterType === 'price') {
      return ['All', 'Under $80/hr', 'Under $100/hr', 'Over $100/hr'];
    }
    return [];
  };

  const getSelectedValue = () => {
    if (activeFilterType === 'role') return selectedRole;
    if (activeFilterType === 'rating') return selectedRating;
    if (activeFilterType === 'price') return selectedPrice;
    return '';
  };

  const handleSelectFilterOption = (option: string) => {
    if (activeFilterType === 'role') setSelectedRole(option);
    if (activeFilterType === 'rating') setSelectedRating(option);
    if (activeFilterType === 'price') setSelectedPrice(option);
    setFilterModalVisible(false);
  };

  const isFilterActive = (type: 'role' | 'rating' | 'price') => {
    if (type === 'role') return selectedRole !== 'All';
    if (type === 'rating') return selectedRating !== 'All';
    if (type === 'price') return selectedPrice !== 'All';
    return false;
  };

  const getFilterButtonLabel = (type: 'role' | 'rating' | 'price') => {
    if (type === 'role') {
      return selectedRole === 'All' ? 'Role' : selectedRole;
    }
    if (type === 'rating') {
      return selectedRating === 'All' ? 'Rating' : selectedRating;
    }
    if (type === 'price') {
      return selectedPrice === 'All' ? 'Price' : selectedPrice;
    }
    return '';
  };

  const renderWorkerCard = ({ item }: { item: any }) => {
    const isFav = favorites.includes(item.id);
    return (
      <View style={styles.card}>
        {/* Cover Image */}
        <View style={styles.cardImageContainer}>
          <Image source={{ uri: item.image }} style={styles.cardImage as any} />
          {/* Favorite button */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => toggleFavorite(item.id)}
            activeOpacity={0.8}
          >
            <Feather
              name="heart"
              size={16}
              color={isFav ? '#ef4444' : '#64748b'}
              style={isFav ? styles.filledHeart : null}
            />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.cardDetails}>
          {/* Name & Rating */}
          <View style={styles.nameRow}>
            <Text style={styles.workerName}>{item.name}</Text>
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingText}>★ {item.rating.toFixed(1)}</Text>
            </View>
          </View>

          {/* Subtitle / Role */}
          <Text style={styles.workerRole}>{item.role}</Text>

          {/* Skill Tag Chips */}
          <View style={styles.tagsContainer}>
            {item.skills.map((skill: string, index: number) => (
              <View key={index} style={styles.skillTag}>
                <Text style={styles.skillTagText}>{skill}</Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Footer Section */}
          <View style={styles.cardFooter}>
            <Text style={styles.priceText}>{item.price}</Text>
            <TouchableOpacity
              style={styles.viewProfileBtn}
              onPress={() => setSelectedFreelancer(item)}
            >
              <Text style={styles.viewProfileBtnText}>View Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Branding App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="menu" size={20} color="#10b981" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Image source={require('../../assets/icon.png')} style={{ width: 24, height: 24, borderRadius: 4 }} />
          <Text style={styles.appBarTitle}>WorkQuora</Text>
        </View>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={{ marginRight: 16 }}>
          <Feather name="bell" size={20} color="#10b981" />
        </TouchableOpacity>
        <TouchableOpacity style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#10b981', fontWeight: 'bold' }}>P</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Discover Top Talent</Text>
          <Text style={styles.subTitle}>Find the perfect expert for your next project.</Text>
        </View>

        {/* Search Bar Container */}
        <View style={styles.searchSection}>
          <View style={styles.searchBarWrapper}>
            <Feather name="search" size={18} color="#8e8e8e" style={styles.searchIcon} />
            <TextInput
              style={styles.searchBarInput}
              placeholder="Search by skill, name, or role"
              placeholderTextColor="#8e8e8e"
              value={searchQuery}
              onChangeText={handleSearchTextChange}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filter Dropdowns */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, isFilterActive('role') && styles.filterBtnActive]}
            onPress={() => {
              setActiveFilterType('role');
              setFilterModalVisible(true);
            }}
          >
            <Text style={[styles.filterBtnText, isFilterActive('role') && styles.filterBtnTextActive]}>
              {getFilterButtonLabel('role')}
            </Text>
            <Feather
              name="chevron-down"
              size={13}
              color={isFilterActive('role') ? '#10b981' : '#475569'}
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, isFilterActive('rating') && styles.filterBtnActive]}
            onPress={() => {
              setActiveFilterType('rating');
              setFilterModalVisible(true);
            }}
          >
            <Text style={[styles.filterBtnText, isFilterActive('rating') && styles.filterBtnTextActive]}>
              {getFilterButtonLabel('rating')}
            </Text>
            <Feather
              name="chevron-down"
              size={13}
              color={isFilterActive('rating') ? '#10b981' : '#475569'}
              style={styles.chevronIcon}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, isFilterActive('price') && styles.filterBtnActive]}
            onPress={() => {
              setActiveFilterType('price');
              setFilterModalVisible(true);
            }}
          >
            <Text style={[styles.filterBtnText, isFilterActive('price') && styles.filterBtnTextActive]}>
              {getFilterButtonLabel('price')}
            </Text>
            <Feather
              name="chevron-down"
              size={13}
              color={isFilterActive('price') ? '#10b981' : '#475569'}
              style={styles.chevronIcon}
            />
          </TouchableOpacity>
          <View style={styles.filterDivider} />
        </View>

        {/* Category Horizontal Scroll */}
        <View style={styles.chipsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.choiceChip,
                    isSelected ? styles.chipSelected : styles.chipUnselected,
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

        {/* Freelancers List */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <View>
            <AdBanner platform="MOBILE" />
            <FlatList
              data={workers}
              renderItem={renderWorkerCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false} // since it is inside a ScrollView
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Feather name="search" size={40} color="#dbdbdb" />
                <Text style={styles.emptyTxt}>No matches found</Text>
              </View>
            }
          />
          </View>
        )}
      </ScrollView>

      {/* Freelancer Profile Detail Modal */}
      {selectedFreelancer && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedFreelancer}
          onRequestClose={() => setSelectedFreelancer(null)}
        >
          <View style={styles.modalBg}>
            <View style={styles.modalContent}>
              {/* Modal Header Cover */}
              <View style={styles.modalCoverContainer}>
                <Image source={{ uri: selectedFreelancer.image }} style={styles.modalCoverImage as any} />
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedFreelancer(null)}
                >
                  <Feather name="x" size={20} color="#ffffff" />
                </TouchableOpacity>
              </View>

              {/* Modal Body */}
              <View style={styles.modalBody}>
                <View style={styles.modalTitleRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.modalFreelancerName}>{selectedFreelancer.name}</Text>
                    <Text style={styles.modalFreelancerRole}>{selectedFreelancer.role}</Text>
                  </View>
                  <View style={styles.modalRatingContainer}>
                    <Text style={styles.modalRatingText}>★ {selectedFreelancer.rating.toFixed(1)}</Text>
                    <Text style={styles.modalReviewsText}>({selectedFreelancer.reviews} reviews)</Text>
                  </View>
                </View>

                {/* Info row (Location & Rate) */}
                <View style={styles.modalInfoRow}>
                  <View style={styles.modalInfoItem}>
                    <Feather name="map-pin" size={14} color="#10b981" />
                    <Text style={styles.modalInfoText}>{selectedFreelancer.location}</Text>
                  </View>
                  <View style={styles.modalInfoItem}>
                    <Feather name="dollar-sign" size={14} color="#10b981" />
                    <Text style={styles.modalInfoText}>{selectedFreelancer.price}</Text>
                  </View>
                </View>

                {/* About Bio */}
                <Text style={styles.modalSectionTitle}>About</Text>
                <Text style={styles.modalBioText}>{selectedFreelancer.bio}</Text>

                {/* Skills tags */}
                <Text style={styles.modalSectionTitle}>Skills</Text>
                <View style={styles.modalTagsContainer}>
                  {selectedFreelancer.skills.map((skill: string, index: number) => (
                    <View key={index} style={styles.modalSkillTag}>
                      <Text style={styles.modalSkillTagText}>{skill}</Text>
                    </View>
                  ))}
                </View>

                {/* Bottom Action Button */}
                <TouchableOpacity
                  style={styles.modalChatButton}
                  onPress={() => handleChatInitiation(selectedFreelancer)}
                >
                  <Feather name="message-square" size={16} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.modalChatButtonText}>Chat Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Filter Options Modal */}
      {filterModalVisible && activeFilterType && (
        <Modal
          animationType="fade"
          transparent={true}
          visible={filterModalVisible}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalBgCentered}>
            <View style={styles.filterModalContent}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>
                  Select {activeFilterType.charAt(0).toUpperCase() + activeFilterType.slice(1)}
                </Text>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Feather name="x" size={18} color="#1d1b20" />
                </TouchableOpacity>
              </View>
              
              {/* Render options based on filter type */}
              <ScrollView style={styles.filterOptionsList} showsVerticalScrollIndicator={false}>
                {getFilterOptions().map((option) => {
                  const isSelected = getSelectedValue() === option;
                  return (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.filterOptionItem,
                        isSelected && styles.filterOptionItemSelected
                      ]}
                      onPress={() => handleSelectFilterOption(option)}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        isSelected && styles.filterOptionTextSelected
                      ]}>
                        {option}
                      </Text>
                      {isSelected && (
                        <Feather name="check" size={16} color="#10b981" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7ff',
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  menuButton: {
    marginRight: 16,
    padding: 4,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#10b981',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1d1b20',
  },
  subTitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  searchSection: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    height: 50,
    paddingLeft: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 14,
    color: '#1d1b20',
    fontWeight: '500',
    paddingRight: 80,
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      }
    })
  } as any,
  searchButton: {
    position: 'absolute',
    right: 6,
    top: 5,
    backgroundColor: '#10b981',
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 36,
    justifyContent: 'center',
  },
  filterBtnActive: {
    borderColor: '#10b981',
    backgroundColor: '#f8f7ff',
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  filterBtnTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  chevronIcon: {
    marginLeft: 4,
    marginTop: 1,
  },
  filterDivider: {
    width: 1.5,
    height: 24,
    backgroundColor: '#cbd5e1',
    marginLeft: 4,
  },
  chipsSection: {
    height: 40,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  chipsScroll: {
    paddingRight: 16,
  },
  choiceChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  chipSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  chipUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  chipTextUnselected: {
    color: '#475569',
  },
  loaderBox: {
    paddingVertical: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTxt: {
    marginTop: 12,
    fontSize: 14,
    color: '#8e8e8e',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginHorizontal: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageContainer: {
    height: 180,
    width: '100%',
    backgroundColor: '#f1f5f9',
  },
  cardImage: {
    height: '100%',
    width: '100%',
    resizeMode: 'cover',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffffff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filledHeart: {
    transform: [{ scale: 1.05 }],
  },
  cardDetails: {
    padding: 16,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  workerName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1d1b20',
  },
  ratingBadge: {
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#713f12',
  },
  workerRole: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    marginBottom: 8,
  },
  skillTag: {
    backgroundColor: '#f8f7ff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  skillTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  cardDividerColor: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10b981',
  },
  viewProfileBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewProfileBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },

  // Modal styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalCoverContainer: {
    height: 240,
    width: '100%',
    backgroundColor: '#e2e8f0',
  },
  modalCoverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalFreelancerName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1d1b20',
  },
  modalFreelancerRole: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  modalRatingContainer: {
    alignItems: 'flex-end',
  },
  modalRatingText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#eab308',
  },
  modalReviewsText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalInfoRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    backgroundColor: '#f8f7ff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalInfoText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  modalSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1d1b20',
    marginBottom: 8,
  },
  modalBioText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 20,
    fontWeight: '400',
  },
  modalTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 24,
  },
  modalSkillTag: {
    backgroundColor: '#f8f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  modalSkillTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  modalChatButton: {
    backgroundColor: '#059669',
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  modalChatButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },

  // Centered Modal
  modalBgCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  filterModalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 320,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  filterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1d1b20',
  },
  filterOptionsList: {
    maxHeight: 240,
  },
  filterOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  filterOptionItemSelected: {
    backgroundColor: '#f8f7ff',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  filterOptionTextSelected: {
    color: '#10b981',
    fontWeight: '700',
  },
});
