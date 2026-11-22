import React from 'react';
import { cn } from '../../lib/utils';
import { TopLeftWavyAccent, BottomRightWavyAccent } from './WavyDecorations';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  wavy?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, wavy = false, children, ...props }) => (
  <div
    className={cn(
      wavy
        ? 'relative overflow-hidden rounded-[28px] sm:rounded-[32px] border border-slate-100 bg-white text-slate-900 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
        : 'rounded-2xl border border-slate-200/80 bg-white text-slate-900 shadow-sm transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
      className
    )}
    {...props}
  >
    {wavy && <TopLeftWavyAccent className="w-28 h-28 sm:w-36 sm:h-36 opacity-90" />}
    {wavy && <BottomRightWavyAccent className="w-28 h-28 sm:w-36 sm:h-36 opacity-90" />}
    <div className={wavy ? 'relative z-10' : undefined}>{children}</div>
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
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
