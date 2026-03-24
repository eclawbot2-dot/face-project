'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, MinusCircle, Save, ChevronDown } from 'lucide-react';
import { formatDate, gradeLevelLabel, attendanceStatusLabel } from '@/lib/utils';
import Link from 'next/link';

interface ClassItem {
  id: string;
  name: string;
  program: string;
  gradeLevel: string;
  enrollments: Array<{ student: { id: string; firstName: string; lastName: string } }>;
}

interface Session {
  id: string;
  date: string;
  topic?: string;
  classId: string;
  class: { name: string };
  attendance: Array<{ studentId: string; status: string; notes?: string }>;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';

const statusIcon: Record<AttendanceStatus, React.ReactNode> = {
  PRESENT: <CheckCircle2 className="w-5 h-5 text-green-500" />,
  ABSENT: <XCircle className="w-5 h-5 text-red-500" />,
  EXCUSED: <MinusCircle className="w-5 h-5 text-blue-500" />,
  LATE: <Clock className="w-5 h-5 text-yellow-500" />,
};

const statusOrder: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'];

function AttendancePage() {
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId') || '';
  const preselectedSessionId = searchParams.get('sessionId') || '';

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState(preselectedSessionId);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<'take' | 'history'>('take');

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(d => setClasses(Array.isArray(d) ? d : []));
  }, []);

  useEffect(() => {
    if (!selectedClassId) { setSessions([]); return; }
    fetch(`/api/sessions?classId=${selectedClassId}`).then(r => r.json()).then(d => setSessions(Array.isArray(d) ? d : []));
  }, [selectedClassId]);

  useEffect(() => {
    if (!selectedSessionId) { setSelectedSession(null); setAttendance({}); return; }
    const s = sessions.find(s => s.id === selectedSessionId);
    if (s) {
      setSelectedSession(s);
      const init: Record<string, AttendanceStatus> = {};
      const cls = classes.find(c => c.id === s.classId);
      if (cls) {
        cls.enrollments.forEach(e => { init[e.student.id] = 'PRESENT'; });
      }
      s.attendance.forEach(a => { init[a.studentId] = a.status as AttendanceStatus; });
      setAttendance(init);
    }
  }, [selectedSessionId, sessions, classes]);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const cycleStatus = (studentId: string) => {
    const current = attendance[studentId] || 'PRESENT';
    const idx = statusOrder.indexOf(current);
    const next = statusOrder[(idx + 1) % statusOrder.length];
    setAttendance(prev => ({ ...prev, [studentId]: next }));
  };

  const setAll = (status: AttendanceStatus) => {
    const updated = { ...attendance };
    Object.keys(updated).forEach(k => { updated[k] = status; });
    setAttendance(updated);
  };

  const saveAttendance = async () => {
    if (!selectedSessionId) return;
    setSaving(true);
    const records = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
    await fetch(`/api/sessions/${selectedSessionId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'PRESENT' || s === 'LATE').length;
  const totalCount = Object.keys(attendance).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Track student attendance by class session</p>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['take', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'take' ? 'Take Attendance' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'take' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Select Class</label>
              <select className="form-select" value={selectedClassId} onChange={e => { setSelectedClassId(e.target.value); setSelectedSessionId(''); }}>
                <option value="">Choose a class...</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Select Session</label>
              <select className="form-select" value={selectedSessionId} onChange={e => setSelectedSessionId(e.target.value)} disabled={!selectedClassId}>
                <option value="">Choose a session...</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{formatDate(s.date)}{s.topic ? ` — ${s.topic}` : ''}</option>)}
              </select>
            </div>
          </div>

          {selectedSession && selectedClass && (
            <div className="card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="font-bold text-[#1e3a5f]">{selectedClass.name}</h2>
                  <p className="text-sm text-gray-500">{formatDate(selectedSession.date)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">{presentCount}/{totalCount} present</span>
                  <div className="flex gap-1">
                    <button onClick={() => setAll('PRESENT')} className="text-xs btn-secondary py-1 px-2">All Present</button>
                    <button onClick={() => setAll('ABSENT')} className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">All Absent</button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {selectedClass.enrollments.map(e => {
                  const status = attendance[e.student.id] || 'PRESENT';
                  return (
                    <div
                      key={e.student.id}
                      onClick={() => cycleStatus(e.student.id)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors select-none ${
                        status === 'PRESENT' ? 'bg-green-50 hover:bg-green-100' :
                        status === 'ABSENT' ? 'bg-red-50 hover:bg-red-100' :
                        status === 'EXCUSED' ? 'bg-blue-50 hover:bg-blue-100' :
                        'bg-yellow-50 hover:bg-yellow-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold">
                          {e.student.firstName[0]}{e.student.lastName[0]}
                        </div>
                        <span className="font-medium text-gray-800">{e.student.firstName} {e.student.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 hidden sm:block">{attendanceStatusLabel(status)}</span>
                        {statusIcon[status]}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <button onClick={saveAttendance} disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Attendance'}
                </button>
                {saved && <span className="text-green-600 text-sm">✓ Saved!</span>}
              </div>
            </div>
          )}

          {!selectedSessionId && selectedClassId && sessions.length === 0 && (
            <div className="card text-center py-8 text-gray-400">
              <p className="mb-3">No sessions for this class yet.</p>
              <Link href={`/classes/${selectedClassId}`} className="btn-primary text-sm">Create a Session</Link>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <select className="form-select max-w-xs" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {sessions.length === 0 ? (
            <div className="p-8 text-center text-gray-400">No sessions found</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Date</th>
                  <th className="table-header hidden sm:table-cell">Class</th>
                  <th className="table-header hidden sm:table-cell">Topic</th>
                  <th className="table-header">Attendance</th>
                  <th className="table-header w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.map(s => {
                  const total = s.attendance.length;
                  const present = s.attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
                  const rate = total > 0 ? Math.round((present / total) * 100) : null;
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="table-cell">{formatDate(s.date)}</td>
                      <td className="table-cell hidden sm:table-cell">{s.class?.name || '—'}</td>
                      <td className="table-cell hidden sm:table-cell text-gray-400">{(s as any).topic || '—'}</td>
                      <td className="table-cell">
                        {rate !== null ? (
                          <span className={`badge ${rate >= 80 ? 'badge-green' : rate >= 60 ? 'badge-gold' : 'badge-red'}`}>
                            {present}/{total} ({rate}%)
                          </span>
                        ) : <span className="text-gray-400">No records</span>}
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => { setTab('take'); setSelectedSessionId(s.id); setSelectedClassId(s.classId); }}
                          className="text-xs text-[#1e3a5f] hover:underline"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function AttendancePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <AttendancePage />
    </Suspense>
  );
}
