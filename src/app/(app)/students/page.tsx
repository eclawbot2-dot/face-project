'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, GraduationCap, User, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { cn, formatDate, gradeLevelLabel, GRADE_LEVELS } from '@/lib/utils';
import Link from 'next/link';

const studentSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  dateOfBirth: z.string().optional(),
  gradeLevel: z.string().min(1, 'Grade required'),
  address: z.string().optional(),
  notes: z.string().optional(),
});
type StudentForm = z.infer<typeof studentSchema>;

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
  dateOfBirth?: string;
  active: boolean;
  parents: Array<{ user: { name: string; email: string; phone?: string } }>;
  enrollments: Array<{ class: { name: string; program: string } }>;
  sacraments: Array<{ sacramentType: string; status: string }>;
}

const sacramentStatusColor: Record<string, string> = {
  COMPLETED: 'badge-green',
  IN_PROGRESS: 'badge-gold',
  NOT_STARTED: 'badge-gray',
  NOT_APPLICABLE: 'badge-gray',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  });

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (gradeFilter) params.set('grade', gradeFilter);
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, gradeFilter]);

  const onSubmit = async (data: StudentForm) => {
    setSaving(true);
    setError('');
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowModal(false);
      reset();
      load();
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to create student');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{students.length} active students</p>
        </div>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            className="form-input pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="form-select sm:w-48" value={gradeFilter} onChange={e => setGradeFilter(e.target.value)}>
          <option value="">All Grades</option>
          {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <GraduationCap className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No students found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Student</th>
                  <th className="table-header hidden sm:table-cell">Grade</th>
                  <th className="table-header hidden md:table-cell">Parent/Guardian</th>
                  <th className="table-header hidden lg:table-cell">Enrolled In</th>
                  <th className="table-header hidden lg:table-cell">Sacraments</th>
                  <th className="table-header w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <Link href={`/students/${s.id}`} className="flex items-center gap-3 hover:text-[#1e3a5f]">
                        <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{s.firstName} {s.lastName}</div>
                          <div className="text-xs text-gray-400 sm:hidden">{gradeLevelLabel(s.gradeLevel)}</div>
                        </div>
                      </Link>
                    </td>
                    <td className="table-cell hidden sm:table-cell">
                      <span className="badge badge-blue">{gradeLevelLabel(s.gradeLevel)}</span>
                    </td>
                    <td className="table-cell hidden md:table-cell">
                      {s.parents[0] ? (
                        <div>
                          <div className="font-medium">{s.parents[0].user.name}</div>
                          <div className="text-xs text-gray-400">{s.parents[0].user.email}</div>
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      {s.enrollments.length > 0 ? (
                        <div className="space-y-1">
                          {s.enrollments.slice(0, 2).map((e, i) => (
                            <div key={i} className="text-xs text-gray-600">{e.class.name}</div>
                          ))}
                          {s.enrollments.length > 2 && <div className="text-xs text-gray-400">+{s.enrollments.length - 2} more</div>}
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="table-cell hidden lg:table-cell">
                      {s.sacraments.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.sacraments.slice(0, 2).map((sac, i) => (
                            <span key={i} className={cn('badge', sacramentStatusColor[sac.status] || 'badge-gray')}>
                              {sac.sacramentType.split(' ')[0]}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="table-cell">
                      <Link href={`/students/${s.id}`} className="text-gray-400 hover:text-[#1e3a5f]">
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Student" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">First Name *</label>
              <input {...register('firstName')} className="form-input" />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="form-label">Last Name *</label>
              <input {...register('lastName')} className="form-input" />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Grade Level *</label>
              <select {...register('gradeLevel')} className="form-select">
                <option value="">Select grade</option>
                {GRADE_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
              </select>
              {errors.gradeLevel && <p className="text-red-500 text-xs mt-1">{errors.gradeLevel.message}</p>}
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
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Student'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
