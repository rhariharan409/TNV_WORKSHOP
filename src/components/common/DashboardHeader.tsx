import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dataProvider } from '../../lib/dataProvider';
import {
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
  Search,
  ShieldCheck,
  Plus,
  Video,
  BookOpen,
  FileCheck2,
  Eye,
  LayoutDashboard,
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface DashboardHeaderProps {
  onToggleSidebar?: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = () => {
  const { user, role, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = () => {
      if (user?.id) {
        dataProvider.getNotifications(user.id).then((notifs) => {
          setUnreadCount(notifs.filter((n) => !n.is_read).length);
        });
      }
    };
    fetchUnread();
    window.addEventListener('notifications-updated', fetchUnread);
    return () => {
      window.removeEventListener('notifications-updated', fetchUnread);
    };
  }, [user?.id]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isUserAdmin =
    role === 'admin' ||
    role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.role === 'super_admin' ||
    user?.email?.toLowerCase() === 'masteradmin@gmail.com' ||
    user?.email?.toLowerCase() === 'materadmin@gmail.com';

  const isInAdminPortal = location.pathname.startsWith('/admin');

  const rawName = user?.full_name || (isUserAdmin ? 'masteradmin' : 'Student');
  const displayName = rawName.replace(/materadmin/gi, 'masteradmin');
  const displayEmail = (user?.email || '').replace(/materadmin/gi, 'masteradmin');

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Search Input */}
      <div className="flex-1 max-w-md hidden sm:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={
              isInAdminPortal
                ? 'Search students, courses, submissions...'
                : 'Search my modules, sessions, notes...'
            }
            className="w-full h-9 pl-9 pr-4 rounded-full bg-slate-100/70 border-none text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1b6b3a] dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Prominent Admin Switcher Pill */}
        {isUserAdmin && (
          <div className="flex items-center gap-2">
            {!isInAdminPortal ? (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1b6b3a] hover:bg-[#14532d] text-white text-xs font-bold shadow-md transition-all active:scale-95 animate-pulse hover:animate-none"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-200" />
                <span>Switch to Admin Console</span>
              </Link>
            ) : (
              <Link
                to="/student/dashboard"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-emerald-600" />
                <span>Student View</span>
              </Link>
            )}
          </div>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Toggle color mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <Link
          to={isInAdminPortal ? '/admin/notifications' : '/student/notifications'}
          className="relative p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* Profile Avatar / Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1b6b3a] text-white font-bold text-xs shadow-sm">
              {displayName.charAt(0).toUpperCase() || (isUserAdmin ? 'M' : 'S')}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {displayName}
              </p>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-extrabold">
                {isUserAdmin ? 'Super Admin' : 'Student'}
              </p>
            </div>
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl dark:border-slate-800 dark:bg-slate-900 z-50">
              <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 rounded-xl mb-1">
                <p className="text-xs font-black text-slate-900 dark:text-white">{displayName}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-[#1b6b3a] dark:text-emerald-400 uppercase">
                  {isUserAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                  <span>{isUserAdmin ? 'Super Admin Console' : 'Student Portal'}</span>
                </div>
              </div>

              <div className="py-1 space-y-1">
                {isUserAdmin ? (
                  <>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-[#1b6b3a] hover:bg-[#14532d] rounded-xl shadow-sm transition-all"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-emerald-200" />
                      <span>Admin Dashboard</span>
                    </Link>

                    <Link
                      to="/admin/courses"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-800 font-semibold"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Courses & Modules</span>
                    </Link>

                    <Link
                      to="/admin/live-sessions"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-800 font-semibold"
                    >
                      <Video className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Schedule Live Masterclass</span>
                    </Link>

                    <Link
                      to="/admin/submissions"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-800 font-semibold"
                    >
                      <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Submissions & Grading</span>
                    </Link>

                    <div className="border-t border-slate-100 dark:border-slate-800 my-1 pt-1">
                      <Link
                        to="/student/dashboard"
                        onClick={() => setProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg dark:text-slate-400 dark:hover:bg-slate-800 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Student Perspective</span>
                      </Link>
                    </div>
                  </>
                ) : (
                  <Link
                    to="/student/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-lg dark:text-slate-200 dark:hover:bg-slate-800 font-semibold"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>My Profile</span>
                  </Link>
                )}
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg dark:text-rose-400 dark:hover:bg-rose-950/40 font-bold"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
