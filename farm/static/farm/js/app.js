// =========================================================
// app.js — CoopOS Mobile Application Logic
// Single Page Application (SPA) Controller & UI Renderer
// =========================================================

let currentTab = 'dashboard';
let cachedBatches = [];
let cachedCustomers = [];

// =========================================================
// 1. NAVIGATION & TAB SWITCHING
// =========================================================

function switchTab(tabName) {
    currentTab = tabName;

    const titles = {
        dashboard: 'டாஷ்போர்டு (Farm Dashboard)',
        sales: 'விற்பனை & வருமானம் (Sales & Income)',
        expenses: 'பண்ணை செலவுகள் (Farm Expenses)',
        mortality: 'இறப்பு விகிதம் & பதிவுகள் (Mortality Log)'
    };
    document.getElementById('header-subtitle').textContent = titles[tabName] || 'பண்ணை மேலாண்மை';

    const views = ['dashboard', 'sales', 'expenses', 'mortality'];
    views.forEach(v => {
        const el = document.getElementById(`view-${v}`);
        if (el) el.classList.toggle('hidden', v !== tabName);

        const tabBtn = document.getElementById(`tab-${v}`);
        if (tabBtn) {
            if (v === tabName) {
                tabBtn.className = 'flex flex-col items-center py-1 text-emerald-700 font-bold transition scale-105';
            } else {
                tabBtn.className = 'flex flex-col items-center py-1 text-slate-400 hover:text-emerald-600 font-semibold transition';
            }
        }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
    refreshCurrentView();
}

function refreshCurrentView() {
    if (currentTab === 'dashboard') loadDashboard();
    else if (currentTab === 'sales') loadSalesScreen();
    else if (currentTab === 'expenses') loadExpensesScreen();
    else if (currentTab === 'mortality') loadMortalityScreen();
}

// =========================================================
// 2. DASHBOARD SCREEN & BATCH CREATION
// =========================================================

function toggleBatchForm() {
    const card = document.getElementById('card-add-batch');
    if (!card) return;
    const isHidden = card.classList.contains('hidden');
    card.classList.toggle('hidden', !isHidden);
    if (isHidden) {
        document.getElementById('batch-date').valueAsDate = new Date();
    }
}

async function handleCreateBatch(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-batch');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> சேமிக்கப்படுகிறது...';

    const payload = {
        batch_no: parseInt(document.getElementById('batch-no').value),
        date: document.getElementById('batch-date').value,
        no_of_chicks: parseInt(document.getElementById('batch-chicks').value),
        buying_price: parseFloat(document.getElementById('batch-price').value)
    };

    try {
        await createBatch(payload);
        showToast('புதிய தொகுதி வெற்றிகரமாக சேர்க்கப்பட்டது! (Batch added!)', false);
        document.getElementById('form-batch').reset();
        toggleBatchForm();
        cachedBatches = []; // Invalidate cache so dropdowns refresh
        await loadDashboard();
    } catch (err) {
        console.error('Error saving batch:', err);
        showToast('தொகுதியை சேமிப்பதில் பிழை: ' + err.message, true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>💾</span> தொகுதியை சேமி (Save Batch)';
    }
}

async function loadDashboard() {
    const container = document.getElementById('batches-container');
    const countBadge = document.getElementById('batch-count-badge');
    container.innerHTML = '<div class="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-200">⏳ தகவல்கள் ஏற்றப்படுகின்றன... (Loading batches...)</div>';

    try {
        const batches = await fetchBatches();
        cachedBatches = batches;
        if (countBadge) countBadge.textContent = `${batches.length} தொகுதிகள்`;

        if (batches.length === 0) {
            container.innerHTML = '<div class="text-center py-10 text-slate-400 bg-white rounded-2xl border border-slate-200">எந்த தொகுதியும் இல்லை (No batches found)</div>';
            return;
        }

        container.innerHTML = '';

        for (const batch of batches) {
            const mortality = await fetchMortality(batch.batch_no);
            const profitLoss = await fetchProfitLoss(batch.batch_no);
            const weeklySales = await fetchWeeklySales(batch.batch_no);

            const card = createBatchCard(batch, mortality, profitLoss, weeklySales);
            container.innerHTML += card;
        }

    } catch (error) {
        console.error('Dashboard load failed:', error);
        container.innerHTML = '<div class="text-center py-10 text-rose-500 bg-rose-50 rounded-2xl border border-rose-200">⚠️ API பிழை ஏற்பட்டது (Server not responding)</div>';
    }
}

function createBatchCard(batch, mortality, profitLoss, weeklySales) {
    const alive = mortality.Remaining_chicks;
    const dead = mortality.no_of_deaths;
    const isProfit = profitLoss.status === 'Profit';
    const isLoss = profitLoss.status === 'Loss';

    const badgeColor = isProfit ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                     : isLoss   ? 'bg-rose-100 text-rose-800 border-rose-300'
                     :            'bg-slate-100 text-slate-600 border-slate-300';

    const netColor = isProfit ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-600';
    const statusTamil = isProfit ? 'இலாபம் (Profit)' : isLoss ? 'நட்டம் (Loss)' : 'சமம் (Break-even)';

    const salesList = weeklySales.weekly_sales || [];
    const hasSales = salesList.length > 0;

    let weeklyRowsHtml = '';
    if (hasSales) {
        weeklyRowsHtml = salesList.map((w, idx) => {
            const d = new Date(w.week);
            const weekLabel = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            return `
                <div class="flex items-center justify-between text-xs py-1.5 px-2.5 bg-white rounded-lg border border-slate-100 shadow-sm">
                    <div class="flex items-center gap-2">
                        <span class="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold flex items-center justify-center">
                            ${idx + 1}
                        </span>
                        <span class="font-medium text-slate-700">Week of ${weekLabel}</span>
                    </div>
                    <div class="text-right">
                        <span class="font-bold text-slate-800">${formatCurrency(w.total_amount)}</span>
                        <span class="text-[10px] text-slate-400 ml-1">(${w.sales_count} sale${w.sales_count > 1 ? 's' : ''})</span>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        weeklyRowsHtml = '<p class="text-xs text-slate-400 text-center py-2">விற்பனை பதிவுகள் இல்லை (No sales yet)</p>';
    }

    return `
        <div class="batch-card bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div class="flex items-center justify-between mb-1">
                <h3 class="text-base font-black text-slate-800 tracking-tight">தொகுதி #${batch.batch_no} (Batch ${batch.batch_no})</h3>
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}">
                    ${statusTamil}
                </span>
            </div>
            <p class="text-xs text-slate-400 mb-3 font-mono">துவக்கம்: ${batch.date}</p>

            <div class="grid grid-cols-3 gap-2 mb-3">
                <div class="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                    <p class="text-[10px] text-slate-400 uppercase font-bold tracking-wider">மொத்தம் (Total)</p>
                    <p class="text-base font-black text-slate-800">${batch.no_of_chicks}</p>
                </div>
                <div class="bg-emerald-50/70 rounded-xl p-2.5 text-center border border-emerald-100">
                    <p class="text-[10px] text-emerald-600 uppercase font-bold tracking-wider">உயிர் (Alive)</p>
                    <p class="text-base font-black text-emerald-700">${alive}</p>
                </div>
                <div class="bg-rose-50/70 rounded-xl p-2.5 text-center border border-rose-100">
                    <p class="text-[10px] text-rose-500 uppercase font-bold tracking-wider">இறப்பு (Dead)</p>
                    <p class="text-base font-black text-rose-600">${dead}</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="bg-emerald-50/50 rounded-xl p-2.5 text-center border border-emerald-100">
                    <p class="text-[10px] text-emerald-700 uppercase font-bold tracking-wider">வருமானம் (Income)</p>
                    <p class="text-sm font-black text-emerald-700">${formatCurrency(profitLoss.revenue)}</p>
                </div>
                <div class="bg-orange-50/50 rounded-xl p-2.5 text-center border border-orange-100">
                    <p class="text-[10px] text-orange-600 uppercase font-bold tracking-wider">செலவு (Expenses)</p>
                    <p class="text-sm font-black text-orange-700">${formatCurrency(profitLoss.expense)}</p>
                </div>
            </div>

            <div class="mb-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div class="flex justify-between items-center mb-2">
                    <p class="text-[10px] text-slate-500 uppercase tracking-wider font-bold">வாராந்திர விற்பனை (Weekly Sales)</p>
                    <span class="text-[10px] text-slate-400 font-medium">${salesList.length} வாரம்</span>
                </div>
                <div class="space-y-1.5">
                    ${weeklyRowsHtml}
                </div>
            </div>

            <div class="flex justify-between items-center pt-3 border-t border-slate-100">
                <span class="text-xs text-slate-500 font-semibold">நிகர முடிவு (Net Result):</span>
                <span class="text-base font-black ${netColor}">
                    ${isLoss ? '-' : '+'}${formatCurrency(Math.abs(Number(profitLoss.profit_or_loss)))}
                </span>
            </div>
        </div>
    `;
}

// =========================================================
// 3. SALES / INCOME SCREEN
// =========================================================

async function loadSalesScreen() {
    await populateBatchDropdown('sale-batch');
    await populateCustomerDropdown('sale-customer');
    document.getElementById('sale-date').valueAsDate = new Date();
    await loadSalesList();
}

async function loadSalesList() {
    const listEl = document.getElementById('sales-list');
    listEl.innerHTML = '<div class="text-center py-6 text-slate-400 bg-white rounded-xl border border-slate-200">ஏற்றப்படுகிறது...</div>';

    try {
        const sales = await fetchSales();
        if (sales.length === 0) {
            listEl.innerHTML = '<div class="text-center py-6 text-slate-400 bg-white rounded-xl border border-slate-200">விற்பனை பதிவுகள் இல்லை (No sales yet)</div>';
            return;
        }

        listEl.innerHTML = sales.map(s => {
            const batchNo = s.batch ? (s.batch.batch_no || s.batch) : '-';
            const customerName = s.customer ? (s.customer.customer_name || 'பொது வாடிக்கையாளர்') : 'பொது வாடிக்கையாளர்';
            const totalBirds = (s.no_of_hens || 0) + (s.no_of_roosters || 0);

            return `
                <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                தொகுதி #${batchNo}
                            </span>
                            <span class="text-xs font-bold text-slate-800">${customerName}</span>
                        </div>
                        <p class="text-[11px] text-slate-400">
                            ${s.date} • ${totalBirds} பறவைகள் (${s.no_of_hens} பெட்டை, ${s.no_of_roosters} சேவல்) ${s.kg ? '• ' + s.kg + ' Kg' : ''}
                        </p>
                    </div>
                    <div class="text-right">
                        <span class="text-sm font-black text-emerald-600 block">+${formatCurrency(s.amount)}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Failed to load sales list:', err);
        listEl.innerHTML = '<div class="text-center py-4 text-rose-500 bg-rose-50 rounded-xl">பட்டியலை ஏற்றுவதில் பிழை</div>';
    }
}

// =========================================================
// AUTO-CALCULATOR FOR SALES
// =========================================================
function calculateTotalAmount() {
    const kg = parseFloat(document.getElementById('sale-kg').value) || 0;
    const pricePerKg = parseFloat(document.getElementById('sale-price-per-kg').value) || 0;
    const totalInput = document.getElementById('sale-amount');
    
    if (kg > 0 && pricePerKg > 0) {
        totalInput.value = (kg * pricePerKg).toFixed(2);
    } else {
        totalInput.value = '';
    }
}

function toggleCustomerForm() {
    const form = document.getElementById('quick-customer-form');
    form.classList.toggle('hidden');
}

async function saveQuickCustomer() {
    const payload = {
        customer_id: parseInt(document.getElementById('quick-cust-id').value),
        customer_name: document.getElementById('quick-cust-name').value,
        contact_number: document.getElementById('quick-cust-phone').value,
        email: document.getElementById('quick-cust-email').value || "no-email@farm.com"
    };

    if (!payload.customer_id || !payload.customer_name || !payload.contact_number) {
        showToast('Please fill all required customer fields.', true);
        return;
    }

    try {
        await createCustomer(payload);
        showToast('வாடிக்கையாளர் சேமிக்கப்பட்டுவிட்டார்! (Customer saved!)', false);
        
        // Refresh customer list
        cachedCustomers = await fetchCustomers();
        await populateCustomerDropdown('sale-customer');
        
        // Auto-select the new customer
        document.getElementById('sale-customer').value = payload.customer_id;
        
        // Hide form and clear it
        document.getElementById('quick-cust-id').value = '';
        document.getElementById('quick-cust-name').value = '';
        document.getElementById('quick-cust-phone').value = '';
        document.getElementById('quick-cust-email').value = '';
        toggleCustomerForm();

    } catch (err) {
        console.error('Error saving customer:', err);
        showToast('Error: ' + err.message, true);
    }
}

async function handleCreateSale(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-sale');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> சேமிக்கப்படுகிறது...';

    const payload = {
        batch: parseInt(document.getElementById('sale-batch').value),
        date: document.getElementById('sale-date').value,
        no_of_hens: parseInt(document.getElementById('sale-hens').value) || 0,
        no_of_roosters: parseInt(document.getElementById('sale-roosters').value) || 0,
        kg: document.getElementById('sale-kg').value ? parseFloat(document.getElementById('sale-kg').value) : null,
        amount: parseFloat(document.getElementById('sale-amount').value),
        customer: document.getElementById('sale-customer').value ? parseInt(document.getElementById('sale-customer').value) : null
    };

    try {
        await createSale(payload);
        showToast('விற்பனை வெற்றிகரமாக பதிவு செய்யப்பட்டது! (Sale saved!)', false);
        document.getElementById('form-sale').reset();
        document.getElementById('sale-date').valueAsDate = new Date();
        await loadSalesList();
    } catch (err) {
        console.error('Error saving sale:', err);
        showToast('விற்பனையை சேமிப்பதில் பிழை ஏற்பட்டது: ' + err.message, true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>💾</span> விற்பனையை சேமி (Save Sale)';
    }
}

// =========================================================
// 4. EXPENSE SCREEN
// =========================================================

async function loadExpensesScreen() {
    await populateBatchDropdown('expense-batch');
    document.getElementById('expense-date').valueAsDate = new Date();
    await loadExpensesList();
}

async function loadExpensesList() {
    const listEl = document.getElementById('expenses-list');
    listEl.innerHTML = '<div class="text-center py-6 text-slate-400 bg-white rounded-xl border border-slate-200">ஏற்றப்படுகிறது...</div>';

    try {
        const expenses = await fetchExpenses();
        if (expenses.length === 0) {
            listEl.innerHTML = '<div class="text-center py-6 text-slate-400 bg-white rounded-xl border border-slate-200">செலவு பதிவுகள் இல்லை (No expenses yet)</div>';
            return;
        }

        listEl.innerHTML = expenses.map(exp => {
            return `
                <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                தொகுதி #${exp.batch}
                            </span>
                            <span class="text-xs font-bold text-slate-800">${exp.expense_type}</span>
                        </div>
                        <p class="text-[11px] text-slate-400 font-mono">${exp.date}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-sm font-black text-orange-600 block">-${formatCurrency(exp.amount)}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Failed to load expenses list:', err);
        listEl.innerHTML = '<div class="text-center py-4 text-rose-500 bg-rose-50 rounded-xl">பட்டியலை ஏற்றுவதில் பிழை</div>';
    }
}

async function handleCreateExpense(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-expense');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> சேமிக்கப்படுகிறது...';

    const payload = {
        batch: parseInt(document.getElementById('expense-batch').value),
        date: document.getElementById('expense-date').value,
        expense_type: document.getElementById('expense-type').value,
        amount: parseFloat(document.getElementById('expense-amount').value)
    };

    try {
        await createExpense(payload);
        showToast('செலவு வெற்றிகரமாக சேமிக்கப்பட்டது! (Expense saved!)', false);
        document.getElementById('form-expense').reset();
        document.getElementById('expense-date').valueAsDate = new Date();
        await loadExpensesList();
    } catch (err) {
        console.error('Error saving expense:', err);
        showToast('செலவை சேமிப்பதில் பிழை ஏற்பட்டது: ' + err.message, true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>💾</span> செலவை சேமி (Save Expense)';
    }
}

// =========================================================
// 5. MORTALITY SCREEN
// =========================================================

async function loadMortalityScreen() {
    await populateBatchDropdown('mortality-batch');
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    document.getElementById('mortality-date').value = now.toISOString().slice(0, 16);
    await loadMortalityList();
}

async function loadMortalityList() {
    const listEl = document.getElementById('mortality-list');
    listEl.innerHTML = '<div class="text-center py-6 text-slate-400 bg-white rounded-xl border border-slate-200">ஏற்றப்படுகிறது...</div>';

    try {
        const logs = await fetchMortalityLogs();
        if (logs.length === 0) {
            listEl.innerHTML = '<div class="text-center py-6 text-slate-400 bg-white rounded-xl border border-slate-200">இறப்பு பதிவுகள் இல்லை (No deaths logged)</div>';
            return;
        }

        listEl.innerHTML = logs.map(m => {
            const dateStr = new Date(m.date).toLocaleDateString('en-IN', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            return `
                <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                தொகுதி #${m.batch}
                            </span>
                            <span class="text-xs font-bold text-slate-800">${m.reason_of_death}</span>
                        </div>
                        <p class="text-[11px] text-slate-400">${dateStr}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-sm font-black text-rose-600 block">💀 ${m.no_of_deaths}</span>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        console.error('Failed to load mortality list:', err);
        listEl.innerHTML = '<div class="text-center py-4 text-rose-500 bg-rose-50 rounded-xl">பட்டியலை ஏற்றுவதில் பிழை</div>';
    }
}

async function handleCreateMortality(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-mortality');
    btn.disabled = true;
    btn.innerHTML = '<span>⏳</span> பதிவு செய்யப்படுகிறது...';

    const payload = {
        batch: parseInt(document.getElementById('mortality-batch').value),
        date: new Date(document.getElementById('mortality-date').value).toISOString(),
        no_of_deaths: parseInt(document.getElementById('mortality-count').value),
        reason_of_death: document.getElementById('mortality-reason').value
    };

    try {
        await createMortality(payload);
        showToast('இறப்பு பதிவு வெற்றிகரமாக சேர்க்கப்பட்டது! (Death logged!)', false);
        document.getElementById('form-mortality').reset();
        loadMortalityScreen();
    } catch (err) {
        console.error('Error saving mortality:', err);
        showToast('பதிவு செய்வதில் பிழை: ' + err.message, true);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>💾</span> இறப்பை பதிவு செய் (Record Death)';
    }
}

// =========================================================
// 6. SHARED HELPERS & DROPDOWNS
// =========================================================

async function populateBatchDropdown(selectId) {
    const el = document.getElementById(selectId);
    if (!el) return;

    if (cachedBatches.length === 0) {
        cachedBatches = await fetchBatches();
    }

    el.innerHTML = '<option value="">-- தொகுதியை தேர்ந்தெடுக்கவும் --</option>' +
        cachedBatches.map(b => `<option value="${b.batch_no}">தொகுதி #${b.batch_no} (${b.date} • ${b.no_of_chicks} குஞ்சுகள்)</option>`).join('');
}

async function populateCustomerDropdown(selectId) {
    const el = document.getElementById(selectId);
    if (!el) return;

    if (cachedCustomers.length === 0) {
        cachedCustomers = await fetchCustomers();
    }

    el.innerHTML = '<option value="">-- வாடிக்கையாளரை தேர்ந்தெடுக்கவும் (Optional) --</option>' +
        cachedCustomers.map(c => `<option value="${c.customer_id}">${c.customer_name} (${c.contact_number})</option>`).join('');
}

function formatCurrency(value) {
    return '₹' + Number(value).toLocaleString('en-IN');
}

function showToast(msg, isError = false) {
    const toast = document.getElementById('toast');
    const toastBody = document.getElementById('toast-body');
    const toastMsg = document.getElementById('toast-msg');

    toastMsg.textContent = msg;
    toastBody.className = `p-3.5 rounded-xl shadow-lg text-xs font-semibold flex items-center justify-between text-white ${
        isError ? 'bg-rose-600' : 'bg-emerald-600'
    }`;

    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    setTimeout(hideToast, 3500);
}

function hideToast() {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.classList.remove('opacity-100');
        toast.classList.add('opacity-0', 'pointer-events-none');
    }
}

// =========================================================
// 7. INITIALIZATION ON PAGE LOAD
// =========================================================
document.addEventListener('DOMContentLoaded', () => {
    switchTab('dashboard');
});
