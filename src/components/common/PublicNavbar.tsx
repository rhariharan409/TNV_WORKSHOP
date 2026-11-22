import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Menu, X, ArrowRight, User } from 'lucide-react';
import { Button } from '../ui/Button';

export const PublicNavbar: React.FC = () => {
  const { isAuthenticated, role } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Courses', href: '/student/available-courses' },
    { name: 'About TNV', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Bilingual Header */}
        <Link to="/" className="flex items-center gap-3 group select-none">
          <img
            src="/tnv-logo.png"
            alt="Tamil Nadu Volunteers"
            className="h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-full bg-white shadow-sm ring-2 ring-brand-green/20 group-hover:scale-105 transition-transform duration-300 object-contain p-0.5"
          />
          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="font-display text-base sm:text-xl font-extrabold text-brand-green-dark dark:text-white tracking-tight">
                Tamil Nadu Volunteers
              </span>
              <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-yellow-tint text-amber-900 border border-brand-yellow/30 uppercase tracking-wider">
                Academy
              </span>
            </div>
            <span
              lang="ta"
              translate="no"
              className="notranslate block font-display text-xs font-semibold text-brand-green dark:text-emerald-400 mt-0.5"
            >
              தமிழ்நாடு தன்னார்வலர்கள் • Workshop Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-7">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              className={`text-sm font-semibold transition-colors hover:text-brand-green dark:hover:text-emerald-400 relative py-1 ${isActive(link.href)
                  ? 'text-brand-green dark:text-emerald-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-brand-green after:rounded-full'
                  : 'text-slate-600 dark:text-slate-300'
                }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 hover:bg-brand-green-tint/60 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-brand-yellow" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <Link to={role === 'admin' || role === 'super_admin' ? '/admin/dashboard' : '/student/dashboard'}>
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Portal
              </Button>
            </Link>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link to="/login">
                <Button variant="ghost" size="sm" leftIcon={<User className="w-4 h-4" />} className="text-brand-green hover:bg-brand-green-tint font-bold">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm" className="font-bold shadow-md">
                  Register Now
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-brand-yellow" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold py-2 px-3 rounded-xl text-slate-700 hover:bg-brand-green-tint/70 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link
                to={role === 'admin' || role === 'super_admin' ? '/admin/dashboard' : '/student/dashboard'}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Button variant="primary" size="sm" className="w-full">
                  Go to Portal
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    Register Now
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
