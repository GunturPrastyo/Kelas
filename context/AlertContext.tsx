"use client";

import { createContext, useState, useContext, ReactNode, useCallback } from 'react';

type AlertType = 'alert' | 'confirm';

interface AlertOptions {
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface AlertContextType {
  alertOptions: AlertOptions | null;
  showAlert: (options: Partial<AlertOptions>) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((options: Partial<AlertOptions>) => {
    setAlertOptions({
      type: options.type || 'alert',
      title: options.title || 'Informasi',
      message: options.message || '',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Batal',
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertOptions(null);
  }, []);

  return (
    <AlertContext.Provider value={{ alertOptions, showAlert, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
};