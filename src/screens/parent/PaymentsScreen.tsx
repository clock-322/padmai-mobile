import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Linking } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useGetPaymentsByStudentIdMutation } from '../../store/services/paymentsApi';
import { PaymentApiItem } from '../../types/payments';
import ProfileIcon from '../../components/ProfileIcon';

interface PaymentSummary {
  totalAmount: number;
  count: number;
}

const PaymentsScreen = () => {
  const user = useSelector((s: RootState) => s.auth.user as any);
  const [fetchPayments, { data, isLoading, isError, error, isUninitialized }]
    = useGetPaymentsByStudentIdMutation();
  const [userPayments, setUserPayments] = useState<PaymentApiItem[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({ totalAmount: 0, count: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const studentId = 'STU001';

  useEffect(() => {
    if (studentId) {
      fetchPayments({ studentId })
        .unwrap()
        .then((res) => {
          setUserPayments(res.data.payments || []);
          const totalAmount = (res.data.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
          setSummary({ totalAmount, count: res.data.count || (res.data.payments || []).length });
        })
        .catch(() => {
          setUserPayments([]);
          setSummary({ totalAmount: 0, count: 0 });
        });
    }
  }, [studentId, fetchPayments]);

  const onRefresh = useCallback(() => {
    if (!studentId) return;
    setRefreshing(true);
    fetchPayments({ studentId })
      .unwrap()
      .then((res) => {
        setUserPayments(res.data.payments || []);
        const totalAmount = (res.data.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
        setSummary({ totalAmount, count: res.data.count || (res.data.payments || []).length });
      })
      .finally(() => setRefreshing(false));
  }, [studentId, fetchPayments]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    try {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
    } catch {
      return `₹${amount}`;
    }
  };

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'paid') return '#28A745';
    if (status === 'overdue') return '#DC3545';
    if (status === 'pending') return '#FFC107';
    return '#6C757D';
  };

  const getStatusText = (status: string, dueDate: string) => {
    if (status === 'paid') return 'Paid';
    if (status === 'overdue') return 'Overdue';
    if (status === 'pending') return 'Due';
    return 'Unknown';
  };

  const handlePayAtSchoolPortal = () => {
    const url = 'https://school-portal.demo';
    Linking.openURL(url).catch(err => {
      Alert.alert('Error', 'Could not open school portal');
    });
  };

  // Local mark-as-paid UI removed for API-driven listing

  if (!studentId) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>No student linked to this account.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F6FED" />
        <Text style={styles.loadingText}>Loading payments...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Failed to load payments.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>💳 Payments</Text>
            <Text style={styles.headerSubtitle}>
              Manage your school payments
            </Text>
          </View>
          <ProfileIcon />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> }>
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{formatCurrency(summary.totalAmount)}</Text>
            <Text style={styles.summaryLabel}>Total Amount</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryNumber}>{summary.count}</Text>
            <Text style={styles.summaryLabel}>Payments</Text>
          </View>
        </View>
        
        {/* Overdue Alert removed (API doesn't provide status) */}

        {/* Primary Action */}
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={handlePayAtSchoolPortal}
        >
          <Text style={styles.primaryActionIcon}>🏫</Text>
          <Text style={styles.primaryActionText}>Pay at School Portal</Text>
        </TouchableOpacity>

        {/* Payments List */}
        <View style={styles.paymentsSection}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          
          {userPayments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyTitle}>No Payments</Text>
              <Text style={styles.emptySubtitle}>
                No payment records found.
              </Text>
            </View>
          ) : (
            userPayments
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((payment) => (
                <View key={payment._id} style={styles.paymentCard}>
                  <View style={styles.paymentHeader}>
                    <Text style={styles.paymentAmount}>
                      {formatCurrency(payment.amount)}
                    </Text>
                  <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>{payment.paymentType?.toUpperCase?.() || payment.paymentType}</Text>
                    </View>
                  </View>

                  <Text style={styles.paymentDescription} numberOfLines={1}>
                    {payment.name}
                  </Text>
                  <View style={styles.divider} />

                  <View style={styles.paymentDetails}>
                    <View style={styles.paymentDetail}>
                      <Text style={styles.paymentDetailIcon}>👤</Text>
                      <Text style={styles.paymentDetailText}>
                        Student: {payment.studentName}
                      </Text>
                    </View>
                    <View style={styles.paymentDetail}>
                      <Text style={styles.paymentDetailIcon}>🏫</Text>
                      <Text style={styles.paymentDetailText}>
                        Class: {payment.className}
                      </Text>
                    </View>
                    <View style={styles.paymentDetail}>
                      <Text style={styles.paymentDetailIcon}>📅</Text>
                      <Text style={styles.paymentDetailText}>
                        Created: {formatDate(payment.createdAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>💡 Payment Information</Text>
          <Text style={styles.helpText}>
            • Payments are processed through the school portal
          </Text>
          <Text style={styles.helpText}>
            • You can mark payments as paid if you've paid directly
          </Text>
          <Text style={styles.helpText}>
            • Contact the school office for payment assistance
          </Text>
        </View>
      </ScrollView>

      {/* Modal removed — read-only listing */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#2F6FED',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#B3D4FF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2F6FED',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  overdueAlert: {
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  overdueText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 18,
  },
  primaryActionButton: {
    backgroundColor: '#2F6FED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryActionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  paymentsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2F6FED',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#E8F0FF',
  },
  statusText: {
    color: '#2F6FED',
    fontSize: 12,
    fontWeight: '700',
  },
  paymentDescription: {
    fontSize: 16,
    color: '#222',
    marginBottom: 8,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 10,
  },
  paymentDetails: {
    marginBottom: 12,
  },
  paymentDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  paymentDetailIcon: {
    fontSize: 14,
    marginRight: 8,
    width: 16,
  },
  paymentDetailText: {
    fontSize: 14,
    color: '#555',
  },
  markPaidButton: {
    backgroundColor: '#28A745',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  markPaidButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#2F6FED',
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentsScreen;