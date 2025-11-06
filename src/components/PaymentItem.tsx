import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';

interface Payment {
  id: string;
  studentName: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending';
}

interface PaymentItemProps {
  payment: Payment;
  isDueSoon?: boolean;
}

const PaymentItem: React.FC<PaymentItemProps> = ({ payment, isDueSoon = false }) => {
  return (
    <View style={[
      styles.container,
      isDueSoon && styles.dueSoonContainer
    ]}>
      <View style={styles.header}>
        <Text style={styles.studentName}>{payment.studentName}</Text>
        <Text style={[
          styles.status,
          payment.status === 'paid' ? styles.paidStatus : styles.pendingStatus
        ]}>
          {payment.status.toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.amountContainer}>
        <Text style={[
          styles.amount,
          isDueSoon && styles.dueSoonAmount
        ]}>
          ₹{payment.amount.toLocaleString()}
        </Text>
        <Text style={[
          styles.dueDate,
          isDueSoon && styles.dueSoonDate
        ]}>
          Due: {format(new Date(payment.due_date), 'MMM dd, yyyy')}
        </Text>
      </View>

      {isDueSoon && (
        <View style={styles.dueSoonBadge}>
          <Text style={styles.dueSoonText}>DUE SOON</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  dueSoonContainer: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paidStatus: {
    backgroundColor: '#D4EDDA',
    color: '#155724',
  },
  pendingStatus: {
    backgroundColor: '#FFF3CD',
    color: '#856404',
  },
  amountContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dueSoonAmount: {
    color: '#FF6B6B',
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
  },
  dueSoonDate: {
    color: '#FF6B6B',
    fontWeight: '600',
  },
  dueSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dueSoonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default PaymentItem;
