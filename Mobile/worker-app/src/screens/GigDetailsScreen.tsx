import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  Image,
  Modal,
} from 'react-native';
import api from '../services/api';
import { Feather } from '@expo/vector-icons';
import { useKycGate } from '../shared/hooks/useKycGate';

interface GigDetailsScreenProps {
  route: any;
  navigation: any;
}

// Custom Slider component in pure React Native
const CustomSlider = ({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) => {
  const [width, setWidth] = useState(250);

  const handleTouch = (e: any) => {
    const x = e.nativeEvent.locationX;
    const pct = Math.max(0, Math.min(1, x / width));
    const val = min + pct * (max - min);
    onChange(Math.round(val));
  };

  const pct = (value - min) / (max - min);

  return (
    <View
      style={styles.sliderContainer}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
    >
      <View style={styles.sliderTrack} />
      <View style={[styles.sliderFill, { width: `${pct * 100}%` }]} />
      <View style={[styles.sliderKnob, { left: `${pct * 100}%` }]} />
    </View>
  );
};

export default function GigDetailsScreen({ route, navigation }: GigDetailsScreenProps) {
  const { job } = route.params;

  const [bidRate, setBidRate] = useState(job.budget);
  const [days, setDays] = useState('1');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  const requireKycOrToast = useKycGate();

  const handleSubmitBid = () => {
    requireKycOrToast(async () => {
      if (!days.trim() || isNaN(Number(days))) {
        Alert.alert('Error', 'Please enter a valid number of days.');
        return;
      }
      if (!coverLetter.trim()) {
        Alert.alert('Error', 'Please enter describe why you are a fit.');
        return;
      }
      setSubmitting(true);
      try {
        const response = await api.post(`/proposals/${job._id ?? job.id}`, {
          coverLetter: coverLetter.trim(),
          bidAmount: bidRate,
          estimatedDays: parseInt(days.trim(), 10),
        });

        if (response.data?.success) {
          Alert.alert('Success', 'Bid submitted successfully!');
          navigation.goBack();
        } else {
          Alert.alert('Error', response.data?.message || 'Failed to submit proposal.');
        }
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to submit proposal.');
      } finally {
        setSubmitting(false);
      }
    }, 'Complete KYC to bid on jobs');
  };

  const addressText = job.location?.address ?? job.address ?? 'Local area';
  const minBid = job.budget * 0.5;
  const maxBid = job.budget * 2.0;

  return (
    <SafeAreaView style={styles.root}>
      {/* App Bar Header */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color="#1D1B20" />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Gig Specifications</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Urgent Banner */}
        {(() => {
          const isUrgent = 
            job.isUrgent === true ||
            job.title?.toLowerCase().includes('urgent') || 
            job.description?.toLowerCase().includes('urgent') ||
            job.title?.toLowerCase().includes('emergency') || 
            job.description?.toLowerCase().includes('emergency');
          
          if (!isUrgent) return null;
          return (
            <View style={styles.urgentBanner}>
              <Feather name="alert-triangle" size={14} color="#ef4444" />
              <Text style={styles.urgentBannerText}>EMERGENCY / URGENT GIG</Text>
            </View>
          );
        })()}

        {/* Title */}
        <Text style={styles.jobTitle}>{job.title}</Text>
        <Text style={styles.jobCategory}>Category: {job.category || 'General'}</Text>

        {/* Client Est. Budget Card */}
        <View style={styles.budgetCard}>
          <Text style={styles.budgetLabel}>Client Est. Budget</Text>
          <Text style={styles.budgetValue}>₹{Math.round(job.budget)}</Text>
        </View>

        {/* Work Description */}
        <Text style={styles.sectionHeading}>Work Description</Text>
        <Text style={styles.descriptionText}>{job.description}</Text>

        {/* Location */}
        <Text style={styles.sectionHeading}>Location</Text>
        <Text style={styles.locationText}>{addressText}</Text>

        {/* Job Images */}
        {job.pictures && job.pictures.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionHeading}>Job Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.picturesScrollContent}>
              {job.pictures.map((url: string, idx: number) => (
                <TouchableOpacity key={url + idx} onPress={() => setSelectedImageUrl(url)}>
                  <Image source={{ uri: url }} style={styles.picturePreview} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.divider} />

        {/* Submit Your Bid Form */}
        <Text style={styles.formTitle}>Submit Your Bid</Text>

        <View style={styles.bidHeader}>
          <Text style={styles.bidLabel}>Your Proposed Quote</Text>
          <Text style={styles.bidRateValue}>₹{Math.round(bidRate)}</Text>
        </View>

        <CustomSlider
          value={bidRate}
          min={minBid}
          max={maxBid}
          onChange={setBidRate}
        />

        <Text style={styles.inputLabel}>Days to complete</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="numeric"
          value={days}
          onChangeText={setDays}
        />

        <Text style={styles.inputLabel}>Describe why you are a fit</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          multiline
          numberOfLines={4}
          placeholder="Write your proposal message..."
          placeholderTextColor="#9ca3af"
          value={coverLetter}
          onChangeText={setCoverLetter}
        />

        {/* Place Bid Button */}
        <TouchableOpacity
          style={[styles.placeBidBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmitBid}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.placeBidText}>Place Bid</Text>
          )}
        </TouchableOpacity>

        <View style={styles.spacing} />
      </ScrollView>

      {/* Full-screen Image Viewer Modal */}
      <Modal
        visible={!!selectedImageUrl}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImageUrl(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedImageUrl(null)}
        >
          <Image source={{ uri: selectedImageUrl || '' }} style={styles.fullImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedImageUrl(null)}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  appBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 4,
  },
  appBarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1D1B20',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    flex: 1,
    padding: 24,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1d1b20',
  },
  jobCategory: {
    color: '#059669',
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  budgetCard: {
    width: '100%',
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  budgetLabel: {
    fontWeight: 'bold',
    color: '#1d1b20',
    fontSize: 14,
  },
  budgetValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#047857',
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d1b20',
    marginTop: 20,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 22,
  },
  locationText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1b20',
    marginVertical: 16,
  },
  bidHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bidLabel: {
    fontSize: 14,
    color: '#1D1B20',
  },
  bidRateValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  sliderContainer: {
    height: 40,
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    width: '100%',
  },
  sliderFill: {
    height: 4,
    backgroundColor: '#059669',
    borderRadius: 2,
    position: 'absolute',
    left: 0,
  },
  sliderKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
    position: 'absolute',
    marginTop: -8,
    top: '50%',
    transform: [{ translateX: -10 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  inputLabel: {
    fontSize: 14,
    color: '#1D1B20',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#1d1b20',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
    marginBottom: 24,
  },
  placeBidBtn: {
    width: '100%',
    height: 56,
    backgroundColor: '#059669',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  placeBidText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spacing: {
    height: 60,
  },
  picturesScrollContent: {
    gap: 10,
    paddingVertical: 5,
  },
  picturePreview: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
  closeModalBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 16,
  },
  urgentBannerText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
