"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Users, Plus, Edit, Trash2, Key, CheckCircle, XCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { roleLabel } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  active: boolean;
  createdAt: string;
}

const ROLES = ["ADMIN", "DIRECTOR", "CATECHIST", "PARENT"];

const roleColors: Record<string, string> = {
  ADMIN: "badge-red",
  DIRECTOR: "badge-gold",
  CATECHIST: "badge-blue",
  PARENT: "badge-green",
};

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as { role?: string })?.role;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", userRole: "PARENT", active: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/users");
    if (!r.ok) { router.push("/dashboard"); return; }
    const data = await r.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (role && role !== "ADMIN") { router.push("/dashboard"); return; }
    if (role === "ADMIN") load();
  }, [role, load, router]);

  async function handleSave() {
    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/users/${editing.id}` : "/api/users";
    await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowModal(false);
    setEditing(null);
    resetForm();
    load();
  }

  async function handleDeactivate() {
    if (!deleteId) return;
    await fetch(`/api/users/${deleteId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: false }) });
    setDeleteId(null);
    load();
  }

  async function handleResetPassword() {
    if (!passwordUserId || !newPassword) return;
    await fetch(`/api/users/${passwordUserId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: newPassword }),
    });
    setShowPasswordModal(false);
    setPasswordUserId(null);
    setNewPassword("");
  }

  function resetForm() {
    setForm({ name: "", email: "", phone: "", password: "", userRole: "PARENT", active: true });
  }

  function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone ?? "", password: "", userRole: u.role, active: u.active });
    setShowModal(true);
  }

  const activeUsers = users.filter((u) => u.active);
  const inactiveUsers = users.filter((u) => !u.active);

  if (loading) return <div className="space-y-4">{[...Array(4)].map((_, i) => <div key={i} className="card h-12 animate-pulse bg-gray-100" />)}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <Settings className="w-6 h-6" /> Admin Panel
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage users, roles, and system settings</p>
        </div>
        <button onClick={() => { resetForm(); setEditing(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {ROLES.map((r) => {
          const count = users.filter((u) => u.role === r && u.active).length;
          return (
            <div key={r} className="card text-center">
              <div className="text-3xl font-bold text-[#1e3a5f]">{count}</div>
              <div className="text-sm text-gray-500 mt-1">{roleLabel(r)}s</div>
              <span className={`badge mt-2 ${roleColors[r]}`}>{r}</span>
            </div>
          );
        })}
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2">
            <Users className="w-5 h-5" /> Active Users ({activeUsers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header hidden md:table-cell">Phone</th>
                <th className="table-header hidden md:table-cell">Status</th>
                <th className="table-header text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="table-cell font-medium text-gray-900">{u.name}</td>
                  <td className="table-cell text-gray-600 text-sm">{u.email}</td>
                  <td className="table-cell">
                    <span className={`badge ${roleColors[u.role] ?? "badge-gray"}`}>{roleLabel(u.role)}</span>
                  </td>
                  <td className="table-cell hidden md:table-cell text-gray-500 text-sm">{u.phone ?? "—"}</td>
                  <td className="table-cell hidden md:table-cell">
                    <span className={`flex items-center gap-1 text-xs font-medium ${u.active ? "text-green-600" : "text-red-500"}`}>
                      {u.active ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-[#c9a227]" title="Edit">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setPasswordUserId(u.id); setShowPasswordModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-[#1e3a5f]"
                        title="Reset Password"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      {u.id !== session?.user?.id && (
                        <button onClick={() => setDeleteId(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600" title="Deactivate">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {inactiveUsers.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-400 text-sm uppercase tracking-wide">Inactive Users ({inactiveUsers.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Name</th>
                  <th className="table-header">Email</th>
                  <th className="table-header">Role</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 opacity-60">
                {inactiveUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="table-cell font-medium text-gray-600">{u.name}</td>
                    <td className="table-cell text-gray-400 text-sm">{u.email}</td>
                    <td className="table-cell"><span className={`badge ${roleColors[u.role] ?? "badge-gray"}`}>{roleLabel(u.role)}</span></td>
                    <td className="table-cell text-right">
                      <button
                        onClick={async () => {
                          await fetch(`/api/users/${u.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: true }) });
                          load();
                        }}
                        className="text-xs text-[#1e3a5f] hover:underline font-medium"
                      >
                        Reactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Church Info Card */}
      <div className="card bg-gradient-to-br from-[#1e3a5f] to-[#2a4f7c] text-white">
        <h3 className="font-bold mb-3">Holy Face Catholic Church</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-100">
          <div>
            <div className="font-medium text-white mb-1">Contact</div>
            <div>20408 Point Lookout Road</div>
            <div>Great Mills, MD 20634</div>
          </div>
          <div>
            <div className="font-medium text-white mb-1">Staff</div>
            <div>Pastor: Fr. Scott S. Holmer</div>
            <div>Deacons: Paul Bielewicz, Tom Trudell</div>
          </div>
          <div>
            <div className="font-medium text-white mb-1">Faith Formation Directors</div>
            <div>Susan Beall</div>
            <div>Sheila Schneider (System Admin)</div>
          </div>
          <div>
            <div className="font-medium text-white mb-1">Programs</div>
            <div>Pre-K through 8th Grade FF</div>
            <div>RCIA · Adult FF · Confirmation</div>
          </div>
        </div>
      </div>

      {/* Add/Edit User Modal */}
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(null); }} title={editing ? "Edit User" : "Add New User"} size="md">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="form-input" required />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Email *</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="form-input" required disabled={!!editing} />
          </div>
          {!editing && (
            <div>
              <label className="form-label">Password *</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="form-input" required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Role *</label>
              <select value={form.userRole} onChange={(e) => setForm({ ...form, userRole: e.target.value })} className="form-select">
                {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
              </select>
            </div>
            {editing && (
              <div>
                <label className="form-label">Status</label>
                <select value={form.active ? "active" : "inactive"} onChange={(e) => setForm({ ...form, active: e.target.value === "active" })} className="form-select">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setShowModal(false); setEditing(null); }} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">{editing ? "Save Changes" : "Add User"}</button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal open={showPasswordModal} onClose={() => { setShowPasswordModal(false); setPasswordUserId(null); setNewPassword(""); }} title="Reset Password" size="sm">
        <div className="space-y-4">
          <div>
            <label className="form-label">New Password *</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input" placeholder="Min 8 characters" />
          </div>
          <div className="flex gap-3 justify-end">
            <button onClick={() => { setShowPasswordModal(false); setNewPassword(""); }} className="btn-secondary">Cancel</button>
            <button onClick={handleResetPassword} disabled={!newPassword || newPassword.length < 6} className="btn-primary">Reset Password</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeactivate}
        title="Deactivate User"
        message="This user will no longer be able to log in. You can reactivate them at any time."
        confirmLabel="Deactivate"
        danger
      />
    </div>
  );
}
