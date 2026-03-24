'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Save, User, BookOpen, Shield, Clock } from 'lucide-react';
import Link from 'next/link';
import { formatDate, gradeLevelLabel, attendanceStatusLabel, GRADE_LEVELS, SACRAMENT_TYPES } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';

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
  parents: Array<{ relationship: string; user: { name: string; email: string; phone?: string } }>;
  enrollments: Array<{ class: { id: string; name: string; program: string } }>;
  sacraments: Array<{ id: string; sacramentType: string; status: string; startDate?: string; completionDate?: string; notes?: string }>;
  attendance: Array<{ id: string; status: string; session: { id: string; date: string; class: { name: string } }; notes?: string }>;
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

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showSacramentModal, setShowSacramentModal] = useState(false);
  const [sacSaving, setSacSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'sacraments'>('info');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EditForm>({
    resolver: zodResolver(editSchema),
  });
  const sacForm = useForm<SacramentForm>({ resolver: zodResolver(sacramentSchema) });

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/students/${id}`);
    if (!res.ok) { router.push('/students'); return; }
    const data = await res.json();
    setStudent(data);
    reset({
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
    setSaving(true);
    await fetch(`/api/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
    setSaving(false);
    load();
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
    load();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!student) return null;

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
        {!student.active && <span className="badge badge-red">Inactive</span>}
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
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSave)} className="card space-y-4">
              <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2"><User className="w-4 h-4" /> Student Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">First Name</label>
                  <input {...register('firstName')} className="form-input" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input {...register('lastName')} className="form-input" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Grade Level</label>
                  <select {...register('gradeLevel')} className="form-select">
                    {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input type="date" {...register('dateOfBirth')} className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">Address</label>
                <input {...register('address')} className="form-input" />
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea {...register('notes')} className="form-input" rows={3} />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
                {saveMsg && <span className="text-green-600 text-sm">{saveMsg}</span>}
              </div>
            </form>
          </div>

          <div className="space-y-4">
            <div className="card">
              <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2 mb-3"><User className="w-4 h-4" /> Parents/Guardians</h2>
              {student.parents.length === 0 ? (
                <p className="text-gray-400 text-sm">No parents linked</p>
              ) : (
                <div className="space-y-3">
                  {student.parents.map((p, i) => (
                    <div key={i} className="text-sm">
                      <div className="font-medium text-gray-800">{p.user.name}</div>
                      <div className="text-gray-500">{p.relationship}</div>
                      <div className="text-gray-400">{p.user.email}</div>
                      {p.user.phone && <div className="text-gray-400">{p.user.phone}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card">
              <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2 mb-3"><BookOpen className="w-4 h-4" /> Enrolled Classes</h2>
              {student.enrollments.length === 0 ? (
                <p className="text-gray-400 text-sm">Not enrolled in any class</p>
              ) : (
                <div className="space-y-2">
                  {student.enrollments.map((e, i) => (
                    <div key={i}>
                      <Link href={`/classes/${e.class.id}`} className="font-medium text-[#1e3a5f] hover:underline text-sm">{e.class.name}</Link>
                      <div className="text-xs text-gray-400">{e.class.program}</div>
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
                    <span className={`badge ${statusColors[s.status] || 'badge-gray'}`}>{s.status.replace('_', ' ')}</span>
                  </div>
                  {s.startDate && <div className="text-xs text-gray-500">Started: {formatDate(s.startDate)}</div>}
                  {s.completionDate && <div className="text-xs text-gray-500">Completed: {formatDate(s.completionDate)}</div>}
                  {s.notes && <div className="text-xs text-gray-400 mt-2">{s.notes}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="NOT_APPLICABLE">Not Applicable</option>
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
    </div>
  );
}
