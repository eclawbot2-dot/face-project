'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, Clock, BookOpen, MessageCircle, FileText, Heart, Home, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { gradeLevelLabel } from '@/lib/utils';

interface TeachSection {
  section: string;
  duration: string;
  instructions: string;
  discussion: string[];
  teacherAnswers: string[];
}

interface LessonPlan {
  welcome: string;
  openingPrayer: string;
  review: string;
  teach: TeachSection[];
  activity: { title: string; duration: string; instructions: string; materials: string };
  handout: { title: string; description: string; content: string };
  closingPrayer: string;
  takeHome: string;
  teacherNotes: string;
}

interface LessonData {
  id: string;
  title: string;
  objective: string;
  scriptureRef: string;
  cccParagraphs: string;
  materials: string[];
  prayerFocus: string;
  takeHome: string;
  notes: string;
}

interface UnitData {
  id: string;
  title: string;
  gradeLevel: string;
  program: string;
}

export default function LessonPlanPage() {
  const { unitId, lessonId } = useParams<{ unitId: string; lessonId: string }>();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [unit, setUnit] = useState<UnitData | null>(null);
  const [plan, setPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({});
  const [showHandout, setShowHandout] = useState(false);

  useEffect(() => {
    fetch(`/api/curriculum/${unitId}/lessons/${lessonId}/plan`)
      .then(r => r.json())
      .then(d => {
        setLesson(d.lesson);
        setUnit(d.unit);
        setPlan(d.plan);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [unitId, lessonId]);

  const printHandout = () => {
    if (!plan?.handout) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>${plan.handout.title}</title>
      <style>
        body { font-family: -apple-system, sans-serif; padding: 40px; max-width: 700px; margin: 0 auto; }
        h1 { font-size: 20px; border-bottom: 2px solid #1e3a5f; padding-bottom: 8px; color: #1e3a5f; }
        h2 { font-size: 14px; color: #666; margin-top: 0; }
        .content { font-size: 14px; line-height: 1.8; white-space: pre-wrap; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <h1>${plan.handout.title}</h1>
      <h2>${lesson?.title} — ${unit?.program}</h2>
      <div class="content">${plan.handout.content.replace(/\n/g, '<br>')}</div>
      <script>window.print();</script>
      </body></html>
    `);
  };

  const printLessonPlan = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading lesson plan...</div>;
  if (!lesson || !unit) return <div className="p-8 text-center text-gray-400">Lesson not found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 print:space-y-3">
      {/* Header */}
      <div className="flex items-center gap-3 print:hidden">
        <Link href={`/curriculum/${unitId}`} className="text-gray-400 hover:text-[#1e3a5f]">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f] truncate">{lesson.title}</h1>
          <p className="text-gray-500 text-sm">{gradeLevelLabel(unit.gradeLevel)} — {unit.title}</p>
        </div>
        <button onClick={printLessonPlan} className="btn-secondary flex items-center gap-2 text-sm">
          <Printer className="w-4 h-4" /> Print
        </button>
      </div>

      {/* Print header */}
      <div className="hidden print:block border-b-2 border-[#1e3a5f] pb-2">
        <h1 className="text-xl font-bold text-[#1e3a5f]">{lesson.title}</h1>
        <p className="text-sm text-gray-600">{gradeLevelLabel(unit.gradeLevel)} — {unit.title} — {unit.program}</p>
      </div>

      {/* Lesson overview card */}
      <div className="card bg-gradient-to-r from-[#1e3a5f] to-[#2a4f7c] text-white print:bg-white print:text-black print:border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-blue-200 print:text-gray-500 text-xs font-medium uppercase">Objective</div>
            <div className="mt-1">{lesson.objective}</div>
          </div>
          <div>
            <div className="text-blue-200 print:text-gray-500 text-xs font-medium uppercase">Scripture</div>
            <div className="mt-1">{lesson.scriptureRef}</div>
          </div>
          <div>
            <div className="text-blue-200 print:text-gray-500 text-xs font-medium uppercase">Catechism</div>
            <div className="mt-1">{lesson.cccParagraphs}</div>
          </div>
          <div>
            <div className="text-blue-200 print:text-gray-500 text-xs font-medium uppercase">Duration</div>
            <div className="mt-1 flex items-center gap-1"><Clock className="w-4 h-4" /> 60 minutes</div>
          </div>
        </div>
        {lesson.materials.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/20 print:border-gray-200">
            <div className="text-blue-200 print:text-gray-500 text-xs font-medium uppercase mb-1">Materials Needed</div>
            <div className="flex flex-wrap gap-2">
              {lesson.materials.map((m, i) => (
                <span key={i} className="bg-white/10 print:bg-gray-100 px-2 py-1 rounded text-xs">{m}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {!plan ? (
        <div className="card text-center py-12 text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>Lesson plan is being generated. Check back soon!</p>
        </div>
      ) : (
        <>
          {/* Welcome / Icebreaker — 5 min */}
          <div className="card print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-green-700 font-bold text-xs">5m</span>
              </div>
              <h2 className="font-bold text-[#1e3a5f]">Welcome & Icebreaker</h2>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.welcome}</p>
          </div>

          {/* Opening Prayer — 3 min */}
          <div className="card bg-blue-50 print:bg-white print:border print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-200 flex items-center justify-center">
                <Heart className="w-4 h-4 text-blue-700" />
              </div>
              <h2 className="font-bold text-[#1e3a5f]">Opening Prayer (3 min)</h2>
            </div>
            <p className="text-sm text-gray-700 italic whitespace-pre-wrap">{plan.openingPrayer}</p>
          </div>

          {/* Review — 5 min */}
          <div className="card print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                <span className="text-yellow-700 font-bold text-xs">5m</span>
              </div>
              <h2 className="font-bold text-[#1e3a5f]">Review from Last Week</h2>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.review}</p>
          </div>

          {/* Teaching Sections — ~25 min */}
          {plan.teach.map((section, idx) => (
            <div key={idx} className="card print:break-inside-avoid">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-[#1e3a5f]">{section.section}</h2>
                  <p className="text-xs text-gray-400">{section.duration}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-700 whitespace-pre-wrap mb-4">{section.instructions}</div>
              
              {section.discussion.length > 0 && (
                <div className="bg-[#1e3a5f]/5 rounded-xl p-4 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 text-[#1e3a5f]" />
                    <span className="font-semibold text-[#1e3a5f] text-sm">Discussion Questions</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-sm text-gray-700">
                    {section.discussion.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ol>
                </div>
              )}

              {section.teacherAnswers.length > 0 && (
                <div className="print:block">
                  <button
                    onClick={() => setShowAnswers(prev => ({ ...prev, [idx]: !prev[idx] }))}
                    className="flex items-center gap-2 text-sm text-[#c9a227] hover:text-[#1e3a5f] font-medium print:hidden"
                  >
                    <Lightbulb className="w-4 h-4" />
                    {showAnswers[idx] ? 'Hide' : 'Show'} Teacher Answers
                    {showAnswers[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                  <div className={`mt-2 bg-[#c9a227]/10 rounded-xl p-4 text-sm ${showAnswers[idx] ? 'block' : 'hidden'} print:block`}>
                    <div className="font-semibold text-[#c9a227] text-xs uppercase mb-2">Teacher Answer Key</div>
                    <ol className="list-decimal list-inside space-y-1.5 text-gray-700">
                      {section.teacherAnswers.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Activity — 15 min */}
          <div className="card border-l-4 border-l-green-500 print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <span className="text-green-700 font-bold text-xs">15m</span>
              </div>
              <div>
                <h2 className="font-bold text-[#1e3a5f]">Activity: {plan.activity.title}</h2>
                <p className="text-xs text-gray-400">{plan.activity.duration}</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{plan.activity.instructions}</p>
            {plan.activity.materials && (
              <p className="text-xs text-gray-500 mt-2"><strong>Materials:</strong> {plan.activity.materials}</p>
            )}
          </div>

          {/* Handout */}
          <div className="card border-2 border-dashed border-[#1e3a5f]/30 print:break-inside-avoid">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1e3a5f]" />
                <h2 className="font-bold text-[#1e3a5f]">Student Handout: {plan.handout.title}</h2>
              </div>
              <button onClick={printHandout} className="btn-gold text-xs flex items-center gap-1 print:hidden">
                <Printer className="w-3 h-3" /> Print Handout
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-3">{plan.handout.description}</p>
            <button
              onClick={() => setShowHandout(!showHandout)}
              className="text-sm text-[#1e3a5f] hover:underline font-medium print:hidden"
            >
              {showHandout ? 'Hide' : 'Preview'} Handout Content
            </button>
            <div className={`mt-3 bg-white border border-gray-200 rounded-lg p-4 text-sm whitespace-pre-wrap ${showHandout ? 'block' : 'hidden'} print:block`}>
              {plan.handout.content}
            </div>
          </div>

          {/* Closing Prayer — 4 min */}
          <div className="card bg-blue-50 print:bg-white print:border print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
              <Heart className="w-5 h-5 text-[#1e3a5f]" />
              <h2 className="font-bold text-[#1e3a5f]">Closing Prayer (4 min)</h2>
            </div>
            <p className="text-sm text-gray-700 italic whitespace-pre-wrap">{plan.closingPrayer}</p>
          </div>

          {/* Take Home — 3 min */}
          <div className="card print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
              <Home className="w-5 h-5 text-[#1e3a5f]" />
              <h2 className="font-bold text-[#1e3a5f]">Take-Home Family Activity</h2>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.takeHome}</p>
          </div>

          {/* Teacher Notes */}
          <div className="card bg-yellow-50 print:bg-white print:border print:break-inside-avoid">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-[#c9a227]" />
              <h2 className="font-bold text-[#c9a227]">Teacher Notes</h2>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{plan.teacherNotes}</p>
          </div>
        </>
      )}
    </div>
  );
}
