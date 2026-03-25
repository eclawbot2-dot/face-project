'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Users, CalendarDays, ClipboardList, Plus, Trash2, Edit, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { formatDate, formatTime, gradeLevelLabel, attendanceStatusLabel, DAYS_OF_WEEK, GRADE_LEVELS, PROGRAMS } from '@/lib/utils';
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

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
}

interface Catechist {
  id: string;
  user: { name: string; email: string };
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
  const [showDeleteClassDialog, setShowDeleteClassDialog] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // Edit class modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '', gradeLevel: '', program: '', room: '', dayOfWeek: '', startTime: '', endTime: '', academicYear: '2025-2026',
  });
  const [editSaving, setEditSaving] = useState(false);

  // Add student modal
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [addStudentSaving, setAddStudentSaving] = useState(false);

  // Add catechist modal
  const [showAddCatechistModal, setShowAddCatechistModal] = useState(false);
  const [allCatechists, setAllCatechists] = useState<Catechist[]>([]);
  const [selectedCatechistId, setSelectedCatechistId] = useState('');
  const [addCatechistSaving, setAddCatechistSaving] = useState(false);
  const [removeCatechistId, setRemoveCatechistId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/classes/${id}`);
    if (!res.ok) { router.push('/classes'); return; }
    const data = await res.json();
    setCls(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const openEditModal = () => {
    if (!cls) return;
    setEditForm({
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      program: cls.program,
      room: cls.room || '',
      dayOfWeek: cls.dayOfWeek || '',
      startTime: cls.startTime || '',
      endTime: cls.endTime || '',
      academicYear: cls.academicYear,
    });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    setEditSaving(true);
    const res = await fetch(`/api/classes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setShowEditModal(false);
      setSaveMsg('Class updated!');
      setTimeout(() => setSaveMsg(''), 2500);
      load();
    }
    setEditSaving(false);
  };

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
    setSaveMsg('Student removed');
    setTimeout(() => setSaveMsg(''), 2000);
    load();
  };

  const deleteClass = async () => {
    await fetch(`/api/classes/${id}`, { method: 'DELETE' });
    router.push('/classes');
  };

  const openAddStudent = async () => {
    const res = await fetch('/api/students');
    const data = await res.json();
    const enrolled = cls?.enrollments.map(e => e.student.id) || [];
    setAllStudents((Array.isArray(data) ? data : []).filter((s: Student) => !enrolled.includes(s.id)));
    setSelectedStudentId('');
    setShowAddStudentModal(true);
  };

  const addStudent = async () => {
    if (!selectedStudentId) return;
    setAddStudentSaving(true);
    await fetch(`/api/classes/${id}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: selectedStudentId }),
    });
    setShowAddStudentModal(false);
    setSelectedStudentId('');
    setAddStudentSaving(false);
    setSaveMsg('Student added!');
    setTimeout(() => setSaveMsg(''), 2000);
    load();
  };

  const openAddCatechist = async () => {
    const res = await fetch('/api/catechists');
    const data = await res.json();
    const assigned = cls?.catechists.map(c => c.catechist.id) || [];
    setAllCatechists((Array.isArray(data) ? data : []).filter((c: Catechist) => !assigned.includes(c.id)));
    setSelectedCatechistId('');
    setShowAddCatechistModal(true);
  };

  const addCatechist = async () => {
    if (!selectedCatechistId) return;
    setAddCatechistSaving(true);
    await fetch(`/api/classes/${id}/catechists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ catechistId: selectedCatechistId, isPrimary: cls?.catechists.length === 0 }),
    });
    setShowAddCatechistModal(false);
    setSelectedCatechistId('');
    setAddCatechistSaving(false);
    setSaveMsg('Catechist added!');
    setTimeout(() => setSaveMsg(''), 2000);
    load();
  };

  const removeCatechist = async (catechistId: string) => {
    await fetch(`/api/classes/${id}/catechists?catechistId=${catechistId}`, { method: 'DELETE' });
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
        <div className="flex items-center gap-2">
          {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
          <button onClick={openEditModal} className="btn-secondary flex items-center gap-2 text-sm">
            <Edit className="w-4 h-4" /> Edit Class
          </button>
          <Link href={`/attendance?classId=${id}`} className="btn-gold flex items-center gap-2 text-sm">
            <ClipboardList className="w-4 h-4" /> Take Attendance
          </Link>
        </div>
      </div>

      {/* Class info strip */}
      <div className="card py-4">
        <div className="flex flex-wrap gap-6 text-sm">
          {cls.room && <div><span className="text-gray-400">Room:</span> <span className="font-medium">{cls.room}</span></div>}
          {cls.dayOfWeek && <div><span className="text-gray-400">Day:</span> <span className="font-medium">{cls.dayOfWeek}</span></div>}
          {cls.startTime && <div><span className="text-gray-400">Time:</span> <span className="font-medium">{formatTime(cls.startTime)}{cls.endTime ? ` – ${formatTime(cls.endTime)}` : ''}</span></div>}
          <div><span className="text-gray-400">Students:</span> <span className="font-medium">{cls.enrollments.length}</span></div>
          <div><span className="text-gray-400">Sessions:</span> <span className="font-medium">{cls.sessions.length}</span></div>
          <button
            onClick={() => setShowDeleteClassDialog(true)}
            className="ml-auto text-red-500 hover:text-red-700 text-xs flex items-center gap-1 hover:underline"
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete Class
          </button>
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
            <button onClick={openAddStudent} className="btn-primary flex items-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" /> Add Student
            </button>
          </div>
          {cls.enrollments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p>No students enrolled</p>
              <button onClick={openAddStudent} className="btn-primary mt-3 text-sm">Add First Student</button>
            </div>
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2"><Users className="w-4 h-4" /> Assigned Catechists</h2>
            <button onClick={openAddCatechist} className="btn-primary flex items-center gap-2 text-sm">
              <UserPlus className="w-4 h-4" /> Add Catechist
            </button>
          </div>
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
                  <div className="flex items-center gap-2">
                    {cc.isPrimary && <span className="badge badge-gold">Primary</span>}
                    <button
                      onClick={() => setRemoveCatechistId(cc.catechist.id)}
                      className="text-gray-300 hover:text-red-500 p-1"
                      title="Remove catechist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Class Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Class" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Class Name *</label>
              <input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">Academic Year *</label>
              <input value={editForm.academicYear} onChange={e => setEditForm({ ...editForm, academicYear: e.target.value })} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Grade Level *</label>
              <select value={editForm.gradeLevel} onChange={e => setEditForm({ ...editForm, gradeLevel: e.target.value })} className="form-select">
                <option value="">Select grade</option>
                {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Program *</label>
              <select value={editForm.program} onChange={e => setEditForm({ ...editForm, program: e.target.value })} className="form-select">
                <option value="">Select program</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Day of Week</label>
              <select value={editForm.dayOfWeek} onChange={e => setEditForm({ ...editForm, dayOfWeek: e.target.value })} className="form-select">
                <option value="">Select day</option>
                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Start Time</label>
              <input type="time" value={editForm.startTime} onChange={e => setEditForm({ ...editForm, startTime: e.target.value })} className="form-input" />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input type="time" value={editForm.endTime} onChange={e => setEditForm({ ...editForm, endTime: e.target.value })} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Room</label>
            <input value={editForm.room} onChange={e => setEditForm({ ...editForm, room: e.target.value })} className="form-input" />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={saveEdit} disabled={editSaving} className="btn-primary">{editSaving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </Modal>

      {/* Add Student Modal */}
      <Modal open={showAddStudentModal} onClose={() => setShowAddStudentModal(false)} title="Add Student to Class" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Select Student</label>
            <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} className="form-select">
              <option value="">Choose a student...</option>
              {allStudents.map(s => (
                <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({gradeLevelLabel(s.gradeLevel)})</option>
              ))}
            </select>
          </div>
          {allStudents.length === 0 && <p className="text-sm text-gray-400">All students are already enrolled in this class.</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowAddStudentModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={addStudent} disabled={addStudentSaving || !selectedStudentId} className="btn-primary">
              {addStudentSaving ? 'Adding...' : 'Add Student'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Catechist Modal */}
      <Modal open={showAddCatechistModal} onClose={() => setShowAddCatechistModal(false)} title="Add Catechist to Class" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Select Catechist</label>
            <select value={selectedCatechistId} onChange={e => setSelectedCatechistId(e.target.value)} className="form-select">
              <option value="">Choose a catechist...</option>
              {allCatechists.map(c => (
                <option key={c.id} value={c.id}>{c.user.name} ({c.user.email})</option>
              ))}
            </select>
          </div>
          {allCatechists.length === 0 && <p className="text-sm text-gray-400">All catechists are already assigned to this class.</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowAddCatechistModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={addCatechist} disabled={addCatechistSaving || !selectedCatechistId} className="btn-primary">
              {addCatechistSaving ? 'Adding...' : 'Add Catechist'}
            </button>
          </div>
        </div>
      </Modal>

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

      <ConfirmDialog
        open={!!removeCatechistId}
        onClose={() => setRemoveCatechistId(null)}
        onConfirm={() => removeCatechistId && removeCatechist(removeCatechistId)}
        title="Remove Catechist"
        message="Remove this catechist from the class?"
        confirmLabel="Remove"
        danger
      />

      <ConfirmDialog
        open={showDeleteClassDialog}
        onClose={() => setShowDeleteClassDialog(false)}
        onConfirm={deleteClass}
        title="Delete Class"
        message="This will deactivate the class. Sessions and records will be preserved. Continue?"
        confirmLabel="Delete Class"
        danger
      />
    </div>
  );
}
