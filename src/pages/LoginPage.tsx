import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { GraduationCap, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, switchDemoRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) return setError('Please enter your email.');

    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      if (from) {
        navigate(from, { replace: true });
      } else if (email.toLowerCase().includes('admin')) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/student/dashboard', { replace: true });
      }
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  const handleQuickDemo = (role: 'student' | 'admin') => {
    if (role === 'student') {
      setEmail('student@tnvworkshop.edu.in');
      setPassword('DemoStudent123!');
      switchDemoRole('student');
      navigate('/student/dashboard');
    } else {
      setEmail('admin@tnvworkshop.edu.in');
      setPassword('DemoAdmin123!');
      switchDemoRole('admin');
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <Card className="shadow-xl border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md mb-2">
            <GraduationCap className="h-7 w-7" />
          </div>
          <CardTitle className="text-2xl font-extrabold tracking-tight">Portal Authentication</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Sign in to access your student dashboard or administrative console.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Quick Demo Fill Buttons */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">
              Quick Evaluator / Demo Login
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold bg-white dark:bg-slate-900"
                onClick={() => handleQuickDemo('student')}
                leftIcon={<UserCheck className="w-3.5 h-3.5 text-brand-600" />}
              >
                Demo Student
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full text-xs font-semibold bg-white dark:bg-slate-900"
                onClick={() => handleQuickDemo('admin')}
                leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-amber-500" />}
              >
                Demo Admin
              </Button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address *"
              type="email"
              placeholder="e.g. student@tnvworkshop.edu.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Password *
                </label>
                <Link to="/forgot-password" className="text-xs text-brand-600 hover:underline dark:text-brand-400">
                  Forgot?
                </Link>
              </div>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to Account
            </Button>
          </form>

          <div className="text-center text-xs text-slate-500 dark:text-slate-400">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Register for Workshop
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
