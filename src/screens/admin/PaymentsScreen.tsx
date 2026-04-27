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

// ─── Inline Calendar ─────────────────────────────────────────────────────────
const CAL_DAYS   = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const CAL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const CalendarPicker = ({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (d: string) => void;
}) => {
  const today = new Date();
  const init  = selectedDate ? new Date(selectedDate + 'T12:00:00') : today;
  const [yr, setYr] = useState(init.getFullYear());
  const [mo, setMo] = useState(init.getMonth());

  const firstDow    = new Date(yr, mo, 1).getDay();
  const daysInMonth = new Date(yr, mo + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  const prevMo = () => mo === 0 ? (setMo(11), setYr(y => y-1)) : setMo(m => m-1);
  const nextMo = () => mo === 11 ? (setMo(0),  setYr(y => y+1)) : setMo(m => m+1);

  return (
    <View style={cals.wrap}>
      <View style={cals.header}>
        <TouchableOpacity onPress={prevMo} style={cals.nav}><Text style={cals.navTxt}>‹</Text></TouchableOpacity>
        <Text style={cals.month}>{CAL_MONTHS[mo]} {yr}</Text>
        <TouchableOpacity onPress={nextMo} style={cals.nav}><Text style={cals.navTxt}>›</Text></TouchableOpacity>
      </View>
      <View style={cals.row}>
        {CAL_DAYS.map(d => <Text key={d} style={cals.dayLbl}>{d}</Text>)}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, wi) => (
        <View key={wi} style={cals.row}>
          {cells.slice(wi*7, wi*7+7).map((day, di) => {
            const ds = day ? `${yr}-${String(mo+1).padStart(2,'0')}-${String(day).padStart(2,'0')}` : '';
            const isSel   = ds === selectedDate;
            const isToday = ds === todayStr;
            return (
              <TouchableOpacity key={di} style={[cals.cell, isSel && cals.selCell, isToday && !isSel && cals.todayCell]}
                onPress={() => day && onSelect(ds)} disabled={!day}>
                <Text style={[cals.cellTxt, isSel && cals.selTxt, isToday && !isSel && cals.todayTxt, !day && cals.empty]}>
                  {day || ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const cals = StyleSheet.create({
  wrap:     { backgroundColor: '#f0f4ff', borderRadius: 12, padding: 10, marginBottom: 14 },
  header:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  nav:      { padding: 6 },
  navTxt:   { fontSize: 22, color: '#2F6FED', fontWeight: 'bold' },
  month:    { fontSize: 15, fontWeight: '700', color: '#333' },
  row:      { flexDirection: 'row' },
  dayLbl:   { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: '#888', paddingVertical: 3 },
  cell:     { flex: 1, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 20, margin: 1 },
  cellTxt:  { fontSize: 12, color: '#333' },
  selCell:  { backgroundColor: '#2F6FED' },
  selTxt:   { color: '#fff', fontWeight: '700' },
  todayCell:{ borderWidth: 1.5, borderColor: '#2F6FED' },
  todayTxt: { color: '#2F6FED', fontWeight: '700' },
  empty:    { color: 'transparent' },
});
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../providers/DataProvider';
import AdminHeaderRight from '../../components/admin/AdminHeaderRight';
import PaymentRow from '../../components/admin/PaymentRow';
import { Payment } from '../../components/admin/PaymentRow';

const PaymentsScreen = () => {
  const { user } = useAuth();
  const { paymentsAdmin, students, addPayment, updatePaymentStatus } = useData();
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [receiptReference, setReceiptReference] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newPayment, setNewPayment] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    status: 'due',
    sendReminder: false,
  });

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
    updatePaymentStatus(selectedPayment.id, 'paid', receiptReference || undefined);
    Alert.alert(
      'Payment Marked as Received',
      `Payment of ₹${selectedPayment.amount} from ${selectedPayment.parentName} has been marked as received.${receiptReference ? `\nReference: ${receiptReference}` : ''}`
    );
    setModalVisible(false);
    setSelectedPayment(null);
    setReceiptReference('');
  };

  const handleAddPayment = () => {
    setNewPayment({ studentId: '', amount: '', dueDate: '', status: 'due', sendReminder: false });
    setAddModalVisible(true);
  };

  const confirmAddPayment = () => {
    if (!newPayment.studentId || !newPayment.amount || !newPayment.dueDate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }
    const student = students.find(s => s.id === newPayment.studentId);
    if (!student) {
      Alert.alert('Error', 'Student not found');
      return;
    }
    const payment = {
      id: `pay_${Date.now()}`,
      parentId: student.parentId || '',
      parentName: '',
      studentId: student.id,
      studentName: student.name,
      amount: parseInt(newPayment.amount, 10),
      dueDate: newPayment.dueDate,
      status: newPayment.status,
      reminders: newPayment.sendReminder ? 1 : 0,
    };
    addPayment(payment);
    setAddModalVisible(false);
    Alert.alert('Success', `Payment of ₹${payment.amount} added for ${student.name}${newPayment.sendReminder ? '\nReminder will be sent.' : ''}`);
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
            <Text style={styles.logo}>🏫 Kilbil School</Text>
            <View style={styles.headerRight}>
              <Text style={styles.welcomeText}>Welcome, {(user as any)?.name?.split(' ')[0]}!</Text>
              <AdminHeaderRight />
            </View>
          </View>
          <View style={styles.adminInfo}>
            <View style={styles.adminAvatarCircle}>
              <Text style={styles.adminAvatarInitials}>
                {(user as any)?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'A'}
              </Text>
            </View>
            <View style={styles.adminDetails}>
              <Text style={styles.adminName}>{(user as any)?.name}</Text>
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
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Payments ({filteredPayments.length})
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddPayment} accessibilityLabel="Add new payment">
              <Text style={styles.addButtonText}>+ Add Payment</Text>
            </TouchableOpacity>
          </View>
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

      {/* Add Payment Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={addModalVisible}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Payment</Text>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <Text style={styles.inputLabel}>Student</Text>
            <ScrollView style={styles.studentPicker} nestedScrollEnabled>
              {students.sort((a, b) => {
                const aNum = parseInt(a.id.replace(/\D/g, ''), 10) || 0;
                const bNum = parseInt(b.id.replace(/\D/g, ''), 10) || 0;
                return aNum - bNum;
              }).map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.studentPickerItem, newPayment.studentId === s.id && styles.studentPickerItemSelected]}
                  onPress={() => setNewPayment(prev => ({ ...prev, studentId: s.id }))}
                >
                  <Text style={[styles.studentPickerText, newPayment.studentId === s.id && styles.studentPickerTextSelected]}>
                    {s.id} — {s.name} ({s.classId.replace('class_', 'Class ')})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.receiptInput}
              placeholder="e.g. 1500"
              keyboardType="numeric"
              value={newPayment.amount}
              onChangeText={v => setNewPayment(prev => ({ ...prev, amount: v }))}
              accessibilityLabel="Payment amount"
            />
            <Text style={styles.inputLabel}>Due Date</Text>
            <CalendarPicker
              selectedDate={newPayment.dueDate}
              onSelect={v => setNewPayment(prev => ({ ...prev, dueDate: v }))}
            />
            {newPayment.dueDate ? (
              <View style={styles.selectedDateBadge}>
                <Text style={styles.selectedDateText}>
                  📅 {new Date(newPayment.dueDate + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
              </View>
            ) : null}
            <Text style={styles.inputLabel}>Status</Text>
            <View style={styles.statusRow}>
              {['due', 'upcoming', 'paid'].map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusOption, newPayment.status === s && styles.statusOptionActive]}
                  onPress={() => setNewPayment(prev => ({ ...prev, status: s }))}
                >
                  <Text style={[styles.statusOptionText, newPayment.status === s && styles.statusOptionTextActive]}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.reminderRow}
              onPress={() => setNewPayment(prev => ({ ...prev, sendReminder: !prev.sendReminder }))}
            >
              <View style={[styles.checkbox, newPayment.sendReminder && styles.checkboxChecked]}>
                {newPayment.sendReminder && <Text style={styles.checkboxCheck}>✓</Text>}
              </View>
              <Text style={styles.reminderText}>Send reminder to parent</Text>
            </TouchableOpacity>
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={confirmAddPayment}>
                <Text style={styles.confirmButtonText}>Add Payment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  adminAvatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  adminAvatarInitials: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  addButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
    marginTop: 4,
  },
  studentPicker: {
    maxHeight: 130,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    borderRadius: 10,
    marginBottom: 12,
  },
  studentPickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  studentPickerItemSelected: {
    backgroundColor: '#e8f0fe',
  },
  studentPickerText: {
    fontSize: 13,
    color: '#495057',
  },
  studentPickerTextSelected: {
    color: '#2F6FED',
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#dee2e6',
    alignItems: 'center',
  },
  statusOptionActive: {
    borderColor: '#2F6FED',
    backgroundColor: '#e8f0fe',
  },
  statusOptionText: {
    fontSize: 13,
    color: '#6c757d',
    fontWeight: '600',
  },
  statusOptionTextActive: {
    color: '#2F6FED',
    fontWeight: '700',
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#dee2e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2F6FED',
    borderColor: '#2F6FED',
  },
  checkboxCheck: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  reminderText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  selectedDateBadge: {
    backgroundColor: '#e8f0fe',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  selectedDateText: {
    fontSize: 13,
    color: '#2F6FED',
    fontWeight: '600',
    textAlign: 'center',
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
