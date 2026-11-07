import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('CoopOS React ErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Application Interface Notice</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                An unexpected view error was intercepted. All your commercial poultry data and database records remain completely intact and safe.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-3 bg-slate-950/70 rounded-xl text-left border border-slate-700/60 max-h-32 overflow-y-auto">
                  <p className="text-[11px] font-mono text-rose-300 break-words">
                    {this.state.error.message}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload CoopOS</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
