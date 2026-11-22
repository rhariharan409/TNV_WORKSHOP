import React from 'react';

export const TopLeftWavyAccent: React.FC<{ className?: string }> = ({ className = 'w-32 h-32 sm:w-40 sm:h-40' }) => (
  <div className={`absolute top-0 left-0 pointer-events-none z-0 overflow-hidden rounded-tl-[28px] ${className}`}>
    <svg
      viewBox="0 0 160 160"
      fill="none"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      {/* Green Outer Wave */}
      <path
        d="M0 0 H105 C90 18 58 32 38 65 C22 92 12 108 0 118 V0 Z"
        fill="#155e32"
      />
      {/* Gold Inner Ribbon */}
      <path
        d="M0 118 C12 108 22 92 38 65 C58 32 90 18 105 0 H120 C105 20 70 36 49 70 C31 98 16 122 0 134 V118 Z"
        fill="#f59e0b"
      />
    </svg>
  </div>
);

export const BottomRightWavyAccent: React.FC<{ className?: string }> = ({ className = 'w-32 h-32 sm:w-40 sm:h-40' }) => (
  <div className={`absolute bottom-0 right-0 pointer-events-none z-0 overflow-hidden rounded-br-[28px] ${className}`}>
    <svg
      viewBox="0 0 160 160"
      fill="none"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
    >
      {/* Green Outer Wave */}
      <path
        d="M160 160 H55 C70 142 102 128 122 95 C138 68 148 52 160 42 V160 Z"
        fill="#155e32"
      />
      {/* Gold Inner Ribbon */}
      <path
        d="M160 42 C148 52 138 68 122 95 C102 128 70 142 55 160 H40 C55 140 90 124 111 90 C129 62 144 38 160 26 V42 Z"
        fill="#f59e0b"
      />
    </svg>
  </div>
);

interface WavyFormCardProps {
  children: React.ReactNode;
  className?: string;
}

export const WavyFormCard: React.FC<WavyFormCardProps> = ({ children, className = '' }) => (
  <div className={`relative bg-white dark:bg-slate-900 rounded-[28px] sm:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden p-6 sm:p-10 ${className}`}>
    <TopLeftWavyAccent />
    <BottomRightWavyAccent />
    <div className="relative z-10">{children}</div>
  </div>
);
