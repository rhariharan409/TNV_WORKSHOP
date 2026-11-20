import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { dataProvider } from '../../lib/dataProvider';
import { LiveSession, Profile, Attendance } from '../../types/database';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { UserCheck, CheckCircle2, XCircle, AlertCircle, Save } from 'lucide-react';

export const AdminAttendance: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(searchParams.get('session') || '');
  const [students, setStudents] = useState<Profile[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, Attendance['status']>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      dataProvider.getLiveSessions(),
      dataProvider.getProfiles(),
    ]).then(([sList, pList]) => {
      setSessions(sList);
      const studentOnly = pList.filter((p) => p.role === 'student');
      setStudents(studentOnly);

      const targetId = searchParams.get('session') || (sList.length > 0 ? sList[0].id : '');
      setSelectedSessionId(targetId);
    });
  }, [searchParams]);

  useEffect(() => {
    if (selectedSessionId) {
      dataProvider.getAttendance(selectedSessionId).then((records) => {
        const map: Record<string, Attendance['status']> = {};
        records.forEach((r) => {
          map[r.student_id] = r.status;
        });
        setAttendanceMap(map);
      });
    }
  }, [selectedSessionId]);

  const handleStatusChange = (studentId: string, status: Attendance['status']) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = async () => {
    if (!selectedSessionId) return;
    setIsSaving(true);
    for (const [studentId, status] of Object.entries(attendanceMap)) {
      await dataProvider.markAttendance(selectedSessionId, studentId, status);
    }
    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const presentCount = Object.values(attendanceMap).filter((s) => s === 'present').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Live Attendance Roster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Mark and verify student live presence for masterclasses. Attendance logs are included in completion auditing.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSaveAttendance}
          isLoading={isSaving}
          leftIcon={<Save className="w-4 h-4" />}
        >
          Save Attendance Sheet
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Attendance changes successfully recorded to database!
        </div>
      )}

      {/* Select Live Session Bar */}
      <Card className="p-4 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <Select
              label="Select Live Session *"
              value={selectedSessionId}
              onChange={(e) => {
                setSelectedSessionId(e.target.value);
                setSearchParams({ session: e.target.value });
              }}
              options={sessions.map((s) => ({
                value: s.id,
                label: `${s.title} (${s.scheduled_date})`,
              }))}
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-bold pt-2 sm:pt-0">
            <span className="text-slate-500">Present Count:</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-sm">
              {presentCount} / {students.length}
            </span>
          </div>
        </div>
      </Card>

      {/* Attendance Roster Table */}
      <Card className="overflow-hidden border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-4">Student Name</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">College</th>
                <th className="py-3.5 px-4">Current Attendance Status</th>
                <th className="py-3.5 px-4 text-right">Quick Mark Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {students.map((st) => {
                const currentStatus = attendanceMap[st.id] || 'absent';
                return (
                  <tr key={st.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {st.full_name}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      {st.email}
                    </td>

                    <td className="py-3.5 px-4">
                      {st.college_name || 'PSG Tech'}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={currentStatus} />
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                      <button
                        onClick={() => handleStatusChange(st.id, 'present')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Present
                      </button>

                      <button
                        onClick={() => handleStatusChange(st.id, 'absent')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          currentStatus === 'absent'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Absent
                      </button>

                      <button
                        onClick={() => handleStatusChange(st.id, 'excused')}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                          currentStatus === 'excused'
                            ? 'bg-amber-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        Excused
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
