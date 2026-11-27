import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Course, LearningMaterial } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import {
  FolderGit2,
  Plus,
  Trash2,
  ExternalLink,
  FileText,
  FileCode,
  Layers,
  BookOpen,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface InstructorMaterialsProps {
  courseId?: string;
}

export const InstructorMaterials: React.FC<InstructorMaterialsProps> = ({ courseId: propCourseId }) => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(propCourseId || '');
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<any>('pdf');
  const [url, setUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const assigned = await dataProvider.getInstructorCourses(user.id);
      const filtered = propCourseId ? assigned.filter((c) => c.id === propCourseId) : assigned;
      setCourses(filtered);

      const paramCourseId = propCourseId || searchParams.get('courseId');
      const initialCourseId =
        paramCourseId && filtered.some((c) => c.id === paramCourseId)
          ? paramCourseId
          : filtered[0]?.id || '';

      setSelectedCourseId(initialCourseId);

      if (initialCourseId) {
        const mats = await dataProvider.getLearningMaterials(initialCourseId);
        setMaterials(mats);
      }
    } catch (err) {
      console.error('Error loading materials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, propCourseId]);

  const handleCourseChange = async (courseId: string) => {
    setSelectedCourseId(courseId);
    if (!courseId) {
      setMaterials([]);
      return;
    }
    setIsLoading(true);
    try {
      const mats = await dataProvider.getLearningMaterials(courseId);
      setMaterials(mats);
    } catch (err) {
      console.error('Error fetching materials for course:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMaterial = async () => {
    if (!title.trim() || !url.trim() || !selectedCourseId) return;
    setIsSaving(true);
    try {
      await dataProvider.saveLearningMaterial({
        course_id: selectedCourseId,
        title: title.trim(),
        file_type: type,
        file_url: url.trim(),
        external_link: url.trim(),
        is_downloadable: true,
      });
      setIsModalOpen(false);
      setTitle('');
      setUrl('');
      const mats = await dataProvider.getLearningMaterials(selectedCourseId);
      setMaterials(mats);
    } catch (err: any) {
      alert(err.message || 'Failed to save learning material.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, matTitle: string) => {
    if (!confirm(`Delete learning material "${matTitle}"?`)) return;
    try {
      await dataProvider.deleteLearningMaterial(id);
      setMaterials(materials.filter((m) => m.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete material.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            Course Resources
          </span>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 mt-1">
            <FolderGit2 className="w-7 h-7 text-[#1b6b3a]" />
            <span>Learning Materials & Notes</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload PDFs, slides, cheat sheets, code links, and lecture notes for your assigned courses.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          disabled={!selectedCourseId}
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Learning Material
        </Button>
      </div>

      {/* Course Selector Filter */}
      {!propCourseId && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
            Filter by Course:
          </label>
          <Select
            value={selectedCourseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="max-w-xs text-xs"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </Select>
        </div>
      )}

      {/* Materials List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500">
          No courses assigned yet. Contact administrator to assign courses.
        </Card>
      ) : materials.length === 0 ? (
        <Card className="p-12 text-center text-xs text-slate-500 space-y-3">
          <FolderGit2 className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="font-semibold text-sm text-slate-700 dark:text-slate-300">
            No materials uploaded for this course yet.
          </p>
          <p className="text-slate-400">
            Click &quot;Add Learning Material&quot; above to attach documents or links for your students.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {materials.map((mat) => (
            <Card key={mat.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1b6b3a] dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {mat.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                    <span className="uppercase font-mono font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {mat.file_type || 'Resource'}
                    </span>
                    {(mat.file_url || mat.external_link || mat.drive_url) && (
                      <a
                        href={mat.file_url || mat.external_link || mat.drive_url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#1b6b3a] hover:underline flex items-center gap-1"
                      >
                        <span>Open Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDelete(mat.id, mat.title)}
                className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Delete material"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* ADD MATERIAL MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Learning Material"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Material Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Session 1 Cheat Sheet & Setup Guide"
              className="text-xs"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Format Type
            </label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="text-xs"
            >
              <option value="pdf">PDF Document</option>
              <option value="document">Document / Word</option>
              <option value="slide">Presentation Slides</option>
              <option value="code_repo">Code Repository / GitHub</option>
              <option value="external_link">External Web Link</option>
            </Select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Resource URL (Google Drive / GitHub / Web link)
            </label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://drive.google.com/... or https://github.com/..."
              className="text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!title.trim() || !url.trim() || isSaving}
              onClick={handleSaveMaterial}
            >
              {isSaving ? 'Saving...' : 'Add Material'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
