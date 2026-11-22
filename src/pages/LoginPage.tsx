import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, LogOut, UserCheck, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  defaultMode?: 'signin' | 'signup';
}

export const LoginPage: React.FC<LoginPageProps> = ({ defaultMode = 'signin' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, signup, logout } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [showPassword, setShowPassword] = useState(false);

  // Sign In State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State (for new students)
  const [fullName, setFullName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || null;

  // Sync mode if defaultMode changes
  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    const trimmedPass = password.trim();

    if (!trimmedEmail) {
      setError('Please enter your email or username.');
      return;
    }
    if (!trimmedPass) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    const res = await login(trimmedEmail, trimmedPass);
    setIsLoading(false);

    if (res.success) {
      const cleanEmail = trimmedEmail.toLowerCase();
      const isAdmin =
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
      setError(res.error || 'Invalid credentials. Please verify your email and password.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    const res = await signup({
      email: email.trim(),
      password: password.trim(),
      fullName: fullName.trim() || email.split('@')[0],
      phone: phone.trim() || '+91 98765 00000',
      collegeName: collegeName.trim() || 'Engineering College',
      department: department.trim() || 'Information Technology',
      yearOfStudy: '3rd Year',
    });
    setIsLoading(false);

    if (res.success) {
      navigate('/student/dashboard', { replace: true });
    } else {
      setError(res.error || 'Failed to create student account.');
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
      {/* 1. TOP GREEN NAVIGATION BAR (Matching Image 2)           */}
      {/* ======================================================== */}
      <header className="w-full bg-[#155e32] text-white py-3 px-6 shadow-md z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto scrollbar-none text-xs font-semibold tracking-wide">
          <div className="flex items-center gap-6 sm:gap-8 whitespace-nowrap">
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">About</span>
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">Collaborate</span>
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">Our services</span>
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">Gallery</span>
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">How joining works</span>
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">Contact</span>
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">Events</span>
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">Campaigns</span>
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">Donate</span>
            <span className="cursor-pointer hover:text-emerald-200 transition-colors">Feedback</span>
          </div>

          <div className="text-[11px] font-bold text-emerald-200 uppercase tracking-widest hidden lg:block">
            TNV WORKSHOP WEBSITE
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN CENTER AUTHENTICATION CARD (Matching Image 2)    */}
      {/* ======================================================== */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2 border border-slate-100 min-h-[520px]">
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
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">Hello!</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">Sign in to your account</p>
                </div>

                {error && (
                  <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  {/* Email / Username Input */}
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-emerald-700 absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email or Username"
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
              /* Student Sign Up Mode */
              <div>
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Account</h1>
                  <p className="text-xs text-slate-500 font-medium mt-1">Register for TNV Workshop Academy</p>
                </div>

                {error && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-3">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name *"
                    required
                    className="w-full h-11 px-4 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                  />

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Student Email Address *"
                    required
                    className="w-full h-11 px-4 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                  />

                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create Password *"
                      required
                      className="w-full h-11 px-4 pr-11 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                      placeholder="College / Institution"
                      className="w-full h-11 px-3 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                    />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="Department (e.g. IT, CSE)"
                      className="w-full h-11 px-3 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                    />
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full max-w-[200px] py-3 px-8 rounded-full bg-[#1b6b3a] hover:bg-[#14532d] text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-60"
                    >
                      {isLoading ? 'Registering...' : 'Register as Student'}
                    </button>
                  </div>
                </form>

                <div className="text-center mt-5 text-xs text-slate-500 font-medium">
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
          <div className="relative bg-white flex flex-col items-center justify-center p-8 sm:p-12 overflow-hidden border-t md:border-t-0 md:border-l border-slate-100">
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
