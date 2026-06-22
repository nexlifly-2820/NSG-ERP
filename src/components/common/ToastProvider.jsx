import React, { createContext, useContext, useCallback, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react';
import './toast.css';

const ToastContext = createContext({
  showToast: (msg, type = 'success') => {},
});

export const useToast = () => useContext(ToastContext);

const CustomToast = ({ t, type, message }) => {
  let icon;
  let label;
  let className = 'toast ';
  
  if (type === 'success') {
    icon = <CheckCircle2 size={18} />;
    label = 'SUCCESS';
    className += 'toast-success';
  } else if (type === 'error') {
    icon = <XCircle size={18} />;
    label = 'ERROR';
    className += 'toast-error';
  } else if (type === 'warning') {
    icon = <AlertTriangle size={18} />;
    label = 'WARNING';
    className += 'toast-warning';
  } else {
    icon = <Info size={18} />;
    label = 'INFO';
    className += 'toast-info';
  }

  // react-hot-toast controls the enter/exit animation of the wrapper,
  // we just need to provide the internal UI and progress bar
  return (
    <div className={className}>
      <div className="toast-icon-wrap">
        {icon}
      </div>
      <div className="toast-body">
        <span className="toast-label">{label}</span>
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close" onClick={() => toast.dismiss(t.id)}>
        <X size={14} />
      </button>
      <div 
        className="toast-progress" 
        style={{ animationDuration: `${t.duration || 4000}ms` }}
      ></div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const showToast = useCallback((msg, type = 'success') => {
    const duration = type === 'error' ? 5000 : 4000;
    toast.custom((t) => <CustomToast t={t} type={type} message={msg} />, {
      duration,
    });
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
        position="top-right"
        reverseOrder={false}
        containerStyle={{
          top: '88px', // Pushes it below the navbar (72px + 16px margin)
        }}
        toastOptions={{
          // Only used if someone directly calls toast.success() instead of window.toast.success()
          duration: 4000,
        }}
      />
    </ToastContext.Provider>
  );
};
