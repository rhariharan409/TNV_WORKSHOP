import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { User, Mail, Phone, School, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [collegeName, setCollegeName] = useState(user?.college_name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [yearOfStudy, setYearOfStudy] = useState(user?.year_of_study || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <Badge variant="brand">Academic Record</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          Student Profile & Credentials
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Your official academic details are used for certificate generation and college attendance validation.
        </p>
      </div>

      <Card className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white font-black text-2xl shadow-md">
            {user?.full_name?.charAt(0) || 'S'}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user?.full_name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              Role: {user?.role}
            </span>
          </div>
        </div>

        {saved && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Profile details saved successfully.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name (Printed on Certificate)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Phone Number (WhatsApp Channel)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="College / Institute Name"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              required
            />
            <Input
              label="Department / Degree"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>

          <Input
            label="Year of Study"
            value={yearOfStudy}
            onChange={(e) => setYearOfStudy(e.target.value)}
            required
          />

          <Button type="submit" variant="primary" size="md">
            Save Profile Information
          </Button>
        </form>
      </Card>
    </div>
  );
};
