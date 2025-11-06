import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import AdminHeaderRight from '../../components/admin/AdminHeaderRight';
import PaymentRow from '../../components/admin/PaymentRow';
import { Payment } from '../../components/admin/PaymentRow';

const PaymentsScreen = () => {
  const { user } = useAuth();
  const { paymentsAdmin } = useData();
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptReference, setReceiptReference] = useState('');

  useEffect(() => {
    loadPayments();
  }, [paymentsAdmin, searchQuery, statusFilter]);

  const loadPayments = () => {
    let filtered = [...paymentsAdmin];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.parentName.toLowerCase().includes(query) ||
        p.studentName.toLowerCase().includes(query) ||
        p.reference?.toLowerCase().includes(query)
      );
    }

    setFilteredPayments(filtered);
  };

  const handleMarkReceived = (payment: Payment) => {
    setSelectedPayment(payment);
    setReceiptReference('');
    setModalVisible(true);
  };

  const confirmMarkReceived = () => {
    if (!selectedPayment) return;

    // TODO: Update payment status in data store
    Alert.alert(
      'Payment Marked as Received',
      `Payment of ₹${selectedPayment.amount} from ${selectedPayment.parentName} has been marked as received.${receiptReference ? `\nReference: ${receiptReference}` : ''}`
    );
    
    setModalVisible(false);
    setSelectedPayment(null);
    setReceiptReference('');
  };

  const handleSendReminder = (payment: Payment) => {
    Alert.alert(
      'Reminder Sent',
      `Reminder sent to ${payment.parentName} for payment of ₹${payment.amount}`
    );
  };

  const handleViewHistory = (payment: Payment) => {
    Alert.alert(
      'Payment History',
      `Payment history for ${payment.studentName}:\n\n• Previous payments: 3\n• Total paid: ₹4,500\n• Last payment: ${payment.dueDate}\n• Payment method: Bank Transfer`
    );
  };

  const getStatusCounts = () => {
    const counts = {
      all: paymentsAdmin.length,
      due: paymentsAdmin.filter(p => p.status === 'due').length,
      paid: paymentsAdmin.filter(p => p.status === 'paid').length,
      overdue: paymentsAdmin.filter(p => p.status === 'overdue').length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.logo}>📚 Padmai</Text>
            <View style={styles.headerRight}>
              <Text style={styles.welcomeText}>Welcome, {user?.fullName?.split(' ')[0]}!</Text>
              <AdminHeaderRight />
            </View>
          </View>
          <View style={styles.adminInfo}>
            <Text style={styles.adminAvatar}>👨‍💼</Text>
            <View style={styles.adminDetails}>
              <Text style={styles.adminName}>{user?.fullName}</Text>
              <Text style={styles.adminRole}>School Administrator</Text>
            </View>
          </View>
        </View>

        {/* Search and Filters */}
        <View style={styles.filtersSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by parent name, student name, or reference..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search payments"
          />
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {[
              { key: 'all', label: `All (${statusCounts.all})` },
              { key: 'due', label: `Due (${statusCounts.due})` },
              { key: 'paid', label: `Paid (${statusCounts.paid})` },
              { key: 'overdue', label: `Overdue (${statusCounts.overdue})` },
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterButton,
                  statusFilter === filter.key && styles.activeFilterButton
                ]}
                onPress={() => setStatusFilter(filter.key)}
                accessibilityLabel={`Filter by ${filter.label}`}
              >
                <Text style={[
                  styles.filterButtonText,
                  statusFilter === filter.key && styles.activeFilterButtonText
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Payments List */}
        <View style={styles.paymentsSection}>
          <Text style={styles.sectionTitle}>
            Payments ({filteredPayments.length})
          </Text>
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                onMarkReceived={handleMarkReceived}
                onSendReminder={handleSendReminder}
                onViewHistory={handleViewHistory}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>💳</Text>
              <Text style={styles.emptyStateTitle}>No Payments Found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No payment records available'
                }
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Mark as Received Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mark Payment as Received</Text>
            {selectedPayment && (
              <View style={styles.paymentDetails}>
                <Text style={styles.paymentDetailText}>
                  Student: {selectedPayment.studentName}
                </Text>
                <Text style={styles.paymentDetailText}>
                  Parent: {selectedPayment.parentName}
                </Text>
                <Text style={styles.paymentDetailText}>
                  Amount: ₹{selectedPayment.amount.toLocaleString()}
                </Text>
                <Text style={styles.paymentDetailText}>
                  Due Date: {new Date(selectedPayment.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            <TextInput
              style={styles.receiptInput}
              placeholder="Receipt reference (optional)"
              value={receiptReference}
              onChangeText={setReceiptReference}
              accessibilityLabel="Receipt reference"
            />
            
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmMarkReceived}
              >
                <Text style={styles.confirmButtonText}>Mark Received</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  header: {
    backgroundColor: '#2F6FED',
    paddingTop: 44,
    paddingBottom: 24,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  logo: {
    fontSize: 26,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#B3D4FF',
    lineHeight: 22,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminAvatar: {
    fontSize: 28,
    marginRight: 14,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  adminRole: {
    fontSize: 14,
    color: '#B3D4FF',
    lineHeight: 20,
    fontWeight: '500',
  },
  filtersSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
    color: '#212529',
  },
  filterScroll: {
    marginBottom: 8,
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilterButton: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
    shadowColor: '#2F6FED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  activeFilterButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  paymentsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 18,
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 48,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyStateIcon: {
    fontSize: 56,
    marginBottom: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.3,
    lineHeight: 28,
  },
  paymentDetails: {
    backgroundColor: '#f8f9fa',
    padding: 18,
    borderRadius: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  paymentDetailText: {
    fontSize: 15,
    color: '#212529',
    marginBottom: 6,
    lineHeight: 22,
    fontWeight: '500',
  },
  receiptInput: {
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    color: '#212529',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 14,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1.5,
    borderColor: '#dee2e6',
  },
  confirmButton: {
    backgroundColor: '#28A745',
    shadowColor: '#28A745',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default PaymentsScreen;
