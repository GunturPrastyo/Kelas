"use client";

import { useAlert } from '@/context/AlertContext';
import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function AlertDialog() {
  const { alertOptions, hideAlert } = useAlert();

  if (!alertOptions) return null;

  const { type, title, message, onConfirm, onCancel, confirmText, cancelText } = alertOptions;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    hideAlert();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    hideAlert();
  };

  const getIcon = () => {
    switch (title.toLowerCase()) {
      case 'sukses':
      case 'selamat!':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'konfirmasi':
        return <AlertTriangle className="w-12 h-12 text-yellow-500" />;
      default:
        return <Info className="w-12 h-12 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[999] flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform transition-all animate-in fade-in-0 zoom-in-95">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
          {getIcon()}
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <div className="mt-2">
          <p className="text-sm text-gray-600 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: message }} />
        </div>
        <div className={`mt-6 flex gap-3 ${type === 'confirm' ? 'justify-center' : 'justify-center'}`}>
          {type === 'confirm' && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none ${
              title.toLowerCase() === 'konfirmasi'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
        <button onClick={hideAlert} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}