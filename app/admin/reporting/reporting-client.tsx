'use client';

import { useState, useMemo } from 'react';
import { Settings2, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { cn, formatDate, formatDuration, getStatusColor, getStatusLabel } from '@/lib/utils';
import { motion } from 'framer-motion';
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
    { label: 'Total Participants', value: totalParticipants, border: 'border-blue-100', accent: 'text-blue-600', filter: 'all' as const },
    { label: 'Yet to Start', value: yetToStart, border: 'border-gray-200', accent: 'text-gray-500', filter: 'yet_to_start' as LearnerCourseStatus },
    { label: 'In Progress', value: inProgress, border: 'border-amber-100', accent: 'text-amber-600', filter: 'in_progress' as LearnerCourseStatus },
    { label: 'Completed', value: completed, border: 'border-emerald-100', accent: 'text-emerald-600', filter: 'completed' as LearnerCourseStatus },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 shrink-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
          <p className="text-sm text-gray-400 mt-1">Course-wise learner progress overview</p>
        </div>
      </motion.div>

      {/* Overview cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0"
      >
        {stats.map(stat => (
          <motion.button
            key={stat.label}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStatusFilter(stat.filter)}
            className={`bg-white rounded-2xl border p-5 text-left transition-all duration-300 cursor-pointer ${
              statusFilter === stat.filter ? 'border-primary ring-2 ring-primary/10 shadow-md' : `${stat.border} hover:shadow-md`
            }`}
          >
            <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            <p className={`text-3xl font-bold mt-1 ${stat.accent}`}>{stat.value}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3 shrink-0">
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

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Table */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <table className="w-full table-fixed">
            <colgroup>
              {visibleColumns.map(col => (
                <col
                  key={col.key}
                  className={cn(
                    col.key === 'sr' && 'w-14',
                    col.key === 'course_name' && 'w-[18%]',
                    col.key === 'participant_name' && 'w-[18%]',
                    col.key === 'completion' && 'w-28',
                    col.key === 'status' && 'w-24',
                    col.key === 'time_spent' && 'w-20',
                  )}
                />
              ))}
            </colgroup>
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {visibleColumns.map(col => (
                  <th key={col.key} className="px-3 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left whitespace-nowrap truncate sticky top-0 bg-gray-50 z-10">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map((row, idx) => (
                <tr key={row.enrollment_id} className="hover:bg-gray-50/50 transition-colors">
                  {visibleColumns.map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 py-3 text-sm',
                        (col.key === 'course_name' || col.key === 'participant_name') ? 'break-words' : 'whitespace-nowrap truncate',
                      )}
                    >
                      {col.key === 'sr' && <span className="text-gray-400 font-medium">{idx + 1}</span>}
                      {col.key === 'course_name' && <span className="font-medium text-gray-900 line-clamp-2">{row.course_name}</span>}
                      {col.key === 'participant_name' && (
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{row.participant_name}</p>
                          <p className="text-xs text-gray-400 truncate">{row.participant_email}</p>
                        </div>
                      )}
                      {col.key === 'enrolled_at' && <span className="text-gray-500">{formatDate(row.enrolled_at)}</span>}
                      {col.key === 'started_at' && <span className="text-gray-500">{row.started_at ? formatDate(row.started_at) : '—'}</span>}
                      {col.key === 'time_spent' && <span className="text-gray-500">{formatDuration(row.total_time_spent_minutes)}</span>}
                      {col.key === 'completion' && <div className="w-full"><ProgressBar value={row.completion_percentage} showLabel size="sm" /></div>}
                      {col.key === 'completed_at' && <span className="text-gray-500">{row.completed_at ? formatDate(row.completed_at) : '—'}</span>}
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
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-56 shrink-0 bg-white rounded-2xl border border-gray-100 p-5 h-fit shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900">Show/Hide Columns</h3>
              <button onClick={() => setColumnPanelOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2.5">
              {columns.map(col => (
                <label key={col.key} className="flex items-center gap-2.5 text-sm cursor-pointer group">
                  <input type="checkbox" checked={col.visible} onChange={() => toggleColumn(col.key)} className="rounded-md border-gray-300 text-primary" />
                  <span className="text-gray-600 group-hover:text-gray-900 transition-colors">{col.label}</span>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
