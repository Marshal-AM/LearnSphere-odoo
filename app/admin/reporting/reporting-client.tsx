'use client';

import { useState, useMemo } from 'react';
import { Users, Clock, CheckCircle2, PlayCircle, Settings2, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { formatDate, formatDuration, getStatusColor, getStatusLabel } from '@/lib/utils';
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
    { label: 'Total Participants', value: totalParticipants, icon: Users, gradient: 'from-blue-500 to-indigo-500', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-700', filter: 'all' as const },
    { label: 'Yet to Start', value: yetToStart, icon: Clock, gradient: 'from-gray-400 to-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', filter: 'yet_to_start' as LearnerCourseStatus },
    { label: 'In Progress', value: inProgress, icon: PlayCircle, gradient: 'from-amber-400 to-orange-500', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', filter: 'in_progress' as LearnerCourseStatus },
    { label: 'Completed', value: completed, icon: CheckCircle2, gradient: 'from-emerald-400 to-teal-500', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', filter: 'completed' as LearnerCourseStatus },
  ];

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>
          <p className="text-sm text-gray-400 mt-1">Course-wise learner progress overview</p>
        </div>
      </motion.div>

      {/* Overview cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
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
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{stat.value}</span>
            </div>
            <p className="mt-3 text-sm text-gray-500 font-medium">{stat.label}</p>
          </motion.button>
        ))}
      </motion.div>

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
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                {visibleColumns.map(col => (
                  <th key={col.key} className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left whitespace-nowrap">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredData.map((row, idx) => (
                <tr key={row.enrollment_id} className="hover:bg-gray-50/50 transition-colors">
                  {visibleColumns.map(col => (
                    <td key={col.key} className="px-5 py-3.5 text-sm whitespace-nowrap">
                      {col.key === 'sr' && <span className="text-gray-400 font-medium">{idx + 1}</span>}
                      {col.key === 'course_name' && <span className="font-medium text-gray-900">{row.course_name}</span>}
                      {col.key === 'participant_name' && (
                        <div>
                          <p className="font-medium text-gray-900">{row.participant_name}</p>
                          <p className="text-xs text-gray-400">{row.participant_email}</p>
                        </div>
                      )}
                      {col.key === 'enrolled_at' && <span className="text-gray-500">{formatDate(row.enrolled_at)}</span>}
                      {col.key === 'started_at' && <span className="text-gray-500">{row.started_at ? formatDate(row.started_at) : '—'}</span>}
                      {col.key === 'time_spent' && <span className="text-gray-500">{formatDuration(row.total_time_spent_minutes)}</span>}
                      {col.key === 'completion' && <div className="w-32"><ProgressBar value={row.completion_percentage} showLabel size="sm" /></div>}
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
            className="w-56 bg-white rounded-2xl border border-gray-100 p-5 h-fit sticky top-24 shadow-sm"
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
