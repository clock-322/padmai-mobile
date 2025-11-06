import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useModal } from '../../contexts/ModalContext';

const ModalDemoScreen: React.FC = () => {
  const { showAlert, showSuccess, showWarning, showError, showConfirm, showModal } = useModal();

  const handleInfoAlert = () => {
    showAlert('Information', 'This is an informational message with a blue info icon.');
  };

  const handleSuccessAlert = () => {
    showSuccess('Success!', 'Your action was completed successfully.');
  };

  const handleWarningAlert = () => {
    showWarning('Warning', 'Please be careful with this action.');
  };

  const handleErrorAlert = () => {
    showError('Error', 'Something went wrong. Please try again.');
  };

  const handleConfirmDialog = () => {
    showConfirm(
      'Confirm Action',
      'Are you sure you want to proceed with this action?',
      () => {
        showSuccess('Confirmed', 'Action has been confirmed!');
      },
      () => {
        showAlert('Cancelled', 'Action was cancelled.');
      }
    );
  };

  const handleCustomModal = () => {
    showModal({
      title: 'Custom Modal',
      message: 'This is a custom modal with multiple buttons and custom styling.',
      type: 'info',
      showIcon: true,
      buttons: [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Maybe Later',
          onPress: () => {
            showAlert('Later', 'You chose to do this later.');
          },
        },
        {
          text: 'Proceed',
          onPress: () => {
            showSuccess('Proceeded', 'You chose to proceed with the action.');
          },
          style: 'destructive',
        },
      ],
    });
  };

  const handleNoIconModal = () => {
    showModal({
      title: 'No Icon Modal',
      message: 'This modal doesn\'t show an icon, just the title and message.',
      showIcon: false,
      buttons: [
        {
          text: 'Got it',
          onPress: () => {},
        },
      ],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>🎨 Custom Modal Demo</Text>
          <Text style={styles.subtitle}>Beautiful, animated modals to replace default alerts</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Modals</Text>
          
          <TouchableOpacity style={styles.button} onPress={handleInfoAlert}>
            <Text style={styles.buttonText}>ℹ️ Info Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.successButton]} onPress={handleSuccessAlert}>
            <Text style={styles.buttonText}>✅ Success Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={handleWarningAlert}>
            <Text style={styles.buttonText}>⚠️ Warning Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={handleErrorAlert}>
            <Text style={styles.buttonText}>❌ Error Alert</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Interactive Modals</Text>
          
          <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={handleConfirmDialog}>
            <Text style={styles.buttonText}>🤔 Confirm Dialog</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.customButton]} onPress={handleCustomModal}>
            <Text style={styles.buttonText}>🎨 Custom Modal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.noIconButton]} onPress={handleNoIconModal}>
            <Text style={styles.buttonText}>🚫 No Icon Modal</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.featuresSection}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureList}>
            <Text style={styles.featureItem}>✨ Beautiful animations</Text>
            <Text style={styles.featureItem}>🎨 Customizable styling</Text>
            <Text style={styles.featureItem}>📱 Responsive design</Text>
            <Text style={styles.featureItem}>🔧 Easy to use</Text>
            <Text style={styles.featureItem}>🎯 Multiple button styles</Text>
            <Text style={styles.featureItem}>📦 TypeScript support</Text>
          </View>
        </View>
      </ScrollView>
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
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#B3D4FF',
    textAlign: 'center',
  },
  section: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#2F6FED',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  successButton: {
    backgroundColor: '#28a745',
  },
  warningButton: {
    backgroundColor: '#ffc107',
  },
  errorButton: {
    backgroundColor: '#dc3545',
  },
  confirmButton: {
    backgroundColor: '#6f42c1',
  },
  customButton: {
    backgroundColor: '#fd7e14',
  },
  noIconButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  featuresSection: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  featureList: {
    marginTop: 10,
  },
  featureItem: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 10,
  },
});

export default ModalDemoScreen;
