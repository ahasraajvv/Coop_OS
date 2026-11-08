import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  ArrowRight,
  Tag,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Coins
} from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils';

export default function BatchCalculatorView({
  batches = [],
  expenses = [],
  mortalityLogs = [],
  sales = [],
  lang = 'en'
}) {
  // Selection state for real batches: map of batch_no -> boolean
  const [selectedRealBatches, setSelectedRealBatches] = useState(() => {
    const initial = {};
    batches.forEach((b, idx) => {
      // Select latest batches by default
      initial[b.batch_no] = idx >= batches.length - 2;
    });
    return initial;
  });

  // Custom user-added hypothetical/external batches
  const [customBatches, setCustomBatches] = useState([]);

  // Modal for adding a custom batch
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: '',
    totalCost: '',
    birdCount: ''
  });

  // Count divisor mode: 'alive' | 'initial'
  const [countMode, setCountMode] = useState('alive');

  // UNIFIED 3-WAY SELLING PRICING ENGINE STATE
  // Synchronized inputs: Price per Bird <-> Margin % <-> Total Deal Revenue
  const [sellPricePerBird, setSellPricePerBird] = useState('423');
  const [profitMarginPercent, setProfitMarginPercent] = useState('60');
  const [totalDealRevenue, setTotalDealRevenue] = useState('176814');

  // Track if user has initialized pricing
  const [hasInitializedPricing, setHasInitializedPricing] = useState(false);

  // Compute stats for all real batches from backend
  const realBatchStats = useMemo(() => {
    return batches.map((b) => {
      const bNo = Number(b.batch_no);
      const buyingPrice = Number(b.buying_price) || 0;
      const initialCount = Number(b.no_of_chicks) || 0;

      // Expenses for this batch
      const batchExpenses = expenses.filter((e) => Number(e.batch) === bNo);
      const operationalExpense = batchExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      const totalCost = buyingPrice + operationalExpense;

      // Deaths
      const batchDeaths = mortalityLogs.filter((m) => Number(m.batch) === bNo);
      const totalDeaths = batchDeaths.reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);

      // Sold
      const batchSales = sales.filter((s) => {
        const sBatch = Number(s.batch?.batch_no || s.batch);
        return sBatch === bNo;
      });
      const totalSold = batchSales.reduce(
        (sum, s) => sum + (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0),
        0
      );

      const aliveCount = Math.max(0, initialCount - totalDeaths - totalSold);
      const unitCost = aliveCount > 0 ? totalCost / aliveCount : initialCount > 0 ? totalCost / initialCount : 0;

      return {
        id: `real_${b.batch_no}`,
        batch_no: b.batch_no,
        name: `Batch #${b.batch_no}`,
        date: b.date,
        buyingPrice,
        operationalExpense,
        totalCost,
        initialCount,
        totalDeaths,
        totalSold,
        aliveCount,
        unitCost,
        isCustom: false
      };
    });
  }, [batches, expenses, mortalityLogs, sales]);

  // Combine real batches + custom batches into active calculation list
  const allBatchesForCalc = useMemo(() => {
    const list = [];

    // Real batches
    realBatchStats.forEach((b) => {
      const isChecked = selectedRealBatches[b.batch_no] ?? true;
      list.push({
        ...b,
        checked: isChecked
      });
    });

    // Custom batches
    customBatches.forEach((cb) => {
      list.push(cb);
    });

    return list;
  }, [realBatchStats, selectedRealBatches, customBatches]);

  // Handle toggling real batch
  const handleToggleRealBatch = (batchNo) => {
    setSelectedRealBatches((prev) => ({
      ...prev,
      [batchNo]: !prev[batchNo]
    }));
  };

  // Handle toggling custom batch
  const handleToggleCustomBatch = (id) => {
    setCustomBatches((prev) =>
      prev.map((cb) => (cb.id === id ? { ...cb, checked: !cb.checked } : cb))
    );
  };

  // Delete custom batch
  const handleDeleteCustomBatch = (id) => {
    setCustomBatches((prev) => prev.filter((cb) => cb.id !== id));
  };

  // Select all / Deselect all
  const handleSelectAll = (val) => {
    const nextReal = {};
    batches.forEach((b) => {
      nextReal[b.batch_no] = val;
    });
    setSelectedRealBatches(nextReal);
    setCustomBatches((prev) => prev.map((cb) => ({ ...cb, checked: val })));
  };

  // Add custom batch submit
  const handleAddCustomBatch = (e) => {
    e.preventDefault();
    const name = customForm.name.trim() || `Custom Batch #${customBatches.length + 1}`;
    const cost = Math.max(0, Number(customForm.totalCost) || 0);
    const count = Math.max(1, Number(customForm.birdCount) || 1);

    const newCustom = {
      id: `custom_${Date.now()}`,
      name,
      totalCost: cost,
      initialCount: count,
      aliveCount: count,
      totalDeaths: 0,
      totalSold: 0,
      unitCost: cost / count,
      isCustom: true,
      checked: true
    };

    setCustomBatches((prev) => [...prev, newCustom]);
    setCustomForm({ name: '', totalCost: '', birdCount: '' });
    setShowAddCustomModal(false);
  };

  // COMBINED BASE COST:
  // Adds combined total costs and divides by combined count: Sum(Total Cost) ÷ Sum(Bird Count)
  const baseMetrics = useMemo(() => {
    const selected = allBatchesForCalc.filter((b) => b.checked);

    let combinedCost = 0;
    let combinedCount = 0;

    selected.forEach((b) => {
      combinedCost += b.totalCost;
      combinedCount += countMode === 'alive' ? b.aliveCount : b.initialCount;
    });

    const effectiveCount = Math.max(1, combinedCount);
    const unitBaseCost = combinedCount > 0 ? combinedCost / effectiveCount : 0;

    return {
      selectedCount: selected.length,
      combinedCost,
      combinedCount,
      unitBaseCost
    };
  }, [allBatchesForCalc, countMode]);

  // Initial pricing sync once base cost is loaded
  useEffect(() => {
    if (baseMetrics.unitBaseCost > 0 && !hasInitializedPricing) {
      const defaultSell = Math.round(baseMetrics.unitBaseCost * 1.6);
      const defaultRev = Math.round(defaultSell * baseMetrics.combinedCount);
      setSellPricePerBird(defaultSell.toString());
      setProfitMarginPercent('60');
      setTotalDealRevenue(defaultRev.toString());
      setHasInitializedPricing(true);
    }
  }, [baseMetrics.unitBaseCost, baseMetrics.combinedCount, hasInitializedPricing]);

  // -------------------------------------------------------------
  // UNIFIED 3-WAY SYNCHRONIZED PRICING HANDLERS
  // When user changes ANY input, the other two update instantly!
  // -------------------------------------------------------------

  // 1. When user enters Selling Price Per Bird
  const handleSellPricePerBirdChange = (val) => {
    setSellPricePerBird(val);
    const priceNum = Number(val) || 0;
    const baseCost = baseMetrics.unitBaseCost;
    const count = baseMetrics.combinedCount;

    // Calculate Margin %: ((SellPrice - BaseCost) / BaseCost) * 100
    if (baseCost > 0) {
      const margin = ((priceNum - baseCost) / baseCost) * 100;
      setProfitMarginPercent(margin.toFixed(1));
    }
    // Calculate Total Revenue: Price * Count
    setTotalDealRevenue(Math.round(priceNum * count).toString());
  };

  // 2. When user enters / slides Profit Margin %
  const handleMarginChange = (val) => {
    setProfitMarginPercent(val);
    const marginNum = Number(val) || 0;
    const baseCost = baseMetrics.unitBaseCost;
    const count = baseMetrics.combinedCount;

    // Calculate Sell Price: BaseCost * (1 + margin / 100)
    const newPrice = baseCost * (1 + marginNum / 100);
    setSellPricePerBird(newPrice.toFixed(2));
    // Calculate Total Revenue: Price * Count
    setTotalDealRevenue(Math.round(newPrice * count).toString());
  };

  // 3. When user enters Total Deal Revenue
  const handleTotalRevenueChange = (val) => {
    setTotalDealRevenue(val);
    const revNum = Number(val) || 0;
    const baseCost = baseMetrics.unitBaseCost;
    const count = baseMetrics.combinedCount;

    // Calculate Price per bird: Revenue / Count
    if (count > 0) {
      const newPrice = revNum / count;
      setSellPricePerBird(newPrice.toFixed(2));

      // Calculate Margin %: ((Revenue - TotalCost) / TotalCost) * 100
      if (baseMetrics.combinedCost > 0) {
        const margin = ((revNum - baseMetrics.combinedCost) / baseMetrics.combinedCost) * 100;
        setProfitMarginPercent(margin.toFixed(1));
      }
    }
  };

  // Quick Preset Helper
  const applyPresetPrice = (priceVal) => {
    handleSellPricePerBirdChange(priceVal.toString());
  };

  const applyPresetMargin = (marginVal) => {
    handleMarginChange(marginVal.toString());
  };

  // DERIVED SELLING RESULTS (Used across Section 2 & Section 3)
  const calculationResults = useMemo(() => {
    const { combinedCost, combinedCount, unitBaseCost, selectedCount } = baseMetrics;

    const currentPricePerBird = Number(sellPricePerBird) || 0;
    const currentRevenue = currentPricePerBird * combinedCount;
    const currentMargin = Number(profitMarginPercent) || 0;

    const profitPerBird = currentPricePerBird - unitBaseCost;
    const totalNetProfit = currentRevenue - combinedCost;

    const isProfitable = totalNetProfit > 0;
    const isLoss = totalNetProfit < 0;
    const isBreakeven = Math.abs(totalNetProfit) < 0.01;

    const effectiveRev = currentRevenue > 0 ? currentRevenue : 1;
    const costRatio = Math.min(100, Math.max(0, (combinedCost / effectiveRev) * 100));
    const profitRatio = isProfitable ? Math.min(100, Math.max(0, 100 - costRatio)) : 0;

    return {
      selectedCount,
      combinedCost,
      combinedCount,
      unitBaseCost,
      sellPricePerBird: currentPricePerBird,
      profitMarginPercent: currentMargin,
      profitPerBird,
      totalRevenue: currentRevenue,
      totalNetProfit,
      isProfitable,
      isLoss,
      isBreakeven,
      costRatio,
      profitRatio
    };
  }, [baseMetrics, sellPricePerBird, profitMarginPercent]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Banner / Navigation Indicator */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700/80 border border-emerald-500/30 flex items-center justify-center text-white">
            <Calculator className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Batch Cost & Selling Margin Calculator
            </h1>
            <p className="text-xs text-slate-400">
              Dedicated Standalone Tool — Calculate single batch or combined custom batches: <strong className="text-emerald-300 font-mono">Total Cost ÷ Total Count</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full">
            Unified Live Pricing
          </span>
        </div>
      </div>

      {/* MAIN WORKSTATION CONTAINER */}
      <div className="bg-white rounded-2xl border border-slate-300 p-6 shadow-sm space-y-8">
        
        {/* ========================================================= */}
        {/* SECTION 1: BATCH SELECTION & CUSTOM COMBINER */}
        {/* ========================================================= */}
        <div className="space-y-4 pb-6 border-b border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <span>1. Select Batches to Combine (Adding Total Costs ÷ Total Count)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Check one or more batches below to combine their production expenses and divide by their bird count.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
              >
                Deselect All
              </button>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(true)}
                className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Custom Batch</span>
              </button>
            </div>
          </div>

          {/* BATCH CARDS GRID (Showing Cost AND Target Sell Price at Active Price) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {allBatchesForCalc.map((b) => {
              const isChecked = b.checked;
              const currentPrice = Number(sellPricePerBird) || 0;
              const batchProfitPerBird = currentPrice - b.unitCost;

              return (
                <div
                  key={b.id}
                  onClick={() => {
                    if (b.isCustom) {
                      handleToggleCustomBatch(b.id);
                    } else {
                      handleToggleRealBatch(b.batch_no);
                    }
                  }}
                  className={`p-4 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                    isChecked
                      ? 'border-slate-900 bg-slate-50/80 shadow-2xs'
                      : 'border-slate-200 bg-white opacity-70 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-black font-mono text-slate-900">{b.name}</span>
                        {b.isCustom && (
                          <span className="text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {b.isCustom && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomBatch(b.id);
                            }}
                            className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                            title="Remove custom batch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (b.isCustom) {
                              handleToggleCustomBatch(b.id);
                            } else {
                              handleToggleRealBatch(b.batch_no);
                            }
                          }}
                          className="accent-emerald-700 w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Total Cost:</span>
                        <strong className="font-mono text-amber-900">{formatCurrency(b.totalCost)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Alive / Initial:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {formatNumber(b.aliveCount)} / {formatNumber(b.initialCount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-200 space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unit Base Cost:</span>
                      <strong className="font-mono text-slate-700">₹{b.unitCost.toFixed(2)}/bird</strong>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="text-emerald-800">Selling Price:</span>
                      <span className="font-mono text-emerald-700">
                        ₹{currentPrice.toFixed(2)} ({batchProfitPerBird >= 0 ? '+' : ''}₹{batchProfitPerBird.toFixed(2)})
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Count Mode Divisor Toggle */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-700">Count Divisor Method:</span>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800">
                <input
                  type="radio"
                  name="countMode"
                  value="alive"
                  checked={countMode === 'alive'}
                  onChange={() => setCountMode('alive')}
                  className="accent-emerald-700"
                />
                <span>Alive Birds in Shed (Recommended)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-semibold text-slate-800 ml-2">
                <input
                  type="radio"
                  name="countMode"
                  value="initial"
                  checked={countMode === 'initial'}
                  onChange={() => setCountMode('initial')}
                  className="accent-emerald-700"
                />
                <span>Initial Chicks Placed</span>
              </label>
            </div>
            <span className="text-slate-500 font-mono">
              Formula: <strong className="text-slate-800">Combined Total Cost ÷ Selected Bird Count</strong>
            </span>
          </div>

          {/* COMBINED CALCULATION BASE COST SUMMARY */}
          <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900">
                Combined Batch Totals & Unit Base Cost
              </span>
              <span className="text-xs font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                {baseMetrics.selectedCount} Batches Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-2xs">
                <span className="text-[10.5px] font-bold uppercase text-slate-500 block">Combined Total Cost (Added)</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-amber-900 mt-1">
                  {formatCurrency(baseMetrics.combinedCost)}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Sum of chick acquisition + feed/operations</p>
              </div>

              <div className="bg-white border border-emerald-200 p-4 rounded-xl shadow-2xs">
                <span className="text-[10.5px] font-bold uppercase text-slate-500 block">Combined Total Bird Count</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-900 mt-1">
                  {formatNumber(baseMetrics.combinedCount)}{' '}
                  <span className="text-sm font-semibold text-slate-500">birds</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {countMode === 'alive' ? 'Combined live inventory in shed' : 'Combined initial placed chicks'}
                </p>
              </div>

              <div className="bg-white border-2 border-emerald-400 p-4 rounded-xl shadow-2xs">
                <span className="text-[10.5px] font-bold uppercase text-emerald-900 block">Base Cost Per Single Bird</span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-700 mt-1">
                  ₹{baseMetrics.unitBaseCost.toFixed(2)}
                  <span className="text-xs font-normal text-slate-500"> / bird</span>
                </div>
                <p className="text-[11px] text-emerald-800 font-mono mt-1">
                  {formatCurrency(baseMetrics.combinedCost)} ÷ {formatNumber(baseMetrics.combinedCount)} birds
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SECTION 2: UNIFIED SELLING & PROFIT MARGIN ENGINE */}
        {/* ========================================================= */}
        <div className="space-y-5 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-700" />
              <span>2. Selling Price & Profit Margin Engine (3-Way Synchronized)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter either your <strong>Selling Price per Bird</strong>, desired <strong>Profit Margin %</strong>, or <strong>Total Deal Amount</strong> — all fields update in real-time!
            </p>
          </div>

          {/* 3-WAY SYNCHRONIZED INPUT CONTROLS */}
          <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Input 1: Selling Price Per Single Bird (PRIMARY INPUT) */}
              <div className="bg-white border-2 border-emerald-600 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-emerald-950 flex items-center gap-1.5">
                    <span>Selling Price Per Bird</span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                      Live
                    </span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Cost: ₹{baseMetrics.unitBaseCost.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center bg-emerald-50/40 border-2 border-emerald-400 rounded-xl px-3 py-2 focus-within:border-emerald-700 focus-within:bg-white transition">
                  <span className="text-lg font-bold text-emerald-700 mr-2">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 350"
                    value={sellPricePerBird}
                    onChange={(e) => handleSellPricePerBirdChange(e.target.value)}
                    className="w-full text-2xl font-mono font-black text-slate-900 focus:outline-none bg-transparent"
                  />
                  <span className="text-xs font-bold text-slate-400">/ bird</span>
                </div>

                {/* Quick helpers for price */}
                <div className="flex items-center gap-1 flex-wrap pt-1 text-[10.5px]">
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPresetPrice(Math.round(baseMetrics.unitBaseCost))}
                    className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium transition cursor-pointer"
                  >
                    At Cost
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetPrice(Math.round(baseMetrics.unitBaseCost + 50))}
                    className="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold transition cursor-pointer"
                  >
                    +₹50
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetPrice(Math.round(baseMetrics.unitBaseCost + 100))}
                    className="px-2 py-0.5 rounded border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold transition cursor-pointer"
                  >
                    +₹100
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPresetPrice(Math.round(baseMetrics.unitBaseCost * 2))}
                    className="px-2 py-0.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold transition cursor-pointer"
                  >
                    2x Cost
                  </button>
                </div>
              </div>

              {/* Input 2: Profit Margin Percentage */}
              <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Profit Margin %</span>
                  </label>
                  <span className="text-[11px] text-emerald-700 font-mono font-bold">
                    Markup above cost
                  </span>
                </div>

                <div className="flex items-center bg-emerald-50/40 border border-emerald-300 rounded-xl px-3 py-2 focus-within:border-emerald-600 focus-within:bg-white transition">
                  <input
                    type="number"
                    step="any"
                    value={profitMarginPercent}
                    onChange={(e) => handleMarginChange(e.target.value)}
                    className="w-full text-2xl font-mono font-black text-emerald-950 focus:outline-none bg-transparent"
                  />
                  <span className="text-base font-bold text-emerald-700">%</span>
                </div>

                {/* Quick Presets for Margin */}
                <div className="flex items-center gap-1 flex-wrap pt-1 text-[10.5px]">
                  <span className="text-[9.5px] font-bold uppercase text-slate-400 mr-1">Margins:</span>
                  {[40, 50, 60, 70, 80, 100].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => applyPresetMargin(m)}
                      className={`px-1.5 py-0.5 rounded border transition cursor-pointer font-bold ${
                        Number(profitMarginPercent) === m
                          ? 'border-emerald-700 bg-emerald-700 text-white'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {m}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Input 3: Total Deal Selling Revenue */}
              <div className="bg-white border border-slate-300 rounded-xl p-4 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-amber-600" />
                    <span>Total Deal Amount</span>
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    All {baseMetrics.combinedCount} birds
                  </span>
                </div>

                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus-within:border-slate-600 focus-within:bg-white transition">
                  <span className="text-lg font-bold text-slate-500 mr-2">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="e.g. 150000"
                    value={totalDealRevenue}
                    onChange={(e) => handleTotalRevenueChange(e.target.value)}
                    className="w-full text-2xl font-mono font-black text-slate-900 focus:outline-none bg-transparent"
                  />
                  <span className="text-xs font-medium text-slate-400">total</span>
                </div>

                <div className="text-[11px] text-slate-500 pt-1 flex justify-between">
                  <span>Production Cost:</span>
                  <strong className="font-mono text-amber-900">{formatCurrency(baseMetrics.combinedCost)}</strong>
                </div>
              </div>

            </div>
          </div>

          {/* DYNAMIC RESULTS DISPLAY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            
            {/* Card 1: Profit Margin */}
            <div
              className={`rounded-2xl p-4 border-2 transition flex flex-col justify-between ${
                calculationResults.isProfitable
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                  : calculationResults.isLoss
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-slate-50 border-slate-300 text-slate-800'
              }`}
            >
              <div>
                <span className="text-[10.5px] font-bold uppercase block mb-1 opacity-80">
                  Calculated Profit Percentage
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono flex items-center gap-1.5">
                  {calculationResults.profitMarginPercent >= 0 ? '+' : ''}
                  {calculationResults.profitMarginPercent.toFixed(1)}%
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-emerald-200/60 text-[11px] font-medium flex items-center gap-1">
                {calculationResults.isProfitable ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Profitable Markup</span>
                  </>
                ) : calculationResults.isLoss ? (
                  <>
                    <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                    <span className="text-rose-700 font-bold">Selling Below Cost (Loss)</span>
                  </>
                ) : (
                  <span className="text-slate-600 font-bold">Break-even Point (0% Profit)</span>
                )}
              </div>
            </div>

            {/* Card 2: Selling Price Per Bird */}
            <div className="bg-slate-50/90 border-2 border-slate-300 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase text-slate-500 block mb-1">
                  Active Selling Price Per Bird
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                  ₹{calculationResults.sellPricePerBird.toFixed(2)}
                </div>
              </div>
              <p className="text-[11px] font-medium mt-2">
                <span
                  className={
                    calculationResults.profitPerBird >= 0
                      ? 'text-emerald-700 font-bold'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {calculationResults.profitPerBird >= 0 ? '+ ' : '- '}
                  ₹{Math.abs(calculationResults.profitPerBird).toFixed(2)}
                </span>{' '}
                <span className="text-slate-500">net profit / bird</span>
              </p>
            </div>

            {/* Card 3: Total Revenue */}
            <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase text-emerald-900 block mb-1">
                  Total Deal Revenue
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-950">
                  {formatCurrency(calculationResults.totalRevenue)}
                </div>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-2">
                Selling all {formatNumber(calculationResults.combinedCount)} birds
              </p>
            </div>

            {/* Card 4: Total Net Profit */}
            <div
              className={`rounded-2xl p-4 shadow-sm flex flex-col justify-between ${
                calculationResults.totalNetProfit >= 0
                  ? 'bg-emerald-700 text-white'
                  : 'bg-rose-700 text-white'
              }`}
            >
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/80 block mb-1">
                  Total Net Profit / Return
                </span>
                <div className="text-2xl sm:text-3xl font-black font-mono">
                  {calculationResults.totalNetProfit >= 0 ? '+ ' : '- '}
                  {formatCurrency(Math.abs(calculationResults.totalNetProfit))}
                </div>
              </div>
              <p className="text-xs text-white/90 font-medium mt-2">
                {calculationResults.totalNetProfit >= 0
                  ? `Pure take-home profit`
                  : `Projected loss on batch`}
              </p>
            </div>
          </div>

          {/* Revenue Distribution Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center text-xs font-mono flex-wrap gap-2">
              <span className="text-slate-600 font-bold">Revenue Distribution</span>
              <span className="text-slate-500">
                Production Cost:{' '}
                <strong className="text-amber-800">
                  {formatCurrency(calculationResults.combinedCost)} ({calculationResults.costRatio.toFixed(1)}%)
                </strong>{' '}
                | Net Profit:{' '}
                <strong
                  className={
                    calculationResults.totalNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }
                >
                  {calculationResults.totalNetProfit >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(calculationResults.totalNetProfit))} ({calculationResults.profitRatio.toFixed(1)}%)
                </strong>
              </span>
            </div>

            <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${calculationResults.costRatio}%` }}
              />
              <div
                className={`h-full transition-all duration-300 ${
                  calculationResults.totalNetProfit >= 0 ? 'bg-emerald-600' : 'bg-rose-500'
                }`}
                style={{ width: `${calculationResults.profitRatio}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD CUSTOM BATCH */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Add Custom Batch for Calculation</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustomModal(false)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Custom Batch Name / Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Custom Batch #4 / Experimental Flock"
                  value={customForm.name}
                  onChange={(e) => setCustomForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full text-xs font-semibold px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Total Production Cost (₹)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  placeholder="e.g. 50000"
                  value={customForm.totalCost}
                  onChange={(e) => setCustomForm((prev) => ({ ...prev, totalCost: e.target.value }))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
                <p className="text-[10.5px] text-slate-400 mt-0.5">Total spend (Buying price + Feed + Overhead)</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Bird Count
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  placeholder="e.g. 500"
                  value={customForm.birdCount}
                  onChange={(e) => setCustomForm((prev) => ({ ...prev, birdCount: e.target.value }))}
                  className="w-full text-xs font-mono font-bold px-3 py-2 border border-slate-300 rounded-lg focus:outline-emerald-600"
                />
                <p className="text-[10.5px] text-slate-400 mt-0.5">Number of birds to divide cost across</p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Add to Calculator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
