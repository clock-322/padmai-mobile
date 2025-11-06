import { useState } from 'react';

interface ModalButton {
  text: string;
  onPress: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface ModalConfig {
  title?: string;
  message?: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  showIcon?: boolean;
  buttons?: ModalButton[];
  closeOnBackdrop?: boolean;
}

export const useCustomModal = () => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<ModalConfig>({});

  const showModal = (modalConfig: ModalConfig) => {
    setConfig(modalConfig);
    setVisible(true);
  };

  const hideModal = () => {
    setVisible(false);
  };

  // Convenience methods for common modal types
  const showAlert = (title: string, message: string, onPress?: () => void) => {
    showModal({
      title,
      message,
      type: 'info',
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
        },
      ],
    });
  };

  const showSuccess = (title: string, message: string, onPress?: () => void) => {
    showModal({
      title,
      message,
      type: 'success',
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
        },
      ],
    });
  };

  const showWarning = (title: string, message: string, onPress?: () => void) => {
    showModal({
      title,
      message,
      type: 'warning',
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
        },
      ],
    });
  };

  const showError = (title: string, message: string, onPress?: () => void) => {
    showModal({
      title,
      message,
      type: 'error',
      buttons: [
        {
          text: 'OK',
          onPress: onPress || (() => {}),
        },
      ],
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ) => {
    showModal({
      title,
      message,
      type: 'warning',
      buttons: [
        {
          text: 'Cancel',
          onPress: onCancel || (() => {}),
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: onConfirm,
          style: 'destructive',
        },
      ],
    });
  };

  return {
    visible,
    config,
    showModal,
    hideModal,
    showAlert,
    showSuccess,
    showWarning,
    showError,
    showConfirm,
  };
};
