import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Lock, Eye, EyeOff, Phone, School, BookOpen, Calendar, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';

export const CompleteRegistration: React.FC = () => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading, refreshProfile } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [college, setCollege] = useState(user?.college_name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [year, setYear] = useState(user?.year_of_study || '3rd Year');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Protected: redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [user, isAuthLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Password validation: min 8 chars, at least one uppercase, one lowercase, one number
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter (A-Z).');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter (a-z).');
      return;
    }
    if (!/\d/.test(password)) {
      setError('Password must contain at least one number (0-9).');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    // Academic & contact fields validation
    if (!phone.trim() || phone.trim().length < 10) {
      setError('Please provide a valid 10-digit mobile phone number.');
      return;
    }
    if (!college.trim()) {
      setError('Please enter your college / institution name.');
      return;
    }
    if (!department.trim()) {
      setError('Please enter your engineering / academic department.');
      return;
    }
    if (!year.trim()) {
      setError('Please select your current year of study.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSupabaseConfigured() && user?.id) {
        // 1. Update user password in Supabase Auth
        const { error: authErr } = await supabase.auth.updateUser({ password });
        if (authErr) {
          throw new Error(authErr.message || 'Failed to update account password.');
        }

        // 2. Update user's row in public.profiles with the details
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({
            phone: phone.trim(),
            college_name: college.trim(),
            department: department.trim(),
            year_of_study: year.trim(),
          })
          .eq('id', user.id);

        if (profileErr) {
          console.warn('Profile update warning:', profileErr.message);
        }

        // 3. Call supabase.rpc('mark_password_set')
        try {
          const { error: rpcErr } = await supabase.rpc('mark_password_set');
          if (rpcErr) {
            console.warn('mark_password_set RPC notice:', rpcErr);
          }
        } catch (rpcEx) {
          console.warn('mark_password_set exception:', rpcEx);
        }

        // 4. Refresh local profile cache
        await refreshProfile();
      }

      // 5. Navigate to student dashboard
      navigate('/student/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Error in complete-registration:', err);
      setError(err.message || 'Failed to complete registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f0f4f1]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f1] text-slate-800 font-sans selection:bg-brand-600 selection:text-white">
      {/* Main Form Center */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl bg-white rounded-[32px] shadow-2xl p-6 sm:p-10 space-y-6">
          <div className="text-center space-y-2">
            <div className="relative mx-auto w-16 h-16 rounded-full bg-white p-1 shadow-md mb-2">
              <img
                src="/tnv-logo.png"
                alt="Tamil Nadu Volunteers"
                className="w-full h-full object-contain rounded-full"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Complete Your Registration
            </h1>
            <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
              Welcome, <strong>{user?.email}</strong>. Set your password and provide your college details to finalize your enrollment.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Password Section */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Create Account Password *
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-emerald-700 absolute left-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
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
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Confirm Password *
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-emerald-700 absolute left-4 pointer-events-none" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  className="w-full h-12 pl-11 pr-11 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Mobile Phone Number *
              </label>
              <div className="relative flex items-center">
                <Phone className="w-4 h-4 text-emerald-700 absolute left-4 pointer-events-none" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full h-12 pl-11 pr-4 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                />
              </div>
            </div>

            {/* College & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  College / Institution *
                </label>
                <div className="relative flex items-center">
                  <School className="w-4 h-4 text-emerald-700 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. PSG Tech / CIT"
                    required
                    className="w-full h-12 pl-10 pr-3 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Department *
                </label>
                <div className="relative flex items-center">
                  <BookOpen className="w-4 h-4 text-emerald-700 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. IT, CSE, ECE"
                    required
                    className="w-full h-12 pl-10 pr-3 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                  />
                </div>
              </div>
            </div>

            {/* Year of Study */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Year of Study *
              </label>
              <div className="relative flex items-center">
                <Calendar className="w-4 h-4 text-emerald-700 absolute left-4 pointer-events-none" />
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 bg-[#eef3f8] text-slate-800 text-xs font-semibold rounded-2xl border-none focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                >
                  <option value="1st Year">1st Year (Fresher)</option>
                  <option value="2nd Year">2nd Year (Sophomore)</option>
                  <option value="3rd Year">3rd Year (Junior)</option>
                  <option value="Final Year">Final Year (Senior)</option>
                  <option value="Postgraduate">Postgraduate</option>
                  <option value="Alumni / Professional">Alumni / Professional</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3 text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-8 rounded-full bg-[#1b6b3a] hover:bg-[#14532d] text-white font-bold text-sm shadow-lg shadow-emerald-900/10 transition-all flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
              >
                <span>{isSubmitting ? 'Saving Registration...' : 'Complete Registration & Continue'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};
