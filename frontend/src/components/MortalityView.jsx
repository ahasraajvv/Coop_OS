import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  HeartPulse,
  Plus,
  Download,
  Trash2,
  Pencil,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Activity,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
  Search,
  X,
  SlidersHorizontal,
  ArrowRight,
  FileText
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
import { formatNumber, formatDate, formatDateTime, exportToCSV, translations } from '../utils';

export default function MortalityView({
  mortalityLogs,
  batches,
  summaryMetrics,
  onDeleteMortality,
  openModal,
  selectedBatchFilter,
  setSelectedBatchFilter,
  searchQuery,
  lang
}) {
  const t = translations[lang] || translations.en;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Outside click listener for dropdown popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const isAll = selectedBatchFilter === 'ALL';

  // Active batch object if a specific batch is chosen
  const activeBatch = useMemo(() => {
    if (isAll) return null;
    return batches.find((b) => b.batch_no?.toString() === selectedBatchFilter?.toString()) || null;
  }, [batches, selectedBatchFilter, isAll]);

  // Sorted batches by batch_no descending (newest first)
  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => Number(b.batch_no) - Number(a.batch_no));
  }, [batches]);

  // Recent 2 batches for quick-access buttons
  const recentBatches = useMemo(() => {
    return sortedBatches.slice(0, 2);
  }, [sortedBatches]);

  // Filtered batches for the search popover
  const filteredBatchesForDropdown = useMemo(() => {
    if (!batchSearchTerm.trim()) return sortedBatches;
    const term = batchSearchTerm.toLowerCase().trim();
    return sortedBatches.filter((b) => b.batch_no?.toString().includes(term));
  }, [sortedBatches, batchSearchTerm]);

  // Stepper handlers for 1-click batch navigation
  const handleStepPrev = () => {
    if (sortedBatches.length === 0) return;
    if (isAll) {
      const oldest = sortedBatches[sortedBatches.length - 1];
      setSelectedBatchFilter(oldest.batch_no);
      return;
    }
    const idx = sortedBatches.findIndex((b) => b.batch_no?.toString() === selectedBatchFilter?.toString());
    if (idx !== -1 && idx < sortedBatches.length - 1) {
      setSelectedBatchFilter(sortedBatches[idx + 1].batch_no);
    }
  };

  const handleStepNext = () => {
    if (sortedBatches.length === 0) return;
    if (isAll) {
      const newest = sortedBatches[0];
      setSelectedBatchFilter(newest.batch_no);
      return;
    }
    const idx = sortedBatches.findIndex((b) => b.batch_no?.toString() === selectedBatchFilter?.toString());
    if (idx !== -1 && idx > 0) {
      setSelectedBatchFilter(sortedBatches[idx - 1].batch_no);
    }
  };

  // Filter logs based on current batch scope and search query
  const filteredLogs = useMemo(() => {
    return mortalityLogs.filter((m) => {
      if (!isAll && m.batch?.toString() !== selectedBatchFilter?.toString()) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const reason = m.reason_of_death?.toLowerCase() || '';
        const bStr = m.batch?.toString() || '';
        return reason.includes(q) || bStr.includes(q);
      }
      return true;
    });
  }, [mortalityLogs, isAll, selectedBatchFilter, searchQuery]);

  // Calculate stats by cause for current scope
  const chartCauseData = useMemo(() => {
    const causeCount = {};
    filteredLogs.forEach((l) => {
      const r = l.reason_of_death || 'Unspecified';
      causeCount[r] = (causeCount[r] || 0) + (Number(l.no_of_deaths) || 0);
    });

    return Object.entries(causeCount)
      .map(([reason, count]) => ({
        reason: reason.length > 20 ? reason.slice(0, 18) + '...' : reason,
        fullReason: reason,
        Deaths: count
      }))
      .sort((a, b) => b.Deaths - a.Deaths);
  }, [filteredLogs]);

  // Initial chicks placed in current scope
  const chicksInScope = useMemo(() => {
    if (isAll) {
      return batches.reduce((sum, b) => sum + (Number(b.no_of_chicks) || 0), 0);
    }
    return activeBatch ? Number(activeBatch.no_of_chicks) || 0 : 0;
  }, [batches, activeBatch, isAll]);

  // Dynamic Scope-Aware Mortality & Survivability Metrics
  const { totalDeaths, mortalityRate, survivabilityRate, isHealthy, healthStatus } = useMemo(() => {
    const deaths = filteredLogs.reduce((acc, m) => acc + (Number(m.no_of_deaths) || 0), 0);
    const rate = chicksInScope > 0 ? (deaths / chicksInScope) * 100 : 0;
    const surv = Math.max(0, 100 - rate);
    const healthy = rate <= 5;
    const status = rate <= 5 ? 'Optimal (<5%)' : rate <= 10 ? 'Caution (5-10%)' : 'Critical (>10%)';
    return {
      totalDeaths: deaths,
      mortalityRate: rate,
      survivabilityRate: surv,
      isHealthy: healthy,
      healthStatus: status
    };
  }, [filteredLogs, chicksInScope]);

  const handleExportCSV = () => {
    const dataToExport = filteredLogs.map((m) => ({
      ID: m.id,
      Date: m.date,
      'Batch No': m.batch,
      'Number of Deaths': m.no_of_deaths,
      'Reason of Death': m.reason_of_death
    }));
    exportToCSV(
      isAll ? 'CoopOS_All_Batches_Mortality_Log' : `CoopOS_Batch_${selectedBatchFilter}_Mortality_Log`,
      dataToExport
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. View Header with Action Buttons */}
      <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Flock Health & Mortality Board
              </h1>
              <p className="text-xs text-slate-500">
                Commercial Flock Biosecurity • Real-Time Batch-Specific Loss Rates & Diagnostic Tracking
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => openModal('mortality', { batch: isAll ? (batches[0]?.batch_no || '') : selectedBatchFilter })}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Mortality</span>
          </button>
        </div>
      </div>

      {/* 2. Uncrowded Scope Toolbar with 1-Click Steppers & Batch Browser */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Scope Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mr-1 select-none">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Flock Scope:</span>
            </span>

            {/* All Batches Preset */}
            <button
              type="button"
              onClick={() => setSelectedBatchFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                isAll
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All Batches Combined
            </button>

            {/* Quick Recent Batch Pills (Up to 2 recents) */}
            {recentBatches.map((b) => {
              const isSelected = !isAll && selectedBatchFilter?.toString() === b.batch_no?.toString();
              return (
                <button
                  key={b.batch_no}
                  type="button"
                  onClick={() => setSelectedBatchFilter(b.batch_no)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                  title={`View Batch #${b.batch_no} (${b.no_of_chicks} chicks)`}
                >
                  Batch #{b.batch_no}
                </button>
              );
            })}

            {/* Stepper Navigation (< Prev and Next >) for 1-click batch navigation */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={handleStepPrev}
                disabled={sortedBatches.length <= 1}
                title="Previous batch"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1.5 text-[10px] font-mono font-bold text-slate-400 select-none uppercase">
                Step
              </span>
              <button
                type="button"
                onClick={handleStepNext}
                disabled={sortedBatches.length <= 1}
                title="Next batch"
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Batch Selector Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  !isAll
                    ? 'bg-rose-50 text-rose-900 border-rose-300 ring-1 ring-rose-300 shadow-xs'
                    : isDropdownOpen
                    ? 'bg-slate-200 text-slate-900 border-slate-400'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-rose-600" />
                <span>
                  {isAll
                    ? `Choose Batch (${batches.length} Batches)`
                    : `Batch #${selectedBatchFilter} (Switch)`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Popover Dropdown Panel */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Select Flock Batch
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        View mortality rate & incident logs for a specific batch
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Search Filter by batch number */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search batch # (e.g. 3)..."
                      value={batchSearchTerm}
                      onChange={(e) => setBatchSearchTerm(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  {/* Quick Action Button */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBatchFilter('ALL');
                        setIsDropdownOpen(false);
                      }}
                      className="text-slate-600 hover:text-slate-900 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>View All Batches</span>
                    </button>
                  </div>

                  {/* Batch Selection List */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-0.5">
                    {filteredBatchesForDropdown.length > 0 ? (
                      filteredBatchesForDropdown.map((b) => {
                        const isSelected = !isAll && selectedBatchFilter?.toString() === b.batch_no?.toString();
                        const bLogs = mortalityLogs.filter((m) => m.batch === b.batch_no);
                        const bDeaths = bLogs.reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);
                        const bChicks = Number(b.no_of_chicks) || 0;
                        const bRate = bChicks > 0 ? (bDeaths / bChicks) * 100 : 0;

                        return (
                          <div
                            key={b.batch_no}
                            onClick={() => {
                              setSelectedBatchFilter(b.batch_no);
                              setIsDropdownOpen(false);
                            }}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                              isSelected
                                ? 'bg-rose-50 text-rose-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-mono font-bold">
                                  Batch #{b.batch_no}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ({b.no_of_chicks} chicks)
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                Started: {formatDate(b.date)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  bRate <= 5
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : bRate <= 10
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {bRate.toFixed(1)}% Loss
                              </span>
                              <span className="block text-[10px] text-slate-400 font-mono">
                                💀 {bDeaths} deaths
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No batches matching "{batchSearchTerm}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Prominent Active Scope Banner */}
        <div
          className={`rounded-lg px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border transition ${
            !isAll
              ? 'bg-rose-50/80 border-rose-200 text-rose-900'
              : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold uppercase tracking-wide text-[10px] px-2 py-0.5 rounded bg-white border border-slate-300">
              {isAll ? 'Farm-Wide Scope' : `Active Batch #${selectedBatchFilter}`}
            </span>
            <span className="font-semibold">
              {isAll
                ? `Representing All Batches (${batches.length} Batches Combined)`
                : `Representing Batch #${selectedBatchFilter} (${activeBatch?.date ? 'Started ' + formatDate(activeBatch.date) : ''})`}
            </span>
            <span className="text-[11px] opacity-80 font-mono">
              • Initial: {formatNumber(chicksInScope)} chicks • Deaths: {formatNumber(totalDeaths)} • Live: {formatNumber(Math.max(0, chicksInScope - totalDeaths))}
            </span>
          </div>

          {!isAll && (
            <button
              type="button"
              onClick={() => setSelectedBatchFilter('ALL')}
              className="text-[11px] font-bold text-rose-700 hover:text-rose-900 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Show All Batches</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Top Health KPI Strip (Dynamic and Batch-Specific) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Losses */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Total Losses (இறப்பு)
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-2xl font-black text-rose-600 font-mono">
              💀 {formatNumber(totalDeaths)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {isAll
                ? `Across ${filteredLogs.length} incidents in all batches`
                : `In Batch #${selectedBatchFilter} (${filteredLogs.length} logged incidents)`}
            </p>
          </div>
        </div>

        {/* Card 2: Survivability Index */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Survivability Index (உயிர்ப்பிழைப்பு)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-1">
            <h3 className="text-2xl font-black text-emerald-600 font-mono">
              {survivabilityRate.toFixed(1)}%
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {chicksInScope > 0
                ? `${formatNumber(Math.max(0, chicksInScope - totalDeaths))} alive of ${formatNumber(chicksInScope)} placed`
                : 'No flock placed'}
            </p>
          </div>
        </div>

        {/* Card 3: Dynamic Mortality Rate (Batch-Specific) */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Mortality Rate (இறப்பு விகிதம்)
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                mortalityRate <= 5
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : mortalityRate <= 10
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {healthStatus}
            </span>
          </div>
          <div className="mt-1">
            <h3
              className={`text-2xl font-black font-mono ${
                mortalityRate <= 5 ? 'text-slate-800' : 'text-rose-600'
              }`}
            >
              {mortalityRate.toFixed(1)}%
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {isAll
                ? `Weighted average across all ${batches.length} batches`
                : `Batch #${selectedBatchFilter} loss rate (${totalDeaths} / ${chicksInScope} birds)`}
            </p>
          </div>
        </div>

        {/* Card 4: Leading Root Cause */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Primary Loss Cause
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-1">
            <h3 className="text-base font-black text-slate-900 truncate" title={chartCauseData[0]?.fullReason}>
              {chartCauseData[0]?.fullReason || 'None Recorded'}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {chartCauseData[0]
                ? `Responsible for ${chartCauseData[0].Deaths} deaths in ${isAll ? 'all batches' : 'Batch #' + selectedBatchFilter}`
                : 'Zero mortality incidents logged'}
            </p>
          </div>
        </div>
      </div>

      {/* 4. Side-by-Side: Diagnosed Cause Bar Graph (Left) + Selected Batch Health Report (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cause Breakdown Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 mb-4 gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Mortality Breakdown by Diagnosed Cause
                </h3>
                <p className="text-xs text-slate-500">
                  {isAll
                    ? 'Root causes across all flock batches to identify biosecurity, heat, or disease risks'
                    : `Root causes specifically recorded for Batch #${selectedBatchFilter}`}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
                {chartCauseData.length} Diagnosed Causes
              </span>
            </div>

            <div className="h-72 w-full">
              {chartCauseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartCauseData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 30, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis
                      dataKey="reason"
                      type="category"
                      tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }}
                      width={130}
                    />
                    <Tooltip
                      formatter={(val) => [`${val} birds`, 'Loss Count']}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="Deaths" fill="#e11d48" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  <span>No mortality incidents recorded for this selection.</span>
                </div>
              )}
            </div>
          </div>

          {chartCauseData.length > 0 && (
            <div className="pt-3 border-t border-slate-200 mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>Primary Driver: <strong className="text-slate-800">{chartCauseData[0]?.fullReason}</strong></span>
              <span className="font-mono font-bold text-rose-600">💀 {chartCauseData[0]?.Deaths} birds ({((chartCauseData[0]?.Deaths / (totalDeaths || 1)) * 100).toFixed(0)}% of deaths)</span>
            </div>
          )}
        </div>

        {/* Right: Selected Batch Health & Mortality Report (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-300 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {isAll ? 'Farm Flock Health Report' : `Batch #${selectedBatchFilter} Health Report`}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {isAll ? 'Combined farm-wide mortality metrics' : 'Selected batch vital statistics & survival audit'}
                  </p>
                </div>
              </div>

              <span
                className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full border ${
                  mortalityRate <= 5
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : mortalityRate <= 10
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {healthStatus}
              </span>
            </div>

            {/* Main Metric Spotlight Box */}
            <div className="mt-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200/80 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  Flock Mortality Rate:
                </span>
                <span className={`text-2xl font-black font-mono ${mortalityRate <= 5 ? 'text-slate-900' : 'text-rose-600'}`}>
                  {mortalityRate.toFixed(1)}%
                </span>
              </div>

              {/* Visual Health Bar */}
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    mortalityRate <= 5 ? 'bg-emerald-500' : mortalityRate <= 10 ? 'bg-amber-500' : 'bg-rose-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(mortalityRate, 4))}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>Losses: {formatNumber(totalDeaths)} birds</span>
                <span>Survival: {survivabilityRate.toFixed(1)}%</span>
              </div>
            </div>

            {/* Itemized Audit Report Rows */}
            <div className="mt-3 divide-y divide-slate-100 text-xs">
              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">Scope Selection:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {isAll ? `All Batches (${batches.length} total)` : `Batch #${selectedBatchFilter}`}
                </span>
              </div>

              {!isAll && activeBatch?.date && (
                <div className="py-2 flex items-center justify-between">
                  <span className="text-slate-500">Batch Start Date:</span>
                  <span className="font-mono text-slate-700 font-semibold">{formatDate(activeBatch.date)}</span>
                </div>
              )}

              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">Initial Chicks Placed:</span>
                <span className="font-mono font-bold text-slate-900">{formatNumber(chicksInScope)} chicks</span>
              </div>

              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">Total Deaths Logged:</span>
                <span className="font-mono font-bold text-rose-600">💀 {formatNumber(totalDeaths)} deaths</span>
              </div>

              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">Active Live in Shed:</span>
                <span className="font-mono font-bold text-emerald-700">🌱 {formatNumber(Math.max(0, chicksInScope - totalDeaths))} birds</span>
              </div>

              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">Primary Diagnosed Cause:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[170px]" title={chartCauseData[0]?.fullReason}>
                  {chartCauseData[0]?.fullReason || 'None'}
                </span>
              </div>

              <div className="py-2 flex items-center justify-between">
                <span className="text-slate-500">Recorded Incident Entries:</span>
                <span className="font-mono text-slate-700">{filteredLogs.length} events</span>
              </div>
            </div>
          </div>

          {/* Report Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
            <button
              onClick={() => openModal('mortality', { batch: isAll ? (batches[0]?.batch_no || '') : selectedBatchFilter })}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-xs transition text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Death for {isAll ? 'Flock' : `Batch #${selectedBatchFilter}`}</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold p-2 rounded-lg border border-slate-300 transition cursor-pointer"
              title="Export Report CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Mortality Incidents Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Mortality Incidents Log
            </h3>
            <p className="text-xs text-slate-500">
              Detailed event log with diagnosed cause and bird loss count
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 font-mono bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto">
            {filteredLogs.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Batch #</th>
                <th className="py-3 px-4 text-center">Loss Count</th>
                <th className="py-3 px-4">Diagnosed Cause / Symptoms</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      {formatDateTime(m.date)}
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 font-mono">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold font-mono">
                        Batch #{m.batch}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-black text-rose-600 text-sm">
                      💀 {m.no_of_deaths}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {m.reason_of_death}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => openModal('mortality', m)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                          title="Edit Mortality Record"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Delete mortality record for ${m.no_of_deaths} deaths (${m.reason_of_death})?`)) {
                              onDeleteMortality(m.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400">
                    No mortality incidents recorded matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
