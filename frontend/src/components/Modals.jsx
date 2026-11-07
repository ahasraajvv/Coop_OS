import React, { useState, useEffect } from 'react';
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
  DollarSign
} from 'lucide-react';
import {
  MORTALITY_REASONS,
  EXPENSE_CATEGORIES,
  INFRA_CATEGORIES,
  formatCurrency,
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
  const [amount, setAmount] = useState(initialData?.amount || '');
  const [loading, setLoading] = useState(false);

  // Auto-calculate amount when kg and pricePerKg are updated
  useEffect(() => {
    const k = parseFloat(kg) || 0;
    const p = parseFloat(pricePerKg) || 0;
    if (k > 0 && p > 0) {
      setAmount((k * p).toFixed(2));
    }
  }, [kg, pricePerKg]);

  // Synchronize form fields when opening or switching initialData
  useEffect(() => {
    if (initialData) {
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
      setPricePerKg('');
    } else {
      setBatch(defaultBatchNo);
      setCustomer('');
      setDate(new Date().toISOString().slice(0, 10));
      setHens(10);
      setRoosters(10);
      setKg('');
      setPricePerKg('');
      setAmount('');
    }
  }, [initialData, isOpen, defaultBatchNo]);

  const selectedMetrics = batch && batchMetrics ? batchMetrics[batch] || {} : null;
  const remainingChicks = selectedMetrics?.mortality?.Remaining_chicks;

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!batch) {
      alert('Please select a valid batch.');
      return;
    }
    if (Number(hens) + Number(roosters) <= 0) {
      alert('Total hens and roosters must be greater than zero.');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid Total Amount.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        id: initialData?.id,
        batch: parseInt(batch),
        customer: customer ? parseInt(customer) : null,
        date,
        no_of_hens: parseInt(hens) || 0,
        no_of_roosters: parseInt(roosters) || 0,
        kg: kg ? parseFloat(kg) : null,
        amount: parseFloat(amount)
      });
      // If editing an existing record, close immediately.
      // If creating a new record, the parent handler will transition activeModal to 'invoice'.
      if (initialData?.id) {
        onClose();
      }
    } catch (err) {
      alert('Error saving sale: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-extrabold text-slate-900">
              {isEditing ? `Edit Commercial Bird Sale #INV-${initialData.id}` : 'Record Commercial Bird Sale'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Batch Selector & Live Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Select Batch *</label>
              <select
                required
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">-- Choose Batch --</option>
                {batches.map((b) => (
                  <option key={b.batch_no} value={b.batch_no}>
                    Batch #{b.batch_no} ({b.no_of_chicks} chicks)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Sale Date *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {remainingChicks !== undefined && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <span className="font-semibold">Batch #{batch} Current Birds in Shed:</span>
              <span className="font-mono font-black text-sm bg-emerald-200/60 px-2 py-0.5 rounded-lg">
                {remainingChicks} birds
              </span>
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-bold text-slate-700">Buyer / Customer Profile</label>
              {openQuickCustomerModal && (
                <button
                  type="button"
                  onClick={openQuickCustomerModal}
                  className="text-emerald-700 hover:text-emerald-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+ Quick Add Buyer</span>
                </button>
              )}
            </div>
            <select
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="">-- Farm Gate Walk-in Cash Buyer --</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.customer_name} {c.contact_number ? `(${c.contact_number})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Birds Count Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. of Hens (பெட்டை)</label>
              <input
                type="number"
                min="0"
                value={hens}
                onChange={(e) => setHens(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">No. of Roosters (சேவல்)</label>
              <input
                type="number"
                min="0"
                value={roosters}
                onChange={(e) => setRoosters(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Weight & Price Calculations */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Weight (Kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 45.5"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Price per Kg (₹)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="e.g. 210"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Total Sale Value (₹) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="e.g. 9555"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono font-black text-base text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {kg && amount && parseFloat(kg) > 0 && (
              <span className="text-[11px] text-slate-500 font-mono mt-1 block">
                Calculated Rate: ₹{(parseFloat(amount) / parseFloat(kg)).toFixed(2)} / kg
              </span>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3 rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Saving Sale...' : isEditing ? 'Update Sale Details' : 'Save Sale & Generate Invoice'}</span>
            </button>
          </div>
        </form>
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
// 4. ADD / EDIT CUSTOMER MODAL
// =========================================================================
export function AddCustomerModal({ isOpen, onClose, onSubmit, initialData }) {
  const isEditing = Boolean(initialData?.customer_id);
  const [customerName, setCustomerName] = useState(initialData?.customer_name || '');
  const [contactNumber, setContactNumber] = useState(initialData?.contact_number || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCustomerName(initialData.customer_name || '');
      setContactNumber(initialData.contact_number || '');
      setEmail(initialData.email || '');
      setAddress(initialData.address || '');
    } else {
      setCustomerName('');
      setContactNumber('');
      setEmail('');
      setAddress('');
    }
  }, [initialData, isOpen]);

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
        address: address || 'Farm Walk-in'
      });
      onClose();
    } catch (err) {
      alert('Error saving customer: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-700" />
            <h3 className="text-sm font-extrabold text-slate-900">
              {isEditing ? 'Edit Commercial Buyer Profile' : 'Add Commercial Buyer Profile'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Customer / Business Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kannan Hotel / Murugan Traders"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

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

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Business / Delivery Address
            </label>
            <textarea
              rows={2}
              placeholder="Shop No, Road, Market / Area"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold py-3 rounded-xl shadow-xs transition text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{loading ? 'Saving...' : isEditing ? 'Update Buyer Account' : 'Save Buyer Account'}</span>
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
