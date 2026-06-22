import React, { createContext, useContext, useCallback, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext({
  showToast: (msg, type = 'success') => {},
});

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const showToast = useCallback((msg, type = 'success') => {
    if (type === 'success') {
      toast.success(msg);
    } else if (type === 'error') {
      toast.error(msg);
    } else if (type === 'warning') {
      // Custom styling for warnings
      toast(msg, { icon: '⚠️' });
    } else {
      toast(msg); // Default info
    }
  }, []);

  useEffect(() => {
    const toastMethods = {
      success: (msg) => showToast(msg, 'success'),
      error: (msg) => showToast(msg, 'error'),
      warning: (msg) => showToast(msg, 'warning'),
      info: (msg) => showToast(msg, 'info'),
    };
    window.toast = toastMethods;
    window.showToast = showToast;
    return () => {
      delete window.toast;
      delete window.showToast;
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toaster 
        position="bottom-right"
        reverseOrder={false}
        toastOptions={{
          // Default options for all toasts
          className: '',
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            padding: '12px 20px',
            fontFamily: 'inherit',
            border: '1px solid #e2e8f0',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000, // Show errors a bit longer
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#fff',
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
};
