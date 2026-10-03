import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LogIn, Lock, User, AlertCircle, ShieldAlert, Sparkles, Building2 } from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, settings } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);
    const success = login(username.trim(), password);
    setIsLoading(false);

    if (!success) {
      setError('Invalid username or password. Please verify your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 flex items-center justify-center p-4 selection:bg-amber-500 selection:text-slate-950">
      {/* Background glowing decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 p-8 text-slate-900">
        {/* Header / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-2xl shadow-lg shadow-amber-500/30 mb-4 ring-4 ring-amber-500/20">
            A26
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {settings.businessName || 'A-TWENTY SIX TRADING'}
          </h1>
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mt-1">
            Construction Supply & Equipment ERP
          </p>
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            <span>Secure System Access Portal</span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 tracking-wider">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoFocus
                placeholder="Enter username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5 tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full pl-9 pr-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl focus:outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-slate-900 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:scale-98 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            <LogIn className="w-4 h-4" />
            <span>{isLoading ? 'Verifying...' : 'Sign In to ERP System'}</span>
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-200/80 text-center text-[11px] text-slate-500">
          <p>
            Protected System: Only registered accounts authorized by Administrator may access this ERP portal.
          </p>
        </div>
      </div>
    </div>
  );
};
