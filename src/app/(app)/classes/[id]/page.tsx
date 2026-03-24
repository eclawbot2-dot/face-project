'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, CalendarDays, ClipboardList, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatTime, gradeLevelLabel, attendanceStatusLabel } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface ClassDetail {
  id: string;
  name: string;
  gradeLevel: string;
  program: string;
  room?: string;
  dayOfWeek?: string;
  startTime?: string;
  endTime?: string;
  academicYear: string;
  active: boolean;
  catechists: Array<{ catechist: { id: string; user: { name: string; email: string } }; isPrimary: boolean }>;
  enrollments: Array<{ student: { id: string; firstName: string; lastName: string; gradeLevel: string; sacraments: { status: string; sacramentType: string }[] } }>;
  sessions: Array<{ id: string; date: string; topic?: string; attendance: { id: string; status: string }[] }>;
}

const statusColors: Record<string, string> = {
  PRESENT: 'badge-green',
  LATE: 'badge-gold',
  EXCUSED: 'badge-blue',
  ABSENT: 'badge-red',
};

export default function ClassDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [cls, setCls] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'sessions' | 'catechists'>('students');
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionSaving, setSessionSaving] = useState(false);
  const [removeStudentId, setRemoveStudentId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/classes/${id}`);
    if (!res.ok) { router.push('/classes'); return; }
    const data = await res.json();
    setCls(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const createSession = async () => {
    if (!sessionDate) return;
    setSessionSaving(true);
    await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classId: id, date: sessionDate, topic: sessionTopic }),
    });
    setShowSessionModal(false);
    setSessionDate('');
    setSessionTopic('');
    setSessionSaving(false);
    load();
  };

  const removeStudent = async (studentId: string) => {
    await fetch(`/api/classes/${id}/enroll?studentId=${studentId}`, { method: 'DELETE' });
    load();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!cls) return null;

  const attendanceRate = (session: ClassDetail['sessions'][0]) => {
    const total = session.attendance.length;
    if (!total) return null;
    const present = session.attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
    return Math.round((present / total) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/classes" className="text-gray-400 hover:text-[#1e3a5f]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">{cls.name}</h1>
          <p className="text-gray-500 text-sm">{cls.program} · {gradeLevelLabel(cls.gradeLevel)} · {cls.academicYear}</p>
        </div>
        <Link href={`/attendance?classId=${id}`} className="btn-gold flex items-center gap-2">
          <ClipboardList className="w-4 h-4" /> Take Attendance
        </Link>
      </div>

      {/* Class info strip */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-6 text-sm">
          {cls.room && <div><span className="text-gray-400">Room:</span> <span className="font-medium">{cls.room}</span></div>}
          {cls.dayOfWeek && <div><span className="text-gray-400">Day:</span> <span className="font-medium">{cls.dayOfWeek}</span></div>}
          {cls.startTime && <div><span className="text-gray-400">Time:</span> <span className="font-medium">{formatTime(cls.startTime)}{cls.endTime ? ` – ${formatTime(cls.endTime)}` : ''}</span></div>}
          <div><span className="text-gray-400">Students:</span> <span className="font-medium">{cls.enrollments.length}</span></div>
          <div><span className="text-gray-400">Sessions:</span> <span className="font-medium">{cls.sessions.length}</span></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['students', 'sessions', 'catechists'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'students' && <span className="ml-1 text-xs text-gray-400">({cls.enrollments.length})</span>}
          </button>
        ))}
      </div>

      {activeTab === 'students' && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2"><Users className="w-4 h-4" /> Enrolled Students</h2>
          </div>
          {cls.enrollments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No students enrolled</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Student</th>
                  <th className="table-header hidden sm:table-cell">Grade</th>
                  <th className="table-header hidden md:table-cell">Sacraments</th>
                  <th className="table-header w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {cls.enrollments.map(e => (
                  <tr key={e.student.id} className="hover:bg-gray-50">
                    <td className="table-cell">
                      <Link href={`/students/${e.student.id}`} className="font-medium text-[#1e3a5f] hover:underline">
                        {e.student.firstName} {e.student.lastName}
                      </Link>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className="badge badge-blue">{gradeLevelLabel(e.student.gradeLevel)}</span>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {e.student.sacraments.filter(s => s.status === 'IN_PROGRESS').map((s, i) => (
                          <span key={i} className="badge badge-gold text-xs">{s.sacramentType.split(' ')[0]}</span>
                        ))}
                      </div>
                    </td>
                    <td className="table-cell">
                      <button onClick={() => setRemoveStudentId(e.student.id)} className="text-gray-300 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Session History</h2>
            <button onClick={() => setShowSessionModal(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Session
            </button>
          </div>
          {cls.sessions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No sessions yet</p>
          ) : (
            <div className="space-y-3">
              {cls.sessions.map(s => {
                const rate = attendanceRate(s);
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <div className="font-medium text-gray-800">{formatDate(s.date)}</div>
                      {s.topic && <div className="text-xs text-gray-500">{s.topic}</div>}
                    </div>
                    <div className="flex items-center gap-3">
                      {rate !== null && (
                        <span className={`badge ${rate >= 80 ? 'badge-green' : rate >= 60 ? 'badge-gold' : 'badge-red'}`}>
                          {rate}% attendance
                        </span>
                      )}
                      <Link href={`/attendance?sessionId=${s.id}`} className="text-xs text-[#1e3a5f] hover:underline">
                        View
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'catechists' && (
        <div className="card">
          <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2 mb-4"><Users className="w-4 h-4" /> Assigned Catechists</h2>
          {cls.catechists.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No catechists assigned</p>
          ) : (
            <div className="space-y-3">
              {cls.catechists.map((cc, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <Link href={`/catechists/${cc.catechist.id}`} className="font-medium text-[#1e3a5f] hover:underline">
                      {cc.catechist.user.name}
                    </Link>
                    <div className="text-xs text-gray-400">{cc.catechist.user.email}</div>
                  </div>
                  {cc.isPrimary && <span className="badge badge-gold">Primary</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={showSessionModal} onClose={() => setShowSessionModal(false)} title="New Class Session" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Session Date *</label>
            <input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Topic</label>
            <input type="text" value={sessionTopic} onChange={e => setSessionTopic(e.target.value)} className="form-input" placeholder="Optional topic or lesson" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowSessionModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={createSession} disabled={sessionSaving || !sessionDate} className="btn-primary">
              {sessionSaving ? 'Creating...' : 'Create Session'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeStudentId}
        onClose={() => setRemoveStudentId(null)}
        onConfirm={() => removeStudentId && removeStudent(removeStudentId)}
        title="Remove Student"
        message="Remove this student from the class? They can be re-enrolled later."
        confirmLabel="Remove"
        danger
      />
    </div>
  );
}
