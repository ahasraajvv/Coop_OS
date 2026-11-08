import React, { useState, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Download,
  Printer,
  Trash2,
  Pencil,
  Calendar,
  Layers,
  Users,
  Search,
  Filter,
  FileSpreadsheet,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Scale,
  Egg,
  PieChart as PieChartIcon,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUpRight,
  ShieldAlert,
  Percent,
  Activity,
  FileText,
  RotateCcw,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Line,
  ComposedChart
} from 'recharts';
import { formatCurrency, formatNumber, formatDate, exportToCSV, CUSTOMER_CATEGORIES, translations } from '../utils';

// Custom Tooltip for Sales Analytics Chart
function SalesChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 font-sans z-50 pointer-events-none space-y-1.5">
        <div className="font-bold text-slate-200 border-b border-slate-700 pb-1">
          {formatDate(data.date)}
        </div>
        <div className="flex justify-between gap-4 text-emerald-400 font-black">
          <span>Revenue:</span>
          <span>{formatCurrency(data.amount)}</span>
        </div>
        <div className="flex justify-between gap-4 text-sky-400">
          <span>Live Biomass:</span>
          <span>{data.kg.toFixed(1)} kg</span>
        </div>
        <div className="flex justify-between gap-4 text-slate-300">
          <span>Birds Sold:</span>
          <span>{data.birds} birds</span>
        </div>
        {data.ratePerKg > 0 && (
          <div className="flex justify-between gap-4 text-amber-400 pt-1 border-t border-slate-800 font-mono">
            <span>Avg Rate/Kg:</span>
            <span>{formatCurrency(data.ratePerKg)}</span>
          </div>
        )}
      </div>
    );
  }
  return null;
}

export default function SalesView({
  sales = [],
  batches = [],
  customers = [],
  expenses = [],
  infraExpenses = [],
  mortalityLogs = [],
  onDeleteSale,
  openModal,
  onPrintInvoice,
  selectedBatchFilter = 'ALL',
  setSelectedBatchFilter,
  searchQuery = '',
  onNavigateToView,
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;

  // View state: 'ledger' (Transaction table) | 'analytics' (Visual charts & customer concentration) | 'economics' (Unit margin bridge)
  const [activeTab, setActiveTab] = useState('ledger');
  const [customerFilter, setCustomerFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL' | '7D' | '30D' | 'THIS_MONTH'
  const [saleTypeFilter, setSaleTypeFilter] = useState('ALL'); // 'ALL' | 'meat' | 'breeding'
  const [paymentFilter, setPaymentFilter] = useState('ALL'); // 'ALL' | 'cash' | 'gpay'
  const [sortBy, setSortBy] = useState('DATE_DESC'); // 'DATE_DESC' | 'DATE_ASC' | 'AMOUNT_DESC' | 'KG_DESC' | 'RATE_DESC'

  // Sorted batches by batch_no descending
  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => Number(b.batch_no) - Number(a.batch_no));
  }, [batches]);

  // Interactive Batch-by-Batch Sales Aggregation Cards
  const batchSalesCards = useMemo(() => {
    const overall = {
      batch_no: 'ALL',
      label: 'All Batches',
      date: 'All Time',
      chicks: batches.reduce((sum, b) => sum + (Number(b.no_of_chicks) || 0), 0),
      totalSales: 0,
      cashSales: 0,
      gpaySales: 0,
      meatSales: 0,
      meatKg: 0,
      breedingSales: 0,
      breedingBirds: 0,
      totalBirdsSold: 0,
      count: sales.length
    };

    const batchMap = {};
    batches.forEach((b) => {
      batchMap[b.batch_no] = {
        batch_no: b.batch_no,
        date: b.date,
        chicks: Number(b.no_of_chicks) || 0,
        buyingPrice: Number(b.buying_price) || 0,
        totalSales: 0,
        cashSales: 0,
        gpaySales: 0,
        meatSales: 0,
        meatKg: 0,
        breedingSales: 0,
        breedingBirds: 0,
        totalBirdsSold: 0,
        count: 0
      };
    });

    sales.forEach((s) => {
      const bNo = s.batch?.batch_no || s.batch;
      const amt = Number(s.amount) || 0;
      const hens = Number(s.no_of_hens) || 0;
      const roosters = Number(s.no_of_roosters) || 0;
      const birds = hens + roosters;
      const kg = Number(s.kg) || 0;
      const isBreeding = s.sale_type === 'breeding';
      const isGpay = s.payment_method === 'gpay';

      overall.totalSales += amt;
      overall.totalBirdsSold += birds;
      if (isGpay) overall.gpaySales += amt;
      else overall.cashSales += amt;

      if (isBreeding) {
        overall.breedingSales += amt;
        overall.breedingBirds += birds;
      } else {
        overall.meatSales += amt;
        overall.meatKg += kg;
      }

      if (bNo && batchMap[bNo]) {
        const b = batchMap[bNo];
        b.totalSales += amt;
        b.totalBirdsSold += birds;
        b.count += 1;
        if (isGpay) b.gpaySales += amt;
        else b.cashSales += amt;

        if (isBreeding) {
          b.breedingSales += amt;
          b.breedingBirds += birds;
        } else {
          b.meatSales += amt;
          b.meatKg += kg;
        }
      }
    });

    const list = sortedBatches.map((b) => batchMap[b.batch_no]).filter(Boolean);
    return [overall, ...list];
  }, [batches, sales, sortedBatches]);

  // Stepper handlers (< and >) for 1-click batch cycling
  const handleStepPrev = () => {
    if (sortedBatches.length === 0) return;
    if (selectedBatchFilter === 'ALL') {
      setSelectedBatchFilter(sortedBatches[sortedBatches.length - 1].batch_no);
      return;
    }
    const idx = sortedBatches.findIndex((b) => Number(b.batch_no) === Number(selectedBatchFilter));
    if (idx !== -1 && idx < sortedBatches.length - 1) {
      setSelectedBatchFilter(sortedBatches[idx + 1].batch_no);
    }
  };

  const handleStepNext = () => {
    if (sortedBatches.length === 0) return;
    if (selectedBatchFilter === 'ALL') {
      setSelectedBatchFilter(sortedBatches[0].batch_no);
      return;
    }
    const idx = sortedBatches.findIndex((b) => Number(b.batch_no) === Number(selectedBatchFilter));
    if (idx !== -1 && idx > 0) {
      setSelectedBatchFilter(sortedBatches[idx - 1].batch_no);
    }
  };

  // Date filtering logic
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Filtered sales dataset
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const batchId = s.batch?.batch_no || s.batch;
      const custId = s.customer?.customer_id || s.customer;

      // 1. Batch filter
      if (selectedBatchFilter !== 'ALL' && batchId?.toString() !== selectedBatchFilter.toString()) {
        return false;
      }

      // 2. Customer filter
      if (customerFilter !== 'ALL' && custId?.toString() !== customerFilter.toString()) {
        return false;
      }

      // Category filter (Meat vs Breeding)
      if (saleTypeFilter !== 'ALL') {
        const type = s.sale_type || 'meat';
        if (type !== saleTypeFilter) return false;
      }

      // Payment filter (Cash vs GPay)
      if (paymentFilter !== 'ALL') {
        const method = s.payment_method || 'cash';
        if (method !== paymentFilter) return false;
      }

      // 3. Date preset filter
      if (s.date && datePreset !== 'ALL') {
        const saleDate = new Date(s.date);
        if (datePreset === '7D' && saleDate < sevenDaysAgo) return false;
        if (datePreset === '30D' && saleDate < thirtyDaysAgo) return false;
        if (datePreset === 'THIS_MONTH' && saleDate < startOfMonth) return false;
      }

      // 4. Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const custName = s.customer?.customer_name?.toLowerCase() || '';
        const phone = s.customer?.contact_number || '';
        const batchStr = batchId?.toString() || '';
        const invStr = `#inv-${s.id}`.toLowerCase();
        const dateStr = s.date || '';
        return (
          custName.includes(q) ||
          phone.includes(q) ||
          batchStr.includes(q) ||
          invStr.includes(q) ||
          dateStr.includes(q)
        );
      }

      return true;
    });
  }, [sales, selectedBatchFilter, customerFilter, datePreset, searchQuery, saleTypeFilter, paymentFilter]);

  // Sorted sales dataset
  const sortedSales = useMemo(() => {
    const list = [...filteredSales];
    list.sort((a, b) => {
      const aAmt = Number(a.amount) || 0;
      const bAmt = Number(b.amount) || 0;
      const aKg = Number(a.kg) || 0;
      const bKg = Number(b.kg) || 0;
      const aRate = aKg > 0 ? aAmt / aKg : 0;
      const bRate = bKg > 0 ? bAmt / bKg : 0;

      if (sortBy === 'DATE_DESC') return new Date(b.date || 0) - new Date(a.date || 0);
      if (sortBy === 'DATE_ASC') return new Date(a.date || 0) - new Date(b.date || 0);
      if (sortBy === 'AMOUNT_DESC') return bAmt - aAmt;
      if (sortBy === 'KG_DESC') return bKg - aKg;
      if (sortBy === 'RATE_DESC') return bRate - aRate;
      return 0;
    });
    return list;
  }, [filteredSales, sortBy]);

  // Aggregate Sales & Yield Metrics
  const metrics = useMemo(() => {
    let totalRev = 0;
    let totalHens = 0;
    let totalRoosters = 0;
    let totalKg = 0;
    let minRate = Infinity;
    let maxRate = -Infinity;

    let meatRev = 0;
    let meatKg = 0;
    let meatBirds = 0;
    let breedingRev = 0;
    let breedingBirds = 0;
    let totalCash = 0;
    let totalGpay = 0;

    filteredSales.forEach((s) => {
      const isBreeding = s.sale_type === 'breeding';
      const amt = Number(s.amount) || 0;
      const hens = Number(s.no_of_hens) || 0;
      const roosters = Number(s.no_of_roosters) || 0;
      const birds = hens + roosters;
      const kg = Number(s.kg) || 0;

      if (isBreeding) {
        breedingRev += amt;
        breedingBirds += birds;
      } else {
        meatRev += amt;
        meatKg += kg;
        meatBirds += birds;
      }

      if (s.payment_method === 'gpay') {
        totalGpay += amt;
      } else {
        totalCash += amt;
      }

      totalRev += amt;
      totalHens += hens;
      totalRoosters += roosters;
      totalKg += kg;

      if (kg > 0) {
        const rate = amt / kg;
        if (rate < minRate) minRate = rate;
        if (rate > maxRate) maxRate = rate;
      }
    });

    const totalBirds = totalHens + totalRoosters;
    const avgRatePerKg = totalKg > 0 ? totalRev / totalKg : 0;
    const avgWeightPerBird = totalBirds > 0 ? totalKg / totalBirds : 0;
    const avgTicket = filteredSales.length > 0 ? totalRev / filteredSales.length : 0;
    const avgRevPerBird = totalBirds > 0 ? totalRev / totalBirds : 0;

    // Active batch context metrics
    let batchPlacements = 0;
    let batchDeaths = 0;
    let batchTotalCost = 0;
    let isSingleBatch = selectedBatchFilter !== 'ALL';
    let currentBatchObj = null;

    if (isSingleBatch) {
      currentBatchObj = batches.find((b) => b.batch_no?.toString() === selectedBatchFilter.toString());
      if (currentBatchObj) {
        batchPlacements = Number(currentBatchObj.no_of_chicks) || 0;
        const chickBuy = Number(currentBatchObj.buying_price) || 0;
        const bExpenses = expenses
          .filter((e) => e.batch?.toString() === selectedBatchFilter.toString())
          .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        batchTotalCost = chickBuy + bExpenses;

        batchDeaths = mortalityLogs
          .filter((m) => m.batch?.toString() === selectedBatchFilter.toString())
          .reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);
      }
    } else {
      batchPlacements = batches.reduce((sum, b) => sum + (Number(b.no_of_chicks) || 0), 0);
      const totalChickCost = batches.reduce((sum, b) => sum + (Number(b.buying_price) || 0), 0);
      const totalBatchExp = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      batchTotalCost = totalChickCost + totalBatchExp;
      batchDeaths = mortalityLogs.reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);
    }

    const netSurvivors = Math.max(0, batchPlacements - batchDeaths);
    const liquidationRate = netSurvivors > 0 ? Math.min(100, (totalBirds / netSurvivors) * 100) : 0;
    const remainingBirds = Math.max(0, netSurvivors - totalBirds);

    // Unit Economics Bridge
    const costPerKg = totalKg > 0 ? batchTotalCost / totalKg : 0;
    const costPerBird = batchPlacements > 0 ? batchTotalCost / batchPlacements : 0;
    const marginSpreadPerKg = avgRatePerKg > 0 && costPerKg > 0 ? avgRatePerKg - costPerKg : 0;
    const grossProfit = totalRev - batchTotalCost;
    const grossMarginPct = totalRev > 0 ? (grossProfit / totalRev) * 100 : 0;

    const avgMeatRateKg = meatKg > 0 ? meatRev / meatKg : 0;
    const avgBreedingRateBird = breedingBirds > 0 ? breedingRev / breedingBirds : 0;

    return {
      meatRev,
      meatKg,
      meatBirds,
      breedingRev,
      breedingBirds,
      totalCash,
      totalGpay,
      avgMeatRateKg,
      avgBreedingRateBird,
      totalRev,
      totalBirds,
      totalHens,
      totalRoosters,
      totalKg,
      avgRatePerKg,
      avgWeightPerBird,
      avgTicket,
      avgRevPerBird,
      minRate: minRate === Infinity ? 0 : minRate,
      maxRate: maxRate === -Infinity ? 0 : maxRate,
      batchPlacements,
      batchDeaths,
      netSurvivors,
      liquidationRate,
      remainingBirds,
      batchTotalCost,
      costPerKg,
      costPerBird,
      marginSpreadPerKg,
      grossProfit,
      grossMarginPct,
      isSingleBatch,
      currentBatchObj
    };
  }, [filteredSales, selectedBatchFilter, batches, expenses, mortalityLogs]);

  // Analytics: Daily / Chronological Sales Flow Data for Bar Chart
  const salesTimelineData = useMemo(() => {
    const map = {};
    [...filteredSales]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((s) => {
        const d = s.date || 'Unknown';
        if (!map[d]) {
          map[d] = { date: d, amount: 0, kg: 0, birds: 0 };
        }
        const amt = Number(s.amount) || 0;
        const kg = Number(s.kg) || 0;
        const birds = (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0);

        map[d].amount += amt;
        map[d].kg += kg;
        map[d].birds += birds;
      });

    return Object.values(map).map((item) => ({
      ...item,
      ratePerKg: item.kg > 0 ? item.amount / item.kg : 0
    }));
  }, [filteredSales]);

  // Analytics: Top Buyer Concentration Ranking
  const topBuyers = useMemo(() => {
    const map = {};
    filteredSales.forEach((s) => {
      const c = s.customer;
      const cid = c?.customer_id || s.customer || 'walkin';
      const name = c?.customer_name || 'Walk-in Cash Buyer';
      const contact = c?.contact_number || '';

      if (!map[cid]) {
        map[cid] = {
          id: cid,
          name,
          contact,
          totalSpend: 0,
          totalKg: 0,
          totalBirds: 0,
          count: 0
        };
      }
      map[cid].totalSpend += Number(s.amount) || 0;
      map[cid].totalKg += Number(s.kg) || 0;
      map[cid].totalBirds += (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0);
      map[cid].count += 1;
    });

    return Object.values(map)
      .map((b) => ({
        ...b,
        avgRatePerKg: b.totalKg > 0 ? b.totalSpend / b.totalKg : 0,
        volumeShare: metrics.totalRev > 0 ? (b.totalSpend / metrics.totalRev) * 100 : 0
      }))
      .sort((a, b) => b.totalSpend - a.totalSpend);
  }, [filteredSales, metrics.totalRev]);

  // CSV Export Handler
  const handleExportCSV = () => {
    const dataToExport = sortedSales.map((s) => {
      const totalBirds = Number(s.no_of_hens) + Number(s.no_of_roosters);
      const kg = Number(s.kg) || 0;
      const amt = Number(s.amount) || 0;
      const rate = kg > 0 ? amt / kg : 0;
      const avgW = totalBirds > 0 ? kg / totalBirds : 0;

      const isBreeding = s.sale_type === 'breeding';
      const appliedRate = isBreeding
        ? (s.price_per_bird || (totalBirds > 0 ? amt / totalBirds : 0)).toFixed(2) + ' / bird'
        : (kg > 0 ? amt / kg : 0).toFixed(2) + ' / kg';

      return {
        'Invoice ID': `INV-${s.id.toString().padStart(4, '0')}`,
        Date: s.date,
        Category: isBreeding ? 'Breeding Stock' : 'Meat Purpose',
        'Payment Method': s.payment_method === 'gpay' ? 'GPay / UPI' : 'Cash',
        'Batch No': s.batch?.batch_no || s.batch,
        'Customer Name': s.customer?.customer_name || 'Walk-in Buyer',
        'Contact Number': s.customer?.contact_number || 'N/A',
        Hens: s.no_of_hens,
        Roosters: s.no_of_roosters,
        'Total Birds': totalBirds,
        'Live Weight (Kg)': kg > 0 ? kg.toFixed(2) : 'N/A',
        'Avg Weight Per Bird (Kg)': avgW.toFixed(2),
        'Applied Rate': appliedRate,
        'Total Realization (INR)': amt.toFixed(2)
      };
    });
    exportToCSV(`CoopOS_Sales_Report_${selectedBatchFilter}`, dataToExport);
  };

  return (
    <div className="space-y-5">
      {/* 1. Executive Header Command Bar */}
      <header className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
            🐔
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Farm Gate Commercial Sales & Off-Take Hub
              </h1>
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                Live Shed Register
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Live carcass meat weighing (₹/kg), breeding stock dispatch (₹/bird) & digital payment collection
            </p>
          </div>
        </div>

        {/* Workstation View Tabs & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main Navigation Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-700" />
              <span>Sales Ledger</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Market Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('economics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'economics'
                  ? 'bg-white text-slate-900 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-amber-700" />
              <span>Unit Economics</span>
            </button>
          </div>

          {/* Quick Print Register */}
          <button
            onClick={() => window.print()}
            title="Print sales register"
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print</span>
          </button>

          {/* Primary Action: Record New Sale */}
          <button
            onClick={() => openModal('sale')}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Record New Sale</span>
          </button>
        </div>
      </header>

      {/* 2. Interactive Per-Batch Sales Toggling Cards Rail */}
      <section className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <span>📦</span> Select Flock / Batch Scope:
            </span>
            <span className="text-xs text-slate-400 hidden sm:inline">
              (Click card to toggle sales, analytics & margins)
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Active Context:{' '}
            <strong className="text-emerald-700 font-bold">
              {selectedBatchFilter === 'ALL' ? '🌟 All Batches Combined' : `📦 Batch #${selectedBatchFilter}`}
            </strong>
          </span>
        </div>

        {/* Cards Rail Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {batchSalesCards.map((bCard) => {
            const isSelected = selectedBatchFilter.toString() === bCard.batch_no.toString();
            const isAll = bCard.batch_no === 'ALL';
            const liquidation = bCard.chicks > 0 ? ((bCard.totalBirdsSold / bCard.chicks) * 100).toFixed(1) : 0;

            return (
              <div
                key={bCard.batch_no}
                onClick={() => setSelectedBatchFilter(bCard.batch_no)}
                className={`relative rounded-2xl p-4 border-2 transition-all duration-150 cursor-pointer text-left select-none ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40 border-emerald-600 shadow-sm ring-2 ring-emerald-500/20 -translate-y-0.5'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Active Indicator Badge */}
                {isSelected && (
                  <div className="absolute top-3.5 right-3.5 flex items-center gap-1 bg-emerald-700 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-2xs">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Active</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{isAll ? '🌟' : '📦'}</span>
                  <div>
                    <h3 className="font-extrabold text-xs text-slate-900">
                      {isAll ? 'All Batches Combined' : `Batch #${bCard.batch_no}`}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {isAll ? `${bCard.chicks} total chicks placed` : `Placed: ${formatDate(bCard.date)}`}
                    </p>
                  </div>
                </div>

                {/* Sales Realization */}
                <div className="my-1.5">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                    Sales Realization
                  </div>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {formatCurrency(bCard.totalSales)}
                  </div>
                </div>

                {/* Payment Breakdown: Cash vs GPay */}
                <div className="grid grid-cols-2 gap-1.5 py-1 px-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] font-mono mb-2">
                  <div className="flex items-center gap-1 text-slate-700">
                    <span>💵</span>
                    <span className="font-bold">{formatCurrency(bCard.cashSales)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-blue-700">
                    <span>📱</span>
                    <span className="font-bold">{formatCurrency(bCard.gpaySales)}</span>
                  </div>
                </div>

                {/* Purpose Split: Meat vs Breeding */}
                <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                  <span className="text-rose-700 font-semibold">🥩 {formatCurrency(bCard.meatSales)}</span>
                  <span className="text-amber-700 font-semibold">🐣 {formatCurrency(bCard.breedingSales)}</span>
                </div>

                {/* Off-Take Liquidation Progress */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mb-1">
                    <span>Sold: <b>{formatNumber(bCard.totalBirdsSold)}</b> birds</span>
                    <span className="font-bold text-slate-700">{liquidation}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, liquidation)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Executive Poultry KPI Performance Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Total Gross Revenue & Payment Split */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Gross Realization (வருமானம்)</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold border border-emerald-100">
              {filteredSales.length} Invoices
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-emerald-800">
            {formatCurrency(metrics.totalRev)}
          </div>
          {/* Dual Payment Split */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <div className="flex justify-between text-[11px] font-mono">
              <span className="text-slate-600">💵 Cash: <b>{formatCurrency(metrics.totalCash)}</b></span>
              <span className="text-blue-700">📱 GPay: <b>{formatCurrency(metrics.totalGpay)}</b></span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-600 h-full"
                style={{
                  width: `${metrics.totalRev > 0 ? (metrics.totalCash / metrics.totalRev) * 100 : 50}%`
                }}
              />
              <div
                className="bg-blue-600 h-full"
                style={{
                  width: `${metrics.totalRev > 0 ? (metrics.totalGpay / metrics.totalRev) * 100 : 50}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Meat Purpose Off-Take */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Meat Purpose (இறைச்சி)</span>
            <span className="text-[10px] bg-rose-50 text-rose-800 px-2 py-0.5 rounded font-mono font-bold border border-rose-100">
              Live Biomass
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900">
              {metrics.avgMeatRateKg > 0 ? formatCurrency(metrics.avgMeatRateKg) : '₹0'}
            </span>
            <span className="text-xs font-semibold text-slate-400 font-mono">/ kg</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-mono text-slate-600">
            <span>Biomass: <b>{metrics.meatKg.toFixed(1)} kg</b></span>
            <span className="text-rose-700 font-bold">{formatCurrency(metrics.meatRev)}</span>
          </div>
        </div>

        {/* Metric 3: Breeding Stock Dispatch */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Breeding Stock (இனப்பெருக்கம்)</span>
            <span className="text-[10px] bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-mono font-bold border border-amber-100">
              Per Bird
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black font-mono text-slate-900">
              {metrics.avgBreedingRateBird > 0 ? formatCurrency(metrics.avgBreedingRateBird) : '₹0'}
            </span>
            <span className="text-xs font-semibold text-slate-400 font-mono">/ bird</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-mono text-slate-600">
            <span>Dispatched: <b>{formatNumber(metrics.breedingBirds)} birds</b></span>
            <span className="text-amber-800 font-bold">{formatCurrency(metrics.breedingRev)}</span>
          </div>
        </div>

        {/* Metric 4: Flock Inventory & Liquidation */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-1">
          <div className="flex justify-between items-center text-xs text-slate-500 font-semibold">
            <span>Flock Off-Take & Shed</span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-bold">
              Birds Count
            </span>
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {formatNumber(metrics.totalBirds)} Sold
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px] font-mono text-slate-600">
            {metrics.isSingleBatch ? (
              <>
                <span>In Shed: <b>{metrics.remainingBirds} birds</b></span>
                <span className="text-emerald-700 font-bold">{metrics.liquidationRate.toFixed(1)}% Cleared</span>
              </>
            ) : (
              <>
                <span>Across All Flocks</span>
                <span className="text-emerald-700 font-bold">{filteredSales.length} Invoices</span>
              </>
            )}
          </div>
        </div>
      </div>
{/* 4. Sub-Tab 1: MARKET ANALYTICS (Charts, Concentration & Mix) */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Timeline Chart: Daily Sales Revenue & Weight Off-take */}
          <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-emerald-700" />
                  <span>Daily Sales Realization & Live Biomass Off-Take</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Chronological revenue (INR) alongside total live weight marketed (Kg)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-emerald-700 inline-block" />
                  <span className="text-slate-700">Gross Realization (₹)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-sky-600 inline-block" />
                  <span className="text-slate-700">Live Weight (Kg)</span>
                </div>
              </div>
            </div>

            {salesTimelineData.length > 0 ? (
              <div className="h-64 sm:h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={salesTimelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => formatDate(val)}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <YAxis
                      yAxisId="left"
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tickFormatter={(v) => `${v}kg`}
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      stroke="#cbd5e1"
                    />
                    <Tooltip content={<SalesChartTooltip />} />
                    <Bar yAxisId="left" dataKey="amount" fill="#047857" radius={[4, 4, 0, 0]} maxBarSize={45} />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="kg"
                      stroke="#0284c7"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: '#0284c7' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                No chronological sales data available for this selection.
              </div>
            )}
          </div>

          {/* Grid: Buyer Concentration & Bird Gender Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Top Commercial Buyers Ranking (7 Cols) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-slate-700" />
                    <span>Commercial Buyer Concentration ({topBuyers.length})</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Off-take distribution ranked by purchasing volume & farm-gate spend
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-50">
                      <th className="py-2.5 px-3">Buyer Account</th>
                      <th className="py-2.5 px-3 text-right">Birds</th>
                      <th className="py-2.5 px-3 text-right">Weight (Kg)</th>
                      <th className="py-2.5 px-3 text-right">Avg Rate/Kg</th>
                      <th className="py-2.5 px-3 text-right">Total Spend</th>
                      <th className="py-2.5 px-3 text-right w-24">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {topBuyers.slice(0, 6).map((b, idx) => (
                      <tr
                        key={b.id}
                        onClick={() => setCustomerFilter(b.id === 'walkin' ? 'ALL' : b.id.toString())}
                        className="hover:bg-slate-50 transition cursor-pointer"
                        title="Click to filter ledger by this buyer"
                      >
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 block truncate max-w-[160px]">
                            {b.name}
                          </span>
                          {b.contact && (
                            <span className="text-[10px] text-slate-400 font-mono">{b.contact}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-800">
                          {formatNumber(b.totalBirds)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                          {b.totalKg.toFixed(1)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {formatCurrency(b.avgRatePerKg)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          {formatCurrency(b.totalSpend)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] font-mono font-semibold text-slate-600">
                              {b.volumeShare.toFixed(1)}%
                            </span>
                            <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-700 h-full rounded-full"
                                style={{ width: `${Math.min(100, b.volumeShare)}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right: Hen vs Rooster Commercial Balance (5 Cols) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4">
              <div className="border-b border-slate-200 pb-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-slate-700" />
                  <span>Flock Gender & Off-Take Split</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Commercial comparison between female hens and male roosters
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* Hens Card */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Female Hens Marketed
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono block">
                    {formatNumber(metrics.totalHens)}
                  </span>
                  <span className="text-xs font-mono text-slate-500 block mt-1">
                    {metrics.totalBirds > 0
                      ? `${((metrics.totalHens / metrics.totalBirds) * 100).toFixed(1)}% of birds`
                      : '0%'}
                  </span>
                </div>

                {/* Roosters Card */}
                <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Male Roosters Marketed
                  </span>
                  <span className="text-xl font-black text-slate-900 font-mono block">
                    {formatNumber(metrics.totalRoosters)}
                  </span>
                  <span className="text-xs font-mono text-slate-500 block mt-1">
                    {metrics.totalBirds > 0
                      ? `${((metrics.totalRoosters / metrics.totalBirds) * 100).toFixed(1)}% of birds`
                      : '0%'}
                  </span>
                </div>
              </div>

              {/* Progress bar comparing Hens vs Roosters */}
              <div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 mb-1">
                  <span>Hens ({metrics.totalHens})</span>
                  <span>Roosters ({metrics.totalRoosters})</span>
                </div>
                <div className="w-full bg-amber-500 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-700 h-full"
                    style={{
                      width: `${
                        metrics.totalBirds > 0 ? (metrics.totalHens / metrics.totalBirds) * 100 : 50
                      }%`
                    }}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                <span className="font-bold text-slate-800 block text-[11px]">
                  Farm Manager Off-Take Insight:
                </span>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Roosters typically attain target slaughter weight (2.2kg+) 7-10 days faster than hens. Timely partial culling of roosters lowers feed conversion ratio (FCR) and frees up shed space.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Sub-Tab 2: UNIT ECONOMICS & MARGIN BRIDGE */}
      {activeTab === 'economics' && (
        <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-xs font-bold">
                  {metrics.isSingleBatch ? `BATCH #${selectedBatchFilter}` : 'ALL BATCHES'}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Unit Economics, Production Cost & Realized Margin Spread
                </h3>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Financial bridge reconciling total farm inputs against live carcass weight sales
              </p>
            </div>
            {onNavigateToView && (
              <button
                type="button"
                onClick={() => onNavigateToView('expenses')}
                className="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Inspect Expense Drivers</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 3-Pillar Bridge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1: Cost of Goods (COGS) */}
            <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                Total Production Cost (செலவு)
              </span>
              <span className="text-2xl font-black text-slate-900 font-mono block">
                {formatCurrency(metrics.batchTotalCost)}
              </span>
              <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-rose-200 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cost / Kg Produced:</span>
                  <span className="font-bold">
                    {metrics.costPerKg > 0 ? formatCurrency(metrics.costPerKg) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cost / Bird Placed:</span>
                  <span className="font-bold">
                    {metrics.costPerBird > 0 ? formatCurrency(metrics.costPerBird) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Birds Placed:</span>
                  <span>{formatNumber(metrics.batchPlacements)} chicks</span>
                </div>
              </div>
            </div>

            {/* Pillar 2: Realized Sales Revenue */}
            <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Total Realization (வருமானம்)
              </span>
              <span className="text-2xl font-black text-emerald-700 font-mono block">
                {formatCurrency(metrics.totalRev)}
              </span>
              <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-emerald-200 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Realized Rate / Kg:</span>
                  <span className="font-bold text-emerald-800">
                    {metrics.avgRatePerKg > 0 ? formatCurrency(metrics.avgRatePerKg) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Realized Rate / Bird:</span>
                  <span className="font-bold">
                    {metrics.avgRevPerBird > 0 ? formatCurrency(metrics.avgRevPerBird) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sold Live Biomass:</span>
                  <span>{metrics.totalKg.toFixed(1)} kg</span>
                </div>
              </div>
            </div>

            {/* Pillar 3: Net Margin Spread */}
            <div
              className={`p-5 rounded-xl border space-y-3 ${
                metrics.grossProfit >= 0
                  ? 'border-emerald-300 bg-emerald-50/70'
                  : 'border-rose-300 bg-rose-50/70'
              }`}
            >
              <span
                className={`text-[10px] font-bold uppercase tracking-wider block ${
                  metrics.grossProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
                }`}
              >
                Net Batch Gross Profit
              </span>
              <span
                className={`text-2xl font-black font-mono block ${
                  metrics.grossProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'
                }`}
              >
                {metrics.grossProfit >= 0 ? '+' : ''}
                {formatCurrency(metrics.grossProfit)}
              </span>
              <div className="space-y-1.5 text-xs font-mono pt-2 border-t border-slate-200 text-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">Spread / Kg:</span>
                  <span
                    className={`font-bold ${
                      metrics.marginSpreadPerKg >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}
                  >
                    {metrics.marginSpreadPerKg >= 0 ? '+' : ''}
                    {metrics.marginSpreadPerKg > 0 ? formatCurrency(metrics.marginSpreadPerKg) : '₹0'}/kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gross Margin %:</span>
                  <span className="font-bold">
                    {metrics.grossMarginPct.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Break-Even Price:</span>
                  <span className="font-bold text-slate-900">
                    {metrics.costPerKg > 0 ? `${formatCurrency(metrics.costPerKg)}/kg` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Advisory Notes */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3 text-xs text-slate-600">
            <Info className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-900 block text-xs">
                Profit Maximization Formula for Farm Managers:
              </span>
              <p className="leading-relaxed text-[11px] text-slate-500">
                To maximize net margin spread, aim for an average bird weight of 1.95 - 2.10 kg at 45 to 55 days of rearing. Feed conversion efficiency decreases steeply after Day 55. If market live-bird rates dip below your break-even threshold ({metrics.costPerKg > 0 ? formatCurrency(metrics.costPerKg) : '₹120'}/kg), stagger off-take sales to retail meat buyers rather than wholesale distributors.
              </p>
            </div>
          </div>
        </div>
      )}

      
      {/* 6. Sub-Tab 3: MASTER SALES LEDGER TABLE & POS CONTROL */}
      {activeTab === 'ledger' && (
        <div className="space-y-3">
          {/* Unified Single Consolidated Toolbar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search buyer, phone, invoice, batch..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            {/* Segmented Filters & Presets */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Purpose Filter */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 font-semibold text-xs">
                <button
                  type="button"
                  onClick={() => setSaleTypeFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    saleTypeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Purpose
                </button>
                <button
                  type="button"
                  onClick={() => setSaleTypeFilter('meat')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    saleTypeFilter === 'meat' ? 'bg-white text-rose-900 font-bold shadow-xs' : 'text-slate-600 hover:text-rose-900'
                  }`}
                >
                  <span>🥩 Meat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSaleTypeFilter('breeding')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    saleTypeFilter === 'breeding' ? 'bg-white text-amber-900 font-bold shadow-xs' : 'text-slate-600 hover:text-amber-900'
                  }`}
                >
                  <span>🐣 Breeding</span>
                </button>
              </div>

              {/* Payment Filter */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 font-semibold text-xs">
                <button
                  type="button"
                  onClick={() => setPaymentFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    paymentFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Pay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilter('cash')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    paymentFilter === 'cash' ? 'bg-white text-emerald-900 font-bold shadow-xs' : 'text-slate-600 hover:text-emerald-900'
                  }`}
                >
                  <span>💵 Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentFilter('gpay')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    paymentFilter === 'gpay' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'text-slate-600 hover:text-blue-900'
                  }`}
                >
                  <span>📱 GPay</span>
                </button>
              </div>

              {/* Buyer Dropdown */}
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="bg-slate-50 text-xs font-semibold text-slate-700 px-2.5 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="ALL">All Buyers ({customers.length})</option>
                {customers.map((c) => {
                  const catInfo = CUSTOMER_CATEGORIES[c.category] || CUSTOMER_CATEGORIES.individual;
                  return (
                    <option key={c.customer_id} value={c.customer_id}>
                      {catInfo.icon} {c.customer_name} {c.sub_category ? `(${c.sub_category})` : ''}
                    </option>
                  );
                })}
              </select>

              {/* Date Presets */}
              <div className="hidden md:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 font-semibold text-xs">
                <button
                  type="button"
                  onClick={() => setDatePreset('ALL')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    datePreset === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('THIS_MONTH')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    datePreset === 'THIS_MONTH' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setDatePreset('30D')}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer ${
                    datePreset === '30D' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  30d
                </button>
              </div>

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                title="Download CSV"
                className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">CSV</span>
              </button>
            </div>
          </div>

          {/* High-Density Poultry Dispatch Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    <th className="py-3 px-4">Invoice / Date</th>
                    <th className="py-3 px-3">Purpose</th>
                    <th className="py-3 px-3">Pay Mode</th>
                    <th className="py-3 px-3">Flock #</th>
                    <th className="py-3 px-4">Customer Account</th>
                    <th className="py-3 px-3 text-center">Birds</th>
                    <th className="py-3 px-3 text-right">Biomass (Kg)</th>
                    <th className="py-3 px-3 text-right">Rate</th>
                    <th className="py-3 px-4 text-right">Realization</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedSales.length > 0 ? (
                    sortedSales.map((s) => {
                      const batchNo = s.batch?.batch_no || s.batch;
                      const customerName = s.customer?.customer_name || 'Walk-in Cash Buyer';
                      const contact = s.customer?.contact_number;
                      const totalBirds = Number(s.no_of_hens) + Number(s.no_of_roosters);
                      const kgNum = Number(s.kg) || 0;
                      const isBreeding = s.sale_type === 'breeding';
                      const isGpay = s.payment_method === 'gpay';

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition font-mono">
                          {/* Invoice / Date */}
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900 block">
                              #INV-{s.id.toString().padStart(4, '0')}
                            </span>
                            <span className="text-[11px] text-slate-400 font-sans">
                              {formatDate(s.date)}
                            </span>
                          </td>

                          {/* Purpose */}
                          <td className="py-3 px-3 font-sans">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isBreeding
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                            >
                              {isBreeding ? '🐣 Breed' : '🥩 Meat'}
                            </span>
                          </td>

                          {/* Pay Mode */}
                          <td className="py-3 px-3 font-sans">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                isGpay
                                  ? 'bg-blue-50 text-blue-800 border-blue-200'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}
                            >
                              {isGpay ? '📱 GPay' : '💵 Cash'}
                            </span>
                          </td>

                          {/* Flock # */}
                          <td className="py-3 px-3">
                            <button
                              type="button"
                              onClick={() => setSelectedBatchFilter(batchNo)}
                              title={`Focus solely on Batch #${batchNo}`}
                              className="px-2 py-0.5 rounded-md font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer text-[11px]"
                            >
                              #{batchNo}
                            </button>
                          </td>

                          {/* Customer */}
                          <td className="py-3 px-4 font-sans">
                            <span className="font-bold text-slate-900 block text-xs truncate max-w-[150px]">
                              {customerName}
                            </span>
                            {contact && (
                              <span className="text-[11px] text-slate-400 font-mono">{contact}</span>
                            )}
                          </td>

                          {/* Birds */}
                          <td className="py-3 px-3 text-center">
                            <span className="font-bold text-slate-900 block">
                              {formatNumber(totalBirds)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {s.no_of_hens}H • {s.no_of_roosters}R
                            </span>
                          </td>

                          {/* Weight */}
                          <td className="py-3 px-3 text-right font-bold text-slate-800">
                            {kgNum > 0 ? `${kgNum.toFixed(2)} kg` : '—'}
                          </td>

                          {/* Rate */}
                          <td className="py-3 px-3 text-right">
                            {isBreeding ? (
                              <span className="text-amber-800 font-bold">
                                {s.price_per_bird
                                  ? `${formatCurrency(s.price_per_bird)}/b`
                                  : totalBirds > 0
                                  ? `${formatCurrency(Number(s.amount) / totalBirds)}/b`
                                  : '—'}
                              </span>
                            ) : (
                              <span className="text-emerald-800 font-bold">
                                {kgNum > 0 ? `${formatCurrency(Number(s.amount) / kgNum)}/kg` : '—'}
                              </span>
                            )}
                          </td>

                          {/* Net Realization */}
                          <td className="py-3 px-4 text-right font-black text-emerald-800 text-sm">
                            +{formatCurrency(s.amount)}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => onPrintInvoice && onPrintInvoice(s)}
                                title="Print Tax Invoice"
                                className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => openModal('sale', s)}
                                title="Edit Sale"
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete Sale #INV-${s.id} (+₹${s.amount})?`)) {
                                    onDeleteSale(s.id);
                                  }
                                }}
                                title="Delete Record"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-sans">
                        No sales transactions found matching active filters.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Table Footer Summary */}
                {sortedSales.length > 0 && (
                  <tfoot>
                    <tr className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900 font-mono">
                      <td colSpan={5} className="py-3 px-4 font-sans text-xs text-slate-700">
                        Ledger Totals ({sortedSales.length} Invoices)
                      </td>
                      <td className="py-3 px-3 text-center">
                        {formatNumber(metrics.totalBirds)} birds
                      </td>
                      <td className="py-3 px-3 text-right">
                        {metrics.totalKg.toFixed(2)} kg
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {metrics.avgMeatRateKg > 0 ? `${formatCurrency(metrics.avgMeatRateKg)}/kg` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-800 text-sm">
                        {formatCurrency(metrics.totalRev)}
                      </td>
                      <td className="py-3 px-4" />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
