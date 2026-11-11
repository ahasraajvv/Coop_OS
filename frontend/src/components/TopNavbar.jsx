import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ShoppingCart,
  Receipt,
  Users,
  HeartPulse,
  Coins,
  ShieldPlus,
  FileSpreadsheet,
  LayoutDashboard,
  ChevronsUpDown,
  Plus,
  RefreshCw,
  Calendar,
  Layers,
  Search,
  LogOut,
  User,
  Shield,
  TrendingUp,
  X,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, translations } from '../utils';
import { trigger3LevelSync, fetchSyncStatus } from '../api';

export default function TopNavbar({
  currentView,
  setCurrentView,
  searchQuery,
  setSearchQuery,
  selectedBatchFilter = 'ALL',
  setSelectedBatchFilter,
  batches = [],
  batchMetrics = {},
  sales = [],
  expenses = [],
  mortalityLogs = [],
  customers = [],
  onRefresh,
  loading = false,
  openModal,
  lang = 'en',
  setLang,
  onLogout
}) {
  const t = translations[lang] || translations.en;
  const [batchMenuOpen, setBatchMenuOpen] = useState(false);
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await trigger3LevelSync(false);
      if (res && res.success) {
        setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Auto sync notice:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Run auto-sync automatically on app load
  useEffect(() => {
    handleSync();
  }, []);

  const batchMenuRef = useRef(null);
  const quickEntryRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (batchMenuRef.current && !batchMenuRef.current.contains(e.target)) {
        setBatchMenuOpen(false);
      }
      if (quickEntryRef.current && !quickEntryRef.current.contains(e.target)) {
        setQuickEntryOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine the active batch object
  const activeBatch = useMemo(() => {
    if (selectedBatchFilter && selectedBatchFilter !== 'ALL') {
      const found = batches.find(b => String(b.batch_no) === String(selectedBatchFilter));
      if (found) return found;
    }
    return batches.length > 0 ? batches[batches.length - 1] : null;
  }, [batches, selectedBatchFilter]);

  // Compute live active batch stats
  const activeBatchMeta = useMemo(() => {
    if (!activeBatch) {
      return {
        batchNo: 4,
        breed: 'Cobb 500 Commercial Broiler',
        startDate: '2026-10-12',
        initialChicks: 2500,
        liveChicks: 2420,
        survivalPercent: 96.8,
        dayAge: 28,
        status: 'Active'
      };
    }

    const bNo = activeBatch.batch_no;
    const initialChicks = Number(activeBatch.no_of_chicks) || 0;

    // Breed mapping heuristic
    const breeds = {
      4: 'Cobb 500 Commercial Broiler',
      3: 'Ross 308 Heavy Broiler',
      2: 'Country Nattu Kozhi (நாட்டுக்கோழி)',
      1: 'Giriraja Dual-Purpose Flock'
    };
    const breed = breeds[bNo] || `Commercial Flock #${bNo}`;

    // Calculate days elapsed from batch date
    let dayAge = 0;
    try {
      const bDate = new Date(activeBatch.date);
      const diffTime = Math.abs(new Date() - bDate);
      dayAge = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    } catch {
      dayAge = 28;
    }

    // Mortality
    const bDeaths = mortalityLogs
      .filter(m => m.batch === bNo || m.batch_id === bNo)
      .reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);

    // Sales
    const bSold = sales
      .filter(s => s.batch === bNo || s.batch_id === bNo)
      .reduce((sum, s) => sum + (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0), 0);

    const liveChicks = Math.max(0, initialChicks - bDeaths - bSold);
    const survivalPercent = initialChicks > 0 ? (((initialChicks - bDeaths) / initialChicks) * 100).toFixed(1) : '100.0';
    const status = (bNo === 4 || dayAge <= 45) ? `Day ${dayAge} • Active` : 'Completed';

    return {
      batchNo: bNo,
      breed,
      startDate: activeBatch.date,
      initialChicks,
      liveChicks,
      survivalPercent,
      dayAge,
      status
    };
  }, [activeBatch, mortalityLogs, sales]);

  // Overall KPI badges for the navigation tabs
  const tabKPIs = useMemo(() => {
    const isAll = selectedBatchFilter === 'ALL';
    const bFilter = isAll ? null : Number(selectedBatchFilter);

    // Filtered or lifetime sales
    const filteredSales = bFilter ? sales.filter(s => s.batch === bFilter || s.batch_id === bFilter) : sales;
    const totalSalesAmt = filteredSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

    // Filtered or lifetime expenses
    const filteredExp = bFilter ? expenses.filter(e => e.batch === bFilter || e.batch_id === bFilter) : expenses;
    const totalExpAmt = filteredExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

    // Capital recovery percent for selected batch
    let recoveryPercent = 0;
    if (activeBatch) {
      const bBuyingPrice = Number(activeBatch.buying_price) || 0;
      const bTotalCost = bBuyingPrice + totalExpAmt;
      recoveryPercent = bTotalCost > 0 ? (totalSalesAmt / bTotalCost) * 100 : 0;
    }

    // Mortality rate for active batch or all
    const bInitial = activeBatch ? Number(activeBatch.no_of_chicks) || 1 : 1;
    const filteredDeaths = (bFilter ? mortalityLogs.filter(m => m.batch === bFilter || m.batch_id === bFilter) : mortalityLogs)
      .reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);
    const mortPercent = bInitial > 0 ? ((filteredDeaths / bInitial) * 100).toFixed(1) : '0.0';

    return {
      salesDisplay: '₹ ' + (totalSalesAmt >= 100000 ? (totalSalesAmt / 100000).toFixed(2) + 'L' : totalSalesAmt.toLocaleString('en-IN')),
      expDisplay: '₹ ' + (totalExpAmt >= 100000 ? (totalExpAmt / 100000).toFixed(2) + 'L' : totalExpAmt.toLocaleString('en-IN')),
      recoveryDisplay: `${recoveryPercent.toFixed(0)}% Rec.`,
      customersCount: `${customers.length} Buyers`,
      mortalityDisplay: `${mortPercent}%`
    };
  }, [selectedBatchFilter, sales, expenses, activeBatch, mortalityLogs, customers]);

  return (
    <header className="sticky top-0 z-50 bg-[#090a0f]/95 backdrop-blur-xl border-b border-[#1e2230] shadow-2xl no-print">
      
      {/* ===================================================================== */}
      {/* TIER 1: BRAND + CENTER HERO BATCH BOX + GLOBAL QUICK CONTROLS         */}
      {/* ===================================================================== */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Left: Brand Identity */}
        <div 
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center gap-3 shrink-0 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-emerald-950/40 group-hover:scale-105 transition">
            🐔
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white leading-none">
                Coop<span className="text-emerald-400">OS</span>
              </span>
              <span className="text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                Workstation
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Commercial Poultry ERP</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* CENTER: THE BIG HERO BATCH BOX (Single Box, Clear, High-Contrast)   */}
        {/* =================================================================== */}
        <div className="relative flex-1 max-w-2xl" ref={batchMenuRef}>
          <button
            onClick={() => setBatchMenuOpen(!batchMenuOpen)}
            className="w-full group bg-[#11131a] hover:bg-[#161922] border border-[#1e2230] hover:border-emerald-500/40 rounded-xl px-4 py-2 transition-all duration-150 text-left flex items-center justify-between gap-4 cursor-pointer shadow-sm hover:shadow-md"
            title="Click to switch batch or view all flocks"
          >
            {/* Left side: Batch Badge + Metadata */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="h-9 px-2.5 rounded-lg bg-[#161922] border border-[#1e2230] group-hover:border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold text-xs shrink-0">
                {selectedBatchFilter === 'ALL' ? 'ALL' : `BATCH #${activeBatchMeta.batchNo}`}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-100 group-hover:text-emerald-300 transition-colors truncate">
                    {selectedBatchFilter === 'ALL' ? 'All Batches (Combined Farm Overview)' : activeBatchMeta.breed}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {activeBatchMeta.status}
                  </span>
                </div>

                {/* Second row of the single box */}
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    Started <strong className="text-slate-300 font-medium">{formatDate(activeBatchMeta.startDate)}</strong>
                  </span>
                  <span className="text-[#1e2230]">•</span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-500" />
                    Initial: <strong className="text-slate-200 font-mono">{formatNumber(activeBatchMeta.initialChicks)} Birds</strong>
                  </span>
                  <span className="text-[#1e2230]">•</span>
                  <span className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    Live: <strong className="text-emerald-400 font-mono">{formatNumber(activeBatchMeta.liveChicks)} ({activeBatchMeta.survivalPercent}%)</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Right side: Switch Tag & Chevron */}
            <div className="flex items-center gap-2 pl-3 border-l border-[#1e2230] shrink-0 text-slate-400 group-hover:text-slate-200">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 group-hover:text-emerald-400 hidden sm:inline">
                Switch
              </span>
              <ChevronsUpDown className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
            </div>
          </button>

          {/* Interactive Batch Popover */}
          {batchMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#11131a] border border-[#1e2230] rounded-xl shadow-2xl p-2.5 z-50 space-y-1">
              <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 border-b border-[#1e2230] mb-1">
                <span>SELECT FLOCK BATCH</span>
                <button
                  onClick={() => {
                    setBatchMenuOpen(false);
                    openModal('batch');
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> + New Batch
                </button>
              </div>

              {/* Batches List */}
              <div className="max-h-64 overflow-y-auto space-y-1">
                {batches.map((b) => {
                  const isSelected = String(selectedBatchFilter) === String(b.batch_no);
                  return (
                    <div
                      key={b.batch_no}
                      onClick={() => {
                        setSelectedBatchFilter(b.batch_no);
                        setBatchMenuOpen(false);
                      }}
                      className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#161922] border border-emerald-500/30 text-white'
                          : 'hover:bg-[#161922] text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-md font-mono font-bold text-xs flex items-center justify-center ${
                          isSelected ? 'bg-emerald-500/15 text-emerald-400' : 'bg-[#161922] text-slate-400'
                        }`}>
                          #{b.batch_no}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                            Batch #{b.batch_no}
                            {isSelected && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-medium">Selected</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {formatDate(b.date)} • {formatNumber(b.no_of_chicks)} Chicks Initial
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold text-slate-200">
                          {formatCurrency(b.buying_price)}
                        </div>
                        <div className="text-[10px] text-slate-500">Outlay</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All Batches Combined option */}
              <div className="pt-1 border-t border-[#1e2230]">
                <button
                  onClick={() => {
                    setSelectedBatchFilter('ALL');
                    setBatchMenuOpen(false);
                  }}
                  className={`w-full p-2 rounded-lg text-center text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                    selectedBatchFilter === 'ALL'
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#161922]'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  View All Batches Combined (Lifetime Workstation)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* =================================================================== */}
        {/* RIGHT ZONE: + QUICK ENTRY, SEARCH, LANGUAGE, USER                  */}
        {/* =================================================================== */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* Quick Entry Dropdown */}
          <div className="relative" ref={quickEntryRef}>
            <button
              onClick={() => setQuickEntryOpen(!quickEntryOpen)}
              className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs transition duration-150 flex items-center gap-2 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">+ New Entry</span>
            </button>

            {quickEntryOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#11131a] border border-[#1e2230] rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                <button
                  onClick={() => { setQuickEntryOpen(false); openModal('sale'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-[#161922] hover:text-emerald-400 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Commercial Sale (விற்பனை)</span>
                </button>
                <button
                  onClick={() => { setQuickEntryOpen(false); openModal('expense'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-[#161922] hover:text-amber-400 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5 text-amber-400" />
                  <span>Record Expense (செலவு)</span>
                </button>
                <button
                  onClick={() => { setQuickEntryOpen(false); openModal('mortality'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-[#161922] hover:text-rose-400 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <HeartPulse className="w-3.5 h-3.5 text-rose-400" />
                  <span>Log Mortality (இறப்பு)</span>
                </button>
                <button
                  onClick={() => { setQuickEntryOpen(false); openModal('customer'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-[#161922] hover:text-cyan-400 font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Add Customer (வாடிக்கையாளர்)</span>
                </button>
                <div className="h-px bg-[#1e2230] my-1"></div>
                <button
                  onClick={() => { setQuickEntryOpen(false); openModal('batch'); }}
                  className="w-full text-left px-3 py-2 rounded-lg text-slate-200 hover:bg-[#161922] hover:text-white font-medium flex items-center gap-2 transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>New Flock Batch (தொகுதி)</span>
                </button>
              </div>
            )}
          </div>

          {/* Global Search Input or Toggle */}
          <div className="relative">
            {showSearchInput ? (
              <div className="flex items-center bg-[#11131a] border border-[#1e2230] rounded-lg px-2.5 h-9">
                <Search className="w-3.5 h-3.5 text-slate-400 mr-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search orders, buyers..."
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-36 sm:w-48"
                  autoFocus
                />
                <button
                  onClick={() => { setSearchQuery(''); setShowSearchInput(false); }}
                  className="text-slate-500 hover:text-white ml-1 text-xs"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowSearchInput(true)}
                title="Search (Ctrl+K)"
                className="h-9 w-9 rounded-lg bg-[#11131a] hover:bg-[#161922] border border-[#1e2230] text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <Search className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* 3-Level Auto Sync Button & Indicator */}
          <button
            onClick={handleSync}
            disabled={syncing}
            title={lastSyncTime ? `3-Level Sync (Cloud + Local + Vault). Last synced at ${lastSyncTime}` : "3-Level Auto Sync (Cloud + Local + Vault)"}
            className={`h-9 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
              syncing
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-[#11131a] hover:bg-[#161922] border-[#1e2230] text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Cloud className={`w-3.5 h-3.5 ${syncing ? 'animate-bounce text-amber-400' : 'text-emerald-400'}`} />
            <span className="hidden md:inline font-mono text-[11px]">
              {syncing ? 'Syncing...' : 'Auto Sync'}
            </span>
            <span className={`w-2 h-2 rounded-full shrink-0 ${syncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
          </button>

          {/* Refresh Action */}
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh Data"
            className="h-9 w-9 rounded-lg bg-[#11131a] hover:bg-[#161922] border border-[#1e2230] text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>

          {/* Bilingual Language Pill */}
          <div className="h-9 bg-[#11131a] border border-[#1e2230] rounded-lg p-0.5 flex items-center">
            <button
              onClick={() => setLang && setLang('en')}
              className={`px-2 h-full rounded text-[11px] font-bold transition ${
                lang === 'en' ? 'bg-[#1e2230] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang && setLang('ta')}
              className={`px-2 h-full rounded text-[11px] font-bold transition ${
                lang === 'ta' ? 'bg-[#1e2230] text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>

          {/* User Profile Avatar with Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="h-9 w-9 rounded-lg bg-[#161922] border border-[#1e2230] hover:border-slate-500 flex items-center justify-center text-xs font-bold text-slate-200 transition cursor-pointer"
            >
              AR
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#11131a] border border-[#1e2230] rounded-xl shadow-2xl p-2 z-50 text-xs space-y-1">
                <div className="px-2 py-1.5 border-b border-[#1e2230]">
                  <div className="font-bold text-white">Ahas Raaj</div>
                  <div className="text-[10px] text-slate-400">admin@coopos.internal</div>
                </div>
                <button
                  onClick={() => { setUserMenuOpen(false); setCurrentView('batches'); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-slate-300 hover:bg-[#161922] flex items-center gap-2"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Flock Batches Manager</span>
                </button>
                <button
                  onClick={() => { setUserMenuOpen(false); onLogout && onLogout(); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* TIER 2: LINEAR-STYLE HORIZONTAL MODULE NAVIGATION TABS                */}
      {/* ===================================================================== */}
      <div className="border-t border-[#1e2230] bg-[#11131a]/60">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 flex items-center gap-6 sm:gap-8 overflow-x-auto">
          
          {/* Tab 1: Commercial Sales */}
          <button
            onClick={() => setCurrentView('sales')}
            className={`py-3 text-xs flex items-center gap-2 cursor-pointer transition relative shrink-0 ${
              currentView === 'sales'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Sales &amp; Orders</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e2230] text-slate-300">
              {tabKPIs.salesDisplay}
            </span>
            {currentView === 'sales' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_rgba(16,185,129,0.5)]"></span>
            )}
          </button>

          {/* Tab 2: Expenses & Feed */}
          <button
            onClick={() => setCurrentView('expenses')}
            className={`py-3 text-xs flex items-center gap-2 cursor-pointer transition relative shrink-0 ${
              currentView === 'expenses'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Expenses &amp; Feed</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e2230] text-slate-400">
              {tabKPIs.expDisplay}
            </span>
            {currentView === 'expenses' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_rgba(16,185,129,0.5)]"></span>
            )}
          </button>

          {/* Tab 3: Reinvestment Engine (Core as requested!) */}
          <button
            onClick={() => setCurrentView('reinvestment')}
            className={`py-3 text-xs flex items-center gap-2 cursor-pointer transition relative shrink-0 ${
              currentView === 'reinvestment'
                ? 'text-emerald-400 font-semibold'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <Coins className="w-4 h-4 text-amber-400" />
            <span>Reinvestment Engine</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
              {tabKPIs.recoveryDisplay}
            </span>
            {currentView === 'reinvestment' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_rgba(16,185,129,0.5)]"></span>
            )}
          </button>

          {/* Tab 4: Customer CRM */}
          <button
            onClick={() => setCurrentView('customers')}
            className={`py-3 text-xs flex items-center gap-2 cursor-pointer transition relative shrink-0 ${
              currentView === 'customers'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customer CRM</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e2230] text-slate-400">
              {tabKPIs.customersCount}
            </span>
            {currentView === 'customers' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_rgba(16,185,129,0.5)]"></span>
            )}
          </button>

          {/* Tab 5: Mortality & Health */}
          <button
            onClick={() => setCurrentView('mortality')}
            className={`py-3 text-xs flex items-center gap-2 cursor-pointer transition relative shrink-0 ${
              currentView === 'mortality'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Mortality Rate</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1e2230] text-slate-400">
              {tabKPIs.mortalityDisplay}
            </span>
            {currentView === 'mortality' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_rgba(16,185,129,0.5)]"></span>
            )}
          </button>

          <div className="h-4 w-px bg-[#1e2230] my-auto"></div>

          {/* Tab 6: Vaccinations */}
          <button
            onClick={() => setCurrentView('vaccinations')}
            className={`py-3 text-xs flex items-center gap-2 cursor-pointer transition relative shrink-0 ${
              currentView === 'vaccinations'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldPlus className="w-4 h-4" />
            <span>Vaccinations</span>
            {currentView === 'vaccinations' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_rgba(16,185,129,0.5)]"></span>
            )}
          </button>

          {/* Tab 7: Financial Reports */}
          <button
            onClick={() => setCurrentView('reports')}
            className={`py-3 text-xs flex items-center gap-2 cursor-pointer transition relative shrink-0 ${
              currentView === 'reports'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Financial Reports</span>
            {currentView === 'reports' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_rgba(16,185,129,0.5)]"></span>
            )}
          </button>

          {/* Tab 8: Dashboard */}
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`py-3 text-xs flex items-center gap-2 cursor-pointer transition relative shrink-0 ${
              currentView === 'dashboard'
                ? 'text-emerald-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
            {currentView === 'dashboard' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 shadow-[0_-1px_6px_rgba(16,185,129,0.5)]"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}