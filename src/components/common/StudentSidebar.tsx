import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  BookOpen,
  FileCheck2,
  GraduationCap,
  Award,
  Video,
  HelpCircle,
  MessageSquareWarning,
  User,
  Bell,
  LogOut,
  ShieldCheck,
  ArrowRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export interface StudentSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ mobileOpen = false, onCloseMobile }) => {
  const { logout, user } = useAuth();

  const isUserAdmin =
    user?.role === 'super_admin' ||
    user?.role === 'admin' ||
    user?.email?.toLowerCase() === 'masteradmin@gmail.com' ||
    user?.email?.toLowerCase() === 'materadmin@gmail.com';

  const links = [
    { name: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Available Courses', href: '/student/available-courses', icon: Compass },
    { name: 'My Courses', href: '/student/my-courses', icon: BookOpen },
    { name: 'Assignments', href: '/student/assignments', icon: FileCheck2 },
    { name: 'Examinations', href: '/student/examinations', icon: GraduationCap },
    { name: 'Live Sessions', href: '/student/live-sessions', icon: Video },
    { name: 'Certificates', href: '/student/certificates', icon: Award },
    { name: 'Doubts & Community', href: '/student/doubts', icon: HelpCircle },
    { name: 'Feedback & Issues', href: '/student/feedback', icon: MessageSquareWarning },
    { name: 'My Profile', href: '/student/profile', icon: User },
    { name: 'Notifications', href: '/student/notifications', icon: Bell },
  ];

  const rawName = user?.full_name || (isUserAdmin ? 'masteradmin' : 'Enrolled Student');
  const displayName = rawName.replace(/materadmin/gi, 'masteradmin');

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'border-r border-[#09351a] bg-[#0d4825] text-white flex flex-col shadow-xl transition-transform duration-300 ease-in-out',
          // Desktop: static sidebar in flow
          'hidden md:flex md:w-64 md:shrink-0 md:min-h-screen md:translate-x-0 md:static',
          // Mobile: fixed off-canvas drawer
          'fixed inset-y-0 left-0 z-50 w-72 h-full max-w-[85vw]',
          mobileOpen ? 'flex translate-x-0' : 'hidden md:flex -translate-x-full md:translate-x-0'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-[#0a3a1d]">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/tnv-logo.png"
              alt="TNV Logo"
              className="w-9 h-9 rounded-full object-contain shrink-0 shadow-xs ring-2 ring-white/20 bg-white"
            />
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold tracking-tight text-white truncate">TNV Workshop</h2>
              <span className="text-[10px] font-black tracking-wider text-[#f5c518] uppercase">
                Student Portal
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Quick Switcher Banner (Visible whenever admin is in student view) */}
        {isUserAdmin && (
          <div className="p-3 bg-[#0a3a1d] border-b border-[#082e17]">
            <Link
              to="/admin/dashboard"
              onClick={onCloseMobile}
              className="w-full py-2.5 px-3 rounded-xl bg-[#0e4624] hover:bg-[#12532a] text-white border border-emerald-700/60 text-xs font-bold shadow-md transition-all flex items-center justify-between active:scale-95 group"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#f5c518]" />
                <span>Open Admin Console</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}

        {/* Navigation Section Header */}
        <div className="px-3 pt-3 pb-1">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300/70">
            Main Navigation
          </span>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  cn(
                    'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all group active:scale-98',
                    isActive
                      ? 'bg-[#09351a] text-white font-bold border-l-4 border-[#f5c518] shadow-sm'
                      : 'font-semibold text-emerald-100/80 hover:bg-white/10 hover:text-white'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 truncate">
                      <Icon
                        className={cn(
                          'w-4 h-4 shrink-0 transition-transform group-hover:scale-110',
                          isActive ? 'text-[#f5c518]' : 'text-emerald-200/75 group-hover:text-white'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-[#f5c518] shadow-xs shrink-0 ml-2" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-[#09351a] bg-[#0a3a1d]">
          <div className="p-2.5 rounded-xl bg-[#082e17] border border-emerald-800/60 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-[#1b6b3a] border border-emerald-400 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                {(displayName.charAt(0) || 'S').toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-xs font-bold text-white truncate">{displayName}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f5c518]" />
                  <span className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider truncate">
                    {isUserAdmin ? 'Super Admin' : 'Enrolled Student'}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
