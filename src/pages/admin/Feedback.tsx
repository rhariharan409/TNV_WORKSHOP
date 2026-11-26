import React, { useEffect, useState } from 'react';
import { dataProvider } from '../../lib/dataProvider';
import { Feedback, NotesRequest } from '../../types/database';
import { formatDate } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  MessageSquareWarning,
  MessageSquare,
  CheckCircle2,
  Paperclip,
  FileText,
  Send,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

export const AdminFeedback: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'feedback' | 'notes'>('feedback');
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [notesRequests, setNotesRequests] = useState<NotesRequest[]>([]);
  const [activeFb, setActiveFb] = useState<Feedback | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [status, setStatus] = useState<Feedback['status']>('replied');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Notes Request Response State
  const [activeNoteReq, setActiveNoteReq] = useState<NotesRequest | null>(null);
  const [noteReplyText, setNoteReplyText] = useState('');
  const [isSavingNoteReply, setIsSavingNoteReply] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fList, nList] = await Promise.all([
        dataProvider.getFeedbacks(),
        dataProvider.getNotesRequests(),
      ]);
      setFeedbacks(fList);
      setNotesRequests(nList);
    } catch (err) {
      console.error('Failed to load feedback/notes data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenRespond = (fb: Feedback) => {
    setActiveFb(fb);
    setAdminResponse(fb.admin_response || '');
    setStatus('replied');
  };

  const handleSaveResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFb) return;
    setIsUpdating(true);
    await dataProvider.respondToFeedback(activeFb.id, adminResponse, status);
    setIsUpdating(false);
    setActiveFb(null);
    await loadData();
  };

  const handleOpenRespondNote = (req: NotesRequest) => {
    setActiveNoteReq(req);
    setNoteReplyText(req.admin_reply || '');
  };

  const handleSaveNoteReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNoteReq) return;
    setIsSavingNoteReply(true);
    await dataProvider.respondToNotesRequest(activeNoteReq.id, noteReplyText, 'fulfilled');
    setIsSavingNoteReply(false);
    setActiveNoteReq(null);
    await loadData();
  };

  const pendingNotesCount = notesRequests.filter((r) => r.status === 'pending').length;
  const openFeedbackCount = feedbacks.filter((f) => f.status === 'open' || f.status === 'in_progress').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Student Feedback, Complaints & Notes Requests
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review student issue tickets, manage session notes requests, and deliver official administrative responses.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'feedback'
              ? 'bg-[#1b6b3a] text-white shadow-sm ring-2 ring-[#1b6b3a]/20'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <MessageSquareWarning className="w-3.5 h-3.5" />
          <span>Complaints & Support Tickets</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'feedback'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {feedbacks.length}
          </span>
          {openFeedbackCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'notes'
              ? 'bg-[#1b6b3a] text-white shadow-sm ring-2 ring-[#1b6b3a]/20'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Session Notes Requests</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
              activeTab === 'notes'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
            }`}
          >
            {notesRequests.length}
          </span>
          {pendingNotesCount > 0 && (
            <span className="bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full">
              {pendingNotesCount} new
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: FEEDBACK & COMPLAINTS */}
      {/* ======================================================== */}
      {activeTab === 'feedback' && (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Subject & Details</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {feedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                      No student feedback or support tickets submitted yet.
                    </td>
                  </tr>
                ) : (
                  feedbacks.map((fb) => {
                    const isReplied = fb.status === 'replied' || Boolean(fb.admin_response);

                    return (
                      <tr key={fb.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {fb.student?.full_name || 'Enrolled Student'}
                          </span>
                          <span className="text-[11px] text-slate-400">{fb.student?.email}</span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant="outline" className="capitalize">
                            {fb.category.replace('_', ' ')}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 max-w-sm">
                          <span className="font-bold text-slate-900 dark:text-white block">{fb.subject}</span>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{fb.description}</p>

                          {/* Optional Attachments Display */}
                          {fb.attachments && fb.attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {fb.attachments.map((url, i) => (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-brand-700 dark:text-brand-300 hover:underline border border-slate-200 dark:border-slate-700"
                                >
                                  <Paperclip className="w-2.5 h-2.5 text-brand-600" />
                                  Attachment {i + 1}
                                </a>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          {formatDate(fb.created_at)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isReplied ? (
                            <Badge variant="success" className="font-bold">
                              Replied
                            </Badge>
                          ) : (
                            <StatusBadge status={fb.status} />
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isReplied ? (
                            <div className="flex flex-col items-end gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Replied
                              </span>
                              {fb.admin_response && (
                                <p className="text-[11px] text-slate-600 dark:text-slate-300 max-w-xs text-right line-clamp-2 italic bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                  "{fb.admin_response}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <Button variant="primary" size="sm" onClick={() => handleOpenRespond(fb)}>
                              Reply / Resolve
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ======================================================== */}
      {/* TAB 2: SESSION NOTES REQUESTS */}
      {/* ======================================================== */}
      {activeTab === 'notes' && (
        <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Course & Live Session</th>
                  <th className="py-3.5 px-4">Request Note / Message</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {notesRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-xs text-slate-500">
                      No session notes requested by students yet.
                    </td>
                  </tr>
                ) : (
                  notesRequests.map((req) => {
                    const isFulfilled = req.status === 'fulfilled' || Boolean(req.admin_reply);

                    return (
                      <tr key={req.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {req.student?.full_name || 'Student'}
                          </span>
                          <span className="text-[11px] text-slate-400">{req.student?.email}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {req.session_title}
                          </span>
                          <span className="text-[11px] text-brand-600 dark:text-brand-400 block font-semibold">
                            {req.course_title}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-sm">
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            {req.message}
                          </p>
                          {req.admin_reply && (
                            <div className="mt-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                              <strong>Reply:</strong> {req.admin_reply}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500">
                          {formatDate(req.created_at)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <Badge variant={isFulfilled ? 'success' : 'warning'} className="font-bold capitalize">
                            {isFulfilled ? 'Fulfilled' : req.status}
                          </Badge>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {isFulfilled ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Notes Sent
                            </span>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleOpenRespondNote(req)}
                              className="bg-[#1b6b3a] hover:bg-[#15542d] text-white"
                            >
                              Fulfill & Reply
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Response Modal for Complaints */}
      <Modal
        isOpen={Boolean(activeFb)}
        onClose={() => setActiveFb(null)}
        title="Respond to Student Ticket"
        description="Provide feedback and deliver administrative resolution reply"
        maxWidth="md"
      >
        {activeFb && (
          <form onSubmit={handleSaveResponse} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeFb.student?.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Subject:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeFb.subject}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                {activeFb.description}
              </p>

              {activeFb.attachments && activeFb.attachments.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block mb-1 font-semibold">Attached Files:</span>
                  <div className="flex flex-wrap gap-2">
                    {activeFb.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 text-brand-600 font-semibold border border-slate-200 dark:border-slate-700 hover:underline"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        Attachment {i + 1}
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Select
              label="Ticket Status *"
              value={status}
              onChange={(e) => setStatus(e.target.value as Feedback['status'])}
              options={[
                { value: 'replied', label: 'Replied (Response Delivered)' },
                { value: 'resolved', label: 'Resolved (Issue Solved)' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'closed', label: 'Closed' },
                { value: 'open', label: 'Open' },
              ]}
            />

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Official Administrative Response *
              </label>
              <textarea
                rows={4}
                value={adminResponse}
                onChange={(e) => setAdminResponse(e.target.value)}
                placeholder="Detail resolution steps, instructions, or answers for the student..."
                className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                required
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveFb(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isUpdating} className="bg-[#1b6b3a] hover:bg-[#15542d] text-white">
                Save & Deliver Response
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Response Modal for Notes Requests */}
      <Modal
        isOpen={Boolean(activeNoteReq)}
        onClose={() => setActiveNoteReq(null)}
        title="Fulfill Session Notes Request"
        description="Provide Google Drive links, lecture slides, or written notes to the student"
        maxWidth="md"
      >
        {activeNoteReq && (
          <form onSubmit={handleSaveNoteReply} className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Student:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeNoteReq.student?.full_name}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Session:</span>
                <span className="font-bold text-slate-900 dark:text-white">{activeNoteReq.session_title} ({activeNoteReq.course_title})</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 font-semibold block mb-0.5">Student's Request:</span>
                {activeNoteReq.message}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Notes Resources / Admin Reply *
              </label>
              <textarea
                rows={4}
                value={noteReplyText}
                onChange={(e) => setNoteReplyText(e.target.value)}
                placeholder="Include Google Drive links to slides, code repository links, or session notes summary..."
                className="w-full rounded-2xl border-none bg-[#eef3f8] dark:bg-slate-800 p-3.5 text-xs font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#1b6b3a]"
                required
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" size="sm" onClick={() => setActiveNoteReq(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingNoteReply} className="bg-[#1b6b3a] hover:bg-[#15542d] text-white">
                Send Notes to Student
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
