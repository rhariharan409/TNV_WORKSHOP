import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignup = async () => {
    setError(null);
    setIsLoading(true);

    if (isSupabaseConfigured()) {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback',
          queryParams: { prompt: 'select_account' },
        },
      });

      if (authError) {
        setIsLoading(false);
        setError(authError.message || 'Failed to initialize Google authentication.');
      }
      return;
    }

    // Demo mode fallback only when isSupabaseConfigured() is false
    const res = await signInWithGoogle();
    setIsLoading(false);
    if (!res.success) {
      setError(res.error || 'Failed to authenticate in demo mode.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f1] px-4 py-12">
      <Card wavy className="max-w-md w-full shadow-2xl border-0 border-transparent bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 space-y-6">
        <CardHeader className="text-center space-y-2 p-0">
          <img
            src="/tnv-logo.png"
            alt="Tamil Nadu Volunteers"
            className="w-16 h-16 mx-auto rounded-full object-contain mb-1 shadow-xs bg-white p-1"
          />
          <CardTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Student Registration
          </CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Tamil Nadu Volunteers (தமிழ்நாடு தன்னார்வலர்கள்) • TNV Workshop Academy
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#155e32] dark:text-emerald-300 text-xs space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              Verified Google Sign-In Required
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              New students may only sign up with a real Google account. In the next step, you will configure your secure password and college details.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-800 dark:text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-3 active:scale-98 disabled:opacity-60"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{isLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="text-center pt-2 text-xs text-slate-500 font-medium">
            <span>Already registered? </span>
            <Link to="/login" className="text-[#1b6b3a] dark:text-emerald-400 font-bold hover:underline inline-flex items-center gap-1">
              Sign In <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
