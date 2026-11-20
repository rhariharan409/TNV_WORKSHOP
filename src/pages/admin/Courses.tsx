import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { Workshop, Course } from '../../types/database';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Edit, Trash2, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminCourses: React.FC = () => {
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('6 Weeks (36 Hours)');
  const [instructorName, setInstructorName] = useState('Dr. T. N. Venkatesh');
  const [instructorTitle, setInstructorTitle] = useState('Chief Architect');
  const [price, setPrice] = useState('4999');
  const [totalSeats, setTotalSeats] = useState('100');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    const [wList, cList] = await Promise.all([
      dataProvider.getWorkshops(),
      dataProvider.getCourses(),
    ]);
    setWorkshops(wList);
    setCourses(cList);
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingWorkshop(null);
    setTitle('');
    setDescription('');
    setDuration('6 Weeks (36 Hours)');
    setInstructorName('Dr. T. N. Venkatesh');
    setInstructorTitle('Chief Architect');
    setPrice('4999');
    setTotalSeats('100');
    setThumbnailUrl('https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800');
    setModalOpen(true);
  };

  const handleOpenEdit = (w: Workshop) => {
    setEditingWorkshop(w);
    setTitle(w.title);
    setDescription(w.description);
    setDuration(w.duration);
    setInstructorName(w.instructor_name);
    setInstructorTitle(w.instructor_title || '');
    setPrice(w.price.toString());
    setTotalSeats(w.total_seats.toString());
    setThumbnailUrl(w.thumbnail_url || '');
    setModalOpen(true);
  };

  const handleSaveWorkshop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWorkshop) {
      await dataProvider.updateWorkshop(editingWorkshop.id, {
        title,
        description,
        duration,
        instructor_name: instructorName,
        instructor_title: instructorTitle,
        price: Number(price) || 0,
        total_seats: Number(totalSeats) || 100,
        thumbnail_url: thumbnailUrl,
      });
    } else {
      await dataProvider.createWorkshop({
        title,
        description,
        duration,
        instructor_name: instructorName,
        instructor_title: instructorTitle,
        price: Number(price) || 0,
        total_seats: Number(totalSeats) || 100,
        thumbnail_url: thumbnailUrl,
      });
    }
    setModalOpen(false);
    await loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this workshop? This action cannot be undone.')) {
      await dataProvider.deleteWorkshop(id);
      await loadData();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Workshops & Course Catalog Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, update, and manage technical workshop cohorts, curriculum specifications, and seat allocations.
          </p>
        </div>

        <Button variant="primary" size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Create New Workshop
        </Button>
      </div>

      {/* Workshops List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workshops.map((w) => {
          const wCourses = courses.filter((c) => c.workshop_id === w.id);
          return (
            <Card key={w.id} className="overflow-hidden flex flex-col justify-between border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                <img src={w.thumbnail_url || ''} alt={w.title} className="h-full w-full object-cover" />
                <div className="absolute top-3 right-3">
                  <Badge variant="brand">{formatCurrency(w.price)}</Badge>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">{w.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2">{w.description}</p>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Duration:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{w.duration}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Instructor:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{w.instructor_name}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Seats:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {w.available_seats} / {w.total_seats} Available
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleOpenEdit(w)}>
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Link to="/admin/modules" className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full">
                        <Layers className="w-3.5 h-3.5 mr-1" /> Modules
                      </Button>
                    </Link>
                    <button
                      onClick={() => handleDelete(w.id)}
                      className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="Delete workshop"
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

      {/* Create / Edit Workshop Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingWorkshop ? 'Edit Workshop' : 'Create New Workshop'}
        description="Configure workshop curriculum and pricing"
        maxWidth="lg"
      >
        <form onSubmit={handleSaveWorkshop} className="space-y-4">
          <Input
            label="Workshop Title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Full-Stack Cloud & AI Engineering"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration *"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
            <Input
              label="Fee (INR) *"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Instructor Name *"
              value={instructorName}
              onChange={(e) => setInstructorName(e.target.value)}
              required
            />
            <Input
              label="Total Seats Capacity *"
              type="number"
              value={totalSeats}
              onChange={(e) => setTotalSeats(e.target.value)}
              required
            />
          </div>

          <Input
            label="Cover Thumbnail Image URL"
            value={thumbnailUrl}
            onChange={(e) => setThumbnailUrl(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              {editingWorkshop ? 'Save Changes' : 'Create Workshop'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
