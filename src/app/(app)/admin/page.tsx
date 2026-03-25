"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Settings, Users, Plus, Edit, Trash2, Key, CheckCircle, XCircle, GraduationCap, BookOpen, BarChart3, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { roleLabel } from "@/lib/utils";
import Link from "next/link";

interface ClassOption {
  id: string;
  name: string;
  enrollments?: { id: string }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  active: boolean;
  createdAt: string;
  catechist?: { id: string; classes: Array<{ classId: string; class: ClassOption }> };
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
  const [saveMsg, setSaveMsg] = useState("");
  const [saving, setSaving] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", userRole: "PARENT", active: true,
  });
  const [allClasses, setAllClasses] = useState<ClassOption[]>([]);
  const [assignedClassIds, setAssignedClassIds] = useState<string[]>([]);

  // Manage classes modal
  const [showManageClassesModal, setShowManageClassesModal] = useState(false);
  const [managingUser, setManagingUser] = useState<User | null>(null);
  const [managingClassIds, setManagingClassIds] = useState<string[]>([]);
  const [managingClassDropdownOpen, setManagingClassDropdownOpen] = useState(false);
  const [managingSaving, setManagingSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/users");
    if (!r.ok) { router.push("/dashboard"); return; }
    const data = await r.json();
    // Enrich catechist users with their class assignments
    const enriched = await Promise.all(
      (Array.isArray(data) ? data : []).map(async (u: User) => {
        if (u.role === "CATECHIST") {
          try {
            const detail = await fetch(`/api/users/${u.id}`);
            if (detail.ok) {
              const d = await detail.json();
              return { ...u, catechist: d.catechist };
            }
          } catch {}
        }
        return u;
      })
    );
    setUsers(enriched);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    if (role && role !== "ADMIN") { router.push("/dashboard"); return; }
    if (role === "ADMIN") {
      load();
      fetch("/api/classes").then(r => r.json()).then(d => {
        if (Array.isArray(d)) setAllClasses(d.map((c: any) => ({ id: c.id, name: c.name, enrollments: c.enrollments })));
      });
    }
  }, [role, load, router]);

  async function handleSave() {
    setSaving(true);
    const method = editing ? "PATCH" : "POST";
    const url = editing ? `/api/users/${editing.id}` : "/api/users";
    const payload = { ...form, ...(form.userRole === "CATECHIST" ? { assignedClassIds } : {}) };
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    
    // If creating a new catechist, assign classes after user creation
    if (!editing && form.userRole === "CATECHIST" && res.ok && assignedClassIds.length > 0) {
      const newUser = await res.json();
      await fetch(`/api/users/${newUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedClassIds }),
      });
    }
    
    setShowModal(false);
    setEditing(null);
    resetForm();
    setAssignedClassIds([]);
    setSaving(false);
    setSaveMsg("User saved!");
    setTimeout(() => setSaveMsg(""), 2500);
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

  async function handleManageClasses() {
    if (!managingUser) return;
    setManagingSaving(true);
    await fetch(`/api/users/${managingUser.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedClassIds: managingClassIds }),
    });
    setShowManageClassesModal(false);
    setManagingUser(null);
    setManagingClassIds([]);
    setManagingSaving(false);
    load();
  }

  function resetForm() {
    setForm({ name: "", email: "", phone: "", password: "", userRole: "PARENT", active: true });
    setClassDropdownOpen(false);
  }

  async function openEdit(u: User) {
    setEditing(u);
    setForm({ name: u.name, email: u.email, phone: u.phone ?? "", password: "", userRole: u.role, active: u.active });
    // Load class assignments for catechists
    if (u.role === "CATECHIST") {
      const res = await fetch(`/api/users/${u.id}`);
      if (res.ok) {
        const detail = await res.json();
        setAssignedClassIds(detail.catechist?.classes?.map((c: any) => c.classId) || []);
      }
    } else {
      setAssignedClassIds([]);
    }
    setClassDropdownOpen(false);
    setShowModal(true);
  }

  async function openManageClasses(u: User) {
    setManagingUser(u);
    const res = await fetch(`/api/users/${u.id}`);
    if (res.ok) {
      const detail = await res.json();
      setManagingClassIds(detail.catechist?.classes?.map((c: any) => c.classId) || []);
    }
    setManagingClassDropdownOpen(false);
    setShowManageClassesModal(true);
  }

  const activeUsers = users.filter((u) => u.active);
  const inactiveUsers = users.filter((u) => !u.active);
  const catechistCount = activeUsers.filter(u => u.role === "CATECHIST").length;
  const classCount = allClasses.length;

  const selectedClassNames = assignedClassIds
    .map(id => allClasses.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(", ");

  const managingSelectedNames = managingClassIds
    .map(id => allClasses.find(c => c.id === id)?.name)
    .filter(Boolean)
    .join(", ");

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
        {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Add User", icon: Plus, color: "bg-blue-50 text-[#1e3a5f]", action: () => { resetForm(); setEditing(null); setShowModal(true); } },
          { label: "Add Class", icon: BookOpen, color: "bg-yellow-50 text-[#c9a227]", href: "/classes" },
          { label: "Import Students", icon: Upload, color: "bg-green-50 text-green-700", href: "/students" },
          { label: "View Reports", icon: BarChart3, color: "bg-purple-50 text-purple-700", href: "/reports" },
        ].map((item, i) => {
          const Icon = item.icon;
          const inner = (
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-center">
              <div className={`p-3 rounded-xl ${item.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </div>
          );
          if (item.href) return <Link key={i} href={item.href}>{inner}</Link>;
          return <button key={i} onClick={item.action}>{inner}</button>;
        })}
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

      {/* Class stats with student counts */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2"><GraduationCap className="w-5 h-5" /> Class Summary</h2>
          <Link href="/classes" className="text-sm text-[#1e3a5f] hover:underline">Manage classes →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {allClasses.slice(0, 8).map(c => (
            <Link key={c.id} href={`/classes/${c.id}`} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors">
              <span className="text-sm font-medium text-gray-700 truncate">{c.name}</span>
              <span className="badge badge-blue ml-2 flex-shrink-0">{c.enrollments?.length ?? 0}</span>
            </Link>
          ))}
          {allClasses.length === 0 && <p className="text-sm text-gray-400 col-span-4">No classes yet</p>}
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-[#1e3a5f] flex items-center gap-2">
            <Users className="w-5 h-5" /> Active Users ({activeUsers.length})
          </h2>
          <button onClick={() => { resetForm(); setEditing(null); setShowModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add User
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="table-header">Name</th>
                <th className="table-header">Email</th>
                <th className="table-header">Role</th>
                <th className="table-header hidden lg:table-cell">Assigned Classes</th>
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
                  <td className="table-cell hidden lg:table-cell text-xs text-gray-500">
                    {u.role === "CATECHIST" && u.catechist?.classes?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {u.catechist.classes.map((c: any) => (
                          <span key={c.classId} className="badge badge-blue text-[10px]">{c.class.name}</span>
                        ))}
                      </div>
                    ) : u.role === "CATECHIST" ? (
                      <span className="text-orange-500 font-medium">No classes assigned</span>
                    ) : "—"}
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
                      {u.role === "CATECHIST" && (
                        <button
                          onClick={() => openManageClasses(u)}
                          className="px-2 py-1 text-xs rounded-lg bg-blue-50 text-[#1e3a5f] hover:bg-blue-100 font-medium"
                          title="Manage Classes"
                        >
                          Classes
                        </button>
                      )}
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
      <Modal open={showModal} onClose={() => { setShowModal(false); setEditing(null); setClassDropdownOpen(false); }} title={editing ? "Edit User" : "Add New User"} size="md">
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
              <div className="flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setForm({ ...form, userRole: r })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      form.userRole === r
                        ? "bg-[#1e3a5f] text-white border-[#1e3a5f]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#1e3a5f]"
                    }`}
                  >
                    {roleLabel(r)}
                  </button>
                ))}
              </div>
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
          {/* Class Assignment — dropdown multi-select for Catechists */}
          {form.userRole === "CATECHIST" && (
            <div>
              <label className="form-label">Assign to Classes</label>
              <p className="text-xs text-gray-400 mb-2">Catechist will only see these classes and their students</p>
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
                              if (e.target.checked) {
                                setAssignedClassIds([...assignedClassIds, cls.id]);
                              } else {
                                setAssignedClassIds(assignedClassIds.filter((id) => id !== cls.id));
                              }
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
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setShowModal(false); setEditing(null); setAssignedClassIds([]); setClassDropdownOpen(false); }} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving..." : editing ? "Save Changes" : "Add User"}</button>
          </div>
        </div>
      </Modal>

      {/* Manage Classes Modal */}
      <Modal open={showManageClassesModal} onClose={() => { setShowManageClassesModal(false); setManagingUser(null); setManagingClassDropdownOpen(false); }} title={`Manage Classes — ${managingUser?.name}`} size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select which classes this catechist is assigned to.</p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setManagingClassDropdownOpen(!managingClassDropdownOpen)}
              className="form-input flex items-center justify-between w-full text-left"
            >
              <span className={managingClassIds.length === 0 ? "text-gray-400" : "text-gray-800"}>
                {managingClassIds.length === 0
                  ? "Select classes..."
                  : `${managingClassIds.length} class${managingClassIds.length > 1 ? "es" : ""} selected`}
              </span>
              {managingClassDropdownOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            {managingClassDropdownOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                {allClasses.map((cls) => (
                  <label key={cls.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={managingClassIds.includes(cls.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setManagingClassIds([...managingClassIds, cls.id]);
                        } else {
                          setManagingClassIds(managingClassIds.filter((id) => id !== cls.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#1e3a5f] focus:ring-[#1e3a5f]"
                    />
                    <span className="text-sm text-gray-700">{cls.name}</span>
                    {managingClassIds.includes(cls.id) && <CheckCircle className="w-3.5 h-3.5 text-[#1e3a5f] ml-auto" />}
                  </label>
                ))}
              </div>
            )}
          </div>
          {managingClassIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {managingClassIds.map(id => {
                const cls = allClasses.find(c => c.id === id);
                return cls ? (
                  <span key={id} className="badge badge-blue flex items-center gap-1 text-xs">
                    {cls.name}
                    <button type="button" onClick={() => setManagingClassIds(managingClassIds.filter(i => i !== id))} className="hover:text-red-600 ml-1">×</button>
                  </span>
                ) : null;
              })}
            </div>
          )}
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => { setShowManageClassesModal(false); setManagingUser(null); }} className="btn-secondary">Cancel</button>
            <button onClick={handleManageClasses} disabled={managingSaving} className="btn-primary">{managingSaving ? "Saving..." : "Save Class Assignments"}</button>
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
