import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import {
  Plus,
  BookOpen,
  Edit,
  Trash2,
  CheckCircle2,
  Globe,
  Lock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export const AdminCourses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [publishedExamCourseIds, setPublishedExamCourseIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'published'>(
    searchParams.get('tab') === 'published' ? 'published' : 'main'
  );
  const [notification, setNotification] = useState<string | null>(null);

  const switchTab = (tab: 'main' | 'published') => {
    setActiveTab(tab);
    setSearchParams(tab === 'published' ? { tab: 'published' } : {});
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    // Super admins see all courses regardless of created_by
    const isSuperAdmin =
      user.role === 'super_admin' ||
      user.email?.toLowerCase() === 'masteradmin@gmail.com' ||
      user.email?.toLowerCase() === 'materadmin@gmail.com';
    const adminId = isSuperAdmin ? undefined : user.id;
    const [cList, eList] = await Promise.all([
      dataProvider.getCourses({ adminId, isSuperAdmin }),
      dataProvider.getExaminations(undefined, adminId, true),
    ]);
    setCourses(cList);
    const pubCourseIds = new Set(eList.filter((e) => e.is_published).map((e) => e.course_id));
    setPublishedExamCourseIds(pubCourseIds);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleTogglePublish = async (course: Course) => {
    if (!user) return;
    setActionLoading(course.id);
    const isCurrentlyPublished =
      Boolean(course.is_published) || String(course.status || '').trim().toLowerCase() === 'published';

    try {
      if (isCurrentlyPublished) {
        await dataProvider.unpublishCourse(course.id);
        showNotification(`"${course.title}" unpublished and moved back to Main Course Section.`);
        switchTab('main');
      } else {
        await dataProvider.publishCourse(course.id, user.id);
        showNotification(`"${course.title}" published! Placed into Published Courses section.`);
        switchTab('published');
      }
      await loadData();
    } catch (err: any) {
      alert(`Error updating publication status: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCourse = async (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete "${title}"? All associated modules and sessions will be removed permanently.`)) {
      setActionLoading(id);
      try {
        await dataProvider.deleteCourse(id);
        showNotification(`"${title}" deleted successfully.`);
        await loadData();
      } catch (err: any) {
        alert(`Error deleting course: ${err.message}`);
      } finally {
        setActionLoading(null);
      }
    }
  };

  const mainDraftCourses = courses.filter((c) => {
    const status = String(c.status || '').trim().toLowerCase();
    return c.is_published === false || status === 'draft';
  });
  const publishedCourses = courses.filter((c) => Boolean(c.is_published));
  const currentList = activeTab === 'main' ? mainDraftCourses : publishedCourses;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Course Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying courses managed by {user?.full_name || 'Admin'}. Draft courses remain in Main section; published courses move to Published Courses.
          </p>
        </div>

        <Link to="/admin/courses/create">
          <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Create New Course
          </Button>
        </Link>
      </div>

      {/* Floating Action / Feedback Notification */}
      {notification && (
        <div className="p-3.5 rounded-xl bg-brand-green-tint border border-brand-200 text-brand-green-dark dark:bg-brand-950/80 dark:border-brand-800 dark:text-brand-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Course Section Switching Buttons */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => switchTab('main')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'main'
              ? 'bg-brand-green text-white shadow-sm ring-2 ring-brand-green/20'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Main Course Section</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'main'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {mainDraftCourses.length}
          </span>
        </button>

        <button
          onClick={() => switchTab('published')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'published'
              ? 'bg-brand-green text-white shadow-sm ring-2 ring-brand-green/20'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Published Courses</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'published'
                ? 'bg-brand-yellow text-slate-900'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {publishedCourses.length}
          </span>
        </button>
      </div>

      {/* Courses Grid View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse"></div>
          ))}
        </div>
      ) : currentList.length === 0 ? (
        <Card className="p-12 text-center space-y-4 border-slate-200 dark:border-slate-800">
          {activeTab === 'main' ? (
            <>
              <div className="w-12 h-12 rounded-2xl bg-brand-green-tint text-brand-green mx-auto flex items-center justify-center font-bold">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No Draft Courses in Main Section
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {publishedCourses.length > 0
                  ? `You have ${publishedCourses.length} published course(s) live in the "Published Courses" section. Click below to create a new draft course.`
                  : 'You have not created any courses yet. Click below to start building your own custom course.'}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <Link to="/admin/courses/create">
                  <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                    Create Course Now
                  </Button>
                </Link>
                {publishedCourses.length > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setActiveTab('published')} leftIcon={<Globe className="w-4 h-4" />}>
                    View Published Courses ({publishedCourses.length})
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-2xl bg-brand-yellow-tint text-amber-800 mx-auto flex items-center justify-center font-bold">
                <Globe className="w-6 h-6 text-brand-yellow" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No Published Courses Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Once you publish a course from the Main Course section, it will automatically move here and become visible to students in the student portal.
              </p>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={() => setActiveTab('main')} leftIcon={<BookOpen className="w-4 h-4" />}>
                  Go to Main Course Section
                </Button>
              </div>
            </>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentList.map((course) => {
            const isPublished = Boolean(course.is_published);
            const isProcessing = actionLoading === course.id;

            return (
              <Card
                key={course.id}
                className="overflow-hidden flex flex-col justify-between border-slate-200 dark:border-slate-800 shadow-sm hover:border-brand-green/40 transition-all"
              >
                <div>
                  <div className="relative h-48 w-full bg-slate-50 dark:bg-slate-900 overflow-hidden flex items-center justify-center p-3 border-b border-slate-100 dark:border-slate-800">
                    <img
                      src={
                        course.thumbnail_url ||
                        '/tnv-logo.png'
                      }
                      alt={course.title}
                      className="w-full h-full object-contain max-h-40 transition-transform duration-300 hover:scale-105"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <Badge variant={course.is_paid ? 'warning' : 'outline'} className="font-bold shadow-xs bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs">
                        {course.is_paid ? `PAID • ₹${course.price || 0}` : 'FREE'}
                      </Badge>
                      <Badge variant={isPublished ? 'success' : 'warning'} className="font-bold shadow-xs">
                        {isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </Badge>
                    </div>
                    {course.category && (
                      <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm px-2.5 py-1 rounded-lg text-white font-bold text-[11px]">
                        {course.category}
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {course.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Curriculum:</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {course.modules_count || 0} Modules • {course.sessions_count || 0} Sessions
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Enrolled Students:</span>
                      <span className="font-bold text-brand-green dark:text-emerald-400">
                        {course.enrolled_count || 0} Active Students
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Created On:</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatDate(course.created_at)}
                      </span>
                    </div>

                    {!publishedExamCourseIds.has(course.id) && (
                      <div className="mt-2.5 p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>No exam: students cannot earn a certificate.</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/courses/create?id=${course.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit Course & Curriculum
                        </Button>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant={isPublished ? 'outline' : 'primary'}
                        size="sm"
                        className="flex-1 font-bold"
                        disabled={isProcessing}
                        onClick={() => handleTogglePublish(course)}
                        leftIcon={isPublished ? <Lock className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                      >
                        {isPublished ? 'Unpublish Course' : 'Publish Course'}
                      </Button>

                      <button
                        onClick={() => handleDeleteCourse(course.id, course.title)}
                        disabled={isProcessing}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-200 dark:border-rose-900"
                        title="Delete course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
