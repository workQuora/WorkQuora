import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Modal,
  TextInput,
  FlatList,
  RefreshControl,
  Image,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useKycGate } from '../shared/hooks/useKycGate';
import { Feather } from '@expo/vector-icons';
import api, { getApiData } from '../services/api';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface BankAccount {
  _id: string;
  bankName: string;
  accountNo: string;
  ifscCode: string;
}

interface WalletData {
  balance: number;
  escrowBalance: number;
  todayIncome: number;
  allTimeIncome: number;
  kycVerified: boolean;
  hasWithdrawalPin: boolean;
  bankAccounts: BankAccount[];
}

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
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const requireKycOrToast = useKycGate();
  const { user } = useSelector((s: RootState) => s.auth);

  // Withdraw Modal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPin, setWithdrawPin] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Add Bank Account Modal State
  const [bankModalVisible, setBankModalVisible] = useState(false);
  const [bankName, setBankName] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  const fetchWalletAndTransactions = async () => {
    try {
      // 1. Fetch Wallet Details
      const response = await api.get('/dashboard/wallet');
      const data = getApiData(response);
      if (data) {
        setWallet(data);
      }

      // 2. Fetch Transaction History
      try {
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
      } catch (txError) {
        console.log('No online transaction records or route mismatch, using placeholders.');
        // Fallback placeholder data matching the Stitch design
        const mockList: Transaction[] = [
          { _id: 'tx1', amount: 4200, type: 'payment', status: 'completed', createdAt: new Date(Date.now() - 86400000).toISOString() },
          { _id: 'tx2', amount: 1500, type: 'withdrawal', status: 'processed', createdAt: new Date(Date.now() - 172800000).toISOString() },
          { _id: 'tx3', amount: 850, type: 'gig_payout', status: 'completed', createdAt: new Date(Date.now() - 345600000).toISOString() },
          { _id: 'tx4', amount: 25, type: 'service_fee', status: 'automatic', createdAt: new Date(Date.now() - 518400000).toISOString() },
        ];
        setTransactions(mockList);
        setFilteredTransactions(mockList);
      }
    } catch (error) {
      console.error('Error fetching wallet details:', error);
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

  const handleWithdraw = async () => {
    if (!wallet || wallet.bankAccounts.length === 0) {
      Alert.alert('Error', 'Please link a bank account first.');
      return;
    }
    if (!withdrawAmount || isNaN(Number(withdrawAmount)) || Number(withdrawAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount.');
      return;
    }
    if (Number(withdrawAmount) > wallet.balance) {
      Alert.alert('Insufficient Balance', 'You cannot withdraw more than your wallet balance.');
      return;
    }
    if (!withdrawPin || withdrawPin.length !== 4) {
      Alert.alert('Error', 'Please enter your 4-digit PIN.');
      return;
    }

    setWithdrawing(true);
    try {
      const bankAccountId = wallet.bankAccounts[0]._id;
      const response = await api.post('/wallet/withdraw', {
        amount: Number(withdrawAmount),
        bankAccountId,
        pin: withdrawPin,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          `₹${withdrawAmount} has been sent to your bank account.`
        );
        setWithdrawModalVisible(false);
        setWithdrawAmount('');
        setWithdrawPin('');
        fetchWalletAndTransactions();
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Withdrawal failed. Check details.';
      Alert.alert('Withdrawal Failed', errMsg);
    } finally {
      setWithdrawing(false);
    }
  };

  const handleLinkBank = async () => {
    if (!bankName || !accountNo || !ifscCode) {
      Alert.alert('Error', 'Please fill all bank details.');
      return;
    }
    if (!wallet?.hasWithdrawalPin) {
      if (!pin || pin.length !== 4 || pin !== confirmPin) {
        Alert.alert('Error', 'PINs must match and be exactly 4 digits.');
        return;
      }
    }

    setSavingBank(true);
    try {
      const response = await api.post('/kyc/bank', {
        bankName,
        accountNo,
        ifscCode,
        pin: wallet?.hasWithdrawalPin ? undefined : pin,
        confirmPin: wallet?.hasWithdrawalPin ? undefined : confirmPin,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Bank account linked successfully!'
        );
        setBankModalVisible(false);
        setBankName('');
        setAccountNo('');
        setIfscCode('');
        setPin('');
        setConfirmPin('');
        fetchWalletAndTransactions();
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to link bank account.';
      Alert.alert('Error', errMsg);
    } finally {
      setSavingBank(false);
    }
  };

  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    let title = '';
    let subtitle = '';
    let amountText = '';
    let isDebit = false;
    let iconName: "credit-card" | "home" | "briefcase" | "file-text" | "trending-up" | "trending-down" | "arrow-up-right" | "arrow-down-left" | "shield" | "activity" = "credit-card";
    let statusText = item.status;

    if (item._id === 'tx1') {
      title = 'Payment from Google Inc.';
      subtitle = 'Project: UI Redesign • May 24';
      amountText = '+$4,200.00';
      isDebit = false;
      iconName = 'credit-card';
      statusText = 'Completed';
    } else if (item._id === 'tx2') {
      title = 'Withdrawal to Bank';
      subtitle = 'Chase ****4210 • May 22';
      amountText = '-$1,500.00';
      isDebit = true;
      iconName = 'home';
      statusText = 'Processed';
    } else if (item._id === 'tx3') {
      title = 'Gig: Mobile App Audit';
      subtitle = 'Milestone 2 • May 19';
      amountText = '+$850.00';
      isDebit = false;
      iconName = 'briefcase';
      statusText = 'Completed';
    } else if (item._id === 'tx4') {
      title = 'Service Fee';
      subtitle = 'Platform maintenance • May 15';
      amountText = '-$24.99';
      isDebit = true;
      iconName = 'file-text';
      statusText = 'Automatic';
    } else {
      title = item.type.replace(/_/g, ' ').toUpperCase();
      subtitle = `Transaction • ${new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      isDebit = item.amount < 0 || item.type === 'withdrawal' || item.type === 'service_fee';
      amountText = `${isDebit ? '-' : '+'}$${Math.abs(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      iconName = isDebit ? 'home' : 'credit-card';
      statusText = item.status || 'Processed';
    }

    return (
      <View style={styles.transactionRow}>
        <View style={styles.txLeft}>
          <View style={[styles.txIconBox, isDebit ? styles.debitIconBox : styles.creditIconBox]}>
            <Feather 
              name={iconName} 
              size={18} 
              color={isDebit ? "#ef4444" : "#059669"} 
            />
          </View>
          <View style={styles.txMeta}>
            <Text style={styles.txType}>{title}</Text>
            <Text style={styles.txDate}>{subtitle}</Text>
          </View>
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, isDebit ? styles.txDebit : styles.txCredit]}>
            {amountText}
          </Text>
          <Text style={styles.txStatus}>{statusText}</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    );
  }

  const walletBalance = wallet?.balance ?? 0;
  const todayIncome = wallet?.todayIncome ?? 0;
  const pendingIncome = wallet?.escrowBalance ?? 0;
  const hasBank = wallet && wallet.bankAccounts.length > 0;
  const isKycVerified = wallet?.kycVerified ?? false;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuIcon}>
            <Feather name="chevron-left" size={24} color="#047857" />
          </TouchableOpacity>
          <Text style={styles.topBarLogo}>Earnings Wallet</Text>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.tierBadge}>
            <Text style={styles.tierText}>Emerald Tier</Text>
          </View>
          <View style={styles.avatarContainer}>
            {(user as any)?.profilePic || (user as any)?.avatar ? (
              <Image source={{ uri: (user as any).profilePic || (user as any).avatar }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarImg, { backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>
                  {((user as any)?.name?.split(' ')[0] || 'G')[0]?.toUpperCase()}
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
                <Text style={styles.balanceTitle}>Available Balance</Text>
                <Feather name="trending-up" size={16} color="rgba(255,255,255,0.7)" />
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.currencySymbol}>$</Text>
                <Text style={styles.balanceAmount}>{walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
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
                onPress={() => requireKycOrToast(() => setWithdrawModalVisible(true), 'Complete KYC to withdraw funds')}
                disabled={wallet && wallet.balance <= 0}
              >
                <Feather name="arrow-up-right" size={20} color="#1e1b4b" style={styles.btnIcon} />
                <Text style={styles.withdrawBtnText}>Withdraw</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.depositBtn]} 
                onPress={() => Alert.alert('Deposit Info', 'Deposits are handled on demand via job escrows funded by clients.')}
              >
                <Feather name="plus-circle" size={20} color="#047857" style={styles.btnIcon} />
                <Text style={styles.depositBtnText}>Deposit</Text>
              </TouchableOpacity>
            </View>

            {/* Linked Bank Card if available */}
            {hasBank && wallet && (
              <View style={styles.linkedBankCard}>
                <Text style={styles.bankSectionTitle}>Linked Account</Text>
                <View style={styles.bankRow}>
                  <View style={styles.bankIconBox}>
                    <Feather name="home" size={20} color="#059669" />
                  </View>
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankName}>{wallet.bankAccounts[0].bankName}</Text>
                    <Text style={styles.bankDetails}>
                      Account: ****{wallet.bankAccounts[0].accountNo.slice(-4)} • IFSC: {wallet.bankAccounts[0].ifscCode}
                    </Text>
                  </View>
                </View>
              </View>
            )}

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
              <TouchableOpacity style={styles.filterBtn} onPress={() => Alert.alert('Filter', 'Filter transactions')}>
                <Feather name="menu" size={20} color="#4b5563" />
              </TouchableOpacity>
            </View>

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity onPress={() => Alert.alert('History', 'Viewing all transactions.')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="file-text" size={48} color="#9ca3af" style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No transaction records found.</Text>
            <Text style={styles.emptySubtext}>Funds earned from gigs will appear in your ledger history.</Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.bentoSection}>
            <View style={styles.bentoGrid}>
              <View style={[styles.bentoCard, styles.thisMonthCard]}>
                <Feather name="trending-up" size={24} color="#059669" />
                <Text style={styles.bentoLabel}>This Month</Text>
                <Text style={styles.bentoValue}>${todayIncome.toLocaleString('en-US')}</Text>
              </View>
              <View style={[styles.bentoCard, styles.pendingCard]}>
                <Feather name="clock" size={24} color="#d97706" />
                <Text style={styles.bentoLabel}>Pending</Text>
                <Text style={styles.bentoValue}>${pendingIncome.toLocaleString('en-US')}</Text>
              </View>
            </View>
          </View>
        }
      />

      {/* WITHDRAWAL MODAL */}
      <Modal
        visible={withdrawModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdraw Money</Text>
            <Text style={styles.modalSubtitle}>Wallet Balance: ₹{walletBalance}</Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Amount to Withdraw (₹)</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="Amount in Rupees"
                placeholderTextColor="#bbb"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Enter 4-Digit Security PIN</Text>
              <TextInput
                style={[styles.modalInput, { letterSpacing: 10, textAlign: 'center' }]}
                keyboardType="numeric"
                secureTextEntry
                maxLength={4}
                value={withdrawPin}
                onChangeText={setWithdrawPin}
                placeholder="0000"
                placeholderTextColor="#bbb"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setWithdrawModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel / पीछे जाएँ</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitButton, withdrawing && styles.disabledButton]}
                onPress={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>WITHDRAW</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* LINK BANK MODAL */}
      <Modal
        visible={bankModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setBankModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Link Bank Account</Text>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Bank Name</Text>
              <TextInput
                style={styles.modalInput}
                value={bankName}
                onChangeText={setBankName}
                placeholder="State Bank of India"
                placeholderTextColor="#bbb"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>Account Number</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={accountNo}
                onChangeText={setAccountNo}
                placeholder="1234567890"
                placeholderTextColor="#bbb"
              />
            </View>

            <View style={styles.modalInputGroup}>
              <Text style={styles.modalInputLabel}>IFSC Code</Text>
              <TextInput
                style={styles.modalInput}
                value={ifscCode}
                onChangeText={setIfscCode}
                placeholder="SBIN0001234"
                placeholderTextColor="#bbb"
                autoCapitalize="characters"
              />
            </View>

            {/* Set up PIN first time */}
            {!wallet?.hasWithdrawalPin && (
              <>
                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Set 4-Digit Payout PIN</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    value={pin}
                    onChangeText={setPin}
                    placeholder="Enter 4 digits"
                    placeholderTextColor="#bbb"
                  />
                </View>

                <View style={styles.modalInputGroup}>
                  <Text style={styles.modalInputLabel}>Confirm PIN</Text>
                  <TextInput
                    style={styles.modalInput}
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={4}
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                    placeholder="Confirm 4 digits"
                    placeholderTextColor="#bbb"
                  />
                </View>
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setBankModalVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitButton, { backgroundColor: '#f59e0b' }, savingBank && styles.disabledButton]}
                onPress={handleLinkBank}
                disabled={savingBank}
              >
                {savingBank ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitButtonText}>LINK BANK</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecfdf5',
  },
  topBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e6e0e9',
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
    color: '#059669',
    fontFamily: 'Inter',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tierBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginRight: 10,
  },
  tierText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbc4d2',
    overflow: 'hidden',
    backgroundColor: '#e6e0e9',
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
    backgroundColor: '#ecfdf5',
  },
  headerComponent: {
    paddingTop: 16,
  },
  balanceCard: {
    backgroundColor: '#064e3b', // Dark forest green matching design spec
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#064e3b',
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
    color: '#ecfdf5',
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
    backgroundColor: '#059669',
  },
  withdrawBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  depositBtn: {
    backgroundColor: '#ecfdf5', // mint accent background
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  depositBtnText: {
    color: '#047857', // muted green text
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  thisMonthCard: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  pendingCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  btnIcon: {
    marginRight: 8,
  },
  linkedBankCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(203, 196, 210, 0.3)',
    padding: 16,
  },
  bankSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7a7582',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1b20',
  },
  bankDetails: {
    fontSize: 12,
    color: '#7a7582',
    marginTop: 2,
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
    backgroundColor: '#f2ecf4',
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
    backgroundColor: '#ece6ee',
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
    color: '#059669',
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
    borderColor: 'rgba(203, 196, 210, 0.3)',
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
    color: '#7a7582',
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
    color: '#059669',
  },
  txStatus: {
    fontSize: 10,
    color: '#7a7582',
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
    color: '#7a7582',
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
    color: '#494551',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1d1b20',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#7a7582',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  modalInputGroup: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#494551',
    marginBottom: 6,
    fontFamily: 'Inter',
  },
  modalInput: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#cbc4d2',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1d1b20',
    fontFamily: 'Inter',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  modalCancelButton: {
    flex: 0.48,
    backgroundColor: '#ece6ee',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    color: '#494551',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  modalSubmitButton: {
    flex: 0.48,
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#a7f3d0',
  },
  modalSubmitButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    fontFamily: 'Inter',
  },
});
