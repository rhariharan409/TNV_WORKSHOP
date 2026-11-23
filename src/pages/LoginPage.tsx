import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, LogOut, UserCheck, ShieldCheck } from 'lucide-react';
import { EMAIL_REGEX, isValidEmail } from '../lib/utils';

interface LoginPageProps {
  defaultMode?: 'signin' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({ defaultMode = 'signin' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, signInWithGoogle, logout } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || null;

  // Sync mode if defaultMode changes
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleGoogleAuth = async () => {
    setError(null);
    setIsLoading(true);
    const res = await signInWithGoogle();
    if (!res.success) {
      setIsLoading(false);
      setError(res.error || 'Failed to initialize Google authentication.');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Validate email with regex
    if (!trimmedEmail || !trimmedPass || !EMAIL_REGEX.test(trimmedEmail)) {
      setError('Invalid email or password');
      return;
    }

    setIsLoading(true);
    const res = await login(trimmedEmail, trimmedPass);
    setIsLoading(false);

    if (res.success) {
      const cleanEmail = trimmedEmail.toLowerCase();
      const isAdmin =
        res.role === 'admin' ||
        res.role === 'super_admin' ||
        cleanEmail === 'materadmin@gmail.com' ||
        cleanEmail === 'masteradmin@gmail.com' ||
        cleanEmail === 'materadmin' ||
        cleanEmail === 'masteradmin';

      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else if (from && !from.startsWith('/admin')) {
        navigate(from, { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } else {
      // Requirement 5: Always show the generic message "Invalid email or password"
      setError('Invalid email or password');
    }
  };

  const handleSwitchAccount = async () => {
    await logout();
    setEmail('');
    setPassword('');
    setError(null);
  };

  const isUserAdmin =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.email?.toLowerCase() === 'materadmin@gmail.com' ||
    user?.email?.toLowerCase() === 'masteradmin@gmail.com';

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f1] text-slate-800 font-sans selection:bg-brand-600 selection:text-white">
      {/* ======================================================== */}
      {/* MAIN CENTER AUTHENTICATION CARD                          */}
      {/* ======================================================== */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[520px]">
          {/* ---------------------------------------------------- */}
          {/* LEFT COLUMN: SIGN IN / SIGN UP FORM                  */}
          {/* ---------------------------------------------------- */}
          <div className="p-8 sm:p-12 flex flex-col justify-center">
            {/* If user is ALREADY signed in: Provide 1-Click Fast Enter */}
            {user ? (
              <div className="text-center space-y-6 my-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-brand-700 flex items-center justify-center mx-auto shadow-sm">
                  {isUserAdmin ? (
                    <ShieldCheck className="w-9 h-9 text-brand-700" />
                  ) : (
                    <UserCheck className="w-9 h-9 text-brand-700" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Active Session
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
                    {user.full_name}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">{user.email}</p>
                  <p className="text-xs font-bold text-brand-700 uppercase tracking-wider mt-1">
                    {isUserAdmin ? 'Lead Academy Administrator' : 'Enrolled Student'}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <button
                    onClick={() =>
                      navigate(isUserAdmin ? '/admin/dashboard' : '/student/dashboard', {
                        replace: true,
                      })
                    }
                    className="w-full py-3.5 px-8 rounded-full bg-[#1b6b3a] hover:bg-[#14532d] text-white font-bold text-sm shadow-lg shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 group active:scale-98"
                  >
                    <span>Enter {isUserAdmin ? 'Admin Console' : 'Student Portal'}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign in with another account</span>
                  </button>
                </div>
              </div>
            ) : mode === 'signin' ? (
              /* Sign In Mode */
              <div>
                <div className="text-center mb-6">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hello!</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">Sign in to your account</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                    {error}
                  </div>
                )}

                {/* 1. Continue with Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-3 active:scale-98 disabled:opacity-60 mb-4"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                      Or sign in with email
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Email / Username Input */}
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-emerald-700 absolute left-4 pointer-events-none" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email Address"
                      required
                      className="w-full h-12 pl-11 pr-4 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                    />
                  </div>

                  {/* Password Input */}
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-emerald-700 absolute left-4 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      required
                      className="w-full h-12 pl-11 pr-11 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Forgot Password link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => alert('Please contact administrator at MaterAdmin@gmail.com for credential assistance.')}
                      className="text-[11px] text-slate-500 hover:text-brand-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Sign In Button */}
                  <div className="pt-2 text-center">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full max-w-[200px] py-3.5 px-8 rounded-full bg-[#1b6b3a] hover:bg-[#14532d] text-white font-bold text-sm shadow-md transition-all active:scale-95 disabled:opacity-60"
                    >
                      {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                  </div>
                </form>

                {/* Footer Switch to Sign Up */}
                <div className="text-center mt-8 text-xs text-slate-500 font-medium leading-relaxed">
                  <span>Don&apos;t have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="text-[#1b6b3a] font-bold hover:underline"
                  >
                    Join as a student
                  </button>
                  <span> or register an account</span>
                </div>
              </div>
            ) : (
              /* Student Sign Up Mode - Exclusively Real Google Account */
              <div className="space-y-5">
                <div className="text-center">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Enrollment</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">Join TNV Workshop Academy</p>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                    {error}
                  </div>
                )}

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-[#155e32] text-xs space-y-1.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    Verified Google Account Required
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Student registration is exclusively supported via real Google accounts. Click below to authenticate and configure your student account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isLoading}
                  className="w-full py-3.5 px-6 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-3 active:scale-98 disabled:opacity-60"
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
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setError(null);
                    }}
                    className="text-[#1b6b3a] font-bold hover:underline"
                  >
                    Back to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ---------------------------------------------------- */}
          {/* RIGHT COLUMN: WELCOME GRAPHIC & WAVY ART (Image 2)   */}
          {/* ---------------------------------------------------- */}
          <div className="relative bg-white flex flex-col items-center justify-center p-8 sm:p-12 overflow-hidden">
            {/* Top Organic Wave Graphic (Gold & Dark Green) */}
            <div className="absolute top-0 right-0 w-full h-40 pointer-events-none">
              <svg
                viewBox="0 0 400 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full object-cover preserve-3d"
              >
                {/* Gold Outer Wave */}
                <path
                  d="M120 0C120 45 140 70 170 85C210 105 240 70 290 90C340 110 380 160 400 180V0H120Z"
                  fill="#eab308"
                />
                {/* Green Inner Wave */}
                <path
                  d="M160 0C160 40 175 60 200 75C240 95 265 65 315 85C365 105 385 145 400 160V0H160Z"
                  fill="#155e32"
                />
              </svg>
            </div>

            {/* Bottom Organic Wave Graphic (Gold & Dark Green) */}
            <div className="absolute bottom-0 right-0 w-full h-40 pointer-events-none">
              <svg
                viewBox="0 0 400 180"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full object-cover"
              >
                {/* Gold Outer Wave */}
                <path
                  d="M0 180C40 160 80 120 130 110C180 100 210 130 250 115C280 100 300 75 300 0H400V180H0Z"
                  fill="#eab308"
                />
                {/* Green Inner Wave */}
                <path
                  d="M0 180C40 170 90 140 140 130C190 120 220 145 260 130C290 115 310 90 310 0H400V180H0Z"
                  fill="#155e32"
                />
              </svg>
            </div>

            {/* Center Content & Logo (Matching Image 2) */}
            <div className="relative z-10 text-center space-y-4 max-w-xs">
              {/* Circular TNV Logo Emblem */}
              <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white p-1 shadow-lg ring-4 ring-[#1b6b3a]/20">
                <img
                  src="/tnv-logo.png"
                  alt="Tamil Nadu Volunteers Seal"
                  className="w-full h-full object-contain rounded-full"
                />
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Welcome back!
              </h2>

              {/* Single content of TNV WORKSHOP WEBSITE */}
              <div className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-[#155e32] font-black text-[11px] tracking-wider uppercase">
                TNV WORKSHOP WEBSITE
              </div>

              {/* Exact Text from Image 2 */}
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                Your events, tasks, certificates and learning modules are waiting. Sign in to pick up where your learning journey left off.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
