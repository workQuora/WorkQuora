import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import api from '../../services/api';

interface Ad {
  _id: string;
  title: string;
  brandName: string;
  description: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  linkUrl: string;
}

interface AdBannerProps {
  platform?: 'MOBILE';
}

export default function AdBanner({ platform = 'MOBILE' }: AdBannerProps) {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await api.get(`/ads/active?platform=${platform}`);
      if (res.data?.success && res.data.data.length > 0) {
        setAds(res.data.data);
      }
    } catch (error) {
      console.log('Failed to load ads on mobile:', error);
    }
  };

  useEffect(() => {
    if (ads.length === 0) return;
    
    // Rotate ads every 15 seconds
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ads.length);
    }, 15000);

    return () => clearInterval(interval);
  }, [ads]);

  useEffect(() => {
    if (ads.length > 0) {
      const currentAd = ads[currentIndex];
      // Track impression
      api.post(`/ads/track`, { adId: currentAd._id, action: 'impression' }).catch(() => {});
    }
  }, [currentIndex, ads]);

  const handlePress = () => {
    if (ads.length === 0) return;
    const currentAd = ads[currentIndex];
    api.post(`/ads/track`, { adId: currentAd._id, action: 'click' }).catch(() => {});
    if (currentAd.linkUrl) {
      Linking.openURL(currentAd.linkUrl);
    }
  };

  if (ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress} style={styles.container}>
      {currentAd.mediaUrl && (
        <Image source={{ uri: currentAd.mediaUrl }} style={styles.image} resizeMode="cover" />
      )}
      <View style={styles.overlay}>
        <View style={styles.adBadge}>
          <Text style={styles.adBadgeText}>Ad</Text>
        </View>
        <View style={styles.content}>
          <Text style={styles.brandName}>{currentAd.brandName}</Text>
          <Text style={styles.title} numberOfLines={1}>{currentAd.title}</Text>
          <Text style={styles.description} numberOfLines={2}>{currentAd.description}</Text>
          <View style={styles.learnMoreRow}>
            <Text style={styles.learnMoreTxt}>Learn More</Text>
            <Feather name="external-link" size={12} color="#fff" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    height: 180,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.7,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 16,
    justifyContent: 'space-between',
  },
  adBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  content: {
    justifyContent: 'flex-end',
  },
  brandName: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: '#e2e8f0',
    fontSize: 12,
    marginBottom: 8,
  },
  learnMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  learnMoreTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  }
});
