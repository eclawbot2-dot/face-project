'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, BookOpen, ChevronRight, Users, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';
import { gradeLevelLabel, formatTime, GRADE_LEVELS, PROGRAMS, DAYS_OF_WEEK } from '@/lib/utils';

const classSchema = z.object({
  name: z.string().min(1, 'Class name required'),
  gradeLevel: z.string().min(1, 'Grade required'),
  program: z.string().min(1, 'Program required'),
  description: z.string().optional(),
  room: z.string().optional(),
  dayOfWeek: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  academicYear: z.string().min(1, 'Academic year required'),
});
type ClassForm = z.infer<typeof classSchema>;

interface ClassItem {
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
  catechists: Array<{ catechist: { user: { name: string } }; isPrimary: boolean }>;
  enrollments: Array<{ id: string }>;
  sessions: Array<{ id: string; date: string }>;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClassForm>({
    resolver: zodResolver(classSchema),
    defaultValues: { academicYear: '2025-2026' },
  });

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (gradeFilter) params.set('grade', gradeFilter);
    const res = await fetch(`/api/classes?${params}`);
    const data = await res.json();
    setClasses(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [gradeFilter]);

  const filtered = classes.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.program.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: ClassForm) => {
    setSaving(true);
    setError('');
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowModal(false);
      reset({ academicYear: '2025-2026' });
      load();
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to create class');
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Classes</h1>
          <p className="text-gray-500 text-sm mt-1">{classes.length} active classes</p>
        </div>
        <button onClick={() => { reset({ academicYear: '2025-2026' }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search classes..."
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-50" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No classes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => {
            const primary = c.catechists.find(cc => cc.isPrimary) || c.catechists[0];
            return (
              <Link key={c.id} href={`/classes/${c.id}`} className="card hover:shadow-md transition-shadow hover:border-[#1e3a5f] border border-gray-100 block">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-[#1e3a5f]">{c.name}</h3>
                    <p className="text-sm text-gray-500">{c.program}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="badge badge-blue">{gradeLevelLabel(c.gradeLevel)}</span>
                  {c.room && <span className="badge badge-gray">Room {c.room}</span>}
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {c.dayOfWeek && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-gray-400" />
                      {c.dayOfWeek} {c.startTime && `${formatTime(c.startTime)}${c.endTime ? ` – ${formatTime(c.endTime)}` : ''}`}
                    </div>
                  )}
                  {primary && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3 h-3 text-gray-400" />
                      {primary.catechist.user.name}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3 h-3 text-gray-400" />
                    {c.enrollments.length} students
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Class" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Class Name *</label>
              <input {...register('name')} className="form-input" placeholder="e.g. Grade 2 Faith Formation" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Academic Year *</label>
              <input {...register('academicYear')} className="form-input" placeholder="e.g. 2025-2026" />
              {errors.academicYear && <p className="text-red-500 text-xs mt-1">{errors.academicYear.message}</p>}
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
              <label className="form-label">Program *</label>
              <select {...register('program')} className="form-select">
                <option value="">Select program</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              {errors.program && <p className="text-red-500 text-xs mt-1">{errors.program.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Day of Week</label>
              <select {...register('dayOfWeek')} className="form-select">
                <option value="">Select day</option>
                {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Start Time</label>
              <input type="time" {...register('startTime')} className="form-input" />
            </div>
            <div>
              <label className="form-label">End Time</label>
              <input type="time" {...register('endTime')} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Room</label>
            <input {...register('room')} className="form-input" />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea {...register('description')} className="form-input" rows={2} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Class'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
