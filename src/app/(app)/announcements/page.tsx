'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Megaphone, Plus, Send, Users, BookOpen, Edit, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDate } from '@/lib/utils';

const announcementSchema = z.object({
  title: z.string().min(1, 'Title required'),
  body: z.string().min(1, 'Message required'),
  targetGroup: z.string().min(1),
});
type AnnouncementForm = z.infer<typeof announcementSchema>;

interface Announcement {
  id: string;
  title: string;
  body: string;
  targetGroup: string;
  sentAt?: string;
  createdAt: string;
  author: { name: string };
}

interface ClassItem {
  id: string;
  name: string;
  program: string;
}

const targetLabel = (target: string) => {
  if (target === 'ALL') return 'All Families';
  if (target.startsWith('CLASS:')) return `Class: ${target.slice(6)}`;
  if (target.startsWith('PROGRAM:')) return `Program: ${target.slice(8)}`;
  return target;
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveMsg, setSaveMsg] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { targetGroup: 'ALL' },
  });

  const targetGroup = watch('targetGroup');

  const load = async () => {
    setLoading(true);
    const [annRes, clsRes] = await Promise.all([
      fetch('/api/announcements'),
      fetch('/api/classes'),
    ]);
    const [annData, clsData] = await Promise.all([annRes.json(), clsRes.json()]);
    setAnnouncements(Array.isArray(annData) ? annData : []);
    setClasses(Array.isArray(clsData) ? clsData : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    reset({ targetGroup: 'ALL', title: '', body: '' });
    setShowModal(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    reset({ title: a.title, body: a.body, targetGroup: a.targetGroup });
    setShowModal(true);
  };

  const onSubmit = async (data: AnnouncementForm) => {
    setSaving(true);
    setError('');
    const url = editing ? `/api/announcements/${editing.id}` : '/api/announcements';
    const method = editing ? 'PATCH' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      setShowModal(false);
      reset({ targetGroup: 'ALL' });
      setEditing(null);
      setSaveMsg(editing ? 'Announcement updated!' : 'Announcement sent!');
      setTimeout(() => setSaveMsg(''), 2500);
      load();
    } else {
      const err = await res.json();
      setError(err.error || 'Failed to save announcement');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/announcements/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    setSaveMsg('Announcement deleted');
    setTimeout(() => setSaveMsg(''), 2000);
    load();
  };

  // Get unique programs
  const programs = [...new Set(classes.map(c => c.program))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Announcements</h1>
          <p className="text-gray-500 text-sm mt-1">Send messages to parents by class or program</p>
        </div>
        <div className="flex items-center gap-3">
          {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
          <button onClick={openNew} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Announcement
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading...</div>
      ) : announcements.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No announcements yet</p>
          <button onClick={openNew} className="btn-primary mt-4 text-sm">Send First Announcement</button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map(a => (
            <div key={a.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-gray-900">{a.title}</h3>
                    <span className="badge badge-blue flex items-center gap-1">
                      {a.targetGroup === 'ALL' ? <Users className="w-3 h-3" /> : <BookOpen className="w-3 h-3" />}
                      {targetLabel(a.targetGroup)}
                    </span>
                    {a.sentAt && <span className="text-xs text-green-600 font-medium flex items-center gap-1">✓ Sent</span>}
                  </div>
                  <p className="text-gray-600 text-sm mt-2 whitespace-pre-wrap">{a.body}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                    <span>By {a.author.name}</span>
                    <span>·</span>
                    <span>{formatDate(a.createdAt)}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEdit(a)}
                    className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-[#c9a227]"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(a.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? 'Edit Announcement' : 'New Announcement'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="form-label">Title *</label>
            <input {...register('title')} className="form-input" placeholder="e.g. Upcoming Retreat This Sunday" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="form-label">Message *</label>
            <textarea {...register('body')} className="form-input" rows={6} placeholder="Write your announcement message here..." />
            {errors.body && <p className="text-red-500 text-xs mt-1">{errors.body.message}</p>}
          </div>
          <div>
            <label className="form-label">Send To</label>
            <select {...register('targetGroup')} className="form-select">
              <option value="ALL">All Families</option>
              <optgroup label="By Class">
                {classes.map(c => <option key={c.id} value={`CLASS:${c.name}`}>{c.name}</option>)}
              </optgroup>
              <optgroup label="By Program">
                {programs.map(p => <option key={p} value={`PROGRAM:${p}`}>{p}</option>)}
              </optgroup>
            </select>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-sm font-medium text-[#1e3a5f]">
              <Send className="w-4 h-4" /> Preview
            </div>
            <div className="text-sm text-gray-600">
              This announcement will be sent to: <strong>{targetLabel(targetGroup || 'ALL')}</strong>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => { setShowModal(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              <Send className="w-4 h-4" /> {saving ? 'Saving...' : editing ? 'Save Changes' : 'Send Announcement'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message="Permanently delete this announcement? This cannot be undone."
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}
