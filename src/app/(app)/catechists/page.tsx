'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Plus, Users, ChevronRight, Mail, Phone, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const catechistSchema = z.object({
  name: z.string().min(1, 'Name required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  bio: z.string().optional(),
  notes: z.string().optional(),
});
type CatechistForm = z.infer<typeof catechistSchema>;

interface ClassOption {
  id: string;
  name: string;
}

interface Catechist {
  id: string;
  backgroundCheckDate?: string;
  backgroundCheckExp?: string;
  certifications: string;
  bio?: string;
  user: { id: string; name: string; email: string; phone?: string; active: boolean };
  classes: Array<{ class: { id: string; name: string; gradeLevel: string }; isPrimary: boolean }>;
}

export default function CatechistsPage() {
  const [catechists, setCatechists] = useState<Catechist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CatechistForm>({
    resolver: zodResolver(catechistSchema),
  });

  const load = async () => {
    setLoading(true);
    const res = await fetch('/api/catechists');
    const data = await res.json();
    setCatechists(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    fetch('/api/classes').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setAllClasses(d.map((c: any) => ({ id: c.id, name: c.name })));
    });
  }, []);

  const filtered = catechists.filter(c =>
    !search || c.user.name.toLowerCase().includes(search.toLowerCase()) || c.user.email.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmit = async (data: CatechistForm) => {
    setSaving(true);
    setError('');
    const res = await fetch('/api/catechists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const newCatechist = await res.json();
      // Assign classes if any selected (API returns the user object directly)
      if (assignedClassIds.length > 0 && newCatechist.id) {
        await fetch(`/api/users/${newCatechist.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedClassIds }),
        });
      }
      setShowModal(false);
      reset();
      setAssignedClassIds([]);
      setClassDropdownOpen(false);
      load();
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to create catechist');
    }
    setSaving(false);
  };

  const bgCheckStatus = (c: Catechist) => {
    if (!c.backgroundCheckDate) return { label: 'Not on file', cls: 'badge-red' };
    if (c.backgroundCheckExp && new Date(c.backgroundCheckExp) < new Date()) return { label: 'Expired', cls: 'badge-red' };
    return { label: 'Current', cls: 'badge-green' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Catechists</h1>
          <p className="text-gray-500 text-sm mt-1">{catechists.length} catechists</p>
        </div>
        <button onClick={() => { reset(); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Catechist
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search catechists..."
          className="form-input pl-9 max-w-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No catechists found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Name</th>
                  <th className="table-header hidden sm:table-cell">Contact</th>
                  <th className="table-header hidden md:table-cell">Classes</th>
                  <th className="table-header hidden lg:table-cell">Background Check</th>
                  <th className="table-header hidden lg:table-cell">Certifications</th>
                  <th className="table-header w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(c => {
                  const bg = bgCheckStatus(c);
                  let certs: string[] = [];
                  try { certs = JSON.parse(c.certifications); } catch {}
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <Link href={`/catechists/${c.id}`} className="flex items-center gap-3 hover:text-[#1e3a5f]">
                          <div className="w-9 h-9 rounded-full bg-[#c5a55a] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {c.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{c.user.name}</div>
                            <div className="text-xs text-gray-400 sm:hidden">{c.user.email}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="table-cell hidden sm:table-cell">
                        <div className="flex flex-col gap-1">
                          <a href={`mailto:${c.user.email}`} className="text-sm text-[#1e3a5f] hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {c.user.email}
                          </a>
                          {c.user.phone && (
                            <a href={`tel:${c.user.phone}`} className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {c.user.phone}
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="table-cell hidden md:table-cell">
                        {c.classes.length > 0 ? (
                          <div className="space-y-1">
                            {c.classes.slice(0, 2).map((cc, i) => (
                              <Link key={i} href={`/classes/${cc.class.id}`} className="text-xs text-[#1e3a5f] hover:underline block">
                                {cc.class.name} {cc.isPrimary && <span className="text-gray-400">(primary)</span>}
                              </Link>
                            ))}
                            {c.classes.length > 2 && <span className="text-xs text-gray-400">+{c.classes.length - 2} more</span>}
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        <span className={`badge ${bg.cls}`}>{bg.label}</span>
                        {c.backgroundCheckDate && (
                          <div className="text-xs text-gray-400 mt-1">{formatDate(c.backgroundCheckDate)}</div>
                        )}
                      </td>
                      <td className="table-cell hidden lg:table-cell">
                        {certs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {certs.slice(0, 2).map((cert, i) => (
                              <span key={i} className="badge badge-blue text-xs">{cert}</span>
                            ))}
                            {certs.length > 2 && <span className="text-xs text-gray-400">+{certs.length - 2}</span>}
                          </div>
                        ) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="table-cell">
                        <Link href={`/catechists/${c.id}`} className="text-gray-400 hover:text-[#1e3a5f]">
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setAssignedClassIds([]); setClassDropdownOpen(false); }} title="Add New Catechist" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input {...register('name')} className="form-input" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" {...register('email')} className="form-input" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Phone</label>
              <input {...register('phone')} className="form-input" />
            </div>
            <div>
              <label className="form-label">Password *</label>
              <input type="password" {...register('password')} className="form-input" />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
          </div>
          <div>
            <label className="form-label">Assign to Classes (optional)</label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setClassDropdownOpen(!classDropdownOpen)}
                className="form-input flex items-center justify-between w-full text-left"
              >
                <span className={assignedClassIds.length === 0 ? "text-gray-400" : "text-gray-800"}>
                  {assignedClassIds.length === 0
                    ? "Select classes..."
                    : `${assignedClassIds.length} class${assignedClassIds.length > 1 ? "es" : ""} selected`}
                </span>
                {classDropdownOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {classDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {allClasses.length === 0 ? (
                    <div className="p-3 text-sm text-gray-400">No classes available</div>
                  ) : (
                    allClasses.map((cls) => (
                      <label key={cls.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignedClassIds.includes(cls.id)}
                          onChange={(e) => {
                            if (e.target.checked) setAssignedClassIds([...assignedClassIds, cls.id]);
                            else setAssignedClassIds(assignedClassIds.filter(id => id !== cls.id));
                          }}
                          className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                        />
                        <span className="text-sm text-gray-700">{cls.name}</span>
                        {assignedClassIds.includes(cls.id) && <CheckCircle className="w-3.5 h-3.5 text-[#1e3a5f] ml-auto" />}
                      </label>
                    ))
                  )}
                </div>
              )}
            </div>
            {assignedClassIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {assignedClassIds.map(id => {
                  const cls = allClasses.find(c => c.id === id);
                  return cls ? (
                    <span key={id} className="badge badge-blue flex items-center gap-1 text-xs">
                      {cls.name}
                      <button type="button" onClick={() => setAssignedClassIds(assignedClassIds.filter(i => i !== id))} className="hover:text-red-600 ml-1">×</button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
          <div>
            <label className="form-label">Bio</label>
            <textarea {...register('bio')} className="form-input" rows={2} />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea {...register('notes')} className="form-input" rows={2} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowModal(false); setAssignedClassIds([]); setClassDropdownOpen(false); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Catechist'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
