import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  isAuthenticated,
  logout,
  fetchBatches,
  createBatch,
  updateBatch,
  deleteBatch,
  fetchBatchFullMetrics,
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  fetchSales,
  createSale,
  updateSale,
  deleteSale,
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchInfraExpenses,
  createInfraExpense,
  updateInfraExpense,
  deleteInfraExpense,
  fetchMortalityLogs,
  createMortality,
  updateMortality,
  deleteMortality
} from './api';
import TopNavbar from './components/TopNavbar';

import DashboardView from './components/DashboardView';
import BatchesView from './components/BatchesView';
import CustomersView from './components/CustomersView';
import SalesView from './components/SalesView';
import ExpensesView from './components/ExpensesView';
import MortalityView from './components/MortalityView';
import ReportsView from './components/ReportsView';
import BatchCalculatorView from './components/BatchCalculatorView';
import ReinvestmentView from './components/ReinvestmentView';
import VaccinationBoard from './components/VaccinationBoard';
import LoginView from './components/LoginView';
import InvoiceModal from './components/InvoiceModal';
import {
  AddBatchModal,
  CreateSaleModal,
  RecordExpenseModal,
  AddCustomerModal,
  LogMortalityModal
} from './components/Modals';
import Toast from './components/Toast';

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [lang, setLang] = useState(() => localStorage.getItem('coopOS_lang') || 'en');
  const [currentView, setCurrentView] = useState(() => {
    const hash = (typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '');
    const validViews = ['sales', 'expenses', 'reinvestment', 'customers', 'mortality', 'vaccinations', 'reports', 'dashboard', 'batches', 'calculator'];
    return validViews.includes(hash) ? hash : 'sales';
  });

  const handleNavigateView = (view) => {
    setCurrentView(view);
    if (typeof window !== 'undefined') {
      window.location.hash = view;
    }
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      const validViews = ['sales', 'expenses', 'reinvestment', 'customers', 'mortality', 'vaccinations', 'reports', 'dashboard', 'batches', 'calculator'];
      if (validViews.includes(hash)) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatchFilter, setSelectedBatchFilter] = useState('ALL');
  const [selectedBatchNo, setSelectedBatchNo] = useState(null);

  // Entities
  const [batches, setBatches] = useState([]);
  const [batchMetrics, setBatchMetrics] = useState({});
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [infraExpenses, setInfraExpenses] = useState([]);
  const [mortalityLogs, setMortalityLogs] = useState([]);

  // Modals & Feedback
  const [activeModal, setActiveModal] = useState(null); // 'batch' | 'sale' | 'expense' | 'customer' | 'mortality' | 'invoice'
  const [modalInitialData, setModalInitialData] = useState(null);
  const [printableSale, setPrintableSale] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLangChange = (newLang) => {
    setLang(newLang);
    localStorage.setItem('coopOS_lang', newLang);
  };

  // Auth Error Listener (401 from API)
  useEffect(() => {
    const handleAuthError = () => {
      setAuthed(false);
      showToast('Session expired. Please log in again.', 'error');
    };
    window.addEventListener('coop_auth_error', handleAuthError);
    return () => window.removeEventListener('coop_auth_error', handleAuthError);
  }, []);

  // Main Data Fetcher
  const loadAllData = useCallback(async () => {
    if (!isAuthenticated()) return;
    setLoading(true);
    try {
      const [
        fetchedBatches,
        fetchedCustomers,
        fetchedSales,
        fetchedExpenses,
        fetchedInfra,
        fetchedMortality
      ] = await Promise.all([
        fetchBatches().catch(() => []),
        fetchCustomers().catch(() => []),
        fetchSales().catch(() => []),
        fetchExpenses().catch(() => []),
        fetchInfraExpenses().catch(() => []),
        fetchMortalityLogs().catch(() => [])
      ]);

      setBatches(fetchedBatches);
      setCustomers(fetchedCustomers);
      setSales(fetchedSales);
      setExpenses(fetchedExpenses);
      setInfraExpenses(fetchedInfra);
      setMortalityLogs(fetchedMortality);

      // Concurrently fetch deep metrics for each batch
      const metricsMap = {};
      await Promise.all(
        fetchedBatches.map(async (b) => {
          try {
            const data = await fetchBatchFullMetrics(b.batch_no);
            metricsMap[b.batch_no] = data;
          } catch {
            metricsMap[b.batch_no] = {
              pnl: { revenue: 0, expense: 0, profit_or_loss: 0, status: 'N/A' },
              mortality: { mortality_rate: 0, no_of_deaths: 0, total_sold: 0, Remaining_chicks: b.no_of_chicks },
              weekly: { weekly_sales: [] }
            };
          }
        })
      );
      setBatchMetrics(metricsMap);
      return {
        batches: fetchedBatches,
        customers: fetchedCustomers,
        sales: fetchedSales,
        expenses: fetchedExpenses,
        infraExpenses: fetchedInfra,
        mortalityLogs: fetchedMortality
      };
    } catch (err) {
      console.error('Error fetching farm data:', err);
      showToast('Failed to load farm data from backend', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) {
      loadAllData();
    }
  }, [authed, loadAllData]);

  // Aggregate Executive Metrics
  const summaryMetrics = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
    const totalBatchExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const totalInfraExpenses = infraExpenses.reduce((sum, ie) => sum + (Number(ie.amount) || 0), 0);
    const totalChickBuyingCost = batches.reduce((sum, b) => sum + (Number(b.buying_price) || 0), 0);
    const totalExpenses = totalChickBuyingCost + totalBatchExpenses + totalInfraExpenses;
    const netProfit = totalRevenue - totalExpenses;

    const totalChicksBought = batches.reduce((sum, b) => sum + (Number(b.no_of_chicks) || 0), 0);
    const totalDeaths = mortalityLogs.reduce((sum, m) => sum + (Number(m.no_of_deaths) || 0), 0);
    const totalSoldBirds = sales.reduce(
      (sum, s) => sum + (Number(s.no_of_hens) || 0) + (Number(s.no_of_roosters) || 0),
      0
    );
    const totalRemainingChicks = Math.max(0, totalChicksBought - totalDeaths - totalSoldBirds);
    const mortalityPercent =
      totalChicksBought > 0 ? (totalDeaths / totalChicksBought) * 100 : 0;

    return {
      totalRevenue,
      totalBatchExpenses,
      totalInfraExpenses,
      totalExpenses,
      netProfit,
      totalChicksBought,
      totalDeaths,
      totalSoldBirds,
      totalRemainingChicks,
      mortalityPercent,
      batchesCount: batches.length,
      customersCount: customers.length,
      salesCount: sales.length
    };
  }, [batches, sales, expenses, infraExpenses, mortalityLogs]);

  // Modal Handlers
  const openModal = (type, data = null) => {
    setModalInitialData(data);
    setActiveModal(type);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalInitialData(null);
  };

  const handlePrintInvoice = (sale) => {
    setPrintableSale(sale);
    setActiveModal('invoice');
  };

  // CRUD Actions (Create & Edit)
  const handleSaveBatch = async (payload) => {
    if (payload.isEditing) {
      await updateBatch(payload.batch_no, {
        date: payload.date,
        no_of_chicks: payload.no_of_chicks,
        buying_price: payload.buying_price
      });
      showToast(`Batch #${payload.batch_no} details updated.`);
    } else {
      await createBatch(payload);
      showToast(`Batch #${payload.batch_no} created successfully!`);
    }
    loadAllData();
  };

  const handleDeleteBatch = async (batchNo) => {
    await deleteBatch(batchNo);
    showToast(`Batch #${batchNo} deleted.`);
    loadAllData();
  };

  const handleSaveSale = async (payload) => {
    if (payload.id) {
      await updateSale(payload.id, {
        batch: payload.batch,
        customer: payload.customer,
        date: payload.date,
        sale_type: payload.sale_type,
        payment_method: payload.payment_method || 'cash',
        no_of_hens: payload.no_of_hens,
        no_of_roosters: payload.no_of_roosters,
        kg: payload.kg,
        price_per_kg: payload.price_per_kg,
        price_per_bird: payload.price_per_bird,
        amount: payload.amount
      });
      showToast(`Sale #INV-${payload.id} updated successfully!`);
      loadAllData();
    } else {
      const newSale = await createSale(payload);
      showToast(`Sale recorded successfully! +₹${payload.amount}`);
      const refreshedData = await loadAllData();
      if (newSale && newSale.id) {
        const fullSale =
          refreshedData?.sales?.find((s) => s.id === newSale.id) || newSale;
        handlePrintInvoice(fullSale);
      }
    }
  };

  const handleDeleteSale = async (saleId) => {
    await deleteSale(saleId);
    showToast('Sale entry removed.');
    loadAllData();
  };

  const handleSaveExpense = async (payload) => {
    if (payload.isInfra) {
      if (payload.id) {
        await updateInfraExpense(payload.id, {
          date: payload.date,
          expense_type: payload.expense_type,
          amount: payload.amount
        });
        showToast(`Infra expense updated: ${payload.expense_type}`);
      } else {
        await createInfraExpense({
          date: payload.date,
          expense_type: payload.expense_type,
          amount: payload.amount
        });
        showToast(`Infra expense logged: ${payload.expense_type}`);
      }
    } else {
      if (payload.id) {
        await updateExpense(payload.id, {
          batch: payload.batch,
          date: payload.date,
          expense_type: payload.expense_type,
          amount: payload.amount
        });
        showToast(`Batch #${payload.batch} expense updated: ${payload.expense_type}`);
      } else {
        await createExpense({
          batch: payload.batch,
          date: payload.date,
          expense_type: payload.expense_type,
          amount: payload.amount
        });
        showToast(`Batch #${payload.batch} expense saved: ${payload.expense_type}`);
      }
    }
    loadAllData();
  };

  const handleDeleteExpense = async (expenseId) => {
    await deleteExpense(expenseId);
    showToast('Expense entry deleted.');
    loadAllData();
  };

  const handleDeleteInfraExpense = async (infraId) => {
    await deleteInfraExpense(infraId);
    showToast('Infrastructure expense deleted.');
    loadAllData();
  };

  const handleSaveCustomer = async (payload) => {
    if (payload.customer_id) {
      await updateCustomer(payload.customer_id, {
        customer_name: payload.customer_name,
        contact_number: payload.contact_number,
        email: payload.email,
        address: payload.address,
        category: payload.category || 'individual',
        sub_category: payload.sub_category || ''
      });
      showToast(`Buyer account "${payload.customer_name}" updated.`);
    } else {
      await createCustomer({
        ...payload,
        category: payload.category || 'individual',
        sub_category: payload.sub_category || ''
      });
      showToast(`Buyer account "${payload.customer_name}" added!`);
    }
    loadAllData();
  };

  const handleDeleteCustomer = async (customerId) => {
    await deleteCustomer(customerId);
    showToast('Customer account deleted.');
    loadAllData();
  };

  const handleSaveMortality = async (payload) => {
    if (payload.id) {
      await updateMortality(payload.id, {
        batch: payload.batch,
        date: payload.date,
        no_of_deaths: payload.no_of_deaths,
        reason_of_death: payload.reason_of_death
      });
      showToast(`Mortality incident updated (${payload.no_of_deaths} deaths)`);
    } else {
      await createMortality(payload);
      showToast(`Mortality incident logged (${payload.no_of_deaths} deaths)`);
    }
    loadAllData();
  };

  const handleDeleteMortality = async (mortalityId) => {
    await deleteMortality(mortalityId);
    showToast('Mortality entry removed.');
    loadAllData();
  };

  const handleLogout = async () => {
    await logout();
    setAuthed(false);
    showToast('Logged out of CoopOS.');
  };

  if (!authed) {
    return (
      <LoginView
        onLoginSuccess={() => setAuthed(true)}
        lang={lang}
        setLang={handleLangChange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-400">
      {/* Universal Top Bar (Replaces Sidebar) */}
      <TopNavbar
        currentView={currentView}
        setCurrentView={handleNavigateView}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedBatchFilter={selectedBatchFilter}
        setSelectedBatchFilter={setSelectedBatchFilter}
        batches={batches}
        batchMetrics={batchMetrics}
        sales={sales}
        expenses={expenses}
        mortalityLogs={mortalityLogs}
        customers={customers}
        onRefresh={loadAllData}
        loading={loading}
        openModal={openModal}
        lang={lang}
        setLang={handleLangChange}
        onLogout={handleLogout}
      />

      {/* Main Full-Width Workstation Canvas */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          {currentView === 'dashboard' && (
            <DashboardView
              batches={batches}
              batchMetrics={batchMetrics}
              sales={sales}
              expenses={expenses}
              infraExpenses={infraExpenses}
              mortalityLogs={mortalityLogs}
              summaryMetrics={summaryMetrics}
              onSelectBatch={(bNo) => {
                setSelectedBatchNo(bNo);
                setCurrentView('batches');
              }}
              onNavigateToView={setCurrentView}
              showToast={showToast}
              openModal={openModal}
              lang={lang}
            />
          )}

          {currentView === 'vaccinations' && (
            <VaccinationBoard
              batches={batches}
              selectedBatchNo={selectedBatchNo}
              setSelectedBatchNo={setSelectedBatchNo}
              showToast={showToast}
              lang={lang}
            />
          )}

          {currentView === 'batches' && (
            <BatchesView
              batches={batches}
              batchMetrics={batchMetrics}
              sales={sales}
              expenses={expenses}
              mortalityLogs={mortalityLogs}
              selectedBatchNo={selectedBatchNo}
              setSelectedBatchNo={setSelectedBatchNo}
              onDeleteBatch={handleDeleteBatch}
              openModal={openModal}
              lang={lang}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'customers' && (
            <CustomersView
              customers={customers}
              sales={sales}
              onDeleteCustomer={handleDeleteCustomer}
              openModal={openModal}
              onPrintInvoice={handlePrintInvoice}
              lang={lang}
              searchQuery={searchQuery}
            />
          )}

          {currentView === 'sales' && (
            <SalesView
              sales={sales}
              batches={batches}
              customers={customers}
              expenses={expenses}
              infraExpenses={infraExpenses}
              mortalityLogs={mortalityLogs}
              onDeleteSale={handleDeleteSale}
              openModal={openModal}
              onPrintInvoice={handlePrintInvoice}
              selectedBatchFilter={selectedBatchFilter}
              setSelectedBatchFilter={setSelectedBatchFilter}
              searchQuery={searchQuery}
              onNavigateToView={setCurrentView}
              lang={lang}
            />
          )}

          {currentView === 'expenses' && (
            <ExpensesView
              expenses={expenses}
              infraExpenses={infraExpenses}
              batches={batches}
              sales={sales}
              mortalityLogs={mortalityLogs}
              onDeleteExpense={handleDeleteExpense}
              onDeleteInfraExpense={handleDeleteInfraExpense}
              openModal={openModal}
              selectedBatchFilter={selectedBatchFilter}
              setSelectedBatchFilter={setSelectedBatchFilter}
              searchQuery={searchQuery}
              onNavigateToView={setCurrentView}
              lang={lang}
            />
          )}

          {currentView === 'mortality' && (
            <MortalityView
              mortalityLogs={mortalityLogs}
              batches={batches}
              summaryMetrics={summaryMetrics}
              onDeleteMortality={handleDeleteMortality}
              openModal={openModal}
              selectedBatchFilter={selectedBatchFilter}
              setSelectedBatchFilter={setSelectedBatchFilter}
              searchQuery={searchQuery}
              lang={lang}
            />
          )}

          {currentView === 'reports' && (
            <ReportsView
              batches={batches}
              batchMetrics={batchMetrics}
              sales={sales}
              expenses={expenses}
              infraExpenses={infraExpenses}
              customers={customers}
              mortalityLogs={mortalityLogs}
              summaryMetrics={summaryMetrics}
              lang={lang}
            />
          )}

          {(currentView === 'reinvestment' || currentView === 'calculator') && (
            <ReinvestmentView
              batches={batches}
              sales={sales}
              expenses={expenses}
              mortalityLogs={mortalityLogs}
              selectedBatchFilter={selectedBatchFilter}
              setSelectedBatchFilter={setSelectedBatchFilter}
              openModal={openModal}
              lang={lang}
            />
          )}
        </main>

      {/* Interactive Business Entry Modals */}
      {activeModal === 'batch' && (
        <AddBatchModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleSaveBatch}
          batches={batches}
          initialData={modalInitialData}
        />
      )}

      {activeModal === 'sale' && (
        <CreateSaleModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleSaveSale}
          batches={batches}
          customers={customers}
          batchMetrics={batchMetrics}
          openQuickCustomerModal={() => openModal('customer')}
          initialData={modalInitialData}
        />
      )}

      {activeModal === 'expense' && (
        <RecordExpenseModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleSaveExpense}
          batches={batches}
          initialData={modalInitialData}
        />
      )}

      {activeModal === 'customer' && (
        <AddCustomerModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleSaveCustomer}
          customers={customers}
          initialData={modalInitialData}
        />
      )}

      {activeModal === 'mortality' && (
        <LogMortalityModal
          isOpen={true}
          onClose={closeModal}
          onSubmit={handleSaveMortality}
          batches={batches}
          initialData={modalInitialData}
        />
      )}

      {/* Invoice Generator Modal */}
      {activeModal === 'invoice' && printableSale && (
        <InvoiceModal
          sale={printableSale}
          customers={customers}
          onClose={closeModal}
        />
      )}

      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
