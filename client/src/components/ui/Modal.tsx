import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showClose?: boolean;
  className?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  showClose = true,
  className,
}: ModalProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && showClose) onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose, showClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={showClose ? onClose : undefined}
      />

      {/* 弹窗内容 */}
      <div
        className={cn(
          'relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl',
          'max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto',
          'animate-in zoom-in-95 fade-in',
          className
        )}
      >
        {/* 标题栏 */}
        {(title || showClose) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {showClose && (
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* 内容 */}
        {children}
      </div>
    </div>
  );
}
