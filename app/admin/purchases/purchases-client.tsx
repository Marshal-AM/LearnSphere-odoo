'use client';

import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, Users, ShoppingBag, Receipt } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { Badge } from '@/components/ui/badge';
import { cn, formatDate } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { PurchaseRecord } from '@/lib/queries';

export default function PurchasesClient({ purchases }: { purchases: PurchaseRecord[] }) {
  const [search, setSearch] = useState('');

  const filteredPurchases = useMemo(() => {
    if (!search) return purchases;
    const q = search.toLowerCase();
    return purchases.filter(p =>
      p.user_name.toLowerCase().includes(q) ||
      p.user_email.toLowerCase().includes(q) ||
      p.course_title.toLowerCase().includes(q) ||
      p.payment_transaction_id?.toLowerCase().includes(q)
    );
  }, [purchases, search]);

  const totalRevenue = purchases.reduce((sum, p) => sum + (p.payment_amount || 0), 0);
  const uniqueBuyers = new Set(purchases.map(p => p.user_id)).size;
  const uniqueCourses = new Set(purchases.map(p => p.course_id)).size;

  const stats = [
    { label: 'Total Purchases', value: purchases.length, icon: ShoppingBag, accent: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-100' },
    { label: 'Total Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, accent: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { label: 'Unique Buyers', value: uniqueBuyers, icon: Users, accent: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    { label: 'Courses Sold', value: uniqueCourses, icon: TrendingUp, accent: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-4 shrink-0"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
          <p className="text-sm text-gray-400 mt-1">Track paid course purchases and revenue</p>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 shrink-0"
      >
        {stats.map(stat => (
          <div
            key={stat.label}
            className={`bg-white rounded-2xl border p-5 ${stat.border}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-4.5 h-4.5 ${stat.accent}`} />
              </div>
              <p className="text-sm text-gray-500 font-medium">{stat.label}</p>
            </div>
            <p className={`text-3xl font-bold ${stat.accent}`}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by buyer, course, or transaction ID..."
          className="w-full sm:w-96"
        />
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left sticky top-0 bg-gray-50 z-10 w-12">#</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left sticky top-0 bg-gray-50 z-10">Buyer</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left sticky top-0 bg-gray-50 z-10">Course</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left sticky top-0 bg-gray-50 z-10">Amount</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left sticky top-0 bg-gray-50 z-10">Transaction ID</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left sticky top-0 bg-gray-50 z-10">Date</th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider text-left sticky top-0 bg-gray-50 z-10">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredPurchases.map((p, idx) => (
              <tr key={p.enrollment_id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 text-sm text-gray-400 font-medium">{idx + 1}</td>
                <td className="px-4 py-3 text-sm">
                  <p className="font-medium text-gray-900">{p.user_name}</p>
                  <p className="text-xs text-gray-400">{p.user_email}</p>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-[200px]">
                  <span className="line-clamp-2">{p.course_title}</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className="font-semibold text-emerald-600">
                    ${p.payment_amount?.toFixed(2)}
                  </span>
                  <span className="text-xs text-gray-400 ml-1">{p.payment_currency}</span>
                </td>
                <td className="px-4 py-3 text-sm">
                  <code className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-mono">
                    {p.payment_transaction_id || '—'}
                  </code>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                  {p.payment_date ? formatDate(p.payment_date) : '—'}
                </td>
                <td className="px-4 py-3 text-sm">
                  <Badge className={cn(
                    p.status === 'completed' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    p.status === 'in_progress' && 'bg-amber-50 text-amber-700 border-amber-200',
                    p.status === 'yet_to_start' && 'bg-gray-50 text-gray-600 border-gray-200',
                  )}>
                    {p.status === 'yet_to_start' ? 'Not Started' : p.status === 'in_progress' ? `${Math.round(p.completion_percentage)}%` : 'Completed'}
                  </Badge>
                </td>
              </tr>
            ))}
            {filteredPurchases.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                      <Receipt className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400">
                      {search ? 'No purchases match your search.' : 'No paid course purchases yet.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
