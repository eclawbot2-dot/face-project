'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronLeft, ChevronRight, Plus, Calendar, MapPin, Clock } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { formatDate } from '@/lib/utils';

const EVENT_TYPES = ['CLASS', 'RETREAT', 'SERVICE', 'PARISH', 'SACRAMENT', 'OTHER'] as const;

const eventColors: Record<string, string> = {
  CLASS: 'bg-blue-100 text-blue-800 border-blue-200',
  RETREAT: 'bg-purple-100 text-purple-800 border-purple-200',
  SERVICE: 'bg-green-100 text-green-800 border-green-200',
  PARISH: 'bg-[#1e3a5f]/10 text-[#1e3a5f] border-[#1e3a5f]/20',
  SACRAMENT: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  OTHER: 'bg-gray-100 text-gray-700 border-gray-200',
};

interface EventItem {
  id: string;
  title: string;
  description?: string;
  eventType: string;
  startDate: string;
  endDate?: string;
  location?: string;
  allDay: boolean;
}

interface EventForm {
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  allDay: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [view, setView] = useState<'month' | 'list'>('month');

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventForm>();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const load = async () => {
    setLoading(true);
    const from = new Date(year, month - 1, 1).toISOString();
    const to = new Date(year, month + 2, 0).toISOString();
    const res = await fetch(`/api/events?from=${from}&to=${to}`);
    const data = await res.json();
    setEvents(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [year, month]);

  const onSubmit = async (data: EventForm) => {
    setSaving(true);
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setShowModal(false);
    reset();
    setSaving(false);
    load();
  };

  // Calendar grid
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const eventsOnDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(e => e.startDate.startsWith(dateStr));
  };

  const isToday = (day: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  };

  const upcomingEvents = events
    .filter(e => new Date(e.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Calendar</h1>
          <p className="text-gray-500 text-sm mt-1">Events and class schedules</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {(['month', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === v ? 'bg-white text-[#1e3a5f] shadow-sm' : 'text-gray-500'}`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => { reset({ eventType: 'OTHER', allDay: false }); setShowModal(true); }} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      {view === 'month' && (
        <div className="card">
          {/* Nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-bold text-[#1e3a5f] text-lg">{MONTHS[month]} {year}</h2>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg hover:bg-gray-100">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />;
              const dayEvents = eventsOnDay(day);
              return (
                <div key={i} className={`min-h-[80px] p-1 rounded-lg ${isToday(day) ? 'bg-[#1e3a5f]/5 ring-2 ring-[#1e3a5f]' : 'hover:bg-gray-50'}`}>
                  <div className={`text-sm font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-[#1e3a5f] text-white' : 'text-gray-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map(e => (
                      <button
                        key={e.id}
                        onClick={() => setSelectedEvent(e)}
                        className={`w-full text-left text-xs px-1 py-0.5 rounded truncate border ${eventColors[e.eventType] || eventColors.OTHER}`}
                      >
                        {e.title}
                      </button>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-400 px-1">+{dayEvents.length - 3} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-3">
          {loading ? (
            <div className="card text-center py-8 text-gray-400">Loading...</div>
          ) : upcomingEvents.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No upcoming events</p>
            </div>
          ) : (
            upcomingEvents.map(e => (
              <div key={e.id} className="card flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedEvent(e)}>
                <div className="text-center min-w-[48px]">
                  <div className="text-xs text-gray-400 uppercase">{new Date(e.startDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                  <div className="text-2xl font-bold text-[#1e3a5f] leading-none">{new Date(e.startDate).getDate()}</div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-800">{e.title}</h3>
                    <span className={`badge ${eventColors[e.eventType]}`}>{e.eventType}</span>
                  </div>
                  {e.location && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-3 h-3" /> {e.location}
                    </div>
                  )}
                  {!e.allDay && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-3 h-3" /> {new Date(e.startDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </div>
                  )}
                  {e.description && <p className="text-sm text-gray-400 mt-1">{e.description}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Event detail modal */}
      <Modal open={!!selectedEvent} onClose={() => setSelectedEvent(null)} title={selectedEvent?.title || ''} size="sm">
        {selectedEvent && (
          <div className="space-y-3">
            <span className={`badge ${eventColors[selectedEvent.eventType]}`}>{selectedEvent.eventType}</span>
            <div className="text-sm text-gray-600 space-y-2">
              <div><strong>Date:</strong> {formatDate(selectedEvent.startDate)}</div>
              {selectedEvent.location && <div className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" /> {selectedEvent.location}</div>}
              {selectedEvent.description && <p>{selectedEvent.description}</p>}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Event Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Event" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="form-label">Event Title *</label>
            <input {...register('title', { required: true })} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Event Type</label>
              <select {...register('eventType')} className="form-select">
                {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Location</label>
              <input {...register('location')} className="form-input" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date/Time *</label>
              <input type="datetime-local" {...register('startDate', { required: true })} className="form-input" />
            </div>
            <div>
              <label className="form-label">End Date/Time</label>
              <input type="datetime-local" {...register('endDate')} className="form-input" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="allDay" {...register('allDay')} className="rounded" />
            <label htmlFor="allDay" className="text-sm text-gray-700">All day event</label>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea {...register('description')} className="form-input" rows={3} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Add Event'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
