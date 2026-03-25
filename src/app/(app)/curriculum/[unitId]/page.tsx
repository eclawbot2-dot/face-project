"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, Clock, BookMarked, Cross, Users, Lightbulb,
  Heart, Home, Printer, ChevronDown, ChevronUp,
} from "lucide-react";
import { gradeLevelLabel } from "@/lib/utils";

interface Lesson {
  id: string;
  unitId: string;
  lessonNumber: number;
  title: string;
  objective: string | null;
  scriptureRef: string | null;
  cccParagraphs: string | null;
  materials: string;
  activities: string;
  prayerFocus: string | null;
  takeHome: string | null;
  notes: string | null;
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
  lessons: Lesson[];
}

function parseMaterials(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function LessonCard({ lesson, defaultOpen }: { lesson: Lesson; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const materials = parseMaterials(lesson.materials);
  const activities = parseMaterials(lesson.activities);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden print:shadow-none print:border print:border-gray-300 print:mb-6 print:break-inside-avoid">
      {/* Lesson header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start gap-3 px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors print:hidden"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1e3a5f] text-white text-sm font-bold flex items-center justify-center mt-0.5">
          {lesson.lessonNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1e3a5f]">{lesson.title}</h3>
          {lesson.objective && (
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{lesson.objective}</p>
          )}
        </div>
        <div className="flex-shrink-0 flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {lesson.durationMinutes}m
          </span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Print-only header */}
      <div className="hidden print:block px-5 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
            {lesson.lessonNumber}
          </div>
          <h3 className="font-bold text-[#1e3a5f] text-lg">{lesson.title}</h3>
          <span className="text-xs text-gray-400 ml-auto">{lesson.durationMinutes} minutes</span>
        </div>
      </div>

      {/* Lesson body */}
      <div className={open ? "block" : "hidden print:block"}>
        <div className="px-5 py-4 space-y-4 bg-gray-50/50 print:bg-white">
          {/* Scripture & CCC */}
          <div className="flex flex-wrap gap-3">
            {lesson.scriptureRef && (
              <div className="flex items-center gap-1.5 text-sm">
                <BookOpen className="w-4 h-4 text-[#c9a227]" />
                <span className="text-gray-700 font-medium">Scripture:</span>
                <span className="text-gray-600 italic">{lesson.scriptureRef}</span>
              </div>
            )}
            {lesson.cccParagraphs && (
              <div className="flex items-center gap-1.5 text-sm">
                <Cross className="w-4 h-4 text-[#c9a227]" />
                <span className="text-gray-700 font-medium">CCC:</span>
                <span className="text-gray-600">{lesson.cccParagraphs}</span>
              </div>
            )}
          </div>

          {/* Objective */}
          {lesson.objective && (
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Lightbulb className="w-4 h-4 text-[#c9a227]" />
                <span className="text-sm font-semibold text-gray-700">Objective</span>
              </div>
              <p className="text-sm text-gray-600 ml-5.5">{lesson.objective}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Materials */}
            {materials.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Users className="w-4 h-4 text-[#1e3a5f]" />
                  <span className="text-sm font-semibold text-gray-700">Materials Needed</span>
                </div>
                <ul className="space-y-1 ml-5.5">
                  {materials.map((m, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                      <span className="text-[#c9a227] mt-0.5">•</span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Activities */}
            {activities.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <BookMarked className="w-4 h-4 text-[#1e3a5f]" />
                  <span className="text-sm font-semibold text-gray-700">Activities</span>
                </div>
                <ol className="space-y-1 ml-5.5">
                  {activities.map((a, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                      <span className="text-[#1e3a5f] font-medium mt-0.5 flex-shrink-0">{i + 1}.</span>
                      {a}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {/* Prayer Focus */}
          {lesson.prayerFocus && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 print:bg-white print:border print:border-amber-300">
              <div className="flex items-center gap-1.5 mb-1">
                <Heart className="w-4 h-4 text-[#c9a227]" />
                <span className="text-sm font-semibold text-amber-800">Prayer Focus</span>
              </div>
              <p className="text-sm text-amber-700 italic ml-5.5">&ldquo;{lesson.prayerFocus}&rdquo;</p>
            </div>
          )}

          {/* Take Home */}
          {lesson.takeHome && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 print:bg-white print:border print:border-blue-300">
              <div className="flex items-center gap-1.5 mb-1">
                <Home className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-semibold text-blue-800">Family Take-Home</span>
              </div>
              <p className="text-sm text-blue-700 ml-5.5">{lesson.takeHome}</p>
            </div>
          )}

          {/* Lesson Plan Link */}
          <div className="border-t border-gray-200 pt-3">
            <Link
              href={`/curriculum/${lesson.unitId}/lesson/${lesson.id}`}
              className="btn-primary text-sm inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" /> View Full Lesson Plan
            </Link>
          </div>

          {/* Notes */}
          {lesson.notes && (
            <div className="text-sm text-gray-500 italic border-t border-gray-200 pt-3">
              <span className="font-medium text-gray-600">ADW Alignment: </span>
              {lesson.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UnitDetailPage() {
  const params = useParams();
  const unitId = params.unitId as string;
  const [unit, setUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(true);
  const [allOpen, setAllOpen] = useState(false);
  const [key, setKey] = useState(0); // force re-render to reset lesson state

  useEffect(() => {
    fetch(`/api/curriculum/${unitId}`)
      .then((r) => r.json())
      .then((d) => { setUnit(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [unitId]);

  const handleExpandAll = () => { setAllOpen(true); setKey((k) => k + 1); };
  const handleCollapseAll = () => { setAllOpen(false); setKey((k) => k + 1); };

  if (loading) return <div className="text-center py-12 text-gray-400">Loading...</div>;
  if (!unit) return <div className="text-center py-12 text-gray-400">Unit not found.</div>;

  const totalMinutes = unit.lessons.reduce((s, l) => s + l.durationMinutes, 0);

  return (
    <div className="space-y-6 print:space-y-4 max-w-4xl">
      {/* Back + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 print:hidden">
        <Link href="/curriculum" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1e3a5f] transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Curriculum
        </Link>
        <div className="flex items-center gap-2 sm:ml-auto">
          <button onClick={handleExpandAll} className="btn-secondary text-sm">Expand All</button>
          <button onClick={handleCollapseAll} className="btn-secondary text-sm">Collapse All</button>
          <button onClick={() => window.print()} className="btn-secondary text-sm flex items-center gap-1.5">
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Unit header */}
      <div className="card print:shadow-none print:border-0 print:p-0">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
            <BookMarked className="w-6 h-6 text-[#c9a227]" />
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-xs font-bold text-[#c9a227] uppercase tracking-wide">
                Unit {unit.unitNumber}
              </span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{unit.program}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{gradeLevelLabel(unit.gradeLevel)}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">{unit.title}</h1>
            {unit.description && (
              <p className="text-gray-600 mt-2">{unit.description}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-[#c9a227]" />
                {unit.lessons.length} lesson{unit.lessons.length !== 1 ? "s" : ""}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#c9a227]" />
                ~{Math.round(totalMinutes / 60 * 10) / 10} hours total
              </span>
              {unit.cccReference && (
                <span className="flex items-center gap-1.5">
                  <Cross className="w-4 h-4 text-[#c9a227]" />
                  {unit.cccReference}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print header */}
      <div className="hidden print:block">
        <p className="text-gray-500 text-sm">Holy Face Faith Formation · {gradeLevelLabel(unit.gradeLevel)} · Academic Year 2025–2026</p>
      </div>

      {/* Lessons */}
      <div className="space-y-4">
        {unit.lessons.map((lesson) => (
          <LessonCard key={`${lesson.id}-${key}-${allOpen}`} lesson={lesson} defaultOpen={allOpen} />
        ))}
      </div>
    </div>
  );
}
