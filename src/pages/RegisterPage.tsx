import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dataProvider } from '../lib/dataProvider';
import { Course } from '../types/database';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { GraduationCap, ArrowRight, ShieldCheck } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signup, isAuthenticated } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [department, setDepartment] = useState('');
  const [yearOfStudy, setYearOfStudy] = useState('3rd Year');
  const [selectedCourse, setSelectedCourse] = useState(searchParams.get('course') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    dataProvider.getCourses({ publishedOnly: true }).then((list) => {
      setCourses(list);
      if (!selectedCourse && list.length > 0) {
        setSelectedCourse(list[0].id);
      }
    });
  }, [selectedCourse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) return setError('Please enter your full name.');
    if (!email.trim() || !email.includes('@')) return setError('Please provide a valid email address.');
    if (!phone.trim() || phone.length < 10) return setError('Please provide a valid 10-digit mobile number.');
    if (!collegeName.trim()) return setError('Please provide your college name.');
    if (!department.trim()) return setError('Please enter your engineering department.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    if (!selectedCourse) return setError('Please select a course to begin.');

    setIsLoading(true);
    const result = await signup({
      email,
      password,
      fullName,
      phone,
      collegeName,
      department,
      yearOfStudy,
    });

    if (!result.success) {
      setIsLoading(false);
      setError(result.error || 'Registration failed. Please try again.');
    } else {
      // Auto-enroll in selected course
      if (selectedCourse) {
        try {
          const authUser = JSON.parse(localStorage.getItem('tnv_auth_session') || '{}');
          if (authUser?.id) {
            await dataProvider.enrollInCourse(selectedCourse, authUser.id);
          }
        } catch (enrollErr) {
          console.warn('Post-registration course enrollment skipped:', enrollErr);
        }
      }
      setIsLoading(false);
      navigate('/student/dashboard');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card wavy className="shadow-2xl border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center space-y-2">
          <img src="/tnv-logo.png" alt="Tamil Nadu Volunteers" className="w-14 h-14 mx-auto rounded-full object-contain mb-2 shadow-xs" />
          <CardTitle className="text-2xl font-extrabold tracking-tight">Student Enrollment Registration</CardTitle>
          <CardDescription className="text-xs text-slate-500">
            Tamil Nadu Volunteers (தமிழ்நாடு தன்னார்வலர்கள்) • TNV Workshop Academy
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="e.g. Aditya Ramanathan"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Email Address *"
                type="email"
                placeholder="student@college.edu.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number (WhatsApp) *"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />

              <Input
                label="College / Institute Name *"
                placeholder="e.g. PSG Tech / Anna University"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Department / Specialization *"
                placeholder="e.g. Computer Science / ECE"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />

              <Select
                label="Year of Study *"
                value={yearOfStudy}
                onChange={(e) => setYearOfStudy(e.target.value)}
                options={[
                  { value: '1st Year', label: '1st Year' },
                  { value: '2nd Year', label: '2nd Year' },
                  { value: '3rd Year', label: '3rd Year' },
                  { value: '4th Year / Final', label: '4th Year / Final' },
                  { value: 'Postgraduate / Graduate', label: 'Postgraduate / Graduate' },
                ]}
              />
            </div>

            <Select
              label="Select Course to Begin Learning *"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              options={courses.map((c) => ({
                value: c.id,
                label: `${c.title} (${c.category || 'Technical Track'})`,
              }))}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password *"
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm Password *"
                type="password"
                placeholder="Re-type password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
                <span>Access Verification Notice:</span>
              </div>
              <p>
                Following registration, your account status will be set to <strong>Payment Pending</strong>. You will be able to submit your UPI reference on the dashboard for administrator verification and immediate course unlock.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full font-bold"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete Registration & Proceed
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand-600 hover:underline dark:text-brand-400">
              Sign In to Portal
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
