"use client";

import { useEffect, useState } from "react";
import { BookMarked, ChevronDown, ChevronRight, BookOpen, Clock, Cross, Search, Printer } from "lucide-react";
import { gradeLevelLabel, GRADE_LEVELS } from "@/lib/utils";
import Link from "next/link";

interface LessonSummary {
  id: string;
  lessonNumber: number;
  title: string;
  objective: string | null;
  scriptureRef: string | null;
  durationMinutes: number;
}

interface Unit {
  id: string;
  gradeLevel: string;
  program: string;
  unitNumber: number;
  title: string;
  description: string | null;
  cccReference: string | null;
  lessons: LessonSummary[];
}

const GRADE_ORDER = [
  "PRE_K", "KINDERGARTEN", "GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4",
  "GRADE_5", "GRADE_6", "GRADE_7", "GRADE_8", "ADULT",
];

const gradeColors: Record<string, string> = {
  PRE_K: "bg-pink-100 text-pink-800",
  KINDERGARTEN: "bg-purple-100 text-purple-800",
  GRADE_1: "bg-blue-100 text-blue-800",
  GRADE_2: "bg-indigo-100 text-indigo-800",
  GRADE_3: "bg-green-100 text-green-800",
  GRADE_4: "bg-teal-100 text-teal-800",
  GRADE_5: "bg-cyan-100 text-cyan-800",
  GRADE_6: "bg-orange-100 text-orange-800",
  GRADE_7: "bg-amber-100 text-amber-800",
  GRADE_8: "bg-yellow-100 text-yellow-800",
  ADULT: "bg-gray-100 text-gray-800",
};

export default function CurriculumPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState("");
  const [search, setSearch] = useState("");
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedGrade) params.set("grade", selectedGrade);
    fetch(`/api/curriculum?${params}`)
      .then((r) => r.json())
      .then((d) => { setUnits(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedGrade]);

  const toggleUnit = (id: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedUnits(new Set(units.map((u) => u.id)));
  const collapseAll = () => setExpandedUnits(new Set());

  const filtered = units.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.title.toLowerCase().includes(q) ||
      u.description?.toLowerCase().includes(q) ||
      u.lessons.some((l) => l.title.toLowerCase().includes(q))
    );
  });

  // Group by grade
  const grouped = GRADE_ORDER.reduce<Record<string, Unit[]>>((acc, grade) => {
    const gradeUnits = filtered.filter((u) => u.gradeLevel === grade);
    if (gradeUnits.length > 0) acc[grade] = gradeUnits;
    return acc;
  }, {});

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f] flex items-center gap-2">
            <BookMarked className="w-7 h-7 text-[#c9a227]" />
            Curriculum
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse the full scope &amp; sequence for all grades
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      {/* Print title */}
      <div className="hidden print:block">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">
          Holy Face Faith Formation — Curriculum Scope &amp; Sequence
          {selectedGrade && ` — ${gradeLevelLabel(selectedGrade)}`}
        </h1>
        <p className="text-gray-500 text-sm">Academic Year 2025–2026</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 print:hidden">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="form-input pl-9"
            placeholder="Search units and lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-select w-auto"
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
        >
          <option value="">All Grades</option>
          {GRADE_LEVELS.map((g) => (
            <option key={g.value} value={g.value}>{g.label}</option>
          ))}
        </select>
        <button onClick={expandAll} className="btn-secondary text-sm">Expand All</button>
        <button onClick={collapseAll} className="btn-secondary text-sm">Collapse All</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading curriculum...</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400">No curriculum found.</div>
      ) : (
        Object.entries(grouped).map(([grade, gradeUnits]) => (
          <div key={grade} className="space-y-3">
            {/* Grade header */}
            <div className="flex items-center gap-3 print:mt-6">
              <span className={`badge ${gradeColors[grade] ?? "badge-gray"} text-sm px-3 py-1`}>
                {gradeLevelLabel(grade)}
              </span>
              <span className="text-sm text-gray-500">
                {gradeUnits.length} unit{gradeUnits.length !== 1 ? "s" : ""} ·{" "}
                {gradeUnits.reduce((s, u) => s + u.lessons.length, 0)} lessons
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {gradeUnits.map((unit) => {
              const expanded = expandedUnits.has(unit.id);
              const totalMinutes = unit.lessons.reduce((s, l) => s + l.durationMinutes, 0);
              return (
                <div key={unit.id} className="card p-0 overflow-hidden print:shadow-none print:border print:border-gray-300">
                  {/* Unit header */}
                  <button
                    onClick={() => toggleUnit(unit.id)}
                    className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50 transition-colors print:hidden"
                  >
                    <div className="mt-0.5 flex-shrink-0 text-[#1e3a5f]">
                      {expanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[#c9a227] uppercase tracking-wide">
                          Unit {unit.unitNumber}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">{unit.program}</span>
                      </div>
                      <h3 className="font-semibold text-[#1e3a5f] mt-0.5">{unit.title}</h3>
                      {unit.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{unit.description}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {unit.lessons.length} lesson{unit.lessons.length !== 1 ? "s" : ""}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {Math.round(totalMinutes / 60 * 10) / 10}h
                      </span>
                    </div>
                  </button>

                  {/* Print-only unit header */}
                  <div className="hidden print:block px-5 py-3 border-b border-gray-200">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xs font-bold text-[#c9a227] uppercase">Unit {unit.unitNumber}</span>
                      <h3 className="font-bold text-[#1e3a5f]">{unit.title}</h3>
                    </div>
                    {unit.description && <p className="text-sm text-gray-600 mt-0.5">{unit.description}</p>}
                    {unit.cccReference && (
                      <p className="text-xs text-gray-400 mt-0.5">Reference: {unit.cccReference}</p>
                    )}
                  </div>

                  {/* Lessons — visible when expanded or when printing */}
                  <div className={expanded ? "block" : "hidden print:block"}>
                    {unit.cccReference && (
                      <div className="px-5 py-2 bg-amber-50 border-t border-amber-100 flex items-center gap-2 print:hidden">
                        <Cross className="w-3.5 h-3.5 text-[#c9a227]" />
                        <span className="text-xs text-amber-700">CCC Reference: {unit.cccReference}</span>
                      </div>
                    )}
                    <div className="divide-y divide-gray-100">
                      {unit.lessons.map((lesson) => (
                        <div key={lesson.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 print:hover:bg-white print:py-2">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1e3a5f]/10 text-[#1e3a5f] text-xs font-bold flex items-center justify-center mt-0.5">
                            {lesson.lessonNumber}
                          </span>
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/curriculum/${unit.id}?lesson=${lesson.id}`}
                              className="font-medium text-sm text-[#1e3a5f] hover:underline print:no-underline print:text-gray-900"
                            >
                              {lesson.title}
                            </Link>
                            {lesson.objective && (
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1 print:line-clamp-none">
                                {lesson.objective}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-3 text-xs text-gray-400">
                            {lesson.scriptureRef && (
                              <span className="hidden sm:block italic">{lesson.scriptureRef}</span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {lesson.durationMinutes}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 print:hidden">
                      <Link
                        href={`/curriculum/${unit.id}`}
                        className="text-xs font-medium text-[#1e3a5f] hover:underline"
                      >
                        View full unit with lesson plans →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))
      )}
    </div>
  );
}
