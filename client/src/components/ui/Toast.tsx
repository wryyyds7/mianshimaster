import React from 'react';
import { cn } from '../../utils/cn';

interface ToastProps {
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
  onClose: () => void;
  visible: boolean;
}

export function Toast({ message, type = 'info', onClose, visible }: ToastProps) {
  React.useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  const styles = {
    info: 'bg-blue-50 border-blue-500 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
    success: 'bg-green-50 border-green-500 text-green-800 dark:bg-green-900/50 dark:text-green-200',
    error: 'bg-red-50 border-red-500 text-red-800 dark:bg-red-900/50 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-500 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  };

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border-l-4 shadow-lg',
        'animate-in slide-in-from-right fade-in',
        styles[type]
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70">&times;</button>
      </div>
    </div>
  );
}
