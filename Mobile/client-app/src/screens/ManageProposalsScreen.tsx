import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import api from '../services/api';
import { Feather, FontAwesome } from '@expo/vector-icons';

interface Proposal {
  _id: string;
  bidAmount: number;
  estimatedDays: number;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  freelancer: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    rating?: number;
    reviewsCount?: number;
    mobileNumber?: string;
  } | string;
  timeline?: string;
  statusBadge?: string;
  responseTime?: string;
}

interface ManageProposalsScreenProps {
  route: any;
  navigation: any;
}

export default function ManageProposalsScreen({ route, navigation }: ManageProposalsScreenProps) {
  const { jobId, jobTitle } = route.params || { jobId: '1', jobTitle: 'UI/UX Designer' };
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProposals = async () => {
    try {
      const response = await api.get(`/proposals/job/${jobId}`);
      let serverProposals = [];
      if (response.data?.success && Array.isArray(response.data.data)) {
        serverProposals = response.data.data;
      } else if (response.data?.success && Array.isArray(response.data.proposals)) {
        serverProposals = response.data.proposals;
      }

      if (serverProposals.length > 0) {
        // Map server proposals to structure
        const mapped = serverProposals.map((p: any) => ({
          ...p,
          timeline: p.estimatedDays ? `${Math.ceil(p.estimatedDays / 7)} weeks` : '2 weeks',
          responseTime: 'Fast',
        }));
        setProposals(mapped);
      } else {
        setProposals([]);
      }
    } catch (error) {
      console.error('Error fetching proposals:', error);
      setProposals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [jobId]);

  const handleAcceptProposal = (proposalId: string, freelancerName: string) => {
    Alert.alert(
      'Accept Proposal',
      `Are you sure you want to hire ${freelancerName} for this job? This will close application submissions and assign the task.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hire',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.put(`/proposals/${proposalId}/accept`);
              if (response.data.success) {
                Alert.alert('Success', 'Freelancer hired successfully! A task has been assigned.');
                navigation.goBack();
              }
            } catch (error: any) {
              const errMsg = error.response?.data?.message || 'Failed to accept proposal.';
              Alert.alert('Hiring Failed', errMsg);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRejectProposal = (proposalId: string, freelancerName: string) => {
    Alert.alert(
      'Reject Proposal',
      `Are you sure you want to reject ${freelancerName}'s proposal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await api.put(`/proposals/${proposalId}/reject`);
              if (response.data.success) {
                Alert.alert('Success', 'Proposal rejected.');
                fetchProposals();
              }
            } catch (error: any) {
              const errMsg = error.response?.data?.message || 'Failed to reject proposal.';
              Alert.alert('Action Failed', errMsg);
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderProposalItem = ({ item }: { item: Proposal }) => {
    const freelancer = typeof item.freelancer === 'object' && item.freelancer !== null
      ? item.freelancer
      : { name: 'Freelancer', _id: String(item.freelancer), avatar: undefined, rating: 4.8, reviewsCount: 15 };

    const avatarUrl = freelancer.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150';
    const rating = freelancer.rating || 4.8;
    const reviews = freelancer.reviewsCount || 12;

    return (
      <View style={styles.card}>
        {/* Profile Info Header */}
        <View style={styles.cardProfileRow}>
          <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          
          <View style={styles.profileDetailsCol}>
            <Text style={styles.freelancerName}>{freelancer.name}</Text>
            <View style={styles.ratingRow}>
              <FontAwesome name="star" size={13} color="#f59e0b" style={styles.starIcon} />
              <Text style={styles.ratingText}>{rating}</Text>
              <Text style={styles.reviewsText}>({reviews} reviews)</Text>
            </View>
          </View>

          <View style={styles.rateCol}>
            <Text style={styles.rateText}>${item.bidAmount}/hr</Text>
            <Text style={styles.rateLabel}>Proposed Rate</Text>
          </View>
        </View>

        {/* Bento grid stats inside card */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoBox}>
              <Feather name="calendar" size={14} color="#4f46e5" style={styles.bentoIcon} />
            <View>
              <Text style={styles.bentoTitle}>Timeline</Text>
              <Text style={styles.bentoValue}>{item.timeline || `${item.estimatedDays} days`}</Text>
            </View>
          </View>

          {item.statusBadge ? (
            <View style={styles.bentoBox}>
              <Feather name="shield" size={14} color="#10b981" style={styles.bentoIcon} />
              <View>
                <Text style={styles.bentoTitle}>Status</Text>
                <Text style={[styles.bentoValue, styles.emeraldText]}>{item.statusBadge}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.bentoBox}>
              <Feather name="zap" size={14} color="#4f46e5" style={styles.bentoIcon} />
              <View>
                <Text style={styles.bentoTitle}>Response Time</Text>
                <Text style={[styles.bentoValue, styles.blueText]}>{item.responseTime || 'Very Fast'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Cover Letter Snippet */}
        <View style={styles.coverLetterContainer}>
          <Text style={styles.coverLabel}>COVER LETTER SNIPPET</Text>
          <Text style={styles.coverText}>"{item.coverLetter}"</Text>
        </View>

        {/* Actions */}
        {item.status === 'pending' ? (
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.declineButton}
              onPress={() => handleRejectProposal(item._id, freelancer.name)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptProposal(item._id, freelancer.name)}
            >
              <Text style={styles.acceptButtonText}>Accept Proposal</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusLabelContainer}>
            <Text style={styles.statusText}>Status: {item.status.toUpperCase()}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeader}>
      {/* Breadcrumbs */}
      <View style={styles.breadcrumbsRow}>
        <Text style={styles.breadcrumbText}>Active Jobs</Text>
        <Feather name="chevron-right" size={12} color="#64748b" style={styles.breadcrumbArrow} />
        <Text style={[styles.breadcrumbText, styles.activeBreadcrumb]}>{jobTitle}</Text>
      </View>

      {/* Main Title */}
      <Text style={styles.pageTitle}>Proposals for {jobTitle}</Text>
      <Text style={styles.pageSubtitle}>
        Review and manage {proposals.length} active candidate bids for this position.
      </Text>

      {/* Filter / Sort Button Row */}
      <View style={styles.filterSortRow}>
        <TouchableOpacity style={styles.filterSortButton}>
          <Feather name="sliders" size={14} color="#334155" />
          <Text style={styles.filterSortButtonText}>Filter</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.filterSortButton}>
          <Feather name="bar-chart-2" size={14} color="#334155" style={{ transform: [{ rotate: '90deg' }] }} />
          <Text style={styles.filterSortButtonText}>Sort</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => (
    <View style={styles.listFooter}>
      {/* Job Overview */}
      <View style={styles.overviewCard}>
        <Text style={styles.overviewHeader}>Job Overview</Text>
        <Text style={styles.overviewSubtitle}>Total budget: $2,500 - $5,000</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Total Proposals</Text>
          <Text style={styles.statValue}>48</Text>
        </View>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Interviewing</Text>
          <Text style={styles.statValue}>3</Text>
        </View>

        <View style={[styles.statRow, { borderBottomWidth: 0 }]}>
          <Text style={styles.statLabel}>Average Bid</Text>
          <Text style={styles.statValue}>$58/hr</Text>
        </View>
      </View>

      {/* Hiring Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsHeader}>HIRING TIPS</Text>
        
        <View style={styles.tipItem}>
          <Feather name="help-circle" size={16} color="#4f46e5" style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Look for candidates who mention your specific industry challenges in their letter.
          </Text>
        </View>

        <View style={styles.tipItem}>
          <Feather name="check-circle" size={16} color="#10b981" style={styles.tipIcon} />
          <Text style={styles.tipText}>
            Top-rated freelancers are 40% more likely to deliver within the initial deadline.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={22} color="#1e1b4b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hiring Portal</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="bell" size={20} color="#1e1b4b" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarButton}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' }}
              style={styles.headerAvatar}
            />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#1e1b4b" />
        </View>
      ) : (
        <FlatList
          data={proposals}
          renderItem={renderProposalItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📄</Text>
              <Text style={styles.emptyText}>No proposals submitted for this gig yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    padding: 4,
  },
  avatarButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerAvatar: {
    width: '100%',
    height: '100%',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: 40,
  },
  listHeader: {
    padding: 16,
  },
  breadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  breadcrumbText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  activeBreadcrumb: {
    color: '#1e1b4b',
    fontWeight: '600',
  },
  breadcrumbArrow: {
    marginHorizontal: 4,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1e1b4b',
    lineHeight: 28,
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
    lineHeight: 20,
  },
  filterSortRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  filterSortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  filterSortButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
  },
  profileDetailsCol: {
    flex: 1,
    marginLeft: 12,
  },
  freelancerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e1b4b',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  starIcon: {
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  reviewsText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  rateCol: {
    alignItems: 'flex-end',
  },
  rateText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e1b4b',
  },
  rateLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  bentoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 16,
  },
  bentoBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  bentoIcon: {
    marginRight: 2,
  },
  bentoTitle: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  bentoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1e1b4b',
    marginTop: 1,
  },
  emeraldText: {
    color: '#059669',
  },
  blueText: {
    color: '#4f46e5',
  },
  coverLetterContainer: {
    marginTop: 16,
  },
  coverLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  coverText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginTop: 6,
    fontStyle: 'italic',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  declineButton: {
    flex: 0.35,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  declineButtonText: {
    color: '#1d1b20',
    fontWeight: '700',
    fontSize: 14,
  },
  acceptButton: {
    flex: 0.65,
    backgroundColor: '#1e1b4b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  acceptButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  statusLabelContainer: {
    marginTop: 16,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  listFooter: {
    padding: 16,
  },
  overviewCard: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  overviewHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  overviewSubtitle: {
    fontSize: 13,
    color: '#93c5fd',
    marginTop: 4,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    fontSize: 13,
    color: '#dbeafe',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  tipsCard: {
    backgroundColor: '#f8f7ff',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  tipsHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e1b4b',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipIcon: {
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#1e1b4b',
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 128,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
});
