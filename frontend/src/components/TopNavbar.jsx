import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  RefreshCw,
  Calendar,
  Layers,
  ShoppingCart,
  Receipt,
  UserPlus,
  Filter
} from 'lucide-react';
import { translations } from '../utils';

export default function TopNavbar({
  currentView,
  searchQuery,
  setSearchQuery,
  selectedBatchFilter,
  setSelectedBatchFilter,
  batches,
  onRefresh,
  loading,
  openModal,
  lang
}) {
  const t = translations[lang] || translations.en;
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const titles = {
    dashboard: { main: t.dashboard, sub: lang === 'ta' ? 'தொகுதி வாரியான வரவு-செலவு மற்றும் இலாப சுருக்கம்' : 'Batch Performance, Spending & Profit Workstation' },
    batches: { main: t.batches, sub: lang === 'ta' ? 'அனைத்து தொகுதிகள் பட்டியல் மற்றும் மேலாண்மை' : 'Commercial Flock Batches' },
    customers: { main: t.customers, sub: lang === 'ta' ? 'வாங்குவோர் விவரங்கள் மற்றும் வரலாறு' : 'Buyer Directory & Order History' },
    sales: { main: t.sales, sub: lang === 'ta' ? 'விற்பனை பதிவுகள் மற்றும் பில் அச்சிடுதல்' : 'Sales Ledger & Invoicing' },
    expenses: { main: t.expenses, sub: lang === 'ta' ? 'தீவனம் மற்றும் பண்ணை செலவுகள்' : 'Feed, Vaccines & Farm Expenses' },
    mortality: { main: t.mortality, sub: lang === 'ta' ? 'இறப்பு பதிவுகள் மற்றும் காரணங்கள்' : 'Flock Losses & Mortality Records' },
    reports: { main: t.reports, sub: lang === 'ta' ? 'நிதி அறிக்கைகள் மற்றும் CSV தரவிறக்கம்' : 'Financial Reports & CSV Export' }
  };

  const currentTitle = titles[currentView] || { main: currentView, sub: '' };

  return (
    <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shadow-xs no-print">
      {/* Title & Subtitle */}
      <div className="flex flex-col">
        <h1 className="text-base font-bold text-slate-900 leading-tight">
          {currentTitle.main}
        </h1>
        <p className="text-[11px] text-slate-500 font-medium">
          {currentTitle.sub}
        </p>
      </div>

      {/* Center Search & Filter */}
      <div className="flex items-center gap-3 max-w-md w-full mx-6">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-800 placeholder-slate-400 pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Global Batch Filter Dropdown for sales/expenses views */}
        {currentView !== 'dashboard' && (
          <div className="relative min-w-[130px]">
            <select
              value={selectedBatchFilter}
              onChange={(e) => setSelectedBatchFilter(e.target.value)}
              className="w-full bg-slate-50 text-xs text-slate-700 font-medium pl-2.5 pr-6 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-500 appearance-none cursor-pointer"
            >
              <option value="ALL">All Batches</option>
              {batches.map((b) => (
                <option key={b.batch_no} value={b.batch_no}>
                  Batch #{b.batch_no}
                </option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{currentTime}</span>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          title={t.refresh}
          className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-100 transition flex items-center justify-center bg-white cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-slate-700' : ''}`} />
        </button>

        <button
          onClick={() => openModal('sale')}
          className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{t.quickSale}</span>
        </button>

        <button
          onClick={() => openModal('expense')}
          className="flex items-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>{t.recordExpense}</span>
        </button>

        <button
          onClick={() => openModal('customer')}
          className="hidden lg:flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>{t.newCustomer}</span>
        </button>
      </div>
    </header>
  );
}
