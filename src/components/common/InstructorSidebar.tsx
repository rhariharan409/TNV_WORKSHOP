import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FolderGit2,
  FileText,
  FileCheck2,
  GraduationCap,
  UserCheck,
  Users,
  Video,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

export const InstructorSidebar: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const links = [
    { name: 'Dashboard & Overview', href: '/instructor/dashboard', icon: LayoutDashboard },
    { name: 'Assigned Courses', href: '/instructor/courses', icon: BookOpen },
    { name: 'Student Management', href: '/instructor/students', icon: Users },
    { name: 'Assignment Manager', href: '/instructor/assignments', icon: FileText },
    { name: 'Submissions & Grading', href: '/instructor/submissions', icon: FileCheck2 },
    { name: 'Examination Center', href: '/instructor/examinations', icon: GraduationCap },
    { name: 'Live Sessions', href: '/instructor/live-sessions', icon: Video },
    { name: 'Attendance Records', href: '/instructor/attendance', icon: UserCheck },
    { name: 'Learning Materials', href: '/instructor/materials', icon: FolderGit2 },
  ];

  const rawName = user?.full_name || 'Instructor';
  const displayName = rawName.replace(/materadmin/gi, 'masteradmin');

  return (
    <aside className="w-64 border-r border-[#09351a] bg-[#0d4825] text-white flex flex-col shrink-0 min-h-screen shadow-lg">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-[#0a3a1d]">
        <img
          src="/tnv-logo.png"
          alt="TNV Logo"
          className="w-9 h-9 rounded-full object-contain shrink-0 shadow-xs ring-2 ring-white/20 bg-white"
        />
        <div className="min-w-0">
          <h2 className="text-sm font-extrabold tracking-tight text-white truncate">TNV Workshop</h2>
          <span className="text-[10px] font-black tracking-wider text-[#f5c518] uppercase">
            Instructor Console
          </span>
        </div>
      </div>

      {/* Navigation Section Title */}
      <div className="px-3 pt-3 pb-1">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300/70">
          Main Navigation
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
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

      {/* User Footer & Logout */}
      <div className="p-3 border-t border-[#09351a] bg-[#0a3a1d]">
        <div className="p-2.5 rounded-xl bg-[#082e17] border border-emerald-800/60 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-[#f5c518] text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-sm ring-2 ring-[#f5c518]/30">
              {(displayName.charAt(0) || 'I').toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f5c518]" />
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider truncate">
                  Faculty Member
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
