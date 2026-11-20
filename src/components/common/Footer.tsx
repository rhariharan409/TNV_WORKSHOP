import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Mail, Phone, MapPin, Github, Linkedin, Twitter, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </div>
              <span>TNV WORKSHOP</span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              Outcome-oriented engineering workshops bridging academia and production software systems.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://chat.whatsapp.com" target="_blank" rel="noreferrer" className="hover:text-emerald-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/workshops" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  All Workshops
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Learning Model
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Student Enrollment
                </Link>
              </li>
              <li>
                <Link to="/verify-certificate/TNV-2024-A8F29C14" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Certificate Verification
                </Link>
              </li>
            </ul>
          </div>

          {/* Support & Community */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Support & Community
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Help Desk & Contact
                </Link>
              </li>
              <li>
                <a href="https://chat.whatsapp.com/TNVWorkshop2024DevCommunity" target="_blank" rel="noreferrer" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-500" /> WhatsApp Community
                </a>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Student Portal Login
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  Administrator Access
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Academic Helpline
            </h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-600 shrink-0" />
                <span>support@tnvworkshop.edu.in</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-600 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <span>TNV Workshop Center, Guindy Industrial Estate, Chennai, Tamil Nadu 600032</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} TNV Workshop LMS. All rights reserved. Designed for future TNV Hub ecosystem.</p>
          <div className="flex gap-4">
            <Link to="/about" className="hover:underline">Privacy Policy</Link>
            <Link to="/about" className="hover:underline">Terms of Service</Link>
            <Link to="/contact" className="hover:underline">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
