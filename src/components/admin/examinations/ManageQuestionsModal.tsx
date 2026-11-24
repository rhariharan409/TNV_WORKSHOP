import React, { useState, useEffect, useRef } from 'react';
import { Examination, ExamQuestion } from '../../../types/database';
import { dataProvider } from '../../../lib/dataProvider';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import {
  HelpCircle,
  Plus,
  Trash2,
  FileEdit,
  ArrowUp,
  ArrowDown,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Copy,
  Check,
  FileSpreadsheet,
} from 'lucide-react';

interface ManageQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Examination | null;
  attemptsCount: number;
  onQuestionsUpdated: () => void;
  onDuplicate: (examId: string) => void;
}

interface ParsedCSVRow {
  rowNum: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct: string;
  marks: number;
  error?: string;
  isValid: boolean;
}

export const ManageQuestionsModal: React.FC<ManageQuestionsModalProps> = ({
  isOpen,
  onClose,
  exam,
  attemptsCount,
  onQuestionsUpdated,
  onDuplicate,
}) => {
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'csv'>('list');

  // Form state
  const [editingQId, setEditingQId] = useState<string | null>(null);
  const [qText, setQText] = useState('');
  const [qOptA, setQOptA] = useState('');
  const [qOptB, setQOptB] = useState('');
  const [qOptC, setQOptC] = useState('');
  const [qOptD, setQOptD] = useState('');
  const [qCorrect, setQCorrect] = useState<number>(0);
  const [qMarks, setQMarks] = useState('2');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingQ, setIsSavingQ] = useState(false);

  // CSV Preview state
  const [csvPreview, setCsvPreview] = useState<ParsedCSVRow[]>([]);
  const [csvFileName, setCsvFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isLocked = attemptsCount > 0;

  const loadQuestions = async () => {
    if (!exam) return;
    setIsLoading(true);
    try {
      const list = await dataProvider.getExamQuestionsAdmin(exam.id);
      setQuestions(list);
    } catch (err) {
      console.error('Failed to load questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && exam) {
      loadQuestions();
      resetForm();
      setActiveTab('list');
      setCsvPreview([]);
      setCsvFileName('');
    }
  }, [isOpen, exam?.id]);

  const resetForm = () => {
    setEditingQId(null);
    setQText('');
    setQOptA('');
    setQOptB('');
    setQOptC('');
    setQOptD('');
    setQCorrect(0);
    setQMarks('2');
    setFormError(null);
  };

  const handleEditClick = (q: ExamQuestion) => {
    setEditingQId(q.id);
    setQText(q.question_text);
    setQOptA(q.options[0] || '');
    setQOptB(q.options[1] || '');
    setQOptC(q.options[2] || '');
    setQOptD(q.options[3] || '');
    setQCorrect(q.correct_option_index ?? 0);
    setQMarks((q.marks || 2).toString());
    setActiveTab('add');
    setFormError(null);
  };

  const handleDeleteClick = async (qId: string) => {
    if (isLocked) return;
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await dataProvider.deleteExamQuestion(qId);
      await loadQuestions();
      onQuestionsUpdated();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (isLocked || !exam) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const newOrder = [...questions];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);

    setQuestions(newOrder);
    try {
      await dataProvider.reorderExamQuestions(
        exam.id,
        newOrder.map((q) => q.id)
      );
    } catch (err: any) {
      console.error('Failed to persist order:', err);
      loadQuestions();
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !exam) return;
    setFormError(null);

    const txt = qText.trim();
    const optA = qOptA.trim();
    const optB = qOptB.trim();
    const optC = qOptC.trim();
    const optD = qOptD.trim();
    const marksNum = parseInt(qMarks, 10) || 2;

    if (!txt || !optA || !optB || !optC || !optD) {
      setFormError('All question fields and 4 options must be filled.');
      return;
    }

    // Validation: Options must not be duplicated
    const options = [optA, optB, optC, optD];
    const setOfOpts = new Set(options.map((o) => o.toLowerCase()));
    if (setOfOpts.size !== 4) {
      setFormError('Option values must not be duplicated. Each of the 4 options must be unique.');
      return;
    }

    // Validation: Exactly one correct option index (0..3)
    if (qCorrect < 0 || qCorrect > 3) {
      setFormError('Please select exactly one correct option.');
      return;
    }

    setIsSavingQ(true);
    try {
      if (editingQId) {
        await dataProvider.updateExamQuestion(editingQId, {
          question_text: txt,
          options,
          correct_option_index: qCorrect,
          marks: marksNum,
        });
      } else {
        await dataProvider.createExamQuestion({
          exam_id: exam.id,
          question_text: txt,
          options,
          correct_option_index: qCorrect,
          marks: marksNum,
          order_index: questions.length + 1,
        });
      }

      resetForm();
      setActiveTab('list');
      await loadQuestions();
      onQuestionsUpdated();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save question.');
    } finally {
      setIsSavingQ(false);
    }
  };

  // CSV Template Download
  const handleDownloadTemplate = () => {
    const csvContent =
      'question,option_a,option_b,option_c,option_d,correct,marks\n' +
      '"What does ACID stand for in database transactions?","Atomicity, Consistency, Isolation, Durability","All Common Internet Data","Advanced Cache In Databases","None of the above","A",2\n' +
      '"Which SQL clause is used to filter aggregated grouped records?","WHERE","HAVING","GROUP BY","ORDER BY","B",2\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'TNV_Exam_Questions_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Parse implementation
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      parseCSVText(text);
    };
    reader.readAsText(file);
  };

  const parseCSVText = (text: string) => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length <= 1) {
      alert('The CSV file appears to be empty or contains only the header row.');
      return;
    }

    const rows: ParsedCSVRow[] = [];
    const correctMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, '0': 0, '1': 1, '2': 2, '3': 3 };

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Regex parsing for quoted CSV values
      const cols: string[] = [];
      let inQuotes = false;
      let currentVal = '';

      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          cols.push(currentVal.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      cols.push(currentVal.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

      const question = cols[0] || '';
      const optA = cols[1] || '';
      const optB = cols[2] || '';
      const optC = cols[3] || '';
      const optD = cols[4] || '';
      const correctStr = (cols[5] || '').toLowerCase().trim();
      const marks = parseInt(cols[6], 10) || 2;

      let errorMsg: string | undefined = undefined;
      let isValid = true;

      if (!question || !optA || !optB || !optC || !optD) {
        errorMsg = 'Missing question text or one of the 4 required options.';
        isValid = false;
      } else {
        const opts = [optA.toLowerCase(), optB.toLowerCase(), optC.toLowerCase(), optD.toLowerCase()];
        if (new Set(opts).size !== 4) {
          errorMsg = 'Duplicated option texts found.';
          isValid = false;
        } else if (!(correctStr in correctMap)) {
          errorMsg = 'Correct option must be A, B, C, or D.';
          isValid = false;
        }
      }

      rows.push({
        rowNum: i + 1,
        question,
        option_a: optA,
        option_b: optB,
        option_c: optC,
        option_d: optD,
        correct: correctStr.toUpperCase(),
        marks,
        error: errorMsg,
        isValid,
      });
    }

    setCsvPreview(rows);
  };

  const handleImportValidCSV = async () => {
    if (!exam || isLocked) return;
    const validRows = csvPreview.filter((r) => r.isValid);
    if (validRows.length === 0) {
      alert('No valid question rows found to import.');
      return;
    }

    const correctMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, '0': 0, '1': 1, '2': 2, '3': 3 };

    setIsImporting(true);
    try {
      const payload = validRows.map((r) => ({
        question_text: r.question,
        options: [r.option_a, r.option_b, r.option_c, r.option_d],
        correct_option_index: correctMap[r.correct] ?? 0,
        marks: r.marks || 2,
      }));

      await dataProvider.importExamQuestionsCSV(exam.id, payload);
      alert(`Successfully imported ${validRows.length} questions into the question bank!`);
      setCsvPreview([]);
      setCsvFileName('');
      setActiveTab('list');
      await loadQuestions();
      onQuestionsUpdated();
    } catch (err: any) {
      alert(`Import failed: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const qCount = questions.length;
  const isMinimumMet = qCount >= 10;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Question Bank: ${exam?.title || 'Examination'}`}
      description="Manage MCQ questions, set correct options, reorder index, and import via CSV"
      maxWidth="3xl"
    >
      <div className="space-y-5">
        {/* Top Status Bar: Count & Lock State */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 ${
                isMinimumMet
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}
            >
              {isMinimumMet ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>
                {qCount} / 10 minimum questions
              </span>
            </div>

            <span className="text-xs text-slate-500 font-semibold">
              Total Marks: {questions.reduce((sum, q) => sum + (q.marks || 2), 0)}
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Questions List ({qCount})
            </button>
            <button
              disabled={isLocked}
              onClick={() => {
                resetForm();
                setActiveTab('add');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'add'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Plus className="w-3.5 h-3.5" /> Add Question
            </button>
            <button
              disabled={isLocked}
              onClick={() => setActiveTab('csv')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                activeTab === 'csv'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Upload className="w-3.5 h-3.5" /> CSV Import
            </button>
          </div>
        </div>

        {/* Lock Notice if attempts exist */}
        {isLocked && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-bold block">
                  Students have already attempted this exam ({attemptsCount} attempt{attemptsCount > 1 ? 's' : ''}).
                </span>
                <span className="text-[11px] text-amber-800 dark:text-amber-300">
                  Editing or deleting questions is locked to preserve academic score integrity. Duplicate it to make changes.
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exam && onDuplicate(exam.id)}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              className="shrink-0 font-bold border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 bg-white dark:bg-slate-900"
            >
              Duplicate Exam
            </Button>
          </div>
        )}

        {/* TAB 1: QUESTIONS LIST */}
        {activeTab === 'list' && (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading questions...</div>
            ) : questions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-700 dark:text-slate-300">No questions in this examination bank yet.</p>
                <p className="text-[11px] text-slate-400">
                  Add questions individually or upload a batch via the CSV import template.
                </p>
                {!isLocked && (
                  <div className="flex justify-center gap-2 pt-2">
                    <Button variant="primary" size="sm" onClick={() => setActiveTab('add')} leftIcon={<Plus className="w-4 h-4" />}>
                      Add Question
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveTab('csv')} leftIcon={<Upload className="w-4 h-4" />}>
                      CSV Import
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400">
                          Q{idx + 1}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">• {q.marks || 2} Marks</span>
                        <span className="text-[10px] text-slate-400 font-mono">Order #{q.order_index}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white pt-0.5">{q.question_text}</p>
                    </div>

                    {!isLocked && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveOrder(idx, 'up')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                          title="Move up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === questions.length - 1}
                          onClick={() => handleMoveOrder(idx, 'down')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 transition-colors"
                          title="Move down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditClick(q)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          title="Edit question"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    {q.options.map((opt, oIdx) => {
                      const isCorrect = (q.correct_option_index ?? 0) === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2 rounded-xl text-xs flex items-center justify-between border ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate">
                            <span className="font-extrabold mr-1.5">{String.fromCharCode(65 + oIdx)}.</span>
                            {opt}
                          </span>
                          {isCorrect && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase">
                              <Check className="w-3 h-3" /> Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: ADD / EDIT QUESTION FORM */}
        {activeTab === 'add' && (
          <form onSubmit={handleSaveQuestion} className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {editingQId ? 'Edit Question Formulation' : '+ Add Question to Examination Bank'}
              </span>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('list');
                }}
                className="text-xs text-slate-500 hover:underline"
              >
                Cancel
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Question Text *
              </label>
              <textarea
                rows={2}
                value={qText}
                onChange={(e) => setQText(e.target.value)}
                placeholder="State the technical question clearly..."
                className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Option A *</span>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 cursor-pointer">
                    <input
                      type="radio"
                      name="correctRadio"
                      checked={qCorrect === 0}
                      onChange={() => setQCorrect(0)}
                    />
                    Correct Option
                  </label>
                </label>
                <input
                  type="text"
                  value={qOptA}
                  onChange={(e) => setQOptA(e.target.value)}
                  placeholder="Enter Option A text"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Option B *</span>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 cursor-pointer">
                    <input
                      type="radio"
                      name="correctRadio"
                      checked={qCorrect === 1}
                      onChange={() => setQCorrect(1)}
                    />
                    Correct Option
                  </label>
                </label>
                <input
                  type="text"
                  value={qOptB}
                  onChange={(e) => setQOptB(e.target.value)}
                  placeholder="Enter Option B text"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Option C *</span>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 cursor-pointer">
                    <input
                      type="radio"
                      name="correctRadio"
                      checked={qCorrect === 2}
                      onChange={() => setQCorrect(2)}
                    />
                    Correct Option
                  </label>
                </label>
                <input
                  type="text"
                  value={qOptC}
                  onChange={(e) => setQOptC(e.target.value)}
                  placeholder="Enter Option C text"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Option D *</span>
                  <label className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 cursor-pointer">
                    <input
                      type="radio"
                      name="correctRadio"
                      checked={qCorrect === 3}
                      onChange={() => setQCorrect(3)}
                    />
                    Correct Option
                  </label>
                </label>
                <input
                  type="text"
                  value={qOptD}
                  onChange={(e) => setQOptD(e.target.value)}
                  placeholder="Enter Option D text"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Marks:</span>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={qMarks}
                  onChange={(e) => setQMarks(e.target.value)}
                  className="w-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setActiveTab('list')}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSavingQ}>
                  {editingQId ? 'Update Question' : 'Save Question'}
                </Button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: CSV BATCH IMPORT */}
        {activeTab === 'csv' && (
          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Batch Import via CSV
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Columns: question, option_a, option_b, option_c, option_d, correct (A/B/C/D), marks
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                  className="font-bold shrink-0"
                >
                  Download Template
                </Button>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-3.5 h-3.5" />}
                >
                  Select CSV File
                </Button>
                {csvFileName && (
                  <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    {csvFileName} ({csvPreview.length} rows parsed)
                  </span>
                )}
              </div>
            </div>

            {/* CSV Preview Table with row-level validation */}
            {csvPreview.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    CSV Rows Preview ({csvPreview.filter((r) => r.isValid).length} valid of {csvPreview.length})
                  </span>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleImportValidCSV}
                    isLoading={isImporting}
                    disabled={csvPreview.filter((r) => r.isValid).length === 0}
                  >
                    Import {csvPreview.filter((r) => r.isValid).length} Valid Questions
                  </Button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto text-xs">
                  <table className="w-full text-left text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[10px] font-bold uppercase text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2">Row</th>
                        <th className="p-2">Question</th>
                        <th className="p-2">Options (A, B, C, D)</th>
                        <th className="p-2">Correct</th>
                        <th className="p-2">Marks</th>
                        <th className="p-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {csvPreview.map((row) => (
                        <tr key={row.rowNum} className={row.isValid ? '' : 'bg-rose-50/50 dark:bg-rose-950/20'}>
                          <td className="p-2 font-mono font-bold text-slate-400">#{row.rowNum}</td>
                          <td className="p-2 font-semibold max-w-[200px] truncate" title={row.question}>
                            {row.question}
                          </td>
                          <td className="p-2 text-[11px] max-w-[220px] truncate text-slate-500">
                            A: {row.option_a} | B: {row.option_b} | C: {row.option_c} | D: {row.option_d}
                          </td>
                          <td className="p-2 font-bold text-center text-emerald-600">{row.correct}</td>
                          <td className="p-2 text-center">{row.marks}</td>
                          <td className="p-2 text-right">
                            {row.isValid ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                Valid
                              </span>
                            ) : (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 cursor-help"
                                title={row.error}
                              >
                                {row.error || 'Invalid'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
