import React, { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  FileText,
  FileCheck2,
  GraduationCap,
  Video,
  FolderGit2,
  Users,
  ArrowLeft,
  BookOpen,
  Clock,
  Layers,
} from 'lucide-react';

import { InstructorAssignments } from './Assignments';
import { InstructorSubmissions } from './Submissions';
import { InstructorExaminations } from './Examinations';
import { InstructorLiveSessions } from './LiveSessions';
import { InstructorMaterials } from './Materials';
import { InstructorStudents } from './Students';

type TabKey = 'assignments' | 'submissions' | 'exams' | 'sessions' | 'materials' | 'students';

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
}

const TABS: TabItem[] = [
  { key: 'assignments', label: 'Assignments', icon: FileText },
  { key: 'submissions', label: 'Submissions & Grading', icon: FileCheck2 },
  { key: 'exams', label: 'Exams', icon: GraduationCap },
  { key: 'sessions', label: 'Sessions', icon: Video },
  { key: 'materials', label: 'Materials', icon: FolderGit2 },
  { key: 'students', label: 'Students', icon: Users },
];

export const InstructorCourseDetail: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialTab = (searchParams.get('tab') as TabKey) || 'assignments';
  const [activeTab, setActiveTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab) ? initialTab : 'assignments'
  );

  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCourse = async () => {
      if (!courseId) return;
      setIsLoading(true);
      try {
        const found = await dataProvider.getCourseById(courseId);
        setCourse(found);
      } catch (err) {
        console.error('Failed to load course details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadCourse();
  }, [courseId]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  };

  if (!courseId) {
    return (
      <div className="p-8 text-center text-slate-500">
        <p>No course ID provided.</p>
        <Link to="/instructor/dashboard">
          <Button variant="outline" size="sm" className="mt-4">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Navigation & Course Overview Header */}
      <div className="rounded-3xl border border-slate-200/90 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/instructor/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-[#1b6b3a] transition-colors w-fit"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full ${
                course?.is_published
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {course?.is_published ? 'Published Course' : 'Draft'}
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {course?.category || 'Technical Workshop'}
            </span>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {course?.title || (isLoading ? 'Loading Course...' : 'Course Management')}
          </h1>
          {course?.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl line-clamp-2">
              {course.description}
            </p>
          )}
        </div>

        {/* Tab Navigation Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-2 min-w-max">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => handleTabChange(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all ${
                    isActive
                      ? 'bg-[#1b6b3a] text-white shadow-sm ring-2 ring-[#1b6b3a]/30'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="space-y-6">
        {activeTab === 'assignments' && (
          <InstructorAssignments courseId={courseId} />
        )}

        {activeTab === 'submissions' && (
          <InstructorSubmissions courseId={courseId} />
        )}

        {activeTab === 'exams' && (
          <InstructorExaminations courseId={courseId} />
        )}

        {activeTab === 'sessions' && (
          <InstructorLiveSessions courseId={courseId} />
        )}

        {activeTab === 'materials' && (
          <InstructorMaterials courseId={courseId} />
        )}

        {activeTab === 'students' && (
          <InstructorStudents courseId={courseId} />
        )}
      </div>
    </div>
  );
};
