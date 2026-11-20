import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileCheck2,
  FolderGit2,
  GraduationCap,
  Award,
  Video,
  HelpCircle,
  MessageSquareWarning,
  User,
  Bell,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const StudentSidebar: React.FC = () => {
  const { logout, user } = useAuth();

  const links = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'My Courses', href: '/student/my-courses', icon: BookOpen },
    { name: 'Assignments', href: '/student/assignments', icon: FileCheck2 },
    { name: 'Capstone Projects', href: '/student/projects', icon: FolderGit2 },
    { name: 'Examinations', href: '/student/examinations', icon: GraduationCap },
    { name: 'Live Sessions', href: '/student/live-sessions', icon: Video },
    { name: 'Certificates', href: '/student/certificates', icon: Award },
    { name: 'Doubts & Community', href: '/student/doubts', icon: HelpCircle },
    { name: 'Feedback & Issues', href: '/student/feedback', icon: MessageSquareWarning },
    { name: 'My Profile', href: '/student/profile', icon: User },
    { name: 'Notifications', href: '/student/notifications', icon: Bell },
  ];

  return (
    <aside className="w-64 border-r border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm font-bold">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">TNV Workshop</h2>
          <span className="text-[10px] font-semibold tracking-wider text-brand-600 dark:text-brand-400 uppercase">
            Student Portal
          </span>
        </div>
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
                  'flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/80 dark:text-slate-400 dark:hover:bg-slate-800/60'
                )
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Student Profile Card Footer */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="truncate pr-2">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {user?.full_name || 'Enrolled Student'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {user?.college_name || 'Engineering Student'}
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
