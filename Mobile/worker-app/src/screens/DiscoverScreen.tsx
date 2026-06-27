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
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import api, { getApiData } from '../services/api';
import { useLanguage } from '../services/i18n';
import AdBanner from '../shared/components/AdBanner';

export default function DiscoverScreen({ navigation }: { navigation: any }) {
  const { user } = useSelector((s: any) => s.auth);
  const { t, locale } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);

  // Default coordinates (Bhopal) for testing & fallback lookup
  const userLat = user?.location?.coordinates?.[1] || 23.2599;
  const userLng = user?.location?.coordinates?.[0] || 77.4126;

  const fetchData = async (query: string = '') => {
    setLoading(true);
    try {
      const response = await api.get('/geo/nearby-jobs', {
        params: {
          lat: userLat,
          lng: userLng,
          radius: 100,
          keyword: query,
        },
      });
      const data = getApiData(response);
      setJobs(data?.jobs || []);
    } catch (error) {
      console.error('Discover query error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(searchQuery);
  }, []);

  const handleSearch = () => {
    fetchData(searchQuery);
  };

  const renderJobItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.clientInfo?.profilePic || item.clientInfo?.avatar ? (
          <Image 
            source={{ uri: item.clientInfo.profilePic || item.clientInfo.avatar }} 
            style={styles.avatarInner} 
          />
        ) : (
          <View style={styles.avatarInner}>
            <Text style={styles.avatarTxt}>
              {item.clientInfo?.name?.substring(0, 2).toUpperCase() || 'CL'}
            </Text>
          </View>
        )}
        <View style={styles.headerMeta}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.clientName}>Posted by @{item.clientInfo?.username || 'client'}</Text>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.cardFooter}>
        <View style={styles.metaRow}>
          <Feather name="tag" size={12} color="#8e8e8e" />
          <Text style={styles.metaTxt}> {item.category}</Text>
        </View>
        <View style={styles.metaRow}>
          <Feather name="map-pin" size={12} color="#8e8e8e" />
          <Text style={styles.metaTxt}> Noida ({item.distance || 0} km)</Text>
        </View>
      </View>
      <View style={styles.budgetRow}>
        <Text style={styles.budgetValue}>₹{item.budget}</Text>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.actionBtnTxt}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );



  const placeholderText = locale === 'hi'
    ? 'काम, कौशल, नाम या श्रेणी खोजें...'
    : 'Search jobs, skills, name...';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Search Bar */}
      <View style={styles.searchHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.searchInputContainer}>
          <Feather name="search" size={16} color="#8e8e8e" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={placeholderText}
            placeholderTextColor="#8e8e8e"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>



      {/* Loading Indicator */}
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <AdBanner platform="MOBILE" />
          <FlatList
            data={jobs}
            renderItem={renderJobItem}
          keyExtractor={(item, index) => item._id || item.id || index.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="search" size={40} color="#dbdbdb" />
              <Text style={styles.emptyTxt}>
                {locale === 'hi' ? 'कोई परिणाम नहीं मिला' : 'No matches found'}
              </Text>
            </View>
          }
        />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#dbdbdb',
  },
  backButton: {
    marginRight: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#dbdbdb',
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: '#059669',
  },
  tabBtnTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e8e',
    marginLeft: 6,
  },
  tabBtnTxtActive: {
    color: '#059669',
  },
  listContent: {
    padding: 16,
  },
  loaderBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#dbdbdb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  headerMeta: {
    marginLeft: 12,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  clientName: {
    fontSize: 12,
    color: '#8e8e8e',
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#f5f5f5',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaTxt: {
    fontSize: 11,
    color: '#8e8e8e',
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
  },
  actionBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  actionBtnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
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
});
