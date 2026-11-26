import React from 'react';
import { Outlet } from 'react-router-dom';
import { InstructorSidebar } from '../components/common/InstructorSidebar';
import { DashboardHeader } from '../components/common/DashboardHeader';

export const InstructorLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors">
      <div className="flex flex-1 min-h-screen">
        <InstructorSidebar />
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
