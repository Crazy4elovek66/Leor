import * as React from 'react';
import { X } from 'lucide-react';

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, title, children }: DialogProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pt-[calc(env(safe-area-inset-top,24px)+36px)] bg-black/70 backdrop-blur-sm transition-opacity duration-200">
      <div
        className="w-full max-w-lg bg-[#17171A] border border-[#26262B] rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl transition-transform duration-200 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#26262B]">
          {title && <h3 className="text-lg font-semibold text-[#F5F5F7]">{title}</h3>}
          <button
            onClick={onClose}
            className="p-2 text-[#A1A1AA] hover:text-[#F5F5F7] rounded-full hover:bg-[#26262B] transition-colors ml-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
