import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Syringe,
  Droplets,
  Eye,
  Scissors,
  Check,
  RotateCcw,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
  FileSpreadsheet,
  Info
} from 'lucide-react';
import { fetchBatchVaccinations, toggleVaccination, updateVaccination } from '../api';
import { formatDate, translations } from '../utils';

export default function VaccinationBoard({
  batches,
  selectedBatchNo,
  setSelectedBatchNo,
  showToast,
  lang
}) {
  const t = translations[lang] || translations.en;

  const currentBatch = useMemo(() => {
    if (!batches || batches.length === 0) return null;
    const found = batches.find((b) => b.batch_no === selectedBatchNo);
    return found || batches[batches.length - 1];
  }, [batches, selectedBatchNo]);

  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'COMPLETED'
  const [administerModal, setAdministerModal] = useState({ open: false, record: null, date: '' });

  // Calculate current age of the flock in days
  const flockAgeDays = useMemo(() => {
    if (!currentBatch || !currentBatch.date) return 0;
    const start = new Date(currentBatch.date);
    const today = new Date();
    const diffTime = today - start;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }, [currentBatch]);

  // Load vaccinations for the current batch
  const loadVaccinations = async () => {
    if (!currentBatch) return;
    setLoading(true);
    try {
      const data = await fetchBatchVaccinations(currentBatch.batch_no);
      setVaccines(data);
    } catch (err) {
      console.error('Error fetching vaccinations:', err);
      showToast && showToast('Failed to load vaccination schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaccinations();
  }, [currentBatch?.batch_no]);

  // Handle Mark Done / Undo
  const handleToggle = async (v, customDate = null) => {
    try {
      let targetDate = null;
      if (!v.is_completed) {
        targetDate = customDate || new Date().toISOString().slice(0, 10);
      }
      const updated = await toggleVaccination(v.id, targetDate);
      setVaccines((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (updated.is_completed) {
        showToast && showToast(`Milestone recorded: ${v.vaccine_name}`);
      } else {
        showToast && showToast(`Milestone reverted to pending: ${v.vaccine_name}`, 'info');
      }
    } catch (err) {
      showToast && showToast('Error updating milestone: ' + err.message, 'error');
    }
  };

  // Open custom date modal
  const openAdministerDialog = (v) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    setAdministerModal({ open: true, record: v, date: todayStr });
  };

  const confirmAdministerDialog = async () => {
    if (!administerModal.record) return;
    await handleToggle(administerModal.record, administerModal.date);
    setAdministerModal({ open: false, record: null, date: '' });
  };

  // Metrics
  const completedCount = vaccines.filter((v) => v.is_completed).length;
  const totalCount = vaccines.length;
  const protectionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Identify next upcoming or overdue vaccine
  const nextVaccine = useMemo(() => {
    const pending = vaccines.filter((v) => !v.is_completed);
    if (pending.length === 0) return null;
    return pending.sort((a, b) => a.day - b.day)[0];
  }, [vaccines]);

  // Filtered list
  const filteredVaccines = useMemo(() => {
    if (filter === 'COMPLETED') return vaccines.filter((v) => v.is_completed);
    if (filter === 'PENDING') return vaccines.filter((v) => !v.is_completed);
    return vaccines;
  }, [vaccines, filter]);

  // Export CSV
  const handleExportCSV = () => {
    if (!vaccines || vaccines.length === 0 || !currentBatch) return;
    const headers = [
      'Day Milestone',
      'Scheduled Date',
      'Vaccine / Procedure',
      'Dosage',
      'Target Disease / Purpose',
      'Delivery Route',
      'Status',
      'Administered Date'
    ];
    const rows = vaccines.map((v) => [
      `Day ${v.day}`,
      v.scheduled_date,
      `"${v.vaccine_name.replace(/"/g, '""')}"`,
      `"${(v.dosage || '').replace(/"/g, '""')}"`,
      `"${(v.disease || '').replace(/"/g, '""')}"`,
      `"${(v.route || '').replace(/"/g, '""')}"`,
      v.is_completed ? 'Completed' : 'Pending',
      v.administered_date || ''
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Batch_${currentBatch.batch_no}_Vaccination_Protocol.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for route icon
  const getRouteIcon = (route, vaccineName = '') => {
    const r = (route || '').toLowerCase();
    const v = (vaccineName || '').toLowerCase();
    if (v.includes('nose') || v.includes('chipping') || r.includes('debeak') || r.includes('வெட்டு')) {
      return <Scissors className="w-3.5 h-3.5 text-amber-700 shrink-0" />;
    }
    if (r.includes('eye') || r.includes('nasal') || r.includes('சொட்டு')) {
      return <Eye className="w-3.5 h-3.5 text-sky-700 shrink-0" />;
    }
    if (r.includes('water') || r.includes('குடிநீர்')) {
      return <Droplets className="w-3.5 h-3.5 text-blue-700 shrink-0" />;
    }
    if (r.includes('wing') || r.includes('தோல் குத்து')) {
      return <Activity className="w-3.5 h-3.5 text-purple-700 shrink-0" />;
    }
    return <Syringe className="w-3.5 h-3.5 text-emerald-700 shrink-0" />;
  };

  // Helper for batch navigation
  const currentBatchIndex = batches ? batches.findIndex((b) => b.batch_no === currentBatch?.batch_no) : -1;
  const prevBatch = currentBatchIndex > 0 ? batches[currentBatchIndex - 1] : null;
  const nextBatch = currentBatchIndex >= 0 && currentBatchIndex < batches.length - 1 ? batches[currentBatchIndex + 1] : null;

  if (!batches || batches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-300 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
          <Layers className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">No Active Batches Available</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Create a commercial flock batch in the Batches module to initialize and track its 10-milestone biosecurity vaccination protocol.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Batch Scope Selector */}
      <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Scope Selection with Prev / Next */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => prevBatch && setSelectedBatchNo(prevBatch.batch_no)}
              disabled={!prevBatch}
              title={prevBatch ? `Go to Batch #${prevBatch.batch_no}` : 'No previous batch'}
              className="p-1.5 rounded hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-2">
              <label htmlFor="batchSelect" className="sr-only">Select Batch</label>
              <select
                id="batchSelect"
                value={currentBatch ? currentBatch.batch_no : ''}
                onChange={(e) => setSelectedBatchNo(Number(e.target.value))}
                className="bg-transparent text-xs font-bold font-mono text-slate-900 focus:outline-hidden cursor-pointer"
              >
                {batches.map((b) => (
                  <option key={b.batch_no} value={b.batch_no}>
                    Batch #{b.batch_no} ({b.no_of_chicks} chicks • {b.date})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => nextBatch && setSelectedBatchNo(nextBatch.batch_no)}
              disabled={!nextBatch}
              title={nextBatch ? `Go to Batch #${nextBatch.batch_no}` : 'No next batch'}
              className="p-1.5 rounded hover:bg-white text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Pill Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto">
            {batches.map((b) => (
              <button
                key={b.batch_no}
                onClick={() => setSelectedBatchNo(b.batch_no)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition cursor-pointer ${
                  currentBatch && currentBatch.batch_no === b.batch_no
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                #{b.batch_no}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Filter & Utility Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Filter */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({vaccines.length})
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                filter === 'PENDING' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setFilter('COMPLETED')}
              className={`px-3 py-1 rounded transition cursor-pointer ${
                filter === 'COMPLETED' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* CSV Export */}
          <button
            onClick={handleExportCSV}
            title="Export Protocol CSV"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          {/* Print Schedule */}
          <button
            onClick={() => window.print()}
            title="Print Schedule Sheet"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* 2. Flock Status & Active Milestone Banner */}
      {currentBatch && (
        <div className="bg-white rounded-xl border border-slate-300 p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black font-mono px-2 py-0.5 bg-slate-900 text-white rounded">
                  BATCH #{currentBatch.batch_no}
                </span>
                <h2 className="text-sm font-bold text-slate-900">
                  Standard 10-Milestone Vaccination & Biosecurity Protocol
                </h2>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Placement: {formatDate(currentBatch.date)} • Flock Population: {currentBatch.no_of_chicks} Chicks • Target Cycle: Day 1 to 57
              </p>
            </div>

            {/* Flock Age & Protocol Progress Meters */}
            <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-lg border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                  Flock Age
                </span>
                <span className="text-base font-black text-slate-900 font-mono">
                  Day {flockAgeDays}{' '}
                  <span className="text-xs font-normal text-slate-500">/ 57 Days</span>
                </span>
              </div>
              <div className="w-px h-7 bg-slate-200" />
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                  Milestones Completed
                </span>
                <span className="text-base font-black text-emerald-700 font-mono">
                  {completedCount}/{totalCount}{' '}
                  <span className="text-xs font-normal text-slate-500">({protectionPercent}%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar (Day 1 - 57) */}
          <div>
            <div className="flex justify-between items-center text-[11px] font-mono text-slate-600 mb-1.5">
              <span>Day 1 (Hatch / Placement)</span>
              <span className="font-bold text-slate-800">
                Flock Day {flockAgeDays} of 57
              </span>
              <span>Day 57 (Core Immunity & RDVK)</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div
                className="bg-emerald-700 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (flockAgeDays / 57) * 100)}%` }}
              />
            </div>
          </div>

          {/* Active Action Alert Card */}
          {nextVaccine ? (
            <div
              className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                flockAgeDays > nextVaccine.day
                  ? 'bg-rose-50/70 border-rose-300 text-rose-900'
                  : flockAgeDays === nextVaccine.day
                  ? 'bg-amber-50/70 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {flockAgeDays > nextVaccine.day ? (
                    <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  ) : flockAgeDays === nextVaccine.day ? (
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  ) : (
                    <Calendar className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold uppercase tracking-wide text-[11px]">
                      {flockAgeDays > nextVaccine.day
                        ? 'Protocol Action Overdue'
                        : flockAgeDays === nextVaccine.day
                        ? 'Protocol Action Due Today'
                        : 'Next Scheduled Protocol'}
                    </span>
                    <span className="font-mono px-1.5 py-0.2 rounded bg-black/5 font-bold">
                      DAY {nextVaccine.day}
                    </span>
                  </div>
                  <div className="font-bold text-sm text-slate-900">
                    {nextVaccine.vaccine_name}
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono mt-0.5 space-x-2">
                    <span>Target: {nextVaccine.disease}</span>
                    <span>•</span>
                    <span>Route: {nextVaccine.route}</span>
                    {nextVaccine.dosage && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-slate-800">Dosage: {nextVaccine.dosage}</span>
                      </>
                    )}
                    <span>•</span>
                    <span>Scheduled: {formatDate(nextVaccine.scheduled_date)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => openAdministerDialog(nextVaccine)}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-3.5 py-1.5 rounded transition cursor-pointer"
                >
                  Record Administered
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>
                All 10 biosecurity milestones completed for Batch #{currentBatch.batch_no}. Full core immunity established.
              </span>
            </div>
          )}
        </div>
      )}

      {/* 3. High-Density 10-Milestone Table */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Flock Biosecurity Schedule & Administration Log
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Displaying {filteredVaccines.length} of 10 milestones for Batch #{currentBatch?.batch_no}
            </p>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Standard Farm SOP: Day 1 to 57
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-3 px-3.5 w-16">Milestone</th>
                <th className="py-3 px-3.5 w-32">Scheduled Date</th>
                <th className="py-3 px-3.5">Vaccine & Procedure (தடுப்பூசி முறை)</th>
                <th className="py-3 px-3.5">Dosage / Formulation</th>
                <th className="py-3 px-3.5">Target Disease / Purpose</th>
                <th className="py-3 px-3.5">Method / Route</th>
                <th className="py-3 px-3.5 text-center w-28">Status</th>
                <th className="py-3 px-3.5 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredVaccines.length > 0 ? (
                filteredVaccines.map((v) => {
                  const isPast = flockAgeDays > v.day;
                  const isDueToday = flockAgeDays === v.day;

                  return (
                    <tr
                      key={v.id}
                      className={`hover:bg-slate-50/80 transition ${
                        v.is_completed ? 'bg-slate-50/40 text-slate-600' : ''
                      }`}
                    >
                      {/* Milestone Day */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          DAY {v.day}
                        </span>
                      </td>

                      {/* Scheduled Date */}
                      <td className="py-3 px-3.5 font-mono text-slate-800 whitespace-nowrap">
                        <div className="font-semibold">{formatDate(v.scheduled_date)}</div>
                        <div className="text-[10px] text-slate-500">
                          {v.is_completed ? (
                            <span className="text-emerald-700 font-semibold">Done: {formatDate(v.administered_date)}</span>
                          ) : isDueToday ? (
                            <span className="text-amber-700 font-bold">Due Today</span>
                          ) : isPast ? (
                            <span className="text-rose-700 font-bold">{flockAgeDays - v.day}d overdue</span>
                          ) : (
                            <span className="text-slate-500">In {v.day - flockAgeDays} days</span>
                          )}
                        </div>
                      </td>

                      {/* Vaccine Name & Tamil */}
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{v.vaccine_name}</div>
                        {v.day === 10 && (
                          <div className="text-[10px] text-amber-900 font-semibold mt-0.5">
                            தமிழ்: மூக்கு நுனி வெட்டுதல் (Debeaking / Beak Trimming)
                          </div>
                        )}
                      </td>

                      {/* Dosage */}
                      <td className="py-3 px-3.5">
                        {v.dosage ? (
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold border border-slate-200">
                            {v.dosage}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono text-[11px]">Standard</span>
                        )}
                      </td>

                      {/* Target Disease */}
                      <td className="py-3 px-3.5 text-slate-700">
                        <div>{v.disease}</div>
                      </td>

                      {/* Route */}
                      <td className="py-3 px-3.5 text-slate-800">
                        <div className="flex items-center gap-1.5 font-medium">
                          {getRouteIcon(v.route, v.vaccine_name)}
                          <span>{v.route}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {v.is_completed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3" />
                            <span>Done</span>
                          </span>
                        ) : isDueToday ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3" />
                            <span>Due Today</span>
                          </span>
                        ) : isPast ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertCircle className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {v.is_completed ? (
                          <button
                            onClick={() => handleToggle(v)}
                            title="Revert status to pending"
                            className="text-xs px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-semibold inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Undo</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => openAdministerDialog(v)}
                            title="Mark as completed with date"
                            className="text-xs px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white font-semibold inline-flex items-center gap-1 shadow-xs transition cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Done</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No milestone records matching filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Professional Biosecurity Guidelines Notes */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-slate-700" />
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
            Poultry Farm Clinical SOP & Administration Reference
          </h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs text-slate-600">
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">
              Day 10 — Beak Trimming (மூக்கு நுனி)
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Trimming upper 1/3 beak with electric cauterizing blade prevents feather pecking and feed wastage. Supplement with Vitamin K in water 24h prior.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">
              Day 35 — Fowl Pox (0.02 ml)
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Administer by wing web puncture using a bifurcated needle. Inspect birds 7 days later for take marks (nodules) confirming immunity.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">
              Day 55 — Albomar Deworming
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Dosage: 45 ml per 100 chicks administered in early morning cool drinking water. Purges roundworms and gastrointestinal parasites.
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <span className="font-bold text-slate-900 block mb-1">
              Day 57 — RDVK Injection (0.05 ml)
            </span>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Ranikhet Disease Vaccine K Strain administered via intramuscular thigh injection. Provides lifelong immunity against virulent Newcastle strains.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Administer Date Confirmation Dialog */}
      {administerModal.open && administerModal.record && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 border border-slate-300 shadow-xl space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Confirm Milestone Completion
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                Day {administerModal.record.day} — {administerModal.record.vaccine_name}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Dosage: {administerModal.record.dosage || 'Standard'} • Route: {administerModal.record.route}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date Administered
              </label>
              <input
                type="date"
                value={administerModal.date}
                onChange={(e) => setAdministerModal({ ...administerModal, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdministerModal({ open: false, record: null, date: '' })}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAdministerDialog}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs cursor-pointer"
              >
                Save Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
