import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export interface Payment {
  id: string;
  parentId: string;
  parentName: string;
  studentId: string;
  studentName: string;
  amount: number;
  dueDate: string;
  status: 'due' | 'paid' | 'overdue';
  paidOn?: string;
  reference?: string;
  reminders: number;
}

export interface PaymentRowProps {
  payment: Payment;
  onMarkReceived: (payment: Payment) => void;
  onSendReminder: (payment: Payment) => void;
  onViewHistory: (payment: Payment) => void;
}

const PaymentRow: React.FC<PaymentRowProps> = ({
  payment,
  onMarkReceived,
  onSendReminder,
  onViewHistory,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return '#28A745';
      case 'overdue':
        return '#DC3545';
      case 'due':
        return '#FFC107';
      default:
        return '#6C757D';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'overdue':
        return 'Overdue';
      case 'due':
        return 'Due';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatAmount = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainContent}>
        <View style={styles.studentInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {payment.studentName.charAt(0)}
            </Text>
          </View>
          <View style={styles.details}>
            <Text style={styles.studentName}>{payment.studentName}</Text>
            <Text style={styles.parentName}>{payment.parentName}</Text>
            <Text style={styles.dueDate}>
              Due: {formatDate(payment.dueDate)}
            </Text>
          </View>
        </View>
        
        <View style={styles.amountInfo}>
          <Text style={styles.amount}>{formatAmount(payment.amount)}</Text>
          <View style={[styles.statusChip, { backgroundColor: getStatusColor(payment.status) }]}>
            <Text style={styles.statusText}>{getStatusText(payment.status)}</Text>
          </View>
          {payment.reference && (
            <Text style={styles.reference}>Ref: {payment.reference}</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        {payment.status === 'due' || payment.status === 'overdue' ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => onMarkReceived(payment)}
            accessibilityLabel={`Mark payment as received for ${payment.studentName}`}
          >
            <Text style={styles.primaryButtonText}>Mark Received</Text>
          </TouchableOpacity>
        ) : null}
        
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={() => onSendReminder(payment)}
          accessibilityLabel={`Send reminder for ${payment.studentName}'s payment`}
        >
          <Text style={styles.secondaryButtonText}>
            Remind {payment.reminders > 0 && `(${payment.reminders})`}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.tertiaryButton]}
          onPress={() => onViewHistory(payment)}
          accessibilityLabel={`View payment history for ${payment.studentName}`}
        >
          <Text style={styles.tertiaryButtonText}>History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  studentInfo: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2F6FED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    shadowColor: '#2F6FED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  details: {
    flex: 1,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  parentName: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
    lineHeight: 18,
  },
  dueDate: {
    fontSize: 12,
    color: '#adb5bd',
    lineHeight: 16,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  reference: {
    fontSize: 10,
    color: '#adb5bd',
    lineHeight: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#28A745',
    flex: 1,
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  secondaryButton: {
    backgroundColor: '#FFC107',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  tertiaryButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#dee2e6',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tertiaryButtonText: {
    color: '#495057',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default PaymentRow;
