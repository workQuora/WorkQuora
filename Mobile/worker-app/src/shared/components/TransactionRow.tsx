import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';

export interface TransactionData {
  _id: string;
  type: 'deposit' | 'withdrawal' | 'escrow_hold' | 'payment_release' | 'payout';
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

interface TransactionRowProps {
  transaction: TransactionData;
}

export default function TransactionRow({ transaction }: TransactionRowProps) {
  const { colors } = useTheme();
  
  const isCredit = 
    transaction.type === 'deposit' || 
    transaction.type === 'payment_release' || 
    transaction.type === 'payout';

  const amountPrefix = isCredit ? '+' : '-';
  const amountColor = isCredit ? colors.success : colors.error;
  const iconName = isCredit ? 'arrow-down-left' : 'arrow-up-right';
  const iconColor = isCredit ? colors.success : colors.error;
  const iconBg = isCredit ? '#ecfdf5' : '#fef2f2';

  const formattedDate = new Date(transaction.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
        <Feather name={iconName} size={18} color={iconColor} />
      </View>

      <View style={styles.details}>
        <Text style={[styles.desc, { color: colors.text }]} numberOfLines={1}>
          {transaction.description || 'Transaction'}
        </Text>
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {formattedDate} • <Text style={styles.status}>{transaction.status.toUpperCase()}</Text>
        </Text>
      </View>

      <View style={styles.amountContainer}>
        <Text style={[styles.amount, { color: amountColor }]}>
          {amountPrefix}₹{transaction.amount.toLocaleString('en-IN')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  details: {
    flex: 1,
  },
  desc: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  date: {
    fontSize: 12,
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
  },
});
