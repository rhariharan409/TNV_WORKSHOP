import React, { useState } from 'react';
import { getSupabaseConfigStatus } from '../../lib/supabase';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';

export const ConfigBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const status = getSupabaseConfigStatus();

  if (dismissed || status.isConfigured) {
    return null;
  }

  const isDanger = status.isSecretKey;

  return (
    <div
      role="alert"
      className={`relative z-50 px-4 py-2.5 text-xs sm:text-sm font-medium flex items-center justify-between border-b ${
        isDanger
          ? 'bg-rose-600 text-white border-rose-700'
          : 'bg-amber-500 text-slate-950 border-amber-600'
      }`}
    >
      <div className="flex items-center gap-2 max-w-6xl mx-auto flex-1">
        {isDanger ? (
          <ShieldAlert className="h-4 w-4 shrink-0 text-white" />
        ) : (
          <AlertTriangle className="h-4 w-4 shrink-0 text-slate-950" />
        )}
        <span>
          <strong>Database Notice:</strong>{' '}
          {status.errorMessage ||
            'Supabase is not connected. The application is running with local fallback seed data.'}
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-black/10 transition-colors ml-3"
        aria-label="Dismiss banner"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
