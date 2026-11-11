// =========================================================================
// api.js - Enterprise API Service Layer for CoopOS Laptop CRM
// =========================================================================

const API_BASE = '/api';

export function getToken() {
  return localStorage.getItem('coopOS_token');
}

export function setToken(token) {
  localStorage.setItem('coopOS_token', token);
}

export function removeToken() {
  localStorage.removeItem('coopOS_token');
}

export function isAuthenticated() {
  return !!getToken();
}

function authHeaders() {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Token ${token}` } : {})
  };
}

async function handleResponse(response) {
  if (response.status === 401) {
    removeToken();
    window.dispatchEvent(new Event('coop_auth_error'));
    throw new Error('Session expired or unauthorized. Please login again.');
  }
  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const err = await response.json();
      if (typeof err === 'object') {
        const messages = Object.entries(err)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(' ') : val}`)
          .join(' | ');
        errorDetail = messages || JSON.stringify(err);
      } else {
        errorDetail = err;
      }
    } catch {
      // not JSON
    }
    throw new Error(errorDetail);
  }
  if (response.status === 204) return null;
  return await response.json();
}

// --- Auth API ---
export async function login(username, password) {
  const response = await fetch(`${API_BASE}/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await handleResponse(response);
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

export async function logout() {
  try {
    const token = getToken();
    if (token) {
      await fetch(`${API_BASE}/logout/`, {
        method: 'POST',
        headers: authHeaders()
      });
    }
  } catch (err) {
    console.warn('Logout API error:', err);
  } finally {
    removeToken();
  }
}

// --- Batches API ---
export async function fetchBatches() {
  const res = await fetch(`${API_BASE}/batches/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function createBatch(data) {
  const res = await fetch(`${API_BASE}/batches/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function updateBatch(batchNo, data) {
  const res = await fetch(`${API_BASE}/batches/${batchNo}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function deleteBatch(batchNo) {
  const res = await fetch(`${API_BASE}/batches/${batchNo}/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return await handleResponse(res);
}

export async function fetchBatchProfitLoss(batchNo) {
  const res = await fetch(`${API_BASE}/batches/${batchNo}/ProfitORLose/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function fetchBatchMortality(batchNo) {
  const res = await fetch(`${API_BASE}/batches/${batchNo}/Mortality_Rate/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function fetchBatchWeeklySales(batchNo) {
  const res = await fetch(`${API_BASE}/batches/${batchNo}/WeeklySales/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function fetchBatchFullMetrics(batchNo) {
  const [pnl, mortality, weekly] = await Promise.all([
    fetchBatchProfitLoss(batchNo).catch(() => ({ revenue: 0, expense: 0, profit_or_loss: 0, status: 'N/A' })),
    fetchBatchMortality(batchNo).catch(() => ({ mortality_rate: 0, no_of_deaths: 0, total_sold: 0, Remaining_chicks: 0 })),
    fetchBatchWeeklySales(batchNo).catch(() => ({ weekly_sales: [] }))
  ]);
  return { pnl, mortality, weekly };
}

// --- Customers API ---
export async function fetchCustomers() {
  const res = await fetch(`${API_BASE}/customer-details/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function createCustomer(data) {
  const res = await fetch(`${API_BASE}/customer-details/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function updateCustomer(customerId, data) {
  const res = await fetch(`${API_BASE}/customer-details/${customerId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function deleteCustomer(customerId) {
  const res = await fetch(`${API_BASE}/customer-details/${customerId}/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return await handleResponse(res);
}

// --- Sales / Income API ---
export async function fetchSales() {
  const res = await fetch(`${API_BASE}/batch-sales/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function createSale(data) {
  const res = await fetch(`${API_BASE}/batch-sales/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function updateSale(saleId, data) {
  const res = await fetch(`${API_BASE}/batch-sales/${saleId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function deleteSale(saleId) {
  const res = await fetch(`${API_BASE}/batch-sales/${saleId}/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return await handleResponse(res);
}

// --- Expenses API ---
export async function fetchExpenses() {
  const res = await fetch(`${API_BASE}/batch-expenses/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function createExpense(data) {
  const res = await fetch(`${API_BASE}/batch-expenses/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function updateExpense(expenseId, data) {
  const res = await fetch(`${API_BASE}/batch-expenses/${expenseId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function deleteExpense(expenseId) {
  const res = await fetch(`${API_BASE}/batch-expenses/${expenseId}/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return await handleResponse(res);
}

export async function fetchInfraExpenses() {
  const res = await fetch(`${API_BASE}/infra-expenses/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function createInfraExpense(data) {
  const res = await fetch(`${API_BASE}/infra-expenses/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function updateInfraExpense(infraId, data) {
  const res = await fetch(`${API_BASE}/infra-expenses/${infraId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function deleteInfraExpense(infraId) {
  const res = await fetch(`${API_BASE}/infra-expenses/${infraId}/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return await handleResponse(res);
}

// --- Mortality Records API ---
export async function fetchMortalityLogs() {
  const res = await fetch(`${API_BASE}/mortality-rates/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function createMortality(data) {
  const res = await fetch(`${API_BASE}/mortality-rates/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function updateMortality(mortalityId, data) {
  const res = await fetch(`${API_BASE}/mortality-rates/${mortalityId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function deleteMortality(mortalityId) {
  const res = await fetch(`${API_BASE}/mortality-rates/${mortalityId}/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return await handleResponse(res);
}

// --- Vaccination Records API ---
export async function fetchBatchVaccinations(batchNo) {
  const res = await fetch(`${API_BASE}/batches/${batchNo}/vaccinations/`, { headers: authHeaders() });
  return await handleResponse(res);
}

export async function toggleVaccination(vaccineId, administeredDate = null) {
  const res = await fetch(`${API_BASE}/vaccinations/${vaccineId}/toggle/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ administered_date: administeredDate })
  });
  return await handleResponse(res);
}

export async function createVaccination(data) {
  const res = await fetch(`${API_BASE}/vaccinations/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function updateVaccination(vaccineId, data) {
  const res = await fetch(`${API_BASE}/vaccinations/${vaccineId}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data)
  });
  return await handleResponse(res);
}

export async function deleteVaccination(vaccineId) {
  const res = await fetch(`${API_BASE}/vaccinations/${vaccineId}/`, {
    method: 'DELETE',
    headers: authHeaders()
  });
  return await handleResponse(res);
}



export async function fetchSyncStatus() {
  const res = await fetch(`${API_BASE}/sync/`, {
    headers: authHeaders(),
  });
  return await handleResponse(res);
}

export async function trigger3LevelSync(pushToGit = false) {
  const res = await fetch(`${API_BASE}/sync/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ push_to_git: pushToGit })
  });
  return await handleResponse(res);
}
