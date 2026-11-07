import React, { useState, useMemo, useEffect } from 'react';
import {
  Layers,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Syringe,
  BarChart3,
  Percent,
  HeartPulse,
  DollarSign,
  ShoppingCart,
  Receipt,
  Skull,
  LayoutGrid,
  Eye
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, translations } from '../utils';

export default function DashboardView({
  batches,
  batchMetrics,
  sales,
  expenses,
  mortalityLogs,
  openModal,
  lang,
  onNavigateToView
}) {
  const t = translations[lang] || translations.en;

  // Selected Batch for the Dashboard.
  const [selectedBatchNo, setSelectedBatchNo] = useState(() => {
    if (batches && batches.length > 0) {
      return Number(batches[batches.length - 1].batch_no);
    }
    return null;
  });

  // Synchronize selectedBatchNo when batches load asynchronously
  useEffect(() => {
    if (batches && batches.length > 0) {
      if (selectedBatchNo === null || !batches.some((b) => Number(b.batch_no) === Number(selectedBatchNo))) {
        setSelectedBatchNo(Number(batches[batches.length - 1].batch_no));
      }
    }
  }, [batches, selectedBatchNo]);

  // SINGLE BOX TOGGLE VIEW CONTROLLER
  // 'all' | 'vaccine' | 'population' | 'spending' | 'sales'
  const [activeToggleTab, setActiveToggleTab] = useState('all');

  // Individual collapsible state for each section inside the single box
  const [collapsedSections, setCollapsedSections] = useState({
    vaccine: false,
    population: false,
    spending: false,
    sales: false
  });

  const toggleSection = (key) => {
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Sales period filter: '7days' | '1month' | 'custom' (Applies to BOTH Sales Details & Bar Graph)
  const [salesPeriod, setSalesPeriod] = useState('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Historical all-batches comparison table
  const [showBatchMatrix, setShowBatchMatrix] = useState(false);

  // Active batch
  const currentBatch = useMemo(() => {
    if (!batches || batches.length === 0) return null;
    const found = batches.find((b) => Number(b.batch_no) === Number(selectedBatchNo));
    return found || batches[batches.length - 1];
  }, [batches, selectedBatchNo]);

  // Compute metrics for the selected batch
  const currentBatchData = useMemo(() => {
    if (!currentBatch) return null;

    const bNo = Number(currentBatch.batch_no);
    const totalCount = Number(currentBatch.no_of_chicks) || 0;
    const chickBuyingPrice = Number(currentBatch.buying_price) || 0;

    // Sales for this batch
    const batchSales = sales.filter((s) => {
      const sBatch = Number(s.batch?.batch_no || s.batch);
      return sBatch === bNo;
    });

    const totalHens = batchSales.reduce((acc, s) => acc + (Number(s.no_of_hens) || 0), 0);
    const totalRoosters = batchSales.reduce((acc, s) => acc + (Number(s.no_of_roosters) || 0), 0);
    const totalSold = totalHens + totalRoosters;
    const totalKg = batchSales.reduce((acc, s) => acc + (Number(s.kg) || 0), 0);
    const income = batchSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);

    // Expenses for this batch
    const batchExpenses = expenses.filter((e) => Number(e.batch) === bNo);
    const feedExpenses = batchExpenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
    const totalExpenses = chickBuyingPrice + feedExpenses;

    // Mortality for this batch
    const batchDeaths = mortalityLogs.filter((m) => Number(m.batch) === bNo);
    const totalDeaths = batchDeaths.reduce((acc, m) => acc + (Number(m.no_of_deaths) || 0), 0);

    const totalAlive = Math.max(0, totalCount - totalDeaths - totalSold);
    const mortalityPercent = totalCount > 0 ? (totalDeaths / totalCount) * 100 : 0;
    const survivalPercent = totalCount > 0 ? (totalAlive / totalCount) * 100 : 0;
    const profit = income - totalExpenses;
    const isProfit = profit > 0;
    const isLoss = profit < 0;

    // Days Passed Till Present
    let daysPassed = 0;
    if (currentBatch.date) {
      const sDate = new Date(currentBatch.date);
      const today = new Date();
      const diffTime = today.setHours(0, 0, 0, 0) - sDate.setHours(0, 0, 0, 0);
      daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    }
    const SELLING_POINT_DAYS = 150;
    const daysRemaining = Math.max(0, SELLING_POINT_DAYS - daysPassed);
    const isPastSellingPoint = daysPassed > SELLING_POINT_DAYS;
    const progressPercent = Math.min(100, Math.round((daysPassed / SELLING_POINT_DAYS) * 100));

    // Unit Cost Analysis & Profit Margins
    const costPerBird = totalAlive > 0 ? totalExpenses / totalAlive : totalCount > 0 ? totalExpenses / totalCount : 0;
    const effectiveBirds = totalAlive + totalSold;
    const costPerWinning = effectiveBirds > 0 ? totalExpenses / effectiveBirds : costPerBird;

    const sellPrice60Markup = costPerBird * 1.60;
    const sellPrice70Markup = costPerBird * 1.70;
    const profitPerBird60 = sellPrice60Markup - costPerBird;
    const profitPerBird70 = sellPrice70Markup - costPerBird;

    return {
      batchNo: bNo,
      startDate: currentBatch.date,
      totalCount,
      totalAlive,
      survivalPercent,
      totalDeaths,
      mortalityPercent,
      totalSold,
      totalHens,
      totalRoosters,
      totalKg,
      income,
      chickBuyingPrice,
      feedExpenses,
      totalExpenses,
      costPerBird,
      costPerWinning,
      sellPrice60Markup,
      sellPrice70Markup,
      profitPerBird60,
      profitPerBird70,
      profit,
      isProfit,
      isLoss,
      daysPassed,
      daysRemaining,
      isPastSellingPoint,
      progressPercent,
      salesList: batchSales,
      expensesList: batchExpenses,
      deathsList: batchDeaths
    };
  }, [currentBatch, sales, expenses, mortalityLogs]);

  // Filtered Sales for BOTH Sales Details & Bar Graph
  const filteredSalesData = useMemo(() => {
    if (!currentBatchData) return { list: [], chartBars: [], totalPeriodRevenue: 0 };

    const batchSales = currentBatchData.salesList;
    const now = new Date();
    now.setHours(23, 59, 59, 999);

    let filtered = [...batchSales];

    if (salesPeriod === '7days') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      filtered = filtered.filter((s) => {
        const d = new Date(s.date);
        return d >= sevenDaysAgo && d <= now;
      });
    } else if (salesPeriod === '1month') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      filtered = filtered.filter((s) => {
        const d = new Date(s.date);
        return d >= thirtyDaysAgo && d <= now;
      });
    } else if (salesPeriod === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        filtered = filtered.filter((s) => new Date(s.date) >= start);
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        filtered = filtered.filter((s) => new Date(s.date) <= end);
      }
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    const totalPeriodRevenue = filtered.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    const chartBars = [];

    if (salesPeriod === '7days') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().slice(0, 10);
        const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'narrow' });

        const daySales = filtered.filter((s) => s.date === dateStr);
        const dayTotal = daySales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
        const dayChicks = daySales.reduce(
          (acc, s) => acc + (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0),
          0
        );

        chartBars.push({
          date: dateStr,
          label: dayLabel,
          amount: dayTotal,
          chicks: dayChicks
        });
      }
    } else if (salesPeriod === '1month') {
      for (let w = 4; w >= 0; w--) {
        const wEnd = new Date();
        wEnd.setDate(wEnd.getDate() - w * 7);
        wEnd.setHours(23, 59, 59, 999);
        const wStart = new Date(wEnd);
        wStart.setDate(wStart.getDate() - 6);
        wStart.setHours(0, 0, 0, 0);

        const weekSales = filtered.filter((s) => {
          const sd = new Date(s.date);
          return sd >= wStart && sd <= wEnd;
        });

        const weekTotal = weekSales.reduce((acc, s) => acc + (Number(s.amount) || 0), 0);
        const weekChicks = weekSales.reduce(
          (acc, s) => acc + (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0),
          0
        );

        chartBars.push({
          date: `${wStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
          label: `W${5 - w}`,
          amount: weekTotal,
          chicks: weekChicks
        });
      }
    } else {
      const dateMap = {};
      filtered.forEach((s) => {
        const d = s.date;
        if (!dateMap[d]) dateMap[d] = 0;
        dateMap[d] += Number(s.amount) || 0;
      });

      const dates = Object.keys(dateMap).sort();
      if (dates.length > 0) {
        dates.slice(-7).forEach((d) => {
          const dt = new Date(d);
          chartBars.push({
            date: d,
            label: dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
            amount: dateMap[d],
            chicks: 0
          });
        });
      } else {
        ['P1', 'P2', 'P3', 'P4', 'P5'].forEach((p) => {
          chartBars.push({ label: p, amount: 0, chicks: 0 });
        });
      }
    }

    const maxBarAmount = Math.max(...chartBars.map((b) => b.amount), 1);

    return {
      list: filtered,
      chartBars: chartBars.map((b) => ({
        ...b,
        heightPercent: Math.max(8, Math.round((b.amount / maxBarAmount) * 100))
      })),
      totalPeriodRevenue
    };
  }, [currentBatchData, salesPeriod, customStartDate, customEndDate]);

  // Stepper handlers for 1-click batch navigation
  const handleStepPrev = () => {
    if (!batches || batches.length === 0) return;
    const sorted = [...batches].sort((a, b) => Number(a.batch_no) - Number(b.batch_no));
    const curNo = currentBatch ? Number(currentBatch.batch_no) : Number(sorted[sorted.length - 1].batch_no);
    const idx = sorted.findIndex((b) => Number(b.batch_no) === curNo);
    if (idx > 0) {
      setSelectedBatchNo(Number(sorted[idx - 1].batch_no));
    }
  };

  const handleStepNext = () => {
    if (!batches || batches.length === 0) return;
    const sorted = [...batches].sort((a, b) => Number(a.batch_no) - Number(b.batch_no));
    const curNo = currentBatch ? Number(currentBatch.batch_no) : Number(sorted[sorted.length - 1].batch_no);
    const idx = sorted.findIndex((b) => Number(b.batch_no) === curNo);
    if (idx !== -1 && idx < sorted.length - 1) {
      setSelectedBatchNo(Number(sorted[idx + 1].batch_no));
    }
  };

  // Standard 10 clinical milestones for the timeline
  const vaccineMilestones = [
    { day: 1, name: "Marex (HVT)", full: "Marex Vaccine (HVT Strain)", route: "0.2ml SC" },
    { day: 7, name: "Ranikhet F1", full: "Ranikhet F1 Eye Drop", route: "1 Drop" },
    { day: 10, name: "Nose Chipping", full: "Nose Chipping (மூக்கு நுனி வெட்டு)", route: "Beak Trim" },
    { day: 14, name: "IBD (Gumboro)", full: "IBD Gumboro Vaccine", route: "Drinking Water" },
    { day: 21, name: "RD Lasota", full: "Ranikhet Lasota", route: "Water Mix" },
    { day: 28, name: "IBD Booster", full: "IBD Secondary Booster", route: "Water Mix" },
    { day: 35, name: "Fowl Pox", full: "Fowl Pox Wing Web", route: "0.02ml Wing" },
    { day: 45, name: "Lasota Booster", full: "Ranikhet Booster Reinforcement", route: "Water Mix" },
    { day: 55, name: "Albomar", full: "Albomar Deworming (குடற்புழு நீக்கம்)", route: "Drinking Water" },
    { day: 57, name: "RDVK Inj", full: "RDVK Ranikhet K Strain", route: "0.05ml IM" }
  ];

  // Empty State: If no batches exist in DB
  if (!batches || batches.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-white rounded-2xl border border-slate-300 p-10 text-center shadow-xs">
          <div className="w-16 h-16 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-8 h-8 text-slate-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">No Active Batches Found</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
            Your database is ready. Add your first commercial poultry batch to start recording chick acquisition, feed expenses, live sales, and batch profitability.
          </p>
          <button
            onClick={() => openModal('batch')}
            className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Batch</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* =========================================================================
          THE SINGLE BOX — EVERYTHING COMBINED INTO ONE UNIFIED CONTAINER
          Contains:
          1. Header Row (Batch, Date, Count)
          2. Large Action Buttons (Add Sale, Add Expense, Log Death, New Batch)
          3. Section Toggle Buttons Bar (Vaccine, Dead/Alive, Amount Spend, Sales with Graph, View All)
          4. Dynamic Content Areas inside the box matching the toggles
          ========================================================================= */}
      {currentBatchData && (
        <div className="bg-white rounded-2xl border border-slate-300 p-5 sm:p-7 shadow-sm space-y-6">

          {/* 1. TOP ROW: Batch Select | Date | Count (Balanced 3-column grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Batch Selector Box */}
            <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 block">
                Select Batch
              </span>
              <div className="flex items-center gap-1.5 w-full">
                <button
                  type="button"
                  onClick={handleStepPrev}
                  disabled={batches.length <= 1}
                  title="Previous batch"
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-800 font-bold disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition shrink-0 shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="relative flex-1">
                  <select
                    value={currentBatchData.batchNo}
                    onChange={(e) => setSelectedBatchNo(Number(e.target.value))}
                    className="w-full appearance-none bg-slate-900 text-white font-mono font-black text-xs sm:text-sm py-2 pl-3 pr-8 rounded-lg cursor-pointer hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                    title="Press this to change batches"
                  >
                    {batches.map((b) => (
                      <option key={b.batch_no} value={b.batch_no} className="bg-white text-slate-900 font-bold">
                        Batch #{b.batch_no}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-emerald-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                <button
                  type="button"
                  onClick={handleStepNext}
                  disabled={batches.length <= 1}
                  title="Next batch"
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 flex items-center justify-center text-slate-800 font-bold disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition shrink-0 shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Placement Date Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Placement Date
                </span>
                <span className="text-sm font-black font-mono text-slate-900">
                  {formatDate(currentBatchData.startDate)}
                </span>
              </div>
            </div>

            {/* Initial Count Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Initial Count
                </span>
                <span className="text-sm font-black font-mono text-slate-900">
                  {formatNumber(currentBatchData.totalCount)}{' '}
                  <span className="text-xs font-semibold text-slate-500">Chicks</span>
                </span>
              </div>
            </div>
          </div>

          {/* 2. LARGER ACTION BUTTONS: Add Sale, Add Expense, Log Death, New Batch */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => openModal('sale', { batch: currentBatchData.batchNo })}
              className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-200" />
              <span>+ Add Sale</span>
            </button>

            <button
              onClick={() => openModal('expense', { batch: currentBatchData.batchNo })}
              className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Receipt className="w-4 h-4 text-amber-200" />
              <span>+ Add Expense</span>
            </button>

            <button
              onClick={() => openModal('mortality', { batch: currentBatchData.batchNo })}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Skull className="w-4 h-4 text-rose-200" />
              <span>+ Log Death</span>
            </button>

            <button
              onClick={() => openModal('batch')}
              className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-xs transition hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>+ New Batch</span>
            </button>
          </div>

          {/* 3. SECTION TOGGLE CONTROLS BAR (Switch or reveal each module inside the single box) */}
          <div className="bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                Module View Toggles (Click to switch or view all)
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Active: {activeToggleTab.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              {/* Toggle 1: Vaccine */}
              <button
                type="button"
                onClick={() => setActiveToggleTab('vaccine')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeToggleTab === 'vaccine'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <Syringe className="w-3.5 h-3.5 text-emerald-500" />
                <span>Vaccine Details</span>
              </button>

              {/* Toggle 2: Dead / Alive */}
              <button
                type="button"
                onClick={() => setActiveToggleTab('population')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeToggleTab === 'population'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                <span>Dead / Alive</span>
              </button>

              {/* Toggle 3: Amount Spend */}
              <button
                type="button"
                onClick={() => setActiveToggleTab('spending')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeToggleTab === 'spending'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                <span>Amount Spend</span>
              </button>

              {/* Toggle 4: Sales with Graph */}
              <button
                type="button"
                onClick={() => setActiveToggleTab('sales')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeToggleTab === 'sales'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Sales with Graph</span>
              </button>

              {/* Toggle 5: Show All */}
              <button
                type="button"
                onClick={() => setActiveToggleTab('all')}
                className={`col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeToggleTab === 'all'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Show All Parts</span>
              </button>
            </div>
          </div>

          {/* 4. DYNAMIC MODULES INSIDE THE SINGLE BOX */}
          <div className="space-y-4 pt-1">

            {/* MODULE A: VACCINE DETAILS (Day Counter with Vaccine Timeline) */}
            {(activeToggleTab === 'vaccine' || activeToggleTab === 'all') && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {/* Module Bar Header */}
                <div
                  onClick={() => toggleSection('vaccine')}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                      Day counter with vaccine
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                      Day {currentBatchData.daysPassed} / 150 Days
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-black bg-slate-900 text-white px-2.5 py-1 rounded-lg">
                      {currentBatchData.daysPassed} Days Passed
                    </span>
                    <button
                      type="button"
                      className="p-1 rounded-md text-slate-500 hover:text-slate-800"
                    >
                      {collapsedSections.vaccine ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Module Content */}
                {!collapsedSections.vaccine && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-200 space-y-3">
                    {/* Visual Progress Timeline with Day Pin and Milestone Dots */}
                    <div className="relative pt-6 pb-2 px-1">
                      <div className="w-full h-2.5 bg-slate-200 rounded-full relative">
                        {/* Colored Progress Bar */}
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            currentBatchData.isPastSellingPoint
                              ? 'bg-rose-500'
                              : currentBatchData.daysPassed >= 120
                              ? 'bg-amber-500'
                              : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(2, (currentBatchData.daysPassed / 150) * 100))}%` }}
                        />

                        {/* Day Pin */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none z-20"
                          style={{ left: `${Math.min(98, Math.max(2, (currentBatchData.daysPassed / 150) * 100))}%` }}
                        >
                          <div className="bg-slate-900 text-white text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mb-0.5">
                            Day {currentBatchData.daysPassed}
                          </div>
                          <div className="w-3 h-3 rounded-full bg-slate-900 border-2 border-white shadow-xs" />
                        </div>

                        {/* Milestone Dots */}
                        {vaccineMilestones.map((m) => {
                          const percent = Math.min(100, (m.day / 150) * 100);
                          const isPassed = currentBatchData.daysPassed >= m.day;
                          const isDueToday = currentBatchData.daysPassed === m.day;

                          return (
                            <div
                              key={m.day}
                              title={`${m.name} (${m.full}) - Day ${m.day}`}
                              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all z-10 ${
                                isDueToday
                                  ? 'bg-amber-400 border-slate-900 ring-2 ring-amber-300'
                                  : isPassed
                                  ? 'bg-emerald-500 border-white ring-1 ring-emerald-600'
                                  : 'bg-white border-slate-400'
                              }`}
                              style={{ left: `${percent}%` }}
                            />
                          );
                        })}
                      </div>

                      {/* Bottom Scale Markers */}
                      <div className="flex justify-between items-center text-[9.5px] text-slate-400 font-mono pt-1.5">
                        <span>Day 0</span>
                        <span>Day 30</span>
                        <span>Day 60</span>
                        <span>Day 90</span>
                        <span>Day 120</span>
                        <span className="font-bold text-slate-700">Day 150 (Cutoff)</span>
                      </div>
                    </div>

                    {/* Vaccine Chips */}
                    <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-200">
                      {vaccineMilestones.map((m) => {
                        const isPassed = currentBatchData.daysPassed >= m.day;
                        const isDueToday = currentBatchData.daysPassed === m.day;
                        return (
                          <span
                            key={m.day}
                            className={`text-[9.5px] font-mono px-2 py-0.5 rounded border font-semibold ${
                              isDueToday
                                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                                : isPassed
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                            title={`${m.full} (${m.route})`}
                          >
                            D{m.day} {m.name} {isPassed ? '✓' : ''}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODULE B: FLOCK POPULATION (Dead & Alive Count) */}
            {(activeToggleTab === 'population' || activeToggleTab === 'all') && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {/* Module Bar Header */}
                <div
                  onClick={() => toggleSection('population')}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Dead / Alive Count (Flock Population)
                    </span>
                    <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100/70 border border-emerald-200 text-emerald-800">
                      {formatNumber(currentBatchData.totalAlive)} Alive • {formatNumber(currentBatchData.totalDeaths)} Dead
                    </span>
                  </div>

                  <button
                    type="button"
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800"
                  >
                    {collapsedSections.population ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Module Content */}
                {!collapsedSections.population && (
                  <div className="p-4 bg-white border-t border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Alive Card */}
                      <div className="bg-emerald-50/80 border border-emerald-300 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
                            Total Alive
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                            {currentBatchData.survivalPercent.toFixed(1)}% Survival
                          </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-800">
                          {formatNumber(currentBatchData.totalAlive)}
                        </div>
                        <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
                          Healthy birds currently in shed
                        </p>
                      </div>

                      {/* Death Card */}
                      <div className="bg-rose-50/80 border border-rose-300 p-4 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-rose-900 uppercase tracking-wider">
                            Total Death
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-300">
                            {currentBatchData.mortalityPercent.toFixed(1)}% Mortality
                          </span>
                        </div>
                        <div className="text-2xl sm:text-3xl font-black font-mono text-rose-800">
                          💀 {formatNumber(currentBatchData.totalDeaths)}
                        </div>
                        <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                          Recorded mortality ({currentBatchData.totalDeaths} of {currentBatchData.totalCount} chicks)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODULE C: AMOUNT SPEND & MARGINS */}
            {(activeToggleTab === 'spending' || activeToggleTab === 'all') && (
              <div className="border border-amber-300 rounded-xl overflow-hidden bg-white shadow-2xs">
                {/* Module Bar Header */}
                <div
                  onClick={() => toggleSection('spending')}
                  className="p-3.5 bg-amber-50/70 hover:bg-amber-100/70 flex items-center justify-between cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-amber-800" />
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Amount Spend & Margins
                    </span>
                    <span className="text-sm font-black font-mono text-amber-950">
                      {formatCurrency(currentBatchData.totalExpenses)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="p-1 rounded-md text-amber-800 hover:text-amber-950"
                  >
                    {collapsedSections.spending ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Module Content */}
                {!collapsedSections.spending && (
                  <div className="p-4 bg-white border-t border-amber-200 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Cost of Raising 1 Chicken
                        </span>
                        <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">
                          {formatCurrency(currentBatchData.costPerBird)}
                          <span className="text-xs font-normal text-slate-500"> / bird</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          Spend ({formatCurrency(currentBatchData.totalExpenses)}) ÷ {currentBatchData.totalAlive} alive
                        </p>
                      </div>

                      <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10.5px] font-bold text-purple-900 uppercase tracking-wider">
                            Sell Price @ 60% Margin
                          </span>
                          <Percent className="w-3 h-3 text-purple-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-purple-900">
                          {formatCurrency(currentBatchData.sellPrice60Markup)}
                          <span className="text-xs font-normal text-purple-600"> / bird</span>
                        </div>
                        <p className="text-[10px] text-purple-700 mt-1 font-medium">
                          + {formatCurrency(currentBatchData.profitPerBird60)} profit margin
                        </p>
                      </div>

                      <div className="bg-purple-50/80 border border-purple-200 p-3.5 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10.5px] font-bold text-purple-900 uppercase tracking-wider">
                            Sell Price @ 70% Margin
                          </span>
                          <Percent className="w-3 h-3 text-purple-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-black font-mono text-purple-900">
                          {formatCurrency(currentBatchData.sellPrice70Markup)}
                          <span className="text-xs font-normal text-purple-600"> / bird</span>
                        </div>
                        <p className="text-[10px] text-purple-700 mt-1 font-medium">
                          + {formatCurrency(currentBatchData.profitPerBird70)} profit margin
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono text-slate-600 border-t border-slate-100">
                      <span className="font-sans font-bold text-slate-500 uppercase text-[9.5px]">Breakdown:</span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Chick: <strong className="text-slate-800">{formatCurrency(currentBatchData.chickBuyingPrice)}</strong>
                      </span>
                      <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        Feed & Ops: <strong className="text-slate-800">{formatCurrency(currentBatchData.feedExpenses)}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MODULE D: SALES WITH GRAPH */}
            {(activeToggleTab === 'sales' || activeToggleTab === 'all') && (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {/* Module Bar Header */}
                <div
                  onClick={() => toggleSection('sales')}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition select-none"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Sales with Graph
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Period Revenue: {formatCurrency(filteredSalesData.totalPeriodRevenue)}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="p-1 rounded-md text-slate-500 hover:text-slate-800"
                  >
                    {collapsedSections.sales ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronUp className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Module Content */}
                {!collapsedSections.sales && (
                  <div className="p-4 bg-white border-t border-slate-200 space-y-4">
                    {/* Period Filter Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 pb-1">
                      <button
                        onClick={() => setSalesPeriod('7days')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          salesPeriod === '7days'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Sales 7 Days
                      </button>
                      <button
                        onClick={() => setSalesPeriod('1month')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          salesPeriod === '1month'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        1 Month
                      </button>
                      <button
                        onClick={() => setSalesPeriod('custom')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition cursor-pointer ${
                          salesPeriod === 'custom'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Custom ▾
                      </button>
                    </div>

                    {/* Custom Date Pickers */}
                    {salesPeriod === 'custom' && (
                      <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <label className="font-bold text-slate-600">From:</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <label className="font-bold text-slate-600">To:</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                          />
                        </div>
                        {(customStartDate || customEndDate) && (
                          <button
                            onClick={() => {
                              setCustomStartDate('');
                              setCustomEndDate('');
                            }}
                            className="text-slate-500 hover:text-slate-800 underline text-xs cursor-pointer ml-auto"
                          >
                            Clear dates
                          </button>
                        )}
                      </div>
                    )}

                    {/* Size Ratio Grid: Left (~68% Sales Details) | Right (~32% Bar Graph) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                      
                      {/* Left: Sales Details */}
                      <div className="lg:col-span-8 bg-slate-50/70 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                            Sales Details (Customer, Price, No. of Chicken & Details)
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">
                            {filteredSalesData.list.length} Orders
                          </span>
                        </div>

                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {filteredSalesData.list.length > 0 ? (
                            filteredSalesData.list.map((s) => {
                              const totalBirds = (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0);
                              return (
                                <div
                                  key={s.id}
                                  className="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between hover:border-slate-300 transition shadow-2xs"
                                >
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-slate-900 block">
                                      {s.customer?.customer_name || 'Walk-in Buyer'}
                                    </span>
                                    <span className="text-[10.5px] text-slate-500 font-mono block">
                                      {formatDate(s.date)} • {totalBirds} birds ({s.no_of_hens || 0}H / {s.no_of_roosters || 0}R)
                                      {s.kg ? ` • ${s.kg} kg` : ''}
                                    </span>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-xs sm:text-sm font-black font-mono text-emerald-700 block">
                                      +{formatCurrency(s.amount)}
                                    </span>
                                    {s.kg > 0 && s.amount > 0 && (
                                      <span className="text-[9.5px] text-slate-400 font-mono">
                                        ₹{(s.amount / s.kg).toFixed(1)}/kg
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-center py-8 text-slate-400">
                              <p className="text-xs">No sales recorded for this timeframe</p>
                              <button
                                onClick={() => openModal('sale', { batch: currentBatchData.batchNo })}
                                className="mt-1.5 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                              >
                                + Record Sale
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-1 border-t border-slate-200">
                          <span>Total Sold: {currentBatchData.totalSold} birds</span>
                          <span>Biomass: {currentBatchData.totalKg.toFixed(1)} kg</span>
                        </div>
                      </div>

                      {/* Right: Bar Graph */}
                      <div className="lg:col-span-4 bg-slate-50/70 border border-slate-200 rounded-xl p-3 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                            Bar Graph
                          </span>
                          <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                            {salesPeriod === '7days' ? 'Daily' : salesPeriod === '1month' ? 'Weekly' : 'Custom'}
                          </span>
                        </div>

                        <div className="flex items-end gap-1.5 sm:gap-2 h-40 pt-5 pb-1 px-1 border-b border-slate-200">
                          {filteredSalesData.chartBars.map((bar, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                              <span className="text-[8.5px] font-mono font-bold text-slate-700 opacity-90 mb-0.5 truncate group-hover:scale-110 transition">
                                {bar.amount > 0 ? `₹${Math.round(bar.amount / 1000)}k` : '-'}
                              </span>

                              <div
                                className={`w-full max-w-[24px] rounded-t-sm transition-all duration-300 ${
                                  bar.amount > 0
                                    ? idx % 2 === 0
                                      ? 'bg-emerald-600 hover:bg-emerald-700'
                                      : 'bg-emerald-500 hover:bg-emerald-600'
                                    : 'bg-slate-200'
                                }`}
                                style={{ height: `${bar.heightPercent}%` }}
                                title={`${bar.date || bar.label}: ${formatCurrency(bar.amount)} (${bar.chicks} birds)`}
                              />

                              <span className="text-[9px] font-semibold text-slate-500 mt-1 truncate">
                                {bar.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="text-right text-[10.5px] font-semibold text-slate-500">
                          Total: <strong className="text-emerald-700 font-mono">{formatCurrency(filteredSalesData.totalPeriodRevenue)}</strong>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* =========================================================================
          HISTORICAL ALL BATCHES MATRIX (Collapsible footer)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowBatchMatrix(!showBatchMatrix)}
          className="w-full p-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left"
        >
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              All Batches Historical Performance Matrix
            </h4>
            <p className="text-xs text-slate-500">
              Side-by-side comparison of initial chicks, flock survival, total kg, income, spending, and profit
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {batches.length} Batches
            </span>
            {showBatchMatrix ? (
              <ChevronUp className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            )}
          </div>
        </button>

        {showBatchMatrix && (
          <div className="overflow-x-auto border-t border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3">Batch</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3 text-center">Initial Count</th>
                  <th className="py-3 px-3 text-center">Alive</th>
                  <th className="py-3 px-3 text-center">Dead</th>
                  <th className="py-3 px-3 text-center">Mortality Rate</th>
                  <th className="py-3 px-3 text-center">Sold</th>
                  <th className="py-3 px-3 text-right">Income</th>
                  <th className="py-3 px-3 text-right">Expenses</th>
                  <th className="py-3 px-3 text-right">Profit / Loss</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {batches.map((b) => {
                  const bNo = Number(b.batch_no);
                  const isSelected = currentBatch && Number(currentBatch.batch_no) === bNo;
                  const bSales = sales.filter((s) => Number(s.batch?.batch_no || s.batch) === bNo);
                  const sold = bSales.reduce(
                    (sum, s) => sum + (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0),
                    0
                  );
                  const inc = bSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

                  const bExp = expenses.filter((e) => Number(e.batch) === bNo);
                  const totalExp = (Number(b.buying_price) || 0) + bExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

                  const bDeaths = mortalityLogs.filter((m) => Number(m.batch) === bNo);
                  const deaths = bDeaths.reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);
                  const mortalityRate = b.no_of_chicks > 0 ? (deaths / b.no_of_chicks) * 100 : 0;
                  const alive = Math.max(0, b.no_of_chicks - deaths - sold);
                  const profit = inc - totalExp;

                  return (
                    <tr
                      key={bNo}
                      onClick={() => setSelectedBatchNo(bNo)}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isSelected ? 'bg-slate-100/80 font-bold' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-bold text-slate-900">#{bNo}</td>
                      <td className="py-3 px-3 text-slate-600">{formatDate(b.date)}</td>
                      <td className="py-3 px-3 text-center text-slate-900">{b.no_of_chicks}</td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-bold">{alive}</td>
                      <td className="py-3 px-3 text-center text-rose-600 font-bold">💀 {deaths}</td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                            mortalityRate <= 5
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {mortalityRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-700">{sold}</td>
                      <td className="py-3 px-3 text-right text-emerald-700 font-bold">{formatCurrency(inc)}</td>
                      <td className="py-3 px-3 text-right text-amber-800">{formatCurrency(totalExp)}</td>
                      <td
                        className={`py-3 px-3 text-right font-black ${
                          profit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {profit >= 0 ? '+' : ''}
                        {formatCurrency(profit)}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBatchNo(bNo);
                          }}
                          className={`text-xs px-2.5 py-1 rounded-xl transition font-semibold cursor-pointer ${
                            isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isSelected ? 'Active' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
