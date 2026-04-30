import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { RootState } from '../../store';
import { useGetPaymentsByStudentIdMutation } from '../../store/services/paymentsApi';
import { useGetStudentsByParentIdMutation } from '../../store/services/studentsApi';
import { PaymentApiItem } from '../../types/payments';
import { StudentApi } from '../../types/students';
import ProfileIcon from '../../components/ProfileIcon';

interface PaymentSummary {
  totalAmount: number;
  count: number;
}

const PaymentsScreen = () => {
  const user = useSelector((s: RootState) => s.auth.user as any);
  const [fetchPayments] = useGetPaymentsByStudentIdMutation();
  const [getStudentsByParentId] = useGetStudentsByParentIdMutation();
  const [apiStudents, setApiStudents] = useState<StudentApi[]>([]);
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);
  const [userPayments, setUserPayments] = useState<PaymentApiItem[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({ totalAmount: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPayments = useCallback(async () => {
    try {
      // Step 1: get students for this parent
      let studentId: string | null = null;

      if (user?.id) {
        try {
          const studentRes = await getStudentsByParentId({ parentId: user.id }).unwrap();
          if (studentRes.success && studentRes.data?.students?.length) {
            setApiStudents(studentRes.data.students);
            const selected = studentRes.data.students[selectedStudentIdx] || studentRes.data.students[0];
            studentId = selected.id;
          }
        } catch {
          // fall through
        }
      }

      if (!studentId) {
        setUserPayments([]);
        setSummary({ totalAmount: 0, count: 0 });
        return;
      }

      // Step 2: fetch payments for this student
      const res = await fetchPayments({ studentId }).unwrap();
      const payments = res.data.payments || [];
      setUserPayments(payments);
      const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
      setSummary({ totalAmount, count: res.data.count || payments.length });
    } catch {
      setUserPayments([]);
      setSummary({ totalAmount: 0, count: 0 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, fetchPayments, getStudentsByParentId, selectedStudentIdx]);

  // Reload every time the tab is focused — catches new payment reminders from admin
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadPayments();
    }, [loadPayments])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPayments();
  }, [loadPayments]);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F6FED" />
        <Text style={styles.loadingText}>Loading payments...</Text>
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

      {/* Student Picker */}
      {apiStudents.length >= 1 && (
        <View style={styles.studentPicker}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.studentPickerContent}>
            {apiStudents.map((s, idx) => (
              <TouchableOpacity
                key={s.id || (s as any)._id || `s-${idx}`}
                style={[styles.studentChip, selectedStudentIdx === idx && styles.studentChipActive]}
                onPress={() => setSelectedStudentIdx(idx)}
              >
                <Text style={[styles.studentChipText, selectedStudentIdx === idx && styles.studentChipTextActive]}>
                  {s.firstName} {s.lastName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} /> }>
        {/* Primary Action */}
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={handlePayAtSchoolPortal}
        >
          <Text style={styles.primaryActionIcon}>🏫</Text>
          <Text style={styles.primaryActionText}>Pay at School Portal</Text>
        </TouchableOpacity>

        {/* Pending reminder banner */}
        {userPayments.some(p => p.status !== 'paid') && (
          <View style={styles.pendingBanner}>
            <Text style={styles.pendingBannerIcon}>⚠️</Text>
            <Text style={styles.pendingBannerText}>
              You have pending payments. Please clear them at the school portal.
            </Text>
          </View>
        )}

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
              .map((payment) => {
                const isPaid = payment.status === 'paid';
                const isOverdue = payment.status === 'overdue';
                const statusLabel = isPaid ? 'Paid' : isOverdue ? 'Overdue' : 'Pending';
                const statusColor = isPaid ? '#28A745' : isOverdue ? '#DC3545' : '#FF9800';
                return (
                  <View
                    key={payment._id}
                    style={[
                      styles.paymentCard,
                      !isPaid && { borderLeftWidth: 4, borderLeftColor: statusColor },
                    ]}
                  >
                    <View style={styles.paymentHeader}>
                      <Text style={styles.paymentAmount}>
                        {formatCurrency(payment.amount)}
                      </Text>
                      <View style={styles.badgeRow}>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', borderColor: statusColor }]}>
                          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
                        </View>
                        <View style={styles.typeBadge}>
                          <Text style={styles.typeBadgeText}>{payment.paymentType?.toUpperCase?.() || payment.paymentType}</Text>
                        </View>
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
                      {payment.dueDate && (
                        <View style={styles.paymentDetail}>
                          <Text style={styles.paymentDetailIcon}>⏰</Text>
                          <Text style={[styles.paymentDetailText, isOverdue && { color: '#DC3545', fontWeight: '600' }]}>
                            Due: {formatDate(payment.dueDate)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
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

        {/* Spacing at bottom */}
        <View style={{ height: 20 }} />
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
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderColor: '#FFC107',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  pendingBannerIcon: { fontSize: 18 },
  pendingBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    lineHeight: 18,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 14,
    backgroundColor: '#E8F0FF',
  },
  typeBadgeText: {
    color: '#2F6FED',
    fontSize: 11,
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
  studentPicker: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  studentPickerContent: {
    gap: 8,
  },
  studentChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  studentChipActive: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
  },
  studentChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
  },
  studentChipTextActive: {
    color: '#fff',
  },
  comingSoonSection: {
    marginBottom: 24,
  },
  comingSoonSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  comingSoonGrid: {
    gap: 12,
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  comingSoonIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  comingSoonContent: {
    flex: 1,
    marginRight: 8,
  },
  comingSoonTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  comingSoonDesc: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    lineHeight: 16,
  },
  comingSoonBadge: {
    backgroundColor: '#FFF3CD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  comingSoonBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#856404',
  },
});

export default PaymentsScreen;