import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate, exportToCSV, translations } from '../utils';

export default function CustomersView({
  customers,
  sales,
  onDeleteCustomer,
  openModal,
  onPrintInvoice,
  lang,
  searchQuery
}) {
  const t = translations[lang] || translations.en;
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [localSearch, setLocalSearch] = useState('');
  const activeSearch = searchQuery || localSearch;

  // Compute CRM stats per customer
  const customerStats = {};
  sales.forEach((s) => {
    const custId = s.customer?.customer_id || s.customer;
    if (!custId) return;
    if (!customerStats[custId]) {
      customerStats[custId] = {
        totalSpent: 0,
        ordersCount: 0,
        totalHens: 0,
        totalRoosters: 0,
        totalKg: 0,
        lastOrderDate: null
      };
    }
    const stat = customerStats[custId];
    stat.totalSpent += Number(s.amount) || 0;
    stat.ordersCount += 1;
    stat.totalHens += Number(s.no_of_hens) || 0;
    stat.totalRoosters += Number(s.no_of_roosters) || 0;
    stat.totalKg += Number(s.kg) || 0;

    if (!stat.lastOrderDate || new Date(s.date) > new Date(stat.lastOrderDate)) {
      stat.lastOrderDate = s.date;
    }
  });

  // Filter customers based on search
  const filteredCustomers = customers.filter((c) => {
    if (!activeSearch) return true;
    const q = activeSearch.toLowerCase();
    return (
      (c.customer_name && c.customer_name.toLowerCase().includes(q)) ||
      (c.contact_number && c.contact_number.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      c.customer_id.toString().includes(q)
    );
  });

  const selectedCustomer = customers.find((c) => c.customer_id === selectedCustomerId);
  const selectedCustomerSales = selectedCustomer
    ? sales.filter((s) => (s.customer?.customer_id || s.customer) === selectedCustomer.customer_id)
    : [];

  const handleExportCSV = () => {
    const dataToExport = filteredCustomers.map((c) => {
      const stat = customerStats[c.customer_id] || { totalSpent: 0, ordersCount: 0, totalKg: 0 };
      return {
        'Customer ID': c.customer_id,
        'Customer Name': c.customer_name,
        'Contact Number': c.contact_number,
        Email: c.email || 'N/A',
        Address: c.address || 'N/A',
        'Total Orders': stat.ordersCount,
        'Lifetime Value (INR)': stat.totalSpent,
        'Total Birds Bought (Kg)': stat.totalKg.toFixed(2),
        'Last Purchase': stat.lastOrderDate || 'None'
      };
    });
    exportToCSV('CoopOS_Customers_CRM', dataToExport);
  };

  return (
    <div className="space-y-6">
      {/* Top CRM Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Commercial Buyer Accounts & Client Ledger
          </h2>
          <p className="text-xs text-slate-400">
            {customers.length} registered business buyers, wholesale traders, and retail accounts
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search buyers, phone..."
              className="w-full bg-slate-50 text-xs text-slate-800 placeholder-slate-400 pl-8 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportCsv}</span>
          </button>
          <button
            onClick={() => openModal('customer')}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.newCustomer}</span>
          </button>
        </div>
      </div>

      {/* Customer CRM Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredCustomers.map((c) => {
          const stat = customerStats[c.customer_id] || {
            totalSpent: 0,
            ordersCount: 0,
            totalHens: 0,
            totalRoosters: 0,
            totalKg: 0,
            lastOrderDate: null
          };
          const cleanPhone = c.contact_number?.replace(/\D/g, '') || '';

          return (
            <div
              key={c.customer_id}
              onClick={() => setSelectedCustomerId(c.customer_id)}
              className={`bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between ${
                selectedCustomerId === c.customer_id
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                  : 'border-slate-200/90'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {c.customer_name ? c.customer_name.slice(0, 2).toUpperCase() : 'CU'}
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {c.customer_name}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">
                        ID: #{c.customer_id}
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
                      className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {stat.ordersCount} Orders
                    </span>
                  </div>
                </div>

                {/* Contact Links */}
                <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {c.contact_number}
                    </span>
                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${c.contact_number}`}
                        onClick={(e) => e.stopPropagation()}
                        title="Call"
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      {cleanPhone && (
                        <a
                          href={`https://wa.me/91${cleanPhone.slice(-10)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="WhatsApp"
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
                  {c.address && c.address !== 'none' && (
                    <div className="flex items-center gap-1.5 text-slate-500 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.address}</span>
                    </div>
                  )}
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs mb-4">
                  <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-700 font-bold uppercase block">
                      Lifetime Spend
                    </span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      {formatCurrency(stat.totalSpent)}
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">
                      Total Birds Bought
                    </span>
                    <span className="text-sm font-black text-slate-800 font-mono">
                      {formatNumber(stat.totalHens + stat.totalRoosters)}
                      {stat.totalKg > 0 && <span className="text-[10px] text-slate-400 font-normal"> ({stat.totalKg}kg)</span>}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  Last purchase: {stat.lastOrderDate ? formatDate(stat.lastOrderDate) : 'Never'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCustomerId(c.customer_id);
                  }}
                  className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                >
                  <span>Orders Ledger</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/50 backdrop-blur-xs no-print">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Top */}
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
                      Account #{selectedCustomer.customer_id} • {selectedCustomer.contact_number}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomerId(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-6 space-y-6">
                {/* Contact Card */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-bold text-slate-800 font-mono">{selectedCustomer.contact_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-semibold text-slate-700">{selectedCustomer.email || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Billing Address:</span>
                    <span className="font-semibold text-slate-700 text-right max-w-[280px]">
                      {selectedCustomer.address || 'Farm Walk-in Customer'}
                    </span>
                  </div>
                </div>

                {/* Purchase Summary */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">Lifetime LTV</span>
                    <span className="text-base font-black text-emerald-700 font-mono">
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
                    <span className="text-base font-black text-sky-700 font-mono">
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
                      className="text-xs font-bold text-emerald-600 hover:underline"
                    >
                      + Create Sale for this Client
                    </button>
                  </div>

                  {selectedCustomerSales.length > 0 ? (
                    <div className="space-y-2">
                      {selectedCustomerSales.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="bg-slate-100 text-slate-700 font-mono font-bold px-1.5 py-0.5 rounded text-[10px]">
                                Batch #{s.batch?.batch_no || s.batch}
                              </span>
                              <span className="font-semibold text-slate-800">{formatDate(s.date)}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {s.no_of_hens} Hens, {s.no_of_roosters} Roosters {s.kg ? `• ${s.kg} Kg` : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold font-mono text-emerald-600 text-sm">
                              +{formatCurrency(s.amount)}
                            </span>
                            <button
                              onClick={() => onPrintInvoice(s)}
                              title="Print Invoice / Cash Memo"
                              className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
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
                className="text-xs font-bold bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-xl shadow-xs transition"
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
