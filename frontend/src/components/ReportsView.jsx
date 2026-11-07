import React from 'react';
import {
  BarChart3,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers,
  Users,
  ShoppingCart,
  Receipt,
  HeartPulse
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, exportToCSV, translations } from '../utils';

export default function ReportsView({
  batches,
  batchMetrics,
  sales,
  expenses,
  infraExpenses,
  customers,
  mortalityLogs,
  summaryMetrics,
  lang
}) {
  const t = translations[lang] || translations.en;

  const totalChickCost = batches.reduce((sum, b) => sum + (Number(b.buying_price) || 0), 0);
  const totalFeedCost = summaryMetrics.totalBatchExpenses;
  const totalInfraCost = summaryMetrics.totalInfraExpenses;
  const totalOverallCost = totalChickCost + totalFeedCost + totalInfraCost;
  const netFarmProfit = summaryMetrics.totalRevenue - totalOverallCost;
  const farmRoi = totalOverallCost > 0 ? (netFarmProfit / totalOverallCost) * 100 : 0;
  const isNetProfit = netFarmProfit >= 0;

  // Master CSV Exporters
  const exportAllSales = () => {
    const data = sales.map((s) => ({
      InvoiceNo: `INV-${s.id}`,
      Date: s.date,
      BatchNo: s.batch?.batch_no || s.batch,
      Customer: s.customer?.customer_name || 'Walk-in',
      Phone: s.customer?.contact_number || '',
      Hens: s.no_of_hens,
      Roosters: s.no_of_roosters,
      TotalBirds: Number(s.no_of_hens) + Number(s.no_of_roosters),
      WeightKg: s.kg || 0,
      AmountINR: s.amount
    }));
    exportToCSV('CoopOS_Master_Sales', data);
  };

  const exportAllExpenses = () => {
    const batchData = expenses.map((e) => ({
      Type: 'Batch Direct',
      BatchNo: e.batch,
      Date: e.date,
      ExpenseCategory: e.expense_type,
      AmountINR: e.amount
    }));
    const infraData = infraExpenses.map((ie) => ({
      Type: 'Infrastructure Overhead',
      BatchNo: 'All (Farm-wide)',
      Date: ie.date,
      ExpenseCategory: ie.expense_type,
      AmountINR: ie.amount
    }));
    exportToCSV('CoopOS_Master_Expenses', [...batchData, ...infraData]);
  };

  const exportAllBatches = () => {
    const data = batches.map((b) => {
      const m = batchMetrics[b.batch_no] || {};
      const rev = Number(m.pnl?.revenue) || 0;
      const feed = Number(m.pnl?.expense) || 0;
      const chickCost = Number(b.buying_price) || 0;
      const pnl = Number(m.pnl?.profit_or_loss) || 0;
      return {
        BatchNo: b.batch_no,
        Date: b.date,
        ChicksBought: b.no_of_chicks,
        ChickCostINR: chickCost,
        FeedCostINR: feed,
        TotalCostINR: chickCost + feed,
        SalesRevenueINR: rev,
        NetProfitLossINR: pnl,
        Status: m.pnl?.status || 'Active',
        RemainingChicks: m.mortality?.Remaining_chicks ?? b.no_of_chicks,
        TotalSold: m.mortality?.total_sold ?? 0,
        TotalDeaths: m.mortality?.no_of_deaths ?? 0,
        MortalityPercent: (m.mortality?.mortality_rate || 0).toFixed(2) + '%'
      };
    });
    exportToCSV('CoopOS_Master_Batches', data);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Commercial Profit & Loss Audit Statement
          </h2>
          <p className="text-xs text-slate-400">
            Comprehensive financial reconciliation of flock sales, chick capital, feed, and overhead
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Financial Statement</span>
        </button>
      </div>

      {/* P&L Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Flock Financial Summary Breakdown
            </h3>
            <p className="text-xs text-slate-400">All-time farm financial performance</p>
          </div>
          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              isNetProfit
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            {isNetProfit ? 'Net Profitable Operations' : 'Operating at Loss'}
          </span>
        </div>

        {/* Breakdown Items */}
        <div className="space-y-3 text-sm">
          {/* Revenue */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                1
              </span>
              <div>
                <span className="font-bold text-slate-900">Gross Commercial Sales Revenue</span>
                <p className="text-[11px] text-slate-500">
                  Total revenue generated from {sales.length} bird sale orders
                </p>
              </div>
            </div>
            <span className="text-base font-mono font-black text-emerald-700">
              +{formatCurrency(summaryMetrics.totalRevenue)}
            </span>
          </div>

          {/* Chick Capital */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-700 text-white text-xs font-bold flex items-center justify-center">
                2
              </span>
              <div>
                <span className="font-bold text-slate-900">Chick Capital Acquisition Cost</span>
                <p className="text-[11px] text-slate-500">
                  Purchasing price for {summaryMetrics.totalChicksBought} day-old chicks across {batches.length} batches
                </p>
              </div>
            </div>
            <span className="text-base font-mono font-bold text-slate-800">
              -{formatCurrency(totalChickCost)}
            </span>
          </div>

          {/* Feed & Vaccines */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-600 text-white text-xs font-bold flex items-center justify-center">
                3
              </span>
              <div>
                <span className="font-bold text-slate-900">Operational Feed, Vaccines & Care</span>
                <p className="text-[11px] text-slate-500">
                  Starter/grower/finisher feed, health tonics, and direct labor
                </p>
              </div>
            </div>
            <span className="text-base font-mono font-bold text-amber-700">
              -{formatCurrency(totalFeedCost)}
            </span>
          </div>

          {/* Infrastructure Overhead */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-slate-600 text-white text-xs font-bold flex items-center justify-center">
                4
              </span>
              <div>
                <span className="font-bold text-slate-900">Farm Infrastructure & Fixed Overhead</span>
                <p className="text-[11px] text-slate-500">
                  Electricity, water piping, cage maintenance and shed sanitation
                </p>
              </div>
            </div>
            <span className="text-base font-mono font-bold text-slate-700">
              -{formatCurrency(totalInfraCost)}
            </span>
          </div>

          {/* Total Cost Outlay */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <div className="font-bold text-amber-900">
              Total Farm Operational & Capital Expenditure (2 + 3 + 4)
            </div>
            <span className="text-base font-mono font-black text-amber-800">
              -{formatCurrency(totalOverallCost)}
            </span>
          </div>

          {/* Final Net Result */}
          <div
            className={`flex items-center justify-between p-4 rounded-xl border ${
              isNetProfit
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-rose-600 text-white border-rose-700'
            }`}
          >
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider block opacity-90">
                Net Bottom-Line Farm Income
              </span>
              <span className="text-sm font-semibold opacity-90">
                Effective Farm ROI: {farmRoi.toFixed(1)}%
              </span>
            </div>
            <span className="text-2xl font-mono font-black">
              {isNetProfit ? '+' : ''}{formatCurrency(netFarmProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Master Data Export Center */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
          Business Data Export Center
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Download complete raw audit datasets in CSV format for spreadsheet accounting
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={exportAllSales}
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ShoppingCart className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-emerald-700">
                  Sales Ledger
                </span>
                <span className="text-[10px] text-slate-400">{sales.length} transactions</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
          </button>

          <button
            onClick={exportAllExpenses}
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 transition text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Receipt className="w-5 h-5 text-amber-600" />
              <div>
                <span className="text-xs font-bold text-slate-800 block group-hover:text-amber-700">
                  Expenses Ledger
                </span>
                <span className="text-[10px] text-slate-400">
                  {expenses.length + infraExpenses.length} entries
                </span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
          </button>

          <button
            onClick={exportAllBatches}
            className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition text-left group cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-slate-700" />
              <div>
                <span className="text-xs font-bold text-slate-800 block">Batches Master</span>
                <span className="text-[10px] text-slate-400">{batches.length} commercial batches</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
          </button>
        </div>
      </div>
    </div>
  );
}
