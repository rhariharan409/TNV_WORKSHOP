import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Twitter, Instagram, MessageCircle, ShieldCheck, ExternalLink, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 font-bold text-slate-900 dark:text-white">
              <img
                src="/tnv-logo.png"
                alt="Tamil Nadu Volunteers"
                className="h-12 w-12 rounded-full bg-white shadow-sm ring-1 ring-brand-green/20 object-contain p-0.5"
              />
              <div>
                <span className="font-display font-extrabold text-base text-brand-green-dark dark:text-white block leading-tight">
                  Tamil Nadu Volunteers
                </span>
                <span className="font-display text-xs text-brand-green dark:text-emerald-400 font-semibold block">
                  Workshop Academy
                </span>
              </div>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              An educational initiative of <strong>Tamilnadu Volunteers Trust</strong>. Bridging university curricula with hands-on production engineering, verifiable certifications, and student empowerment across all 38 districts of Tamil Nadu.
            </p>
            <div className="flex items-center gap-3 pt-2 text-slate-400">
              <a
                href="https://x.com/TNVolunteersIND/"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-100 hover:bg-brand-green-tint hover:text-brand-green dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                title="X / Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://www.instagram.com/TamilNaduVolunteers/"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-100 hover:bg-brand-green-tint hover:text-brand-green dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://chat.whatsapp.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-600 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                title="WhatsApp Community"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Academic Programs
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/student/available-courses" className="hover:text-brand-green dark:hover:text-emerald-400 transition-colors">
                  Technical Courses Catalog
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-brand-green dark:hover:text-emerald-400 transition-colors">
                  7-Step Learning Engine
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-brand-green dark:hover:text-emerald-400 transition-colors">
                  Student Cohort Enrollment
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-brand-green dark:hover:text-emerald-400 transition-colors">
                  College Partnerships & MoUs
                </Link>
              </li>
            </ul>
          </div>

          {/* Verification & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Credentials & Verification
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/verify-certificate/TNV-2024-A8F29C14" className="hover:text-brand-green dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-semibold text-brand-green dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" /> Public Certificate Verification
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-green dark:hover:text-emerald-400 transition-colors">
                  Student LMS Portal
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-green dark:hover:text-emerald-400 transition-colors">
                  Administrator Console
                </Link>
              </li>
              <li>
                <a href="https://tnv-hub-client.vercel.app/" target="_blank" rel="noreferrer" className="hover:text-brand-green dark:hover:text-emerald-400 transition-colors flex items-center gap-1">
                  <span>TNV Volunteer Hub Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Trust Details & Contact */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Trust & Contact
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-green shrink-0 mt-0.5" />
                <span>CIT Nagar, Chennai, Tamil Nadu, India</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-green shrink-0" />
                <span>Helpline: +91 90872 93339</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-green shrink-0" />
                <span>contact@tamilnaduvolunteers.org</span>
              </li>
              <li className="pt-2 text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <span>Tamilnadu Volunteers Trust • 80G Certified</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 mt-10 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <p>© {new Date().getFullYear()} Tamilnadu Volunteers Trust. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Chennai, Tamil Nadu</span>
            <span>•</span>
            <span className="font-semibold text-brand-green dark:text-emerald-400">TNV Workshop Platform v2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
