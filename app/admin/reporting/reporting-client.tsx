'use client';

import { useState, useMemo } from 'react';
import { Users, Clock, CheckCircle2, PlayCircle, Settings2, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatDate, formatDuration, getStatusColor, getStatusLabel } from '@/lib/utils';
import type { LearnerCourseStatus, ReportingDashboardRow } from '@/lib/types';

type ColumnKey =
  | 'sr' | 'course_name' | 'participant_name' | 'enrolled_at'
  | 'started_at' | 'time_spent' | 'completion' | 'completed_at' | 'status';

interface Column {
  key: ColumnKey;
  label: string;
  visible: boolean;
}

const defaultColumns: Column[] = [
  { key: 'sr', label: 'Sr No.', visible: true },
  { key: 'course_name', label: 'Course Name', visible: true },
  { key: 'participant_name', label: 'Participant Name', visible: true },
  { key: 'enrolled_at', label: 'Enrolled Date', visible: true },
  { key: 'started_at', label: 'Start Date', visible: true },
  { key: 'time_spent', label: 'Time Spent', visible: true },
  { key: 'completion', label: 'Completion %', visible: true },
  { key: 'completed_at', label: 'Completed Date', visible: true },
  { key: 'status', label: 'Status', visible: true },
];

export default function ReportingClient({ data }: { data: ReportingDashboardRow[] }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<LearnerCourseStatus | 'all'>('all');
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [columnPanelOpen, setColumnPanelOpen] = useState(false);

  const totalParticipants = data.length;
  const yetToStart = data.filter(d => d.status === 'yet_to_start').length;
  const inProgress = data.filter(d => d.status === 'in_progress').length;
  const completed = data.filter(d => d.status === 'completed').length;

  const filteredData = useMemo(() => {
    return data.filter(row => {
      const matchesSearch =
        row.participant_name.toLowerCase().includes(search.toLowerCase()) ||
        row.course_name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const toggleColumn = (key: ColumnKey) => {
    setColumns(columns.map(c => (c.key === key ? { ...c, visible: !c.visible } : c)));
  };

  const visibleColumns = columns.filter(c => c.visible);

  const stats = [
    { label: 'Total Participants', value: totalParticipants, icon: Users, color: 'text-blue-600 bg-blue-100', filter: 'all' as const },
    { label: 'Yet to Start', value: yetToStart, icon: Clock, color: 'text-gray-600 bg-gray-100', filter: 'yet_to_start' as LearnerCourseStatus },
    { label: 'In Progress', value: inProgress, icon: PlayCircle, color: 'text-blue-600 bg-blue-100', filter: 'in_progress' as LearnerCourseStatus },
    { label: 'Completed', value: completed, icon: CheckCircle2, color: 'text-green-600 bg-green-100', filter: 'completed' as LearnerCourseStatus },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>
          <p className="text-sm text-gray-500 mt-1">Course-wise learner progress overview</p>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(stat => (
          <button
            key={stat.label}
            onClick={() => setStatusFilter(stat.filter)}
            className={`bg-white rounded-xl border p-4 text-left transition-all cursor-pointer ${
              statusFilter === stat.filter ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by course or participant..." className="w-full sm:w-80" />
        <div className="flex-1" />
        {statusFilter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
            Clear filter <X className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => setColumnPanelOpen(!columnPanelOpen)}>
          <Settings2 className="w-4 h-4" /> Columns
        </Button>
      </div>

      <div className="flex gap-4">
        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {visibleColumns.map(col => (
                  <th key={col.key} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((row, idx) => (
                <tr key={row.enrollment_id} className="hover:bg-gray-50 transition-colors">
                  {visibleColumns.map(col => (
                    <td key={col.key} className="px-4 py-3 text-sm whitespace-nowrap">
                      {col.key === 'sr' && <span className="text-gray-500">{idx + 1}</span>}
                      {col.key === 'course_name' && <span className="font-medium text-gray-900">{row.course_name}</span>}
                      {col.key === 'participant_name' && (
                        <div>
                          <p className="font-medium text-gray-900">{row.participant_name}</p>
                          <p className="text-xs text-gray-500">{row.participant_email}</p>
                        </div>
                      )}
                      {col.key === 'enrolled_at' && <span className="text-gray-600">{formatDate(row.enrolled_at)}</span>}
                      {col.key === 'started_at' && <span className="text-gray-600">{row.started_at ? formatDate(row.started_at) : '—'}</span>}
                      {col.key === 'time_spent' && <span className="text-gray-600">{formatDuration(row.total_time_spent_minutes)}</span>}
                      {col.key === 'completion' && <div className="w-32"><ProgressBar value={row.completion_percentage} showLabel size="sm" /></div>}
                      {col.key === 'completed_at' && <span className="text-gray-600">{row.completed_at ? formatDate(row.completed_at) : '—'}</span>}
                      {col.key === 'status' && <Badge className={getStatusColor(row.status)}>{getStatusLabel(row.status)}</Badge>}
                    </td>
                  ))}
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={visibleColumns.length} className="text-center py-12 text-gray-400">No results found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Column customizer side panel */}
        {columnPanelOpen && (
          <div className="w-56 bg-white rounded-xl border border-gray-200 p-4 h-fit sticky top-24">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">Show/Hide Columns</h3>
              <button onClick={() => setColumnPanelOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2">
              {columns.map(col => (
                <label key={col.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} className="rounded border-gray-300 text-primary" />
                  <span className="text-gray-700">{col.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
