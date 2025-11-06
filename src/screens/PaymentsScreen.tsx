import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchPayments } from '../api/api';
import PaymentItem from '../components/PaymentItem';
import { format, differenceInDays } from 'date-fns';

interface Payment {
  id: string;
  studentName: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending';
}

const PaymentsScreen = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      const paymentsData = await fetchPayments();
      // Sort by due date ascending
      const sortedPayments = paymentsData.sort(
        (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
      setPayments(sortedPayments);
    } catch (error) {
      Alert.alert('Error', 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const getTotalDue = () => {
    const pendingPayments = payments.filter(p => p.status === 'pending');
    return pendingPayments.reduce((total, payment) => total + payment.amount, 0);
  };

  const getDueWithin7Days = () => {
    const today = new Date();
    return payments.filter(payment => {
      if (payment.status === 'paid') return false;
      const daysUntilDue = differenceInDays(new Date(payment.due_date), today);
      return daysUntilDue <= 7 && daysUntilDue >= 0;
    });
  };

  const renderPayment = ({ item }: { item: Payment }) => {
    const isDueSoon = getDueWithin7Days().includes(item);
    return <PaymentItem payment={item} isDueSoon={isDueSoon} />;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  const totalDue = getTotalDue();
  const dueSoonCount = getDueWithin7Days().length;

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Payment Summary</Text>
        <Text style={styles.totalDue}>Total Due: ₹{totalDue.toLocaleString()}</Text>
        {dueSoonCount > 0 && (
          <Text style={styles.dueSoon}>
            {dueSoonCount} payment{dueSoonCount > 1 ? 's' : ''} due within 7 days
          </Text>
        )}
      </View>

      <FlatList
        data={payments}
        renderItem={renderPayment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  summary: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  totalDue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dueSoon: {
    fontSize: 14,
    color: '#FF6B6B',
    fontWeight: '600',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
});

export default PaymentsScreen;
