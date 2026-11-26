import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'yellow';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-bold rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  const variants = {
    primary:
      'bg-[#1b6b3a] hover:bg-[#14532d] text-white shadow-md hover:shadow-lg focus:ring-[#1b6b3a] border border-transparent',
    yellow:
      'bg-[#f5c518] hover:bg-[#e6b800] text-slate-950 font-bold shadow-md hover:shadow-lg focus:ring-[#f5c518] border border-transparent',
    secondary:
      'bg-[#eef3f8] hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 focus:ring-slate-500 border border-transparent',
    outline:
      'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 focus:ring-[#1b6b3a]',
    ghost:
      'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60 focus:ring-slate-500',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-md focus:ring-rose-500 border border-transparent',
    success:
      'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md focus:ring-emerald-500 border border-transparent',
  };

  const sizes = {
    sm: 'text-xs px-4 py-2 gap-1.5 h-8',
    md: 'text-xs sm:text-sm px-6 py-2.5 gap-2 h-10',
    lg: 'text-sm sm:text-base px-8 py-3.5 gap-2.5 h-12',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
