"use client";

import { useEffect, useState } from "react";
import { BarChart3, GraduationCap, Users, ClipboardCheck, Cross, Download, ArrowRight } from "lucide-react";
import { gradeLevelLabel, formatDate } from "@/lib/utils";
import Link from "next/link";

type ReportType = "enrollment" | "attendance" | "sacraments";

interface EnrollmentRow { id: string; name: string; gradeLevel: string; program: string; enrolled: number; catechists: string[] }
interface AttendanceRow { sessionId: string; className: string; date: string; total: number; present: number; absent: number; rate: number }
interface SacramentRow { type: string; total: number; completed: number; inProgress: number; notStarted: number }

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("enrollment");
  const [data, setData] = useState<EnrollmentRow[] | AttendanceRow[] | SacramentRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadReport(reportType);
  }, [reportType]);

  async function loadReport(type: ReportType) {
    setLoading(true);
    const r = await fetch(`/api/reports?type=${type}`);
    const d = await r.json();
    setData(Array.isArray(d) ? d : []);
    setLoading(false);
  }

  function exportCSV() {
    let csv = "";
    if (reportType === "enrollment") {
      const rows = data as EnrollmentRow[];
      csv = "Class,Grade,Program,Enrolled,Catechists\n";
      csv += rows.map((r) => `"${r.name}","${gradeLevelLabel(r.gradeLevel)}","${r.program}",${r.enrolled},"${r.catechists.join("; ")}"`).join("\n");
    } else if (reportType === "attendance") {
      const rows = data as AttendanceRow[];
      csv = "Class,Date,Total,Present,Absent,Rate\n";
      csv += rows.map((r) => `"${r.className}","${formatDate(r.date)}",${r.total},${r.present},${r.absent},${r.rate}%`).join("\n");
    } else {
      const rows = data as SacramentRow[];
      csv = "Sacrament,Total,Completed,In Progress,Not Started\n";
      csv += rows.map((r) => `"${r.type}",${r.total},${r.completed},${r.inProgress},${r.notStarted}`).join("\n");
    }
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `holy-face-${reportType}-report.csv`;
    a.click();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">Faith formation program analytics</p>
        </div>
        <button onClick={exportCSV} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Attendance Reports shortcut */}
      <Link href="/reports/attendance" className="card flex items-center justify-between hover:border-[#1e3a5f] transition-colors group">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#1e3a5f]">Attendance Reports</h3>
            <p className="text-xs text-gray-500">Per-class yearly reports with Excel/CSV export</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#1e3a5f] transition-colors" />
      </Link>

      {/* Report type tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { type: "enrollment" as ReportType, label: "Enrollment", icon: GraduationCap },
          { type: "attendance" as ReportType, label: "Attendance", icon: ClipboardCheck },
          { type: "sacraments" as ReportType, label: "Sacraments", icon: Cross },
        ].map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            onClick={() => setReportType(type)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              reportType === type
                ? "bg-[#1e3a5f] text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-[#1e3a5f] hover:text-[#1e3a5f]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
      ) : (
        <>
          {/* Enrollment Report */}
          {reportType === "enrollment" && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Classes", value: (data as EnrollmentRow[]).length },
                  { label: "Total Enrolled", value: (data as EnrollmentRow[]).reduce((acc, r) => acc + r.enrolled, 0) },
                  { label: "Avg Class Size", value: Math.round((data as EnrollmentRow[]).reduce((acc, r) => acc + r.enrolled, 0) / Math.max((data as EnrollmentRow[]).length, 1)) },
                  { label: "Programs", value: new Set((data as EnrollmentRow[]).map((r) => r.program)).size },
                ].map((stat) => (
                  <div key={stat.label} className="card">
                    <div className="text-2xl font-bold text-[#1e3a5f]">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="table-header">Class</th>
                        <th className="table-header">Grade</th>
                        <th className="table-header">Program</th>
                        <th className="table-header">Enrolled</th>
                        <th className="table-header hidden md:table-cell">Catechist(s)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(data as EnrollmentRow[]).map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="table-cell font-medium">{row.name}</td>
                          <td className="table-cell"><span className="badge badge-blue">{gradeLevelLabel(row.gradeLevel)}</span></td>
                          <td className="table-cell text-gray-500">{row.program}</td>
                          <td className="table-cell">
                            <span className={`badge ${row.enrolled > 0 ? "badge-green" : "badge-gray"}`}>{row.enrolled}</span>
                          </td>
                          <td className="table-cell hidden md:table-cell text-gray-500 text-xs">{row.catechists.join(", ") || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Report */}
          {reportType === "attendance" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: "Sessions Tracked", value: (data as AttendanceRow[]).length },
                  {
                    label: "Avg Attendance Rate",
                    value: `${Math.round((data as AttendanceRow[]).reduce((acc, r) => acc + r.rate, 0) / Math.max((data as AttendanceRow[]).length, 1))}%`,
                  },
                  {
                    label: "Sessions Below 60%",
                    value: (data as AttendanceRow[]).filter((r) => r.total > 0 && r.rate < 60).length,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="card">
                    <div className="text-2xl font-bold text-[#1e3a5f]">{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="table-header">Class</th>
                        <th className="table-header">Date</th>
                        <th className="table-header">Present</th>
                        <th className="table-header">Absent</th>
                        <th className="table-header">Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {(data as AttendanceRow[]).map((row) => (
                        <tr key={row.sessionId} className="hover:bg-gray-50">
                          <td className="table-cell font-medium text-sm">{row.className}</td>
                          <td className="table-cell text-sm text-gray-500">{formatDate(row.date)}</td>
                          <td className="table-cell text-sm">{row.present}</td>
                          <td className="table-cell text-sm">{row.absent}</td>
                          <td className="table-cell">
                            {row.total > 0 ? (
                              <span className={`badge text-xs ${row.rate >= 80 ? "badge-green" : row.rate >= 60 ? "badge-gold" : "badge-red"}`}>
                                {row.rate}%
                              </span>
                            ) : (
                              <span className="badge badge-gray text-xs">No data</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Sacraments Report */}
          {reportType === "sacraments" && (
            <div className="space-y-4">
              {(data as SacramentRow[]).map((row) => {
                const completionRate = row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0;
                return (
                  <div key={row.type} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-bold text-gray-900">{row.type}</h3>
                      <span className="badge badge-blue text-sm">{row.total} students</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 rounded-lg bg-green-50">
                        <div className="text-2xl font-bold text-green-700">{row.completed}</div>
                        <div className="text-xs text-green-600">Completed</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-yellow-50">
                        <div className="text-2xl font-bold text-yellow-700">{row.inProgress}</div>
                        <div className="text-xs text-yellow-600">In Progress</div>
                      </div>
                      <div className="text-center p-3 rounded-lg bg-gray-50">
                        <div className="text-2xl font-bold text-gray-600">{row.notStarted}</div>
                        <div className="text-xs text-gray-500">Not Started</div>
                      </div>
                    </div>
                    {row.total > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Completion Rate</span>
                          <span className="font-medium">{completionRate}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${completionRate}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {(data as SacramentRow[]).length === 0 && (
                <div className="card text-center py-12 text-gray-400">No sacrament records found.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
