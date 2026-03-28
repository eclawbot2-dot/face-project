'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, GraduationCap, User, ChevronRight, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
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
  const [statusFilter, setStatusFilter] = useState('active');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [allClasses, setAllClasses] = useState<Array<{ id: string; name: string; program: string }>>([]);
  const [enrollClassId, setEnrollClassId] = useState('');

  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    imported: number;
    skipped: number;
    errors: string[];
    students: Array<{ name: string; grade: string; enrolled: string; parentAdded?: string }>;
  } | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StudentForm>({
    resolver: zodResolver(studentSchema),
  });

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (gradeFilter) params.set('grade', gradeFilter);
    if (statusFilter === 'inactive') params.set('active', 'false');
    else if (statusFilter === 'all') params.set('active', 'all');
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    setStudents(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, gradeFilter, statusFilter]);

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setAllClasses(d.map((c: any) => ({ id: c.id, name: c.name, program: c.program })));
    });
  }, []);

  const onSubmit = async (data: StudentForm) => {
    setSaving(true);
    setError('');
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const newStudent = await res.json();
      // Enroll in class if selected
      if (enrollClassId && newStudent.id) {
        await fetch(`/api/classes/${enrollClassId}/enroll`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: newStudent.id }),
        });
      }
      setShowModal(false);
      reset();
      setEnrollClassId('');
      load();
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to create student');
    }
    setSaving(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/students/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        load(); // Refresh student list
      } else {
        setImportResult({ imported: 0, skipped: 0, errors: [data.error || 'Import failed'], students: [] });
      }
    } catch {
      setImportResult({ imported: 0, skipped: 0, errors: ['Failed to upload file'], students: [] });
    }
    setImporting(false);
    // Reset the file input
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{students.length} active students</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setImportResult(null); setShowImportModal(true); }} className="btn-secondary flex items-center gap-2">
            <Upload className="w-4 h-4" /> Import Excel
          </button>
          <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
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
        <select className="form-select sm:w-36" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="all">All Students</option>
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
            <label className="form-label">Enroll in Class (optional)</label>
            <select className="form-select" value={enrollClassId} onChange={e => setEnrollClassId(e.target.value)}>
              <option value="">Don't enroll yet</option>
              {allClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
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
            <button type="button" onClick={() => { setShowModal(false); setEnrollClassId(''); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Student'}</button>
          </div>
        </form>
      </Modal>

      {/* Import Excel Modal */}
      <Modal open={showImportModal} onClose={() => setShowImportModal(false)} title="Import Students from Excel" size="lg">
        <div className="space-y-4">
          {!importResult ? (
            <>
              <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">Your spreadsheet should have columns like:</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div><strong>First Name</strong> (or "Student Name")</div>
                  <div><strong>Last Name</strong></div>
                  <div><strong>Grade</strong> (Pre-K, K, 1st, 2nd, etc.)</div>
                  <div><strong>Date of Birth</strong> (optional)</div>
                  <div><strong>Address</strong> (optional)</div>
                  <div><strong>Parent Name</strong> (optional)</div>
                </div>
                <p className="mt-2 text-xs text-blue-600">Accepts .xlsx, .xls, and .csv files. Column names are flexible — it'll figure out what's what.</p>
              </div>

              <label className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${importing ? 'border-gray-300 bg-gray-50' : 'border-[#1e3a5f]/30 hover:border-[#1e3a5f] hover:bg-blue-50/50'}`}>
                <div className="flex flex-col items-center gap-2 text-center">
                  {importing ? (
                    <>
                      <div className="w-8 h-8 border-2 border-[#1e3a5f] border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-600">Importing students...</span>
                    </>
                  ) : (
                    <>
                      <FileSpreadsheet className="w-10 h-10 text-[#1e3a5f]/40" />
                      <span className="text-sm text-gray-600 font-medium">Click to upload Excel or CSV file</span>
                      <span className="text-xs text-gray-400">.xlsx, .xls, or .csv</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleImport}
                  disabled={importing}
                />
              </label>
            </>
          ) : (
            <>
              {/* Results */}
              <div className={`rounded-xl p-4 ${importResult.imported > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  {importResult.imported > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : null}
                  <span className={`font-bold ${importResult.imported > 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {importResult.imported > 0 ? `${importResult.imported} students imported!` : 'Import failed'}
                  </span>
                </div>
                {importResult.skipped > 0 && (
                  <p className="text-sm text-gray-600">{importResult.skipped} rows skipped (empty names)</p>
                )}
              </div>

              {importResult.errors.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="font-medium text-red-800 text-sm mb-1">Errors:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {importResult.errors.map((err, i) => (
                      <p key={i} className="text-xs text-red-600">{err}</p>
                    ))}
                  </div>
                </div>
              )}

              {importResult.students.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Student</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Grade</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Enrolled In</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500">Parent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {importResult.students.map((s, i) => (
                        <tr key={i}>
                          <td className="px-3 py-2 font-medium text-gray-800">{s.name}</td>
                          <td className="px-3 py-2 text-gray-500">{s.grade}</td>
                          <td className="px-3 py-2 text-gray-500">{s.enrolled}</td>
                          <td className="px-3 py-2 text-gray-500">{s.parentAdded || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 justify-end">
                <button onClick={() => { setImportResult(null); }} className="btn-secondary">Import More</button>
                <button onClick={() => setShowImportModal(false)} className="btn-primary">Done</button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
