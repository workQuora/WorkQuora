import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import CategoryChip from './CategoryChip';

export interface JobData {
  _id: string;
  title: string;
  category: string;
  description: string;
  budget: number;
  budgetType: 'fixed' | 'hourly';
  duration?: string;
  proposalsCount?: number;
  status: string;
  createdAt: string;
}

interface JobCardProps {
  job: JobData;
  onPress?: () => void;
}

export default function JobCard({ job, onPress }: JobCardProps) {
  const { colors, isClient } = useTheme();

  const formattedBudget = `₹${job.budget.toLocaleString('en-IN')}`;
  const budgetSub = job.budgetType === 'hourly' ? '/ hr' : ' fixed';

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
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {job.title}
        </Text>
        <Text style={[styles.budget, { color: colors.primary }]}>
          {formattedBudget}
          <Text style={[styles.budgetSub, { color: colors.textMuted }]}>{budgetSub}</Text>
        </Text>
      </View>

      <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
        {job.description}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.chips}>
          <CategoryChip label={job.category} active />
        </View>
        
        <View style={styles.details}>
          <Feather name="calendar" size={13} color={colors.textMuted} style={styles.metaIcon} />
          <Text style={[styles.metaText, { color: colors.textMuted }]}>
            {job.duration || 'Flexible'}
          </Text>
          {job.proposalsCount !== undefined && (
            <>
              <View style={[styles.dot, { backgroundColor: colors.border }]} />
              <Feather name="users" size={13} color={colors.textMuted} style={styles.metaIcon} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {job.proposalsCount} bids
              </Text>
            </>
          )}
        </View>
      </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  budget: {
    fontSize: 16,
    fontWeight: '800',
  },
  budgetSub: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  chips: {
    flexDirection: 'row',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    marginRight: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 8,
  },
});
