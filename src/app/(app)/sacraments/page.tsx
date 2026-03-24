'use client';

import { useEffect, useState } from 'react';
import { Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate, SACRAMENT_TYPES } from '@/lib/utils';
import Link from 'next/link';

interface SacramentRecord {
  id: string;
  studentId: string;
  sacramentType: string;
  status: string;
  startDate?: string;
  completionDate?: string;
  notes?: string;
  student: { id: string; firstName: string; lastName: string; gradeLevel: string };
}

const statusColors: Record<string, string> = {
  COMPLETED: 'badge-green',
  IN_PROGRESS: 'badge-gold',
  NOT_STARTED: 'badge-gray',
  NOT_APPLICABLE: 'badge-gray',
};

const statusOrder = ['IN_PROGRESS', 'NOT_STARTED', 'COMPLETED', 'NOT_APPLICABLE'];

export default function SacramentsPage() {
  const [records, setRecords] = useState<SacramentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>(SACRAMENT_TYPES[1]); // First Communion
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedType) params.set('type', selectedType);
    const res = await fetch(`/api/sacraments?${params}`);
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [selectedType]);

  const updateStatus = async (record: SacramentRecord, newStatus: string) => {
    setUpdating(record.id);
    await fetch('/api/sacraments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentId: record.studentId,
        sacramentType: record.sacramentType,
        status: newStatus,
        startDate: record.startDate,
        completionDate: newStatus === 'COMPLETED' && !record.completionDate ? new Date().toISOString() : record.completionDate,
        notes: record.notes,
      }),
    });
    setUpdating(null);
    load();
  };

  const grouped = statusOrder.reduce((acc, status) => {
    acc[status] = records.filter(r => r.status === status);
    return acc;
  }, {} as Record<string, SacramentRecord[]>);

  const counts = {
    total: records.length,
    inProgress: grouped['IN_PROGRESS']?.length || 0,
    completed: grouped['COMPLETED']?.length || 0,
    notStarted: grouped['NOT_STARTED']?.length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Sacraments</h1>
        <p className="text-gray-500 text-sm mt-1">Track sacramental preparation progress</p>
      </div>

      {/* Sacrament type tabs */}
      <div className="flex flex-wrap gap-2">
        {SACRAMENT_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedType === type ? 'bg-[#1e3a5f] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Stats */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: counts.total, color: 'bg-gray-50 text-gray-700' },
            { label: 'In Progress', value: counts.inProgress, color: 'bg-yellow-50 text-yellow-700' },
            { label: 'Completed', value: counts.completed, color: 'bg-green-50 text-green-700' },
            { label: 'Not Started', value: counts.notStarted, color: 'bg-gray-50 text-gray-500' },
          ].map(s => (
            <div key={s.label} className={`card py-4 text-center ${s.color}`}>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-center text-gray-400">Loading...</div>
      ) : records.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No {selectedType} records found</p>
        </div>
      ) : (
        <div className="space-y-6">
          {statusOrder.filter(s => grouped[s]?.length > 0).map(status => (
            <div key={status} className="card p-0 overflow-hidden">
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                <span className={`badge ${statusColors[status]}`}>{status.replace('_', ' ')}</span>
                <span className="text-sm text-gray-500">{grouped[status].length} students</span>
              </div>
              <div className="divide-y divide-gray-50">
                {grouped[status].map(record => (
                  <div key={record.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1e3a5f] flex items-center justify-center text-white text-xs font-bold">
                          {record.student.firstName[0]}{record.student.lastName[0]}
                        </div>
                        <div>
                          <Link href={`/students/${record.student.id}`} className="font-medium text-gray-800 hover:text-[#1e3a5f]">
                            {record.student.firstName} {record.student.lastName}
                          </Link>
                          {record.startDate && (
                            <div className="text-xs text-gray-400">Started: {formatDate(record.startDate)}</div>
                          )}
                          {record.completionDate && (
                            <div className="text-xs text-gray-400">Completed: {formatDate(record.completionDate)}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {status !== 'COMPLETED' && (
                          <button
                            onClick={() => updateStatus(record, 'COMPLETED')}
                            disabled={updating === record.id}
                            className="text-xs btn-secondary py-1 px-2 text-green-700 border-green-200 hover:bg-green-50"
                          >
                            ✓ Mark Complete
                          </button>
                        )}
                        {status === 'NOT_STARTED' && (
                          <button
                            onClick={() => updateStatus(record, 'IN_PROGRESS')}
                            disabled={updating === record.id}
                            className="text-xs btn-secondary py-1 px-2"
                          >
                            Start
                          </button>
                        )}
                        <button
                          onClick={() => setExpandedStudent(expandedStudent === record.id ? null : record.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {expandedStudent === record.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {expandedStudent === record.id && record.notes && (
                      <div className="mt-3 ml-11 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
                        {record.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
