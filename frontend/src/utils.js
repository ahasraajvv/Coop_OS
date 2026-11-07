// =========================================================================
// utils.js - Business Formatting, Export Tools & Bilingual Localization
// =========================================================================

export function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  });
}

export function formatNumber(val) {
  const num = Number(val) || 0;
  return num.toLocaleString('en-IN');
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
}

export function exportToCSV(filename, data, headers) {
  if (!data || !data.length) {
    alert('No data to export');
    return;
  }
  const keys = headers ? headers.map(h => h.key) : Object.keys(data[0]);
  const titles = headers ? headers.map(h => h.label) : keys;

  const csvRows = [];
  csvRows.push(titles.map(t => `"${t.replace(/"/g, '""')}"`).join(','));

  for (const row of data) {
    const values = keys.map(k => {
      let val = row[k];
      if (val === null || val === undefined) val = '';
      if (typeof val === 'object') val = JSON.stringify(val);
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const csvString = csvRows.join('\r\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export const MORTALITY_REASONS = [
  { value: 'Initial transport stress', en: 'Initial transport stress', ta: 'ஆரம்பகட்ட அழுத்தம் (Transport Stress)' },
  { value: 'Severe Heatwave / Dehydration', en: 'Severe Heatwave / Dehydration', ta: 'கடும் வெயில் / நீரிழப்பு (Heat Stress)' },
  { value: 'Indigestion / Weak chicks', en: 'Indigestion / Weak chicks', ta: 'செரிமான கோளாறு / பலவீனமான குஞ்சுகள்' },
  { value: 'Bacterial / Viral infection', en: 'Bacterial / Viral infection', ta: 'பாக்டீரியா / வைரஸ் தொற்று' },
  { value: 'Predator attack', en: 'Predator attack (Dog/Cat/Snake)', ta: 'நாய் / பூனை / பாம்பு தாக்குதல்' },
  { value: 'Unknown Cause', en: 'Unknown Cause', ta: 'காரணம் தெரியவில்லை (Unknown)' }
];

export const EXPENSE_CATEGORIES = [
  'Starter Feed (Pre-starter / Starter)',
  'Grower Feed',
  'Finisher Feed',
  'Vaccines & Medicines (Ranikhet, Lasota, Gumboro)',
  'Vitamins & Calcium Tonic',
  'Bedding Material / Sawdust (உமி / மரத்தூள்)',
  'Farm Labor & Caretaking (பண்ணை கூலி)',
  'Transport & Logistics',
  'Disinfection & Sanitation (மருந்து தெளிப்பு)',
  'Miscellaneous Overhead'
];

export const INFRA_CATEGORIES = [
  'Electricity & EB Bill (மின்சார கட்டணம்)',
  'Water & Pipeline Maintenance (தண்ணீர் வசதி)',
  'Shed & Cage Repair (கொட்டகை பராமரிப்பு)',
  'Equipment & Feeders/Drinkers',
  'Security & Fencing',
  'License & Regulatory Fees'
];

// Bilingual dictionary
export const translations = {
  en: {
    dashboard: 'Dashboard',
    batches: 'Batches & Flocks',
    customers: 'Customer CRM',
    sales: 'Sales & Orders',
    expenses: 'Expenses Category Board',
    mortality: 'Mortality & Health',
    vaccinations: 'Vaccination Board (90 Days)',
    reports: 'Financial Reports',
    calculator: 'Margin & Selling Calculator',
    quickSale: '+ New Sale',
    recordExpense: '+ Log Expense',
    newBatch: '+ Add Batch',
    newCustomer: '+ Add Customer',
    logMortality: '+ Log Death',
    overview: 'Executive Performance Overview',
    totalRevenue: 'Total Revenue',
    totalExpenses: 'Total Expenses',
    netProfit: 'Net Profit / Loss',
    flockSize: 'Total Birds Bought',
    activeBirds: 'Current Live Birds',
    mortalityRate: 'Mortality Rate',
    profit: 'Profit',
    loss: 'Loss',
    breakeven: 'Break-even',
    searchPlaceholder: 'Search batches, customers, invoices...',
    actions: 'Actions',
    date: 'Date',
    amount: 'Amount',
    customer: 'Customer',
    batchNo: 'Batch #',
    status: 'Status',
    chicks: 'Chicks',
    hens: 'Hens',
    roosters: 'Roosters',
    weightKg: 'Weight (Kg)',
    priceKg: 'Price/Kg',
    exportCsv: 'Export CSV',
    printInvoice: 'Print Invoice',
    refresh: 'Refresh',
    logout: 'Logout',
    loggedInAs: 'Logged in as'
  },
  ta: {
    dashboard: 'டாஷ்போர்டு (Dashboard)',
    batches: 'தொகுதிகள் (Batches)',
    customers: 'வாடிக்கையாளர் CRM',
    sales: 'விற்பனை & வருமானம் (Sales)',
    expenses: 'செலவு வகை வாரியம் (Expenses)',
    mortality: 'இறப்பு பதிவுகள் (Mortality)',
    vaccinations: 'தடுப்பூசி அட்டவணை (90 Days)',
    reports: 'நிதி அறிக்கைகள் (Reports)',
    calculator: 'விற்பனை விலை கால்குலேட்டர்',
    quickSale: '+ புதிய விற்பனை',
    recordExpense: '+ செலவு பதிவு',
    newBatch: '+ புதிய தொகுதி',
    newCustomer: '+ புதிய வாடிக்கையாளர்',
    logMortality: '+ இறப்பு பதிவு',
    overview: 'பண்ணை நிர்வாக சுருக்கம்',
    totalRevenue: 'மொத்த வருவாய்',
    totalExpenses: 'மொத்த செலவுகள்',
    netProfit: 'நிகர இலாபம் / நட்டம்',
    flockSize: 'வாங்கிய மொத்த குஞ்சுகள்',
    activeBirds: 'தற்போதைய உயிருள்ள கோழிகள்',
    mortalityRate: 'இறப்பு விகிதம்',
    profit: 'இலாபம்',
    loss: 'நட்டம்',
    breakeven: 'சமம்',
    searchPlaceholder: 'தேடுக (தொகுதி, வாடிக்கையாளர், பில்)...',
    actions: 'செயல்கள்',
    date: 'தேதி',
    amount: 'தொகை',
    customer: 'வாடிக்கையாளர்',
    batchNo: 'தொகுதி எண்',
    status: 'நிலை',
    chicks: 'குஞ்சுகள்',
    hens: 'பெட்டை',
    roosters: 'சேவல்',
    weightKg: 'எடை (கிலோ)',
    priceKg: 'கிலோ விலை',
    exportCsv: 'CSV பதிவிறக்கு',
    printInvoice: 'பில் அச்சிடு',
    refresh: 'புதுப்பி',
    logout: 'வெளியேறு',
    loggedInAs: 'பயனர்'
  }
};
