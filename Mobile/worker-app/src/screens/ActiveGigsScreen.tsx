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
  TextInput,
  RefreshControl,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import api, { getApiData } from '../services/api';

const { width, height } = Dimensions.get('window');

interface Task {
  _id: string;
  status: 'assigned' | 'traveling' | 'working' | 'completed' | 'cancelled';
  assignedAt: string;
  job: {
    _id: string;
    title: string;
    budgetRange?: {
      min?: number;
      max?: number;
    };
    budget?: number;
    location?: {
      address?: string;
    };
  };
}

interface ActiveGigsScreenProps {
  navigation: any;
}

export default function ActiveGigsScreen({ navigation }: ActiveGigsScreenProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Navigation simulation states
  const [isNavigating, setIsNavigating] = useState(false);
  const [clientPin, setClientPin] = useState(['', '', '', '']);
  const [showPinPad, setShowPinPad] = useState(false);

  const fetchActiveGigs = async () => {
    try {
      const response = await api.get('/dashboard/freelancer');
      const responseData = getApiData(response);
      
      if (responseData && responseData.recentTasks) {
        setTasks(responseData.recentTasks);
        
        // Auto-select first active task if any is in traveling or working state
        const active = responseData.recentTasks.find(
          (t: Task) => t.status === 'traveling' || t.status === 'working'
        );
        if (active) {
          setSelectedTask(active);
        }
      }
    } catch (error) {
      console.error('Error fetching active gigs:', error);
      Alert.alert('Error', 'Failed to load active gigs.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActiveGigs();

    const unsubscribe = navigation.addListener('focus', () => {
      fetchActiveGigs();
    });
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActiveGigs();
  };

  const handleUpdateStatus = async (taskId: string, nextStatus: 'traveling' | 'working' | 'completed') => {
    setUpdatingStatus(true);
    try {
      const response = await api.put(`/tasks/${taskId}/status`, { status: nextStatus });
      if (response.data.success) {
        Alert.alert('Success', 'Task status updated!');
        await fetchActiveGigs();
        // Update selected task in detail view
        const updated = tasks.find(t => t._id === taskId);
        if (updated) {
          setSelectedTask({ ...updated, status: nextStatus });
        } else {
          setSelectedTask(null);
        }
      }
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Failed to update task status.';
      Alert.alert('Error', errMsg);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handlePinSubmit = (taskId: string) => {
    const pinString = clientPin.join('');
    if (pinString.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit verification PIN.');
      return;
    }
    // Simple verification check - for demo we accept any PIN, in real we submit it
    Alert.alert(
      'PIN Verified',
      'Client verification PIN matches successfully! Starting work setup...',
      [
        {
          text: 'OK',
          onPress: () => {
            handleUpdateStatus(taskId, 'working');
            setClientPin(['', '', '', '']);
          }
        }
      ]
    );
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'assigned': return 'Assigned';
      case 'traveling': return 'Traveling';
      case 'working': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#059669';
      case 'traveling': return '#f59e0b';
      case 'working': return '#059669';
      case 'completed': return '#6b7280';
      default: return '#ef4444';
    }
  };

  const renderTaskCard = ({ item }: { item: Task }) => {
    const job = item.job || {};
    const budget = job.budget ?? 0;
    const statusColor = getStatusColor(item.status);

    return (
      <TouchableOpacity 
        style={styles.card}
        onPress={() => setSelectedTask(item)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '15' }]}>
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {getStatusText(item.status).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.cardBudget}>₹{budget.toLocaleString('en-IN')}</Text>
        </View>

        <Text style={styles.cardTitle}>{job.title || 'Untitled Gig'}</Text>
        <Text style={styles.cardAddress} numberOfLines={1}>
          📍 {job.location?.address || 'Local Site Location'}
        </Text>
        <Text style={styles.cardDate}>Assigned on: {new Date(item.assignedAt).toLocaleDateString()}</Text>

        <View style={styles.cardActions}>
          <Text style={styles.actionPrompt}>Tap to view route map & verification</Text>
          <Feather name="chevron-right" size={20} color="#059669" />
        </View>
      </TouchableOpacity>
    );
  };

  // --- JOB DETAIL / ROUTE NAVIGATION VIEW ---
  if (selectedTask) {
    const job = selectedTask.job || {};
    const status = selectedTask.status;

    if (showPinPad) {
      const taskTitle = job.title || 'Luxury Lobby Maintenance';
      const pinString = clientPin.join('');
      const isPinComplete = pinString.length === 4;

      const handleKeyPress = (num: string) => {
        const nextPin = [...clientPin];
        const emptyIdx = nextPin.findIndex(val => val === '');
        if (emptyIdx !== -1) {
          nextPin[emptyIdx] = num;
          setClientPin(nextPin);
        }
      };

      const handleBackspace = () => {
        const nextPin = [...clientPin];
        let lastFilledIdx = -1;
        for (let i = 3; i >= 0; i--) {
          if (nextPin[i] !== '') {
            lastFilledIdx = i;
            break;
          }
        }
        if (lastFilledIdx !== -1) {
          nextPin[lastFilledIdx] = '';
          setClientPin(nextPin);
        }
      };

      return (
        <SafeAreaView style={styles.pinContainer}>
          {/* Back header */}
          <View style={styles.pinHeader}>
            <TouchableOpacity onPress={() => setShowPinPad(false)} style={styles.pinBackBtn}>
              <Feather name="arrow-left" size={24} color="#059669" />
            </TouchableOpacity>
            <Text style={styles.pinHeaderTitle}>Verification</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.pinScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.pinMainTitle}>Start Your Session</Text>
            <Text style={styles.pinMainSub}>
              Enter the 4-digit PIN provided by the client to verify your arrival.
            </Text>

            {/* Current Task Card */}
            <View style={styles.pinTaskCard}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=150' }} 
                style={styles.pinTaskImg} 
              />
              <View style={styles.pinTaskInfo}>
                <Text style={styles.pinTaskLabel}>CURRENT TASK</Text>
                <Text style={styles.pinTaskTitle}>{taskTitle}</Text>
              </View>
            </View>

            {/* PIN Boxes */}
            <View style={styles.pinBoxRow}>
              {[0, 1, 2, 3].map(idx => (
                <View key={idx} style={[styles.pinBoxItem, clientPin[idx] !== '' && styles.pinBoxItemFilled]}>
                  <Text style={styles.pinBoxText}>{clientPin[idx]}</Text>
                </View>
              ))}
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[styles.pinSubmitBtn, !isPinComplete && styles.pinSubmitBtnDisabled]}
              disabled={!isPinComplete}
              onPress={() => handlePinSubmit(selectedTask._id)}
            >
              <Feather name="lock" size={16} color={isPinComplete ? '#ffffff' : '#9ca3af'} style={{ marginRight: 8 }} />
              <Text style={[styles.pinSubmitBtnText, !isPinComplete && styles.pinSubmitBtnTextDisabled]}>
                Verify PIN
              </Text>
            </TouchableOpacity>

            {/* Keypad */}
            <View style={styles.keypadContainer}>
              <View style={styles.keypadRow}>
                {['1', '2', '3'].map(num => (
                  <TouchableOpacity key={num} style={styles.keypadKey} onPress={() => handleKeyPress(num)}>
                    <Text style={styles.keypadKeyText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['4', '5', '6'].map(num => (
                  <TouchableOpacity key={num} style={styles.keypadKey} onPress={() => handleKeyPress(num)}>
                    <Text style={styles.keypadKeyText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                {['7', '8', '9'].map(num => (
                  <TouchableOpacity key={num} style={styles.keypadKey} onPress={() => handleKeyPress(num)}>
                    <Text style={styles.keypadKeyText}>{num}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.keypadRow}>
                <View style={[styles.keypadKey, { backgroundColor: 'transparent', borderWidth: 0 }]} />
                <TouchableOpacity style={styles.keypadKey} onPress={() => handleKeyPress('0')}>
                  <Text style={styles.keypadKeyText}>0</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.keypadKey, styles.backspaceKey]} onPress={handleBackspace}>
                  <Feather name="delete" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        {/* Detail Header bar */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedTask(null)} style={styles.backBtn}>
            <Feather name="arrow-left" size={24} color="#059669" />
          </TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Route Map</Text>
          <View style={styles.detailAvatarContainer}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCFAwXh3vhQ8xJ97_FvUmbwrTxLJ7Uo-HHdcEY7YqPgfIeNuoUObs360oXy7cmM2QA7Q4vYqbiOTrecKrIDRvP2YcN05MVIykoorSd5EChbhDfypy0QIAy-EyPSPKoMrwqqN0xFOWAXk2nEKCpoqvt9VugBe9kfmvz7LOIgQwcQTivhyK5shpIm73X0msXJvcwT0dRnPnQYuTEjXScYT2HhKYuq4MmRbWGuMoPw0xbrJimBJz0sngcAHImkj-CMdTqtoz0NoHcjjG5y' }} 
              style={styles.detailAvatarImg}
            />
          </View>
        </View>

        {/* Map Area */}
        <View style={styles.mapContainer}>
          {/* Mock Map Image showing SF map */}
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC7_JUe9OCby5nP91dARdYBNpm2wDyEfN7-Hsn9PGvmBLTzrycusAdIegJx2foWIUQsF7J0Acv4qW8UlcmMVjxAxyyNeM7E6sg5uPKha0e5_7aO7cv8Jg2oWRQwSpXGR28W4g97FZIXoQNWZ9dtC8Z_VzNX_fssjBUMdrbgdYMwHaSN_sOPlT0x1IZ9TRag_yUMKb4ORypLExxyOZGtV8vW_y102fXL7qMSYY6uEqfxSQvZepmSyEzD0LVICycn4rXvvIHpgS5FhK5L' }}
            style={styles.mapImg}
            resizeMode="cover"
          />

          {/* Dashed Route Line drawn directly on top of map */}
          <View style={styles.dashedRouteLine} />

          {/* TechHub HQ Map Bubble Flag */}
          <View style={[styles.techHubFlagContainer]}>
            <View style={styles.techHubBubble}>
              <Text style={styles.techHubBubbleTitle}>TechHub</Text>
              <Text style={styles.techHubBubbleTitle}>HQ</Text>
            </View>
          </View>

          {/* TOP FLOATING CARD: Job Route Stats */}
          <View style={styles.statsCardFloating}>
            <View style={styles.statsHeaderRow}>
              <View style={styles.statsIconBoxPurple}>
                <Feather name="git-commit" size={20} color="#ffffff" style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
              <View style={styles.statsTitleContainer}>
                <Text style={styles.statsTitleText}>Mission: Fix It</Text>
                <Text style={styles.statsSubtitleText}>Office Hardware Repair</Text>
              </View>
            </View>
            <View style={styles.dividerLine} />
            <View style={styles.statsColumnsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statColLabel}>ESTIMATED TIME</Text>
                <Text style={styles.statColValue}>12 mins</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statColLabel}>DISTANCE</Text>
                <Text style={styles.statColValue}>4.2 km</Text>
              </View>
            </View>
          </View>

          {/* BOTTOM FLOATING CARD: Turn Instruction */}
          <View style={styles.instructionCardFloating}>
            <View style={styles.turnIconBoxPurple}>
              <Feather name="corner-up-right" size={24} color="#ffffff" />
            </View>
            <View style={styles.instructionTextContainer}>
              <Text style={styles.turnDistanceText}>NEXT TURN IN 200M</Text>
              <Text style={styles.turnLabelText}>Turn right onto Market St</Text>
            </View>
          </View>

          {/* BOTTOM ACTION BAR */}
          <View style={styles.bottomActionBar}>
            {status === 'assigned' && (
              <TouchableOpacity 
                style={styles.startNavBtn}
                onPress={() => {
                  Alert.alert('Navigation Active', 'Simulated GPS guidance active. Head towards Market St.');
                  handleUpdateStatus(selectedTask._id, 'traveling');
                }}
              >
                <Feather name="navigation" size={18} color="#ffffff" style={{ marginRight: 8, transform: [{ rotate: '45deg' }] }} />
                <Text style={styles.startNavBtnText}>Start Navigation</Text>
              </TouchableOpacity>
            )}

            {status === 'traveling' && (
              <TouchableOpacity 
                style={[styles.startNavBtn, { backgroundColor: '#059669' }]}
                onPress={() => setShowPinPad(true)}
              >
                <Feather name="check-circle" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.startNavBtnText}>I Have Arrived (Enter PIN)</Text>
              </TouchableOpacity>
            )}

            {status === 'working' && (
              <TouchableOpacity 
                style={[styles.startNavBtn, { backgroundColor: '#6b7280' }]}
                onPress={() => {
                  Alert.alert(
                    'Complete Task',
                    'Are you sure you want to mark this task as completed?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Complete', onPress: () => handleUpdateStatus(selectedTask._id, 'completed') }
                    ]
                  );
                }}
              >
                <Feather name="check" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.startNavBtnText}>Complete Task</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.navCallBtn}
              onPress={() => Alert.alert('Call Client', 'Connecting voice line to client site manager...')}
            >
              <Feather name="phone" size={22} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* List Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4, marginRight: 12 }}>
            <Feather name="chevron-left" size={24} color="#059669" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>My Gigs</Text>
            <Text style={styles.headerSubtitle}>Manage and track your active tasks</Text>
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loaderText}>Syncing gigs ledger...</Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTaskCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconBox}>
                <Feather name="briefcase" size={36} color="#059669" />
              </View>
              <Text style={styles.emptyText}>You don't have any active gigs</Text>
              <Text style={styles.emptySubtext}>Search and apply to client listings nearby to get assigned.</Text>
              <TouchableOpacity
                style={styles.findJobsButton}
                onPress={() => navigation.navigate('BrowseGigs')}
              >
                <Text style={styles.findJobsButtonText}>Find Gigs</Text>
              </TouchableOpacity>
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
    backgroundColor: '#ecfdf5', // Stitch surface background
  },
  header: {
    height: 72,
    paddingHorizontal: 16,
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e0e9',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#059669',
    fontFamily: 'Inter',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#7a7582',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#7a7582',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(203, 196, 210, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  cardBudget: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    fontFamily: 'Inter',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  cardAddress: {
    fontSize: 13,
    color: '#494551',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 11,
    color: '#7a7582',
    fontFamily: 'Inter',
    marginBottom: 18,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f2ecf4',
    paddingTop: 14,
  },
  actionPrompt: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7a7582',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    fontFamily: 'Inter',
    marginBottom: 24,
  },
  findJobsButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  findJobsButtonText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Inter',
  },

  // --- DETAIL ROUTE MAP STYLING ---
  detailHeader: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e6e0e9',
  },
  backBtn: {
    padding: 6,
  },
  detailHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#f2ecf4',
  },
  mapImg: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocationCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#064e3b',
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  destinationCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d97706',
    borderWidth: 3,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerLabelBox: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e6e0e9',
  },
  markerLabelText: {
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    color: '#064e3b',
  },
  topFloatingSection: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    gap: 12,
  },
  instructionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 224, 233, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  turnIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: {
    marginLeft: 12,
    flex: 1,
  },
  turnDistance: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#7a7582',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  turnLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 224, 233, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    maxWidth: 260,
  },
  statsIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsMeta: {
    marginLeft: 10,
    flex: 1,
  },
  statsTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  statVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
    fontFamily: 'Inter',
  },
  statDot: {
    color: '#7a7582',
    fontSize: 12,
  },
  bottomControlPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#e6e0e9',
  },
  statusSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  stepItem: {
    alignItems: 'center',
    width: 50,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e6e0e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#059669',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7a7582',
    marginTop: 6,
    fontFamily: 'Inter',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#e6e0e9',
    marginTop: -16,
  },
  pinVerificationCard: {
    backgroundColor: '#f2ecf4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
  },
  pinSub: {
    fontSize: 12,
    color: '#494551',
    marginTop: 4,
    textAlign: 'center',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  pinInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pinBox: {
    width: 44,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbc4d2',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d1b20',
  },
  pinVerifyBtn: {
    backgroundColor: '#10b981',
    width: '100%',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  pinVerifyBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navigationStartBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  navigationStartBtnTxt: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  completedBadge: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    borderWidth: 1.5,
    borderColor: '#a7f3d0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedBadgeTxt: {
    color: '#059669',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  btnIcon: {
    marginRight: 8,
  },
  callBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e6e0e9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  detailAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#cbc4d2',
    overflow: 'hidden',
    backgroundColor: '#e6e0e9',
  },
  detailAvatarImg: {
    width: '100%',
    height: '100%',
  },
  dashedRouteLine: {
    position: 'absolute',
    top: '30%',
    left: '30%',
    width: '45%',
    height: '45%',
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#4c2a96',
    borderRadius: 40,
    opacity: 0.8,
  },
  techHubFlagContainer: {
    position: 'absolute',
    top: '22%',
    right: '25%',
  },
  techHubBubble: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e6e0e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  techHubBubbleTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4c2a96',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  statsCardFloating: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 224, 233, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statsIconBoxPurple: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsTitleContainer: {
    flex: 1,
  },
  statsTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
  },
  statsSubtitleText: {
    fontSize: 12,
    color: '#7a7582',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#e6e0e9',
    marginVertical: 12,
  },
  statsColumnsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statColLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#7a7582',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  statColValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#064e3b',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  instructionCardFloating: {
    position: 'absolute',
    bottom: 96,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 224, 233, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  turnIconBoxPurple: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  turnDistanceText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#7a7582',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  turnLabelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1b20',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  bottomActionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 10,
  },
  startNavBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#064e3b',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  startNavBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  navCallBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e6e0e9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  // --- PIN VERIFICATION STYLING ---
  pinContainer: {
    flex: 1,
    backgroundColor: '#ecfdf5',
  },
  pinHeader: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#cbc4d2',
    backgroundColor: '#ffffff',
  },
  pinBackBtn: {
    padding: 4,
  },
  pinHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
  },
  pinScroll: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  pinMainTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#064e3b',
    textAlign: 'center',
    marginBottom: 8,
  },
  pinMainSub: {
    fontSize: 14,
    color: '#494551',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  pinTaskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbc4d2',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  pinTaskImg: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  pinTaskInfo: {
    marginLeft: 16,
    flex: 1,
  },
  pinTaskLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#65558f',
    letterSpacing: 0.5,
  },
  pinTaskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1b20',
    marginTop: 2,
  },
  pinBoxRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 32,
  },
  pinBoxItem: {
    width: 56,
    height: 64,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#cbc4d2',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  pinBoxItemFilled: {
    borderColor: '#064e3b',
  },
  pinBoxText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1d1b20',
  },
  pinSubmitBtn: {
    flexDirection: 'row',
    height: 52,
    backgroundColor: '#064e3b',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 40,
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  pinSubmitBtnDisabled: {
    backgroundColor: '#e6e0e9',
    elevation: 0,
    shadowOpacity: 0,
  },
  pinSubmitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  pinSubmitBtnTextDisabled: {
    color: '#9ca3af',
  },
  keypadContainer: {
    width: '100%',
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  keypadKey: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e6e0e9',
  },
  keypadKeyText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1d1b20',
  },
  backspaceKey: {
    backgroundColor: '#fde8e8',
    borderColor: '#fbd5d5',
  },
});
