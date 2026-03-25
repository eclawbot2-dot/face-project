'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Download, BarChart3, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { gradeLevelLabel } from '@/lib/utils';

interface SessionDate {
  id: string;
  date: string;
  dateFormatted: string;
}

interface StudentReport {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  present: number;
  absent: number;
  excused: number;
  late: number;
  totalRecorded: number;
  totalSessions: number;
  attendanceRate: number | null;
  sessionRecords: Record<string, string>;
}

interface ClassReport {
  classId: string;
  className: string;
  program: string;
  gradeLevel: string;
  academicYear: string;
  catechists: string[];
  totalSessions: number;
  totalStudents: number;
  avgAttendanceRate: number | null;
  sessionDates: SessionDate[];
  students: StudentReport[];
  year: string;
}

const statusShort: Record<string, string> = {
  PRESENT: 'P',
  ABSENT: 'A',
  EXCUSED: 'E',
  LATE: 'L',
  'N/R': '-',
};

const statusColor: Record<string, string> = {
  PRESENT: 'text-green-600 bg-green-50',
  ABSENT: 'text-red-600 bg-red-50',
  EXCUSED: 'text-blue-600 bg-blue-50',
  LATE: 'text-yellow-600 bg-yellow-50',
  'N/R': 'text-gray-300 bg-gray-50',
};

export default function AttendanceReportsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear.toString());
  const [classFilter, setClassFilter] = useState('');
  const [reports, setReports] = useState<ClassReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClass, setExpandedClass] = useState<string | null>(null);
  const [allClasses, setAllClasses] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setAllClasses(d.map((c: any) => ({ id: c.id, name: c.name })));
    });
  }, []);

  useEffect(() => {
    loadReport();
  }, [year, classFilter]);

  async function loadReport() {
    setLoading(true);
    const params = new URLSearchParams({ year });
    if (classFilter) params.set('classId', classFilter);
    const res = await fetch(`/api/reports/attendance-export?${params}`);
    const data = await res.json();
    setReports(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  function downloadCSV() {
    const params = new URLSearchParams({ year, format: 'csv' });
    if (classFilter) params.set('classId', classFilter);
    window.open(`/api/reports/attendance-export?${params}`, '_blank');
  }

  // Yearly totals across all classes
  const totalStudents = reports.reduce((sum, r) => sum + r.totalStudents, 0);
  const totalSessions = reports.reduce((sum, r) => sum + r.totalSessions, 0);
  const allRates = reports.filter(r => r.avgAttendanceRate !== null).map(r => r.avgAttendanceRate!);
  const overallRate = allRates.length > 0 ? Math.round(allRates.reduce((a, b) => a + b, 0) / allRates.length) : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link href="/reports" className="text-gray-400 hover:text-[#1e3a5f]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">Attendance Reports</h1>
            <p className="text-gray-500 text-sm">Per-class and yearly attendance tracking</p>
          </div>
        </div>
        <button onClick={downloadCSV} className="btn-gold flex items-center gap-2">
          <Download className="w-4 h-4" /> Download Excel/CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="sm:w-48">
          <label className="form-label">Year</label>
          <select className="form-select" value={year} onChange={e => setYear(e.target.value)}>
            {[currentYear, currentYear - 1, currentYear - 2].map(y => (
              <option key={y} value={y}>{y}-{y + 1}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="form-label">Class</label>
          <select className="form-select" value={classFilter} onChange={e => setClassFilter(e.target.value)}>
            <option value="">All Classes</option>
            {allClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Yearly Summary */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="card text-center py-4">
            <div className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">{reports.length}</div>
            <div className="text-xs text-gray-500 mt-1">Classes</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">{totalStudents}</div>
            <div className="text-xs text-gray-500 mt-1">Students</div>
          </div>
          <div className="card text-center py-4">
            <div className="text-2xl sm:text-3xl font-bold text-[#1e3a5f]">{totalSessions}</div>
            <div className="text-xs text-gray-500 mt-1">Total Sessions</div>
          </div>
          <div className="card text-center py-4">
            <div className={`text-2xl sm:text-3xl font-bold ${
              overallRate === null ? 'text-gray-400' :
              overallRate >= 80 ? 'text-green-600' :
              overallRate >= 60 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {overallRate !== null ? `${overallRate}%` : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mt-1">Avg Attendance</div>
          </div>
        </div>
      )}

      {/* Per-Class Reports */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No attendance data for {year}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(cls => {
            const isExpanded = expandedClass === cls.classId;
            return (
              <div key={cls.classId} className="card p-0 overflow-hidden">
                {/* Class header — always visible */}
                <button
                  onClick={() => setExpandedClass(isExpanded ? null : cls.classId)}
                  className="w-full flex items-center justify-between px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-[#1e3a5f] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {cls.className.match(/\d+/)?.[0] || cls.className[0]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-[#1e3a5f] truncate">{cls.className}</h3>
                      <p className="text-xs text-gray-400 truncate">
                        {cls.totalStudents} students · {cls.totalSessions} sessions
                        {cls.catechists.length > 0 && ` · ${cls.catechists.join(', ')}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`badge text-sm ${
                      cls.avgAttendanceRate === null ? 'badge-gray' :
                      cls.avgAttendanceRate >= 80 ? 'badge-green' :
                      cls.avgAttendanceRate >= 60 ? 'badge-gold' : 'badge-red'
                    }`}>
                      {cls.avgAttendanceRate !== null ? `${cls.avgAttendanceRate}%` : 'N/A'}
                    </span>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                  </div>
                </button>

                {/* Expanded: student detail table */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {cls.students.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">No students enrolled</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50">
                              <th className="text-left px-3 sm:px-4 py-2 font-semibold text-gray-500 text-xs uppercase sticky left-0 bg-gray-50 z-10 min-w-[140px]">Student</th>
                              {cls.sessionDates.map(d => (
                                <th key={d.id} className="px-1 py-2 text-center text-[10px] text-gray-400 font-medium min-w-[36px]">
                                  {d.dateFormatted}
                                </th>
                              ))}
                              <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase bg-gray-100">P</th>
                              <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase bg-gray-100">A</th>
                              <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase bg-gray-100">E</th>
                              <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase bg-gray-100">L</th>
                              <th className="px-2 py-2 text-center text-[10px] text-gray-500 font-semibold uppercase bg-gray-100">Rate</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {cls.students.map(student => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-3 sm:px-4 py-2 font-medium text-gray-800 text-xs sticky left-0 bg-white z-10 whitespace-nowrap">
                                  {student.name}
                                </td>
                                {cls.sessionDates.map(d => {
                                  const status = student.sessionRecords[d.id] ?? 'N/R';
                                  return (
                                    <td key={d.id} className="px-1 py-2 text-center">
                                      <span className={`inline-block w-6 h-6 leading-6 rounded text-[10px] font-bold ${statusColor[status] ?? statusColor['N/R']}`}>
                                        {statusShort[status] ?? '-'}
                                      </span>
                                    </td>
                                  );
                                })}
                                <td className="px-2 py-2 text-center text-xs font-medium text-green-600">{student.present}</td>
                                <td className="px-2 py-2 text-center text-xs font-medium text-red-600">{student.absent}</td>
                                <td className="px-2 py-2 text-center text-xs font-medium text-blue-600">{student.excused}</td>
                                <td className="px-2 py-2 text-center text-xs font-medium text-yellow-600">{student.late}</td>
                                <td className="px-2 py-2 text-center">
                                  <span className={`badge text-[10px] ${
                                    student.attendanceRate === null ? 'badge-gray' :
                                    student.attendanceRate >= 80 ? 'badge-green' :
                                    student.attendanceRate >= 60 ? 'badge-gold' : 'badge-red'
                                  }`}>
                                    {student.attendanceRate !== null ? `${student.attendanceRate}%` : 'N/A'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Class footer with download */}
                    <div className="px-4 sm:px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <div className="text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-50 text-green-600 text-[8px] font-bold text-center leading-3">P</span> Present</span>
                        <span className="ml-2 inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-50 text-red-600 text-[8px] font-bold text-center leading-3">A</span> Absent</span>
                        <span className="ml-2 inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-50 text-blue-600 text-[8px] font-bold text-center leading-3">E</span> Excused</span>
                        <span className="ml-2 inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-50 text-yellow-600 text-[8px] font-bold text-center leading-3">L</span> Late</span>
                      </div>
                      <button
                        onClick={() => {
                          const params = new URLSearchParams({ year, classId: cls.classId, format: 'csv' });
                          window.open(`/api/reports/attendance-export?${params}`, '_blank');
                        }}
                        className="text-xs text-[#1e3a5f] hover:underline font-medium flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" /> Download this class
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
