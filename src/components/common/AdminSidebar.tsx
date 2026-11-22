import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  FileCheck2,
  GraduationCap,
  Video,
  UserCheck,
  Award,
  MessageSquareWarning,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const AdminSidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const links = [
    { name: 'Dashboard & Analytics', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Courses', href: '/admin/courses', icon: BookOpen },
    { name: 'Student Management', href: '/admin/students', icon: Users },
    { name: 'Assignment Manager', href: '/admin/assignments', icon: FileText },
    { name: 'Submissions & Grading', href: '/admin/submissions', icon: FileCheck2 },
    { name: 'Examination Center', href: '/admin/examinations', icon: GraduationCap },
    { name: 'Live Sessions', href: '/admin/live-sessions', icon: Video },
    { name: 'Attendance Records', href: '/admin/attendance', icon: UserCheck },
    { name: 'Certificates Center', href: '/admin/certificates', icon: Award },
    { name: 'Student Feedback', href: '/admin/feedback', icon: MessageSquareWarning },
    { name: 'Reports & Export', href: '/admin/reports', icon: BarChart3 },
    { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <img src="/tnv-logo.png" alt="TNV Logo" className="w-9 h-9 rounded-full object-contain shrink-0 shadow-xs" />
        <div className="min-w-0">
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white truncate">TNV Workshop</h2>
          <span className="text-[10px] font-semibold tracking-wider text-amber-700 dark:text-brand-yellow uppercase">
            Admin Console
          </span>
        </div>
      </div>

      {/* Switch to Student View Banner */}
      <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border-b border-amber-200/70 dark:border-amber-800/60">
        <Link
          to="/student/dashboard"
          className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Eye className="w-4 h-4 text-[#1b6b3a]" />
          <span>Switch to Student View</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors',
                  isActive
                    ? 'bg-brand-yellow-tint text-amber-900 dark:bg-amber-950/50 dark:text-brand-yellow font-bold border-l-4 border-brand-yellow shadow-xs'
                    : 'font-semibold text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Profile Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.full_name || 'System Administrator'}
            </p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
              Super Admin
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
