import React, { useState, useMemo } from 'react';
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  ArrowRight,
  Wallet,
  Sparkles,
  RefreshCw,
  Percent,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Calendar,
  DollarSign
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../utils';

export default function ReinvestmentView({
  batches = [],
  sales = [],
  expenses = [],
  mortalityLogs = [],
  selectedBatchFilter = 'ALL',
  setSelectedBatchFilter,
  openModal,
  lang = 'en'
}) {
  // Local active batch selection if not controlled externally
  const [activeBatchNo, setActiveBatchNo] = useState(() => {
    if (selectedBatchFilter && selectedBatchFilter !== 'ALL') {
      return Number(selectedBatchFilter);
    }
    return batches.length > 0 ? batches[batches.length - 1].batch_no : 4;
  });

  // Target next flock parameters
  const [nextChickCount, setNextChickCount] = useState(2500);
  const [projectedChickRate, setProjectedChickRate] = useState(38);
  const [projectedFeedCostPerBird, setProjectedFeedCostPerBird] = useState(85);

  // Pricing simulator state
  const [simPricePerBird, setSimPricePerBird] = useState(295);
  const [simMarginPercent, setSimMarginPercent] = useState(35);

  // Find active batch object
  const currentBatch = useMemo(() => {
    return batches.find(b => b.batch_no === activeBatchNo) || batches[batches.length - 1] || null;
  }, [batches, activeBatchNo]);

  // Compute stats for current batch
  const batchStats = useMemo(() => {
    if (!currentBatch) {
      return {
        buyingPrice: 0,
        feedExpenses: 0,
        totalCost: 0,
        salesRevenue: 0,
        birdsSold: 0,
        kgSold: 0,
        deaths: 0,
        initialChicks: 0,
        liveChicks: 0,
        netProfit: 0,
        recoveryPercent: 0,
        isProfitable: false,
        remainingToRecover: 0
      };
    }

    const bNo = currentBatch.batch_no;
    const buyingPrice = Number(currentBatch.buying_price) || 0;
    const initialChicks = Number(currentBatch.no_of_chicks) || 0;

    // Expenses for this batch
    const batchExp = expenses.filter(e => e.batch === bNo || e.batch_id === bNo);
    const feedExpenses = batchExp.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalCost = buyingPrice + feedExpenses;

    // Sales for this batch
    const batchSales = sales.filter(s => s.batch === bNo || s.batch_id === bNo);
    const salesRevenue = batchSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const birdsSold = batchSales.reduce((sum, s) => sum + (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0), 0);
    const kgSold = batchSales.reduce((sum, s) => sum + (Number(s.kg) || 0), 0);

    // Mortality for this batch
    const batchMort = mortalityLogs.filter(m => m.batch === bNo || m.batch_id === bNo);
    const deaths = batchMort.reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);
    const liveChicks = Math.max(0, initialChicks - deaths - birdsSold);

    const netProfit = salesRevenue - totalCost;
    const recoveryPercent = totalCost > 0 ? (salesRevenue / totalCost) * 100 : 0;
    const isProfitable = netProfit > 0;
    const remainingToRecover = Math.max(0, totalCost - salesRevenue);

    return {
      buyingPrice,
      feedExpenses,
      totalCost,
      salesRevenue,
      birdsSold,
      kgSold,
      deaths,
      initialChicks,
      liveChicks,
      netProfit,
      recoveryPercent,
      isProfitable,
      remainingToRecover
    };
  }, [currentBatch, expenses, sales, mortalityLogs]);

  // Reinvestment allocations
  const reinvestmentAllocation = useMemo(() => {
    const nextChicksCost = nextChickCount * projectedChickRate;
    const nextFeedReserve = nextChickCount * projectedFeedCostPerBird;
    const totalReinvestmentBudgetNeeded = nextChicksCost + nextFeedReserve;

    const availableProfit = Math.max(0, batchStats.netProfit);
    const fundCoveredFromProfit = Math.min(availableProfit, totalReinvestmentBudgetNeeded);
    const ownerWithdrawableSurplus = Math.max(0, availableProfit - totalReinvestmentBudgetNeeded);
    const externalCapitalNeeded = Math.max(0, totalReinvestmentBudgetNeeded - availableProfit);

    return {
      nextChicksCost,
      nextFeedReserve,
      totalReinvestmentBudgetNeeded,
      fundCoveredFromProfit,
      ownerWithdrawableSurplus,
      externalCapitalNeeded
    };
  }, [nextChickCount, projectedChickRate, projectedFeedCostPerBird, batchStats.netProfit]);

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & BATCH PRESET SELECTOR */}
      <div className="bg-[#11131a] border border-[#1e2230] rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg shadow-black/40">
            <Coins className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Capital Recovery &amp; Reinvestment Engine
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Flock ROI Workstation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated capital recoup tracking, pure profit threshold detection, and next-flock reinvestment reserve.
            </p>
          </div>
        </div>

        {/* Batch Selector Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400">Flock:</span>
          {batches.map(b => (
            <button
              key={b.batch_no}
              onClick={() => {
                setActiveBatchNo(b.batch_no);
                if (setSelectedBatchFilter) setSelectedBatchFilter(b.batch_no);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeBatchNo === b.batch_no
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40 border border-emerald-500'
                  : 'bg-[#161922] text-slate-400 hover:text-slate-200 border border-[#1e2230]'
              }`}
            >
              <span>Batch #{b.batch_no}</span>
              {b.batch_no === 4 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. THE THREE FINANCIAL PILLARS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* PILLAR 1: TOTAL CAPITAL OUTLAY */}
        <div className="bg-[#11131a] rounded-2xl p-5 border border-[#1e2230] space-y-3">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Wallet className="w-4 h-4 text-rose-400" />
              <span>Total Cost Invested (மொத்த செலவு)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
              Full Outlay
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-rose-400">
              {formatCurrency(batchStats.totalCost)}
            </span>
            <span className="text-xs font-mono text-slate-500">total spent</span>
          </div>

          <div className="pt-3 border-t border-[#1e2230] grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="text-slate-400">
              Chicks Buying: <strong className="text-slate-200">{formatCurrency(batchStats.buyingPrice)}</strong>
            </div>
            <div className="text-slate-400 text-right">
              Feed &amp; Meds: <strong className="text-slate-200">{formatCurrency(batchStats.feedExpenses)}</strong>
            </div>
          </div>
        </div>

        {/* PILLAR 2: GROSS SALES RETRIEVED */}
        <div className="bg-[#11131a] rounded-2xl p-5 border border-[#1e2230] space-y-3">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Gross Sales Retrieved (விற்பனை வரவு)</span>
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
              Live Cash
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {formatCurrency(batchStats.salesRevenue)}
            </span>
            <span className="text-xs font-mono text-slate-500">retrieved</span>
          </div>

          <div className="pt-3 border-t border-[#1e2230] grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="text-slate-400">
              Birds Sold: <strong className="text-slate-200">{formatNumber(batchStats.birdsSold)} birds</strong>
            </div>
            <div className="text-slate-400 text-right">
              Weight: <strong className="text-slate-200">{formatNumber(batchStats.kgSold)} Kg</strong>
            </div>
          </div>
        </div>

        {/* PILLAR 3: NET PROFIT / LOSS */}
        <div className="bg-[#11131a] rounded-2xl p-5 border border-[#1e2230] space-y-3">
          <div className="flex justify-between items-center text-slate-400 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Pure Net Profit / Status (இலாப நிலை)</span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
              batchStats.isProfitable
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {batchStats.isProfitable ? 'Pure Profit Zone' : 'Recovery Phase'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono ${
              batchStats.isProfitable ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {batchStats.isProfitable ? '+' : ''}{formatCurrency(batchStats.netProfit)}
            </span>
            <span className="text-xs font-mono text-slate-500">
              {batchStats.isProfitable ? 'net gain' : 'remaining to recoup'}
            </span>
          </div>

          <div className="pt-3 border-t border-[#1e2230] grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="text-slate-400">
              In Shed: <strong className="text-amber-400">{formatNumber(batchStats.liveChicks)} Live</strong>
            </div>
            <div className="text-slate-400 text-right">
              Recovery: <strong className="text-emerald-400">{batchStats.recoveryPercent.toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CAPITAL RECOVERY VISUAL PROGRESS GAUGE */}
      <div className="bg-[#11131a] border border-[#1e2230] rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Capital Recovery Progress Bar</span>
              <span className="text-xs font-mono text-slate-400 font-normal">
                (Break-even Threshold: 100%)
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {batchStats.isProfitable
                ? `🎉 Full capital outlay of ${formatCurrency(batchStats.totalCost)} has been completely recovered! Every subsequent rupee is 100% pure profit.`
                : `Recovered ${formatCurrency(batchStats.salesRevenue)} of ${formatCurrency(batchStats.totalCost)}. Need ${formatCurrency(batchStats.remainingToRecover)} more to break even.`
              }
            </p>
          </div>

          <div className="text-right">
            <span className={`text-xl font-black font-mono ${
              batchStats.isProfitable ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {batchStats.recoveryPercent.toFixed(1)}%
            </span>
            <div className="text-[10px] text-slate-500 font-mono">RECOVERY INDEX</div>
          </div>
        </div>

        {/* The Dual Phase Bar */}
        <div className="relative w-full h-6 bg-[#090a0f] rounded-xl overflow-hidden border border-[#1e2230] p-0.5">
          {/* Recovery fill */}
          <div
            className={`h-full rounded-lg transition-all duration-500 ${
              batchStats.isProfitable
                ? 'bg-gradient-to-r from-emerald-600 to-teal-400'
                : 'bg-gradient-to-r from-amber-600 to-emerald-500'
            }`}
            style={{ width: `${Math.min(100, batchStats.recoveryPercent)}%` }}
          ></div>
        </div>

        {/* Milestone Labels */}
        <div className="flex justify-between text-[11px] font-mono text-slate-500">
          <span>₹ 0 (Day 1 Outlay)</span>
          <span className="text-amber-400 font-semibold">100% Break-Even ({formatCurrency(batchStats.totalCost)})</span>
          <span className="text-emerald-400 font-bold">Pure Profit Zone (&gt; 100%)</span>
        </div>
      </div>

      {/* 4. NEXT FLOCK REINVESTMENT RESERVE PLANNER */}
      <div className="bg-[#11131a] border border-[#1e2230] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-[#1e2230] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Next Flock Reinvestment Reserve Engine</h3>
              <p className="text-xs text-slate-400">
                Plan working capital for Batch #{activeBatchNo + 1} without depleting farm liquidity.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-slate-400">Target Flock:</span>
            <div className="text-sm font-bold font-mono text-emerald-400">Batch #{activeBatchNo + 1}</div>
          </div>
        </div>

        {/* Interactive Parameter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#161922] p-4 rounded-xl border border-[#1e2230]">
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Next Flock Size (Chicks)
            </label>
            <input
              type="number"
              value={nextChickCount}
              onChange={(e) => setNextChickCount(Math.max(100, Number(e.target.value) || 0))}
              className="w-full bg-[#090a0f] border border-[#1e2230] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Expected day-old chicks count</span>
          </div>

          <div className="bg-[#161922] p-4 rounded-xl border border-[#1e2230]">
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Projected Chick Rate (₹ / Chick)
            </label>
            <input
              type="number"
              value={projectedChickRate}
              onChange={(e) => setProjectedChickRate(Math.max(1, Number(e.target.value) || 0))}
              className="w-full bg-[#090a0f] border border-[#1e2230] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Hatchery acquisition rate</span>
          </div>

          <div className="bg-[#161922] p-4 rounded-xl border border-[#1e2230]">
            <label className="text-[11px] font-medium text-slate-400 block mb-1.5">
              Feed Reserve Buffer (₹ / Bird)
            </label>
            <input
              type="number"
              value={projectedFeedCostPerBird}
              onChange={(e) => setProjectedFeedCostPerBird(Math.max(10, Number(e.target.value) || 0))}
              className="w-full bg-[#090a0f] border border-[#1e2230] rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">Starter &amp; grower feed reserve</span>
          </div>
        </div>

        {/* Calculated Budget Allocation Split */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-[#161922] border border-[#1e2230]">
            <div className="text-[11px] text-slate-400 font-semibold mb-1">
              1. Day-Old Chick Outlay
            </div>
            <div className="text-lg font-mono font-bold text-white">
              {formatCurrency(reinvestmentAllocation.nextChicksCost)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              {formatNumber(nextChickCount)} chicks @ ₹{projectedChickRate}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#161922] border border-[#1e2230]">
            <div className="text-[11px] text-slate-400 font-semibold mb-1">
              2. Initial Feed &amp; Vaccines Fund
            </div>
            <div className="text-lg font-mono font-bold text-white">
              {formatCurrency(reinvestmentAllocation.nextFeedReserve)}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">
              Feed buffer @ ₹{projectedFeedCostPerBird}/bird
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
            <div className="text-[11px] text-emerald-400 font-semibold mb-1">
              3. Owner Withdrawable Dividend
            </div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              {formatCurrency(reinvestmentAllocation.ownerWithdrawableSurplus)}
            </div>
            <div className="text-[10px] text-emerald-300 mt-1">
              Pure surplus after full flock reserve
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}