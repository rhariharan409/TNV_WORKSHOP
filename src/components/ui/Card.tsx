import React from 'react';
import { cn } from '../../lib/utils';
import { TopLeftWavyAccent, BottomRightWavyAccent } from './WavyDecorations';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  wavy?: boolean;
  accent?: 'none' | 'green' | 'yellow' | 'emerald' | 'amber' | 'blue';
}

export const Card: React.FC<CardProps> = ({
  className,
  wavy = false,
  accent = 'none',
  children,
  ...props
}) => {
  const accentClasses = {
    none: '',
    green: 'border-l-4 border-l-[#1b6b3a]',
    yellow: 'border-l-4 border-l-[#f5c518]',
    emerald: 'border-l-4 border-l-emerald-600',
    amber: 'border-l-4 border-l-amber-500',
    blue: 'border-l-4 border-l-blue-600',
  };

  return (
    <div
      className={cn(
        wavy
          ? 'relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-slate-200/90 bg-white text-slate-900 shadow-xl transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
          : 'rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-xs hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
        accentClasses[accent],
        className
      )}
      {...props}
    >
      {wavy && <TopLeftWavyAccent className="w-28 h-28 sm:w-36 sm:h-36 opacity-90" />}
      {wavy && <BottomRightWavyAccent className="w-28 h-28 sm:w-36 sm:h-36 opacity-90" />}
      <div className={wavy ? 'relative z-10' : undefined}>{children}</div>
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement> & { tinted?: boolean }> = ({
  className,
  tinted = false,
  ...props
}) => (
  <div
    className={cn(
      'flex flex-col space-y-1.5 p-6',
      tinted && 'bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100/70 dark:border-emerald-900/40 rounded-t-2xl',
      className
    )}
    {...props}
  />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
  <h3 className={cn('font-black text-xl leading-none tracking-tight text-slate-900 dark:text-white', className)} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
  <p className={cn('text-xs font-medium text-slate-500 dark:text-slate-400', className)} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
);
