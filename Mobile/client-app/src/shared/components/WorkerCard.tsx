import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import CategoryChip from './CategoryChip';

export interface WorkerData {
  _id: string;
  name: string;
  avatar?: string;
  hourlyRate?: number;
  rating?: number;
  reviewsCount?: number;
  skills: string[];
  bio?: string;
  kycVerified?: boolean;
}

interface WorkerCardProps {
  worker: WorkerData;
  onPress?: () => void;
}

export default function WorkerCard({ worker, onPress }: WorkerCardProps) {
  const { colors } = useTheme();

  const initials = worker.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
  const ratingText = worker.rating ? `${worker.rating.toFixed(1)} (${worker.reviewsCount || 0} reviews)` : '5.0 (0 reviews)';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.topRow}>
        <View style={styles.avatarContainer}>
          {worker.avatar ? (
            <Image source={{ uri: worker.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: colors.accent }]}>
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
            </View>
          )}
          {worker.kycVerified && (
            <View style={[styles.badge, { backgroundColor: colors.white }]}>
              <Feather name="check-circle" size={12} color="#0077ff" />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {worker.name}
          </Text>
          <View style={styles.ratingRow}>
            <Feather name="star" size={13} color="#f59e0b" style={styles.starIcon} />
            <Text style={[styles.rating, { color: colors.textMuted }]}>{ratingText}</Text>
          </View>
        </View>

        {worker.hourlyRate !== undefined && (
          <View style={styles.rateBox}>
            <Text style={[styles.rate, { color: colors.primary }]}>
              ₹{worker.hourlyRate}
            </Text>
            <Text style={[styles.rateLabel, { color: colors.textMuted }]}>/ hr</Text>
          </View>
        )}
      </View>

      {worker.bio && (
        <Text style={[styles.bio, { color: colors.textMuted }]} numberOfLines={2}>
          {worker.bio}
        </Text>
      )}

      {Array.isArray(worker.skills) && worker.skills.length > 0 && (
        <View style={styles.skillsRow}>
          {worker.skills.slice(0, 3).map((skill, idx) => (
            <CategoryChip key={idx} label={skill} active={idx === 0} />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 8,
    padding: 2,
    elevation: 1,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginRight: 4,
  },
  rating: {
    fontSize: 12,
    fontWeight: '500',
  },
  rateBox: {
    alignItems: 'flex-end',
  },
  rate: {
    fontSize: 15,
    fontWeight: '800',
  },
  rateLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  bio: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
});
