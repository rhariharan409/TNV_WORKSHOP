import React from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '../components/common/StudentSidebar';
import { DashboardHeader } from '../components/common/DashboardHeader';
import { RoleSwitcherBanner } from '../components/ui/RoleSwitcherBanner';

export const StudentLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <RoleSwitcherBanner />
      <div className="flex flex-1 min-h-[calc(100vh-33px)]">
        <StudentSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <DashboardHeader />
          <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
