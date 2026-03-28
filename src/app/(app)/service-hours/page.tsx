"use client";

import { useEffect, useState } from "react";
import { Heart, CheckCircle, Clock, Plus, Search, Check, Trash2, AlertCircle } from "lucide-react";
import { formatDate, gradeLevelLabel } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";

const SERVICE_HOURS_GOAL = 20;

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gradeLevel: string;
}

interface ServiceHour {
  id: string;
  studentId: string;
  date: string;
  hours: number;
  description: string;
  verified: boolean;
  verifiedBy: string | null;
  createdAt: string;
  student: Student;
}

interface StudentTotals {
  student: Student;
  entries: ServiceHour[];
  totalHours: number;
  verifiedHours: number;
  pendingHours: number;
}

export default function ServiceHoursPage() {
  const [hours, setHours] = useState<ServiceHour[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    studentId: "",
    date: new Date().toISOString().split("T")[0],
    hours: "",
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedStudent) params.set("studentId", selectedStudent);
      const [hoursRes, studentsRes] = await Promise.all([
        fetch(`/api/service-hours?${params}`),
        fetch("/api/students?grade=GRADE_8"),
      ]);
      const [hoursData, studentsData] = await Promise.all([hoursRes.json(), studentsRes.json()]);
      setHours(Array.isArray(hoursData) ? hoursData : []);
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [selectedStudent]);

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await fetch(`/api/service-hours/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified, verifiedBy: verified ? "Catechist" : null }),
      });
      await loadData();
    } catch {
      setError("Failed to update record");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this service hour record?")) return;
    try {
      await fetch(`/api/service-hours/${id}`, { method: "DELETE" });
      await loadData();
    } catch {
      setError("Failed to delete record");
    }
  };

  const handleAdd = async () => {
    if (!form.studentId || !form.date || !form.hours || !form.description) {
      setError("Please fill in all fields");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/service-hours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: form.studentId,
          date: form.date,
          hours: parseFloat(form.hours),
          description: form.description,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setShowAddModal(false);
      setForm({ studentId: "", date: new Date().toISOString().split("T")[0], hours: "", description: "" });
      await loadData();
    } catch {
      setError("Failed to save record");
    } finally {
      setSaving(false);
    }
  };

  // Group by student
  const filteredHours = hours.filter((h) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      h.student.firstName.toLowerCase().includes(q) ||
      h.student.lastName.toLowerCase().includes(q) ||
      h.description.toLowerCase().includes(q)
    );
  });

  const studentMap = new Map<string, StudentTotals>();
  for (const h of filteredHours) {
    const key = h.studentId;
    if (!studentMap.has(key)) {
      studentMap.set(key, {
        student: h.student,
        entries: [],
        totalHours: 0,
        verifiedHours: 0,
        pendingHours: 0,
      });
    }
    const entry = studentMap.get(key)!;
    entry.entries.push(h);
    entry.totalHours += h.hours;
    if (h.verified) entry.verifiedHours += h.hours;
    else entry.pendingHours += h.hours;
  }

  const studentTotals = Array.from(studentMap.values()).sort((a, b) =>
    a.student.lastName.localeCompare(b.student.lastName)
  );

  // Overall stats
  const totalStudents = studentTotals.length;
  const studentsOnTrack = studentTotals.filter((s) => s.verifiedHours >= SERVICE_HOURS_GOAL).length;
  const totalVerifiedHours = studentTotals.reduce((s, t) => s + t.verifiedHours, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <Heart className="w-7 h-7 text-[#c9a227]" />
            Service Hours
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Track Confirmation service hours · Goal: {SERVICE_HOURS_GOAL} verified hours
          </p>
        </div>
        <button
          onClick={() => { setError(""); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2 self-start"
        >
          <Plus className="w-4 h-4" />
          Log Hours
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-[#1e3a5f]">{totalStudents}</div>
          <div className="text-sm text-gray-500">Students</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{studentsOnTrack}</div>
          <div className="text-sm text-gray-500">Goal Met</div>
        </div>
        <div className="card text-center col-span-2 sm:col-span-1">
          <div className="text-2xl font-bold text-[#c9a227]">{totalVerifiedHours.toFixed(1)}</div>
          <div className="text-sm text-gray-500">Total Verified Hours</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="form-input pl-9"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select w-auto"
          value={selectedStudent}
          onChange={(e) => setSelectedStudent(e.target.value)}
        >
          <option value="">All Students</option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.firstName} {s.lastName}
            </option>
          ))}
        </select>
      </div>

      {/* Student cards */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : studentTotals.length === 0 ? (
        <div className="card text-center py-12">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No service hour records found.</p>
          <button
            onClick={() => { setError(""); setShowAddModal(true); }}
            className="btn-primary mt-4"
          >
            Log the First Hours
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {studentTotals.map(({ student, entries, verifiedHours, pendingHours }) => {
            const pct = Math.min((verifiedHours / SERVICE_HOURS_GOAL) * 100, 100);
            const goalMet = verifiedHours >= SERVICE_HOURS_GOAL;
            return (
              <div key={student.id} className="card">
                {/* Student header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-[#1e3a5f] text-lg">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{gradeLevelLabel(student.gradeLevel)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {goalMet ? (
                      <span className="badge badge-green flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Goal Met!
                      </span>
                    ) : (
                      <span className="badge badge-gray">
                        {(SERVICE_HOURS_GOAL - verifiedHours).toFixed(1)}h remaining
                      </span>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {verifiedHours.toFixed(1)} verified / {SERVICE_HOURS_GOAL}h goal
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${goalMet ? "bg-green-500" : "bg-[#c9a227]"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {pendingHours > 0 && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {pendingHours.toFixed(1)}h pending verification
                    </p>
                  )}
                </div>

                {/* Hours table */}
                <div className="rounded-lg border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="table-header">Date</th>
                        <th className="table-header">Description</th>
                        <th className="table-header text-right">Hours</th>
                        <th className="table-header text-center">Status</th>
                        <th className="table-header"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {entries.map((entry) => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="table-cell text-gray-500 whitespace-nowrap">
                            {formatDate(entry.date)}
                          </td>
                          <td className="table-cell">{entry.description}</td>
                          <td className="table-cell text-right font-medium">
                            {entry.hours.toFixed(1)}h
                          </td>
                          <td className="table-cell text-center">
                            {entry.verified ? (
                              <button
                                onClick={() => handleVerify(entry.id, false)}
                                className="badge badge-green cursor-pointer hover:bg-green-200 transition-colors flex items-center gap-1 mx-auto"
                                title="Click to unverify"
                              >
                                <Check className="w-3 h-3" />
                                Verified
                              </button>
                            ) : (
                              <button
                                onClick={() => handleVerify(entry.id, true)}
                                className="badge badge-gray cursor-pointer hover:bg-green-100 hover:text-green-700 transition-colors mx-auto"
                                title="Click to verify"
                              >
                                Pending
                              </button>
                            )}
                          </td>
                          <td className="table-cell">
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Hours Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Log Service Hours" size="md">
        <div className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="form-label">Student *</label>
            <select
              className="form-select"
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            >
              <option value="">Select a student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="form-label">Hours *</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="24"
                className="form-input"
                placeholder="e.g. 2.5"
                value={form.hours}
                onChange={(e) => setForm({ ...form, hours: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="form-label">Description of Service *</label>
            <textarea
              className="form-input min-h-[80px] resize-none"
              placeholder="Describe the service activity..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleAdd} disabled={saving}>
              {saving ? "Saving..." : "Log Hours"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
