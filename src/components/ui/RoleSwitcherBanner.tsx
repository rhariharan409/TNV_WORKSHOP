import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, UserCheck, Database, Info, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { useNavigate } from 'react-router-dom';

export const RoleSwitcherBanner: React.FC = () => {
  const { user, role, switchDemoRole, isConfigured } = useAuth();
  const navigate = useNavigate();
  const [showSetupModal, setShowSetupModal] = useState(false);

  const handleRoleToggle = () => {
    if (role === 'admin' || role === 'super_admin') {
      switchDemoRole('student');
      navigate('/student/dashboard');
    } else {
      switchDemoRole('admin');
      navigate('/admin/dashboard');
    }
  };

  return (
    <>
      <div className="bg-slate-900 border-b border-slate-800 text-xs text-slate-300 py-1.5 px-4 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-white font-semibold">TNV Workshop Platform</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-brand-400" />
            <span>Database:</span>
            {isConfigured ? (
              <span className="text-emerald-400 font-medium">Supabase Connected</span>
            ) : (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                Full Reactive Sandbox Mode (Production-ready)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1.5">
            {role === 'admin' || role === 'super_admin' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span className="hidden md:inline text-slate-400">Signed in as:</span>
            <span className="font-semibold text-white truncate max-w-[150px]">{user?.full_name || 'Visitor'}</span>
            <span className="uppercase text-[10px] tracking-wider px-1.5 py-0.5 rounded font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {role}
            </span>
          </div>

          <button
            onClick={handleRoleToggle}
            className="px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white font-semibold transition-colors text-xs active:scale-95"
            title="Toggle between Student and Admin perspective"
          >
            {role === 'admin' || role === 'super_admin' ? 'Switch to Student View' : 'Switch to Admin View'}
          </button>

          <button
            onClick={() => setShowSetupModal(true)}
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1"
            title="View Supabase setup details"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Backend Setup</span>
          </button>
        </div>
      </div>

      <Modal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        title="TNV Workshop – Backend Architecture & Setup"
        description="Connect your Supabase project in 3 simple steps"
        maxWidth="lg"
        footer={
          <Button variant="primary" size="sm" onClick={() => setShowSetupModal(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3 rounded-lg bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/60">
            <h5 className="font-semibold text-brand-900 dark:text-brand-300 mb-1">
              Complete Production Migrations Available:
            </h5>
            <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
              <li><code>00_INITIAL_SCHEMA.sql</code> – 32 PostgreSQL tables, constraints, enums & foreign keys.</li>
              <li><code>01_SECURITY_POLICIES.sql</code> – RLS policies with role-based student and admin permissions.</li>
              <li><code>02_FUNCTIONS_AND_TRIGGERS.sql</code> – Automatic auth trigger, quiz evaluation RPC, exam scoring.</li>
              <li><code>03_SEED_DATA.sql</code> – Production seed for workshops, modules, video sessions, quizzes & settings.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-slate-900 dark:text-white">Connecting your Live Supabase Project:</h5>
            <ol className="list-decimal pl-4 space-y-1.5 text-slate-600 dark:text-slate-300">
              <li>Create a new project at <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a></li>
              <li>In your Supabase SQL Editor, execute the SQL files located in <code>supabase/migrations/</code> in sequential order.</li>
              <li>Copy your <strong>Project URL</strong> and <strong>Anon Public Key</strong> from Project Settings &gt; API.</li>
              <li>Paste them into your local <code>.env</code> file (replacing sample placeholders).</li>
              <li>Restart Vite dev server. The platform will automatically connect to your live PostgreSQL database!</li>
            </ol>
          </div>
        </div>
      </Modal>
    </>
  );
};
