import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Layers,
  Users,
  ShoppingCart,
  Receipt,
  HeartPulse,
  Calculator,
  UserPlus,
  DollarSign,
  Tag,
  Store,
  Briefcase,
  Scale,
  Warehouse,
  RotateCcw,
  Printer,
  Share2,
  Check,
  CheckCircle2,
  Keyboard
} from 'lucide-react';
import {
  MORTALITY_REASONS,
  EXPENSE_CATEGORIES,
  INFRA_CATEGORIES,
  CUSTOMER_CATEGORIES,
  CUSTOMER_CATEGORY_LIST,
  getAllSubCategoriesForCategory,
  saveCustomSubCategory,
  formatCurrency,
  formatDate,
  formatNumber,
  translations
} from '../utils';

// =========================================================================
// 1. ADD / EDIT BATCH MODAL
// =========================================================================
export function AddBatchModal({ isOpen, onClose, onSubmit, batches = [], initialData }) {
  const isEditing = Boolean(initialData?.batch_no);
  const nextBatchSuggestion =
    batches && batches.length > 0
      ? Math.max(...batches.map((b) => Number(b.batch_no) || 0)) + 1
      : 1;

  const [batchNo, setBatchNo] = useState(initialData?.batch_no ?? nextBatchSuggestion);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [noOfChicks, setNoOfChicks] = useState(initialData?.no_of_chicks ?? 250);
  const [buyingPrice, setBuyingPrice] = useState(initialData?.buying_price ?? 12500);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setBatchNo(initialData.batch_no);
      setDate(initialData.date || new Date().toISOString().slice(0, 10));
      setNoOfChicks(initialData.no_of_chicks ?? 250);
      setBuyingPrice(initialData.buying_price ?? 12500);
    } else {
      setBatchNo(nextBatchSuggestion);
      setDate(new Date().toISOString().slice(0, 10));
      setNoOfChicks(250);
      setBuyingPrice(12500);
    }
  }, [initialData, isOpen, nextBatchSuggestion]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({
        isEditing,
        batch_no: parseInt(batchNo),
        date,
        no_of_chicks: parseInt(noOfChicks),
        buying_price: parseFloat(buyingPrice)
      });
      onClose();
    } catch (err) {
      alert('Error saving batch: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-extrabold text-slate-900">
              {isEditing ? `Edit Flock Batch #${batchNo}` : 'Add New Commercial Flock Batch'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Batch Number *</label>
              <input
                type="number"
                required
                disabled={isEditing}
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                className={`w-full border rounded-xl p-2.5 font-mono font-bold ${
                  isEditing
                    ? 'bg-slate-100 text-slate-500 border-slate-200'
                    : 'bg-slate-50 text-slate-800 border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500'
                }`}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Day-old Chicks Count *</label>
              <input
                type="number"
                min="1"
                required
                value={noOfChicks}
                onChange={(e) => setNoOfChicks(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Purchase Cost (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={buyingPrice}
                onChange={(e) => setBuyingPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3 rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Saving Batch...' : isEditing ? 'Update Batch Details' : 'Save Flock Batch Entry'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// 2. CREATE / EDIT SALE MODAL
// =========================================================================
export function CreateSaleModal({
  isOpen,
  onClose,
  onSubmit,
  batches = [],
  customers = [],
  batchMetrics = {},
  openQuickCustomerModal,
  initialData
}) {
  const isEditing = Boolean(initialData?.id);
  const defaultBatchNo = batches && batches.length > 0 ? batches[0]?.batch_no || '' : '';

  const [saleType, setSaleType] = useState(initialData?.sale_type || 'meat');
  const [paymentMethod, setPaymentMethod] = useState(initialData?.payment_method || 'cash');
  const [batch, setBatch] = useState(
    initialData?.batch?.batch_no || initialData?.batch || defaultBatchNo
  );
  const [customer, setCustomer] = useState(
    initialData?.customer?.customer_id ||
      (typeof initialData?.customer === 'number' ? initialData.customer : '') ||
      ''
  );
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [hens, setHens] = useState(initialData?.no_of_hens ?? 10);
  const [roosters, setRoosters] = useState(initialData?.no_of_roosters ?? 10);
  const [kg, setKg] = useState(initialData?.kg || '');
  const [pricePerKg, setPricePerKg] = useState('');
  const [pricePerBird, setPricePerBird] = useState(initialData?.price_per_bird || '');
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [loading, setLoading] = useState(false);

  // Auto-calculate amount when relevant inputs change
  useEffect(() => {
    if (saleType === 'meat') {
      const k = parseFloat(kg) || 0;
      const p = parseFloat(pricePerKg) || 0;
      if (k > 0 && p > 0) {
        setAmount((k * p).toFixed(2));
      }
    } else {
      const totalBirds = (parseInt(hens) || 0) + (parseInt(roosters) || 0);
      const pb = parseFloat(pricePerBird) || 0;
      if (totalBirds > 0 && pb > 0) {
        setAmount((totalBirds * pb).toFixed(2));
      }
    }
  }, [saleType, kg, pricePerKg, hens, roosters, pricePerBird]);

  // Synchronize form fields when opening or switching initialData
  useEffect(() => {
    if (initialData) {
      setSaleType(initialData.sale_type || 'meat');
      setPaymentMethod(initialData.payment_method || 'cash');
      setBatch(initialData.batch?.batch_no || initialData.batch || defaultBatchNo);
      setCustomer(
        initialData.customer?.customer_id ||
          (typeof initialData.customer === 'number' ? initialData.customer : '') ||
          ''
      );
      setDate(initialData.date || new Date().toISOString().slice(0, 10));
      setHens(initialData.no_of_hens ?? 10);
      setRoosters(initialData.no_of_roosters ?? 10);
      setKg(initialData.kg || '');
      setAmount(initialData.amount || '');
      setPricePerBird(initialData.price_per_bird || '');
      if (initialData.price_per_kg) {
        setPricePerKg(initialData.price_per_kg);
      } else if (initialData.kg && initialData.amount && Number(initialData.kg) > 0) {
        setPricePerKg((Number(initialData.amount) / Number(initialData.kg)).toFixed(2));
      } else {
        setPricePerKg('');
      }
    } else {
      setSaleType('meat');
      setPaymentMethod('cash');
      setBatch(defaultBatchNo);
      setCustomer('');
      setDate(new Date().toISOString().slice(0, 10));
      setHens(10);
      setRoosters(10);
      setKg('');
      setPricePerKg('');
      setPricePerBird('');
      setAmount('');
    }
  }, [initialData, isOpen, defaultBatchNo]);

  // Keyboard shortcut listener (Esc to close)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleReset = () => {
    setSaleType('meat');
    setPaymentMethod('cash');
    setBatch(defaultBatchNo);
    setCustomer('');
    setDate(new Date().toISOString().slice(0, 10));
    setHens(10);
    setRoosters(10);
    setKg('');
    setPricePerKg('');
    setPricePerBird('');
    setAmount('');
  };

  const selectedMetrics = batch && batchMetrics ? batchMetrics[batch] || {} : null;
  const remainingChicks = selectedMetrics?.mortality?.Remaining_chicks;
  const totalBirds = (parseInt(hens) || 0) + (parseInt(roosters) || 0);
  const remainingInShed = typeof remainingChicks === 'number'
    ? Math.max(0, remainingChicks - totalBirds)
    : null;
  const avgWeightPerBird = (totalBirds > 0 && parseFloat(kg) > 0)
    ? (parseFloat(kg) / totalBirds).toFixed(2)
    : null;

  const selectedCustomer = useMemo(() => {
    if (!customer) return null;
    return customers.find((c) => String(c.customer_id) === String(customer)) || null;
  }, [customer, customers]);

  const selectedCustomerCategory = selectedCustomer
    ? CUSTOMER_CATEGORIES[selectedCustomer.category] || CUSTOMER_CATEGORIES.individual
    : null;

  const selectedBatchObj = useMemo(() => {
    return batches.find((b) => String(b.batch_no) === String(batch)) || null;
  }, [batch, batches]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!batch) {
      alert('Please select a valid batch.');
      return;
    }
    if (Number(hens) + Number(roosters) <= 0) {
      alert('Total hens and roosters must be greater than zero.');
      return;
    }
    if (saleType === 'meat' && (!kg || parseFloat(kg) <= 0)) {
      alert('Please enter total live weight in Kg for meat sales.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid Total Sale Amount.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        id: initialData?.id,
        batch: parseInt(batch),
        customer: customer ? parseInt(customer) : null,
        date,
        sale_type: saleType,
        payment_method: paymentMethod,
        no_of_hens: parseInt(hens) || 0,
        no_of_roosters: parseInt(roosters) || 0,
        kg: kg ? parseFloat(kg) : null,
        price_per_kg: pricePerKg ? parseFloat(pricePerKg) : null,
        price_per_bird: pricePerBird ? parseFloat(pricePerBird) : null,
        amount: parseFloat(amount)
      });
      if (initialData?.id) {
        onClose();
      }
    } catch (err) {
      alert('Error saving sale: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWhatsApp = () => {
    const custName = selectedCustomer ? selectedCustomer.customer_name : 'Valued Customer';
    const text = encodeURIComponent(
      `*V.V.A பெருவிடை நாட்டுக்கோழி பண்ணை*\n` +
      `🧾 Invoice: #INV-${initialData?.id || 'DRAFT'}\n` +
      `📅 Date: ${date}\n` +
      `👤 Buyer: ${custName}\n` +
      `📦 Batch #${batch} (${saleType === 'meat' ? 'Meat' : 'Breeding'})\n` +
      `🐔 Birds: ${totalBirds} (${hens}H / ${roosters}R)\n` +
      (saleType === 'meat' ? `⚖️ Weight: ${kg} kg @ ₹${pricePerKg}/kg\n` : `🐣 Rate: ₹${pricePerBird}/bird\n`) +
      `💰 Total: ₹${amount}\n` +
      `💳 Mode: ${paymentMethod === 'gpay' ? 'GPay / UPI' : 'Cash'}\n` +
      `Thank you!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        
        {/* ================= MODAL HEADER BAR ================= */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center font-black text-white text-base shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold tracking-tight text-white">
                  {isEditing ? `Edit Commercial Bird Sale #INV-${initialData.id}` : 'Farm Gate Weigh-Bridge & Sales Dispatch Board'}
                </h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                  {isEditing ? `#INV-${initialData.id}` : '#INV-Draft'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                V.V.A பெருவிடை நாட்டுக்கோழி பண்ணை • Point of Sale Workstation
              </p>
            </div>
          </div>

          {/* Quick Flock Status Capsule & Modal Actions */}
          <div className="flex items-center gap-3">
            {remainingChicks !== undefined && (
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-xl">
                <Warehouse className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] text-slate-300">Flock In Shed:</span>
                <strong className="text-xs font-mono font-black text-emerald-400">
                  {remainingChicks} birds
                </strong>
                <span className="text-[10px] text-slate-500">(Batch #{batch})</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
              title="Reset fields to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ================= 2-WING HORIZONTAL BOARD BODY ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* ================= LEFT WING: ERGONOMIC HORIZONTAL INPUT WORKSTATION (8 Cols) ================= */}
          <form onSubmit={handleSubmit} className="lg:col-span-8 p-4 sm:p-5 space-y-3 bg-slate-50/50 text-xs">
            
            {/* SECTION 1: FLOCK SCOPE & SALE PURPOSE ROW */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">1</span>
                  <span>Flock Scope &amp; Sale Purpose (நோக்கம் &amp; தொகுதி) *</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Step 1 of 4</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Batch Selection */}
                <div className="sm:col-span-4">
                  <label className="block font-bold text-slate-700 mb-1 text-[10.5px]">Select Flock / Batch *</label>
                  <select
                    required
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="">-- Choose Batch --</option>
                    {batches.map((b) => (
                      <option key={b.batch_no} value={b.batch_no}>
                        Batch #{b.batch_no} ({b.no_of_chicks} chicks)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dispatch Date */}
                <div className="sm:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1 text-[10.5px]">Dispatch Date *</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
                  />
                </div>

                {/* Purpose Selector (Meat vs Breeding) */}
                <div className="sm:col-span-5">
                  <label className="block font-bold text-slate-700 mb-1 text-[10.5px]">Sale Purpose / Billing Mode *</label>
                  <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setSaleType('meat')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                        saleType === 'meat'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🥩</span>
                      <span>Meat (₹/kg)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSaleType('breeding')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                        saleType === 'breeding'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>🐣</span>
                      <span>Breeding (₹/bird)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 2: BUYER & CUSTOMER ROW */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">2</span>
                  <span>Buyer Profile &amp; CRM Account (வாடிக்கையாளர்)</span>
                </span>
                {openQuickCustomerModal && (
                  <button
                    type="button"
                    onClick={openQuickCustomerModal}
                    className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>+ Quick Add Buyer</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Customer Dropdown */}
                <div className="sm:col-span-7">
                  <label className="block font-bold text-slate-700 mb-1 text-[10.5px]">Customer / Account Name</label>
                  <select
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 focus:bg-white transition cursor-pointer"
                  >
                    <option value="">👤 Farm Gate Walk-in Cash Buyer (Retail Counter)</option>
                    {customers.map((c) => {
                      const catInfo = CUSTOMER_CATEGORIES[c.category] || CUSTOMER_CATEGORIES.individual;
                      const subStr = c.sub_category ? ` • ${c.sub_category}` : '';
                      return (
                        <option key={c.customer_id} value={c.customer_id}>
                          {catInfo.icon} {c.customer_name} ({catInfo.label}{subStr}) {c.contact_number ? `— ${c.contact_number}` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Customer Meta Info Pill */}
                <div className="sm:col-span-5">
                  <label className="block font-bold text-slate-500 mb-1 text-[10.5px]">Tier / Price Category</label>
                  <div className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium truncate">
                      {selectedCustomer ? (
                        <span className="flex items-center gap-1">
                          <span>{selectedCustomerCategory?.icon}</span>
                          <span>{selectedCustomerCategory?.label || 'Account'}</span>
                          {selectedCustomer.sub_category && <span className="text-slate-400">• {selectedCustomer.sub_category}</span>}
                        </span>
                      ) : (
                        'Walk-In Counter Buyer'
                      )}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded whitespace-nowrap">
                      {selectedCustomer?.contact_number ? selectedCustomer.contact_number : 'Cash Counter'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: WEIGHBRIDGE & FLOCK TALLY ROW */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">3</span>
                  <span>Weigh-Bridge &amp; Head-Count Metrics (எடை &amp; எண்ணிக்கைகள்)</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Certified Weighing
                </span>
              </div>

              {/* 4 Horizontal Metric Columns Side-by-Side */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Hens Input */}
                <div className="p-2 bg-slate-50/70 border border-slate-200 rounded-xl space-y-0.5">
                  <label className="block font-bold text-slate-700 text-[10.5px]">Hens (பெட்டை)</label>
                  <input
                    type="number"
                    min="0"
                    value={hens}
                    onChange={(e) => setHens(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono font-black text-slate-900 text-xs text-center focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[9.5px] text-slate-400 text-center font-medium">Female birds</p>
                </div>

                {/* Roosters Input */}
                <div className="p-2 bg-slate-50/70 border border-slate-200 rounded-xl space-y-0.5">
                  <label className="block font-bold text-slate-700 text-[10.5px]">Roosters (சேவல்)</label>
                  <input
                    type="number"
                    min="0"
                    value={roosters}
                    onChange={(e) => setRoosters(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-mono font-black text-slate-900 text-xs text-center focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[9.5px] text-slate-400 text-center font-medium">Male birds</p>
                </div>

                {/* Total Birds Count */}
                <div className="p-2 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-0.5 text-center">
                  <span className="block font-bold text-emerald-900 text-[10.5px]">Total Head Count</span>
                  <div className="font-mono font-black text-base text-emerald-800 pt-0.5">{totalBirds}</div>
                  <p className="text-[9.5px] text-emerald-700 font-medium">Birds Dispatched</p>
                </div>

                {/* Live Shed Balance Impact */}
                <div className="p-2 bg-slate-100/70 border border-slate-200 rounded-xl space-y-0.5 text-center">
                  <span className="block font-bold text-slate-600 text-[10.5px]">Remaining in Shed</span>
                  <div className="font-mono font-black text-base text-slate-800 pt-0.5">
                    {remainingInShed !== null ? remainingInShed : '—'}
                  </div>
                  <p className="text-[9.5px] text-slate-500 font-medium">After this dispatch</p>
                </div>
              </div>

              {/* Dynamic Weight & Rate Fields */}
              {saleType === 'meat' ? (
                <div className="p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-rose-900">
                    <span className="flex items-center gap-1.5">
                      <span>🥩</span> Meat Weighbridge Measurements &amp; Rate
                    </span>
                    <span className="font-mono font-normal text-slate-600 text-[10px]">
                      Average Bird Weight: <b className="text-rose-900 font-mono">{avgWeightPerBird ? `${avgWeightPerBird} kg / bird` : '—'}</b>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                    {/* Total Net Weight */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5 text-[10.5px]">Total Net Weight (Kg) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 42.0"
                          value={kg}
                          onChange={(e) => setKg(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-black text-slate-900 text-xs focus:ring-2 focus:ring-rose-500"
                        />
                        <span className="absolute inset-y-0 right-2.5 flex items-center font-bold text-slate-400 text-[11px]">KG</span>
                      </div>
                    </div>

                    {/* Market Rate per Kg */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5 text-[10.5px]">Market Rate (₹ / Kg) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 215"
                          value={pricePerKg}
                          onChange={(e) => setPricePerKg(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-black text-slate-900 text-xs focus:ring-2 focus:ring-rose-500"
                        />
                        <span className="absolute inset-y-0 right-2.5 flex items-center font-bold text-slate-400 text-[11px]">₹ / kg</span>
                      </div>
                    </div>

                    {/* Live Computed Realization */}
                    <div className="bg-white p-2 rounded-xl border border-rose-200 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Live Realization</span>
                      <div className="font-mono font-black text-base text-rose-900">
                        {amount ? formatCurrency(amount) : '₹0.00'}
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-mono">
                        {kg && pricePerKg ? `${kg} kg × ₹${pricePerKg}` : 'Pending inputs'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-2.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-[10.5px] font-bold text-amber-900">
                    <span className="flex items-center gap-1.5">
                      <span>🐣</span> Breeding Stock Selected Head Pricing
                    </span>
                    <span className="font-mono font-normal text-slate-600 text-[10px]">Premium Breeder Stock</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
                    {/* Price per Bird */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5 text-[10.5px]">Price Per Head (₹ / Bird) *</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          placeholder="e.g. 650"
                          value={pricePerBird}
                          onChange={(e) => setPricePerBird(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-black text-slate-900 text-xs focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="absolute inset-y-0 right-2.5 flex items-center font-bold text-slate-400 text-[11px]">₹ / bird</span>
                      </div>
                    </div>

                    {/* Optional Weight */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-0.5 text-[10.5px]">Recorded Weight (Kg, Optional)</label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="e.g. 38.5"
                          value={kg}
                          onChange={(e) => setKg(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2 font-mono font-medium text-slate-700 text-xs focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="absolute inset-y-0 right-2.5 flex items-center font-bold text-slate-400 text-[11px]">KG</span>
                      </div>
                    </div>

                    {/* Live Computed Realization */}
                    <div className="bg-white p-2 rounded-xl border border-amber-200 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Live Realization</span>
                      <div className="font-mono font-black text-base text-amber-900">
                        {amount ? formatCurrency(amount) : '₹0.00'}
                      </div>
                      <span className="text-[9.5px] text-slate-400 font-mono">
                        {totalBirds > 0 && pricePerBird ? `${totalBirds} birds × ₹${pricePerBird}` : 'Pending inputs'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: PAYMENT METHOD & FINAL SETTLEMENT ROW */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">4</span>
                  <span>Payment Settlement &amp; Billing (கட்டண முறை) *</span>
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">Instant Invoice Generation</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                {/* Payment Mode Selector */}
                <div className="sm:col-span-6">
                  <label className="block font-bold text-slate-700 mb-1 text-[10.5px]">Payment Mode *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex items-center gap-2 p-2 rounded-xl border-2 transition text-left cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-500 bg-emerald-50/70 text-slate-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg">💵</span>
                      <div>
                        <div className="font-bold text-xs text-emerald-950">Cash (ரொக்கம்)</div>
                        <div className="text-[9.5px] text-emerald-700">Direct Hand Cash</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('gpay')}
                      className={`flex items-center gap-2 p-2 rounded-xl border-2 transition text-left cursor-pointer ${
                        paymentMethod === 'gpay'
                          ? 'border-blue-500 bg-blue-50/70 text-slate-900 shadow-xs'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-lg">📱</span>
                      <div>
                        <div className="font-bold text-xs text-slate-800">GPay / UPI (ஜிபே)</div>
                        <div className="text-[9.5px] text-slate-500">Digital Transfer</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Final Total Amount Input */}
                <div className="sm:col-span-6 flex flex-col justify-end space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-700 text-[10.5px]">Total Sale Value (₹) *</label>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                      {saleType === 'meat' && kg && amount && parseFloat(kg) > 0
                        ? `Rate: ₹${(parseFloat(amount) / parseFloat(kg)).toFixed(2)}/kg`
                        : saleType === 'breeding' && totalBirds > 0 && amount
                        ? `Rate: ₹${(parseFloat(amount) / totalBirds).toFixed(2)}/bird`
                        : 'Auto-Calculated'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="e.g. 9500"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-mono font-black text-lg text-emerald-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center font-bold text-emerald-800 text-xs">INR ₹</span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS ROW */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-slate-500 text-[10.5px]">
                  <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    Press <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[9px] font-bold">Enter</kbd> to save &bull; <kbd className="px-1 py-0.5 bg-slate-200 rounded text-slate-700 font-mono text-[9px] font-bold">Esc</kbd> to exit
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold transition text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition text-xs flex items-center gap-1.5 shadow-md shadow-emerald-700/20 active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : isEditing ? 'Update Sale Details' : 'Confirm Sale & Update Shed'}</span>
                  </button>
                </div>
              </div>
            </div>

          </form>

          {/* ================= RIGHT WING: REAL-TIME LIVE INVOICE DOCKET PREVIEW (4 Cols) ================= */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-slate-100/70 flex flex-col justify-between space-y-3">
            
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-[11px] uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Live Weigh-Slip &amp; Tax Invoice</span>
                </span>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[9.5px] font-bold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                  Real-Time Sync
                </span>
              </div>

              {/* TICKET / SLIP SIMULATION CARD */}
              <div className="bg-white rounded-2xl border border-slate-300 p-3.5 shadow-sm space-y-2.5 font-mono text-[10.5px]">
                
                {/* Farm Gate Header */}
                <div className="text-center pb-1.5 border-b border-dashed border-slate-300">
                  <div className="font-sans font-black text-slate-900 text-xs tracking-tight">V.V.A பெருவிடை பண்ணை</div>
                  <div className="text-[9px] text-slate-500 font-sans">Farm Gate Commercial Sales Register</div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">GST / Farm Reg: TN-AGRI-0428</div>
                </div>

                {/* Invoice Meta */}
                <div className="flex justify-between text-[10px] text-slate-600 pb-1 border-b border-slate-200">
                  <div>
                    <span>Invoice: </span>
                    <strong className="text-slate-900">#{isEditing ? `INV-${initialData.id}` : 'INV-DRAFT'}</strong>
                  </div>
                  <div>
                    <span>{date ? formatDate(date) : formatDate(new Date())}</span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-0.5 font-sans">
                  <div className="text-[9.5px] uppercase font-bold text-slate-400">Buyer Account</div>
                  <div className="font-bold text-slate-900 text-xs">
                    {selectedCustomer ? selectedCustomer.customer_name : 'Farm-Gate Walk-In Cash Buyer'}
                  </div>
                  <div className="text-[9.5px] text-slate-500 font-mono">
                    {selectedCustomer?.contact_number || (selectedCustomerCategory?.label ? `${selectedCustomerCategory.label} Counter` : 'Retail Counter Sale')}
                  </div>
                </div>

                {/* Itemized Breakdown Table */}
                <div className="pt-0.5">
                  <table className="w-full text-left border-collapse text-[10px]">
                    <thead>
                      <tr className="border-b border-slate-300 text-slate-500 font-bold">
                        <th className="py-0.5">Description</th>
                        <th className="py-0.5 text-center">Qty</th>
                        <th className="py-0.5 text-right">Rate</th>
                        <th className="py-0.5 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-1 font-sans">
                          <div className="font-bold text-slate-800">
                            {selectedBatchObj ? `Batch #${batch}` : `Batch #${batch}`}
                          </div>
                          <div className="text-[9px] text-slate-500 font-mono">
                            {saleType === 'meat' ? `Meat (${totalBirds} birds: ${hens}H/${roosters}R)` : `Breeding (${totalBirds} birds)`}
                          </div>
                        </td>
                        <td className="py-1 text-center font-bold text-slate-700">
                          {saleType === 'meat' ? (kg ? `${kg} kg` : '0 kg') : `${totalBirds} birds`}
                        </td>
                        <td className="py-1 text-right font-bold text-slate-700">
                          {saleType === 'meat' ? `₹${pricePerKg || '0'}/kg` : `₹${pricePerBird || '0'}/b`}
                        </td>
                        <td className="py-1 text-right font-black text-slate-900">
                          {amount ? formatCurrency(amount) : '₹0'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Weighbridge Verification Box */}
                <div className="p-1.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5 font-sans text-[10px]">
                  <div className="flex justify-between text-slate-600">
                    <span>Average Live Carcass:</span>
                    <strong className="font-mono text-slate-900">
                      {avgWeightPerBird ? `${avgWeightPerBird} kg / bird` : '—'}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Payment Mode:</span>
                    <strong className={`font-mono font-bold ${paymentMethod === 'gpay' ? 'text-blue-700' : 'text-emerald-700'}`}>
                      {paymentMethod === 'gpay' ? 'GPay / UPI (Digital)' : 'Cash (Paid in Full)'}
                    </strong>
                  </div>
                </div>

                {/* Net Total Banner */}
                <div className="pt-1.5 border-t-2 border-slate-800 flex justify-between items-baseline font-mono">
                  <span className="text-[11px] uppercase font-extrabold text-slate-900 font-sans">Grand Total:</span>
                  <span className="text-lg font-black text-emerald-700 font-mono">
                    {amount ? formatCurrency(amount) : '₹0.00'}
                  </span>
                </div>

                {/* Barcode Simulation */}
                <div className="pt-1 text-center border-t border-dashed border-slate-300">
                  <div className="font-mono text-[8.5px] text-slate-400">||| | ||||| |||| || |||||| | |||| |||</div>
                  <div className="text-[8.5px] text-slate-400 font-mono mt-0.5">THANK YOU • COME AGAIN</div>
                </div>

              </div>
            </div>

            {/* Quick Share / Info Actions */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Share Bill to WhatsApp</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

// =========================================================================
// 3. RECORD / EDIT EXPENSE MODAL
// =========================================================================
export function RecordExpenseModal({ isOpen, onClose, onSubmit, batches = [], initialData }) {
  const isEditing = Boolean(initialData?.id);
  const defaultBatch = batches && batches.length > 0 ? batches[0]?.batch_no || '' : '';

  const [isInfra, setIsInfra] = useState(Boolean(initialData?.isInfra));
  const [batch, setBatch] = useState(initialData?.batch || defaultBatch);
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().slice(0, 10));
  const [expenseType, setExpenseType] = useState(
    initialData?.expense_type || (initialData?.isInfra ? INFRA_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
  );
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setIsInfra(Boolean(initialData.isInfra));
      setBatch(initialData.batch || defaultBatch);
      setDate(initialData.date || new Date().toISOString().slice(0, 10));
      setExpenseType(
        initialData.expense_type ||
          (initialData.isInfra ? INFRA_CATEGORIES[0] : EXPENSE_CATEGORIES[0])
      );
      setAmount(initialData.amount || '');
    } else {
      setIsInfra(false);
      setBatch(defaultBatch);
      setDate(new Date().toISOString().slice(0, 10));
      setExpenseType(EXPENSE_CATEGORIES[0]);
      setAmount('');
    }
  }, [initialData, isOpen, defaultBatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isInfra && !batch) {
      alert('Please select a valid flock batch.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid expense amount.');
      return;
    }

    setLoading(true);
    try {
      if (isInfra) {
        await onSubmit({
          id: initialData?.id,
          isInfra: true,
          date,
          expense_type: expenseType,
          amount: parseFloat(amount)
        });
      } else {
        await onSubmit({
          id: initialData?.id,
          isInfra: false,
          batch: parseInt(batch),
          date,
          expense_type: expenseType,
          amount: parseFloat(amount)
        });
      }
      onClose();
    } catch (err) {
      alert('Error saving expense: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-700" />
            <h3 className="text-sm font-extrabold text-slate-900">
              {isEditing ? 'Edit Farm Expense Outlay' : 'Record Farm Expense Outlay'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Expense Category Toggle (Batch vs Infra) */}
        <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsInfra(false);
              setExpenseType(EXPENSE_CATEGORIES[0]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              !isInfra ? 'bg-amber-600 text-white shadow-xs' : 'bg-white text-slate-600'
            }`}
          >
            Flock Batch Expense
          </button>
          <button
            type="button"
            onClick={() => {
              setIsInfra(true);
              setExpenseType(INFRA_CATEGORIES[0]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              isInfra ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600'
            }`}
          >
            Infrastructure Overhead
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {!isInfra && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Flock Batch *</label>
              <select
                required
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="">-- Choose Batch --</option>
                {batches.map((b) => (
                  <option key={b.batch_no} value={b.batch_no}>
                    Batch #{b.batch_no}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Expense Classification *</label>
            <input
              list="expense-categories-list"
              required
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
              placeholder="Select or type custom category..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <datalist id="expense-categories-list">
              {(isInfra ? INFRA_CATEGORIES : EXPENSE_CATEGORIES).map((cat, i) => (
                <option key={i} value={cat} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              placeholder="e.g. 3500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-black text-base text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold py-3 rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Recording...' : 'Save Expense Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// 4. ADD / EDIT CUSTOMER MODAL (With Background Categories & Custom Sub-Categories)
// =========================================================================
export function AddCustomerModal({ isOpen, onClose, onSubmit, customers = [], initialData }) {
  const isEditing = Boolean(initialData?.customer_id);
  const [customerName, setCustomerName] = useState(initialData?.customer_name || '');
  const [contactNumber, setContactNumber] = useState(initialData?.contact_number || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [category, setCategory] = useState(initialData?.category || 'restaurant');
  const [subCategory, setSubCategory] = useState(initialData?.sub_category || '');
  const [showAddCustomSub, setShowAddCustomSub] = useState(false);
  const [newCustomSubInput, setNewCustomSubInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customer_name || '');
      setContactNumber(initialData.contact_number || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
      setCategory(initialData.category || 'restaurant');
      setSubCategory(initialData.sub_category || '');
    } else {
      setCustomerName('');
      setContactNumber('');
      setEmail('');
      setAddress('');
      setCategory('restaurant');
      setSubCategory('');
    }
    setShowAddCustomSub(false);
    setNewCustomSubInput('');
  }, [initialData, isOpen]);

  // Dynamic available subcategories for selected category
  const availableSubCategories = useMemo(() => {
    return getAllSubCategoriesForCategory(category, customers);
  }, [category, customers, showAddCustomSub]);

  // When category changes and subCategory is not in the new category's list, suggest first
  const handleCategoryChange = (newCat) => {
    setCategory(newCat);
    const subList = getAllSubCategoriesForCategory(newCat, customers);
    if (subList.length > 0 && !subList.includes(subCategory)) {
      setSubCategory(subList[0]);
    }
    setShowAddCustomSub(false);
  };

  const handleAddCustomSub = () => {
    const trimmed = newCustomSubInput.trim();
    if (!trimmed) return;
    saveCustomSubCategory(category, trimmed);
    setSubCategory(trimmed);
    setNewCustomSubInput('');
    setShowAddCustomSub(false);
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !contactNumber) {
      alert('Please fill in Customer Name and Contact Number.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        customer_id: initialData?.customer_id,
        customer_name: customerName,
        contact_number: contactNumber,
        email: email || 'no-email@farm.com',
        address: address || 'Farm Walk-in',
        category: category,
        sub_category: subCategory
      });
      onClose();
    } catch (err) {
      alert('Error saving customer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900">
                {isEditing ? 'Edit Commercial Buyer Profile' : 'Add Commercial Buyer Profile'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Customer background classification & CRM segmentation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* 1. Customer Background Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>🏷️</span> Customer Background Category *
              </label>
              <span className="text-[10px] text-slate-400">Select business type</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CUSTOMER_CATEGORY_LIST.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${cat.badgeClass} ring-2 ring-emerald-500/30 font-bold border-emerald-600 shadow-2xs`
                        : 'bg-slate-50/70 border-slate-200 hover:bg-white hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{cat.icon}</span>
                      <span className="text-xs font-bold leading-tight">{cat.label}</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-sans truncate">{cat.labelTa}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Sub-Category Selector & Custom Creator */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px]">
                <Tag className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sub-Category (உப பிரிவு)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowAddCustomSub(!showAddCustomSub)}
                className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>{showAddCustomSub ? 'Hide Custom Input' : '+ Add Custom Sub-Category'}</span>
              </button>
            </div>

            {/* Inline Custom Sub-Category Input */}
            {showAddCustomSub && (
              <div className="flex items-center gap-1.5 pt-1 animate-in fade-in-50 duration-150">
                <input
                  type="text"
                  placeholder={`New ${CUSTOMER_CATEGORIES[category]?.label || ''} sub-type...`}
                  value={newCustomSubInput}
                  onChange={(e) => setNewCustomSubInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSub();
                    }
                  }}
                  className="flex-1 bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSub}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Save & Select
                </button>
              </div>
            )}

            {/* Sub-Category Dropdown */}
            <select
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- General / Unclassified Sub-Category --</option>
              {availableSubCategories.map((sub) => (
                <option key={sub} value={sub}>
                  🏷️ {sub}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400">
              Categorizes buyers for sales reporting and customer segmentation.
            </p>
          </div>

          {/* 3. Customer / Business Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Customer / Business Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kannan Hotel / Selvam Chicken Center"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 4. Contact Phone Number */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Contact Phone Number *</label>
            <input
              type="tel"
              required
              placeholder="e.g. 9842112233"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 5. Email Address */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address (Optional)</label>
            <input
              type="email"
              placeholder="client@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* 6. Delivery / Business Address */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Business / Delivery Address
            </label>
            <textarea
              rows={2}
              placeholder="Shop / Hotel Address, Market Sandhai location, or village"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold py-3 rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Saving...' : isEditing ? 'Update Buyer Account' : 'Save Commercial Buyer Profile'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// =========================================================================
// 5. LOG / EDIT MORTALITY MODAL
// =========================================================================
export function LogMortalityModal({ isOpen, onClose, onSubmit, batches = [], initialData }) {
  const isEditing = Boolean(initialData?.id);
  const defaultBatch = batches && batches.length > 0 ? batches[0]?.batch_no || '' : '';

  const getNowFormatted = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  const [batch, setBatch] = useState(initialData?.batch || defaultBatch);
  const [date, setDate] = useState(
    initialData?.date ? initialData.date.slice(0, 16) : getNowFormatted()
  );
  const [deaths, setDeaths] = useState(initialData?.no_of_deaths ?? 1);
  const [reason, setReason] = useState(
    initialData?.reason_of_death || (MORTALITY_REASONS[0] ? MORTALITY_REASONS[0].value : 'Other')
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setBatch(initialData.batch || defaultBatch);
      setDate(initialData.date ? initialData.date.slice(0, 16) : getNowFormatted());
      setDeaths(initialData.no_of_deaths ?? 1);
      setReason(
        initialData.reason_of_death || (MORTALITY_REASONS[0] ? MORTALITY_REASONS[0].value : 'Other')
      );
    } else {
      setBatch(defaultBatch);
      setDate(getNowFormatted());
      setDeaths(1);
      setReason(MORTALITY_REASONS[0] ? MORTALITY_REASONS[0].value : 'Other');
    }
  }, [initialData, isOpen, defaultBatch]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!batch) {
      alert('Please select a valid flock batch.');
      return;
    }
    const deathCount = parseInt(deaths, 10);
    if (!deathCount || deathCount <= 0) {
      alert('Loss count must be at least 1.');
      return;
    }
    if (!reason || !reason.trim()) {
      alert('Please select or specify the diagnosed cause of mortality.');
      return;
    }

    let isoDate;
    try {
      const parsedDate = date ? new Date(date) : new Date();
      isoDate = isNaN(parsedDate.getTime()) ? new Date().toISOString() : parsedDate.toISOString();
    } catch {
      isoDate = new Date().toISOString();
    }

    setLoading(true);
    try {
      await onSubmit({
        id: initialData?.id,
        batch: parseInt(batch, 10),
        date: isoDate,
        no_of_deaths: deathCount,
        reason_of_death: reason.trim()
      });
      onClose();
    } catch (err) {
      alert('Error recording mortality: ' + (err.message || 'Unknown network or validation error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-700" />
            <h3 className="text-sm font-extrabold text-slate-900">
              {isEditing ? 'Edit Flock Mortality Incident' : 'Log Flock Mortality Incident'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Batch *</label>
            <select
              required
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500 cursor-pointer"
            >
              <option value="">-- Choose Batch --</option>
              {batches.map((b) => (
                <option key={b.batch_no} value={b.batch_no}>
                  Batch #{b.batch_no}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Number of Deaths *</label>
              <input
                type="number"
                min="1"
                required
                value={deaths}
                onChange={(e) => setDeaths(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Diagnosed Cause / Reason *</label>
            <input
              list="mortality-reasons-list"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Select or enter cause..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <datalist id="mortality-reasons-list">
              {MORTALITY_REASONS.map((r, i) => (
                <option key={i} value={r.value}>
                  {r.en} — {r.ta}
                </option>
              ))}
            </datalist>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold py-3 rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Saving...' : isEditing ? 'Update Mortality Record' : 'Log Flock Mortality'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
