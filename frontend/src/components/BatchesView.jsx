import React, { useState } from 'react';
import {
  Layers,
  Plus,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Package,
  HeartPulse,
  ShoppingCart,
  Receipt,
  X,
  Trash2,
  Pencil,
  ExternalLink,
  Table as TableIcon,
  LayoutGrid,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { formatCurrency, formatNumber, formatDate, translations } from '../utils';

export default function BatchesView({
  batches,
  batchMetrics,
  sales,
  expenses,
  mortalityLogs,
  selectedBatchNo,
  setSelectedBatchNo,
  onDeleteBatch,
  openModal,
  lang,
  searchQuery
}) {
  const t = translations[lang] || translations.en;
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [localSearch, setLocalSearch] = useState('');
  const activeSearch = searchQuery || localSearch;

  // Filter batches based on global search & status filter
  const filteredBatches = batches.filter((b) => {
    const m = batchMetrics[b.batch_no] || {};
    const matchesSearch =
      !activeSearch ||
      b.batch_no.toString().includes(activeSearch) ||
      (b.date && b.date.includes(activeSearch));

    if (!matchesSearch) return false;

    if (statusFilter === 'PROFIT') return m.pnl?.status === 'Profit';
    if (statusFilter === 'LOSS') return m.pnl?.status === 'Loss';
    if (statusFilter === 'ACTIVE') {
      const remaining = m.mortality?.Remaining_chicks ?? b.no_of_chicks;
      return remaining > 0;
    }
    return true;
  });

  const selectedBatch = batches.find((b) => b.batch_no === selectedBatchNo);
  const selectedMetrics = selectedBatch ? batchMetrics[selectedBatch.batch_no] || {} : null;

  // Filter records for selected batch drawer
  const selectedSales = selectedBatch
    ? sales.filter((s) => (s.batch?.batch_no || s.batch) === selectedBatch.batch_no)
    : [];
  const selectedExpenses = selectedBatch
    ? expenses.filter((e) => e.batch === selectedBatch.batch_no)
    : [];
  const selectedDeaths = selectedBatch
    ? mortalityLogs.filter((m) => m.batch === selectedBatch.batch_no)
    : [];

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All Batches' },
            { id: 'ACTIVE', label: 'Active Flocks' },
            { id: 'PROFIT', label: 'Profitable' },
            { id: 'LOSS', label: 'In Loss' }
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === pill.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* View Mode, Search & Add Batch */}
        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search batches..."
              className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'grid' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
              }`}
              title="Grid Cards"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs transition ${
                viewMode === 'table' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
              }`}
              title="Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => openModal('batch')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t.newBatch}</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredBatches.map((b) => {
            const m = batchMetrics[b.batch_no] || {};
            const pnl = Number(m.pnl?.profit_or_loss) || 0;
            const rev = Number(m.pnl?.revenue) || 0;
            const feedExp = Number(m.pnl?.expense) || 0;
            const totalExp = feedExp + Number(b.buying_price);
            const isProfit = pnl > 0;
            const isLoss = pnl < 0;

            const bDeaths = mortalityLogs.filter((l) => l.batch === b.batch_no).reduce((sum, l) => sum + (Number(l.no_of_deaths) || 0), 0);
            const bChicks = Number(b.no_of_chicks) || 0;
            const calcMortalityRate = bChicks > 0 ? (bDeaths / bChicks) * 100 : 0;
            const dead = m.mortality?.no_of_deaths !== undefined ? m.mortality.no_of_deaths : bDeaths;
            const sold = m.mortality?.total_sold ?? 0;
            const alive = m.mortality?.Remaining_chicks !== undefined ? m.mortality.Remaining_chicks : Math.max(0, bChicks - dead - sold);
            const mortalityRate = m.mortality?.mortality_rate !== undefined ? m.mortality.mortality_rate : calcMortalityRate;

            return (
              <div
                key={b.batch_no}
                onClick={() => setSelectedBatchNo(b.batch_no)}
                className={`bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between ${
                  selectedBatchNo === b.batch_no
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : 'border-slate-200/90'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-black font-mono text-base">
                        #{b.batch_no}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">
                          Batch #{b.batch_no}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Started: {formatDate(b.date)}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isProfit
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isLoss
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {m.pnl?.status || 'Active'}
                    </span>
                  </div>

                  {/* Flock Stats Grid (Bought, Alive, Sold, Dead) */}
                  <div className="grid grid-cols-4 gap-2 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Bought</span>
                      <span className="text-xs font-black text-slate-800 font-mono">{b.no_of_chicks}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-600 uppercase font-bold block">Alive</span>
                      <span className="text-xs font-black text-emerald-700 font-mono">{alive}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-sky-600 uppercase font-bold block">Sold</span>
                      <span className="text-xs font-black text-sky-700 font-mono">{sold}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-500 uppercase font-bold block">Dead</span>
                      <span className="text-xs font-black text-rose-600 font-mono">
                        {dead}
                        <span className="text-[9px] block font-normal text-rose-400">
                          ({mortalityRate.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Financials Row */}
                  <div className="space-y-1.5 text-xs mb-4">
                    <div className="flex justify-between text-slate-600">
                      <span>Purchase Cost:</span>
                      <span className="font-mono font-semibold">{formatCurrency(b.buying_price)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Feed & Care Expenses:</span>
                      <span className="font-mono font-semibold">{formatCurrency(feedExp)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Total Sales Revenue:</span>
                      <span className="font-mono font-bold text-emerald-600">+{formatCurrency(rev)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Net Result */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium">Net P&L Result</span>
                    <p
                      className={`text-base font-black font-mono leading-none ${
                        isProfit ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-600'
                      }`}
                    >
                      {isLoss ? '-' : '+'}{formatCurrency(Math.abs(pnl))}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal('batch', b);
                      }}
                      title="Edit Batch Details"
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBatchNo(b.batch_no);
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Batch</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4 text-center">Bought</th>
                  <th className="py-3 px-4 text-center">Alive</th>
                  <th className="py-3 px-4 text-center">Sold</th>
                  <th className="py-3 px-4 text-center">Dead (Rate)</th>
                  <th className="py-3 px-4 text-right">Chick Cost</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Net P&L</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBatches.map((b) => {
                  const m = batchMetrics[b.batch_no] || {};
                  const pnl = Number(m.pnl?.profit_or_loss) || 0;
                  const rev = Number(m.pnl?.revenue) || 0;
                  const bDeaths = mortalityLogs.filter((l) => l.batch === b.batch_no).reduce((sum, l) => sum + (Number(l.no_of_deaths) || 0), 0);
                  const bChicks = Number(b.no_of_chicks) || 0;
                  const calcMortalityRate = bChicks > 0 ? (bDeaths / bChicks) * 100 : 0;
                  const dead = m.mortality?.no_of_deaths !== undefined ? m.mortality.no_of_deaths : bDeaths;
                  const sold = m.mortality?.total_sold ?? 0;
                  const alive = m.mortality?.Remaining_chicks !== undefined ? m.mortality.Remaining_chicks : Math.max(0, bChicks - dead - sold);
                  const rate = m.mortality?.mortality_rate !== undefined ? m.mortality.mortality_rate : calcMortalityRate;
                  const isProf = pnl > 0;
                  const isLoss = pnl < 0;

                  return (
                    <tr
                      key={b.batch_no}
                      onClick={() => setSelectedBatchNo(b.batch_no)}
                      className="hover:bg-slate-50 transition cursor-pointer"
                    >
                      <td className="py-3.5 px-4 font-black text-slate-900 font-mono">
                        #{b.batch_no}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {formatDate(b.date)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {b.no_of_chicks}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-emerald-600">
                        {alive}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-sky-600">
                        {sold}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-rose-600">
                        {dead} ({rate.toFixed(1)}%)
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium text-slate-700">
                        {formatCurrency(b.buying_price)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                        +{formatCurrency(rev)}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-mono font-bold ${
                          isProf ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-600'
                        }`}
                      >
                        {isLoss ? '-' : '+'}{formatCurrency(Math.abs(pnl))}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                            isProf
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : isLoss
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {m.pnl?.status || 'Active'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal('batch', b);
                            }}
                            title="Edit Batch Details"
                            className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedBatchNo(b.batch_no);
                            }}
                            title="Inspect Batch"
                            className="text-slate-400 hover:text-emerald-600 p-1 rounded hover:bg-emerald-50 transition cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Detailed Inspection Drawer / Modal */}
      {selectedBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs no-print">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black font-mono text-base">
                    #{selectedBatch.batch_no}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Batch #{selectedBatch.batch_no} Detailed Financial & Flock Audit
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Initiated on {formatDate(selectedBatch.date)} • {selectedBatch.no_of_chicks} Chicks
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBatchNo(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                {/* Financial Overview Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Sales</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
                      {formatCurrency(selectedMetrics?.pnl?.revenue || 0)}
                    </span>
                  </div>
                  <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Total Cost</span>
                    <span className="text-base font-black text-amber-700 font-mono">
                      {formatCurrency(
                        (selectedMetrics?.pnl?.expense || 0) + Number(selectedBatch.buying_price)
                      )}
                    </span>
                  </div>
                  <div
                    className={`p-3.5 rounded-xl border ${
                      (selectedMetrics?.pnl?.profit_or_loss || 0) >= 0
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-rose-500 text-white border-rose-600'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase block opacity-90">Net Margin</span>
                    <span className="text-base font-black font-mono">
                      {formatCurrency(selectedMetrics?.pnl?.profit_or_loss || 0)}
                    </span>
                  </div>
                </div>

                {/* Weekly Sales Trend */}
                {selectedMetrics?.weekly?.weekly_sales?.length > 0 && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-700 mb-2">Weekly Sales Distribution</h4>
                    <div className="h-40 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={selectedMetrics.weekly.weekly_sales.map((w, i) => ({
                            week: `Wk ${i + 1}`,
                            amount: Number(w.total_amount)
                          }))}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                          <Tooltip formatter={(v) => [formatCurrency(v), 'Sales']} />
                          <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Itemized Sales for this Batch */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Recorded Sales ({selectedSales.length})</span>
                    <button
                      onClick={() => openModal('sale', { batch: selectedBatch.batch_no })}
                      className="text-emerald-600 font-bold text-xs hover:underline"
                    >
                      + Add Sale
                    </button>
                  </h4>
                  {selectedSales.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSales.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              {s.customer?.customer_name || 'Walk-in Buyer'}
                            </span>
                            <p className="text-[10px] text-slate-400">
                              {formatDate(s.date)} • {s.no_of_hens + s.no_of_roosters} Birds ({s.kg || '-'} Kg)
                            </p>
                          </div>
                          <span className="font-bold font-mono text-emerald-600">
                            +{formatCurrency(s.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-xl">
                      No sales recorded for this batch yet.
                    </p>
                  )}
                </div>

                {/* Itemized Expenses for this Batch */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Batch Expenses ({selectedExpenses.length})</span>
                    <button
                      onClick={() => openModal('expense', { batch: selectedBatch.batch_no })}
                      className="text-amber-600 font-bold text-xs hover:underline"
                    >
                      + Add Expense
                    </button>
                  </h4>
                  {selectedExpenses.length > 0 ? (
                    <div className="space-y-2">
                      {selectedExpenses.map((e) => (
                        <div
                          key={e.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{e.expense_type}</span>
                            <p className="text-[10px] text-slate-400">{formatDate(e.date)}</p>
                          </div>
                          <span className="font-bold font-mono text-amber-600">
                            -{formatCurrency(e.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-xl">
                      No expenses logged for this batch yet.
                    </p>
                  )}
                </div>

                {/* Mortality Incidents */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Mortality Incidents ({selectedDeaths.length})</span>
                    <button
                      onClick={() => openModal('mortality', { batch: selectedBatch.batch_no })}
                      className="text-rose-600 font-bold text-xs hover:underline"
                    >
                      + Log Mortality
                    </button>
                  </h4>
                  {selectedDeaths.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDeaths.map((m) => (
                        <div
                          key={m.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">{m.reason_of_death}</span>
                            <p className="text-[10px] text-slate-400">{formatDate(m.date)}</p>
                          </div>
                          <span className="font-bold font-mono text-rose-600">
                            💀 {m.no_of_deaths}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-3 bg-slate-50 rounded-xl">
                      Zero mortality records logged for this batch!
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal('batch', selectedBatch)}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Batch Details</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you sure you want to permanently delete Batch #${selectedBatch.batch_no}? All associated sales and records will be deleted.`)) {
                      onDeleteBatch(selectedBatch.batch_no);
                      setSelectedBatchNo(null);
                    }
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Batch</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedBatchNo(null)}
                className="text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl shadow-xs transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
