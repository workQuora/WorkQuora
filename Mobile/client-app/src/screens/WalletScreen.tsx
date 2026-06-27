import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api, { getApiData } from '../services/api';
import { useKycGate } from '../shared/hooks/useKycGate';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface Transaction {
  _id: string;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
}

interface WalletScreenProps {
  navigation: any;
}

export default function WalletScreen({ navigation }: WalletScreenProps) {
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [activeJobs, setActiveJobs] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const requireKycOrToast = useKycGate();
  const { user } = useSelector((s: RootState) => s.auth);
  
  // Simulation states
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const fetchWalletAndTransactions = async () => {
    try {
      // 1. Fetch Client Dashboard (to get Escrow Balance and stats)
      const dashboardRes = await api.get('/dashboard/client');
      const dashboardData = getApiData(dashboardRes);
      if (dashboardData) {
        if (dashboardData.finances) {
          setEscrowBalance(dashboardData.finances.escrowBalance || 0);
        }
        if (dashboardData.stats) {
          setTotalSpent(dashboardData.stats.totalSpent || 0);
          setActiveJobs(dashboardData.stats.activeJobs || 0);
        }
      }

      // 2. Fetch Transaction History
      const transactionsRes = await api.get('/wallet/transactions');
      const transactionsData = getApiData(transactionsRes);
      let txList: Transaction[] = [];
      if (Array.isArray(transactionsData)) {
        txList = transactionsData;
      } else if (transactionsRes.data?.data && Array.isArray(transactionsRes.data.data)) {
        txList = transactionsRes.data.data;
      }
      setTransactions(txList);
      setFilteredTransactions(txList);
    } catch (error) {
      console.error('Error fetching wallet/transactions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWalletAndTransactions();
    const unsubscribe = navigation.addListener('focus', () => {
      fetchWalletAndTransactions();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTransactions(transactions);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = transactions.filter((tx) => 
        tx.type.toLowerCase().includes(query) ||
        tx.status.toLowerCase().includes(query) ||
        tx.amount.toString().includes(query)
      );
      setFilteredTransactions(filtered);
    }
  }, [searchQuery, transactions]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchWalletAndTransactions();
  };

  const handleDepositMock = () => {
    setIsDepositing(true);
    setTimeout(() => {
      setIsDepositing(false);
      Alert.alert(
        'Deposit Funds',
        'Payment gateways (Razorpay) require secure SDK routing. Please deposit funds on the Web Portal or proceed with our testing setup.',
        [{ text: 'OK' }]
      );
    }, 1200);
  };

  const handleWithdrawMock = () => {
    setIsWithdrawing(true);
    setTimeout(() => {
      setIsWithdrawing(false);
      Alert.alert(
        'Withdraw Refund',
        'Refund transactions are processed directly to the original payment source. If you have active dispute refunds, please check your email dashboard.',
        [{ text: 'OK' }]
      );
    }, 1200);
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isDebit = item.type === 'withdrawal' || item.type === 'payout' || item.type === 'escrow_deposit';
    const date = new Date(item.createdAt).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });

    return (
      <View style={styles.transactionRow}>
        <View style={styles.txLeft}>
          <View style={[styles.txIconBox, isDebit ? styles.debitIconBox : styles.creditIconBox]}>
            <Feather 
              name={isDebit ? "arrow-up-right" : "arrow-down-left"} 
              size={18} 
              color={isDebit ? "#ef4444" : "#10b981"} 
            />
          </View>
          <View style={styles.txMeta}>
            <Text style={styles.txType}>{item.type.replace('_', ' ').toUpperCase()}</Text>
            <Text style={styles.txDate}>Project Transaction • {date}</Text>
          </View>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, isDebit ? styles.txDebit : styles.txCredit]}>
            {isDebit ? '-' : '+'}₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.txStatus}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#1e1b4b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIcon}>
            <Feather name="chevron-left" size={24} color="#1e1b4b" />
          </TouchableOpacity>
          <Text style={styles.topBarLogo}>Escrow Vault</Text>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>Premium Tier</Text>
          </View>
          <View style={styles.avatarContainer}>
            {(user as any)?.profilePic || (user as any)?.avatar ? (
              <Image source={{ uri: (user as any).profilePic || (user as any).avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, { backgroundColor: '#4f46e5', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                  {((user as any)?.name?.split(' ')[0] || 'C')[0]?.toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <View style={styles.headerComponent}>
            {/* Balance Card */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceTitle}>Available Escrow Balance</Text>
                <Feather name="shield" size={16} color="rgba(255,255,255,0.7)" />
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.currencySymbol}>₹</Text>
                <Text style={styles.balanceAmount}>{escrowBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</Text>
              </View>
              <View style={styles.trendRow}>
                <Feather name="trending-up" size={16} color="#34d399" />
                <Text style={styles.trendText}>+12% from last month</Text>
              </View>
              {/* Decorative Circle overlay */}
              <View style={styles.decoCircle} />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionGrid}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.withdrawBtn]} 
                onPress={() => requireKycOrToast(handleWithdrawMock, 'Complete KYC to withdraw funds')}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? (
                  <ActivityIndicator size="small" color="#1e1b4b" />
                ) : (
                  <>
                    <Feather name="arrow-up-right" size={20} color="#1e1b4b" style={styles.btnIcon} />
                    <Text style={styles.withdrawBtnText}>Withdraw</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.depositBtn]} 
                onPress={() => requireKycOrToast(handleDepositMock, 'Complete KYC to deposit funds')}
                disabled={isDepositing}
              >
                {isDepositing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="plus-circle" size={20} color="#fff" style={styles.btnIcon} />
                    <Text style={styles.depositBtnText}>Deposit</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Search & Filter */}
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search transactions..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
              <TouchableOpacity style={styles.filterBtn} onPress={() => Alert.alert('Filter', 'Filter options: All, Deposits, Withdrawals, Escrow Holds')}>
                <Feather name="sliders" size={20} color="#4b5563" />
              </TouchableOpacity>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => Alert.alert('History', 'You are viewing all recent project payments.')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color="#9ca3af" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No transaction records found.</Text>
            <Text style={styles.emptySubtext}>Escrow updates will appear here once you post or fund a gig.</Text>
          </View>
        }
        ListFooterComponent={
          filteredTransactions.length > 0 ? (
            <View style={styles.bentoSection}>
              <Text style={styles.bentoSectionTitle}>Financial Insights</Text>
              <View style={styles.bentoGrid}>
                <View style={[styles.bentoCard, { backgroundColor: '#f8f7ff', borderColor: '#e0e7ff', borderWidth: 1 }]}>
                  <Feather name="trending-up" size={24} color="#4f46e5" />
                  <Text style={styles.bentoLabel}>Spent this Month</Text>
                  <Text style={styles.bentoValue}>₹{totalSpent.toLocaleString('en-IN')}</Text>
                </View>
                <View style={[styles.bentoCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1 }]}>
                  <Feather name="lock" size={24} color="#d97706" />
                  <Text style={styles.bentoLabel}>Active Funded Gigs</Text>
                  <Text style={styles.bentoValue}>{activeJobs}</Text>
                </View>
              </View>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7ff',
  },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
    backgroundColor: '#ffffff',
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    marginRight: 16,
  },
  topBarLogo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e1b4b',
    fontFamily: 'Inter',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierBadge: {
    backgroundColor: '#f8f7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginRight: 10,
  },
  tierText: {
    color: '#1e1b4b',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    overflow: 'hidden',
    backgroundColor: '#f8f7ff',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f7ff',
  },
  headerComponent: {
    paddingTop: 16,
  },
  balanceCard: {
    backgroundColor: '#1e1b4b', // Dark Indigo theme accent
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8,
  },
  currencySymbol: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    marginRight: 4,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  trendText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
    fontFamily: 'Inter',
  },
  decoCircle: {
    position: 'absolute',
    bottom: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 0.48,
    height: 52,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  withdrawBtn: {
    backgroundColor: '#f8f7ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  withdrawBtnText: {
    color: '#1e1b4b',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  depositBtn: {
    backgroundColor: '#4f46e5',
  },
  depositBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  btnIcon: {
    marginRight: 8,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f7ff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1d1b20',
    fontFamily: 'Inter',
    paddingVertical: 8,
  },
  filterBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f8f7ff',
    borderWidth: 1,
    borderColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
  },
  seeAllText: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e7ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 0.7,
  },
  txIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debitIconBox: {
    backgroundColor: '#fef2f2',
  },
  creditIconBox: {
    backgroundColor: '#ecfdf5',
  },
  txMeta: {
    marginLeft: 12,
  },
  txType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
  },
  txDate: {
    fontSize: 12,
    color: '#6366f1',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
    flex: 0.3,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  txDebit: {
    color: '#ef4444',
  },
  txCredit: {
    color: '#10b981',
  },
  txStatus: {
    fontSize: 10,
    color: '#6366f1',
    fontFamily: 'Inter',
    marginTop: 2,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6366f1',
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: 6,
  },
  bentoSection: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  bentoSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  bentoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bentoCard: {
    flex: 0.48,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    height: 110,
  },
  bentoLabel: {
    fontSize: 12,
    color: '#6366f1',
    fontFamily: 'Inter',
    fontWeight: '500',
    marginTop: 8,
  },
  bentoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
    marginTop: 2,
  },
});
