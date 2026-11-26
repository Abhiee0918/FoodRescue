import React, { useState } from 'react';
import {
  Utensils,
  HeartHandshake,
  Bike,
  Shield,
  Bell,
  Sparkles,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Layers,
  MapPin,
  Flame
} from 'lucide-react';
import { User, UserRole, Notification } from '../types';

interface NavbarProps {
  currentUser: User | null;
  activeView: string;
  onNavigate: (view: string) => void;
  onOpenAuth: (role?: UserRole) => void;
  onOpenDonate: () => void;
  onOpenNotifications: () => void;
  onLogout: () => void;
  onSwitchRole: (role: UserRole) => void;
  notifications: Notification[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onNavigate,
  onOpenAuth,
  onOpenDonate,
  onOpenNotifications,
  onLogout,
  onSwitchRole,
  notifications
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const roles = [
    { role: 'restaurant' as UserRole, label: '👨‍🍳 Restaurant', desc: 'Green Leaf Bistro' },
    { role: 'ngo' as UserRole, label: '🏛️ NGO / Charity', desc: 'Hope Community Kitchen' },
    { role: 'volunteer' as UserRole, label: '🚴 Volunteer', desc: 'Alex Rivera' },
    { role: 'admin' as UserRole, label: '🛡️ Operations Admin', desc: 'FoodRescue Operations' }
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-brand-dark/85 backdrop-blur-xl border-b border-slate-800/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-emerald to-brand-lime flex items-center justify-center text-brand-dark shadow-lg shadow-brand-emerald/20">
              <Utensils className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg sm:text-xl font-extrabold text-white tracking-tight font-sans">
                  FoodRescue
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-brand-emerald/20 text-brand-limeSoft border border-brand-emerald/30 uppercase tracking-widest hidden sm:inline-block">
                  v1.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
                Surplus Rescue & Hunger Relief
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <button
              onClick={() => onNavigate('landing')}
              className={`hover:text-white transition-colors cursor-pointer ${activeView === 'landing' ? 'text-brand-mint font-bold' : ''}`}
            >
              Overview
            </button>
            <button
              onClick={() => onNavigate('heatmap')}
              className={`hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 ${activeView === 'heatmap' ? 'text-brand-mint font-bold' : ''}`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Surplus Heatmap</span>
            </button>
            <button
              onClick={() => onNavigate('impact')}
              className={`hover:text-white transition-colors cursor-pointer ${activeView === 'impact' ? 'text-brand-mint font-bold' : ''}`}
            >
              Impact Metrics
            </button>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            
            {/* Quick 1-Click Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                className="px-3 py-1.5 rounded-xl glass-panel text-slate-200 hover:text-white border-brand-emerald/30 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                title="Switch active role instantly"
              >
                <Layers className="w-3.5 h-3.5 text-brand-limeSoft" />
                <span className="hidden sm:inline">Role:</span>
                <span className="text-brand-mint capitalize font-bold">
                  {currentUser ? currentUser.role : 'Guest'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {roleDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl shadow-2xl border-brand-emerald/30 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5 border-b border-slate-800">
                    Switch Test Persona
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r.role}
                      onClick={() => {
                        onSwitchRole(r.role);
                        setRoleDropdownOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs flex flex-col transition-colors cursor-pointer ${
                        currentUser?.role === r.role
                          ? 'bg-brand-emerald/20 text-brand-mint font-bold'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <span>{r.label}</span>
                      <span className="text-[10px] text-slate-400">{r.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand-emerald text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Donate Food Button */}
            <button
              onClick={onOpenDonate}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-emerald to-emerald-600 hover:from-emerald-500 hover:to-brand-emerald text-white text-xs font-bold shadow-lg shadow-brand-emerald/20 transition-all cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Donate Food</span>
            </button>

            {/* Sign in / Dashboard Profile */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate(`dashboard-${currentUser.role}`)}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-emerald/20 border border-brand-emerald/40 text-brand-mint text-xs font-bold hover:bg-brand-emerald/30 transition-colors cursor-pointer"
                >
                  Dashboard
                </button>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth()}
                className="px-4 py-2 rounded-xl glass-panel text-white hover:bg-slate-800 text-xs font-bold cursor-pointer transition-colors"
              >
                Sign In
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-brand-dark/95 border-b border-slate-800 px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col gap-2 text-sm font-semibold text-slate-300">
            <button
              onClick={() => { onNavigate('landing'); setMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-800"
            >
              Overview
            </button>
            <button
              onClick={() => { onNavigate('heatmap'); setMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-800"
            >
              Surplus Heatmap
            </button>
            <button
              onClick={() => { onNavigate('impact'); setMobileMenuOpen(false); }}
              className="text-left py-2 px-3 rounded-lg hover:bg-slate-800"
            >
              Impact Metrics
            </button>
            {currentUser && (
              <button
                onClick={() => { onNavigate(`dashboard-${currentUser.role}`); setMobileMenuOpen(false); }}
                className="text-left py-2 px-3 rounded-lg bg-brand-emerald/20 text-brand-mint font-bold"
              >
                My {currentUser.role.toUpperCase()} Dashboard
              </button>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => { onOpenDonate(); setMobileMenuOpen(false); }}
              className="w-full py-3 rounded-xl bg-brand-emerald text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              <Utensils className="w-4 h-4" />
              <span>Donate Surplus Food</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
