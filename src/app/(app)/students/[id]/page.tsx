'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, User, BookOpen, Shield, Clock, Edit, Trash2, Plus, X, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { formatDate, gradeLevelLabel, attendanceStatusLabel, GRADE_LEVELS, SACRAMENT_TYPES } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const editSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  gradeLevel: z.string().min(1),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
type EditForm = z.infer<typeof editSchema>;

const sacramentSchema = z.object({
  sacramentType: z.string().min(1),
  status: z.string().min(1),
  startDate: z.string().optional().nullable(),
  completionDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});
type SacramentForm = z.infer<typeof sacramentSchema>;

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  dateOfBirth?: string;
  address?: string;
  notes?: string;
  active: boolean;
  parents: Array<{ relationship: string; user: { id: string; name: string; email: string; phone?: string } }>;
  enrollments: Array<{ class: { id: string; name: string; program: string } }>;
  sacraments: Array<{ id: string; sacramentType: string; status: string; startDate?: string; completionDate?: string; notes?: string }>;
  attendance: Array<{ id: string; status: string; session: { id: string; date: string; class: { name: string } }; notes?: string }>;
}

interface ClassOption {
  id: string;
  name: string;
  program: string;
}

interface ParentUser {
  id: string;
  name: string;
  email: string;
}

const statusColors: Record<string, string> = {
  COMPLETED: 'badge-green',
  IN_PROGRESS: 'badge-gold',
  NOT_STARTED: 'badge-gray',
  NOT_APPLICABLE: 'badge-gray',
};

const attendanceColors: Record<string, string> = {
  PRESENT: 'badge-green',
  LATE: 'badge-gold',
  EXCUSED: 'badge-blue',
  ABSENT: 'badge-red',
};

const SACRAMENT_STATUSES = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
];

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveMsg, setSaveMsg] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [showSacramentModal, setShowSacramentModal] = useState(false);
  const [sacSaving, setSacSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'sacraments'>('info');
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  // Class enrollment
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [availableClasses, setAvailableClasses] = useState<ClassOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [enrollSaving, setEnrollSaving] = useState(false);
  const [removeClassId, setRemoveClassId] = useState<string | null>(null);

  // Parent management
  const [showAddParentModal, setShowAddParentModal] = useState(false);
  const [parentUsers, setParentUsers] = useState<ParentUser[]>([]);
  const [selectedParentId, setSelectedParentId] = useState('');
  const [parentRelationship, setParentRelationship] = useState('Parent');
  const [addParentSaving, setAddParentSaving] = useState(false);
  const [removeParentId, setRemoveParentId] = useState<string | null>(null);
  // New parent creation inline
  const [parentAddMode, setParentAddMode] = useState<'existing' | 'new'>('existing');
  const [newParentForm, setNewParentForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [newParentError, setNewParentError] = useState('');

  const { register: registerEdit, handleSubmit: handleEditSubmit, reset: resetEdit, formState: { errors: editErrors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });
  const sacForm = useForm<SacramentForm>({ resolver: zodResolver(sacramentSchema) });

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/students/${id}`);
    if (!res.ok) { router.push('/students'); return; }
    const data = await res.json();
    setStudent(data);
    resetEdit({
      firstName: data.firstName,
      lastName: data.lastName,
      gradeLevel: data.gradeLevel,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
      address: data.address || '',
      notes: data.notes || '',
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const onSave = async (data: EditForm) => {
    setEditSaving(true);
    const res = await fetch(`/api/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowEditModal(false);
      setSaveMsg('Saved!');
      setTimeout(() => setSaveMsg(''), 2500);
      load();
    }
    setEditSaving(false);
  };

  const onSacrament = async (data: SacramentForm) => {
    setSacSaving(true);
    await fetch('/api/sacraments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: id, ...data }),
    });
    setShowSacramentModal(false);
    sacForm.reset();
    setSacSaving(false);
    setSaveMsg('Sacrament updated!');
    setTimeout(() => setSaveMsg(''), 2500);
    load();
  };

  const openEditModal = () => {
    if (!student) return;
    resetEdit({
      firstName: student.firstName,
      lastName: student.lastName,
      gradeLevel: student.gradeLevel,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth).toISOString().split('T')[0] : '',
      address: student.address || '',
      notes: student.notes || '',
    });
    setShowEditModal(true);
  };

  const openAddClass = async () => {
    const res = await fetch('/api/classes');
    const data = await res.json();
    const enrolled = student?.enrollments.map(e => e.class.id) || [];
    setAvailableClasses((Array.isArray(data) ? data : []).filter((c: ClassOption) => !enrolled.includes(c.id)));
    setSelectedClassId('');
    setShowAddClassModal(true);
  };

  const enrollInClass = async () => {
    if (!selectedClassId) return;
    setEnrollSaving(true);
    await fetch(`/api/classes/${selectedClassId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: id }),
    });
    setShowAddClassModal(false);
    setSelectedClassId('');
    setEnrollSaving(false);
    setSaveMsg('Enrolled!');
    setTimeout(() => setSaveMsg(''), 2000);
    load();
  };

  const removeFromClass = async (classId: string) => {
    await fetch(`/api/classes/${classId}/enroll?studentId=${id}`, { method: 'DELETE' });
    setSaveMsg('Removed from class');
    setTimeout(() => setSaveMsg(''), 2000);
    load();
  };

  const openAddParent = async () => {
    const res = await fetch('/api/users');
    const data = await res.json();
    const currentParentIds = student?.parents.map(p => p.user.id) || [];
    setParentUsers(
      (Array.isArray(data) ? data : [])
        .filter((u: any) => u.role === 'PARENT' && u.active && !currentParentIds.includes(u.id))
    );
    setSelectedParentId('');
    setParentRelationship('Parent');
    setParentAddMode('existing');
    setNewParentForm({ name: '', email: '', phone: '', password: '' });
    setNewParentError('');
    setShowAddParentModal(true);
  };

  const addParent = async () => {
    setAddParentSaving(true);
    setNewParentError('');
    try {
      if (parentAddMode === 'new') {
        // Validate
        if (!newParentForm.name || !newParentForm.email || !newParentForm.password) {
          setNewParentError('Name, email, and password are required');
          setAddParentSaving(false);
          return;
        }
        if (newParentForm.password.length < 8) {
          setNewParentError('Password must be at least 8 characters');
          setAddParentSaving(false);
          return;
        }
        // Create the user with PARENT role
        const createRes = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newParentForm.name,
            email: newParentForm.email,
            phone: newParentForm.phone || undefined,
            password: newParentForm.password,
            userRole: 'PARENT',
          }),
        });
        if (!createRes.ok) {
          const err = await createRes.json();
          setNewParentError(err.error || 'Failed to create parent account');
          setAddParentSaving(false);
          return;
        }
        const created = await createRes.json();
        // Link to student
        await fetch(`/api/students/${id}/parents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentUserId: created.id, relationship: parentRelationship }),
        });
      } else {
        if (!selectedParentId) { setAddParentSaving(false); return; }
        await fetch(`/api/students/${id}/parents`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ parentUserId: selectedParentId, relationship: parentRelationship }),
        });
      }
      setShowAddParentModal(false);
      setSaveMsg('Parent added!');
      setTimeout(() => setSaveMsg(''), 2000);
      load();
    } finally {
      setAddParentSaving(false);
    }
  };

  const removeParent = async (parentUserId: string) => {
    await fetch(`/api/students/${id}/parents?parentUserId=${parentUserId}`, { method: 'DELETE' });
    setSaveMsg('Parent removed');
    setTimeout(() => setSaveMsg(''), 2000);
    load();
  };

  const deactivateStudent = async () => {
    await fetch(`/api/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: false }),
    });
    router.push('/students');
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!student) return null;

  // Attendance stats
  const totalAttendance = student.attendance.length;
  const presentCount = student.attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
  const absentCount = student.attendance.filter(a => a.status === 'ABSENT').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/students" className="text-gray-400 hover:text-[#1e3a5f]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">{student.firstName} {student.lastName}</h1>
          <p className="text-gray-500 text-sm">{gradeLevelLabel(student.gradeLevel)}</p>
        </div>
        <div className="flex items-center gap-2">
          {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
          {!student.active && <span className="badge badge-red">Inactive</span>}
          <button onClick={openEditModal} className="btn-secondary flex items-center gap-2 text-sm">
            <Edit className="w-4 h-4" /> Edit
          </button>
          {student.active && (
            <button onClick={() => setShowDeactivateDialog(true)} className="btn-secondary text-red-600 border-red-200 hover:bg-red-50 flex items-center gap-2 text-sm">
              <Trash2 className="w-4 h-4" /> Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {(['info', 'attendance', 'sacraments'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Student Info Card (read-only display) */}
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2"><User className="w-4 h-4" /> Student Information</h2>
                <button onClick={openEditModal} className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1">
                  <Edit className="w-3.5 h-3.5" /> Edit
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-400">First Name:</span> <span className="font-medium ml-1">{student.firstName}</span></div>
                <div><span className="text-gray-400">Last Name:</span> <span className="font-medium ml-1">{student.lastName}</span></div>
                <div><span className="text-gray-400">Grade:</span> <span className="font-medium ml-1">{gradeLevelLabel(student.gradeLevel)}</span></div>
                <div><span className="text-gray-400">DOB:</span> <span className="font-medium ml-1">{student.dateOfBirth ? formatDate(student.dateOfBirth) : '—'}</span></div>
                <div className="col-span-2"><span className="text-gray-400">Address:</span> <span className="font-medium ml-1">{student.address || '—'}</span></div>
                {student.notes && <div className="col-span-2"><span className="text-gray-400">Notes:</span> <span className="text-gray-600 ml-1">{student.notes}</span></div>}
              </div>
            </div>

            {/* Attendance Summary */}
            {totalAttendance > 0 && (
              <div className="card">
                <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2 mb-3"><Clock className="w-4 h-4" /> Attendance Summary</h2>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xl font-bold text-gray-800">{totalAttendance}</div>
                    <div className="text-xs text-gray-500">Sessions</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3">
                    <div className="text-xl font-bold text-green-700">{presentCount}</div>
                    <div className="text-xs text-gray-500">Present</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3">
                    <div className="text-xl font-bold text-red-600">{absentCount}</div>
                    <div className="text-xs text-gray-500">Absent</div>
                  </div>
                  <div className={`rounded-xl p-3 ${attendanceRate >= 80 ? 'bg-green-50' : attendanceRate >= 60 ? 'bg-yellow-50' : 'bg-red-50'}`}>
                    <div className={`text-xl font-bold ${attendanceRate >= 80 ? 'text-green-700' : attendanceRate >= 60 ? 'text-yellow-700' : 'text-red-600'}`}>{attendanceRate}%</div>
                    <div className="text-xs text-gray-500">Rate</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Parents/Guardians */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2"><User className="w-4 h-4" /> Parents/Guardians</h2>
                <button onClick={openAddParent} className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {student.parents.length === 0 ? (
                <p className="text-gray-400 text-sm">No parents linked</p>
              ) : (
                <div className="space-y-3">
                  {student.parents.map((p, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div className="text-sm">
                        <div className="font-medium text-gray-800">{p.user.name}</div>
                        <div className="text-gray-500">{p.relationship}</div>
                        <div className="text-gray-400">{p.user.email}</div>
                        {p.user.phone && <div className="text-gray-400">{p.user.phone}</div>}
                      </div>
                      <button
                        onClick={() => setRemoveParentId(p.user.id)}
                        className="text-gray-300 hover:text-red-500 p-1"
                        title="Remove parent"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enrolled Classes */}
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2"><BookOpen className="w-4 h-4" /> Enrolled Classes</h2>
                <button onClick={openAddClass} className="text-xs text-[#1e3a5f] hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </div>
              {student.enrollments.length === 0 ? (
                <p className="text-gray-400 text-sm">Not enrolled in any class</p>
              ) : (
                <div className="space-y-2">
                  {student.enrollments.map((e, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <Link href={`/classes/${e.class.id}`} className="font-medium text-[#1e3a5f] hover:underline text-sm">{e.class.name}</Link>
                        <div className="text-xs text-gray-400">{e.class.program}</div>
                      </div>
                      <button
                        onClick={() => setRemoveClassId(e.class.id)}
                        className="text-gray-300 hover:text-red-500 p-1"
                        title="Remove from class"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="card">
          <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2 mb-4"><Clock className="w-4 h-4" /> Attendance History</h2>
          {student.attendance.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No attendance records</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="table-header">Date</th>
                    <th className="table-header">Class</th>
                    <th className="table-header">Status</th>
                    <th className="table-header">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {student.attendance.map(a => (
                    <tr key={a.id}>
                      <td className="table-cell">{formatDate(a.session.date)}</td>
                      <td className="table-cell">{a.session.class.name}</td>
                      <td className="table-cell">
                        <span className={`badge ${attendanceColors[a.status] || 'badge-gray'}`}>{attendanceStatusLabel(a.status)}</span>
                      </td>
                      <td className="table-cell text-gray-400">{a.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'sacraments' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2"><Shield className="w-4 h-4" /> Sacramental Progress</h2>
            <button onClick={() => { sacForm.reset(); setShowSacramentModal(true); }} className="btn-primary text-sm">Update Sacrament</button>
          </div>
          {student.sacraments.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">No sacrament records</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {student.sacraments.map(s => (
                <div key={s.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-800">{s.sacramentType}</h3>
                    <select
                      value={s.status}
                      onChange={async (e) => {
                        await fetch('/api/sacraments', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ studentId: id, sacramentType: s.sacramentType, status: e.target.value }),
                        });
                        load();
                      }}
                      className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                    >
                      {SACRAMENT_STATUSES.map(st => (
                        <option key={st.value} value={st.value}>{st.label}</option>
                      ))}
                    </select>
                  </div>
                  <span className={`badge ${statusColors[s.status] || 'badge-gray'} text-xs`}>{s.status.replace('_', ' ')}</span>
                  {s.startDate && <div className="text-xs text-gray-500 mt-2">Started: {formatDate(s.startDate)}</div>}
                  {s.completionDate && <div className="text-xs text-gray-500">Completed: {formatDate(s.completionDate)}</div>}
                  {s.notes && <div className="text-xs text-gray-400 mt-2">{s.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Student" size="lg">
        <form onSubmit={handleEditSubmit(onSave)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name *</label>
              <input {...registerEdit('firstName')} className="form-input" />
              {editErrors.firstName && <p className="text-red-500 text-xs mt-1">{editErrors.firstName.message}</p>}
            </div>
            <div>
              <label className="form-label">Last Name *</label>
              <input {...registerEdit('lastName')} className="form-input" />
              {editErrors.lastName && <p className="text-red-500 text-xs mt-1">{editErrors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Grade Level *</label>
              <select {...registerEdit('gradeLevel')} className="form-select">
                {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Date of Birth</label>
              <input type="date" {...registerEdit('dateOfBirth')} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Address</label>
            <input {...registerEdit('address')} className="form-input" />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea {...registerEdit('notes')} className="form-input" rows={3} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={editSaving} className="btn-primary">{editSaving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Add to Class Modal */}
      <Modal open={showAddClassModal} onClose={() => setShowAddClassModal(false)} title="Add to Class" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">Select Class</label>
            <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} className="form-select">
              <option value="">Choose a class...</option>
              {availableClasses.map(c => (
                <option key={c.id} value={c.id}>{c.name} — {c.program}</option>
              ))}
            </select>
          </div>
          {availableClasses.length === 0 && <p className="text-sm text-gray-400">Student is already enrolled in all available classes.</p>}
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowAddClassModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={enrollInClass} disabled={enrollSaving || !selectedClassId} className="btn-primary">
              {enrollSaving ? 'Enrolling...' : 'Enroll'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Parent Modal */}
      <Modal open={showAddParentModal} onClose={() => setShowAddParentModal(false)} title="Add Parent/Guardian" size="md">
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
            <button
              onClick={() => { setParentAddMode('existing'); setNewParentError(''); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${parentAddMode === 'existing' ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Existing Account
            </button>
            <button
              onClick={() => { setParentAddMode('new'); setNewParentError(''); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${parentAddMode === 'new' ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Create New
            </button>
          </div>

          {newParentError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{newParentError}</div>}

          {parentAddMode === 'existing' ? (
            <div>
              <label className="form-label">Parent Account</label>
              <select value={selectedParentId} onChange={e => setSelectedParentId(e.target.value)} className="form-select">
                <option value="">Choose a parent...</option>
                {parentUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
              {parentUsers.length === 0 && <p className="text-xs text-gray-400 mt-1">No available parent accounts. Use "Create New" to add one.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" placeholder="Jane Smith" value={newParentForm.name} onChange={e => setNewParentForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input className="form-input" placeholder="(555) 123-4567" value={newParentForm.phone} onChange={e => setNewParentForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" placeholder="parent@example.com" value={newParentForm.email} onChange={e => setNewParentForm(f => ({ ...f, email: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Password *</label>
                <input type="password" className="form-input" placeholder="Minimum 8 characters" value={newParentForm.password} onChange={e => setNewParentForm(f => ({ ...f, password: e.target.value }))} />
                <p className="text-xs text-gray-400 mt-1">They can change this later via their profile.</p>
              </div>
            </div>
          )}

          <div>
            <label className="form-label">Relationship</label>
            <select value={parentRelationship} onChange={e => setParentRelationship(e.target.value)} className="form-select">
              <option value="Parent">Parent</option>
              <option value="Guardian">Guardian</option>
              <option value="Grandparent">Grandparent</option>
              <option value="Step-Parent">Step-Parent</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowAddParentModal(false)} className="btn-secondary">Cancel</button>
            <button
              onClick={addParent}
              disabled={addParentSaving || (parentAddMode === 'existing' && !selectedParentId)}
              className="btn-primary"
            >
              {addParentSaving ? 'Adding...' : parentAddMode === 'new' ? 'Create & Add Parent' : 'Add Parent'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Sacrament Modal */}
      <Modal open={showSacramentModal} onClose={() => setShowSacramentModal(false)} title="Update Sacrament">
        <form onSubmit={sacForm.handleSubmit(onSacrament)} className="space-y-4">
          <div>
            <label className="form-label">Sacrament Type</label>
            <select {...sacForm.register('sacramentType')} className="form-select">
              <option value="">Select...</option>
              {SACRAMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select {...sacForm.register('status')} className="form-select">
              {SACRAMENT_STATUSES.map(st => (
                <option key={st.value} value={st.value}>{st.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date</label>
              <input type="date" {...sacForm.register('startDate')} className="form-input" />
            </div>
            <div>
              <label className="form-label">Completion Date</label>
              <input type="date" {...sacForm.register('completionDate')} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea {...sacForm.register('notes')} className="form-input" rows={2} />
          </div>
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={() => setShowSacramentModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={sacSaving} className="btn-primary">{sacSaving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!removeClassId}
        onClose={() => setRemoveClassId(null)}
        onConfirm={() => removeClassId && removeFromClass(removeClassId)}
        title="Remove from Class"
        message="Remove this student from the class? They can be re-enrolled later."
        confirmLabel="Remove"
        danger
      />

      <ConfirmDialog
        open={!!removeParentId}
        onClose={() => setRemoveParentId(null)}
        onConfirm={() => removeParentId && removeParent(removeParentId)}
        title="Remove Parent"
        message="Remove this parent/guardian link from the student?"
        confirmLabel="Remove"
        danger
      />

      <ConfirmDialog
        open={showDeactivateDialog}
        onClose={() => setShowDeactivateDialog(false)}
        onConfirm={deactivateStudent}
        title="Deactivate Student"
        message="This student will be marked inactive and hidden from most views. You can reactivate them later."
        confirmLabel="Deactivate"
        danger
      />
    </div>
  );
}
