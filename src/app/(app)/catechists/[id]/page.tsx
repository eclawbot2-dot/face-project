'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Shield, BookOpen, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { formatDate, gradeLevelLabel } from '@/lib/utils';

interface Catechist {
  id: string;
  bio?: string;
  notes?: string;
  backgroundCheckDate?: string;
  backgroundCheckExp?: string;
  certifications: string;
  user: { id: string; name: string; email: string; phone?: string; active: boolean };
  classes: Array<{ class: { id: string; name: string; gradeLevel: string; program: string; enrollments: { id: string }[] }; isPrimary: boolean }>;
}

interface EditForm {
  name: string;
  phone: string;
  bio: string;
  notes: string;
  backgroundCheckDate: string;
  backgroundCheckExp: string;
}

export default function CatechistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [catechist, setCatechist] = useState<Catechist | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [certs, setCerts] = useState<string[]>([]);
  const [newCert, setNewCert] = useState('');

  const { register, handleSubmit, reset } = useForm<EditForm>();

  const load = async () => {
    setLoading(true);
    const res = await fetch(`/api/catechists/${id}`);
    if (!res.ok) { router.push('/catechists'); return; }
    const data = await res.json();
    setCatechist(data);
    let parsedCerts: string[] = [];
    try { parsedCerts = JSON.parse(data.certifications); } catch {}
    setCerts(parsedCerts);
    reset({
      name: data.user.name,
      phone: data.user.phone || '',
      bio: data.bio || '',
      notes: data.notes || '',
      backgroundCheckDate: data.backgroundCheckDate ? new Date(data.backgroundCheckDate).toISOString().split('T')[0] : '',
      backgroundCheckExp: data.backgroundCheckExp ? new Date(data.backgroundCheckExp).toISOString().split('T')[0] : '',
    });
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const onSave = async (data: EditForm) => {
    setSaving(true);
    await fetch(`/api/catechists/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, certifications: certs }),
    });
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2000);
    setSaving(false);
    load();
  };

  const addCert = () => {
    if (newCert.trim()) { setCerts([...certs, newCert.trim()]); setNewCert(''); }
  };
  const removeCert = (i: number) => setCerts(certs.filter((_, idx) => idx !== i));

  const bgCheckExpired = catechist?.backgroundCheckExp && new Date(catechist.backgroundCheckExp) < new Date();

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!catechist) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/catechists" className="text-gray-400 hover:text-[#1e3a5f]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[#1e3a5f]">{catechist.user.name}</h1>
          <p className="text-gray-500 text-sm">{catechist.user.email}</p>
        </div>
        {!catechist.user.active && <span className="badge badge-red">Inactive</span>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSave)} className="card space-y-4">
            <h2 className="font-bold text-[#1e3a5f]">Catechist Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name</label>
                <input {...register('name')} className="form-input" />
              </div>
              <div>
                <label className="form-label">Phone</label>
                <input {...register('phone')} className="form-input" />
              </div>
            </div>
            <div>
              <label className="form-label">Bio</label>
              <textarea {...register('bio')} className="form-input" rows={3} />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium text-gray-800 flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4" /> Background Check
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Check Date</label>
                  <input type="date" {...register('backgroundCheckDate')} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Expiration Date</label>
                  <input type="date" {...register('backgroundCheckExp')} className="form-input" />
                </div>
              </div>
              {catechist.backgroundCheckDate && (
                <div className={`mt-2 text-sm ${bgCheckExpired ? 'text-red-600' : 'text-green-600'}`}>
                  {bgCheckExpired ? '⚠️ Background check has expired!' : '✓ Background check is current'}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <label className="form-label">Certifications</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {certs.map((cert, i) => (
                  <span key={i} className="inline-flex items-center gap-1 badge badge-blue">
                    {cert}
                    <button type="button" onClick={() => removeCert(i)} className="hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCert}
                  onChange={e => setNewCert(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCert(); } }}
                  placeholder="Add certification..."
                  className="form-input flex-1"
                />
                <button type="button" onClick={addCert} className="btn-secondary flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            <div>
              <label className="form-label">Notes</label>
              <textarea {...register('notes')} className="form-input" rows={2} />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
              {saveMsg && <span className="text-green-600 text-sm">{saveMsg}</span>}
            </div>
          </form>
        </div>

        <div className="card">
          <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4" /> Assigned Classes
          </h2>
          {catechist.classes.length === 0 ? (
            <p className="text-gray-400 text-sm">No classes assigned</p>
          ) : (
            <div className="space-y-3">
              {catechist.classes.map((cc, i) => (
                <Link key={i} href={`/classes/${cc.class.id}`} className="block p-3 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors">
                  <div className="font-medium text-[#1e3a5f] text-sm">{cc.class.name}</div>
                  <div className="text-xs text-gray-500">{cc.class.program}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {gradeLevelLabel(cc.class.gradeLevel)} · {cc.class.enrollments.length} students
                    {cc.isPrimary && <span className="ml-2 badge badge-gold">Primary</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
