import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Receipt,
  Plus,
  Download,
  Trash2,
  Pencil,
  Calendar,
  Layers,
  Search,
  Filter,
  Zap,
  Wrench,
  DollarSign,
  PieChart as PieChartIcon,
  TrendingUp,
  Wheat,
  Egg,
  Syringe,
  Pill,
  Truck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  Percent,
  CheckCircle2,
  Check,
  X,
  Tag,
  ArrowRight,
  SlidersHorizontal,
  RotateCcw,
  Table,
  LayoutGrid,
  Sliders,
  AlertCircle,
  Users
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';
import { formatCurrency, formatNumber, formatDate, exportToCSV, translations } from '../utils';

// Commercial Poultry Farm Expense Categories Definitions
export const CATEGORY_DEFINITIONS = [
  {
    key: 'feed',
    name: 'Feed & Nutrition',
    tamil: 'தீவன செலவு',
    keywords: ['feed', 'starter', 'grower', 'finisher', 'mash', 'pellet', 'maize', 'soya', 'தீவனம்'],
    color: '#d97706', // Amber 600
    icon: Wheat,
    badgeBg: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    key: 'chicks',
    name: 'Day-Old Chicks (DOC)',
    tamil: 'குஞ்சு வாங்கிய செலவு',
    keywords: ['chick', 'doc', 'buying price', 'குஞ்சு'],
    color: '#334155', // Slate 700
    icon: Egg,
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300'
  },
  {
    key: 'vaccines',
    name: 'Vaccines & Medicines',
    tamil: 'தடுப்பூசி & மருந்துகள்',
    keywords: ['vaccine', 'medicine', 'lasota', 'gumboro', 'ibd', 'ranikhet', 'antibiotic', 'deworm', 'r2b', 'pox', 'coryza', 'cholera', 'மருந்து', 'தடுப்பூசி'],
    color: '#0284c7', // Sky 600
    icon: Syringe,
    badgeBg: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  {
    key: 'vitamins',
    name: 'Vitamins & Tonics',
    tamil: 'சத்து & டானிக்',
    keywords: ['vitamin', 'calcium', 'tonic', 'supplement', 'liver', 'டானிக்', 'சத்து'],
    color: '#0d9488', // Teal 600
    icon: Pill,
    badgeBg: 'bg-teal-50 text-teal-800 border-teal-200'
  },
  {
    key: 'bedding',
    name: 'Bedding & Litter',
    tamil: 'உமி / கடலை பொட்டு படுக்கை',
    keywords: ['bedding', 'litter', 'husk', 'sawdust', 'lime', 'wood', 'pottu', 'kadala', 'உமி', 'மரத்தூள்', 'கடலை', 'பொட்டு'],
    color: '#b45309', // Amber 700
    icon: Layers,
    badgeBg: 'bg-orange-50 text-orange-800 border-orange-200'
  },
  {
    key: 'labor',
    name: 'Labor & Wages',
    tamil: 'பண்ணை கூலி',
    keywords: ['labor', 'labour', 'salary', 'worker', 'wage', 'caretak', 'கூலி', 'சம்பளம்'],
    color: '#4f46e5', // Indigo 600
    icon: Layers,
    badgeBg: 'bg-indigo-50 text-indigo-800 border-indigo-200'
  },
  {
    key: 'electricity',
    name: 'Electricity & Utilities',
    tamil: 'மின்சாரம் & மோட்டார்',
    keywords: ['electricity', 'eb', 'power', 'current', 'motor', 'pump', 'diesel', 'generator', 'மின்சாரம்'],
    color: '#ca8a04', // Yellow 600
    icon: Zap,
    badgeBg: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  },
  {
    key: 'transport',
    name: 'Transport & Freight',
    tamil: 'போக்குவரத்து செலவு',
    keywords: ['transport', 'freight', 'lorry', 'auto', 'vehicle', 'fuel', 'போக்குவரத்து'],
    color: '#2563eb', // Blue 600
    icon: Truck,
    badgeBg: 'bg-blue-50 text-blue-800 border-blue-200'
  },
  {
    key: 'infrastructure',
    name: 'Shed & Equipment Upkeep',
    tamil: 'கொட்டகை & கருவிகள்',
    keywords: ['shed', 'cage', 'repair', 'fence', 'feeder', 'drinker', 'curtain', 'apparatus', 'equipment', 'கொட்டகை', 'பராமரிப்பு', 'கருவி'],
    color: '#be123c', // Rose 700
    icon: Wrench,
    badgeBg: 'bg-rose-50 text-rose-800 border-rose-200'
  },
  {
    key: 'disinfection',
    name: 'Disinfection & Biosecurity',
    tamil: 'கிருமிநாசினி & தூய்மை',
    keywords: ['disinfect', 'sanit', 'spray', 'bleaching', 'biosecurity', 'கிருமி'],
    color: '#059669', // Emerald 600
    icon: ShieldCheck,
    badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    key: 'other',
    name: 'General & Miscellaneous',
    tamil: 'இதர செலவுகள்',
    keywords: [],
    color: '#64748b', // Slate 500
    icon: Receipt,
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-200'
  }
];

export function getCategoryForExpense(expenseType) {
  if (!expenseType) return CATEGORY_DEFINITIONS[CATEGORY_DEFINITIONS.length - 1];
  const lower = expenseType.toLowerCase();
  for (const cat of CATEGORY_DEFINITIONS) {
    if (cat.keywords.some((k) => lower.includes(k))) {
      return cat;
    }
  }
  return CATEGORY_DEFINITIONS[CATEGORY_DEFINITIONS.length - 1]; // Other
}

// Custom Tooltip for Recharts Pie Chart
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-lg border border-slate-700 font-sans z-50 pointer-events-none">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: data.color }}
          />
          <span className="font-bold text-slate-100">{data.name}</span>
        </div>
        <p className="text-[10px] text-slate-400 mb-2">{data.tamil}</p>
        <div className="space-y-1 font-mono text-xs">
          <div className="flex justify-between gap-4 text-amber-400 font-black">
            <span>Outlay:</span>
            <span>{formatCurrency(data.value)}</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-300">
            <span>Share:</span>
            <span>{data.percent.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-400 text-[11px]">
            <span>Transactions:</span>
            <span>{data.count} items</span>
          </div>
          {data.costPerBird !== undefined && data.costPerBird > 0 && (
            <div className="flex justify-between gap-4 text-emerald-400 text-[11px] pt-1 border-t border-slate-800">
              <span>Cost / Bird:</span>
              <span>₹{data.costPerBird.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
}

export default function ExpensesView({
  expenses = [],
  infraExpenses = [],
  batches = [],
  sales = [],
  mortalityLogs = [],
  onDeleteExpense,
  onDeleteInfraExpense,
  openModal,
  selectedBatchFilter = 'ALL',
  setSelectedBatchFilter,
  searchQuery = '',
  onNavigateToView,
  lang = 'en'
}) {
  const t = translations[lang] || translations.en;

  // View state: 'dashboard' (Pie Chart + Category Breakdown) | 'ledger' (Transaction Table) | 'split'
  const [viewMode, setViewMode] = useState('dashboard');
  const [activeLedgerTab, setActiveLedgerTab] = useState('batch'); // 'batch' | 'infra'
  const [includeChickCost, setIncludeChickCost] = useState(true);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState(null); // Filter by category
  const [activeIndex, setActiveIndex] = useState(-1);

  // Redesigned Category Board Sub-View State
  const [categoryBoardTab, setCategoryBoardTab] = useState('matrix'); // 'matrix' | 'cards' | 'drivers' | 'chart'
  const [matrixMetric, setMatrixMetric] = useState('amount'); // 'amount' | 'unit' | 'percent'
  const [drilldownData, setDrilldownData] = useState(null);

  // Multi-batch scope state: isAllScope=true means All Batches & Infra
  // When false, selectedBatchIds contains the array of active batch numbers (e.g. [3] or [1, 3])
  const [isAllScope, setIsAllScope] = useState(() => selectedBatchFilter === 'ALL');
  const [selectedBatchIds, setSelectedBatchIds] = useState(() => {
    if (selectedBatchFilter && selectedBatchFilter !== 'ALL') {
      return [Number(selectedBatchFilter)];
    }
    return [];
  });
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [batchSearchTerm, setBatchSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Sync if parent selectedBatchFilter changes externally
  useEffect(() => {
    if (selectedBatchFilter === 'ALL') {
      setIsAllScope(true);
      setSelectedBatchIds([]);
    } else if (selectedBatchFilter) {
      setIsAllScope(false);
      setSelectedBatchIds([Number(selectedBatchFilter)]);
    }
  }, [selectedBatchFilter]);

  // Outside click listener for the batch selector dropdown
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

  // Sorted batches by batch_no descending (newest first)
  const sortedBatches = useMemo(() => {
    return [...batches].sort((a, b) => Number(b.batch_no) - Number(a.batch_no));
  }, [batches]);

  // Quick recent batches (up to 2 recent flocks)
  const recentBatches = useMemo(() => {
    return sortedBatches.slice(0, 2);
  }, [sortedBatches]);

  // Filtered batches inside the popover search
  const filteredBatchesForDropdown = useMemo(() => {
    if (!batchSearchTerm.trim()) return sortedBatches;
    const term = batchSearchTerm.toLowerCase().trim();
    return sortedBatches.filter((b) => b.batch_no?.toString().includes(term));
  }, [sortedBatches, batchSearchTerm]);

  // Scope Selection Handlers
  const handleSelectAllScope = () => {
    setIsAllScope(true);
    setSelectedBatchIds([]);
    setSelectedBatchFilter('ALL');
  };

  const handleSelectSingleBatch = (batchNo) => {
    const num = Number(batchNo);
    setIsAllScope(false);
    setSelectedBatchIds([num]);
    setSelectedBatchFilter(num);
  };

  const handleToggleBatch = (batchNo) => {
    const num = Number(batchNo);
    let updated;
    if (isAllScope) {
      // Switch from ALL to single batch
      updated = [num];
      setIsAllScope(false);
    } else {
      if (selectedBatchIds.includes(num)) {
        updated = selectedBatchIds.filter((id) => id !== num);
        if (updated.length === 0) {
          // If no batches left checked, revert to All
          setIsAllScope(true);
          setSelectedBatchIds([]);
          setSelectedBatchFilter('ALL');
          return;
        }
      } else {
        updated = [...selectedBatchIds, num];
      }
    }
    setSelectedBatchIds(updated);
    if (updated.length === 1) {
      setSelectedBatchFilter(updated[0]);
    } else {
      setSelectedBatchFilter('ALL');
    }
  };

  const handleSelectEveryBatch = () => {
    setIsAllScope(false);
    const allIds = batches.map((b) => Number(b.batch_no));
    setSelectedBatchIds(allIds);
  };

  // Stepper handlers (< and >) for 1-click batch cycling
  const handleStepPrev = () => {
    if (sortedBatches.length === 0) return;
    if (isAllScope || selectedBatchIds.length !== 1) {
      const oldest = sortedBatches[sortedBatches.length - 1];
      handleSelectSingleBatch(oldest.batch_no);
      return;
    }
    const currentBatchNo = selectedBatchIds[0];
    const idx = sortedBatches.findIndex((b) => Number(b.batch_no) === Number(currentBatchNo));
    if (idx !== -1 && idx < sortedBatches.length - 1) {
      handleSelectSingleBatch(sortedBatches[idx + 1].batch_no);
    }
  };

  const handleStepNext = () => {
    if (sortedBatches.length === 0) return;
    if (isAllScope || selectedBatchIds.length !== 1) {
      const newest = sortedBatches[0];
      handleSelectSingleBatch(newest.batch_no);
      return;
    }
    const currentBatchNo = selectedBatchIds[0];
    const idx = sortedBatches.findIndex((b) => Number(b.batch_no) === Number(currentBatchNo));
    if (idx !== -1 && idx > 0) {
      handleSelectSingleBatch(sortedBatches[idx - 1].batch_no);
    }
  };

  // Compute Category Outlay Data (Multi-Batch aware)
  const { categoryStats, totalExpensesCalculated, totalChickCost, totalOperationalExp, flockSize } = useMemo(() => {
    // Filter relevant batch expenses
    const relevantBatchExpenses = expenses.filter((e) => {
      if (isAllScope) return true;
      return selectedBatchIds.includes(Number(e.batch));
    });

    // Filter relevant infra expenses (only in 'ALL' farm-wide scope)
    const relevantInfraExpenses = isAllScope ? infraExpenses : [];

    // Calculate Chick Purchase Cost & Flock Size
    let chickCost = 0;
    let chicksCount = 0;

    if (isAllScope) {
      if (includeChickCost) {
        chickCost = batches.reduce((sum, b) => sum + (Number(b.buying_price) || 0), 0);
      }
      chicksCount = batches.reduce((sum, b) => sum + (Number(b.no_of_chicks) || 0), 0);
    } else {
      const activeBatches = batches.filter((b) => selectedBatchIds.includes(Number(b.batch_no)));
      if (includeChickCost) {
        chickCost = activeBatches.reduce((sum, b) => sum + (Number(b.buying_price) || 0), 0);
      }
      chicksCount = activeBatches.reduce((sum, b) => sum + (Number(b.no_of_chicks) || 0), 0);
    }

    // Accumulate amounts by category key
    const categoryMap = {};
    CATEGORY_DEFINITIONS.forEach((cat) => {
      categoryMap[cat.key] = {
        ...cat,
        value: 0,
        count: 0,
        items: []
      };
    });

    // 1. Add Chick Cost if enabled
    if (includeChickCost && chickCost > 0) {
      categoryMap['chicks'].value += chickCost;
      const countBatches = isAllScope ? batches.length : selectedBatchIds.length;
      categoryMap['chicks'].count += countBatches;
      categoryMap['chicks'].items.push({
        name: isAllScope
          ? 'Total Chick Purchase (All Batches)'
          : selectedBatchIds.length === 1
          ? `Batch #${selectedBatchIds[0]} Chick Purchase`
          : `Chick Purchase (${selectedBatchIds.length} Batches)`,
        amount: chickCost,
        isChick: true
      });
    }

    // 2. Add Batch Expenses
    relevantBatchExpenses.forEach((e) => {
      const amt = Number(e.amount) || 0;
      if (amt <= 0) return;
      const cat = getCategoryForExpense(e.expense_type);
      categoryMap[cat.key].value += amt;
      categoryMap[cat.key].count += 1;
      categoryMap[cat.key].items.push(e);
    });

    // 3. Add Infra Expenses
    relevantInfraExpenses.forEach((ie) => {
      const amt = Number(ie.amount) || 0;
      if (amt <= 0) return;
      const cat = getCategoryForExpense(ie.expense_type);
      categoryMap[cat.key].value += amt;
      categoryMap[cat.key].count += 1;
      categoryMap[cat.key].items.push(ie);
    });

    // Calculate grand total
    const grandTotal = Object.values(categoryMap).reduce((acc, c) => acc + c.value, 0);
    const operationalTotal = grandTotal - (includeChickCost ? chickCost : 0);

    // Convert to sorted array for Pie Chart & Breakdown
    const list = Object.values(categoryMap)
      .filter((c) => c.value > 0)
      .map((c) => ({
        ...c,
        percent: grandTotal > 0 ? (c.value / grandTotal) * 100 : 0,
        costPerBird: chicksCount > 0 ? c.value / chicksCount : 0
      }))
      .sort((a, b) => b.value - a.value);

    return {
      categoryStats: list,
      totalExpensesCalculated: grandTotal,
      totalChickCost: chickCost,
      totalOperationalExp: operationalTotal,
      flockSize: chicksCount
    };
  }, [expenses, infraExpenses, batches, isAllScope, selectedBatchIds, includeChickCost]);

  // Sorted batches by batch_no ascending (e.g. Batch #1, Batch #2, Batch #3) for matrix column display
  const matrixBatches = useMemo(() => {
    return [...batches].sort((a, b) => Number(a.batch_no) - Number(b.batch_no));
  }, [batches]);

  // Comprehensive Multi-Batch Category Matrix Data
  // Maps every flock batch across all commercial poultry expense categories
  const multiBatchMatrixData = useMemo(() => {
    const batchMeta = {};
    let totalFlockChicks = 0;

    matrixBatches.forEach((b) => {
      const bNo = Number(b.batch_no);
      const initialCount = Number(b.no_of_chicks) || 0;

      // Deaths for this batch
      const batchDeaths = mortalityLogs.filter((m) => Number(m.batch) === bNo);
      const totalDeaths = batchDeaths.reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);

      // Sold for this batch
      const batchSales = sales.filter((s) => {
        const sBatch = Number(s.batch?.batch_no || s.batch);
        return sBatch === bNo;
      });
      const totalSold = batchSales.reduce(
        (sum, s) => sum + (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0),
        0
      );

      const aliveCount = Math.max(0, initialCount - totalDeaths - totalSold);
      const effectiveBirds = aliveCount > 0 ? aliveCount : (initialCount > 0 ? initialCount : 1);
      totalFlockChicks += effectiveBirds;

      batchMeta[bNo] = {
        batch_no: bNo,
        date: b.date,
        initialCount,
        aliveCount,
        effectiveBirds,
        buyingPrice: Number(b.buying_price) || 0
      };
    });

    // Matrix rows & totals
    const matrix = {};
    const batchTotals = {};
    matrixBatches.forEach((b) => {
      batchTotals[b.batch_no] = 0;
    });
    let grandAllTotal = 0;

    CATEGORY_DEFINITIONS.forEach((cat) => {
      matrix[cat.key] = {
        ...cat,
        batches: {},
        entries: {},
        grandTotal: 0
      };
      matrixBatches.forEach((b) => {
        matrix[cat.key].batches[b.batch_no] = 0;
        matrix[cat.key].entries[b.batch_no] = [];
      });
    });

    // 1. Chick Purchase Cost if included
    if (includeChickCost) {
      matrixBatches.forEach((b) => {
        const bNo = Number(b.batch_no);
        const cost = Number(b.buying_price) || 0;
        if (cost > 0 && matrix['chicks']) {
          matrix['chicks'].batches[bNo] += cost;
          matrix['chicks'].grandTotal += cost;
          matrix['chicks'].entries[bNo].push({
            id: `chick_${bNo}`,
            date: b.date,
            expense_type: 'Day-Old Chick (DOC) Acquisition',
            amount: cost,
            isChick: true
          });
          batchTotals[bNo] = (batchTotals[bNo] || 0) + cost;
          grandAllTotal += cost;
        }
      });
    }

    // 2. Batch Expenses
    expenses.forEach((e) => {
      const bNo = Number(e.batch);
      const amt = Number(e.amount) || 0;
      if (!amt || isNaN(amt) || !batchMeta[bNo]) return;

      const cat = getCategoryForExpense(e.expense_type);
      if (matrix[cat.key]) {
        matrix[cat.key].batches[bNo] = (matrix[cat.key].batches[bNo] || 0) + amt;
        matrix[cat.key].grandTotal += amt;
        matrix[cat.key].entries[bNo].push(e);
        batchTotals[bNo] = (batchTotals[bNo] || 0) + amt;
        grandAllTotal += amt;
      }
    });

    return {
      batchMeta,
      matrix,
      batchTotals,
      grandAllTotal,
      totalFlockChicks: Math.max(1, totalFlockChicks)
    };
  }, [matrixBatches, expenses, mortalityLogs, sales, includeChickCost]);

  // Open transaction drill-down modal for a cell
  const handleOpenDrilldown = (batchNo, categoryKey) => {
    const cat = multiBatchMatrixData.matrix[categoryKey];
    if (!cat) return;
    const entries = cat.entries[batchNo] || [];
    const total = cat.batches[batchNo] || 0;
    setDrilldownData({
      batchNo,
      categoryKey,
      catName: cat.name,
      catTamil: cat.tamil,
      color: cat.color,
      total,
      entries
    });
  };

  // Helper to render cell value in matrix
  const renderMatrixCellValue = (amount, batchTotal, birdCount) => {
    if (matrixMetric === 'amount') {
      return formatCurrency(amount);
    } else if (matrixMetric === 'unit') {
      return birdCount > 0 ? `₹${(amount / birdCount).toFixed(2)}` : '₹0.00';
    } else {
      const pct = batchTotal > 0 ? (amount / batchTotal) * 100 : 0;
      return `${pct.toFixed(1)}%`;
    }
  };

  // Revenue & Cost Recovery from Sales
  const { salesRevenueInScope, salesKgInScope, netMargin, recoveryPct, feedCostPerKg } = useMemo(() => {
    let rev = 0;
    let kg = 0;
    sales.forEach((s) => {
      const bNo = Number(s.batch?.batch_no || s.batch);
      if (isAllScope || selectedBatchIds.includes(bNo)) {
        rev += Number(s.amount) || 0;
        kg += Number(s.kg) || 0;
      }
    });

    const feedCost = categoryStats.find((c) => c.key === 'feed')?.value || 0;
    const feedPerKg = kg > 0 ? feedCost / kg : 0;
    const margin = rev - totalExpensesCalculated;
    const recovery = totalExpensesCalculated > 0 ? (rev / totalExpensesCalculated) * 100 : 0;

    return {
      salesRevenueInScope: rev,
      salesKgInScope: kg,
      netMargin: margin,
      recoveryPct: recovery,
      feedCostPerKg: feedPerKg
    };
  }, [sales, isAllScope, selectedBatchIds, totalExpensesCalculated, categoryStats]);

  // Top Cost Driver
  const topCostDriver = categoryStats.length > 0 ? categoryStats[0] : null;

  // Filtered transactions for the ledger table
  const ledgerRows = useMemo(() => {
    let rows = [];
    if (activeLedgerTab === 'batch') {
      rows = expenses.filter((e) => {
        if (!isAllScope && !selectedBatchIds.includes(Number(e.batch))) {
          return false;
        }
        return true;
      });
    } else {
      rows = infraExpenses;
    }

    // Filter by selected category if user clicked one
    if (selectedCategoryKey) {
      rows = rows.filter((item) => {
        const cat = getCategoryForExpense(item.expense_type);
        return cat.key === selectedCategoryKey;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((item) => {
        const tLower = item.expense_type?.toLowerCase() || '';
        const bStr = item.batch?.toString() || '';
        return tLower.includes(q) || bStr.includes(q);
      });
    }

    return rows;
  }, [expenses, infraExpenses, activeLedgerTab, isAllScope, selectedBatchIds, selectedCategoryKey, searchQuery]);

  // Export CSV
  const handleExportCSV = () => {
    if (activeLedgerTab === 'batch') {
      const dataToExport = ledgerRows.map((e) => {
        const cat = getCategoryForExpense(e.expense_type);
        return {
          ID: e.id,
          Date: e.date,
          'Batch No': e.batch,
          Category: cat.name,
          'Expense Type': e.expense_type,
          'Amount (INR)': e.amount
        };
      });
      exportToCSV('CoopOS_Batch_Expenses', dataToExport);
    } else {
      const dataToExport = ledgerRows.map((ie) => {
        const cat = getCategoryForExpense(ie.expense_type);
        return {
          ID: ie.id,
          Date: ie.date,
          Category: cat.name,
          'Infrastructure Expense': ie.expense_type,
          'Amount (INR)': ie.amount
        };
      });
      exportToCSV('CoopOS_Infra_Expenses', dataToExport);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Navigation Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              <PieChartIcon className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Expenses Category Board & Cost Analysis
              </h1>
              <p className="text-xs text-slate-500">
                Commercial Poultry Cost Drivers • Feed, Day-Old Chicks, Vaccines, Utilities & Labor
              </p>
            </div>
          </div>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-amber-600" />
              <span>Category Board & Matrix</span>
            </button>
            <button
              onClick={() => setViewMode('ledger')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-slate-600" />
              <span>Ledger Table ({expenses.length + infraExpenses.length})</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => openModal('expense', { isInfra: false })}
            className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Scope & Filter Selector Bar (Redesigned: Compact, Uncrowded & Multi-Batch Capable) */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Scope Controls (All, Recents, Stepper, and Multi-Select Popover) */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5 mr-1 select-none">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Scope:</span>
            </span>

            {/* All Batches Preset */}
            <button
              type="button"
              onClick={handleSelectAllScope}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                isAllScope
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All Batches & Infra
            </button>

            {/* Quick Recent Batch Pills (Up to 2 recent flocks) */}
            {recentBatches.map((b) => {
              const isSelected =
                !isAllScope && selectedBatchIds.length === 1 && selectedBatchIds[0] === Number(b.batch_no);
              return (
                <button
                  key={b.batch_no}
                  type="button"
                  onClick={() => handleSelectSingleBatch(b.batch_no)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-amber-700 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                  title={`Quick switch to Batch #${b.batch_no} (${b.no_of_chicks} chicks)`}
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

            {/* Multi-Batch Selector Dropdown Button & Popover */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  !isAllScope && selectedBatchIds.length > 1
                    ? 'bg-amber-50 text-amber-900 border-amber-300 ring-1 ring-amber-300 shadow-xs'
                    : isDropdownOpen
                    ? 'bg-slate-200 text-slate-900 border-slate-400'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-700" />
                <span>
                  {isAllScope
                    ? `Choose / Multi-Select (${batches.length} Batches)`
                    : selectedBatchIds.length === 1
                    ? `Batch #${selectedBatchIds[0]} (Change)`
                    : `${selectedBatchIds.length} Batches Selected`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-150 ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Popover Dropdown Panel */}
              {isDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 p-4 space-y-3 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Multi-Batch Expense Access
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Select multiple batches to compare and aggregate costs
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  {/* Quick Action Buttons inside Popover */}
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={handleSelectEveryBatch}
                      className="text-amber-700 hover:text-amber-800 font-bold hover:underline cursor-pointer"
                    >
                      Select All Batches
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllScope}
                      className="text-slate-500 hover:text-slate-800 font-medium hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to All</span>
                    </button>
                  </div>

                  {/* Batch Checkbox List */}
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 pr-1 space-y-0.5">
                    {filteredBatchesForDropdown.length > 0 ? (
                      filteredBatchesForDropdown.map((b) => {
                        const isChecked = !isAllScope && selectedBatchIds.includes(Number(b.batch_no));
                        return (
                          <div
                            key={b.batch_no}
                            onClick={() => handleToggleBatch(b.batch_no)}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                              isChecked
                                ? 'bg-amber-50/70 text-slate-900 font-semibold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <input
                                type="checkbox"
                                readOnly
                                checked={isChecked}
                                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 pointer-events-none"
                              />
                              <div>
                                <span className="text-xs font-mono font-bold">
                                  Batch #{b.batch_no}
                                </span>
                                <span className="text-[10px] text-slate-400 ml-2 font-normal">
                                  {b.no_of_chicks} chicks
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSingleBatch(b.batch_no);
                                setIsDropdownOpen(false);
                              }}
                              className="text-[10px] text-amber-700 hover:bg-amber-100 px-2 py-0.5 rounded font-semibold transition cursor-pointer"
                              title="View only this batch"
                            >
                              Only This
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No batches matching "{batchSearchTerm}"
                      </div>
                    )}
                  </div>

                  {/* Popover Footer */}
                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-500 font-medium">
                      {isAllScope
                        ? 'Scope: All Batches & Infra'
                        : `${selectedBatchIds.length} batch(es) active`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(false)}
                      className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Chick Cost Toggle & Active Category Filter indicator */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeChickCost}
                onChange={(e) => setIncludeChickCost(e.target.checked)}
                className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4"
              />
              <span>Include Chick Acquisition Cost</span>
            </label>

            {selectedCategoryKey && (
              <button
                type="button"
                onClick={() => setSelectedCategoryKey(null)}
                className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-xs font-medium hover:bg-amber-100 transition cursor-pointer"
              >
                <span>Filtering: {CATEGORY_DEFINITIONS.find((c) => c.key === selectedCategoryKey)?.name}</span>
                <X className="w-3 h-3 ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* Multi-Batch Active Scope Summary Pill */}
        {!isAllScope && (
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-lg px-3 py-1.5 flex items-center justify-between text-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900">Current Selection:</span>
              <span className="font-mono text-amber-800 font-bold">
                {selectedBatchIds.length === 1
                  ? `Batch #${selectedBatchIds[0]}`
                  : `${selectedBatchIds.length} Batches (${selectedBatchIds.map((id) => `#${id}`).join(', ')})`}
              </span>
              <span className="text-[11px] text-amber-700/80 font-medium">
                • {formatNumber(flockSize)} total birds in scope
              </span>
            </div>
            <button
              type="button"
              onClick={handleSelectAllScope}
              className="text-[11px] font-bold text-amber-900 hover:text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Show All Batches</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Essential Commercial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outlay */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Total Outlay (செலவு)
            </span>
            <DollarSign className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-2xl font-black text-amber-700 font-mono">
            {formatCurrency(totalExpensesCalculated)}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            {isAllScope
              ? 'Complete farm capital & operational cost'
              : selectedBatchIds.length === 1
              ? `Total expenses for Batch #${selectedBatchIds[0]}`
              : `Combined expenses for ${selectedBatchIds.length} Batches (#${[...selectedBatchIds].sort((a, b) => a - b).join(', #')})`}
          </p>
        </div>

        {/* Primary Cost Driver */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Top Cost Driver
            </span>
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </div>
          {topCostDriver ? (
            <div>
              <span className="text-lg font-black text-slate-900 block truncate">
                {topCostDriver.name}
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono font-bold text-amber-700">
                  {formatCurrency(topCostDriver.value)}
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                  {topCostDriver.percent.toFixed(1)}% of total
                </span>
              </div>
            </div>
          ) : (
            <span className="text-sm font-semibold text-slate-400">No expenses yet</span>
          )}
        </div>

        {/* Cost Per Bird */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Cost Per Bird (ஒரு கோழி)
            </span>
            <Egg className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {flockSize > 0
              ? `₹${(totalExpensesCalculated / flockSize).toFixed(2)}`
              : 'N/A'}
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            {flockSize > 0
              ? `Calculated over ${formatNumber(flockSize)} chicks`
              : 'Add flock chicks to view cost/bird'}
          </p>
        </div>

        {/* Categories Active */}
        <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Active Categories
            </span>
            <Tag className="w-4 h-4 text-indigo-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 font-mono">
            {categoryStats.length} <span className="text-xs font-normal text-slate-500">Categories</span>
          </span>
          <p className="text-[11px] text-slate-500 mt-1">
            {ledgerRows.length} transactions in scope
          </p>
        </div>
      </div>

      {/* 3B. Financial Recovery & Production Efficiency Nexus */}
      <div className="bg-white rounded-xl border border-slate-300 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Market Realization (Sales)
            </span>
            <span className="text-base font-black font-mono text-emerald-700">
              {formatCurrency(salesRevenueInScope)}
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              From {salesKgInScope.toFixed(1)} kg marketed
            </span>
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block" />

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Cost Recovery Ratio
            </span>
            <span className={`text-base font-black font-mono ${recoveryPct >= 100 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {recoveryPct.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400 block">
              {recoveryPct >= 100 ? 'Fully recovered & profitable' : `${(100 - recoveryPct).toFixed(1)}% remaining to break even`}
            </span>
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block" />

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Feed Cost / Kg Produced
            </span>
            <span className="text-base font-black font-mono text-slate-900">
              {feedCostPerKg > 0 ? `${formatCurrency(feedCostPerKg)}/kg` : 'Pending final sales'}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Primary production efficiency metric
            </span>
          </div>

          <div className="w-px h-8 bg-slate-200 hidden sm:block" />

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
              Net Farm-Gate Margin
            </span>
            <span className={`text-base font-black font-mono ${netMargin >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              {netMargin >= 0 ? '+' : ''}{formatCurrency(netMargin)}
            </span>
            <span className="text-[10px] text-slate-400 block">
              Revenue minus all inputs
            </span>
          </div>
        </div>

        {onNavigateToView && (
          <button
            type="button"
            onClick={() => onNavigateToView('sales')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-xs transition cursor-pointer whitespace-nowrap self-start md:self-center"
          >
            <span>Open Sales Workstation</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          </button>
        )}
      </div>

      {/* 4. Complete Commercial Expense Category Board & Multi-Batch Matrix Workstation */}
      {viewMode === 'dashboard' && (
        <div className="space-y-4">
          {/* Workstation Navigation & View Switcher Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-900 uppercase tracking-wide border border-amber-200">
                  Full-Set Category Tracker
                </span>
                <h3 className="text-sm font-bold text-slate-900">Commercial Poultry Category Board</h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Track and compare exact spending across all commercial categories for every flock
              </p>
            </div>

            {/* Sub-tabs: Matrix | Cards | Drivers | Pie Chart */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-center">
              <button
                type="button"
                onClick={() => setCategoryBoardTab('matrix')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  categoryBoardTab === 'matrix'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-amber-600" />
                <span>Batch Matrix Table</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryBoardTab('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  categoryBoardTab === 'cards'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
                <span>Flock Deep-Dive Cards</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryBoardTab('drivers')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  categoryBoardTab === 'drivers'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                <span>Cost Drivers</span>
              </button>
              <button
                type="button"
                onClick={() => setCategoryBoardTab('chart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  categoryBoardTab === 'chart'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <PieChartIcon className="w-3.5 h-3.5 text-slate-600" />
                <span>Donut Chart</span>
              </button>
            </div>
          </div>

          {/* Controls Bar: Metric Toggle (Amount, Unit, Percent) + Chick Cost */}
          <div className="bg-white px-4 py-3 rounded-xl border border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 select-none">
                <Sliders className="w-3.5 h-3.5 text-slate-400" />
                <span>Display Values As:</span>
              </span>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  type="button"
                  onClick={() => setMatrixMetric('amount')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    matrixMetric === 'amount'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ₹ Total Amount
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixMetric('unit')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    matrixMetric === 'unit'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ₹ Cost Per Bird
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixMetric('percent')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                    matrixMetric === 'percent'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  % Category Share
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeChickCost}
                  onChange={(e) => setIncludeChickCost(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span>Include Chick Acquisition Cost</span>
              </label>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Click any cell for receipt drill-down
              </span>
            </div>
          </div>

          {/* SUB-VIEW A: BATCH-BY-CATEGORY MATRIX TABLE */}
          {categoryBoardTab === 'matrix' && (
            <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
              <div className="overflow-x-auto custom-scroll">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                      <th className="py-3.5 px-4 min-w-[220px]">Commercial Category</th>
                      {matrixBatches.map((b) => {
                        const meta = multiBatchMatrixData.batchMeta[b.batch_no];
                        return (
                          <th key={b.batch_no} className="py-3.5 px-3 min-w-[140px] text-right">
                            <div className="font-mono font-black text-slate-900">Batch #{b.batch_no}</div>
                            <div className="text-[10px] text-slate-500 font-normal">
                              {meta ? `${formatNumber(meta.effectiveBirds)} birds` : ''}
                            </div>
                          </th>
                        );
                      })}
                      <th className="py-3.5 px-4 min-w-[160px] text-right bg-amber-50/70 border-l border-amber-200">
                        <div className="font-mono font-black text-amber-950">Grand Total Outlay</div>
                        <div className="text-[10px] text-amber-700 font-normal">All Active Flocks</div>
                      </th>
                      <th className="py-3.5 px-3 min-w-[130px] text-right bg-amber-50/70 border-l border-amber-200">
                        <div className="font-mono font-black text-emerald-900">Weighted / Bird</div>
                        <div className="text-[10px] text-emerald-700 font-normal">Average Cost</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {CATEGORY_DEFINITIONS.map((cat) => {
                      if (cat.key === 'chicks' && !includeChickCost) return null;
                      const item = multiBatchMatrixData.matrix[cat.key];
                      if (!item || item.grandTotal === 0) return null;

                      const weightedUnit = item.grandTotal / multiBatchMatrixData.totalFlockChicks;
                      const grandPct = multiBatchMatrixData.grandAllTotal > 0
                        ? (item.grandTotal / multiBatchMatrixData.grandAllTotal) * 100
                        : 0;

                      return (
                        <tr key={cat.key} className="hover:bg-amber-50/40 transition">
                          <td className="py-3 px-4 font-semibold text-slate-800 flex items-center gap-2.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <div>
                              <span className="font-bold text-slate-900">{cat.name}</span>
                              <span className="text-[10px] text-slate-400 block">{cat.tamil}</span>
                            </div>
                          </td>

                          {matrixBatches.map((b) => {
                            const bNo = Number(b.batch_no);
                            const amt = item.batches[bNo] || 0;
                            const bTotal = multiBatchMatrixData.batchTotals[bNo] || 0;
                            const meta = multiBatchMatrixData.batchMeta[bNo];
                            const birds = meta ? meta.effectiveBirds : 1;
                            const cellPct = bTotal > 0 ? (amt / bTotal) * 100 : 0;

                            return (
                              <td
                                key={bNo}
                                onClick={() => handleOpenDrilldown(bNo, cat.key)}
                                className="py-3 px-3 text-right font-mono hover:bg-amber-100/60 cursor-pointer transition"
                                title={`Click to view Batch #${bNo} receipts for ${cat.name}`}
                              >
                                <div className="font-bold text-slate-900">
                                  {renderMatrixCellValue(amt, bTotal, birds)}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {matrixMetric !== 'percent' ? `${cellPct.toFixed(1)}%` : formatCurrency(amt)}
                                </div>
                              </td>
                            );
                          })}

                          {/* Grand Total */}
                          <td className="py-3 px-4 text-right font-mono bg-amber-50/50 border-l border-amber-100">
                            <span className="font-black text-amber-950">
                              {formatCurrency(item.grandTotal)}
                            </span>
                            <span className="text-[10px] text-amber-700 block font-mono font-semibold">
                              {grandPct.toFixed(1)}% share
                            </span>
                          </td>

                          {/* Weighted Cost Per Bird */}
                          <td className="py-3 px-3 text-right font-mono bg-amber-50/50 border-l border-amber-100 font-bold text-emerald-800">
                            ₹{weightedUnit.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                    <tr className="bg-slate-100 text-slate-900">
                      <td className="py-3.5 px-4 font-black uppercase text-[11px] tracking-wider text-slate-900">
                        TOTAL BATCH OUTLAY (₹)
                      </td>
                      {matrixBatches.map((b) => {
                        const total = multiBatchMatrixData.batchTotals[b.batch_no] || 0;
                        return (
                          <td key={b.batch_no} className="py-3.5 px-3 text-right font-mono text-sm font-black text-amber-900">
                            {formatCurrency(total)}
                          </td>
                        );
                      })}
                      <td className="py-3.5 px-4 text-right font-mono text-base font-black text-amber-950 bg-amber-100/70 border-l border-amber-300">
                        {formatCurrency(multiBatchMatrixData.grandAllTotal)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono text-sm font-black text-emerald-900 bg-amber-100/70 border-l border-amber-300">
                        ₹{(multiBatchMatrixData.grandAllTotal / multiBatchMatrixData.totalFlockChicks).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50 text-[11px] text-slate-600 font-medium border-t border-slate-200">
                      <td className="py-2.5 px-4 font-bold text-slate-700">Cost Per Alive Bird (₹/bird)</td>
                      {matrixBatches.map((b) => {
                        const total = multiBatchMatrixData.batchTotals[b.batch_no] || 0;
                        const meta = multiBatchMatrixData.batchMeta[b.batch_no];
                        const birds = meta && meta.effectiveBirds > 0 ? meta.effectiveBirds : 1;
                        return (
                          <td key={b.batch_no} className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                            ₹{(total / birds).toFixed(2)}
                          </td>
                        );
                      })}
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-500 bg-amber-50/40 border-l border-amber-200">—</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900 bg-amber-50/40 border-l border-amber-200">
                        Weighted Avg
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* SUB-VIEW B: FLOCK DEEP-DIVE CARDS */}
          {categoryBoardTab === 'cards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {matrixBatches.map((b) => {
                const bNo = Number(b.batch_no);
                const total = multiBatchMatrixData.batchTotals[bNo] || 0;
                const meta = multiBatchMatrixData.batchMeta[bNo];
                const alive = meta ? meta.aliveCount : b.no_of_chicks;
                const costPerBird = alive > 0 ? total / alive : 0;

                // Categories with spend for this batch
                const catBreakdown = CATEGORY_DEFINITIONS.map((cat) => {
                  const val = multiBatchMatrixData.matrix[cat.key]?.batches[bNo] || 0;
                  return {
                    ...cat,
                    amount: val,
                    pct: total > 0 ? (val / total) * 100 : 0
                  };
                }).filter((c) => c.amount > 0).sort((a, b) => b.amount - a.amount);

                return (
                  <div key={bNo} className="bg-white rounded-xl border border-slate-300 shadow-xs p-5 space-y-4 hover:border-amber-400 transition">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div>
                        <span className="text-[10px] font-bold font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          Batch #{bNo}
                        </span>
                        <h4 className="font-black text-sm text-slate-900 mt-1">Batch #{bNo} Flock</h4>
                        <span className="text-[11px] text-slate-400 font-mono">{formatDate(b.date)}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          {formatNumber(alive)} alive
                        </span>
                      </div>
                    </div>

                    <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-amber-900 block">Total Batch Spend</span>
                        <div className="text-xl sm:text-2xl font-black font-mono text-amber-950">{formatCurrency(total)}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-emerald-900 block">Cost / Single Bird</span>
                        <div className="text-lg sm:text-xl font-black font-mono text-emerald-800">₹{costPerBird.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Category Distribution</span>
                      {catBreakdown.map((cat) => (
                        <div
                          key={cat.key}
                          onClick={() => handleOpenDrilldown(bNo, cat.key)}
                          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition cursor-pointer border border-slate-200 space-y-1"
                          title="Click to view receipts"
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-slate-800 flex items-center gap-1.5 truncate max-w-[170px]">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span>{cat.name}</span>
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              {formatCurrency(cat.amount)}{' '}
                              <span className="text-[10px] text-slate-400 font-normal">({cat.pct.toFixed(0)}%)</span>
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${cat.pct}%`, backgroundColor: cat.color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SUB-VIEW C: COST DRIVERS & BENCHMARKS */}
          {categoryBoardTab === 'drivers' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">Poultry Cost Ranking & Commercial Share</h3>
                    <p className="text-xs text-slate-500">Sorted from highest financial outlay to lowest across all monitored batches</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                    {categoryStats.length} Active Categories
                  </span>
                </div>

                <div className="space-y-3">
                  {categoryStats.map((cat, idx) => (
                    <div key={cat.key} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-100 transition space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black font-mono flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5">({cat.tamil})</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black font-mono text-slate-900">{formatCurrency(cat.value)}</span>
                          <span className="text-xs font-mono font-bold text-slate-600 ml-2">{cat.percent.toFixed(1)}%</span>
                        </div>
                      </div>

                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div className="h-full transition-all duration-300" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>
                          Weighted Unit Cost: <strong className="text-emerald-800">₹{cat.costPerBird.toFixed(2)} / bird</strong>
                        </span>
                        <span>Commercial Share: {cat.percent.toFixed(1)}% of farm outlay</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benchmarking Guide */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-5 rounded-xl border border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-sm text-white">Commercial Farm Cost Guardrails</h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Standard cost distribution benchmarks for commercial broiler & country chicken farming:
                  </p>
                  <div className="space-y-2 pt-2 text-xs">
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                      <span className="text-slate-300">Feed & Nutrition:</span>
                      <span className="font-mono font-bold text-amber-400">62% – 68% (Target)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                      <span className="text-slate-300">Day-Old Chicks (DOC):</span>
                      <span className="font-mono font-bold text-slate-200">18% – 22% (Target)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                      <span className="text-slate-300">Vaccines & Medicines:</span>
                      <span className="font-mono font-bold text-sky-400">&lt; 5% (Target)</span>
                    </div>
                    <div className="flex justify-between items-center p-2 rounded-lg bg-slate-800/80 border border-slate-700">
                      <span className="text-slate-300">Labor & Utilities:</span>
                      <span className="font-mono font-bold text-indigo-400">5% – 8% (Target)</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span>Commercial Farm Rule</span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    Feed efficiency is the single greatest determinant of profit. If Feed cost exceeds 72%, check for feed wastage, feeder height adjustments, or low feed conversion ratio (FCR).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SUB-VIEW D: TRADITIONAL PIE CHART & BREAKDOWN */}
          {categoryBoardTab === 'chart' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-300 shadow-xs flex flex-col items-center justify-between">
                <div className="w-full flex items-center justify-between border-b border-slate-200 pb-3 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Category Share Distribution</h3>
                    <p className="text-[11px] text-slate-500">Interactive Visual Breakdown</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                    100% Outlay
                  </span>
                </div>

                {categoryStats.length > 0 ? (
                  <div className="relative w-full h-72 flex items-center justify-center my-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={68}
                          outerRadius={105}
                          paddingAngle={3}
                          dataKey="value"
                          nameKey="name"
                          cursor="pointer"
                          onClick={(entry) => {
                            setSelectedCategoryKey((prev) => (prev === entry.key ? null : entry.key));
                          }}
                        >
                          {categoryStats.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={entry.color}
                              stroke={selectedCategoryKey === entry.key ? '#0f172a' : '#ffffff'}
                              strokeWidth={selectedCategoryKey === entry.key ? 3 : 2}
                              className="transition-all duration-150"
                            />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Total Outlay
                      </span>
                      <span className="text-xl font-black text-slate-900 font-mono">
                        {formatCurrency(totalExpensesCalculated)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {categoryStats.length} Categories
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-72 flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 my-2">
                    <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center mb-3">
                      <PieChartIcon className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">No Expense Data Recorded</h4>
                    <p className="text-xs text-slate-500 max-w-xs mb-4">
                      Add feed, chick purchase, or medicines to view the commercial cost pie chart.
                    </p>
                    <button
                      onClick={() => openModal('expense', { isInfra: false })}
                      className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
                    >
                      + Add First Expense
                    </button>
                  </div>
                )}
              </div>

              {/* Right: Ranking List */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-300 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Category Cost Ranking & Metrics</h3>
                      <p className="text-[11px] text-slate-500">Breakdown sorted by highest cost driver to lowest</p>
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {categoryStats.length} Active Drivers
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {categoryStats.map((cat, idx) => {
                      const isSelected = selectedCategoryKey === cat.key;
                      return (
                        <div
                          key={cat.key}
                          onClick={() => setSelectedCategoryKey(isSelected ? null : cat.key)}
                          className={`p-3.5 rounded-xl border transition cursor-pointer ${
                            isSelected
                              ? 'bg-amber-50/60 border-amber-300 ring-1 ring-amber-400'
                              : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-black flex items-center justify-center font-mono">
                                #{idx + 1}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span className="text-xs font-bold text-slate-900">{cat.name}</span>
                                <span className="text-[10px] text-slate-500 hidden sm:inline">({cat.tamil})</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-black font-mono text-slate-900">{formatCurrency(cat.value)}</span>
                              <span className="text-[11px] font-bold text-slate-600 font-mono ml-2">{cat.percent.toFixed(1)}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden mb-2">
                            <div className="h-full rounded-full transition-all duration-300" style={{ width: `${cat.percent}%`, backgroundColor: cat.color }} />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Receipt className="w-3 h-3 text-slate-400" />
                              <span>{cat.count} {cat.count === 1 ? 'transaction' : 'transactions'}</span>
                            </span>
                            {cat.costPerBird > 0 && (
                              <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                                ₹{cat.costPerBird.toFixed(2)} / bird
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Itemized Ledger Table (Shown in 'ledger' mode or below dashboard) */}
      <div className="bg-white rounded-xl border border-slate-300 shadow-xs overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              {activeLedgerTab === 'batch' ? 'Flock Batch Expenses' : 'Infrastructure & Overhead Expenses'}
            </h3>
            {selectedCategoryKey && (
              <span className="text-xs bg-amber-100 text-amber-900 font-semibold px-2 py-0.5 rounded-full border border-amber-300">
                Filtered: {CATEGORY_DEFINITIONS.find((c) => c.key === selectedCategoryKey)?.name}
              </span>
            )}
          </div>

          {/* Sub-tab switcher */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-white p-0.5 rounded-lg border border-slate-200">
              <button
                onClick={() => setActiveLedgerTab('batch')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  activeLedgerTab === 'batch'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Batch Expenses ({expenses.length})
              </button>
              <button
                onClick={() => setActiveLedgerTab('infra')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                  activeLedgerTab === 'infra'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Infra Overhead ({infraExpenses.length})
              </button>
            </div>

            <button
              onClick={() => openModal('expense', { isInfra: activeLedgerTab === 'infra' })}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{activeLedgerTab === 'batch' ? 'Record Batch Outlay' : 'Log Infra Outlay'}</span>
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Date</th>
                {activeLedgerTab === 'batch' && <th className="py-3 px-4">Flock Batch</th>}
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Classification / Description</th>
                <th className="py-3 px-4 text-right">Amount Outlay</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {ledgerRows.length > 0 ? (
                ledgerRows.map((item) => {
                  const cat = getCategoryForExpense(item.expense_type);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 text-slate-500 font-mono">
                        {formatDate(item.date)}
                      </td>
                      {activeLedgerTab === 'batch' && (
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-mono font-bold">
                            Batch #{item.batch}
                          </span>
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${cat.badgeBg}`}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.name}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {item.expense_type}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black text-amber-700 text-sm">
                        -{formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openModal('expense', { ...item, isInfra: activeLedgerTab === 'infra' })}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Edit expense outlay"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete expense "${item.expense_type}" for ${formatCurrency(item.amount)}?`)) {
                                if (activeLedgerTab === 'batch') {
                                  onDeleteExpense(item.id);
                                } else {
                                  onDeleteInfraExpense(item.id);
                                }
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Delete expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No expense records found matching current selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Itemized Category Receipt Drill-Down Modal */}
      {drilldownData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-mono">
                  Batch #{drilldownData.batchNo}
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-1 flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: drilldownData.color }}
                  />
                  <span>{drilldownData.catName}</span>
                  {drilldownData.catTamil && (
                    <span className="text-xs text-slate-500 font-normal">({drilldownData.catTamil})</span>
                  )}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDrilldownData(null)}
                className="text-slate-400 hover:text-slate-700 text-lg leading-none p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block font-medium">Total Outlay in Category:</span>
                <span className="text-xl font-black font-mono text-amber-900">
                  {formatCurrency(drilldownData.total)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 block font-medium">Itemized Records:</span>
                <span className="text-xs font-bold font-mono text-slate-700">
                  {drilldownData.entries.length} record(s)
                </span>
              </div>
            </div>

            {/* List of Transactions */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {drilldownData.entries.length > 0 ? (
                drilldownData.entries.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {item.expense_type || item.notes || 'Expense Record'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {formatDate(item.date)}
                      </span>
                    </div>
                    <span className="text-sm font-mono font-black text-amber-800">
                      -{formatCurrency(item.amount)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  No individual transactions recorded for this category in Batch #{drilldownData.batchNo}.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSelectedCategoryKey(drilldownData.categoryKey);
                  setActiveLedgerTab('batch');
                  setDrilldownData(null);
                }}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Filter Full Ledger Table</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => setDrilldownData(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
