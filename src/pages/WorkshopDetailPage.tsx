import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { dataProvider } from '../lib/dataProvider';
import { Workshop, Course, Module, Session } from '../types/database';
import { formatCurrency } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import {
  Clock,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Award,
  Video,
  FileCode,
} from 'lucide-react';

export const WorkshopDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState<Workshop | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      dataProvider.getWorkshopBySlug(id).then(async (w) => {
        if (!w) {
          navigate('/workshops');
          return;
        }
        setWorkshop(w);
        const courseList = await dataProvider.getCourses(w.id);
        setCourses(courseList);

        if (courseList.length > 0) {
          const modList = await dataProvider.getModules(courseList[0].id);
          setModules(modList);
          if (modList.length > 0) {
            setExpandedModule(modList[0].id);
          }
        }
        setIsLoading(false);
      });
    }
  }, [id, navigate]);

  if (isLoading || !workshop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loading Workshop Details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-12 lg:py-16 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="brand" className="bg-brand-600 text-white border-none font-bold">
                  Certified Workshop
                </Badge>
                <span className="text-xs text-slate-400">TNV Academic Engineering</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
                {workshop.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 max-w-3xl leading-relaxed">
                {workshop.description}
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-3 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="w-4 h-4 text-brand-400" />
                  <span>{workshop.duration}</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>{workshop.available_seats} seats remaining (of {workshop.total_seats})</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <span>Starts {workshop.start_date || 'Upcoming'}</span>
                </div>
              </div>
            </div>

            {/* Sticky Action Card */}
            <div className="lg:col-span-4">
              <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5 text-slate-900 dark:text-white">
                <div className="flex items-baseline justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Registration Fee</span>
                  <div className="text-2xl font-extrabold text-brand-600 dark:text-brand-400">
                    {formatCurrency(workshop.price)}
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Access to all hierarchical modules & videos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Graded assignments & capstone review</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Live Google Meet masterclasses & attendance</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Official verified PDF Certificate upon completion</span>
                  </div>
                </div>

                <Link to={`/register?workshop=${workshop.id}`} className="block">
                  <Button variant="primary" size="lg" className="w-full font-bold" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Register for this Workshop
                  </Button>
                </Link>

                <p className="text-[10px] text-center text-slate-400">
                  Manual UPI & verification accepted • Instant receipt generation
                </p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-8">
          {/* Syllabus Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-600" />
              <span>Hierarchical Course Syllabus (NPTEL Structure)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Structured step-by-step progression through theoretical foundations, implementation lectures, and live lab assessments.
            </p>

            <div className="space-y-3 pt-2">
              {modules.map((m, idx) => {
                const isExpanded = expandedModule === m.id;
                return (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all"
                  >
                    <button
                      onClick={() => setExpandedModule(isExpanded ? null : m.id)}
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{m.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{m.description}</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-1.5">
                          <Video className="w-3.5 h-3.5 text-brand-600" />
                          <span>Includes HD video lectures (Google Drive hosted)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-1.5">
                          <FileCode className="w-3.5 h-3.5 text-purple-600" />
                          <span>Downloadable architecture notes, slides, and cheat sheets</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 py-1.5">
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>Session completion tracking recorded to your database profile</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Instructor Profile Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Instructor Profile
            </h3>
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0">
                <img
                  src={workshop.instructor_avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                  alt={workshop.instructor_name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">{workshop.instructor_name}</h4>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">{workshop.instructor_title}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {workshop.instructor_bio || 'Senior software architect with extensive hands-on enterprise cloud engineering leadership.'}
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};
