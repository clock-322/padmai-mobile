import React, { createContext, useContext, ReactNode } from 'react';
import CustomModal from '../components/CustomModal';
import { useCustomModal } from '../hooks/useCustomModal';

interface ModalContextType {
  showModal: (config: any) => void;
  hideModal: () => void;
  showAlert: (title: string, message: string, onPress?: () => void) => void;
  showSuccess: (title: string, message: string, onPress?: () => void) => void;
  showWarning: (title: string, message: string, onPress?: () => void) => void;
  showError: (title: string, message: string, onPress?: () => void) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const {
    visible,
    config,
    showModal,
    hideModal,
    showAlert,
    showSuccess,
    showWarning,
    showError,
    showConfirm,
  } = useCustomModal();

  const value: ModalContextType = {
    showModal,
    hideModal,
    showAlert,
    showSuccess,
    showWarning,
    showError,
    showConfirm,
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
      <CustomModal
        visible={visible}
        title={config.title}
        message={config.message}
        type={config.type}
        showIcon={config.showIcon}
        buttons={config.buttons}
        onClose={hideModal}
        closeOnBackdrop={config.closeOnBackdrop}
      />
    </ModalContext.Provider>
  );
};
