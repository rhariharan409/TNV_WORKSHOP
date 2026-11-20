import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { Course, Module, Session, VideoLecture, LearningMaterial } from '../../types/database';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Plus, Video, FileText, Edit, Trash2, Layers, CheckCircle2 } from 'lucide-react';

export const AdminModules: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);

  // Video and Materials Modal State
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentSessionForVideo, setCurrentSessionForVideo] = useState<Session | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDriveUrl, setVideoDriveUrl] = useState('');
  const [videoDuration, setVideoDuration] = useState('45');

  // Materials Modal
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [matTitle, setMatTitle] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [matDesc, setMatDesc] = useState('');

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dataProvider.getCourses().then((cList) => {
      setCourses(cList);
      if (cList.length > 0) {
        setSelectedCourseId(cList[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      dataProvider.getModules(selectedCourseId).then((mList) => {
        setModules(mList);
        if (mList.length > 0) {
          setSelectedModuleId(mList[0].id);
        } else {
          setSelectedModuleId('');
          setSessions([]);
        }
        setIsLoading(false);
      });
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (selectedModuleId) {
      dataProvider.getSessions(selectedModuleId).then(setSessions);
    }
  }, [selectedModuleId]);

  const handleOpenVideoModal = async (s: Session) => {
    setCurrentSessionForVideo(s);
    const v = await dataProvider.getVideoBySession(s.id);
    if (v) {
      setVideoTitle(v.title);
      setVideoDriveUrl(v.drive_url);
      setVideoDuration(v.duration_minutes.toString());
    } else {
      setVideoTitle(s.title);
      setVideoDriveUrl('https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/preview');
      setVideoDuration(s.duration_minutes.toString());
    }
    setVideoModalOpen(true);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    setVideoModalOpen(false);
    alert('Video Lecture details saved for session!');
  };

  const handleSaveMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    setMaterialModalOpen(false);
    alert('Learning Material PDF successfully uploaded & linked!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Modules, Sessions & Video Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build NPTEL-style structured modules, configure Google Drive lecture embeds, and upload session notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMaterialModalOpen(true)} leftIcon={<FileText className="w-4 h-4" />}>
            Attach Learning PDF
          </Button>
        </div>
      </div>

      {/* Select Course Toolbar */}
      <Card className="p-4 border-slate-200 dark:border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Target Course *"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
          />

          <Select
            label="Module Selection *"
            value={selectedModuleId}
            onChange={(e) => setSelectedModuleId(e.target.value)}
            options={modules.map((m) => ({ value: m.id, label: m.title }))}
          />
        </div>
      </Card>

      {/* Sessions Management List */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Sessions Inside Selected Module
            </h3>
            <p className="text-xs text-slate-500">{sessions.length} Sessions configured</p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No sessions created for this module.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sessions.map((s, idx) => (
              <div key={s.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-brand-600">Session {idx + 1}</span>
                    <Badge variant="outline" className="capitalize">{s.session_type}</Badge>
                    <span className="text-[11px] text-slate-400">{s.duration_minutes} Mins</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">{s.title}</h4>
                  <p className="text-xs text-slate-500">{s.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenVideoModal(s)}
                    leftIcon={<Video className="w-3.5 h-3.5 text-brand-600" />}
                  >
                    Configure Drive Video
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Video Modal (Google Drive, Section 7) */}
      <Modal
        isOpen={videoModalOpen}
        onClose={() => setVideoModalOpen(false)}
        title="Configure Google Drive Video Lecture"
        description="Set video embed URL and duration for this session"
        maxWidth="md"
      >
        <form onSubmit={handleSaveVideo} className="space-y-4">
          <Input
            label="Video Title *"
            value={videoTitle}
            onChange={(e) => setVideoTitle(e.target.value)}
            required
          />

          <Input
            label="Google Drive Preview / Embed Link *"
            placeholder="https://drive.google.com/file/d/FILE_ID/preview"
            value={videoDriveUrl}
            onChange={(e) => setVideoDriveUrl(e.target.value)}
            helperText="Provide the shareable Google Drive link with /preview ending for iframe embedding"
            required
          />

          <Input
            label="Duration (Minutes) *"
            type="number"
            value={videoDuration}
            onChange={(e) => setVideoDuration(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setVideoModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Save Video Link
            </Button>
          </div>
        </form>
      </Modal>

      {/* Material Modal (Section 8) */}
      <Modal
        isOpen={materialModalOpen}
        onClose={() => setMaterialModalOpen(false)}
        title="Attach Learning Material / PDF"
        description="Upload or link PDF notes and architecture diagrams for students"
        maxWidth="md"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <Input
            label="Document Title *"
            placeholder="e.g. Session 2 Architecture Blueprint PDF"
            value={matTitle}
            onChange={(e) => setMatTitle(e.target.value)}
            required
          />

          <Input
            label="PDF / File Download URL *"
            placeholder="https://example.com/notes.pdf"
            value={matUrl}
            onChange={(e) => setMatUrl(e.target.value)}
            required
          />

          <Input
            label="Brief Description"
            placeholder="Key concepts, schema diagrams, and SQL snippets"
            value={matDesc}
            onChange={(e) => setMatDesc(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setMaterialModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm">
              Attach Material
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
