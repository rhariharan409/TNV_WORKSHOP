import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { TopLeftWavyAccent, BottomRightWavyAccent } from './WavyDecorations';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'md',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={cn(
          'relative w-full rounded-[28px] sm:rounded-[32px] bg-white shadow-2xl transition-all border border-slate-100 dark:border-slate-800 dark:bg-slate-900 flex flex-col max-h-[92vh] overflow-hidden',
          maxWidths[maxWidth]
        )}
      >
        {/* Organic Corner Wave Accents (Matching Login Page Theme) */}
        <TopLeftWavyAccent className="w-28 h-28 sm:w-36 sm:h-36 opacity-90" />
        <BottomRightWavyAccent className="w-28 h-28 sm:w-36 sm:h-36 opacity-90" />

        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between border-b border-slate-100/80 px-6 sm:px-8 py-5 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm">
          <div className="pr-4 pl-4 sm:pl-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all focus:outline-none"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 px-6 sm:px-8 py-6 overflow-y-auto flex-1">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="relative z-10 flex items-center justify-end gap-3 border-t border-slate-100 px-6 sm:px-8 py-4 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/70 rounded-b-[28px] sm:rounded-b-[32px]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
