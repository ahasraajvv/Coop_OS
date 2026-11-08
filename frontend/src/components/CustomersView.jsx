import React, { useState, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Search,
  ShoppingCart,
  TrendingUp,
  ExternalLink,
  MessageCircle,
  FileText,
  Download,
  Trash2,
  Edit2,
  X,
  Tag,
  Filter,
  CheckCircle2,
  Store,
  Briefcase,
  ChevronRight,
  Plus,
  UtensilsCrossed,
  DollarSign
} from 'lucide-react';
import {
  formatCurrency,
  formatNumber,
  formatDate,
  exportToCSV,
  CUSTOMER_CATEGORIES,
  CUSTOMER_CATEGORY_LIST,
  getAllSubCategoriesForCategory,
  saveCustomSubCategory,
  translations
} from '../utils';

export default function CustomersView({
  customers = [],
  sales = [],
  onDeleteCustomer,
  openModal,
  onPrintInvoice,
  lang = 'en',
  searchQuery = ''
}) {
  const t = translations[lang] || translations.en;
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSubCategory, setSelectedSubCategory] = useState('ALL');

  const activeSearch = searchQuery || localSearch;

  // Compute CRM stats per customer
  const customerStats = useMemo(() => {
    const stats = {};
    sales.forEach((s) => {
      const custId = s.customer?.customer_id || s.customer;
      if (!custId) return;
      if (!stats[custId]) {
        stats[custId] = {
          totalSpent: 0,
          ordersCount: 0,
          totalHens: 0,
          totalRoosters: 0,
          totalKg: 0,
          lastOrderDate: null
        };
      }
      const item = stats[custId];
      item.totalSpent += Number(s.amount) || 0;
      item.ordersCount += 1;
      item.totalHens += Number(s.no_of_hens) || 0;
      item.totalRoosters += Number(s.no_of_roosters) || 0;
      item.totalKg += Number(s.kg) || 0;

      if (!item.lastOrderDate || new Date(s.date) > new Date(item.lastOrderDate)) {
        item.lastOrderDate = s.date;
      }
    });
    return stats;
  }, [sales]);

  // Aggregate Category performance metrics
  const categoryMetrics = useMemo(() => {
    const summary = {
      ALL: { count: customers.length, totalSpent: 0, totalKg: 0, totalBirds: 0 },
      restaurant: { count: 0, totalSpent: 0, totalKg: 0, totalBirds: 0 },
      butcher: { count: 0, totalSpent: 0, totalKg: 0, totalBirds: 0 },
      individual: { count: 0, totalSpent: 0, totalKg: 0, totalBirds: 0 },
      market: { count: 0, totalSpent: 0, totalKg: 0, totalBirds: 0 },
      business: { count: 0, totalSpent: 0, totalKg: 0, totalBirds: 0 }
    };

    customers.forEach((c) => {
      const cat = c.category || 'individual';
      if (!summary[cat]) {
        summary[cat] = { count: 0, totalSpent: 0, totalKg: 0, totalBirds: 0 };
      }
      summary[cat].count += 1;

      const stat = customerStats[c.customer_id];
      if (stat) {
        summary[cat].totalSpent += stat.totalSpent;
        summary[cat].totalKg += stat.totalKg;
        summary[cat].totalBirds += stat.totalHens + stat.totalRoosters;

        summary.ALL.totalSpent += stat.totalSpent;
        summary.ALL.totalKg += stat.totalKg;
        summary.ALL.totalBirds += stat.totalHens + stat.totalRoosters;
      }
    });

    return summary;
  }, [customers, customerStats]);

  // Available sub-categories for active category scope
  const availableSubCategoriesInScope = useMemo(() => {
    if (selectedCategory === 'ALL') {
      const set = new Set();
      customers.forEach((c) => {
        if (c.sub_category && c.sub_category.trim()) {
          set.add(c.sub_category.trim());
        }
      });
      return Array.from(set);
    }
    return getAllSubCategoriesForCategory(selectedCategory, customers);
  }, [selectedCategory, customers]);

  // Filter customers based on search, category, and sub-category
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const cat = c.category || 'individual';
      const sub = c.sub_category || '';

      // Category filter
      if (selectedCategory !== 'ALL' && cat !== selectedCategory) {
        return false;
      }

      // Sub-category filter
      if (selectedSubCategory !== 'ALL' && sub !== selectedSubCategory) {
        return false;
      }

      // Search filter
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        const catInfo = CUSTOMER_CATEGORIES[cat];
        return (
          (c.customer_name && c.customer_name.toLowerCase().includes(q)) ||
          (c.contact_number && c.contact_number.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.address && c.address.toLowerCase().includes(q)) ||
          (sub && sub.toLowerCase().includes(q)) ||
          (catInfo && catInfo.label.toLowerCase().includes(q)) ||
          c.customer_id.toString().includes(q)
        );
      }

      return true;
    });
  }, [customers, selectedCategory, selectedSubCategory, activeSearch]);

  const selectedCustomer = customers.find((c) => c.customer_id === selectedCustomerId);
  const selectedCustomerSales = selectedCustomer
    ? sales.filter((s) => (s.customer?.customer_id || s.customer) === selectedCustomer.customer_id)
    : [];

  const handleExportCSV = () => {
    const dataToExport = filteredCustomers.map((c) => {
      const stat = customerStats[c.customer_id] || {
        totalSpent: 0,
        ordersCount: 0,
        totalKg: 0,
        totalHens: 0,
        totalRoosters: 0,
        lastOrderDate: null
      };
      const catInfo = CUSTOMER_CATEGORIES[c.category] || CUSTOMER_CATEGORIES.individual;
      return {
        'Customer ID': c.customer_id,
        'Customer Name': c.customer_name,
        'Background Category': catInfo.label,
        'Sub-Category': c.sub_category || 'General',
        'Contact Number': c.contact_number,
        Email: c.email || 'N/A',
        Address: c.address || 'N/A',
        'Total Orders': stat.ordersCount,
        'Lifetime Value (INR)': stat.totalSpent,
        'Total Biomass Bought (Kg)': stat.totalKg.toFixed(2),
        'Total Birds Bought': stat.totalHens + stat.totalRoosters,
        'Last Purchase': stat.lastOrderDate || 'None'
      };
    });
    exportToCSV(`CoopOS_Customer_CRM_${selectedCategory}`, dataToExport);
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Command Bar & Search */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0">
            👥
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Commercial Buyer Accounts & Customer CRM
              </h1>
              <span className="text-[11px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {filteredCustomers.length} of {customers.length} Accounts
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Segmented by business background: Restaurant owners, Butcher shops, Individuals, Market mandis & Businesses
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search buyer, phone, tag, category..."
              className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsv}</span>
          </button>

          {/* Add Customer */}
          <button
            onClick={() => openModal('customer')}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Buyer Account</span>
          </button>
        </div>
      </header>

      {/* 2. Executive Background Category KPI Tiles (Click to Filter) */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span>🏷️</span> Customer Background Segments:
          </span>
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
            Click segment card to isolate category ledger
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CUSTOMER_CATEGORY_LIST.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const cMeta = categoryMetrics[cat.id] || { count: 0, totalSpent: 0, totalBirds: 0, totalKg: 0 };

            return (
              <div
                key={cat.id}
                onClick={() => {
                  if (selectedCategory === cat.id) {
                    setSelectedCategory('ALL');
                    setSelectedSubCategory('ALL');
                  } else {
                    setSelectedCategory(cat.id);
                    setSelectedSubCategory('ALL');
                  }
                }}
                className={`relative rounded-2xl p-3.5 border-2 transition-all cursor-pointer text-left select-none ${
                  isSelected
                    ? `${cat.badgeClass} ring-2 ring-emerald-500/20 shadow-xs -translate-y-0.5 border-emerald-600`
                    : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs'
                }`}
              >
                {/* Active Pill */}
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-emerald-700 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>Active</span>
                  </div>
                )}

                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xl">{cat.icon}</span>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 leading-tight">
                      {cat.label}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-sans truncate">
                      {cat.labelTa}
                    </p>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      Lifetime LTV
                    </span>
                    <span className="text-sm font-black font-mono text-slate-900">
                      {formatCurrency(cMeta.totalSpent)}
                    </span>
                  </div>
                  <span className="text-xs font-extrabold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                    {cMeta.count} buyers
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Sub-Category Filter Chips Rail (When active) */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Category Segment Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedSubCategory('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
              selectedCategory === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Backgrounds ({customers.length})
          </button>

          {CUSTOMER_CATEGORY_LIST.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const count = categoryMetrics[cat.id]?.count || 0;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedSubCategory('ALL');
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs border ${
                  isSelected
                    ? `${cat.badgeClass} ring-2 ring-emerald-500/20 shadow-xs border-current font-extrabold`
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-white hover:text-slate-900'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
                <span className="font-mono text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Right: Reset Filters Button */}
        {(selectedCategory !== 'ALL' || selectedSubCategory !== 'ALL' || localSearch) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('ALL');
              setSelectedSubCategory('ALL');
              setLocalSearch('');
            }}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* 4. Sub-Categories Granular Pill Filter (Dynamic) */}
      {availableSubCategoriesInScope.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            <span>Sub-Category:</span>
          </span>

          <button
            type="button"
            onClick={() => setSelectedSubCategory('ALL')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
              selectedSubCategory === 'ALL'
                ? 'bg-emerald-700 text-white font-bold shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Sub-Types
          </button>

          {availableSubCategoriesInScope.map((sub) => {
            const isSubSelected = selectedSubCategory === sub;
            const matchCount = customers.filter((c) => {
              const matchesCat = selectedCategory === 'ALL' || (c.category || 'individual') === selectedCategory;
              return matchesCat && c.sub_category === sub;
            }).length;

            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSelectedSubCategory(sub)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer border ${
                  isSubSelected
                    ? 'bg-emerald-700 text-white font-bold shadow-2xs border-emerald-700'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>🏷️</span>
                <span>{sub}</span>
                {matchCount > 0 && <span className="text-[10px] font-mono opacity-75">({matchCount})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* 5. Customer CRM Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((c) => {
            const stat = customerStats[c.customer_id] || {
              totalSpent: 0,
              ordersCount: 0,
              totalHens: 0,
              totalRoosters: 0,
              totalKg: 0,
              lastOrderDate: null
            };
            const cleanPhone = c.contact_number?.replace(/\D/g, '') || '';
            const catInfo = CUSTOMER_CATEGORIES[c.category] || CUSTOMER_CATEGORIES.individual;

            return (
              <div
                key={c.customer_id}
                onClick={() => setSelectedCustomerId(c.customer_id)}
                className={`bg-white rounded-2xl p-5 border transition-all duration-150 hover:shadow-md cursor-pointer flex flex-col justify-between ${
                  selectedCustomerId === c.customer_id
                    ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                    : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-2xs shrink-0">
                        {c.customer_name ? c.customer_name.slice(0, 2).toUpperCase() : 'CU'}
                      </div>
                      <div>
                        <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                          {c.customer_name}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400">
                          ID: #{c.customer_id.toString().padStart(4, '0')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal('customer', c);
                        }}
                        title="Edit Buyer Account"
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {stat.ordersCount} Orders
                      </span>
                    </div>
                  </div>

                  {/* Category & Sub-Category Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catInfo.badgeClass}`}
                    >
                      <span>{catInfo.icon}</span>
                      <span>{catInfo.label}</span>
                    </span>

                    {c.sub_category && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        <Tag className="w-2.5 h-2.5 text-slate-400" />
                        <span>{c.sub_category}</span>
                      </span>
                    )}
                  </div>

                  {/* Contact Links */}
                  <div className="space-y-1.5 text-xs text-slate-600 mb-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-700 font-mono font-semibold">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {c.contact_number}
                      </span>
                      <div className="flex items-center gap-1">
                        <a
                          href={`tel:${c.contact_number}`}
                          onClick={(e) => e.stopPropagation()}
                          title="Call Buyer"
                          className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            title="Chat on WhatsApp"
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>

                    {c.email && c.email !== 'no-email@farm.com' && (
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}

                    {c.address && c.address !== 'Farm Walk-in' && (
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{c.address}</span>
                      </div>
                    )}
                  </div>

                  {/* LTV & Off-take Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-center text-xs mb-3">
                    <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-800 font-bold uppercase block">
                        Lifetime Spend
                      </span>
                      <span className="text-base font-black text-emerald-800 font-mono">
                        {formatCurrency(stat.totalSpent)}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">
                        Birds Purchased
                      </span>
                      <span className="text-base font-black text-slate-800 font-mono">
                        {formatNumber(stat.totalHens + stat.totalRoosters)}
                        {stat.totalKg > 0 && (
                          <span className="text-[10px] text-slate-400 font-normal"> ({stat.totalKg.toFixed(1)}kg)</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">
                    Last purchase: {stat.lastOrderDate ? formatDate(stat.lastOrderDate) : 'Never'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomerId(c.customer_id);
                    }}
                    className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Order History</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 bg-white rounded-2xl border border-slate-200 text-center p-6 space-y-2">
            <span className="text-3xl block">👥</span>
            <h3 className="text-sm font-bold text-slate-800">
              No buyer accounts found in this segment
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No customer records match the active category, sub-category, or search keywords.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedSubCategory('ALL');
                setLocalSearch('');
              }}
              className="mt-2 text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        )}
      </div>

      {/* 6. Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs no-print">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div>
              <div className="p-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base">
                    {selectedCustomer.customer_name ? selectedCustomer.customer_name.slice(0, 2).toUpperCase() : 'CU'}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      {selectedCustomer.customer_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">
                      Account #{selectedCustomer.customer_id.toString().padStart(4, '0')} • {selectedCustomer.contact_number}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6">
                {/* Category & Background Classification Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Business Background:</span>
                    {(() => {
                      const catInfo = CUSTOMER_CATEGORIES[selectedCustomer.category] || CUSTOMER_CATEGORIES.individual;
                      return (
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${catInfo.badgeClass}`}>
                          <span>{catInfo.icon}</span>
                          <span>{catInfo.label}</span>
                        </span>
                      );
                    })()}
                  </div>

                  {selectedCustomer.sub_category && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Sub-Category Tag:</span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-white text-slate-800 border border-slate-200">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{selectedCustomer.sub_category}</span>
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-1 border-t border-slate-200/80">
                    <span className="text-slate-500">Phone:</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedCustomer.contact_number}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Email:</span>
                    <span className="font-semibold text-slate-700">{selectedCustomer.email || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Billing Address:</span>
                    <span className="font-semibold text-slate-700 text-right max-w-[280px]">
                      {selectedCustomer.address || 'Farm Walk-in Customer'}
                    </span>
                  </div>
                </div>

                {/* Purchase Summary */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">Lifetime LTV</span>
                    <span className="text-base font-black text-emerald-800 font-mono">
                      {formatCurrency(
                        selectedCustomerSales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0)
                      )}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">Total Orders</span>
                    <span className="text-base font-black text-slate-800 font-mono">
                      {selectedCustomerSales.length}
                    </span>
                  </div>
                  <div className="bg-sky-50 p-3 rounded-xl border border-sky-100">
                    <span className="text-[10px] text-sky-800 font-bold uppercase block">Total Birds</span>
                    <span className="text-base font-black text-sky-800 font-mono">
                      {selectedCustomerSales.reduce(
                        (sum, s) => sum + (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0),
                        0
                      )}
                    </span>
                  </div>
                </div>

                {/* Sales Ledger for this Customer */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Itemized Order History ({selectedCustomerSales.length})
                    </h4>
                    <button
                      onClick={() => openModal('sale', { customer: selectedCustomer.customer_id })}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      + Create Sale for this Client
                    </button>
                  </div>

                  {selectedCustomerSales.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCustomerSales.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs font-mono"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                                Batch #{s.batch?.batch_no || s.batch}
                              </span>
                              <span className="font-semibold text-slate-800 font-sans">{formatDate(s.date)}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded font-sans ${
                                s.sale_type === 'breeding' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {s.sale_type === 'breeding' ? 'Breeding' : 'Meat'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 font-sans">
                              {s.no_of_hens} Hens, {s.no_of_roosters} Roosters {s.kg ? `• ${s.kg} Kg` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-black text-emerald-800 text-sm">
                              +{formatCurrency(s.amount)}
                            </span>
                            <button
                              onClick={() => onPrintInvoice(s)}
                              title="Print Invoice / Cash Memo"
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 rounded-xl">
                      No sales recorded for this customer yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between sticky bottom-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openModal('customer', selectedCustomer)}
                  className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 transition cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Delete customer "${selectedCustomer.customer_name}"?`)) {
                      onDeleteCustomer(selectedCustomer.customer_id);
                      setSelectedCustomerId(null);
                    }
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 px-3 py-2 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Customer</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedCustomerId(null)}
                className="text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl shadow-xs transition cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
