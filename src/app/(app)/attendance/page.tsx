'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, MinusCircle, Save, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { formatDate, attendanceStatusLabel } from '@/lib/utils';

interface ClassItem {
  id: string;
  name: string;
  program: string;
  gradeLevel: string;
  enrollments: Array<{ student: { id: string; firstName: string; lastName: string } }>;
}

interface Session {
  id: string;
  date: string;
  topic?: string;
  classId: string;
  class: { name: string };
  attendance: Array<{ studentId: string; status: string; notes?: string }>;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE';

const statusIcon: Record<AttendanceStatus, React.ReactNode> = {
  PRESENT: <CheckCircle2 className="w-6 h-6 text-green-500" />,
  ABSENT: <XCircle className="w-6 h-6 text-red-500" />,
  EXCUSED: <MinusCircle className="w-6 h-6 text-blue-500" />,
  LATE: <Clock className="w-6 h-6 text-yellow-500" />,
};

const statusOrder: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'EXCUSED', 'LATE'];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function AttendancePage() {
  const searchParams = useSearchParams();
  const preselectedClassId = searchParams.get('classId') || '';

  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(preselectedClassId);
  const [sessions, setSessions] = useState<Session[]>([]);
  
  // Calendar state
  const today = new Date();
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);
  
  // Attendance state
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [creatingSession, setCreatingSession] = useState(false);

  // Load classes
  useEffect(() => {
    fetch('/api/classes').then(r => r.json()).then(d => {
      const list = Array.isArray(d) ? d : [];
      setClasses(list);
      // Auto-select first class if catechist only has one
      if (!preselectedClassId && list.length === 1) {
        setSelectedClassId(list[0].id);
      }
    });
  }, [preselectedClassId]);

  // Load sessions for selected class
  useEffect(() => {
    if (!selectedClassId) { setSessions([]); return; }
    fetch(`/api/sessions?classId=${selectedClassId}`).then(r => r.json()).then(d => setSessions(Array.isArray(d) ? d : []));
  }, [selectedClassId]);

  // When date or sessions change, find or prepare session
  useEffect(() => {
    if (!selectedClassId || !selectedDate) { setCurrentSession(null); setAttendance({}); return; }
    
    // Find existing session for this date
    const existing = sessions.find(s => {
      const sDate = new Date(s.date).toISOString().split('T')[0];
      return sDate === selectedDate;
    });
    
    if (existing) {
      setCurrentSession(existing);
      // Load attendance
      const init: Record<string, AttendanceStatus> = {};
      const cls = classes.find(c => c.id === selectedClassId);
      if (cls) {
        cls.enrollments.forEach(e => { init[e.student.id] = 'PRESENT'; });
      }
      existing.attendance.forEach(a => { init[a.studentId] = a.status as AttendanceStatus; });
      setAttendance(init);
    } else {
      setCurrentSession(null);
      // Pre-fill all as present
      const init: Record<string, AttendanceStatus> = {};
      const cls = classes.find(c => c.id === selectedClassId);
      if (cls) {
        cls.enrollments.forEach(e => { init[e.student.id] = 'PRESENT'; });
      }
      setAttendance(init);
    }
  }, [selectedDate, sessions, selectedClassId, classes]);

  const selectedClass = classes.find(c => c.id === selectedClassId);

  const cycleStatus = (studentId: string) => {
    const current = attendance[studentId] || 'PRESENT';
    const idx = statusOrder.indexOf(current);
    const next = statusOrder[(idx + 1) % statusOrder.length];
    setAttendance(prev => ({ ...prev, [studentId]: next }));
  };

  const setAll = (status: AttendanceStatus) => {
    const updated = { ...attendance };
    Object.keys(updated).forEach(k => { updated[k] = status; });
    setAttendance(updated);
  };

  const saveAttendance = async () => {
    if (!selectedClassId || !selectedDate) return;
    setSaving(true);
    
    let sessionId = currentSession?.id;
    
    // Create session if it doesn't exist
    if (!sessionId) {
      setCreatingSession(true);
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClassId, date: selectedDate }),
      });
      if (res.ok) {
        const newSession = await res.json();
        sessionId = newSession.id;
      }
      setCreatingSession(false);
    }
    
    if (!sessionId) { setSaving(false); return; }
    
    const records = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
    await fetch(`/api/sessions/${sessionId}/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    
    // Reload sessions
    const res = await fetch(`/api/sessions?classId=${selectedClassId}`);
    const data = await res.json();
    setSessions(Array.isArray(data) ? data : []);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter(s => s === 'PRESENT' || s === 'LATE').length;
  const totalCount = Object.keys(attendance).length;

  // Calendar helpers
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  
  // Dates that have sessions (for highlighting)
  const sessionDates = new Set(sessions.map(s => new Date(s.date).toISOString().split('T')[0]));
  
  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  };
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  };
  const goToToday = () => {
    setCalMonth(today.getMonth());
    setCalYear(today.getFullYear());
    setSelectedDate(today.toISOString().split('T')[0]);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#1e3a5f]">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Pick a class, pick a date, take attendance</p>
      </div>

      {/* Class selector */}
      <div>
        <label className="form-label">Class</label>
        <select 
          className="form-select" 
          value={selectedClassId} 
          onChange={e => { setSelectedClassId(e.target.value); setCurrentSession(null); }}
        >
          <option value="">Choose a class...</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {selectedClassId && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Calendar */}
          <div className="lg:col-span-1">
            <div className="card p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="text-center">
                  <h3 className="font-bold text-[#1e3a5f] text-sm">{MONTHS[calMonth]} {calYear}</h3>
                </div>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              
              <button onClick={goToToday} className="w-full text-xs text-[#1e3a5f] hover:underline mb-2">Today</button>
              
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-0 mb-1">
                {DAYS.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">{d}</div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-0">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-1" />
                ))}
                
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = dateStr === selectedDate;
                  const isToday = dateStr === today.toISOString().split('T')[0];
                  const hasSession = sessionDates.has(dateStr);
                  
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative p-1 m-0.5 rounded-lg text-sm font-medium transition-all min-h-[36px] ${
                        isSelected
                          ? 'bg-[#1e3a5f] text-white shadow-sm'
                          : isToday
                          ? 'bg-[#c9a227]/20 text-[#1e3a5f] font-bold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {day}
                      {hasSession && !isSelected && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-green-500" />
                      )}
                      {hasSession && isSelected && (
                        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Legend */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500" /> Recorded
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#c9a227]" /> Today
                </div>
              </div>
            </div>
          </div>
          
          {/* Attendance panel */}
          <div className="lg:col-span-2">
            {selectedClass && totalCount > 0 ? (
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div>
                    <h2 className="font-bold text-[#1e3a5f]">{selectedClass.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-600 font-medium">
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    {currentSession && (
                      <p className="text-xs text-green-600 mt-1 font-medium">Attendance already recorded — editing</p>
                    )}
                    {!currentSession && (
                      <p className="text-xs text-gray-400 mt-1">New session — attendance will be saved when you hit Save</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">{presentCount}/{totalCount} present</span>
                    <div className="flex gap-1">
                      <button onClick={() => setAll('PRESENT')} className="text-xs btn-secondary py-1 px-2">All Present</button>
                      <button onClick={() => setAll('ABSENT')} className="text-xs border border-red-200 text-red-600 px-2 py-1 rounded-lg hover:bg-red-50">All Absent</button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {selectedClass.enrollments.map(e => {
                    const status = attendance[e.student.id] || 'PRESENT';
                    return (
                      <div
                        key={e.student.id}
                        onClick={() => cycleStatus(e.student.id)}
                        className={`flex items-center justify-between p-3 sm:p-4 rounded-xl cursor-pointer transition-colors select-none active:scale-[0.98] ${
                          status === 'PRESENT' ? 'bg-green-50 hover:bg-green-100' :
                          status === 'ABSENT' ? 'bg-red-50 hover:bg-red-100' :
                          status === 'EXCUSED' ? 'bg-blue-50 hover:bg-blue-100' :
                          'bg-yellow-50 hover:bg-yellow-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {e.student.firstName[0]}{e.student.lastName[0]}
                          </div>
                          <div>
                            <span className="font-medium text-gray-800 text-base">{e.student.firstName} {e.student.lastName}</span>
                            <div className="text-xs text-gray-400 sm:hidden">{attendanceStatusLabel(status)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 hidden sm:block">{attendanceStatusLabel(status)}</span>
                          {statusIcon[status]}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                  <button onClick={saveAttendance} disabled={saving} className="btn-primary flex items-center gap-2 text-base py-3 px-6">
                    <Save className="w-5 h-5" /> {saving ? (creatingSession ? 'Creating session...' : 'Saving...') : 'Save Attendance'}
                  </button>
                  {saved && <span className="text-green-600 text-sm font-medium">Saved!</span>}
                </div>
              </div>
            ) : selectedClass && totalCount === 0 ? (
              <div className="card text-center py-12 text-gray-400">
                <p className="text-lg mb-1">No students enrolled</p>
                <p className="text-sm">Ask your admin to add students to this class.</p>
              </div>
            ) : (
              <div className="card text-center py-12 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p>Select a date from the calendar to take attendance</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AttendancePageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">Loading...</div>}>
      <AttendancePage />
    </Suspense>
  );
}
