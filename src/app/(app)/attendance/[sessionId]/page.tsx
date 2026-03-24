"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Save, Users } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

interface SessionData {
  id: string;
  date: string;
  topic?: string;
  class: { id: string; name: string };
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";

const statusConfig: Record<AttendanceStatus, { label: string; colorClass: string; borderClass: string; activeClass: string }> = {
  PRESENT: { label: "Present", colorClass: "text-green-700", borderClass: "border-green-400", activeClass: "bg-green-100 text-green-700 border-green-300" },
  LATE:    { label: "Late",    colorClass: "text-yellow-700", borderClass: "border-yellow-400", activeClass: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  EXCUSED: { label: "Excused", colorClass: "text-blue-700",  borderClass: "border-blue-400",   activeClass: "bg-blue-100 text-blue-700 border-blue-300" },
  ABSENT:  { label: "Absent",  colorClass: "text-red-700",   borderClass: "border-red-400",    activeClass: "bg-red-100 text-red-700 border-red-300" },
};

export default function AttendanceTakingPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadData(); }, [sessionId]);

  async function loadData() {
    setLoading(true);
    const [sessionRes, attRes] = await Promise.all([
      fetch(`/api/sessions/${sessionId}`),
      fetch(`/api/sessions/${sessionId}/attendance`),
    ]);
    const sess: SessionData & { class: { id: string; name: string }; attendance: AttendanceRecord[] } = await sessionRes.json();
    const attRecords: AttendanceRecord[] = await attRes.json();

    setSessionData(sess);

    const classRes = await fetch(`/api/classes/${sess.class.id}`);
    const classData = await classRes.json();
    const enrolledStudents: Student[] = (classData.enrollments ?? []).map((e: { student: Student }) => e.student);
    setStudents(enrolledStudents);

    const initAtt: Record<string, AttendanceStatus> = {};
    const initNotes: Record<string, string> = {};
    for (const s of enrolledStudents) initAtt[s.id] = "PRESENT";
    for (const r of attRecords) {
      initAtt[r.studentId] = r.status;
      if (r.notes) initNotes[r.studentId] = r.notes;
    }
    setAttendance(initAtt);
    setNotes(initNotes);
    setLoading(false);
  }

  async function saveAttendance() {
    setSaving(true);
    const records = students.map((s) => ({
      studentId: s.id,
      status: attendance[s.id] ?? "PRESENT",
      notes: notes[s.id] ?? undefined,
    }));
    await fetch(`/api/sessions/${sessionId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function markAll(status: AttendanceStatus) {
    const next: Record<string, AttendanceStatus> = {};
    for (const s of students) next[s.id] = status;
    setAttendance(next);
  }

  const present = students.filter((s) => ["PRESENT", "LATE"].includes(attendance[s.id] ?? "")).length;
  const absent = students.filter((s) => attendance[s.id] === "ABSENT").length;
  const excused = students.filter((s) => attendance[s.id] === "EXCUSED").length;

  if (loading) return (
    <div className="space-y-4 max-w-2xl">
      {[...Array(6)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-gray-100" />)}
    </div>
  );
  if (!sessionData) return <div className="card text-center py-12 text-gray-500">Session not found.</div>;

  return (
    <div className="space-y-6 max-w-2xl pb-24">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-[#1e3a5f] text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="card">
        <h1 className="text-xl font-bold text-[#1e3a5f]">{sessionData.class.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {formatDate(sessionData.date)}{sessionData.topic ? ` · ${sessionData.topic}` : ""}
        </p>
        <div className="flex gap-6 mt-4">
          {[
            { label: "Present", value: present, color: "text-green-700" },
            { label: "Absent", value: absent, color: "text-red-600" },
            { label: "Excused", value: excused, color: "text-blue-600" },
            { label: "Total", value: students.length, color: "text-gray-600" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mark all */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-600">Mark All:</span>
        {(["PRESENT", "ABSENT"] as AttendanceStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => markAll(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig[status].activeClass}`}
          >
            {statusConfig[status].label}
          </button>
        ))}
      </div>

      {students.length === 0 ? (
        <div className="card text-center py-10 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2" />
          No students enrolled in this class.
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const status = attendance[s.id] ?? "PRESENT";
            return (
              <div
                key={s.id}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 border-l-4 ${statusConfig[status].borderClass}`}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="font-semibold text-gray-900 min-w-0">{s.firstName} {s.lastName}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {(["PRESENT", "LATE", "EXCUSED", "ABSENT"] as AttendanceStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => setAttendance({ ...attendance, [s.id]: st })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          status === st
                            ? statusConfig[st].activeClass
                            : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"
                        }`}
                      >
                        {statusConfig[st].label}
                      </button>
                    ))}
                  </div>
                </div>
                {(status === "ABSENT" || status === "EXCUSED") && (
                  <input
                    value={notes[s.id] ?? ""}
                    onChange={(e) => setNotes({ ...notes, [s.id]: e.target.value })}
                    placeholder="Add a note (optional)"
                    className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1e3a5f]"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:relative md:bottom-auto md:border-none md:bg-transparent md:p-0">
        <button
          onClick={saveAttendance}
          disabled={saving || students.length === 0}
          className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all text-white ${
            saved ? "bg-green-600" : "bg-[#1e3a5f] hover:bg-[#2a4f7c]"
          } disabled:opacity-60`}
        >
          {saved ? <><Check className="w-5 h-5" /> Attendance Saved!</> : <><Save className="w-5 h-5" /> {saving ? "Saving..." : "Save Attendance"}</>}
        </button>
      </div>
    </div>
  );
}
