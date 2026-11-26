import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, Mail, User as UserIcon, Building, Phone, MapPin, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, token: string) => void;
  initialRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialRole = 'restaurant'
}) => {
  const [isRegister, setIsRegister] = useState(false);
  const [role, setRole] = useState<UserRole>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('demo123');
  const [name, setName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1-Click Demo Accounts
  const demoAccounts = [
    { role: 'restaurant' as UserRole, label: 'Restaurant', email: 'restaurant@demo.com', name: 'Green Leaf Bistro' },
    { role: 'ngo' as UserRole, label: 'NGO / Charity', email: 'ngo@demo.com', name: 'Hope Community Kitchen' },
    { role: 'volunteer' as UserRole, label: 'Volunteer', email: 'volunteer@demo.com', name: 'Alex Rivera (Driver)' },
    { role: 'admin' as UserRole, label: 'Platform Admin', email: 'admin@demo.com', name: 'FoodRescue Operations' },
  ];

  const handleQuickLogin = async (accEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login(accEmail, 'demo123');
      localStorage.setItem('fra_token', res.token);
      localStorage.setItem('fra_user', JSON.stringify(res.user));
      onSuccess(res.user, res.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api.register({
          name: name || organizationName || 'New User',
          email,
          password,
          role,
          organizationName: organizationName || name,
          phone,
          address
        });
        localStorage.setItem('fra_token', res.token);
        localStorage.setItem('fra_user', JSON.stringify(res.user));
        onSuccess(res.user, res.token);
        onClose();
      } else {
        const res = await api.login(email, password);
        localStorage.setItem('fra_token', res.token);
        localStorage.setItem('fra_user', JSON.stringify(res.user));
        onSuccess(res.user, res.token);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6"
      onClick={onClose}
    >
      <div className="min-h-full flex items-start sm:items-center justify-center py-4 sm:py-8">
        <motion.div
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, y: 15, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.96 }}
          className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-brand-emerald/40 shadow-2xl relative my-auto bg-[#07150f]/95"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-emerald/20 text-brand-mint text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-brand-limeSoft" />
            <span>Secure Access</span>
          </div>
          <h3 className="text-2xl font-bold text-white">
            {isRegister ? 'Create FoodRescue Account' : 'Sign In to FoodRescue'}
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            {isRegister ? 'Join the network to rescue surplus and nourish communities' : 'Access your role-specific dashboard and live operations'}
          </p>
        </div>

        {/* 1-Click Fast Demo Switcher Banner */}
        <div className="mb-6 p-3.5 rounded-2xl bg-slate-900/90 border border-brand-emerald/30">
          <div className="text-[11px] font-bold text-brand-limeSoft uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <span>⚡ 1-Click Instant Demo Login:</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickLogin(acc.email)}
                className="p-2 rounded-xl glass-panel text-left hover:bg-brand-emerald/20 border-slate-700/60 hover:border-brand-emerald/40 transition-all cursor-pointer group"
              >
                <div className="text-xs font-bold text-white group-hover:text-brand-mint">{acc.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{acc.name}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role Picker (if registering) */}
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Select Role *</label>
              <div className="grid grid-cols-3 gap-2">
                {(['restaurant', 'ngo', 'volunteer'] as UserRole[]).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold capitalize border transition-all cursor-pointer ${
                      role === r
                        ? 'bg-brand-emerald text-white border-brand-emerald shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Your Full Name *</label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Marcus Sterling"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-emerald"
                />
              </div>
            </div>
          )}

          {isRegister && role !== 'volunteer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Organization / Business Name</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="e.g. Green Leaf Bistro & Catering"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-emerald"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-emerald"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-brand-emerald"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white text-sm font-bold shadow-lg shadow-brand-emerald/25 flex items-center justify-center gap-2 cursor-pointer transition-all mt-4"
          >
            {loading ? (
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : (
              <>
                <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          {isRegister ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-brand-mint font-semibold hover:underline cursor-pointer"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-brand-mint font-semibold hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </span>
          )}
        </div>

      </motion.div>
      </div>
    </div>
  );
};
