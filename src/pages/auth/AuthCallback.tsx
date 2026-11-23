import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Loader2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [statusMessage, setStatusMessage] = useState<string>('Completing secure Google sign-in. Please wait...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isProcessedRef = useRef<boolean>(false);

  useEffect(() => {
    if (isProcessedRef.current) return;

    let isMounted = true;

    const processUserSession = async (user: any) => {
      if (isProcessedRef.current) return;
      isProcessedRef.current = true;

      try {
        // Sync profile into memory (safe non-blocking)
        try {
          await refreshProfile();
        } catch (e) {
          console.warn('refreshProfile notice in callback:', e);
        }

        // 1. Check if admin user
        const email = (user.email || '').toLowerCase();
        const isAdmin =
          email === 'materadmin@gmail.com' ||
          email === 'masteradmin@gmail.com' ||
          user.user_metadata?.role === 'admin' ||
          user.user_metadata?.role === 'super_admin';

        if (isAdmin) {
          try {
            await Promise.race([
              supabase.rpc('log_login_event', { p_method: 'oauth' }),
              new Promise((r) => setTimeout(r, 1500)),
            ]);
          } catch (e) {
            console.warn('log_login_event RPC notice:', e);
          }
          if (isMounted) {
            navigate('/admin/dashboard', { replace: true });
          }
          return;
        }

        // 2. Read public.signup_records for auth user with timeout protection
        let record: any = null;
        try {
          const res: any = await Promise.race([
            supabase
              .from('signup_records')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle(),
            new Promise((r) => setTimeout(() => r({ data: null, error: 'timeout' }), 2500)),
          ]);
          record = res?.data;
        } catch (recError) {
          console.warn('Error reading signup_records in callback:', recError);
        }

        // 3. Log login event (non-blocking)
        try {
          await Promise.race([
            supabase.rpc('log_login_event', { p_method: 'oauth' }),
            new Promise((r) => setTimeout(r, 1500)),
          ]);
        } catch (e) {
          console.warn('log_login_event RPC notice:', e);
        }

        if (isMounted) {
          // If password_set is false (or record missing for new student), redirect to /complete-registration
          if (!record || record.password_set === false) {
            navigate('/complete-registration', { replace: true });
          } else {
            navigate('/student/dashboard', { replace: true });
          }
        }
      } catch (err: any) {
        console.error('Error in auth callback processSession:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Authentication error. Please try logging in again.');
        }
      }
    };

    const handleOAuthCallback = async () => {
      if (!isSupabaseConfigured()) {
        navigate('/student/dashboard', { replace: true });
        return;
      }

      // Check URL parameters for explicit OAuth errors (e.g. access_denied)
      const urlParams = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      const errorParam = urlParams.get('error') || hashParams.get('error');
      const errorDesc = urlParams.get('error_description') || hashParams.get('error_description');

      if (errorParam) {
        console.error('OAuth error from provider:', errorParam, errorDesc);
        if (isMounted) {
          setErrorMessage(errorDesc || 'Google sign-in was cancelled or encountered an error.');
        }
        return;
      }

      try {
        // If PKCE auth code is present in query parameters, exchange it explicitly
        const code = urlParams.get('code');
        if (code) {
          setStatusMessage('Exchanging authentication code...');
          try {
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
              console.warn('exchangeCodeForSession warning:', exchangeError.message);
            }
          } catch (exchangeEx) {
            console.warn('exchangeCodeForSession exception:', exchangeEx);
          }
        }

        // Check for active session with short polling retry (up to 5 attempts)
        setStatusMessage('Verifying user session...');
        let activeSession = null;
        for (let i = 0; i < 5; i++) {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.user) {
            activeSession = data.session;
            break;
          }
          await new Promise((r) => setTimeout(r, 350));
        }

        if (activeSession?.user) {
          await processUserSession(activeSession.user);
          return;
        }

        // Wait for onAuthStateChange if background exchange is in flight
        let subscription: any = null;
        const authPromise = new Promise<any>((resolve) => {
          const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (newSession?.user) {
              resolve(newSession);
            }
          });
          subscription = data.subscription;
        });

        const timeoutPromise = new Promise<null>((resolve) => {
          setTimeout(() => resolve(null), 6000);
        });

        const resultSession = await Promise.race([authPromise, timeoutPromise]);
        if (subscription) {
          subscription.unsubscribe();
        }

        if (resultSession?.user) {
          await processUserSession(resultSession.user);
          return;
        }

        // If no session after all checks, report clearly
        if (isMounted) {
          setErrorMessage('Could not verify Google authentication session. Please try signing in again.');
        }
      } catch (err: any) {
        console.error('Fatal error in auth callback:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'An error occurred while verifying authentication.');
        }
      }
    };

    handleOAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f1] p-4 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-5">
        {errorMessage ? (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Authentication Issue
              </h2>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="w-full py-3 px-4 rounded-2xl bg-[#155e32] hover:bg-[#114b28] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md active:scale-98"
              >
                <ArrowLeft className="w-4 h-4" /> Return to Sign In
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-2.5 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Try Again
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[#155e32] flex items-center justify-center mx-auto shadow-sm">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Verifying Authentication
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {statusMessage}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
