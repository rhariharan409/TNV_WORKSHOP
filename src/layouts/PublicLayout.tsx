import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicNavbar } from '../components/common/PublicNavbar';
import { Footer } from '../components/common/Footer';
import { RoleSwitcherBanner } from '../components/ui/RoleSwitcherBanner';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <RoleSwitcherBanner />
      <PublicNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
