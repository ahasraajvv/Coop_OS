import {
  LayoutDashboard,
  Layers,
  Users,
  ShoppingCart,
  Receipt,
  HeartPulse,
  Syringe,
  BarChart3,
  Calculator,
  LogOut,
  Globe,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { translations } from '../utils';

export default function Sidebar({
  currentView,
  setCurrentView,
  onLogout,
  lang,
  setLang,
  summaryMetrics,
  onRefresh,
  loading
}) {
  const t = translations[lang] || translations.en;

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'batches', label: t.batches, icon: Layers, badge: summaryMetrics.batchesCount },
    { id: 'vaccinations', label: t.vaccinations, icon: Syringe },
    { id: 'customers', label: t.customers, icon: Users, badge: summaryMetrics.customersCount },
    { id: 'sales', label: t.sales, icon: ShoppingCart, badge: summaryMetrics.salesCount },
    { id: 'expenses', label: t.expenses, icon: Receipt },
    { id: 'mortality', label: t.mortality, icon: HeartPulse },
    { id: 'reports', label: t.reports, icon: BarChart3 },
    { id: 'calculator', label: t.calculator || 'Batch Calculator', icon: Calculator },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 border-r border-slate-800 select-none no-print">
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-sm font-bold shadow-xs">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[11px] leading-snug text-white" title="V V A பெருவிடை நாட்டுக்கோழி">
              V V A பெருவிடை நாட்டுக்கோழி
            </div>
            <p className="text-[10px] text-emerald-400 font-medium mt-0.5">பண்ணை மேலாண்மை ERP</p>
          </div>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            title={t.refresh || "Refresh"}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        )}
      </div>

      {/* Main Navigation Menu */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-4">
        <div className="px-3 pb-2 text-[10px] font-bold tracking-wider uppercase text-slate-500">
          Management Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                isActive
                  ? 'bg-emerald-800 text-white font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? 'text-white' : 'text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold ${
                      isActive
                        ? 'bg-emerald-900 text-emerald-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    isActive ? 'text-white opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Footer Actions & User */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/70 space-y-2">
        {/* Language Switcher */}
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span>Language</span>
          </div>
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-700">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                lang === 'en' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('ta')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                lang === 'ta' ? 'bg-emerald-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 rounded bg-slate-700 text-slate-200 flex items-center justify-center text-xs font-bold font-mono">
              AD
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">Farm Manager</p>
              <p className="text-[10px] text-emerald-400 font-mono">admin</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            title={t.logout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
