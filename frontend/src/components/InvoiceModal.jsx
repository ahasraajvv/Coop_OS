import React from 'react';
import { FileText, X, Printer, CheckCircle2 } from 'lucide-react';
import { formatCurrency, formatDate, CUSTOMER_CATEGORIES } from '../utils';

export default function InvoiceModal({ sale, customers = [], onClose }) {
  if (!sale) return null;

  const totalBirds = (Number(sale.no_of_hens) || 0) + (Number(sale.no_of_roosters) || 0);
  const kg = Number(sale.kg) || 0;
  const ratePerKg = kg > 0 ? (Number(sale.amount) || 0) / kg : 0;
  const batchNo = sale.batch?.batch_no || sale.batch || '-';
  
  // Resolve customer object properly whether it is a nested object, customer ID number, or empty
  const customer =
    typeof sale.customer === 'object' && sale.customer !== null
      ? sale.customer
      : customers.find(
          (c) =>
            c.customer_id === sale.customer ||
            c.id === sale.customer ||
            c.customer_id?.toString() === sale.customer?.toString()
        ) || {};

  const handlePrint = () => {
    window.print();
  };

  const invoiceNum = sale.id ? sale.id.toString().padStart(4, '0') : 'NEW';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Top Modal Controls */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="font-extrabold text-sm tracking-wide">
              Official Tax Invoice / Cash Memo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-8 space-y-6 text-slate-800 bg-white">
          {/* Farm Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-emerald-700" />
                <h1 className="text-xl font-black tracking-tight text-slate-900">
                  COOP-OS COMMERCIAL POULTRY FARM
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Integrated Commercial Broiler & Country Chicken Hatchery
              </p>
              <p className="text-xs text-slate-500">
                Farm Gate: SF-142, Poultry Corridor, Tamil Nadu • Phone: +91 98421 00000
              </p>
            </div>
            <div className="text-right">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md inline-block mb-1 border ${
                sale.sale_type === 'breeding'
                  ? 'text-amber-800 bg-amber-50 border-amber-200'
                  : 'text-emerald-700 bg-emerald-50 border-emerald-200'
              }`}>
                {sale.sale_type === 'breeding' ? '🐣 Breeding Stock Memo' : '🥩 Meat Cash Memo / Invoice'}
              </span>
              <p className="font-mono font-bold text-sm text-slate-900">
                #INV-{invoiceNum}
              </p>
              <p className="text-xs text-slate-500 font-mono">Date: {formatDate(sale.date)}</p>
            </div>
          </div>

          {/* Bill To & Batch Info */}
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To (Customer):
              </span>
              <h3 className="text-sm font-bold text-slate-900">
                {customer.customer_name || 'Walk-in Farm Buyer'}
              </h3>
              {customer.category && (
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {CUSTOMER_CATEGORIES[customer.category]?.icon || '🏷️'} {CUSTOMER_CATEGORIES[customer.category]?.label || customer.category}
                  {customer.sub_category ? ` • ${customer.sub_category}` : ''}
                </p>
              )}
              {customer.contact_number && (
                <p className="text-slate-600 font-mono mt-0.5">Phone: {customer.contact_number}</p>
              )}
              {customer.email && customer.email !== 'no-email@farm.com' && (
                <p className="text-slate-600 mt-0.5">Email: {customer.email}</p>
              )}
              {customer.address && customer.address !== 'none' && (
                <p className="text-slate-600 mt-0.5">{customer.address}</p>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Lot & Dispatch Origin:
              </span>
              <p className="font-bold text-slate-800">Flock Batch #{batchNo}</p>
              <p className="text-slate-600 mt-0.5">Payment Mode: {sale.payment_method === 'gpay' ? '📱 GPay / UPI Transfer' : '💵 Cash in Hand'}</p>
              <p className="text-emerald-700 font-semibold mt-1 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Payment Received in Full
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-4">Item Description</th>
                  <th className="py-2.5 px-4 text-center">Category</th>
                  <th className="py-2.5 px-4 text-center">Hens</th>
                  <th className="py-2.5 px-4 text-center">Roosters</th>
                  <th className="py-2.5 px-4 text-center">Total Birds</th>
                  <th className="py-2.5 px-4 text-right">Weighed Kg</th>
                  <th className="py-2.5 px-4 text-right">{sale.sale_type === 'breeding' ? 'Rate / Bird' : 'Rate / Kg'}</th>
                  <th className="py-2.5 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {sale.sale_type === 'breeding' ? 'Selected Flock - Breeding Stock (இனப்பெருக்கம்)' : 'Commercial Live Birds - Meat Purpose (இறைச்சி)'}
                    <div className="text-[10px] text-slate-400 font-normal">Flock Batch #{batchNo}</div>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      sale.sale_type === 'breeding'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200'
                    }`}>
                      {sale.sale_type === 'breeding' ? '🐣 Breeding' : '🥩 Meat'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono">{sale.no_of_hens ?? 0}</td>
                  <td className="py-3.5 px-4 text-center font-mono">{sale.no_of_roosters ?? 0}</td>
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-900">
                    {totalBirds}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold">
                    {kg > 0 ? `${kg.toFixed(2)} kg` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-bold">
                    {sale.sale_type === 'breeding'
                      ? sale.price_per_bird
                        ? formatCurrency(sale.price_per_bird)
                        : totalBirds > 0 ? formatCurrency((Number(sale.amount) || 0) / totalBirds) : '-'
                      : ratePerKg > 0 ? formatCurrency(ratePerKg) : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                    {formatCurrency(sale.amount)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals & Signatures */}
          <div className="flex justify-between items-end pt-4">
            <div className="text-xs text-slate-500 max-w-xs space-y-1">
              <p className="font-semibold text-slate-700">Terms & Conditions:</p>
              <p>1. Goods once inspected, weighed, and delivered cannot be returned.</p>
              <p>2. Live weight recorded at farm weighing bridge.</p>
            </div>

            <div className="text-right space-y-2">
              <div className="bg-emerald-50 px-5 py-3 rounded-2xl border border-emerald-200">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                  Total Payable / Paid:
                </span>
                <span className="text-2xl font-black font-mono text-emerald-700">
                  {formatCurrency(sale.amount)}
                </span>
              </div>
              <div className="pt-6">
                <p className="text-xs font-bold text-slate-800">For CoopOS Poultry Farm</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Authorized Signatory / Manager</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 no-print">
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-800 px-4 py-2 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Invoice</span>
          </button>
        </div>
      </div>
    </div>
  );
}
