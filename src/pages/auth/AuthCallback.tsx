import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [statusMessage, setStatusMessage] = useState<string>('Completing secure Google sign-in. Please wait...');

  useEffect(() => {
    let isCancelled = false;

    const processSession = async (user: any) => {
      try {
        await refreshProfile();

        // 1. Check if admin user
        const email = (user.email || '').toLowerCase();
        const isAdmin =
          email === 'materadmin@gmail.com' ||
          email === 'masteradmin@gmail.com' ||
          user.user_metadata?.role === 'admin' ||
          user.user_metadata?.role === 'super_admin';

        if (isAdmin) {
          try {
            await supabase.rpc('log_login_event', { p_method: 'oauth' });
          } catch (e) {
            console.warn('log_login_event RPC notice:', e);
          }
          if (!isCancelled) {
            navigate('/admin/dashboard', { replace: true });
          }
          return;
        }

        // 2. Read public.signup_records for auth user
        const { data: record, error: recError } = await supabase
          .from('signup_records')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (recError) {
          console.warn('Error reading signup_records in callback:', recError);
        }

        try {
          await supabase.rpc('log_login_event', { p_method: 'oauth' });
        } catch (e) {
          console.warn('log_login_event RPC notice:', e);
        }

        if (!isCancelled) {
          // If password_set is false (or record missing for new student), redirect to /complete-registration
          if (!record || record.password_set === false) {
            navigate('/complete-registration', { replace: true });
          } else {
            // If true, proceed to student dashboard
            navigate('/student/dashboard', { replace: true });
          }
        }
      } catch (err: any) {
        console.error('Error in auth callback:', err);
        if (!isCancelled) {
          setStatusMessage('Authentication error. Redirecting to login...');
          setTimeout(() => navigate('/login', { replace: true }), 2000);
        }
      }
    };

    const checkAuth = async () => {
      if (!isSupabaseConfigured()) {
        navigate('/student/dashboard', { replace: true });
        return;
      }

      // Check current session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('getSession error:', error);
        setStatusMessage('Authentication error. Redirecting to login...');
        setTimeout(() => navigate('/login', { replace: true }), 2000);
        return;
      }

      if (session?.user) {
        await processSession(session.user);
        return;
      }

      // Wait for onAuthStateChange if session exchange is in flight
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (newSession?.user && !isCancelled) {
          subscription.unsubscribe();
          await processSession(newSession.user);
        }
      });

      // Safety timeout after 6 seconds
      const timeout = setTimeout(() => {
        if (!isCancelled) {
          subscription.unsubscribe();
          setStatusMessage('Session timed out. Redirecting to login...');
          setTimeout(() => navigate('/login', { replace: true }), 1500);
        }
      }, 6000);

      return () => clearTimeout(timeout);
    };

    checkAuth();

    return () => {
      isCancelled = true;
    };
  }, [navigate, refreshProfile]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f1] p-4 text-center">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-sm w-full space-y-4 border border-slate-100">
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
    </div>
  );
};
