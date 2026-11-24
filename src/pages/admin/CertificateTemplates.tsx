import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dataProvider } from '../../lib/dataProvider';
import { CertificateTemplate } from '../../types/database';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { TopLeftWavyAccent, BottomRightWavyAccent } from '../../components/ui/WavyDecorations';
import {
  Award,
  CheckCircle2,
  Save,
  Plus,
  Trash2,
  Eye,
  Sliders,
  Sparkles,
  ShieldCheck,
  FileCheck2,
  Printer,
  PenTool,
  RotateCcw,
} from 'lucide-react';

export const AdminCertificateTemplates: React.FC = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<CertificateTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [formData, setFormData] = useState<Partial<CertificateTemplate>>({
    template_name: 'TNV Official Academy Certificate',
    layout: 'classic',
    badge_title: 'Certificate of Industry Excellence & Completion',
    signatory_name: 'Thamilaran',
    signatory_title: 'Program Director & Chief Architect',
    signature_image_url: '',
    min_course_progress_percentage: 80,
    min_exam_percentage: 50,
    require_all_assignments: true,
    require_project_approval: true,
    is_active: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const list = await dataProvider.getCertificateTemplates();
      setTemplates(list);
      if (list.length > 0) {
        const initial = list[0];
        setSelectedTemplateId(initial.id);
        setFormData(initial);
      }
    } catch (err) {
      console.error('Failed to load certificate templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSelectTemplate = (id: string) => {
    setSelectedTemplateId(id);
    const found = templates.find((t) => t.id === id);
    if (found) {
      setFormData(found);
    }
  };

  const handleCreateNew = () => {
    const newId = `temp-${Date.now()}`;
    const newTemplate: Partial<CertificateTemplate> = {
      id: newId,
      template_name: 'New Certificate Style',
      layout: 'modern',
      badge_title: 'Certificate of Technical Achievement',
      signatory_name: 'Thamilaran',
      signatory_title: 'Dean of Technology Programs',
      signature_image_url: '',
      min_course_progress_percentage: 80,
      min_exam_percentage: 50,
      require_all_assignments: true,
      require_project_approval: true,
      is_active: true,
    };
    setSelectedTemplateId(newId);
    setFormData(newTemplate);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const saved = await dataProvider.saveCertificateTemplate({
        ...formData,
        id: selectedTemplateId.startsWith('temp-') ? undefined : selectedTemplateId,
      });
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3000);
      await loadTemplates();
      setSelectedTemplateId(saved.id);
      setFormData(saved);
    } catch (err: any) {
      alert(`Failed to save template: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTemplateId || selectedTemplateId.startsWith('temp-')) {
      if (templates.length > 0) {
        handleSelectTemplate(templates[0].id);
      }
      return;
    }
    if (!confirm('Are you sure you want to delete this certificate template?')) return;
    try {
      await dataProvider.deleteCertificateTemplate(selectedTemplateId);
      await loadTemplates();
    } catch (err: any) {
      alert(`Failed to delete template: ${err.message}`);
    }
  };

  const layoutStyle = formData.layout || 'classic';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Certificate Templates
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Design certificate layouts, customize title typography, signatory credentials, and preview in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreateNew}
            leftIcon={<Plus className="w-4 h-4" />}
            className="font-bold"
          >
            New Template
          </Button>
        </div>
      </div>

      {/* Template Selector Tabs */}
      {templates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {templates.map((tpl) => (
            <button
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                selectedTemplateId === tpl.id
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>{tpl.template_name}</span>
              {tpl.is_active && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Grid: Left Editor + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Template Form Editor (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-5 border-slate-200 dark:border-slate-800 shadow-sm">
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-brand-600" />
                  <span>Template Specifications</span>
                </h3>
                {selectedTemplateId && !selectedTemplateId.startsWith('temp-') && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Template Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.template_name || ''}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  placeholder="e.g. TNV Royal Academy Certificate"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              {/* Layout Mode Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1.5">
                  Visual Layout Theme
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'classic', label: 'Classic Royal', desc: 'Wavy TNV corner seals & serif' },
                    { id: 'modern', label: 'Modern Emerald', desc: 'Gradient border & geometric accents' },
                    { id: 'executive', label: 'Executive Gold', desc: 'Luxury gold double border' },
                    { id: 'minimalist', label: 'Clean Tech', desc: 'Stark monochrome lines' },
                  ].map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, layout: l.id as any })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        formData.layout === l.id
                          ? 'border-brand-600 bg-brand-50/50 dark:bg-brand-950/40 text-brand-950 dark:text-brand-100 ring-2 ring-brand-500/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-extrabold text-xs">{l.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{l.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Badge / Certificate Title Text */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Certificate Header Title Text *
                </label>
                <input
                  type="text"
                  required
                  value={formData.badge_title || ''}
                  onChange={(e) => setFormData({ ...formData, badge_title: e.target.value })}
                  placeholder="e.g. Certificate of Industry Excellence & Completion"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              {/* Signatory Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Signatory Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatory_name || ''}
                    onChange={(e) => setFormData({ ...formData, signatory_name: e.target.value })}
                    placeholder="e.g. Thamilaran"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Signatory Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.signatory_title || ''}
                    onChange={(e) => setFormData({ ...formData, signatory_title: e.target.value })}
                    placeholder="e.g. Program Director"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                </div>
              </div>

              {/* Signature Image / Text */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1 flex items-center justify-between">
                  <span>Signatory Signature</span>
                  <span className="text-[10px] text-slate-400 font-normal">Cursive preview or image URL</span>
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={formData.signature_image_url || ''}
                    onChange={(e) => setFormData({ ...formData, signature_image_url: e.target.value })}
                    placeholder="Leave empty for cursive font signature or paste image URL"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                  />
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Current Signature Preview:</span>
                    {formData.signature_image_url ? (
                      <img src={formData.signature_image_url} alt="Signature" className="h-6 object-contain" />
                    ) : (
                      <span className="font-serif italic font-black text-base text-slate-800 dark:text-slate-200">
                        {formData.signatory_name || 'Signature'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Eligibility Thresholds */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Min Progress %
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.min_course_progress_percentage || 80}
                    onChange={(e) => setFormData({ ...formData, min_course_progress_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Min Exam %
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.min_exam_percentage || 50}
                    onChange={(e) => setFormData({ ...formData, min_exam_percentage: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Status Toggles */}
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Active Template</span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedTemplateId) handleSelectTemplate(selectedTemplateId);
                  }}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                >
                  Reset
                </Button>

                <div className="flex items-center gap-2">
                  {saveSuccessNotice && (
                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Saved
                    </span>
                  )}
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    className="bg-brand-600 hover:bg-brand-700 font-bold"
                  >
                    {isSaving ? 'Saving...' : 'Save Template'}
                  </Button>
                </div>
              </div>
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: Live Interactive Certificate Preview (7 cols) */}
        <div className="lg:col-span-7 space-y-3 sticky top-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>Live Certificate Preview</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-medium">
              Real-time rendering ({layoutStyle.toUpperCase()})
            </span>
          </div>

          {/* PREVIEW CONTAINER */}
          <div
            className={`relative w-full rounded-[24px] bg-white text-center shadow-xl p-6 sm:p-8 overflow-hidden transition-all duration-300 ${
              layoutStyle === 'classic'
                ? 'border-4 border-slate-200'
                : layoutStyle === 'modern'
                ? 'border-4 border-emerald-600 bg-gradient-to-b from-emerald-50/20 to-white'
                : layoutStyle === 'executive'
                ? 'border-8 border-amber-500/80 bg-white ring-4 ring-amber-200/50'
                : 'border-2 border-slate-900 bg-white'
            }`}
          >
            {/* Background Corner Accents for Classic */}
            {layoutStyle === 'classic' && (
              <>
                <TopLeftWavyAccent className="w-32 h-32 opacity-100" />
                <BottomRightWavyAccent className="w-32 h-32 opacity-100" />
              </>
            )}

            {/* Faint Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.035] pointer-events-none">
              <img src="/tnv-logo.png" alt="TNV Watermark" className="w-64 h-64 object-contain" />
            </div>

            <div className="relative z-10 space-y-4">
              {/* Top Header: TNV Seal & Academy Title */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-14 h-14 rounded-full p-1 bg-white shadow-md border-2 border-amber-400 flex items-center justify-center">
                  <img
                    src="/tnv-logo.png"
                    alt="Tamil Nadu Volunteers Seal"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-emerald-800">
                    TNV WORKSHOP ACADEMY
                  </h2>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                    TAMIL NADU VOLUNTEERS • CENTRE OF SYSTEMS & SOFTWARE EXCELLENCE
                  </p>
                </div>
              </div>

              {/* Live Badge Title */}
              <div className="py-0.5">
                <span
                  className={`inline-block px-3.5 py-1 rounded-full font-black text-xs uppercase tracking-wide transition-all ${
                    layoutStyle === 'executive'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : layoutStyle === 'modern'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : layoutStyle === 'minimalist'
                      ? 'bg-slate-900 text-white'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  }`}
                >
                  {formData.badge_title || 'Certificate of Completion'}
                </span>
              </div>

              {/* Presentation Lead */}
              <p className="text-xs font-serif italic text-slate-600">
                This is proudly presented to
              </p>

              {/* Student Name Placeholder */}
              <div>
                <h3 className="text-2xl font-black font-serif uppercase tracking-wider text-slate-900 border-b-2 border-emerald-600 pb-1.5 inline-block px-8">
                  Nithin Ramu
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  of Department of Information Technology, PSG College of Technology
                </p>
              </div>

              {/* Completion Statement */}
              <p className="max-w-md mx-auto text-xs text-slate-600 leading-relaxed font-serif">
                for successfully completing theoretical curriculum, laboratory sessions, examinations, and project coursework in
              </p>

              {/* Course Title Placeholder */}
              <div>
                <h4 className="text-xl font-black text-emerald-700 tracking-tight">
                  Full Stack Web Development & Cloud Architecture
                </h4>
              </div>

              {/* Score / Performance Pill */}
              <div className="inline-flex items-center justify-center gap-2.5 px-4 py-1.5 rounded-xl bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-xs font-black shadow-xs">
                <span>Course Progress: 100%</span>
                <span className="text-emerald-300">•</span>
                <span>Score: 92%</span>
                <span className="text-emerald-300">•</span>
                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md text-[10px]">
                  Grade: A+
                </span>
              </div>

              {/* Signatures & Seal Grid */}
              <div className="pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 items-center text-center">
                {/* Left: Live Signatory */}
                <div className="space-y-0.5">
                  <div className="h-7 flex items-end justify-center">
                    {formData.signature_image_url ? (
                      <img src={formData.signature_image_url} alt="Signature" className="h-6 object-contain mx-auto" />
                    ) : (
                      <span className="font-serif italic font-black text-sm text-slate-800">
                        {formData.signatory_name || 'Signature'}
                      </span>
                    )}
                  </div>
                  <div className="w-24 border-b border-slate-400 mx-auto"></div>
                  <p className="text-[11px] font-black text-slate-800">{formData.signatory_name || 'Signatory'}</p>
                  <p className="text-[9px] text-slate-500 font-medium truncate max-w-[140px] mx-auto">
                    {formData.signatory_title || 'Title'}
                  </p>
                </div>

                {/* Center: Gold Medal */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-900 flex items-center justify-center shadow-md border-2 border-white">
                    <Award className="w-5 h-5 text-slate-900" />
                  </div>
                  <span className="text-[8px] font-black text-amber-700 mt-0.5 uppercase tracking-tighter">
                    VERIFIED
                  </span>
                </div>

                {/* Right: Board */}
                <div className="space-y-0.5">
                  <div className="h-7 flex items-end justify-center">
                    <span className="font-serif italic font-black text-xs text-slate-800">
                      TNV Academic Board
                    </span>
                  </div>
                  <div className="w-24 border-b border-slate-400 mx-auto"></div>
                  <p className="text-[11px] font-black text-slate-800">Council of Studies</p>
                  <p className="text-[9px] text-slate-500 font-medium">Tamil Nadu Volunteers</p>
                </div>
              </div>

              {/* Bottom Metadata */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                <span>Credential ID: <strong>TNV-2026-C89123</strong></span>
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> TNV Verified Registry
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
