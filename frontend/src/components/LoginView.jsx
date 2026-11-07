import React, { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, Layers, Users, TrendingUp } from 'lucide-react';
import { login } from '../api';

export default function LoginView({ onLoginSuccess, lang, setLang }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(username, password);
      onLoginSuccess();
    } catch (err) {
      setError(
        lang === 'ta'
          ? 'தவறான பயனர் பெயர் அல்லது கடவுச்சொல். தயவுசெய்து சரிபார்க்கவும்.'
          : 'Invalid username or password. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('autologin') === '1') {
      handleSubmit({ preventDefault: () => {} });
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-2">
        {/* Left Branding Box */}
        <div className="p-8 bg-slate-900 text-white flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center text-lg font-bold">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base tracking-tight text-white">V V A பெருவிடை நாட்டுக்கோழி</span>
                <p className="text-[11px] text-emerald-400 font-medium">பண்ணை மேலாண்மை அமைப்பு • Farm ERP</p>
              </div>
            </div>

            <h2 className="text-xl font-bold text-white leading-snug mb-3">
              Commercial Poultry Flock Operations & Financial Ledger
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Track chick acquisition costs, daily feed and medicine expenses, mortality losses, live bird weighment, and per-batch net profit.
            </p>

            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800 text-xs text-slate-300">
                <Layers className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Batch-by-batch flock accounting & live bird stock</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800 text-xs text-slate-300">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Accurate sales weighment & invoice generation</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-800 text-xs text-slate-300">
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Commercial buyer directory and purchase history</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>CoopOS v2.0 Workstation</span>
            <span>Django & React</span>
          </div>
        </div>

        {/* Right Sign-in Form */}
        <div className="p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Sign In</h3>
                <p className="text-xs text-slate-500">Access farm management modules</p>
              </div>

              {/* Language toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded border border-slate-200">
                <button
                  type="button"
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    lang === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setLang('ta')}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    lang === 'ta' ? 'bg-slate-900 text-white' : 'text-slate-600'
                  }`}
                >
                  தமிழ்
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username (பயனர் பெயர்)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-600 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Password (கடவுச்சொல்)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-medium focus:outline-none focus:ring-1 focus:ring-slate-600 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg transition text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
              >
                <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
                {!loading && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </form>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500">Admin Login:</span>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
            >
              Fill Admin (admin / admin123)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
