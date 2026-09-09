// =============================================
// api.js — Complete DRF API Communication Layer
// Pure fetch() requests for GET & POST operations.
// =============================================

const API_BASE = '/api';

// --- Batches API ---
async function fetchBatches() {
    const response = await fetch(`${API_BASE}/batches/`);
    if (!response.ok) throw new Error('Failed to fetch batches');
    return await response.json();
}

async function fetchProfitLoss(batchNo) {
    const response = await fetch(`${API_BASE}/batches/${batchNo}/ProfitORLose/`);
    if (!response.ok) throw new Error(`Failed to fetch P&L for batch ${batchNo}`);
    return await response.json();
}

async function fetchMortality(batchNo) {
    const response = await fetch(`${API_BASE}/batches/${batchNo}/Mortality_Rate/`);
    if (!response.ok) throw new Error(`Failed to fetch mortality for batch ${batchNo}`);
    return await response.json();
}

async function fetchWeeklySales(batchNo) {
    const response = await fetch(`${API_BASE}/batches/${batchNo}/WeeklySales/`);
    if (!response.ok) throw new Error(`Failed to fetch weekly sales for batch ${batchNo}`);
    return await response.json();
}

// --- Customers API ---
async function fetchCustomers() {
    const response = await fetch(`${API_BASE}/customer-details/`);
    if (!response.ok) throw new Error('Failed to fetch customers');
    return await response.json();
}

// --- Sales / Income API ---
async function fetchSales() {
    const response = await fetch(`${API_BASE}/batch-sales/`);
    if (!response.ok) throw new Error('Failed to fetch sales');
    return await response.json();
}

async function createSale(data) {
    const response = await fetch(`${API_BASE}/batch-sales/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(JSON.stringify(err));
    }
    return await response.json();
}

// --- Expenses API ---
async function fetchExpenses() {
    const response = await fetch(`${API_BASE}/batch-expenses/`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    return await response.json();
}

async function createExpense(data) {
    const response = await fetch(`${API_BASE}/batch-expenses/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(JSON.stringify(err));
    }
    return await response.json();
}

// --- Mortality Records API ---
async function fetchMortalityLogs() {
    const response = await fetch(`${API_BASE}/mortality-rates/`);
    if (!response.ok) throw new Error('Failed to fetch mortality logs');
    return await response.json();
}

async function createMortality(data) {
    const response = await fetch(`${API_BASE}/mortality-rates/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(JSON.stringify(err));
    }
    return await response.json();
}
