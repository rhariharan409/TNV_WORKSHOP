import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, Module, Session } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  BookOpen,
  Layers,
  Video,
  Clock,
  ChevronDown,
  ChevronRight,
  Shield,
  FileText,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const InstructorCourses: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [curriculum, setCurriculum] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingCurriculum, setLoadingCurriculum] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

  const loadCourses = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const assigned = await dataProvider.getInstructorCourses(user.id);
      setCourses(assigned);
      if (assigned.length > 0 && !selectedCourse) {
        setSelectedCourse(assigned[0]);
        loadCurriculum(assigned[0].id);
      }
    } catch (err) {
      console.error('Error loading instructor courses:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCurriculum = async (courseId: string) => {
    setLoadingCurriculum(true);
    try {
      const mods = await dataProvider.getModules(courseId);
      const modulesWithSessions = await Promise.all(
        mods.map(async (m) => {
          const s = await dataProvider.getSessions(m.id);
          return { ...m, sessions: s };
        })
      );
      setCurriculum({ modules: modulesWithSessions });
      // Auto expand first module
      if (modulesWithSessions[0]) {
        setExpandedModules({ [modulesWithSessions[0].id]: true });
      }
    } catch (err) {
      console.error('Error loading curriculum:', err);
    } finally {
      setLoadingCurriculum(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [user?.id]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            Assigned Courses Scope
          </span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-[#1b6b3a]" />
          <span>My Assigned Courses & Curriculum</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review course syllabus, session breakdown, learning materials, and student progress for courses assigned to you.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          <div className="md:col-span-2 h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            No courses assigned to your account.
          </p>
          <p className="text-slate-400 max-w-md mx-auto">
            Please contact an administrator to assign courses to your faculty profile.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses List Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Assigned Courses ({courses.length})
            </h3>
            {courses.map((course) => {
              const isSelected = selectedCourse?.id === course.id;
              return (
                <Card
                  key={course.id}
                  onClick={() => {
                    setSelectedCourse(course);
                    loadCurriculum(course.id);
                  }}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#1b6b3a] ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : 'hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md uppercase">
                        {course.category || 'Workshop'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {course.duration || '40h'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                      {course.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {course.description || 'No description provided.'}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Curriculum View */}
          <div className="lg:col-span-2 space-y-4">
            {selectedCourse && (
              <Card className="p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">
                      {selectedCourse.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedCourse.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link to={`/instructor/examinations?courseId=${selectedCourse.id}`}>
                      <Button variant="outline" size="sm" leftIcon={<GraduationCap className="w-3.5 h-3.5" />}>
                        Exams
                      </Button>
                    </Link>
                    <Link to={`/instructor/materials?courseId=${selectedCourse.id}`}>
                      <Button variant="outline" size="sm" leftIcon={<FileText className="w-3.5 h-3.5" />}>
                        Materials
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Modules & Sessions Accordion */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Course Curriculum & Modules
                  </h3>

                  {loadingCurriculum ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((n) => (
                        <div key={n} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                      ))}
                    </div>
                  ) : !curriculum?.modules || curriculum.modules.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      No modules added to this course curriculum yet.
                    </div>
                  ) : (
                    curriculum.modules.map((module: any, idx: number) => {
                      const isExpanded = expandedModules[module.id];
                      return (
                        <div
                          key={module.id}
                          className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden"
                        >
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-left hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 text-[#1b6b3a] font-black text-xs flex items-center justify-center shadow-xs">
                                {idx + 1}
                              </span>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                                  {module.title}
                                </h4>
                                <span className="text-[10px] text-slate-400">
                                  {module.sessions?.length || 0} Sessions
                                </span>
                              </div>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="p-3 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                              {(!module.sessions || module.sessions.length === 0) ? (
                                <p className="text-xs text-slate-400 p-2 italic">No sessions in this module.</p>
                              ) : (
                                module.sessions.map((sess: any, sIdx: number) => (
                                  <div
                                    key={sess.id}
                                    className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <Video className="w-4 h-4 text-slate-400" />
                                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                                        Session {sIdx + 1}: {sess.title}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      {sess.duration_minutes || 60} mins
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
