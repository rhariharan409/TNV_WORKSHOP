import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { Project, ProjectSubmission } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { FolderGit2, Github, Globe, CheckCircle2, Send, Clock, MessageSquare, AlertTriangle } from 'lucide-react';

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [submissions, setSubmissions] = useState<ProjectSubmission[]>([]);

  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!user?.id) return;
    const [pList, subList] = await Promise.all([
      dataProvider.getProjects(),
      dataProvider.getProjectSubmissions(user.id),
    ]);
    setProjects(pList);
    setSubmissions(subList);

    if (subList.length > 0) {
      setProjectTitle(subList[0].project_title);
      setProjectDesc(subList[0].project_description);
      setGithubUrl(subList[0].github_url);
      setDemoUrl(subList[0].live_demo_url || '');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const primaryProject = projects[0];
  const currentSubmission = submissions.find((s) => s.project_id === primaryProject?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryProject || !user?.id) return;
    if (!githubUrl.trim().startsWith('http')) {
      alert('Please provide a valid GitHub repository URL.');
      return;
    }

    setIsSubmitting(true);
    await dataProvider.submitProject(primaryProject.id, user.id, {
      project_title: projectTitle,
      project_description: projectDesc,
      github_url: githubUrl,
      live_demo_url: demoUrl,
    });

    setIsSubmitting(false);
    setSuccess(true);
    await loadData();
    setTimeout(() => setSuccess(false), 3000);
  };

  if (isLoading || !primaryProject) {
    return (
      <div className="py-20 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-semibold uppercase">Loading Capstone Deliverables...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Badge variant="brand">Capstone Project</Badge>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
          {primaryProject.title}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Build and deploy your end-to-end cloud engineering project. Submission approval is a mandatory requirement for certificate issuance.
        </p>
      </div>

      {/* Project Requirements Overview */}
      <Card className="p-6 sm:p-8 space-y-4 border-brand-200 dark:border-brand-900/60 bg-gradient-to-br from-brand-50/30 to-white dark:from-brand-950/20 dark:to-slate-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Deliverable Specifications</h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3.5 h-3.5" /> Deadline: {formatDate(primaryProject.submission_deadline)}
            </p>
          </div>
          <div>
            {currentSubmission ? (
              <StatusBadge status={currentSubmission.status} />
            ) : (
              <Badge variant="warning">Not Submitted</Badge>
            )}
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
          <p className="leading-relaxed">{primaryProject.description}</p>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block">Key Requirements Checklist:</span>
            <p className="leading-relaxed">{primaryProject.requirements}</p>
          </div>
        </div>
      </Card>

      {/* Admin Review Feedback Box */}
      {currentSubmission && currentSubmission.status === 'approved' && (
        <Card className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200 text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Capstone Project Approved by Review Board</span>
            </div>
            <span className="text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
              Grade: {currentSubmission.marks_obtained} / 100
            </span>
          </div>
          {currentSubmission.feedback && (
            <div className="text-xs text-emerald-800 dark:text-emerald-300/90 pt-1 flex items-start gap-2">
              <MessageSquare className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Architect Comments:</span>
                <span>{currentSubmission.feedback}</span>
              </div>
            </div>
          )}
        </Card>
      )}

      {currentSubmission && currentSubmission.status === 'resubmission_required' && (
        <Card className="p-6 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 space-y-3">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Resubmission Required</span>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300">
            {currentSubmission.feedback || 'Please update your repository code or deployment link as per review guidelines.'}
          </p>
        </Card>
      )}

      {/* Submission Form */}
      <Card className="p-6 sm:p-8 space-y-6">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {currentSubmission ? 'Project Submission Details' : 'Submit Your Capstone Project'}
        </h3>

        {success && (
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
            Capstone project submission successfully registered for review!
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Project Title *"
            placeholder="e.g. Enterprise Cloud Workshop LMS"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Project Architecture & Summary *
            </label>
            <textarea
              rows={4}
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              placeholder="Outline your architectural choices, database schema, and implemented features..."
              className="w-full rounded-xl border border-slate-300 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              required
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="GitHub Repository URL *"
              placeholder="https://github.com/username/repo"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              required
            />

            <Input
              label="Live Deployed URL (Vercel / Cloud)"
              placeholder="https://my-project.vercel.app"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            rightIcon={<Send className="w-4 h-4" />}
          >
            {currentSubmission ? 'Update Project Links' : 'Submit Capstone for Review'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
