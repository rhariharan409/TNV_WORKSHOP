import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { StudentSidebar } from '../components/common/StudentSidebar';
import { DashboardHeader } from '../components/common/DashboardHeader';

export const StudentLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <div className="flex flex-1 min-h-screen relative overflow-x-hidden">
        <StudentSidebar mobileOpen={sidebarOpen} onCloseMobile={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 w-full">
          <DashboardHeader onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />
          <main className="flex-1 p-3.5 sm:p-5 lg:p-8 overflow-y-auto w-full max-w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
